#!/usr/bin/env python3
"""save_server.py — sidecar HTTP server for the in-game editor's
'💾 Save Permanently' button.

Stands in for save.php when Web Station's PHP-FPM isn't wired up
(Synology DSM script-language settings can be fiddly). Listens on
port 8889 and accepts the same JSON payload as save.php — the editor
POSTs to whichever endpoint answers first.

Protocol:
    POST /save
    Content-Type: application/json
    { "passcode": "<admin>", "files": [ { "name": "<allow-listed>", "content": "..." } ] }

Hard restrictions:
    • POST /save only,
    • filename must be in ALLOWED,
    • writes only into ./data/,
    • passcode must match constant-time,
    • 1 MB cap per file content.

CORS:
    The editor pages from port 8888; this serves on 8889. Cross-origin,
    so OPTIONS preflight + Access-Control-Allow-Origin: * are sent.
    Auth is the passcode, not the origin.

Run:
    nohup python3 /volume1/projects/claude-code-quest/save_server.py \
      > /tmp/save_server.log 2>&1 &

Persist across reboots: add a DSM Task Scheduler task (boot-up trigger)
running the same command. See setup instructions in the deploy chat.
"""

import hmac
import http.server
import json
import os
import sys

PORT = 8889
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


class Handler(http.server.BaseHTTPRequestHandler):
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

    def do_GET(self):
        # Probe convenience: a GET to /save tells the editor (or curl)
        # the service is alive without revealing config.
        if self.path in ('/save', '/save/', '/'):
            return self._send_json(405, {'ok': False, 'error': 'POST only'})
        return self._send_json(404, {'ok': False, 'error': 'unknown path'})

    def do_POST(self):
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

    def log_message(self, fmt, *args):
        # Route through stdout so the nohup log captures it.
        sys.stdout.write(f'[save_server] {self.address_string()} {fmt % args}\n')
        sys.stdout.flush()


def main():
    if not os.path.isdir(DATA_DIR):
        print(f'[save_server] error: data dir missing at {DATA_DIR}', flush=True)
        sys.exit(1)
    print(f'[save_server] listening on 0.0.0.0:{PORT}, writes -> {DATA_DIR}', flush=True)
    server = http.server.ThreadingHTTPServer(('0.0.0.0', PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
