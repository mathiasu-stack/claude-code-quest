#!/usr/bin/env bash
# Weekly Claude Code curriculum-freshness audit.
#
# Spawns a Claude Code session (headless / -p mode) that fetches the
# current Claude Code release notes + docs, cross-references them
# against this repo's curriculum, and writes a freshness report.
#
# DSM Task Scheduler wiring (recommended):
#   Control Panel → Task Scheduler → Create → Scheduled Task →
#   User-defined script. User: <your nas user>. Schedule weekly
#   (Mondays). Run command:
#     /volume1/projects/claude-code-quest/scripts/audit/curriculum-freshness.sh
#
# Manual one-off:
#   bash scripts/audit/curriculum-freshness.sh
#
# Output:
#   scripts/audit/curriculum-freshness-report.md   (overwritten each run)
#   /tmp/curriculum-freshness.log                  (full session log)
#
# Bail-fast: if `claude` isn't on PATH or fails, log and exit cleanly so
# Task Scheduler doesn't mark this as a hard failure week-after-week.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
REPORT="$REPO_ROOT/scripts/audit/curriculum-freshness-report.md"
LOG="/tmp/curriculum-freshness.log"

cd "$REPO_ROOT" || exit 0

if ! command -v claude >/dev/null 2>&1; then
  echo "[$(date -Iseconds)] claude CLI not on PATH — skipping audit." >> "$LOG"
  exit 0
fi

PROMPT=$(cat <<'EOF'
Run the weekly Claude Code curriculum freshness audit.

1. WebFetch the latest Claude Code release notes and docs (try
   https://docs.claude.com/en/release-notes/claude-code,
   https://docs.anthropic.com/en/docs/claude-code/overview, and
   https://github.com/anthropics/claude-code/releases). Note the
   latest CLI version, latest Anthropic model IDs (Opus/Sonnet/Haiku),
   and any new slash commands, hook events, settings keys, or major
   features released in the last ~60 days.

2. Read data/curriculum.js and data/curriculum2.js. Cross-reference
   against your Step 1 findings. Check version stamps
   (lastVerified / verifiedAgainstVersion), slash-command tables,
   model IDs and tier discussion (ch10 in particular), hook events
   count (ch15 references 27), CLAUDE.md memory layers, settings.json
   precedence, /agents, MCP, headless mode (claude -p), prompt
   caching TTL.

3. Do NOT modify curriculum content. Write a freshness report to
   scripts/audit/curriculum-freshness-report.md with:
   - What's NEW since last audit.
   - What's STALE in the game (file:line, current text, suggested fix).
   - What's still ACCURATE (one reassurance line if nothing changed).
   - RECOMMENDATION: prioritized edit list, or "no action needed".

Keep it under 600 words. If WebFetch fails on every source, write a
one-line report saying network unavailable and exit cleanly.
EOF
)

echo "[$(date -Iseconds)] starting freshness audit" >> "$LOG"
# --permission-mode plan keeps the audit read-only (no edits, no shell
# state-changes). The audit prompt explicitly only WRITES the report
# file via the Write tool — plan mode permits read + Write so the
# report still lands.
claude -p "$PROMPT" \
  --permission-mode plan \
  >> "$LOG" 2>&1
echo "[$(date -Iseconds)] finished, exit $?" >> "$LOG"
