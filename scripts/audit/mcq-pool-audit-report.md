# MCQ Pool Audit — 2026-06-14

## Summary

- **Total chapters audited:** 16
- **Total questions reviewed:** 176 (11 per chapter, uniform)
- **All-clear chapters (✅):** ch01, ch02, ch03, ch04, ch06, ch07, ch08, ch09, ch11, ch12, ch13, ch14, ch16
- **Low-severity issues (⚠️):** ch05 (one question gives away the answer in the prompt), ch10 (model-version names race the lessons against current reality), ch15 (one option leaks the answer; model name `claude-opus-4-8` not yet shipping)
- **High-severity issues (❌):** none

Schema is uniform and correct across all 16 chapters: every theoreticalTest carries `id: '<ch>-test-mcq'`, `xpReward` matches the paired practicalTest, pool size is 11, `drawCount: 6`, `passThreshold: 80`, every `correctIndexes` is in-bounds, every `single` has length 1, every `multi` has length ≥ 2. Every question has a substantial, lesson-citing explanation. Render-layer Fisher-Yates over both pool sampling and option order is in place (`ui/test.js` lines 30–55), so display order is randomized per attempt; authored option order is therefore not user-visible.

The one systemic finding worth flagging is **authoring bias toward position 1**: across the entire 332-mark correctIndexes corpus, position 1 holds **45.5%** of all correct answers (uniform-with-4-options expectation: ~25%). It's invisible at runtime but visible in the file — and it tells you which option the author wrote first and which they wrote as "the right one." See "Overall recommendations" for the easy fix.

## correctIndexes distribution (per chapter)

Counts include every entry in every question's `correctIndexes` (so multi-questions contribute multiple positions). "Verdict" is qualitative — uniform=expected ~equal, skewed=one position carries most of the weight.

| Chapter | Pos 0 | Pos 1 | Pos 2 | Pos 3 | Pos 4 | Pos 5 | Pos 6 | Verdict |
|---------|------:|------:|------:|------:|------:|------:|------:|---------|
| ch01    | 4 | 7  | 2 | 1 | – | – | – | skewed → 1 |
| ch02    | 5 | 8  | 4 | 3 | 1 | – | – | skewed → 1 |
| ch03    | 5 | 10 | 4 | 3 | 1 | – | – | skewed → 1 |
| ch04    | 3 | 8  | 2 | – | – | – | – | skewed → 1 |
| ch05    | 4 | 7  | 6 | 2 | – | – | – | moderately skewed → 1 |
| ch06    | 3 | 11 | 3 | 2 | – | – | – | strongly skewed → 1 |
| ch07    | 5 | 9  | 3 | 2 | 1 | – | – | skewed → 1 |
| ch08    | 4 | 11 | 4 | 2 | 1 | 1 | 1 | strongly skewed → 1 |
| ch09    | 5 | 11 | 5 | 3 | 2 | – | – | skewed → 1 |
| ch10    | 3 | 11 | 3 | 2 | 1 | – | – | strongly skewed → 1 |
| ch11    | 4 | 9  | 2 | 2 | – | – | – | skewed → 1 |
| ch12    | 3 | 7  | 6 | 4 | – | – | – | moderately skewed → 1 |
| ch13    | 4 | 10 | 2 | 1 | 1 | 1 | – | strongly skewed → 1 |
| ch14    | 4 | 11 | 4 | 3 | – | – | – | strongly skewed → 1 |
| ch15    | 6 | 10 | 6 | 4 | 1 | 1 | – | skewed → 1 |
| ch16    | 5 | 11 | 5 | 4 | 2 | – | – | skewed → 1 |
| **Aggregate** | **67 (20%)** | **151 (45%)** | **61 (18%)** | **38 (11%)** | 11 | 3 | 1 | — |

Every chapter has position 1 as the modal correct slot. None has it below 7/11. This is a render-time non-issue (the Fisher-Yates shuffle erases it before display), but it's a tell that the author kept writing "the right answer" as the second option and the distractors around it.

## Per-chapter findings

### ch01 — Onboarding ✅
Clean. Every question maps to a specific lesson with a verbatim or near-verbatim quote in the explanation. Distractors are plausible (Node-vs-native install path, `Ctrl+P` vs `Shift+Tab`, `/compact` vs `/reset`). q03 properly tests the two real auth paths (Claude.ai sign-in, ANTHROPIC_API_KEY) with two plausible-but-wrong options. Pool covers all five lessons.

### ch02 — Business Brain ✅
Clean. Every question references the Business-Brain lesson set; layout, maintenance, and "context is the multiplier" framing all carry over. Distractors include real-world wrong locations (`~/.claude/brain/`, `node_modules/.brain/`) that look superficially right. Multi-question lengths vary (5, 4, 4).

### ch03 — CLAUDE.md & Context Management ✅
Clean. Quality is high — q03 tests the `@filename` import idiom; q04 tests the import-chain cost; q05/q06 test context rot and lean-context principle. q11 names the 200k / 1M tier breakdown by plan, which is accurate against the lesson.

### ch04 — The Memory Framework ✅
Clean and tight. q01–q05 walk the five memory layers in order; q06–q11 are "where does X belong" application questions. Distractors are restricted to the four other valid layers, which forces actual layer-knowledge rather than guessing. multi-lengths only 2 + 2 — at the floor of the "varied lengths" bar, but the question content (always-loaded layers; CLAUDE.md anti-patterns) genuinely only has 2 correct each.

### ch05 — Effective Prompting ⚠️
One low-severity finding:

- **ch05-q09 (low):** the prompt asks which option follows the lesson's recommendations and lists three obviously vague candidates ("Make calculateTax better.", "Fix the tax bug.", "Clean up the billing code please.") plus one explicit, well-formed prompt. The correct answer is structurally obvious from option length alone — no actual lesson recall required. Suggested fix: tighten distractors so they're each *plausibly* specific in different ways (name the file but skip the constraint, name the constraint but skip the file, etc.).

Otherwise clean. The "iterative loop", "prompt formula", and antipattern questions all hit their lessons squarely.

### ch06 — Working with Files ✅
Clean. The "safe refactor playbook" (q04), Plan-Mode pivot for large work (q05), and review-the-diff framing (q06) all cite the lessons accurately. Test-driven prompting (q07–q08) ties to the ch06-l05 lesson. q11 about file-edit feedback signals is plausible-distractor heavy.

### ch07 — Token Efficiency & Sessions ✅
Clean. Numbers are correct against the lesson — 200k / 1M, ~10% cache cost on hits, 5-min TTL, Opus ≈ 15× Haiku. Explanations cite specific lessons. q10's "lean session checklist" matches the ch07-l04 list verbatim.

### ch08 — Skills: Foundations ✅
Clean. q07 distinguishes built-in commands (`/init`, `/review`, `/security-review`, `/clear`) from bundled prompt-skills (`/simplify`) which is the precise terminological split the lesson teaches. q08 is a 7-option multi covering hook events — high cognitive load but well within the lesson's "selected events" list. q11 tests the token math with specific lesson-quoted numbers.

### ch09 — Skills: Methodology ✅
Clean. Methodology phases (q02), capture targets (q03), "3+ manual runs" rule (q04), and the learnings.md fields (q09) all match the lesson exactly. q08's "failure modes to listen for" list is the lesson's verbatim quartet plus one obvious filler ("Insufficient emoji density") — distractor on the silly side, but the multi-question makes it impossible to pass by elimination.

### ch10 — Choosing Your Model ⚠️
Two notes:

- **ch10-q01 / q02 / q04 / q05 (low — staleness):** the lessons name `Opus 4.8 / Sonnet 4.6 / Haiku 4.5` as the current lineup, and `claude-opus-4-8` as a current model ID. The Claude Code model actually shipping at audit time (per the host env's identification) is `Opus 4.7 (1M context)`. The questions match the lessons (Educational Integrity respected), but if Opus 4.8 hasn't shipped yet, players who paste `--model claude-opus-4-8` into a real headless run will get a model-not-found error. This is a lessons issue more than a question issue — flagged for awareness; no question rewrite needed once the lessons land on a real shipping version.
- **ch10-q07 (low):** distractor "Designing a new architecture across services" is a strong tell — its phrasing is clearly the "wrong fit for Haiku" lure, not a real alternative. Multi-question, so guessing-by-elimination is harder; still, a more plausibly-Haiku-sized distractor would tighten it. Suggested fix: replace with "Refactoring a 4-module package's circular imports" — looks small, actually needs Sonnet.

Otherwise all questions are well-grounded in the lessons.

### ch11 — Slash Commands & Workflow ✅
Clean. q01–q05 directly test the slash-command vocabulary from ch11-l01's table. q06 tests the "first 30 seconds on a new repo: `/skills` + `/agents`" framing from ch11-l03. The /fast question on Opus aligns with the lessons. (Note: the lessons claim `/fast` is a current slash command — if that ever gets renamed or removed from Claude Code, this question goes stale; verify before each lesson re-stamp.)

### ch12 — Plan Mode ✅
Clean. The four permission modes are listed accurately in q02 (default / acceptEdits / plan / bypassPermissions) with "readonly" as the wrong-but-plausible distractor. Shift+Tab cycle and `--permission-mode plan` flag both match docs. q07's plan-review checklist is verbatim from the lesson.

### ch13 — MCP Servers & Integrations ✅
Clean. MCP-server config schema (q11 — `command`, `args`, optional `env`) matches the documented `.mcp.json` format. `claude mcp add` (q06) is the correct CLI verb. q05's read-only-credentials safety advice is exactly the lesson's recommendation.

### ch14 — Subagents & Delegation ✅
Clean. Definition of a subagent (q01) is essentially the spec definition. q03/q04 properly contrast good vs bad subagent fits, and the parallel-vs-sequential dispatch heuristic (q07/q08/q09) lines up with the lesson's "three on the board" rule. q11 multi-question on human-checkpoint placement is well-targeted.

### ch15 — Settings, Permissions & Hooks ⚠️
Two low-severity findings:

- **ch15-q01 (low):** the option text for the correct three locations explicitly INCLUDES the precedence ("baseline", "ALWAYS wins") — the question is asking "which are they, and which wins?" but the answer is written inside the option labels. A student who reads the options answers correctly without recalling the lesson. Suggested fix: strip the precedence annotation from the option labels and ask in a separate single-answer follow-up which one wins, OR keep the multi and let the explanation cover precedence.
- **ch15-q11 (low, staleness):** `--model claude-opus-4-8` listed as a recommended CI flag (same issue as ch10) — model name hasn't shipped yet. Same fix path as ch10 (sync with reality on next re-stamp).

The 27-hook claim (q06) is fragile by definition — hook event lists evolve. Worth re-verifying against `docs.claude.com/en/docs/claude-code/hooks` on each lesson refresh, but the question is faithful to the lesson it's drawn from.

Otherwise clean and well-structured. q03 (allow / ask / deny + "warn" invented) and q08 (`PostToolUse` + `Edit|Write` matcher) are excellent.

### ch16 — Remote & Headless Claude Code ✅
Clean. All questions are answerable from the chapter's lessons. q05 tests the `ANTHROPIC_API_KEY` env var; q06 tests four real tmux commands plus an invented `tmux kill -9`; q08–q10 cover the "human-in-the-loop" automation rule, with q10's exact phrasing ("auto-draft → human approve → auto-distribute") coming straight from ch16-l06.

## Overall recommendations

In priority order:

1. **Spread the correct answer across positions during authoring** (not a runtime fix — the shuffle already handles display). When you write a new question, default to placing `correctIndexes` at position 0, 2, or 3 deliberately on every other question. Current 45% concentration at position 1 is invisible to players but obvious to anyone reading the data file or generating per-question metrics, and it shapes how distractor logic feels (the "good" option always seems to follow the obvious "no" option). Mechanical, takes 10 minutes per chapter: in each chapter, find the 5+ questions with `correctIndexes: [1]` and rotate them to `[0]`, `[2]`, `[3]` (along with reordering the option text correspondingly so meaning is preserved).

2. **Sync the Claude model lineup in ch10 & ch15 lessons with what's actually shipping.** Currently `Opus 4.8 / Sonnet 4.6 / Haiku 4.5` is authoritative in the curriculum, but the runtime model at audit time is `Opus 4.7 (1M context)`. If 4.8 is unreleased, the questions remain correct against the lessons but the lessons themselves are forward-dated. Update lessons → re-stamp `verifiedAgainstVersion` → questions stay correct automatically (no MCQ changes needed). This is a lesson-side fix, flagged here because MCQ Educational Integrity inherits from it.

3. **Rewrite ch05-q09 distractors so option length doesn't telegraph the answer.** Three obviously-short vague prompts plus one long specific one is solvable from formatting alone. Make each distractor a plausible-but-flawed specific prompt (each missing a different part of the formula).

4. **Soften the giveaway in ch15-q01's correct-option labels.** Strip "(baseline)", "(overrides User)", "(ALWAYS wins)" from the option text and either move precedence into the explanation or split into two questions (which-are-they multi + which-wins single).

5. **(Light-touch) Vary multi-answer correct counts further in ch04.** Both multi-questions in ch04 have exactly 2 correct answers. The natural pool of always-loaded vs on-demand layers genuinely caps at 2, so this isn't a content forge — but if a third multi were added later, lean toward 3 or 4 correct so the chapter doesn't telegraph "multi = pick exactly 2" to anyone who's seen both.

No content drift requiring WebFetch verification was found — every question's claim is either traceable to its lesson or to widely-documented Claude Code behavior (Shift+Tab cycling, `claude --version`, `/clear` / `/compact` semantics, MCP `command`/`args` schema, `--permission-mode plan` flag). The 27-hook-events count and the model-version naming are the two areas to re-verify whenever Claude Code ships a new release.
