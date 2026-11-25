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

Security model (2026-11-25, after docs/review-2026-11.md):
    • Static serving is an ALLOWLIST, checked on the decoded + normalized
      filesystem path (never on the raw request string — that's how the
      old prefix blocklist was bypassed). Only the game's own roots are
      served; dotfiles, raw/unoptimized assets and directory listings
      never are.
    • "Public" requests — anything arriving through Tailscale Funnel (or
      from a non-private address) — can never use /save, and /tts only
      plays cached lines plus a small daily synthesis budget.
    • The admin passcode is NOT in source. It comes from env
      CCQ_ADMIN_PASS or the gitignored admin_config.json
      ({"admin_passcode": "..."}). Unset → /save is disabled outright
      (that's the state of every offline-zip copy).
"""

import hashlib
import hmac
import http.server
import ipaddress
import json
import mimetypes
import os
import re
import sys
import threading
import time
import urllib.error
import urllib.request
from xml.sax.saxutils import escape as xml_escape

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(PROJECT_ROOT, 'data')


def _load_admin_pass():
    env = os.environ.get('CCQ_ADMIN_PASS', '').strip()
    if env:
        return env
    try:
        with open(os.path.join(PROJECT_ROOT, 'admin_config.json'), encoding='utf-8') as fh:
            return str(json.load(fh).get('admin_passcode', '')).strip()
    except (OSError, json.JSONDecodeError, ValueError, AttributeError):
        return ''


# ── Static allowlist ──────────────────────────────────────────────────────
# Top-level names that may be served. Everything else at the project root
# (server source, secrets, logs, notes, .git, docs/, scripts/, …) is 404.
SERVE_TOP_FILES = frozenset({'index.html', 'style.css', 'app.js', 'favicon.ico'})
SERVE_TOP_DIRS = frozenset({'engine', 'ui', 'data', 'play', 'downloads'})
# Path segments that are never served even inside an allowed root: raw
# Meshy uploads / Blender sources (hundreds of MB, gitignored) and NAS
# sidecar junk. Any segment starting with '.' or containing a space is
# also refused (the space-named GLBs are raw uploads, never shipped).
DENY_SEGMENTS = frozenset({'_originals', 'Blender', '@eaDir', '__pycache__',
                           'Hijabi_Professional_Arab_female.glb'})

# ── Public-traffic limits ─────────────────────────────────────────────────
PUBLIC_TTS_DAILY_CHARS = 20000   # ≈ $0.30/day at neural-voice rates
PUBLIC_ERRLOG_DAILY = 2000       # reports/day accepted from the internet
TTS_CACHE_MAX_BYTES = 500 * 1024 * 1024
_budget_lock = threading.Lock()
_budget = {'day': '', 'tts_chars': 0, 'errlog': 0}


def _spend(kind, amount, limit):
    """Atomically spend from today's public budget; False if it would exceed."""
    with _budget_lock:
        today = time.strftime('%Y-%m-%d')
        if _budget['day'] != today:
            _budget.update(day=today, tts_chars=0, errlog=0)
        if _budget[kind] + amount > limit:
            return False
        _budget[kind] += amount
        return True


def _dir_size(path):
    total = 0
    try:
        for entry in os.scandir(path):
            if entry.is_file(follow_symlinks=False):
                total += entry.stat().st_size
    except OSError:
        pass
    return total
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
        # Deliberately no Access-Control-Allow-Origin: the game and editor
        # are same-origin, and a wildcard let any website drive /save and
        # /tts from a visitor's browser. Kept as a hook for call sites.
        pass

    # Is this request from the internet (Funnel) rather than LAN/tailnet?
    # Funnel's proxy connects from loopback and adds forwarding headers, so
    # loopback alone is NOT proof of a local caller. Any one signal → public.
    def _is_public(self):
        h = self.headers
        if h.get('Tailscale-Funnel-Request') or h.get('X-Forwarded-For') \
                or h.get('Forwarded') or h.get('X-Forwarded-Host'):
            return True
        host = (h.get('Host') or '').split(':', 1)[0].lower().rstrip('.')
        if host.endswith('.ts.net'):
            return True
        try:
            ip = ipaddress.ip_address(self.client_address[0])
        except ValueError:
            return True
        if ip.version == 6 and ip.ipv4_mapped:
            ip = ip.ipv4_mapped
        tailnet = ipaddress.ip_network('100.64.0.0/10')
        return not (ip.is_loopback or ip.is_private or ip in tailnet)

    # Allowlist check on the path the parent class would actually open.
    def _servable(self):
        fs_path = os.path.realpath(self.translate_path(self.path))
        root = os.path.realpath(PROJECT_ROOT)
        if fs_path == root:
            return True                      # "/" → index.html
        rel = os.path.relpath(fs_path, root)
        if rel.startswith('..') or os.path.isabs(rel):
            return False
        parts = rel.split(os.sep)
        for seg in parts:
            if seg.startswith('.') or ' ' in seg or seg in DENY_SEGMENTS:
                return False
        if len(parts) == 1:
            return parts[0] in SERVE_TOP_FILES or parts[0] in SERVE_TOP_DIRS
        return parts[0] in SERVE_TOP_DIRS

    def list_directory(self, path):
        # Never emit directory listings (they exposed raw asset folders).
        self.send_error(404, 'Not Found')
        return None

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
        if not self._servable():
            return self.send_error(404, 'Not Found')
        return super().do_GET()

    def do_HEAD(self):
        if self.path == '/save' or self.path == '/save/':
            return self._send_json(405, {'ok': False, 'error': 'POST only'})
        if not self._servable():
            return self.send_error(404, 'Not Found')
        return super().do_HEAD()

    def do_POST(self):
        if self.path in ('/errlog', '/errlog/'):
            return self._handle_errlog()
        if self.path in ('/tts', '/tts/'):
            return self._handle_tts()
        if self.path not in ('/save', '/save/'):
            return self._send_json(404, {'ok': False, 'error': 'unknown path'})
        # The editor is tailnet/LAN-only. From the internet /save does not
        # exist — not even a passcode prompt to brute-force.
        if self._is_public():
            return self._send_json(404, {'ok': False, 'error': 'unknown path'})
        admin_pass = _load_admin_pass()
        if not admin_pass:
            return self._send_json(503, {'ok': False, 'error': 'save disabled (no admin passcode configured)'})
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
        if not isinstance(supplied, str) or not hmac.compare_digest(supplied, admin_pass):
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
        # No client IP stored: the audience is the public internet now.
        if self._is_public() and not _spend('errlog', 1, PUBLIC_ERRLOG_DAILY):
            return self._send_json(200, {'ok': True, 'note': 'daily cap'})
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

        # Cache miss. From the internet, synthesis spends a small shared daily
        # budget (cached lines are always free); 503 makes the browser fall
        # back to on-device voices for the rest of the session.
        if self._is_public() and not _spend('tts_chars', len(text), PUBLIC_TTS_DAILY_CHARS):
            return self._send_json(503, {'ok': False, 'error': 'tts budget exhausted'})

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
            if _dir_size(TTS_CACHE_DIR) > TTS_CACHE_MAX_BYTES:
                return self._send_audio(audio)   # serve, but stop growing the cache
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
