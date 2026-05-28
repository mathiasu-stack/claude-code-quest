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
    save_server.py [port]              # default 8888

Persist across reboots: add a DSM Task Scheduler task (boot-up trigger)
running the same command. See setup instructions in the deploy chat.
"""

import hmac
import http.server
import json
import mimetypes
import os
import sys

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
                         '/RESUME.md', '/scripts/', '/CLAUDE.md')

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
    port = 8888
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f'[save_server] bad port arg: {sys.argv[1]!r}, using {port}', flush=True)
    # `directory` is honored by SimpleHTTPRequestHandler for GET/HEAD.
    handler_factory = lambda *a, **kw: Handler(*a, directory=PROJECT_ROOT, **kw)
    print(f'[save_server] listening on 0.0.0.0:{port} | static root: {PROJECT_ROOT} | writes: {DATA_DIR}', flush=True)
    server = http.server.ThreadingHTTPServer(('0.0.0.0', port), handler_factory)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
