#!/usr/bin/env bash
# Optimize Meshy-generated character GLBs for the Three.js web game.
#
# Reads from play/assets/characters/_originals/ (the canonical, untouched
# source) and writes optimized GLBs in place at play/assets/characters/.
# On first run for a given file, the live file is copied into _originals/.
#
# Idempotent: re-runs always read from _originals/, never from the
# possibly-already-compressed live file.
#
# Pipeline per file:
#   gltf-transform optimize  →  --compress meshopt
#                                --simplify true --simplify-ratio R --simplify-error 0.001
#                                --texture-compress webp --texture-size 1024
#
# Files under MIN_SIZE_MB (the anim-only *_walk.glb / *_run.glb files) are
# skipped — they hold a single AnimationClip and no mesh/texture to compress.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHAR_DIR="$REPO_ROOT/play/assets/characters"
ORIG_DIR="$CHAR_DIR/_originals"

MIN_SIZE_MB=1                   # below this → anim-only, skipped
HEAVY_THRESHOLD_MB=15           # at/above → use SIMPLIFY_RATIO_HEAVY
SIMPLIFY_RATIO_HEAVY=0.4        # for 19–52 MB Meshy bases (~400K tris)
SIMPLIFY_RATIO_LIGHT=0.7        # for sub-15 MB files (~30K tris)
TEX_SIZE=1024

GTX="${GLTF_TRANSFORM:-gltf-transform}"
if ! command -v "$GTX" >/dev/null 2>&1; then
  echo "error: '$GTX' not on PATH. Install with: npm install -g @gltf-transform/cli@4 sharp" >&2
  exit 1
fi

mkdir -p "$ORIG_DIR"

printf "\n%-30s  %10s  %10s  %8s  %s\n" "FILE" "BEFORE" "AFTER" "RATIO" "SIMPLIFY"
printf -- "---------------------------------------------------------------------------\n"

shopt -s nullglob
for src in "$CHAR_DIR"/*.glb; do
  base="$(basename "$src")"
  size_bytes=$(stat -c%s "$src")
  if (( size_bytes < MIN_SIZE_MB * 1024 * 1024 )); then
    printf "%-30s  %s\n" "$base" "skip (anim-only, <${MIN_SIZE_MB}MB)"
    continue
  fi

  orig="$ORIG_DIR/$base"
  if [[ ! -f "$orig" ]]; then
    cp -p "$src" "$orig"
  fi

  orig_bytes=$(stat -c%s "$orig")
  if (( orig_bytes >= HEAVY_THRESHOLD_MB * 1024 * 1024 )); then
    ratio="$SIMPLIFY_RATIO_HEAVY"
  else
    ratio="$SIMPLIFY_RATIO_LIGHT"
  fi

  tmp="$(mktemp --suffix=.glb)"
  trap 'rm -f "$tmp"' EXIT
  if ! "$GTX" optimize "$orig" "$tmp" \
        --compress meshopt \
        --simplify true \
        --simplify-ratio "$ratio" \
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
  printf "%-30s  %10s  %10s  %8s  ratio=%s\n" \
    "$base" \
    "$(numfmt --to=iec --suffix=B "$before")" \
    "$(numfmt --to=iec --suffix=B "$after")" \
    "$pct" "$ratio"
done
shopt -u nullglob

printf -- "---------------------------------------------------------------------------\n"
echo "Done. Originals preserved at $ORIG_DIR/"
