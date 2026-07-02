#!/usr/bin/env bash
# Runs every audit. Exit code = total number of failing audits across
# all scripts (clamped to 254 by each individual script anyway).
set -u

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

fail_total=0

for script in scripts/audit/data-consistency.cjs scripts/audit/spatial.cjs scripts/audit/smoke.cjs; do
  node "$script"
  rc=$?
  fail_total=$((fail_total + rc))
done

echo "─────────────────────────────────────────────────────────────"
if [[ $fail_total -eq 0 ]]; then
  echo -e "\x1b[32mAUDIT: all clean.\x1b[0m"
else
  echo -e "\x1b[31mAUDIT: $fail_total finding(s) total.\x1b[0m"
fi
exit $fail_total
