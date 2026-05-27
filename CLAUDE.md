# Claude Code Quest

> **READ THIS FIRST**: At the start of every session, read `./RESUME.md` in the
> repo root. It carries forward state that this file deliberately doesn't —
> recent commits, current architecture decisions, in-flight work, conventions
> the user has confirmed, and likely next asks. This file is the stable project
> doc; `RESUME.md` is the rolling handoff. If you make non-trivial changes
> during the session, update `RESUME.md` before ending so the next session
> picks up cleanly.

A gamified Claude Code training app built as a vanilla JS SPA with a "Kedash Corp" corporate theme.

## Running locally

No build step. Serve the project root over HTTP:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

Opening `index.html` directly as a `file://` URL also works in most browsers.

## Stack

- Vanilla JS (ES6+), HTML5, CSS3 — zero dependencies, no framework
- Browser `localStorage` for persistence (key: `ccq_progress`)
- No backend, no build tool, no package.json

## File structure

```
index.html          Entry point — loads scripts in order (see below)
style.css           All styles, corporate Navy/Gold theme
app.js              Router, sidebar, welcome modal, top-level state
engine/
  progress.js       localStorage CRUD, XP, unlock logic
  evaluator.js      Evaluates test submissions (keyword/regex/length/structure)
  scoring.js        10-level XP system
data/
  curriculum.js     Chapters 1–8 (must load first)
  curriculum2.js    Chapters 10–16 (pushes onto window.CURRICULUM)
ui/
  dashboard.js      Chapter grid view
  lesson.js         Individual lesson view
  test.js           Practical test view
```

## Script load order (critical)

`index.html` loads scripts in this exact sequence:

1. `engine/progress.js` → `engine/evaluator.js` → `engine/scoring.js`
2. `data/curriculum.js` → `data/curriculum2.js`
3. `ui/dashboard.js` → `ui/lesson.js` → `ui/test.js`
4. `app.js`

Each file exposes its API on `window` (e.g. `window.Progress`, `window.CURRICULUM`). Do not reorder or introduce ES module imports without converting the whole app.

## Adding a chapter

1. Define a chapter object following the schema in `data/curriculum.js` (see ch01 as the canonical example)
2. Append it to `window.CURRICULUM.push(...)` in `data/curriculum2.js` (or a new `curriculum3.js` if needed — add a script tag to `index.html`)
3. Each chapter needs: `id`, `title`, `subtitle`, `icon`, `xpReward`, `lessons[]`, `practicalTest`
4. Each lesson needs: `id`, `title`, `xpReward`, `videos[]` (leave empty — placeholder renders), `content` (HTML string)
5. Each `practicalTest` needs: scenario fields, `criteria[]`, `minLength`, `passThreshold`, `xpReward`

## Evaluation criteria types

| type | value | passes when |
|------|-------|-------------|
| `keyword` | string or string[] | any keyword found (case-insensitive) |
| `regex` | pattern string | regex matches |
| `length` | number | submission.length >= value |
| `structure` | `"numbered-steps"` / `"question-mark"` / `"code-block"` | structural pattern detected |

## Progression model

- Chapter 1 unlocked by default
- Passing a chapter's practical test unlocks the next chapter
- XP is awarded once per lesson and once per passed test (idempotent)
- Levels: New Hire (0) → VP of AI (13,000 PP) — 10 levels total

## Known issues

- `curriculum2.js` was missing from `index.html` script tags (fixed)
- `isActive(view)` in `app.js` was a stub; sidebar active state was non-functional (fixed)
- All lesson `videos` arrays are empty — placeholder text renders instead

## Deployment

This project is hosted on a Synology NAS at /volume1/projects/claude-code-quest, 
served via Web Station + Nginx at http://192.168.70.9:8888 (local), 
http://ds925-urlacher:8888 (Tailscale).

When running on the NAS (Remote Control sessions), deploy by committing 
and pushing directly:

    git add .
    git commit -m "your message"
    git push

When running on WSL, use ./deploy.sh which handles the WSL → GitHub → NAS sync.

Whichever side commits, always run `git pull` on the other side before 
starting new work to avoid merge conflicts.

## Remote access

The game is reachable from any Tailscale-connected device at:

- `http://ds925-urlacher:8888` (MagicDNS, recommended)
- `http://100.101.225.85:8888` (direct IP, works without MagicDNS)

Works over mobile data, Wi-Fi, anywhere — as long as Tailscale is 
active on the accessing device.

Local-only access (when on home Wi-Fi, no Tailscale needed): 
`http://192.168.70.9:8888`.

## Deploying from the NAS

When working in a Claude Code session on the NAS itself (not WSL),
use `nas-deploy "commit message"` to commit and push to GitHub.

This is different from `./deploy.sh` (which only exists on WSL and
won't work here). `nas-deploy` is a system-wide command available
from anywhere on the NAS — it stages, commits, and pushes.

Web Station serves files directly from this folder, so the live game
at http://ds925-urlacher:8888 reflects edits immediately — no separate
deploy step is needed for visibility, only for syncing to GitHub.
