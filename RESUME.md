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

## Kedash Protocol — Phase 1 narrative layer (2026-06-10 session, UNCOMMITTED, do not deploy)

Story design lives in `design/story/kedash_protocol_scenario.md` (copy source) +
`kedash_protocol_production_plan.md` (WBS, risks). Phase 1 implemented:

- **`play/story/storyState.js`** (new ES module, `window.Story`): tier T0–T7
  derived from `Progress.isTestPassed` (`ch01→T1, ch12→T2, ch04+twist1→T3,
  ch09→T4, ch10+twist2→T5, ch15→T6, ch16+finale→T7`), never stored. Scene-seen /
  collectible / epilogue / one-shot flags persist in localStorage `ccq_story`.
  `engine/progress.js resetProgress()` also clears `ccq_story`. Twist scenes
  don't exist yet, so tier caps at T2 in Phase 1 (by design, spoiler-safe).
- **`data/story_lines.js`** (`window.STORY_LINES`): per-NPC tier-keyed dialogue
  overrides — `promptLabel / introByTier / introAppendByTier / nextHintByTier /
  postPassOnceByTier` (highest TN ≤ current tier wins). Resolved in
  `openDialogue()` + the proximity prompt writer in play.js. Gate text
  (computeAheadGate) always beats story overrides. `postPassOnceByTier` shows
  once per `postpass:${npcId}:${tierKey}` flag; object form can relay another
  speaker (used for Sarah Chen via auto-ch12-test). Act I copy in place: Linda,
  Kenji, Sarah, ch05/ch06/ch12 mentors.
- **`data/story_docs.js`** (`window.STORY_DOCS`): tier-keyed inspect texts
  (CEO portrait ×5 tiers, badge printer). New `openInspectCard()` in play.js
  reuses the dialogue card read-only; Esc/E now also closes any open dialogue.
- **Props**: `buildCeoPortrait` gained a warm PointLight; new `badge_printer`
  room builder (data/rooms.js reception entry at `[-3.4, 0, -10.3]`). Both are
  registered via `registerStoryInspectables()` AFTER `clearInteractables()` in
  buildWorld (room builders run before the wipe — can't self-register).
  NOTE: the `{ type: 'ceo_portrait' }` entry was MISSING from data/rooms.js
  (likely dropped by an editor save) — restored at `[0, 2.0, -10.86]`.
- **SYS-07**: per-chapter story framing sentences appended to all
  `practicalTest.scenario` strings EXCEPT ch14. Criteria/XP untouched.
- **ch16 server relocated** to floor 4 NE corner (`lessonRegistry.js`:
  `{ floor: 4, position: [16.2, 0, 16.2], lookAt: -3π/4 }`); `serverRack.js`
  now honors `position[1]` (floor-base Y) + lifts its glow ring to match.
- Cache-bust `?v=20260610a`: index.html (progress.js, curriculum*.js, new
  story_lines/story_docs tags after the dynamic `?t=` block, play/play.js) +
  play.js imports of storyState/lessonRegistry/serverRack. Do NOT version the
  `interactables.js` imports — split specifiers would fork its module state.
- R-9 status: `data/npc_overrides.js` currently holds only linda/ines — the
  three mentor personas (Engelhardt/Okoye/Vasquez) are NOT present there
  (they're listed in the curriculum-overhaul notes below but the file was
  since rewritten by editor exports). Left untouched (editor-owned).

### Kedash Protocol — Phase 2 (same 2026-06-10 session, UNCOMMITTED, do not deploy)

Scene runner + ambient NPC system + TWIST 1 + Act II copy. Cache-bust round
is `?v=20260610b` (play.js tag in index.html, sceneRunner/liveAgents/nameTags
imports, new story_scenes/story_ambient tags, story_lines/story_docs bumps).

- **`play/story/sceneRunner.js`** (new, SYS-03): `initSceneRunner(ctx)` gets
  `{getDialogueEl, startTypewriter, skipTypewriter, playUi, setInputLocked}`
  injected from play.js; `runScene(def, {pitch, onComplete, onAbort})` plays
  linear beats in the dlg-card chrome. `choices` render buttons (any click →
  same next beat), `action` is a string resolved via `registerSceneActions()`.
  E/Enter = skip-typewriter-then-advance (multi-choice beats need a click);
  Esc/× aborts WITHOUT marking seen — scene re-offers. `onComplete` fires only
  past the final beat; play.js marks `Story.markSceneSeen` there. No camera
  moves, no branching (risk R-2).
- **`data/story_scenes.js`** (new): `window.STORY_SCENES.twist1` — the full
  §4.1 "Six Conversations" script, 8 beats, verbatim, with `promptLabel`
  "Talk — Ines has been counting" + actions `twist1_point` / `twist1_exchange`.
- **TWIST1-01 wiring** (play.js): `pendingSceneFor(npc)` (ines + ch04-test
  passed + !sceneSeen('twist1')) intercepts at the top of `openDialogue` and
  in the proximity prompt writer. Actions (registered in `start()`): point →
  Ines faces the cooler + `liveAgents.sendTo('folderman', [-8.2,-3.0], …, 75s)`;
  exchange → three `showSpeechBubble` timeouts (3.8/6.4/8.6 s) on folderman/
  partner/tania. All actor lookups guarded — scene plays dialogue-only if
  staging actors are missing. Keydown scene branch sits BEFORE the generic
  dialogue-close branch in `setupInput`.
- **SYS-04 / COPY-05**: new `data/story_ambient.js` (`window.STORY_AMBIENT`)
  with the five verbatim §6.1 six-line sets + `setForTier(tier)`. play.js
  `ambientLineForSlot(slot)`: slot 0 = loop anchor (line 1), others cycle
  lines 2-6. liveAgents ambient workers are now E-to-talk flavor NPCs: they
  get `userData.npc` (neutral identities), a name tag (`makeNameTag` opt),
  and register INTO `npcMeshes` — their GLTF tick moved to play.js's NPC loop
  (liveAgents no longer ticks them; double-tick = double-speed anim). Slots
  3+ for library ambients; lines resolve at spawn (refresh on reload only).
- **TWIST1-02**: three roster NPCs (zone 1, kind flavor, ambientSlots 0/2/1):
  `folderman` (Stan Vesely, procedural blue folder via `folderProp` flag in
  spawnNPC, slow lobby ROUTINE in liveAgents), `tania` + `partner` (Arno Beck)
  holding the reception water cooler at [-9.5,-2.8]. `liveAgents.sendTo(id,
  to, face, holdSec)` override: go → hold → walk back to waypoint 0 → resume
  loop (no position snap).
- **CURTAIN-01** (play.js): first F1→F2 `requestFloorChange` only
  (`Story.sceneSeen('curtain1')`, marked up-front), `curtainUntil = now+2s`;
  update() lerps visible floor-1 npcMeshes to face the elevator (11,-7.6)
  and pauses `liveAgents.update` while active. Pure timeout — no stuck state.
- **PROP-01**: `buildHouseRulesFrame` (play.js) — framed yellowed canvas
  "HOUSE RULES — M.K., year 1" with the three ch03-test conventions verbatim;
  `house_rules` room builder + rooms.js reception entry at `[5.2, 0, -10.8]`
  (back wall, east of the portrait, near the ch03 kiosk at [3,0,-8.5]);
  STORY_DOCS `house_rules` (T0/T2/T5) + registerStoryInspectables entry.
  `houseRulesGroup` reset in stop().
- **COPY-02** (story_lines.js): Act II verbatim — auto-ch11-l01/l04,
  auto-ch03-l02/l04, auto-ch04-l01 (introAppend T2); elena glitch intro +
  "names compost" nextHint (T2); raj append (T2); noor postPassOnce (T3);
  ines introByTier T2 (clap count) / T3 (post-scene Bingo idle);
  auto-ch04-test postPassOnce keyed **T2 deliberately** (at pass time the
  tier is still 2 — twist1 unseen — so a T3 key would never fire at the
  handoff moment).
- **`play/ui/nameTags.js`**: new export `showSpeechBubble(mesh, text, opts)` —
  self-disposing overhead text sprite (hold 3 s, fade 1 s); flagged
  `_isSpeechBubble` and skipped by `_findTagOnGroup` so it can't hijack the
  name-tag fade.
- **VERIFICATION GAP**: the Bash safety classifier was down for the whole
  Phase 2 write — `node --check` and `scripts/audit/run-all.sh` could NOT be
  run on the touched files (story_scenes/story_ambient/story_lines/story_docs/
  rooms.js + sceneRunner/nameTags/liveAgents/play.js). Code was visually
  reviewed only. FIRST THING next session: run those checks before anything
  else, then playtest TWIST 1 (pass ch04-test → talk to Ines) + the F1→F2
  curtain beat + the house-rules frame.

### Kedash Protocol — Phase 3 (same 2026-06-10 session, UNCOMMITTED, do not deploy)

Doc viewer + collectibles + Act III copy + TWIST 2 + props. Cache-bust round
is `?v=20260610d` (style.css / play.js / story_lines / story_docs /
story_scenes tags in index.html; play.js imports of procedural, dispatchBoard,
permissionsPanel, plus new readableNote + docViewer imports; story_ambient
stays `?v=20260610b`).

- **`play/story/docViewer.js`** (new, SYS-05): full-screen monospace memo
  reader, `initDocViewer({playUi, setInputLocked, isSceneActive})` injected
  from play.js; `openDocument({title, body, onClose})`. Esc/E/click-outside
  closes; a capture-phase keydown listener swallows ALL keys while open (so E
  can't advance a scene underneath); on close, input unlocks ONLY if no scene
  is active (the scene owns the lock). CSS `.doc-viewer*` appended to
  style.css, z-index 80 (above dlg-card).
- **`play/world/objectTypes/readableNote.js`** (new, SYS-06): paper / folder /
  framed variants with canvas label textures. Registered as rooms-builder kind
  `readable_note` in play.js; 8 placements in data/rooms.js (CR-01 + CR-06 in
  reception, CR-02 library, CR-03 + learnings-frag-1 + client-profiles on
  floor 3, CR-04 + CR-05 on floor 4 per §6.2). `registerReadableNotes()` runs
  after `registerStoryInspectables()` in buildWorld AND after each lazy
  `loadFloor` build (`_noteRegistered` dedupe); glow rings lifted to
  `floorBaseY(floor)+0.02` + tagged with floor; `currentFloor` guards stop
  cross-floor XZ prompt leaks. Locked notes (tier < `unlockTier`) prompt
  "Locked — internal" and play 'cancel'. Read → openDocument +
  `Story.markCollectibleRead(id)`.
- **`data/story_docs.js`** (COPY-06): 6 authored Cycle Reports (M.K.'s voice,
  unlockTier 5), `learnings_fragment_1` (T4, verbatim),
  `learnings_fragment_2` (T7 — written now, placed on Floor M in Phase 4, NOT
  placed yet), `client_profiles` ledger (T5, verbatim §4.2).
- **`data/story_scenes.js`** (TWIST2-01): `twist2` — Engelhardt's "Customer
  Ledger" scene, 5 beats verbatim §4.2, `action: 'twist2_ledger'` opens the
  client-profiles doc mid-scene (1.1 s delay after "Mm. Open the file.").
  Trigger in `pendingSceneFor`: npc `auto-ch10-l01` + ch10-test passed +
  !sceneSeen('twist2').
- **`data/story_lines.js`** (COPY-03): Act III verbatim — ch07/ch08/ch09/ch10
  lesson + test NPC lines. `auto-ch09-test` postPassOnce keyed **T4
  deliberately** (tier flips instantly at ch09 pass — no scene gate);
  test-email "framing additions" from the scenario delivered as NPC intro
  relays instead of editing test bodies (Educational Integrity Rule).
- **Clearance chime** (`playClearanceChime` in procedural.js, E5→B5 bell):
  fires once on first Floor-4 `requestFloorChange` at tier ≥ 5
  (`Story.getFlag('floor4_chime')` one-shot).
- **PROP-02** dispatchBoard.js: 3 ghost "CYCLE 01/02/03" cards (opacity 0.16)
  behind the DONE column + bright emissive "CYCLE 07" card pinned over ACTIVE
  (pulses with the hover group).
- **PROP-03** permissionsPanel.js: new `locked` param — all three lights
  steady green (emissive 1.0, idle cycling off) when ch15-test is passed;
  play.js passes the flag at build time in the LESSON_DELIVERY spawn loop.
- **Deviations**: learnings fragment 1 is visible-but-locked below T4 (not
  hidden — build-time visibility would fight `applyFloorVisibility`); CR-02
  placed in the physical floor-1 library (scenario says "Floor 2" but the
  library room is on floor 1 in this build).
- **VERIFICATION GAP**: Bash classifier was down again — `node --check` was
  NOT run on: docViewer.js, readableNote.js, procedural.js, dispatchBoard.js,
  permissionsPanel.js, play.js, story_lines.js, story_docs.js,
  story_scenes.js, rooms.js. Visually reviewed only. FIRST THING next
  session: run those checks + `scripts/audit/run-all.sh`, then playtest:
  (1) TWIST 2 at Engelhardt after ch10-test — ledger opens mid-scene, closing
  it does NOT unlock input, scene finishes, Esc-abort re-offers;
  (2) locked vs unlocked note prompts across tiers + glow rings on floors 3/4;
  (3) clearance chime on first T5+ Floor-4 elevator ride (once);
  (4) dispatch-board ghosts + CYCLE 07 card; (5) permissions panel steady
  green after ch15-test; (6) doc viewer standalone open/close re-locks
  nothing weird in normal play.

## Character roster overhaul — 10 ethnicity rigs (2026-06-03 session, UNCOMMITTED)

Replaced the formerly procedural-shape NPCs with 10 new ethnicity character
models the user dropped into `play/assets/characters/` (original uploads have
spaces in the names, e.g. `Western male.glb` — still present but now unused).
Each was auto-rigged through **Meshy** (`meshy_rig`, 5 credits each = 50 total,
walk + run animations included). Task IDs recorded in
`play/assets/characters/_rig_tasks.json`.

- **Downloaded** (via signed URLs from `meshy_download_model`, curl'd to disk):
  for each of the 10 assets — `<asset>.glb` (rigged character, skin),
  `<asset>_walk.glb` + `<asset>_run.glb` (armature-only animation clips, ~60 KB
  each). Asset ids: `western_male/female`, `african_male/female`,
  `easian_male/female`, `sasian_male/female`, `hijab_female`, `arab_male`.
- **Validated**: every rig has 1 skin, 24 plain-name Meshy bones (Hips,
  LeftShoulder, Head, neck, …) — identical convention to linda/marcus, so the
  existing stance/tuck/retarget logic in `gltfCharacter.js` already handles
  them. Walk clip = `Armature|walking_man|baselayer`, run = `…running…`
  (matched by `CLIP_MATCH` substrings 'walk'/'run').
- **manifest.json**: 10 new `available:true` entries, each with
  `stanceFactor:0.65`, `extraAnimations:[walk,run]`, and a new
  `statureVary:true` flag.
- **npcCasting.js**: recast aisha→sasian_female, kenji→easian_male,
  diana→western_female, sarah→african_female, elena→western_female (reuse),
  raj→sasian_male, mei→easian_female, noor→hijab_female. `player/linda/marcus/
  ines` kept on their existing rigs. `AUTO_POOL` is now all 10 ethnicity models.
- **Reuse distinction** (user OK'd reusing a model if visibly distinguished):
  `gltfCharacter.js` applies a deterministic per-NPC stature multiplier
  (0.95–1.06×, hashed from `look._id`) gated on the manifest `statureVary`
  flag — so diana vs elena (both western_female) and same-model AUTO_POOL NPCs
  read as different builds. The 4 established uniques have no `statureVary`, so
  their authored proportions are untouched.
- **warmCache** (`play.js _preloadGltfAssets`): all 10 preloaded up front
  (~150 MB) so both named + AUTO_POOL NPCs get the sync GLTF build instead of
  falling back to procedural.
- **Cache-bust**: `gltfCharacter.js` + `npcCasting.js` imports bumped to
  `?v=20260603a`; `play/play.js` in `index.html` → `?v=20260603a`. manifest is
  auto-busted (`?v=Date.now()` in assetLoader).

Status: live on Web Station (:8888) for testing; **not yet committed/pushed**.
Not visually verified in-browser by me — user should hard-reload and check the
NPCs render + walk. Open question: whether to delete the unused space-named
original uploads (~140 MB) — left in place for now.

### T-pose fix + objective compass/beacon (same 2026-06-03 session, UNCOMMITTED)

- **T-pose bug** ("characters outside don't seem to be rigged"): root cause was
  `play/world/liveAgents.js` ambient agents — they're added straight to the
  scene (NOT into `npcMeshes`), so play.js's NPC loop never ticked their
  AnimationMixer, leaving them frozen at bind-pose (T-pose). Fix: in
  `liveAgents.update()` ambient loop, drive `gltfChar.setMotion('walk'/'idle')`
  by frame-to-frame position delta and call `gltfChar.update(dt)` — mirrors
  play.js lines ~4096-4108. Named-routine NPCs (marcus/aisha/linda) are already
  in `npcMeshes` so they're ticked there — deliberately NOT ticked again in
  liveAgents to avoid double-speed mixers. New rigs ship only walk+run (no idle
  clip); the ARM_CHAIN override in `gltfCharacter.js update()` pulls arms to the
  walk-first-frame pose during idle, so ticked-but-idle NPCs look natural (arms
  down), not T-pose.
- **Objective compass + ground beacon** (new feature): persistent HUD arrow
  (top-center) that points compass-style toward the NPC/device giving the next
  incomplete lesson — or the chapter's final test once all its lessons are done
  — plus a vibrant pulsing gold ring + glow disc + light beam on the ground
  under that target. Implementation all in `play/play.js`: `getObjectiveRef()`
  (first incomplete lesson across CURRICULUM in order, else the chapter test),
  `resolveObjectiveTarget()` (scans `npcMeshes` by `npc.lessonId`/`npc.testId`,
  then `interactObjects` by `_interactableChapterId` for device-delivered
  lessons), `_ensureObjectiveRing()` (builds the beacon, additive blending),
  and `updateObjective(dt)` (called at end of `update()`; rotates the DOM arrow
  via `camBearing - targetBearing`, repositions the beacon to track wandering
  NPCs). Cross-floor target → arrow steers to the elevator call button with an
  "↑/↓ Floor N" label. `_objRing` is reset to null in `stop()` so it rebuilds in
  a fresh scene on re-entry. DOM `#play-compass` added in `app.js`; styles
  `.play-compass*` in `style.css`.
- **Cache-bust this round**: `index.html` → `style.css?v=20260603b`,
  `play/play.js?v=20260603b`, `app.js?v=20260603b`; liveAgents import in
  play.js → `./world/liveAgents.js?v=20260603b`. (gltfCharacter/npcCasting stay
  at `?v=20260603a` — unchanged this round.)

## Curriculum overhaul (2026-05-30 session)

A full audit + rewrite of all 16 chapters against the current Claude Code feature set (Opus 4.8, /model, /agents, /fast, 1M context, prompt caching 5-min TTL, hooks 27 events, output styles, headless mode, settings.json precedence, @filename import, auto-memory). Net result: 16 chapters, 65 lessons, ~13,810 XP.

**Three chapters fully rewritten** (IDs preserved so the floor mapping doesn't move):
- `ch10` "Recursive Skill Refinement" → "Choosing Your Model" (Opus/Sonnet/Haiku + /model + Fast Mode + 1M context + prompt-caching economics + match-tier-to-task heuristic). Mentor NPC: **Dr. Priya Engelhardt** (AI Operations).
- `ch14` "Multi-Goal Command Center" → "Subagents & Delegation" (the Task/Agent tool, custom `.claude/agents/` subagents, parallel vs sequential dispatch, multi-session Command Center). Mentor: **Sam Okoye** (Engineering).
- `ch15` "Advanced Patterns & Scaling" → "Settings, Permissions & Hooks" (settings.json precedence across 3 paths, permission allow/ask/deny, 27 hook events, status line + output styles + headless `claude -p`). Mentor: **Rena Vasquez** (Platform / InfoSec).

**Content folded into surviving chapters** (old material wasn't lost, just relocated):
- Old ch10 "Recursive Refinement" → new `ch09-l04` "Closing the Loop with learnings.md".
- Old ch15 "Multi-file Refactors" → folded into `ch06-l03` as "The Safe Refactor Playbook".
- Old ch15 "Test-driven Prompting" → new `ch06-l05`.
- Old ch15 "Scheduled Automation" → new `ch16-l06`.

**Existing chapters lightly updated**:
- `ch01-l05` version stamp refreshed to v2.1.130.
- `ch03-l01` added the `@filename` import syntax for CLAUDE.md.
- `ch04-l01` bumped from "Four Memory Layers" → "Five Memory Layers" adding the auto-memory system as Layer 5; `ch04-l02` decision rule extended.
- `ch07-l01` added the prompt-caching section (5-min TTL, 10% input rate) + model cost asymmetry note.
- `ch11-l01` slash command table refreshed: added /model, /fast, /agents, /output-style; removed /rewind; clarified Plan-Mode entry via Shift+Tab.
- `ch11-l03` rewritten as "/help, /skills and /agents — Discoverability".
- `ch12-l01` permission modes corrected to default / acceptEdits / plan / bypassPermissions; `ch12-l02` removed defunct `/plan` command, points at Shift+Tab cycle.

**Game-side changes for the new chapters**:
- `play/play.js` `spawnNPC()` extended: `NPC_OVERRIDES[id]` now optionally accepts `name / role / portrait` (in addition to pos/face/scale) so a chapter's lesson-1 NPC can adopt a named mentor persona.
- `data/npc_overrides.js` ships three new mentor overrides: `auto-ch10-l01` → Dr. Priya Engelhardt, `auto-ch14-l01` → Sam Okoye, `auto-ch15-l01` → Rena Vasquez.
- `ZONE_THEMES_BY_ID` in `play.js`: ch10 retitled to "Model Engine Bay", ch14 to "Subagent Dispatch Floor", ch15 to "Guardrail Lab".
- `index.html` cache-bust bumped: `data/curriculum*.js` → `?v=20260530b`, `play/play.js` → `?v=20260530b`.

**Bespoke 3D interactables for the new chapters** (2026-05-30 follow-up):
- `play/world/objectTypes/modelConsole.js` — three glowing engine pillars (Haiku/Sonnet/Opus, sized to tier) on a brushed-metal plinth with a wake-up status screen.
- `play/world/objectTypes/dispatchBoard.js` — wall-mounted board with three columns (TODO/ACTIVE/DONE), pulsing cards, and a green status-LED heartbeat.
- `play/world/objectTypes/permissionsPanel.js` — security panel on a stand with stylised lock icon and three Allow/Ask/Deny indicator lights that breathe on idle and lock-on when hovered.
- Wired in `play.js`'s `buildersByKind` dispatch + new `LESSON_DELIVERY` entries: `ch10` (floor 3, NE quadrant), `ch14` (floor 4, NW quadrant), `ch15` (floor 4, SW quadrant). `lookAt` is now supported on `LESSON_DELIVERY` entries so the object's facing is data-driven.
- Spawn loop now adds `floorBaseY(loc.floor)` to position Y so floor-2+ interactable entries can keep using floor-relative Y in the data.
- The glow ring (parented to scene rather than the interactable group) is now tagged with `floor` so it hides on other floors instead of leaking through.
- Cache-bust: `play/play.js → ?v=20260530c`.

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

## Kedash Protocol — Phase 4 handoff (finale, uncommitted 2026-06-10)

Phase 4 (FIN-01…FIN-08, COPY-04, PROP-05, R-6) is implemented and uncommitted. Cache-bust generation: `?v=20260610e` (play.js, story_lines.js, story_scenes.js, style.css in index.html; same value on play.js's imports of floorM/titleCard/ceremonyManager/npcReactions/npcCasting).

**Trigger chain** (all flags in `ccq_story` via `Story.markSceneSeen`):
ch16-test passed → talking to Marcus plays `marcusDoor` (2 beats) → elevator's blank slot below F1 (present from day one, class `elev-floor-blank`) lights as gold `M` (`elev-floor-m`) → `requestFloorChange(5)` (1600 ms ride) → `loadFloor(5)` builds `play/world/floorM.js` `buildFloorM()` (loft; colliders re-pushed by `registerStaticColliders` via `floorMState`; `learnings_fragment_2` readable at `fragmentSpot`) → Maya NPC there (roster id `maya`, rig `maya` manifest entry → `western_female.glb`; bespoke `maya.glb` later = edit ONLY the manifest `file` field) → `mayaScene` (6 beats, §5.3 verbatim) → onComplete chains `_startFinaleChain()`: ride to F1, +2800 ms, spawn temp cast (`fin-elena`/`fin-rena`/`fin-maya`), `ceremony.startFinale()` (gold VP-of-AI flip, desynced claps ×9, `window.STORY_FINALE` bubble timeline, `setPortraitCelebration(true)` = live hearts + ♥-plaque) → onDone marks `finale` (tier T7) + `applyEpilogueState()` (Maya idles at reception, `newhire` NPC spawns, second child chair by Ines) → talking to the new arrival plays `epilogueArrival` → fade + `showTitleCard('THE KEDASH PROTOCOL')`.

**R-6**: in `start()`'s promotion block, `promotionFor === 'ch16' && !Story.sceneSeen('finale')` consumes `ccq_promotion_for` WITHOUT calling `maybeStartFromFlag()` — the scripted finale is the only VP-of-AI ceremony; other chapters unaffected.

**Other notables**: `floorForNpcDef()` routes Maya (M ↔ F1 post-finale) and respects explicit `def.floor`; `spawnNPCsForFloor` skips `epilogueOnly` defs pre-finale; `stop()` now also resets `loadedFloors`/`currentFloor` (latent re-entry bug fix); PROP-05 cable trays = `buildCableTrays()` in floorM.js, registered as rooms builder `cable_trays`, data entry appended to `office_floor4` in data/rooms.js; COPY-04 Act IV lines live in data/story_lines.js (Act IV block + ines T6/T7, new `aisha`/`maya` entries); finale/epilogue copy in data/story_scenes.js (`marcusDoor`/`mayaScene`/`epilogueArrival` + `window.STORY_FINALE`). All touched JS passes `node --check`; manifest.json parses.

**Fastest playtest path**: admin chapter-skip dropdown in the play-mode toolbar → complete ch16 → talk to Marcus (lobby IT bench) → elevator → M → Maya → ride down auto-plays ceremony → talk to New Arrival at the lobby doors.

## How to start

Begin by running `git log -10 --oneline` and `git status` to confirm the working tree matches what's described here, then wait for the user's next ask. If the working tree has changes you don't recognize, **don't discard them** — surface them to the user.
