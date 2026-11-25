#!/usr/bin/env bash
# Headless-browser smoke test: loads the 2D views and the 3D view (floors 1
# and 4) against a running server, and fails if any page error or failed
# request appears beyond the known pre-existing console noise.
#
#   bash scripts/audit/browser-smoke.sh                 # against http://127.0.0.1:8888/
#   BASE=http://127.0.0.1:8899/ bash scripts/audit/browser-smoke.sh
#
# Needs docker (on the NAS: sudo docker) and the Playwright image
# mcr.microsoft.com/playwright/python:v1.55.0-noble. Screenshots and
# report.json land in $OUT (default: a temp dir, printed at the end).
set -euo pipefail
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
BASE="${BASE:-http://127.0.0.1:8888/}"
OUT="${OUT:-$(mktemp -d)}"; mkdir -p "$OUT"
DOCKER="docker"; docker ps >/dev/null 2>&1 || DOCKER="sudo -n docker"

$DOCKER run --rm --network host -e BASE="$BASE" \
  -v "$REPO/scripts/audit:/work:ro" -v "$OUT:/out" \
  mcr.microsoft.com/playwright/python:v1.55.0-noble \
  bash -c "pip install -q playwright==1.55.0 >/dev/null 2>&1; python /work/browser-smoke.py" >/dev/null

python3 - "$OUT/report.json" <<'PY'
import json, sys
r = json.load(open(sys.argv[1]))
known = ('Raycaster.camera', 'FACE MISSING')
errors = [e for e in r['errors'] if not any(k in e for k in known)]
steps_bad = [k for s in r['steps'] for k, v in s.items() if not v]
for e in errors: print('ERROR', e)
for f in r['failed']: print('FAILED', f)
for s in steps_bad: print('STEP FAILED', s)
ok = not (errors or r['failed'] or steps_bad)
print('BROWSER SMOKE:', 'clean' if ok else 'problems found', f"({sum(len(s) for s in r['steps'])} checks)")
sys.exit(0 if ok else 1)
PY
echo "screenshots: $OUT"
