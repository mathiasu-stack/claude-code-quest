# Curriculum Freshness Audit — 2026-06-15

First run of the scheduled weekly audit. Sources fetched: GitHub CHANGELOG (`anthropics/claude-code/main`) + `code.claude.com/docs/en/hooks` + `code.claude.com/docs/en/slash-commands`. Latest CLI version on shelf: **v2.1.176**. Curriculum's most recent stamp: **v2.1.130**. The shelf has moved 46 versions ahead of the curriculum in ~2 weeks — the docs landscape has churned more than the gap suggests.

## 1. What's NEW since the curriculum was stamped

Material shifts that affect lesson accuracy:

- **Claude Fable 5** released as Anthropic's most capable widely-released model (`claude-fable-5`, 1M context, $10 in / $50 out per MTok). Sits above Opus 4.8 on the capability ladder. Project Glasswing tier (`claude-mythos-5`) is invitation-only.
- **Claude Opus 4.8** generally available — already in the curriculum, ✓.
- **Custom commands have merged into Skills** (v2.1.152-onward). `.claude/commands/deploy.md` and `.claude/skills/deploy/SKILL.md` both create `/deploy` and work the same way. **This is the biggest curriculum-facing change.**
- **Auto mode** — no longer requires opt-in consent (v2.1.152). Falls back to best available Opus when Fable 5 unavailable (v2.1.176).
- **31 hook events**, up from the 27 cited in ch15. New events include `Setup`, `UserPromptExpansion`, `PermissionRequest`, `PermissionDenied`, `PostToolUseFailure`, `PostToolBatch`, `MessageDisplay`, `TaskCreated`, `TaskCompleted`, `StopFailure`, `TeammateIdle`, `InstructionsLoaded`, `ConfigChange`, `CwdChanged`, `FileChanged`, `WorktreeCreate`, `WorktreeRemove`, `Elicitation`, `ElicitationResult`, `SessionEnd`.
- **New slash commands**: `/simplify` (cleanup-only review + apply), `/code-review --fix`, `/cd` (move session without breaking prompt cache), `/reload-skills`.
- **New settings keys**: `enforceAvailableModels` (admin allowlist), `footerLinksRegexes`, `wheelScrollAccelerationEnabled`, `skipLfs` for plugin marketplaces, `--safe-mode` flag.
- **Sub-agents can spawn 5 levels deep** (was previously bounded shallower).
- **Plugins**: auto-load from `.claude/skills`; `claude plugin init` scaffolds new ones.

## 2. What's STALE in the curriculum

| Where | Current | Suggested correction |
|---|---|---|
| `curriculum2.js:1454` (ch15-q01a explanation) | "Three layers" | Still three layers, fine — but the **commands→skills merge** affects ch08/ch11. |
| ch15 lesson(s) referring to **"27 hook events"** | "27 events" | Update to **31** (or write "30+" to future-proof). Cite the new event names (`Setup`, `PostToolUseFailure`, `Elicitation`, etc.). |
| ch08 ("Skills: Foundations") | Skills + custom commands taught as adjacent concepts | They are now the **same concept** — note the merge: `.claude/commands/*.md` and `.claude/skills/*/SKILL.md` both produce `/<name>`. Existing commands keep working. |
| ch10 (model tiers) | Opus 4.8 / Sonnet 4.6 / Haiku 4.5 | Add a one-line "above Opus: **Claude Fable 5** for the most demanding work" — covers the top tier. |
| ch11 (slash commands) | `/init`, `/help`, `/agents`, `/model`, `/fast`, `/cost`, `/clear`, `/compact` | Consider adding **`/simplify`** (cleanup review + apply), **`/cd`** (cache-safe directory move), **`/reload-skills`**. |
| ch15 settings | Does not cover `enforceAvailableModels` or `--safe-mode` | Optional mention — both are admin/troubleshooting tools, not core. |
| ch16-l06 (scheduled automation) | Uses `--permission-mode plan` | Still valid. No change. |

No test criteria need changes — the nonce + keyword graders are all keyword-flexible enough to accept newer command names. The lessons are the source of truth issue, not the tests.

## 3. What's still ACCURATE

Everything not in the table above. ch01-ch07, ch12-ch14, ch16 are clean. CLAUDE.md memory layers, settings.json precedence (3 layers, local wins), MCP, headless mode (`claude -p`), prompt caching 5-minute TTL — all current.

## 4. RECOMMENDATION

Prioritized:

1. **ch15 hook count: 27 → 31** (or "30+"). One-line lesson edit. Highest signal-to-effort.
2. **ch08-l01 commands-skills merger note**. Two-sentence addendum explaining the convergence. Players reading older docs will be confused otherwise.
3. **ch10 Fable 5 mention**. One sentence above the Opus 4.8 description acknowledging the new top tier.
4. **ch11 `/simplify` + `/cd` + `/reload-skills`** added to the slash-command table.
5. **Refresh `lastVerified` + `verifiedAgainstVersion`** on touched lessons to `2026-06-15` / `v2.1.176`.

Say the word and I'll apply the five edits in one pass — they're surgical content additions, no test criteria touched.
