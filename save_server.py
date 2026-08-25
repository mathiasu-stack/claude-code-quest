#!/usr/bin/env python3
"""save_server.py — single-process HTTP server for the project.

Replaces Web Station for this folder. Serves the static game files
(GET *) AND accepts the in-game editor's "💾 Save Permanently" POSTs
at /save. Same origin → no CORS preflight, simpler editor wiring.

Protocol:
    POST /save
    Content-Type: application/json
    { "passcode": "<admin>", "files": [ { "name": "<allow-listed>", "content": "..." } ] }

Hard restrictions on the save endpoint:
    • POST /save only,
    • filename must be in ALLOWED,
    • writes only into ./data/,
    • passcode must match constant-time,
    • 1 MB cap per file content.

Static-serving:
    • Document root = project root (where this script lives).
    • MIME types extended for .glb (model/gltf-binary), .webp, .gltf.

Run:
    nohup python3 /volume1/projects/claude-code-quest/save_server.py \
      > /tmp/save_server.log 2>&1 < /dev/null &

Optional argv:
    save_server.py [port] [host]       # default 8888, 0.0.0.0

`host` exists for the offline download launchers, which pass 127.0.0.1 so a
player's copy is reachable only from their own machine (and, on Windows,
doesn't trip the Defender Firewall prompt that binding 0.0.0.0 raises).

Persist across reboots: add a DSM Task Scheduler task (boot-up trigger)
running the same command. See setup instructions in the deploy chat.
"""

import hashlib
import hmac
import http.server
import json
import mimetypes
import os
import re
import sys
import urllib.error
import urllib.request
from xml.sax.saxutils import escape as xml_escape

PASS = 'Kapprim'  # keep in sync with sessionStorage.ccq_admin_pass set by app.js
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(PROJECT_ROOT, 'data')
ALLOWED = frozenset({
    'rooms.js',
    'npc_overrides.js',
    'lesson_delivery_overrides.js',
    'compound_overrides.js',
})
MAX_BYTES = 1024 * 1024  # 1 MB per file
MAX_REQUEST = 16 * 1024 * 1024  # 16 MB total payload ceiling

# ── Neural TTS (Azure Speech) ─────────────────────────────────────────────
# The /tts endpoint proxies the browser to Azure's neural voices so character
# dialogue sounds human (Alexa/ChatGPT-level) instead of the robotic on-device
# Web Speech voices. Every unique (voice, text) line is synthesized once and
# cached to disk, so repeat playback is free and Azure is billed per line once.
#
# The Azure key NEVER lives in git. The server reads it from, in order:
#   1. env vars AZURE_SPEECH_KEY + AZURE_SPEECH_REGION
#   2. a gitignored tts_config.json next to this script:
#        { "azure_speech_key": "...", "azure_speech_region": "eastus" }
# If neither is present, /tts returns 503 and the browser silently falls back
# to its built-in Web Speech voices — so the game still works with no key.
TTS_CACHE_DIR = os.path.join(PROJECT_ROOT, 'tts-cache')
TTS_MAX_TEXT = 800          # chars per line; long lines are rejected
TTS_TIMEOUT = 15            # seconds for the Azure round-trip
# Azure neural voice names look like en-US-GuyNeural / en-IN-PrabhatNeural.
_TTS_VOICE_RE = re.compile(r'^[a-z]{2}-[A-Z]{2}-[A-Za-z0-9]+Neural$')


def _load_tts_config():
    key = os.environ.get('AZURE_SPEECH_KEY', '').strip()
    region = os.environ.get('AZURE_SPEECH_REGION', '').strip()
    if key and region:
        return key, region
    try:
        with open(os.path.join(PROJECT_ROOT, 'tts_config.json'), encoding='utf-8') as fh:
            cfg = json.load(fh)
        return (str(cfg.get('azure_speech_key', '')).strip(),
                str(cfg.get('azure_speech_region', '')).strip())
    except (OSError, json.JSONDecodeError, ValueError):
        return '', ''

# Python's mimetypes table predates the gaming/3D extensions we use.
mimetypes.add_type('model/gltf-binary', '.glb')
mimetypes.add_type('model/gltf+json',   '.gltf')
mimetypes.add_type('image/webp',        '.webp')
mimetypes.add_type('application/javascript', '.js')  # belt + suspenders


class Handler(http.server.SimpleHTTPRequestHandler):
    # SimpleHTTPRequestHandler serves files from `directory` for GET/HEAD,
    # which gives us the static-game-serving for free. We override
    # do_POST for the save endpoint and add CORS in case the editor is
    # ever served from a different origin.
    def _send_cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Max-Age', '600')

    def _send_json(self, status, obj):
        body = json.dumps(obj).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self._send_cors()
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors()
        self.end_headers()

    # Files in the project root we do NOT want anyone to GET. The
    # passcode in save_server.py / save.php isn't a hard secret (the
    # user types it into localStorage) but there's no reason to hand
    # it out either. .git carries history that probably shouldn't be
    # served from a LAN box.
    _BLOCKED_PREFIXES = ('/save_server.py', '/save.php', '/.git/', '/.git',
                         '/RESUME.md', '/scripts/', '/CLAUDE.md', '/logs/', '/logs',
                         '/tts-cache', '/tts_config.json')

    # Cache policy (replaces the manual ?v= cache-bust discipline):
    # code + data always revalidate (304 when unchanged — SimpleHTTP
    # honors If-Modified-Since); heavy immutable-ish assets cache a day.
    _NO_CACHE_EXT = ('.html', '.js', '.css', '.json')
    _DAY_CACHE_EXT = ('.glb', '.gltf', '.png', '.jpg', '.webp', '.mp3', '.ogg', '.svg')

    def end_headers(self):
        p = self.path.split('?', 1)[0].lower()
        if p.endswith(self._NO_CACHE_EXT) or p == '/' or p.endswith('/'):
            self.send_header('Cache-Control', 'no-cache')
        elif p.endswith(self._DAY_CACHE_EXT):
            self.send_header('Cache-Control', 'public, max-age=86400')
        super().end_headers()

    def do_GET(self):
        if self.path == '/save' or self.path == '/save/':
            return self._send_json(405, {'ok': False, 'error': 'POST only'})
        for blocked in self._BLOCKED_PREFIXES:
            if self.path == blocked or self.path.startswith(blocked + '/') or self.path.startswith(blocked):
                return self._send_json(403, {'ok': False, 'error': 'forbidden'})
        return super().do_GET()

    def do_HEAD(self):
        if self.path == '/save' or self.path == '/save/':
            return self._send_json(405, {'ok': False, 'error': 'POST only'})
        return super().do_HEAD()

    def do_POST(self):
        if self.path in ('/errlog', '/errlog/'):
            return self._handle_errlog()
        if self.path in ('/tts', '/tts/'):
            return self._handle_tts()
        if self.path not in ('/save', '/save/'):
            return self._send_json(404, {'ok': False, 'error': 'unknown path'})
        try:
            n = int(self.headers.get('Content-Length', '0') or '0')
        except ValueError:
            return self._send_json(400, {'ok': False, 'error': 'bad Content-Length'})
        if n <= 0 or n > MAX_REQUEST:
            return self._send_json(400, {'ok': False, 'error': 'invalid body size'})
        raw = self.rfile.read(n)
        try:
            payload = json.loads(raw.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return self._send_json(400, {'ok': False, 'error': 'invalid JSON'})
        if not isinstance(payload, dict):
            return self._send_json(400, {'ok': False, 'error': 'body must be JSON object'})

        # Constant-time passcode check.
        supplied = payload.get('passcode', '')
        if not isinstance(supplied, str) or not hmac.compare_digest(supplied, PASS):
            return self._send_json(403, {'ok': False, 'error': 'invalid passcode'})

        files = payload.get('files')
        if not isinstance(files, list) or not files:
            return self._send_json(400, {'ok': False, 'error': 'files array required'})

        # Pre-validate every file BEFORE writing any, so a bad payload
        # doesn't leave the data/ folder half-updated.
        for f in files:
            if not isinstance(f, dict):
                return self._send_json(400, {'ok': False, 'error': 'file entry must be object'})
            name = f.get('name')
            content = f.get('content')
            if not isinstance(name, str) or not isinstance(content, str):
                return self._send_json(400, {'ok': False, 'error': 'name and content must be strings'})
            if name not in ALLOWED:
                return self._send_json(403, {'ok': False, 'error': f'not allowed: {name}'})
            if len(content.encode('utf-8')) > MAX_BYTES:
                return self._send_json(413, {'ok': False, 'error': f'too large: {name}'})

        written = []
        for f in files:
            # basename() defense in addition to the ALLOWED check.
            target = os.path.join(DATA_DIR, os.path.basename(f['name']))
            try:
                with open(target, 'w', encoding='utf-8') as fh:
                    fh.write(f['content'])
            except OSError as e:
                return self._send_json(500, {'ok': False, 'error': f'write failed: {e}'})
            written.append(f'data/{f["name"]}')

        return self._send_json(200, {'ok': True, 'written': written})

    # Client error telemetry — unauthenticated by design (any player's
    # browser reports), so it is strictly bounded: 8 KB per report,
    # 5 MB file cap, appends one JSON line to logs/errlog.jsonl (the
    # /logs/ path is GET-blocked above and gitignored).
    _ERRLOG_PATH = os.path.join(PROJECT_ROOT, 'logs', 'errlog.jsonl')
    _ERRLOG_MAX_REPORT = 8 * 1024
    _ERRLOG_MAX_FILE = 5 * 1024 * 1024

    def _handle_errlog(self):
        try:
            n = int(self.headers.get('Content-Length', '0') or '0')
        except ValueError:
            return self._send_json(400, {'ok': False})
        if n <= 0 or n > self._ERRLOG_MAX_REPORT:
            return self._send_json(400, {'ok': False})
        raw = self.rfile.read(n)
        try:
            entry = json.loads(raw.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return self._send_json(400, {'ok': False})
        if not isinstance(entry, dict):
            return self._send_json(400, {'ok': False})
        import time
        entry['_ts'] = time.strftime('%Y-%m-%dT%H:%M:%S')
        entry['_ip'] = self.address_string()
        try:
            os.makedirs(os.path.dirname(self._ERRLOG_PATH), exist_ok=True)
            if (os.path.exists(self._ERRLOG_PATH)
                    and os.path.getsize(self._ERRLOG_PATH) > self._ERRLOG_MAX_FILE):
                return self._send_json(200, {'ok': True, 'note': 'log full'})
            with open(self._ERRLOG_PATH, 'a', encoding='utf-8') as fh:
                fh.write(json.dumps(entry, ensure_ascii=False)[:self._ERRLOG_MAX_REPORT] + '\n')
        except OSError:
            pass
        return self._send_json(200, {'ok': True})

    # ── Neural TTS proxy ────────────────────────────────────────────────
    def _send_audio(self, data):
        self.send_response(200)
        self.send_header('Content-Type', 'audio/mpeg')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self._send_cors()
        self.end_headers()
        self.wfile.write(data)

    def _handle_tts(self):
        try:
            n = int(self.headers.get('Content-Length', '0') or '0')
        except ValueError:
            return self._send_json(400, {'ok': False, 'error': 'bad Content-Length'})
        if n <= 0 or n > 16 * 1024:
            return self._send_json(400, {'ok': False, 'error': 'invalid body size'})
        raw = self.rfile.read(n)
        try:
            req = json.loads(raw.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return self._send_json(400, {'ok': False, 'error': 'invalid JSON'})
        if not isinstance(req, dict):
            return self._send_json(400, {'ok': False, 'error': 'body must be object'})

        text = req.get('text', '')
        voice = req.get('voice', '')
        if not isinstance(text, str) or not isinstance(voice, str):
            return self._send_json(400, {'ok': False, 'error': 'text and voice must be strings'})
        text = text.strip()
        if not text:
            return self._send_json(400, {'ok': False, 'error': 'empty text'})
        if len(text) > TTS_MAX_TEXT:
            text = text[:TTS_MAX_TEXT]
        # Voice name is interpolated into SSML, so it must match the strict
        # Azure pattern — never trust the client with a free-form value.
        if not _TTS_VOICE_RE.match(voice):
            return self._send_json(400, {'ok': False, 'error': 'bad voice name'})

        key, region = _load_tts_config()
        if not key or not region:
            # No credentials → tell the client to use its built-in voices.
            return self._send_json(503, {'ok': False, 'error': 'tts not configured'})

        # Disk cache: one synthesis per unique (voice, text).
        digest = hashlib.sha256((voice + '\n' + text).encode('utf-8')).hexdigest()
        cache_path = os.path.join(TTS_CACHE_DIR, digest + '.mp3')
        try:
            if os.path.exists(cache_path) and os.path.getsize(cache_path) > 0:
                with open(cache_path, 'rb') as fh:
                    return self._send_audio(fh.read())
        except OSError:
            pass

        lang = '-'.join(voice.split('-')[:2])  # en-US-GuyNeural → en-US
        ssml = (
            f'<speak version="1.0" xml:lang="{lang}">'
            f'<voice name="{voice}">{xml_escape(text)}</voice></speak>'
        ).encode('utf-8')
        url = f'https://{region}.tts.speech.microsoft.com/cognitiveservices/v1'
        headers = {
            'Ocp-Apim-Subscription-Key': key,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
            'User-Agent': 'ccq-tts',
        }
        try:
            azreq = urllib.request.Request(url, data=ssml, headers=headers, method='POST')
            with urllib.request.urlopen(azreq, timeout=TTS_TIMEOUT) as resp:
                audio = resp.read()
        except urllib.error.HTTPError as e:
            return self._send_json(502, {'ok': False, 'error': f'azure {e.code}'})
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            return self._send_json(502, {'ok': False, 'error': f'azure unreachable: {e}'})

        if not audio:
            return self._send_json(502, {'ok': False, 'error': 'empty audio'})
        try:
            os.makedirs(TTS_CACHE_DIR, exist_ok=True)
            with open(cache_path, 'wb') as fh:
                fh.write(audio)
        except OSError:
            pass  # serving still works even if caching fails
        return self._send_audio(audio)

    def log_message(self, fmt, *args):
        # Route through stdout so the nohup log captures it.
        sys.stdout.write(f'[save_server] {self.address_string()} {fmt % args}\n')
        sys.stdout.flush()


def main():
    if not os.path.isdir(DATA_DIR):
        print(f'[save_server] error: data dir missing at {DATA_DIR}', flush=True)
        sys.exit(1)
    port = 8888
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f'[save_server] bad port arg: {sys.argv[1]!r}, using {port}', flush=True)
    host = sys.argv[2] if len(sys.argv) > 2 else '0.0.0.0'
    # `directory` is honored by SimpleHTTPRequestHandler for GET/HEAD.
    handler_factory = lambda *a, **kw: Handler(*a, directory=PROJECT_ROOT, **kw)
    print(f'[save_server] listening on {host}:{port} | static root: {PROJECT_ROOT} | writes: {DATA_DIR}', flush=True)
    try:
        server = http.server.ThreadingHTTPServer((host, port), handler_factory)
    except OSError as exc:
        print(f'[save_server] could not start on {host}:{port} -> {exc}', flush=True)
        sys.exit(1)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
