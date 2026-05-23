#!/bin/bash
# Run the pose audit inside the Playwright Docker image. Output PNGs land in /tmp/audit on the host.
set -eu
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
OUT_DIR="/tmp/audit"
mkdir -p "$OUT_DIR"
rm -f "$OUT_DIR"/*.png 2>/dev/null || true

# --network=host so localhost:8888 in container = NAS's Web Station
# pip install playwright at runtime (this image bundles browsers at
# /ms-playwright but not the Python package itself). PLAYWRIGHT_BROWSERS_PATH
# points the package at the preinstalled browsers — skips a 200MB download.
sudo -n docker run --rm \
  --network=host \
  -e AUDIT_BASE_URL="${AUDIT_BASE_URL:-http://localhost:8888/test-poses.html}" \
  -e AUDIT_CHARS="${AUDIT_CHARS:-hero,ines}" \
  -e AUDIT_OUT="/out" \
  -e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
  -v "$SCRIPT_DIR/capture.py:/work/capture.py:ro" \
  -v "$OUT_DIR:/out" \
  mcr.microsoft.com/playwright/python:v1.55.0-noble \
  bash -c "pip install --quiet --no-input 'playwright==1.55.0' && python3 /work/capture.py"

echo
echo "Screenshots in $OUT_DIR:"
ls -la "$OUT_DIR"/*.png 2>/dev/null | head -40
