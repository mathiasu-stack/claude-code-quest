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
| `nonce` | (none — code comes from `progress.testNonces[testId]`) | submission contains the current per-test verification code (case-insensitive); code is minted when the test view opens and rotated on pass |

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
served by `save_server.py` (single-process Python HTTP server, replaces 
Web Station) at http://192.168.70.9:8888 (local), 
http://ds925-urlacher:8888 (Tailscale).

When running on the NAS (Remote Control sessions), deploy by committing 
and pushing directly. NEVER use `git add .` or `git add -A` — the assets 
folder holds ~280 MB of deliberately untracked GLBs (space-named raw 
uploads, Blender/, Hijabi_*.glb); bulk-adding them would exceed GitHub's 
100 MB file limit and break the push. Stage explicitly:

    git add -u                      # modified tracked files only
    git add path/to/new_file.js     # new files by name
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

## Offline / downloadable play

The sidebar's "Download for offline play" link serves a zip built by
`scripts/build-offline-package.sh`, which runs `git archive` over
tracked files (so the gitignored GLB originals never end up in it).
`.gitattributes` marks internal docs/tooling (`CLAUDE.md`, `RESUME.md`,
`scripts/`, `design/`, …) `export-ignore` so they're excluded from what
players unzip, even though they stay tracked in git.

The zip includes two double-click launchers at the repo root —
`Play Offline (Mac & Linux).command` and `Play Offline (Windows).bat` —
that start the game on a fixed local port (8899) and open the browser to
it. No build step, no new dependencies: it's the same zero-dependency
server the NAS itself runs, just started by the player instead of by
`nas-deploy`.

**Windows has no Python**, so `Play Offline (Windows).bat` falls back to
`offline_server.ps1` — a read-only static server in PowerShell (built into
every Windows) that binds 127.0.0.1 via a plain `TcpListener`: no admin, no
HttpListener URL reservation, no firewall prompt. It serves the whole game
(incl. `.glb` MIME + Range requests) but does NOT reimplement `/save` or
`/tts`; both answer 503, which the client already treats as offline
(narration falls back to browser voices, room editor unavailable — it's
admin-only). The `.bat` prefers `save_server.py` whenever Python exists.
Both launchers pass `127.0.0.1` as `save_server.py`'s optional 2nd argv
`host` (default `0.0.0.0`, so the NAS is unaffected).

There's no PowerShell on the NAS to test that fallback with — use the
`mcr.microsoft.com/powershell` container via `sudo docker` (docker needs
sudo here). Note it's PowerShell 7 on Linux, not Windows PowerShell 5.1.

Progress is `localStorage`, scoped to that port, so the launcher (not a
random `python3 -m http.server`) is what keeps a returning player's save
reachable.

**Rebuild after any change to shipped game files**: the zip is
generated, not tracked (`downloads/` is gitignored) — re-run
`bash scripts/build-offline-package.sh` and it's live immediately
(same "Web Station serves from disk" model as everything else).
Nothing currently rebuilds it automatically; if it drifts noticeably
from what's live, that's expected until someone wires it into
`nas-deploy`. `git archive` only sees TRACKED files, so a new game file
that nobody `git add`-ed is silently absent from the zip — the build
script warns about untracked non-dev files for exactly this reason.
