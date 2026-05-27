# Resume prompt — Claude Code Quest (next session)

Paste this whole block into the new Claude Code session to pick up.

---

I'm resuming work on **Claude Code Quest** at `/volume1/projects/claude-code-quest`. This is a vanilla JS Three.js 3D office game with a corporate "Kedash Corp" training/welcome theme. No build step, no npm — served via Synology Web Station/Nginx at `http://ds925-urlacher:8888` (Tailscale) or `http://192.168.70.9:8888` (local). Deploy by running `nas-deploy "commit message"` from the NAS — that stages, commits, and pushes to GitHub in one shot.

Read `CLAUDE.md` first (it has full stack + deploy details). Key context the previous session built up that you should treat as live state:

## Architecture (already in place)

- **Data-driven scene layout**: `data/rooms.js` declares all room contents as `{ type: 'wall' | 'floor_plate' | 'decoration' | 'builder' | 'poster' | 'wall_sign' | 'ceo_portrait' | 'clutter', pos: [x, y, z], rotY?, ... }` entries. `play/world/roomsLoader.js` reads them, dispatches to registered builders, and tags every resulting `Object3D` with `_roomId / _roomEntryIndex / _yOffset` so the editor can map a clicked mesh back to its data entry. Compound builders (atrium, elevator, ceilings, exterior) live in the registry and add themselves to scene.
- **In-game room editor** at `play/editor/roomsEditor.js`: admin-gated behind passcode `Kapprim` (stored in `sessionStorage.ccq_admin`), opens via toolbar. Features:
  - TransformControls gizmo + free-drag (mouse hold on object → slides along floor plane at current Y).
  - Hand-rolled side panel with X/Y/Z/rotY numeric fields + per-axis 🔒 lock checkboxes that disable that axis on the gizmo via `transformControls.showX/Y/Z`.
  - **➕ Add Item** library modal: categorized templates (Walls, Floors, Signs, Furniture, Decorations, Characters). Characters category is dynamically populated from `window.__playApi.getHandBuiltNpcs()`.
  - **Delete** (Del key or panel button): for room objects splices `room.objects[]` + re-indexes survivors; for NPCs calls `window.__playApi.removeNpcMesh(node)`.
  - Selection works on both room placements (discriminated union `{ kind: 'room', roomId, entryIndex }`) and NPCs (`{ kind: 'npc', npcDef, mesh }`). `findTaggedAncestor()` walks up parents looking for either `_roomId + _roomEntryIndex` or `_isNpc`.
  - Movement during edit: WASD / camera still work while editing — the editor only intercepts click selection and drags.
  - **Export Layout** button: regenerates the entire `data/rooms.js` content as a string for paste-back.
- **NPC tagging**: `spawnNPC()` in `play.js` tags each mesh with `npc / _isNpc / _npcId / _yOffset / floor` so the editor selection pipeline picks them up like rooms.
- **`window.__playApi = { spawnNpcFromDef, removeNpcMesh, getHandBuiltNpcs }`** is the editor↔play bridge for NPC ops.
- **Single-floor loading**: only one floor's geometry/NPCs are alive at a time; elevator triggers swap. Atrium is shared.
- **CEO portrait** (`buildCeoPortrait` in play.js): refactored to return its group instead of self-adding to scene, so it now flows through the loader and gets tagged. Editable like any room placement. Default position `[0, 2.0, -10.86]` lives in `data/rooms.js` reception entry.
- **Camera**: third-person orbit, middle-mouse drag (or two-finger swipe on mobile) to pan. Recently expanded vertical range to PITCH_MIN -1.20 (~-69°) / PITCH_MAX +1.45 (~+83°); camera Y clamped to `[floorY + 0.4, floorY + 14]` to prevent floor/ceiling clipping at extremes.

## File map (the parts you'll touch most often)

```
data/rooms.js                       Declarative scene layout (7 rooms)
play/play.js                        ~4100 lines — main game module, world build, NPCs, input, camera
play/world/roomsLoader.js           Data-driven scene assembly + dispatchEntry()
play/editor/roomsEditor.js          ~700+ lines — admin-gated editor
play/characters/gltfCharacter.js    GLB character loading + idle/walk/run clip blending
play/assets/characters/             linda.glb + linda_idle/walk/run.glb + manifest.json
scripts/audit/run-all.sh            Pre-deploy sanity checks — always green before nas-deploy
index.html                          Cache-bust query strings on every script tag (?v=YYYYMMDD<letter>)
```

## Deploy workflow

1. Edit files.
2. Bump the cache-bust suffix on touched scripts in `index.html` (e.g. `?v=20260527h` → `?v=20260527i`). The pattern is `YYYYMMDD<letter>` where the letter increments per same-day deploy.
3. `node --check` each modified JS file and run `bash scripts/audit/run-all.sh` — must end with `AUDIT: all clean.`
4. `nas-deploy "multi-line commit message describing why, not just what"` — stages, commits with Claude co-author, pushes.
5. Web Station serves immediately; user hard-reloads to pick up the cache-bust.

## Recently shipped (last few commits)

- `5b4b29f` — Camera vertical range expansion (pitch -69° to +83°, Y clamp).
- `4b89c82` — CEO portrait moved into standard loader path so the editor can select/drag it.
- Earlier (same session block): Add Item library, Delete, per-axis locks, NPC editing, free-drag, walk-while-editing, removed Director tier tag, Resume Play input restoration.

## Known unfinished / potential next asks

- The library catalog in `roomsEditor.js` doesn't list "CEO Portrait" as a Decoration template — so a deleted portrait can only come back via Export → paste → reload. If the user wants it spawnable from the library, add a `{ kind: 'ceo_portrait', label: 'CEO Portrait', ... }` entry to `LIBRARY_CATALOG` in `roomsEditor.js` that emits a `{ type: 'ceo_portrait', pos: [...] }` data entry.
- No room-creation UI yet (the editor only edits existing rooms). Adding a "New Room" flow would require: prompt for `id / name / floor`, push onto `window.ROOMS`, then loader needs to be re-run for that room.
- Touch path for the editor's free-drag is untested (the gizmo works; the click-and-hold free-drag pipeline may not have a touchstart equivalent — verify before claiming mobile editing works).
- The audit suite is regex-based (no AST parser), so it can miss subtle issues — treat green audit as necessary but not sufficient.

## Conventions the user has confirmed

- Keep the audit suite dependency-free.
- Don't add backwards-compat shims for removed code — delete it.
- Don't narrate; tight summaries only. End-of-turn = one or two sentences.
- Comments only when WHY is non-obvious. No reference to past commits / "added for X flow" in code comments — that belongs in commit messages.
- For UI/feature work, the user verifies in-browser themselves on `ds925-urlacher:8888`. You don't have access to that browser; report changes + cache-bust value so the user can hard-reload.
- The user prefers compound deploys: ship a feature + its docs + its cache-bust in one `nas-deploy` rather than a chain of micro-commits.

## How to start

Begin by running `git log -10 --oneline` and `git status` to confirm the working tree matches what's described here, then wait for the user's next ask. If the working tree has changes you don't recognize, **don't discard them** — surface them to the user.
