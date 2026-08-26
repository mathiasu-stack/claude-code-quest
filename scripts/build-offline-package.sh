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

# Layout the player unzips: the two double-click launchers (plus the readme)
# sit alone at the top, and everything else is corralled in a subfolder, so
# the thing you're meant to click isn't buried among 280 game files.
#
#   Claude Code Quest (Windows).bat
#   Claude Code Quest (Mac).command
#   HOW TO PLAY OFFLINE.txt
#   claude-code-quest/  <- index.html, play/, save_server.py, ...
#
# There is deliberately no wrapper folder inside the zip: Explorer's "Extract
# All" and macOS Archive Utility both create one named after the archive, so
# adding our own would just nest it twice.
GAME_SUBDIR="claude-code-quest"

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

# git archive can't split one tree across two destinations, so it emits a tar
# and this repacks it into the layout above (also the only way to be sure the
# .command keeps its executable bit, which Finder needs to run it at all).
TAR_TMP="$OUT_DIR/.build-$$.tar"
trap 'rm -f "$TAR_TMP"' EXIT
git -C "$REPO_ROOT" archive --format=tar "$TREEISH" > "$TAR_TMP"

GAME_SUBDIR="$GAME_SUBDIR" python3 - "$TAR_TMP" "$OUT_DIR/$ZIP_NAME" <<'PY'
import os, sys, tarfile, time, zipfile

tar_path, zip_path = sys.argv[1], sys.argv[2]
game_subdir = os.environ['GAME_SUBDIR']

# Player-facing files that stay at the top level, next to nothing else.
TOP_LEVEL = {
    'Claude Code Quest (Windows).bat',
    'Claude Code Quest (Mac).command',
    'HOW TO PLAY OFFLINE.txt',
}

seen_top = set()
with tarfile.open(tar_path) as tf, zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for member in tf:
        if not member.isfile():
            continue
        if member.name in TOP_LEVEL:
            arcname = member.name
            seen_top.add(member.name)
        else:
            arcname = f'{game_subdir}/{member.name}'
        info = zipfile.ZipInfo(arcname, date_time=time.localtime(member.mtime)[:6])
        info.compress_type = zipfile.ZIP_DEFLATED
        # Carry the unix mode through, so the .command stays 0755.
        info.external_attr = (member.mode & 0o777) << 16
        zf.writestr(info, tf.extractfile(member).read())

missing = TOP_LEVEL - seen_top
if missing:
    sys.exit('ERROR: expected top-level file(s) not found in the archive: '
             + ', '.join(sorted(missing)))
PY

echo "Built $OUT_DIR/$ZIP_NAME ($(du -h "$OUT_DIR/$ZIP_NAME" | cut -f1))"
echo "Contains $(python3 -c "import zipfile,sys; print(len(zipfile.ZipFile(sys.argv[1]).namelist()))" "$OUT_DIR/$ZIP_NAME") files."
