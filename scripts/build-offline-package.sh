#!/usr/bin/env bash
# Build the player-facing offline download: a zip of the game plus the
# double-click launchers, assembled from git's tracked files (so the
# ~900 MB of local-only GLB originals under play/assets/*/_originals/
# and other gitignored dev cruft never end up in what a player unzips).
#
# .gitattributes marks internal docs/tooling (CLAUDE.md, RESUME.md,
# scripts/, design/, ...) export-ignore so `git archive` skips those too.
#
# Output is untracked (see .gitignore) — regenerate after any change to
# shipped game files and re-copy to downloads/ so the in-app "Download
# for offline" link serves the current build.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$REPO_ROOT/downloads"
ZIP_NAME="claude-code-quest-offline.zip"
ARCHIVE_PREFIX="claude-code-quest/"

mkdir -p "$OUT_DIR"
rm -f "$OUT_DIR/$ZIP_NAME"

# Snapshot staged + working-tree changes to already-tracked paths into a
# throwaway commit object — without touching HEAD, the index, or the
# stash list — so the archive reflects what's actually on disk even
# before anyone commits. Falls back to HEAD when the tree is clean
# (git stash create prints nothing in that case). New files still need
# `git add` first: only tracked/staged paths are snapshottable this way.
SNAPSHOT="$(git -C "$REPO_ROOT" stash create)"
TREEISH="${SNAPSHOT:-HEAD}"

# `git archive` can only see tracked content, so a brand-new game file that
# nobody `git add`-ed is silently absent from the download while everything
# still looks fine on the live site. That has bitten this build twice, so
# warn loudly rather than shipping a zip with a hole in it. Dev-only paths
# are excluded here the same way .gitattributes excludes them from the zip.
UNTRACKED="$(git -C "$REPO_ROOT" ls-files --others --exclude-standard \
  -- ':!:downloads/' ':!:scripts/' ':!:design/' ':!:logs/' ':!:tts-cache/' \
     ':!:*.md' ':!:tts_config.json' || true)"
if [ -n "$UNTRACKED" ]; then
  echo "WARNING: these files are NOT tracked by git, so they will be MISSING" >&2
  echo "         from the offline zip. \`git add\` them if players need them:" >&2
  printf '           %s\n' $UNTRACKED >&2
  echo "" >&2
fi

git -C "$REPO_ROOT" archive --format=zip --prefix="$ARCHIVE_PREFIX" -o "$OUT_DIR/$ZIP_NAME" "$TREEISH"

echo "Built $OUT_DIR/$ZIP_NAME ($(du -h "$OUT_DIR/$ZIP_NAME" | cut -f1))"
echo "Contains $(python3 -c "import zipfile,sys; print(len(zipfile.ZipFile(sys.argv[1]).namelist()))" "$OUT_DIR/$ZIP_NAME") files."
