#!/usr/bin/env bash
# Optimize Meshy-generated decoration GLBs for the Three.js web game.
#
# Same idempotent pattern as scripts/optimize-characters.sh: reads from
# play/assets/decorations/_originals/, writes optimized GLBs in place.
# Single simplify ratio because the decorations are all in a similar
# polycount band (preview+refine output ~10–40K tris) — no need for
# the heavy/light split that characters use.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$REPO_ROOT/play/assets/decorations"
ORIG_DIR="$DIR/_originals"

SIMPLIFY_RATIO=0.5
TEX_SIZE=1024

GTX="${GLTF_TRANSFORM:-gltf-transform}"
if ! command -v "$GTX" >/dev/null 2>&1; then
  echo "error: '$GTX' not on PATH. Install with: npm install -g @gltf-transform/cli@4 sharp" >&2
  exit 1
fi

mkdir -p "$ORIG_DIR"

printf "\n%-30s  %10s  %10s  %8s\n" "FILE" "BEFORE" "AFTER" "RATIO"
printf -- "----------------------------------------------------------------\n"

shopt -s nullglob
for src in "$DIR"/*.glb; do
  base="$(basename "$src")"
  orig="$ORIG_DIR/$base"
  if [[ ! -f "$orig" ]]; then
    cp -p "$src" "$orig"
  fi

  tmp="$(mktemp --suffix=.glb)"
  trap 'rm -f "$tmp"' EXIT
  if ! "$GTX" optimize "$orig" "$tmp" \
        --compress meshopt \
        --simplify true \
        --simplify-ratio "$SIMPLIFY_RATIO" \
        --simplify-error 0.001 \
        --texture-compress webp \
        --texture-size "$TEX_SIZE" \
        >/tmp/gltf-transform-last.log 2>&1; then
    echo "error: gltf-transform failed on $base. See /tmp/gltf-transform-last.log" >&2
    tail -20 /tmp/gltf-transform-last.log >&2
    rm -f "$tmp"
    exit 1
  fi

  mv -f "$tmp" "$src"
  trap - EXIT

  before=$(stat -c%s "$orig")
  after=$(stat -c%s "$src")
  pct=$(python3 -c "print(f'{100*$after/$before:.1f}%')")
  printf "%-30s  %10s  %10s  %8s\n" \
    "$base" \
    "$(numfmt --to=iec --suffix=B "$before")" \
    "$(numfmt --to=iec --suffix=B "$after")" \
    "$pct"
done
shopt -u nullglob

printf -- "----------------------------------------------------------------\n"
echo "Done. Originals preserved at $ORIG_DIR/"
