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

## In-flight (uncommitted, 2026-05-27 session)

- **Interactable objects (phone / computer / book / whiteboard / server / display) are now selectable in the editor.** `registerInteractable()` tags the mesh + glow ring with `_isInteractable / _isInteractableGlow`; the editor recognises both, walks ring-clicks back to the owner mesh, and hides all glow rings during edit mode. Drag/translate writes back into `LESSON_DELIVERY[chapterId].objectLocation.position` (session-only — Export Layout doesn't yet serialise LESSON_DELIVERY). Files touched: `play/world/interactables.js`, `play/editor/roomsEditor.js`, `play/play.js`, `index.html` cache-bust.
- **Mobile pinch-to-zoom**. Two-finger pinch on the canvas now scales `cameraDist` between `CAM_DIST_MIN` (2.5) and `CAM_DIST_MAX` (18). Implemented in the existing `cameraTouches` pipeline in `play.js`: when ≥2 touches are tracked, we enter pinch mode, snapshot initial finger-distance + cameraDist, and on each move multiply cameraDist by the inverse ratio (spread → zoom in, pinch → zoom out). Yaw/pitch deltas are suppressed during pinch so the camera doesn't spin from the fingers' arcing motion.
- **NPC edits now exportable.** New `data/npc_overrides.js` (loaded after `data/rooms.js`) holds `window.NPC_OVERRIDES = { [npcId]: { pos: [x,z], face } }`. `spawnNPC()` applies the override AFTER the floor-relocation overrides so it always wins. Editor: dragging an NPC mirrors into `window.NPC_OVERRIDES`; Export Layout now downloads `npc_overrides.js` alongside `rooms.js` and the alert spells out the full workflow (replace both files → bump `?v=YYYYMMDDx` in `index.html` → hard-reload). Generated chapter NPCs are covered too (their ids `auto-${lessonId}` / `auto-${chapterId}-test` are stable).
- **Interactable (LESSON_DELIVERY) edits now exportable too.** Mirror pattern: `data/lesson_delivery_overrides.js` exposes `window.LESSON_DELIVERY_OVERRIDES = { [chapterId]: { position: [x, y, z] } }`. Applied in `play.js`'s interactable spawn loop — when an override exists, the builder is called with the override `position` instead of `loc.position`. Editor mirrors edits into the map; Export Layout now downloads up to three files (`rooms.js`, `npc_overrides.js`, `lesson_delivery_overrides.js`) and renumbers the workflow steps based on what was changed.
- **Compound-builder children are now editable too.** New `play/world/compoundChildren.js` exposes `placeCompoundChild(scene, mesh, ownerId, childId, opts?)` — applies any matching `window.COMPOUND_OVERRIDES[ownerId][childId]` (pos + rotY), tags `mesh.userData` with `_isCompoundChild / _compoundOwner / _compoundChildId`, then `scene.add()`s. Every `scene.add()` call in `decorate_reception` (28), `decorate_library` (13), `reception_centerpiece` (1), `atrium` (11), and `elevator` (4) now routes through this helper with a stable string id (descriptive name for solo items, `prefix_${index}` inside loops). New `data/compound_overrides.js` holds the override map. Editor recognises `_isCompoundChild` in `findTaggedAncestor` / `tagKind` / `lookupEntry` / `syncDataEntryFromSelection` / `refreshPanel`; Export Layout serialises `compound_overrides.js` when any compound child has been moved. **Caveat:** ids are positional-by-convention — adding/removing items in the source files shifts the indexed ones (e.g. `ceiling_lamp_2` becomes `ceiling_lamp_1` if you remove the first lamp), orphaning existing overrides. Descriptive ids (`stapler`, `clock`, `chandelier`) are stable.
- **Fly mode in edit mode.** Inside `playerUpdate` (the per-frame movement block in `play.js`), the gravity + ground-snap branch is wrapped in `if (isRoomEditorActive())` → Space ascends, C descends at 5 m/s; Y is clamped to `[floorY − 0.2, floorY + 12]`; `velocityY` is held at 0 and `grounded` at false so the regular jump physics resume cleanly on exit. Use this to fly up and select ceiling items (chandelier, lamps, atrium walls).
- **Editor selection now requires double-tap.** Single tap is a no-op unless the tap lands on the currently-selected object (in which case it starts free-drag). Double-tap (within 400 ms + 30 px) commits selection; double-tap on empty space deselects. Avoids picking up random objects whenever the player taps to look around. Implemented in `_onCanvasPointerDown` in `roomsEditor.js`.
- **Camera-look suppressed while editor is dragging.** New export `isEditorDragging()` from `roomsEditor.js` is true while `_dragMode` (free-drag) OR `_transformControls.dragging` (gizmo). `cameraTouchMoveListener` and `mouseMoveListener` in `play.js` check it and skip yaw/pitch updates (and pinch zoom) while it's true; stored finger positions still update so deltas don't snap when the drag ends.
- **Ctrl/Cmd+C / Ctrl/Cmd+V in the editor.** Copies + pastes the currently-selected room item or NPC. Pastes land ~1 m offset on XZ so the duplicate doesn't z-fight; pasted item is auto-selected. NPC paste assigns a fresh id (`<orig>-copy<base36ts>`) so the duplicate doesn't share `NPC_OVERRIDES` with the source. Clipboard is in-memory only (cleared on exit edit mode). Interactables + compound children show a "can't copy" alert because they're baked into source files.
- **Collider AABBs now re-derived from `window.ROOMS` after every edit.** Old hardcoded furniture entries in `registerStaticColliders()` (Marcus desk, Aisha desk, Diana cabinets, couches, library bookshelves, reading tables, F2-4 office desks) were removed and replaced with a `aabbForRoomEntry()` pass over `window.ROOMS`. Walls + grandfather clock + library cart stay hardcoded (compound builder children, not in rooms data). New `rebuildColliders()` is exposed via `window.__playApi`; editor calls it after every drag-sync, resize-rebuild, Add Item, Paste, and Delete. Footprint per builder fn lives in `BUILDER_FOOTPRINTS` (desk/table/couch/filing_cabinet/bookshelf/water_cooler); per decoration id in `DECORATION_BLOCKERS`. rotY ±π/2 swaps axes via cos/sin projection.
- **Per-item collision toggle.** Rooms entries can carry `collide: true|false` to force collide-on or collide-off (overriding the type-default lookup above). Editor panel shows a "collide" checkbox for builder + decoration entries with a "(default: on/off)" / "(override)" suffix; toggling back to the default state drops the field to keep exports clean. Serialised by `stringifyEntry`. `_defaultBlocksByEntry()` in `roomsEditor.js` mirrors the play.js default lists — keep them in sync.
- **"💾 Save Permanently" now has three save paths (tried in order).** (1) `POST ./save.php` — the new PHP endpoint at the project root that writes allow-listed files to `data/`, authenticated by the `Kapprim` admin passcode (stashed into `sessionStorage.ccq_admin_pass` by `app.js`'s admin-unlock prompt). Works in every browser, over plain HTTP, including the Synology Web Station deployment. (2) `window.showDirectoryPicker()` (File System Access API) for HTTPS/localhost Chrome/Edge — requires a secure context, so it's bypassed on the `http://192.168.70.10:8888` LAN URL even in Chrome. (3) Download-and-replace via `exportLayout()` — universal fallback. `save.php` hard-restricts writes: only POST, only allow-listed filenames (`rooms.js` + the three `*_overrides.js`), 1 MB ceiling per file, passcode-gated via `hash_equals`, basename'd to defend against path traversal.
- **Cache-bust step removed from the export workflow.** `index.html` now loads `data/*.js` via a small inline `document.write` loop using `?t=${Date.now()}` so every page load fetches fresh copies. Costs ~10 KB re-fetch per load; saves a manual cache-bump every export. Workflow is now: save (FSA writes directly, or download + manual replace) → reload.
- **Delete works for every selection kind.** Compound children + interactables now write `hidden: true` into their respective override map (`COMPOUND_OVERRIDES[owner][child].hidden`, `LESSON_DELIVERY_OVERRIDES[chapter].hidden`); `placeCompoundChild()` skips hidden children at build time, and the interactable spawn loop skips hidden chapter entries. Mesh is removed from the scene immediately so the editor reflects the change without a reload. Re-toggling the `hidden` flag (by manually editing the override file) brings the item back; future enhancement could add an "Unhide" panel.
- **Universal scale row in the editor panel.** Three inputs (sx/sy/sz) for every selection; persists into the matching override slot (`entry.scale` for rooms, `NPC_OVERRIDES[id].scale`, `LESSON_DELIVERY_OVERRIDES[chapter].scale`, `COMPOUND_OVERRIDES[owner][child].scale`). All four override serializers + `stringifyEntry` now emit `scale: [sx, sy, sz]`. Toggling back to `[1,1,1]` drops the field for clean exports. Applied at build time via `mesh.scale.set(...)` in: `spawnNPC` (NPC), interactable loop (LESSON_DELIVERY), `placeCompoundChild()` (compound child), `loadRoom()` in `roomsLoader.js` (room entries).

## Known unfinished / potential next asks

- **Compound-builder children (e.g. ceiling lamps from `decorate_reception`, atrium chandelier, signage built inside `buildAtrium`) are still NOT selectable.** They're added via internal `scene.add()` from compound functions, with no `_roomId / _roomEntryIndex` tagging. The user surfaced this as "I can't select the floating items" — likely the reception ceiling lamps. Options: (a) refactor `decorate_reception` to emit explicit data entries instead of one compound builder, (b) tag compound children with a back-ref to the compound entry + add a "compound child" selection mode that warns edits won't export, or (c) leave as-is and document. No decision yet.
- **Interactable position edits aren't yet exported.** Editing a phone's position mutates `LESSON_DELIVERY[chapterId].objectLocation.position` in-memory, but `exportLayout()` only serialises `window.ROOMS`. Next step: add a sibling export for LESSON_DELIVERY (or a combined "Export full scene" that writes both).
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
