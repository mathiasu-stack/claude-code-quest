# THE KEDASH PROTOCOL — Production Plan

**Project:** Claude Code Quest — narrative layer implementation
**Input:** `design/story/kedash_protocol_scenario.md` v1.0 (greenlit)
**Owner:** Art & Design Direction
**Status:** v1.0 — ready for implementation sessions
**Date:** 2026-06-10

This document maps the full scenario onto the actual codebase as it exists today
(commit `ac9c5a1` + the uncommitted character-roster/compass work described in
`RESUME.md`). Every task names the real functions and files an implementation
session will touch, so no re-research is needed.

---

## 1. EXECUTIVE SUMMARY

**Scope.** The Kedash Protocol is a copy-and-staging layer over the existing 16-chapter
game: ~120 new dialogue lines, 15 test-scenario framing appends, 2 interactive twist
set-pieces, a 6–8 minute finale chain (new Floor M room, Maya NPC, ceremony variant,
permanent epilogue state), 8 collectible readable documents, ~6 MUST props/prop-edits,
~12 NICE props, and 4 small narrative systems (tier engine, dialogue-override channel,
ambient line sets, document viewer) plus 1 medium-large one (a scene/cutscene runner).

**What's reused (the scenario was written against this codebase, and it shows):**

- `NPC_OVERRIDES` already supports identity overrides (`name/role/portrait`) — D1 is an
  extension, not a new system.
- `CeremonyManager` already has a capstone path (`chNum === 16` → `isCapstone`), a gold
  "VP of AI" tier title, fanfare/cheer audio, and an NPC clap system. The finale variant
  builds on it.
- The hearts easter egg, CEO portrait, plaque flip, elevator with a **6-floor shaft**
  (only 4 used — Floor M fits inside existing geometry), per-floor lazy loading,
  ambient agents, the interactables registry with glow rings, and the full-screen lesson
  overlay (template for the document viewer) all exist.
- The clap animation is already **perfectly synchronized** across clappers (shared
  `phase = elapsed * 0.012` in `npcReactions.js`) — Ines's "they always clap eight times,
  in perfect unison" line is canon **for free**; only the finale needs de-synced claps.
- Tier flags T0–T7 can be **derived** from `progress.testResults` — no save-schema
  migration needed for the core gate.

**What's new:** the scene runner (multi-beat dialogue with player choices — the only
XL-risk system), Floor M, the Maya/new-arrival/epilogue NPCs, the document viewer,
collectible props, ambient NPCs becoming interactable, and all the copy wiring.

**Headline estimate:** ~38–50 dev-days across 5 phases. Phase 1 (plumbing + Act I) is
shippable in ~1 week and immediately playable. ~60% of total effort is concentrated in
the two set-piece phases (TWIST 1 machinery and the finale chain).

---

## 2. SYSTEM AUDIT

For each system the story leans on: what exists, what must be extended, where.

### 2.1 NPC roster, spawning & `NPC_OVERRIDES`

**Exists.**
- Hand-built roster `NPCS` in `play/play.js` (~line 78–170): `linda, marcus, aisha,
  kenji, diana, ines (kind:'flavor'), sarah` (Floor 1) + `elena, raj, mei, noor`
  (library). Each entry: `{ id, zone, pos:[x,z], face, name, role, portrait, chapterId,
  lessonId|testId, kind:'lesson'|'test'|'flavor', look, intro, nextHint }`.
- Generated NPCs: `generateChapterNPCs(chapterIdx)` (~line 310) builds one NPC per
  lesson + one test assessor from `INTRO_TEMPLATES` / `TEST_INTROS` / `NEXT_HINTS`
  (play.js ~274–292), with **stable ids** `auto-${lessonId}` / `auto-${chapterId}-test`.
- `spawnNPC(npcDef)` (play.js ~3052): merges look, applies floor relocation, then
  applies `window.NPC_OVERRIDES[id]` **last** (~line 3092) — currently supports
  `pos, face, scale, name, role, portrait`. Three mentor personas already ship this way
  in `data/npc_overrides.js` (Engelhardt/Okoye/Rena per RESUME; note current checked-in
  file only has linda/ines position entries — confirm the mentor entries survived the
  last export, see Risk R-9).
- Per-floor spawn: `spawnNPCsForFloor(f)` (~3157); only the current floor's NPCs are
  visible (`mesh.visible = npcFloor === currentFloor`).
- Editor bridge `window.__playApi = { spawnNpcFromDef, removeNpcMesh, getHandBuiltNpcs }`
  — useful for spawning finale/epilogue cast at runtime.

**Extend (ASK-D1).** Add to override entries (or a new parallel data file, see WBS
STORY-03): `linesByTier: { T0:…, T2:…, … }` (intro replacement/append),
`nextHintByTier`, `promptLabel` (for "Talk — Ines has been counting"), and a
`postPassOnce` line slot. Resolution happens in `openDialogue()` — see 2.2.

### 2.2 Dialogue system

**Exists.** `openDialogue(npc)` (play.js ~3655): single-page card (`#play-dialogue`),
portrait + name + role header, one `introText` revealed by `startTypewriter()` with
per-NPC blip pitch (`blipPitchForNpc`), mouth `talkPulse` on flat-face NPCs,
Start-lesson / Take-practical / Bye buttons. The intro is chosen as
`gate ? gate.text : npc.intro` where `computeAheadGate()` soft-gates out-of-order NPCs.
Done-state shows `npc.nextHint`. **There is no multi-beat sequence, no player choice
beyond go/cancel, no mid-dialogue NPC actions.** Flavor NPCs get a single page + "Bye!".

**Extend.**
1. (D1) In `openDialogue`, resolve intro/nextHint through the tier table before the
   gate check: `resolveLine(npc, 'intro', tier)` falling back to `npc.intro`.
2. (New, for set-pieces) A **scene runner**: an ordered list of beats
   `{ speaker, text, choices?, action? }` rendered in the same dlg-card chrome,
   advancing on click/choice, with hooks for world actions (point at NPCs, route
   ambient actors, open document viewer, trigger hearts). This is WBS STORY-04 and is
   the critical-path new system — TWIST 1, TWIST 2, the finale, and the epilogue
   closing exchange all run on it.
3. Prompt label override: `promptEl.textContent` is set at play.js ~4448
   (`Talk to ${name} — press E or tap`); read `promptLabel` from the override there.

### 2.3 Ceremony

**Exists.** `play/ceremony/ceremonyManager.js` (255 lines). Trigger: `ui/test.js` sets
`sessionStorage.ccq_promotion_for = ch.id` on a fresh pass (test.js ~211); play.js
start() calls `ceremony.maybeStartFromFlag()` after 400 ms (~4722). Once-per-chapter
guard via `localStorage.ccq_promotion_fired` (a JSON array → Set). Sequence: spotlight →
`unveilForTier` → `animateTitleTransition` (3D card flip, `TIER_TITLES[9] = 'VP of AI'`)
→ `spawnNpcReactions` (≤3 nearby clappers, 5.5 s, **synchronized** clap phase) → dance →
fanfare/cheer → toast. `_announcerForChapter()` maps chapter → assessor NPC id.
`isCapstone` (ch16) already lengthens everything and uses 6 cheer voices.

**Extend (ASK-A5).** A `startFinale()` variant: relocate to Floor 1 lobby beneath the
portrait, spawn the full named cast (via `spawnNpcFromDef` with temporary defs),
raise `MAX_CLAPPERS`, give each clapper a **random phase offset** (one-line change to
the shared `phase` computation in `npcReactions.js` line ~78, parameterized), pop
scripted lines (Linda/Sarah/Elena/Rena/Marcus/Maya, §5.4) as timed speech bubbles or
sequential beats, trigger the portrait hearts + plaque flip live (see 2.4), and chain
from the Floor M Maya scene rather than from `ccq_promotion_for` (which will already
have fired the normal ch16 capstone ceremony — see Risk R-6 for sequencing).

### 2.4 CEO portrait & hearts easter egg

**Exists.** `buildCeoPortrait(targetScene)` (play.js ~1401): wood frame + gold trim +
canvas-drawn manga portrait (`drawCeoPortrait`) + plaque label sprite. At **build time**
it checks `allDone = CURRICULUM.every(ch => isTestPassed(...))`; if true the plaque
reads `♥  Maya Kedash · CEO  ♥` on a pink background and a `ceoHearts` group of 8 ♥
sprites is added (animated in `update()` ~4392, cleared in `stop()` ~4947). The group
flows through the rooms loader (`data/rooms.js` reception entry, pos `[0, 2.0, -10.86]`)
so it's editor-selectable. **There is no inspect interaction and no live re-trigger.**

**Extend.**
- (ASK-A23) Register the portrait group with `registerInteractable()`
  (`play/world/interactables.js` — gives prompt + glow + `onInteract`) and open a small
  inspect text (or the document viewer) with tier-keyed copy from §6.3.
- (ASK-A5) Refactor hearts/plaque into `setPortraitCelebration(on)` so the finale
  ceremony can flip them live instead of only at next build.
- (ASK-A24, NICE) eye-glint: brief emissive/overlay flash on the canvas texture when a
  test passes within line of sight.
- (ch01 env beat) warm key light: add a small warm `PointLight` to the group — codifies
  "lit slightly warmer than the room". Trivial.

### 2.5 Elevator & floor gating

**Exists.** `play/world/elevator.js` `buildElevator()`: shaft is built for
`FLOOR_COUNT = 6` at `FLOOR_HEIGHT = 4.5` — **two spare floors of shaft already
exist above Floor 4**, so Floor M (as internal floor 5) needs no shaft work. Returns
`{ callButtonPos, snapCabToFloor(floorIdx), … }`; per-floor indicator painted via canvas
(`paintIndicator`, `FLOOR ${f}`). Floor selection is a **DOM modal**
(`#play-elevator-modal`, `openElevatorModal()` play.js ~4808) listing F4→F1, locked by
`progress.badgeFloor` (engine/progress.js: `applyBadgeBumpsIfDue()` recomputes from
`testResults` by **display order**, `FLOORS_TOTAL = 4` in both files).
`requestFloorChange(f)` (~4849) fades, snaps cab, lazy-`loadFloor(f)`, swaps visibility
via `applyFloorVisibility()`, spawns player at the elevator door (x=11, z=-7.6 each
floor, `floorBaseY(f)`).

**Extend (ASK-A1).**
- Always render a **blank, disabled slot below F1** in the modal from day one; after T7
  it becomes a glowing `M` button. Optionally mirror a small blank plate on the 3D call
  button housing (compound child via `placeCompoundChild`).
- `requestFloorChange(5)` must work: `floorBaseY(5)`, `loadFloor(5)` building Floor M
  (see 2.10), exclusion of floor 5 from `badgeFloor` math (it's story-gated, not
  badge-gated — gate on tier === T7 && finale not yet done).
- (ASK-A22, NICE) distinct chime + music cut during the M ride: hooks exist —
  `AudioManager` (`play/audio/AudioManager.js`) + procedural synth (`procedural.js`)
  + per-zone music (`zoneConfig.js`); the ride is the 450 ms+ fade window in
  `requestFloorChange`, lengthen for the M ride.

### 2.6 Ambient NPCs & line sets

**Exists.** `play/world/liveAgents.js` (280 lines): `ROUTINES` for marcus/aisha
(waypoint loops), Linda door-greeting, and `AmbientAgents` — **4 (desktop) / 2 (mobile)**
procedural extras on randomized waypoint loops. Ambient agents are added straight to the
scene, are **not interactable** (no `userData.npc`, not in `npcMeshes`), and have **no
lines at all**. The "six lines" in the current game are `INTRO_TEMPLATES` (play.js ~274)
— but those belong to **generated lesson mentors**, not background staff.

**Extend (ASK-D3).** Decision embedded in this plan (flag to owner, Open Question Q3):
give ambient agents `userData.npc = { kind:'flavor', name:…, role:… }` and push them
into `npcMeshes` so the existing E-to-talk pipeline serves the six-line loop, with the
act-gated sets from §6.1 in a new `data/story_ambient.js`. Loop-anchor logic: line 1
fixed, lines 2–6 cycled per agent. The named loop actors TWIST 1 needs ("blue-folder
guy", "Tania" + water-cooler partner) should be **dedicated scripted lobby NPCs**, not
drawn from the 4-agent ambient pool (which is too small and mobile-capped at 2) — see
WBS TWIST1-02.

### 2.7 Interaction prompts & interactables

**Exists.** Proximity scan in `update()` (play.js ~4406–4455) over `npcMeshes`,
`interactObjects`, elevator call button; prompt text set per kind.
`play/world/interactables.js`: `registerInteractable({...})` (mesh + glow ring +
`getPromptText()` + floor tagging), `nearestInteractable`, `updateInteractables` —
already used by phone/computer/book/whiteboard/server/display + the three bespoke
chapter props. `LESSON_DELIVERY` map in `play/world/lessonRegistry.js` (note: the ch16
"NAS server" interactable currently lives on **Floor 1** at `[-12, 0, -31]` in the
west-wing library — see Risk R-3).

**Extend.** Collectible documents (ASK-A16) and the portrait inspect ride this registry
unchanged; only a new lightweight prop builder + an `onInteract → document viewer` hook
are needed.

### 2.8 Progress, persistence & tier flags

**Exists.** `engine/progress.js`, key `ccq_progress`: `testResults` map (per-test
`{passed, score, attempts}`), `completedLessons`, `badgeFloor`, `isTestPassed()`. Other
keys: `ccq_promotion_fired` (ceremony guard), `ccq_play_intro_seen`, session keys
`ccq_promotion_for` / `ccq_dance_for` / `ccq_play_pos`, admin keys.

**Extend (ASK-D2).** New module `play/story/storyState.js`:

```
T1 ← isTestPassed('ch01-test')      T5 ← isTestPassed('ch10-test')
T2 ← isTestPassed('ch12-test')      T6 ← isTestPassed('ch15-test')
T3 ← isTestPassed('ch04-test')*     T7 ← isTestPassed('ch16-test')*
T4 ← isTestPassed('ch09-test')
```

Tier is **derived, never stored** → zero migration for existing saves. The `*` entries
additionally require their twist/finale **scene-seen** flag before advancing ambient
sets (T3 strictly "post-TWIST 1" per §4.1; T7 "post-finale"). Scene-seen flags + 8
collectible read flags + epilogue flag live in a new localStorage key `ccq_story`
(keeps `ccq_progress` schema untouched; `Progress.reset()` must also clear it).
Twist triggers must be **state-based** (checked on play entry / proximity), not
event-based, so saves that pass tests in the 2D app without entering 3D still get
their scenes (see Risk R-1).

### 2.9 Room editor & data-driven scene

**Exists.** `data/rooms.js` + `play/world/roomsLoader.js` + builder registry
(play.js ~1486–1560) + `play/editor/roomsEditor.js` + `save.php` export path. New props
should be registered builders dispatched from `data/rooms.js` entries so they're
editor-placeable from day one (`decoration`/`builder` types, tagged `_roomId`/
`_roomEntryIndex`).

### 2.10 Floors & rooms (for Floor M)

**Exists.** Single-floor loading: `loadFloor(f)` builds floor geometry + NPCs lazily;
`applyFloorVisibility()` hides everything tagged with a different `floor`; floor office
layouts for F2–4 are quadrant grids; `FLOOR_HEIGHT_Y = 4.5`. Atrium/elevator span
floors.

**Extend (ASK-A4).** Floor M = internal floor 5: a single bespoke room builder
(`play/world/floorM.js`), registered in `loadFloor`, all-procedural (monitor wall =
canvas textures showing stylized floor views; rack reusing the ch16 server-prop look;
camp bed, plants, desk + 16 folder stacks from box geometry; reversed portrait = the
portrait builder with the photo plane flipped/back shown). No skybox/exterior changes
needed (sky already exists; Floor M can be windowless — cheaper and on-theme).

### 2.11 Audio

**Exists.** `AudioManager` (WebAudio, ~340 lines, shared singleton), `procedural.js`
(`playFanfare`, `playCheer`, `playUi`, `playDialogueBlip` + synth helpers), per-zone
music/ambience via `zoneConfig.js` (mp3 files in `play/assets/audio/`).

**Extend.** All new audio (M-chime, anomaly sting, hum pitch-drop) can be **procedural
synth** — zero new asset weight on the NAS. Hum drop = a sustained oscillator/noise bed
whose frequency steps down ~6% (a semitone) on the ch16 pass flag.

### 2.12 2D app shell (copy surfaces)

`data/curriculum.js` / `curriculum2.js`: `practicalTest.scenario` strings (+
`scenarioType/From/Role/Avatar`) — D4's append targets; rendered by `ui/test.js`
(which also sets the ceremony flag on pass). No structural change needed; appends are
plain-string edits. `ui/lesson.js` / `dashboard.js` need **no** changes (Educational
Integrity Rule: lesson bodies untouched).

---

## 3. WORK BREAKDOWN STRUCTURE

Effort scale: **S** ≤ 2 h · **M** ≈ half-day · **L** ≈ 1–2 days · **XL** > 2 days.
"Copy" = pure data/string work, no logic.

### 3.1 Narrative systems (the plumbing)

| # | Task | Description | Files | Assets | Depends | Effort | Tag |
|---|---|---|---|---|---|---|---|
| SYS-01 | Tier engine (ASK-D2) | `play/story/storyState.js`: `deriveTier(progress)` from `testResults` per §1.6 table; `sceneSeen(id)` / `markSceneSeen(id)` / collectible flags in `localStorage.ccq_story`; export via import + `window.Story` for non-module surfaces. Wire `Progress.reset()` to clear `ccq_story`. | new `play/story/storyState.js`; `engine/progress.js` (reset hook); `play/play.js` (import) | — | — | M | MUST |
| SYS-02 | Dialogue-override channel (ASK-D1) | Extend override resolution: new data file `data/story_lines.js` → `window.STORY_LINES = { [npcId]: { promptLabel?, introByTier?, introAppendByTier?, nextHintByTier?, postPassOnceByTier? } }`. Resolve in `openDialogue()` (play.js ~3655) before the gate branch, and in the prompt writer (~4448). Covers hand-built ids (`linda`, `kenji`, `sarah`, `elena`, `raj`, `noor`, `ines`) and generated ids (`auto-ch05-l01`, `auto-ch06-test`, …). Keep `data/npc_overrides.js` for positions only (editor owns it) — story copy lives in the new file so editor exports never clobber it. | `play/play.js`; new `data/story_lines.js`; `index.html` (script tag, loads after curriculum) | — | SYS-01 | L | MUST |
| SYS-03 | Scene runner | Multi-beat dialogue sequences in the existing dlg-card chrome: `runScene([{ speaker:{name,role,portrait,npcId?}, text, choices?:[{label, next?}], action?:fn }])` with typewriter + blips reuse, input lock, world-action hooks (face/point, route actor, open doc viewer, trigger FX), scene-seen marking on completion, and abort-safety (re-runs if interrupted before final beat). | new `play/story/sceneRunner.js`; `play/play.js` (mount + input lock); `style.css` (choice buttons) | — | SYS-01 | XL | MUST |
| SYS-04 | Ambient bark system (ASK-D3) | Make ambient agents interactable flavor NPCs: in `liveAgents.js` `_spawnAmbient()`, attach `userData.npc = { id:'ambient-N', kind:'flavor', name, role:'Kedash Staff', portrait, intro:<line from act set> }` and register into `npcMeshes`. New `data/story_ambient.js` with the 5 act sets (6 lines each, §6.1); set selected by `deriveTier()` + post-finale flag; line index per agent with the loop-anchor rule (line 1 fixed). Give the three named loop actors (TWIST1-02) their own entries. | `play/world/liveAgents.js`; new `data/story_ambient.js`; `play/play.js` | — | SYS-01 | L | MUST |
| SYS-05 | Document viewer (ASK-A3) | Full-screen monospace reader styled like an internal memo / terminal `cat`; modeled on `play/lessons/overlay.js` (`mountLessonOverlay` — input lock + music duck pattern). API: `openDocument({ title, body, onClose })`; body is preformatted text (the cycle reports, client-profiles.md, learnings fragments, house rules). Esc/E/click to close. | new `play/story/docViewer.js`; `style.css` | — | — | M | MUST |
| SYS-06 | Collectible props (ASK-A16) | One reusable builder `buildReadableNote({label})` (folded paper / folder / framed memo variants, box+plane geometry, canvas label) registered as a rooms-builder kind `readable_note`, placed via `data/rooms.js` entries (editor-tunable) at the 8 spots in §6.2; `registerInteractable` glow + `onInteract → openDocument`; read-state via SYS-01 flags; tier-gated visibility (cycle reports only readable T5+ per §4.2 — before that, prompt shows "Locked — internal"; or simply invisible pre-T5, recommend visible-but-locked for foreshadowing). | new `play/world/objectTypes/readableNote.js`; `data/rooms.js`; `play/play.js` (builder registry + spawn loop) | doc texts (COPY-06) | SYS-01, SYS-05 | L | MUST |
| SYS-07 | Test framing appends (ASK-D4) | Append the §3 framing sentences to 15 `practicalTest.scenario` strings (ch14 explicitly untouched). Pure copy. Verify with `bash scripts/audit/run-all.sh` + a manual read that no append contains pass-criterion keywords (evaluator only reads submissions, but keep the hygiene rule). | `data/curriculum.js`, `data/curriculum2.js` | — | — | S | MUST |

### 3.2 Copy batches (wiring the §3 scripted lines through SYS-02)

All effort here assumes SYS-02 exists; the dialogue text is final-draft in the scenario
and is paste-ready.

| # | Task | Contents | Files | Effort | Tag |
|---|---|---|---|---|---|
| COPY-01 | Act I lines | Linda ×2 (T0), Kenji flourish (T0), Sarah T1 post-pass ("You did better than the last one"), `auto-ch05-l01` + `auto-ch05-test` (T1), `auto-ch06-l04` + `auto-ch06-test` Marcus relay (T2), `auto-ch12-l03` (T1) + `auto-ch12-test` post-pass Sarah elevator line (T2). | `data/story_lines.js` | M | MUST |
| COPY-02 | Act II lines | `auto-ch11-l01`/`l04` (T2), `auto-ch03-l02`/`l04` (T2), Elena glitch + re-talk (T2), Raj (T2), Noor (T3), `auto-ch04-l01` (T2) + `auto-ch04-test` T3 handoff, Ines pre-beat clap-count line (T2). | `data/story_lines.js` | M | MUST |
| COPY-03 | Act III lines | `auto-ch07-l02` (T3) + assessor Marcus note (T3), `auto-ch08-l01`/`l03` (T3) + `auto-ch08-test`, `auto-ch09-l02` (T3) + `auto-ch09-test` T4 reveal, Engelhardt (`auto-ch10-l01`) T4 intro + lesson-4 close + test framing. | `data/story_lines.js` | M | MUST |
| COPY-04 | Act IV lines | `auto-ch13-l01`/`l04` (T5), Sam Okoye lessons 1+3 (T5), Rena lessons 1+2 (T5) + post-pass T6 card line, `auto-ch16-l01`/`l05` (T6), Aisha T2 line, post-pass Ines idle swap lines. | `data/story_lines.js` | M | MUST |
| COPY-05 | Ambient sets | 5 × 6 lines from §6.1, verbatim, into `data/story_ambient.js`. | `data/story_ambient.js` | S | MUST |
| COPY-06 | Collectible documents | Write the 6 full one-page Cycle Reports (scenario gives header format + summaries — full memo bodies need authoring at ~120–180 words each, matching M.K.'s voice), learnings fragments 1+2 (verbatim from §3/§6.2), annotated `client-profiles.md` (verbatim §4.2), `HOUSE RULES — M.K., year 1` body (3 rules mirroring the ch03 test conventions, verbatim from curriculum strings). | new `data/story_docs.js` | M | MUST |
| COPY-07 | Portrait inspect texts | 5 tier texts from §6.3, keyed T0/T2/T3/T5/T7. | `data/story_docs.js` | S | MUST |

### 3.3 Set-pieces & staged moments

| # | Task | Description | Files | Depends | Effort | Tag |
|---|---|---|---|---|---|
| TWIST1-01 | TWIST 1 scene (ASK-A2) | State-based trigger: tier ≥ would-be-T3 (`ch04-test` passed) && `!sceneSeen('twist1')` && player within ~4 m of Ines → her `promptLabel` becomes "Talk — Ines has been counting"; talking runs the §4.1 script through SYS-03 (5 beats, 5 single-choice advances). On completion: `markSceneSeen('twist1')` (this is what flips T3), ambient set → Act III, Ines idle line swap. | `play/play.js` (trigger + Ines hook); scene data in `data/story_scenes.js` | SYS-03, SYS-04 | L | MUST |
| TWIST1-02 | Loop actors staging | Three dedicated scripted lobby NPCs ("blue-folder man" — give him a folder prop, lobby loop; "Tania" + partner at the water cooler) added to the Floor-1 roster as flavor NPCs with `liveAgents`-style waypoints. During the scene, an action hook routes blue-folder man to the cooler and pops their two lines + laugh on cue (speech bubbles above heads — reuse `makeNpcNameTag` sprite technique in `play/ui/nameTags.js`, or temporary dlg beats). They double as guaranteed six-line-loop carriers on desktop AND mobile (ambient pool is capped at 2 on mobile — these three are exempt). | `play/play.js` (roster), `play/world/liveAgents.js` (routines), `play/ui/nameTags.js` (bubble variant) | SYS-04 | L | MUST |
| TWIST2-01 | TWIST 2 scene (ASK-A3 payload) | State-based: `ch10-test` passed && `!sceneSeen('twist2')` → Engelhardt (`auto-ch10-l01`) prompt changes; her dialogue runs §4.2 through SYS-03, mid-scene action opens the annotated `client-profiles.md` in the doc viewer. Completion → T5: ambient set Act IV, cycle reports unlock, portrait T5 text, elevator F4 clearance chime (S audio cue on next F4 ride). | `data/story_scenes.js`; `play/play.js` | SYS-03, SYS-05, COPY-06 | M | MUST |
| CURTAIN-01 | Act I curtain (ASK-A10) | In `requestFloorChange(2)`, first ride only (`!sceneSeen('curtain1')`): before the fade, all visible Floor-1 NPCs + ambient agents `lookAt` the elevator for 2 s (reuse the turn logic from `npcReactions.js` `spawnNpcReactions` turn step), then fade proceeds. Optional soft sting (ASK-A25 reuse). | `play/play.js` (`requestFloorChange`) | SYS-01 | M | MUST |
| PROP-01 | House Rules frame (ASK-A12) | Framed yellowed printout prop (plane + canvas texture, frame box) near the ch03 zone door; `registerInteractable` → doc viewer with the 3 matching rules. Builder kind reusable for A8/A15/A17 NICE wall props. | new `play/world/objectTypes/wallDocument.js`; `data/rooms.js` | SYS-05/06 | M | MUST |
| PROP-02 | Dispatch board ghosts (ASK-A19) | In `buildDispatchBoard` (`play/world/objectTypes/dispatchBoard.js` — columns at line ~57, cards ~86): add 3 low-opacity "ghost" cards labeled `CYCLE 01–03` in DONE and one bright `CYCLE 07` card in ACTIVE (canvas labels on card faces). | `dispatchBoard.js` | — | S | MUST |
| PROP-03 | Permissions panel lock-green (ASK-A20) | `buildPermissionsPanel` (`permissionsPanel.js`, `update(dt, hovered)` at ~146): add a `locked` state — when `isTestPassed(progress,'ch15-test')`, all three `lightMats` go steady green emissive (color swap + intensity 1.0), idle cycling disabled. Check the flag at build + on play re-entry. | `permissionsPanel.js`; `play/play.js` (pass flag in) | — | S | MUST |
| PROP-04 | Portrait inspect (ASK-A23) | Register portrait via `registerInteractable`; `onInteract` → small inspect card (doc viewer compact mode) with tier text. Include the warm key light (ch01 env beat) while in here. | `play/play.js` (`buildCeoPortrait` + registry) | SYS-01, COPY-07 | M | MUST |
| PROP-05 | Floor 4 cable trays (ASK-A18) | Procedural set dressing: 3–4 dark tray boxes + tube bundles along Floor 4 ceiling edges converging at the elevator shaft, plus a vertical run continuing **above** the F4 ceiling line inside the shaft (visible through the shaft opening). ~30 boxes/tubes, one material. | `data/rooms.js` entry + small builder (can live in `floorM.js` module) | — | M | MUST |
| PROP-06 | Badge printer (ASK-A7) | Desk-top printer box behind Linda, small canvas status screen `LAST JOB: 1 BADGE — 6 DAYS AGO`; inspectable (one-line viewer). | `wallDocument.js` variant or own builder; `data/rooms.js` | — | S | NICE |
| PROP-07 | Team photos wall (ASK-A8) | 4–6 frames, same canvas-drawn stock-office image at different crops, ch05 zone wall. | `wallDocument.js`; `data/rooms.js` | PROP-01 | S | NICE |
| PROP-08 | CX-13–18 folder (ASK-A9) | Open filing-cabinet drawer + single folder prop, File Workshop; inspect text = folder label only. | `readableNote.js` variant; `data/rooms.js` | SYS-06 | S | NICE |
| PROP-09 | Seats dashboard (ASK-A11) | Wall display, canvas usage charts cycling 2–3 frames, `ACTIVE SEATS: 1` legible up close. Reuse display-prop pattern from existing `display` interactable. | new small builder; `data/rooms.js` | — | M | NICE |
| PROP-10 | Library dressing (ASK-A13) | Blank spines above reach: texture tweak in `play/decorations/library.js` bookshelf builder (upper rows → uniform blank material). Grandfather clock pinned at 9:41: find clock in `decorate_library`/compound children and fix hand rotation. | `play/decorations/library.js` | — | S | NICE |
| PROP-11 | Token counter (ASK-A14) | Wall counter `TOKENS SINCE LAST HUMAN CONVERSATION`, canvas texture ticking via its registered `update()` (interactables registry already ticks `updateInteractables`); resets to 0 when `openDialogue` fires on Floor 3. | new builder; `play/play.js` (reset hook) | — | M | NICE |
| PROP-12 | EOTM corkboard (ASK-A15) | Corkboard + 6 cards, each card face = the `drawCeoPortrait` canvas at decreasing scales. Reuses the existing portrait draw call. | `wallDocument.js` variant | PROP-01 | S | NICE |
| PROP-13 | REC mirror (ASK-A17) | "Mirror" = dark reflective-ish plane (env-map or simple gradient) + red REC dot sprite, Methodology Lab. No real reflection (perf). | small builder | — | S | NICE |
| AUDIO-01 | Anomaly sting (ASK-A25) | Procedural soft room-tone swell in `procedural.js`; exposed as `playAnomalySting()`; called by SYS-02 when a line flagged `sting:true` is shown. | `play/audio/procedural.js`; SYS-02 hook | SYS-02 | S | NICE |
| AUDIO-02 | Floor M chime + music cut (ASK-A22) | New chime synth; in `requestFloorChange(5)` suppress zone music during the (lengthened ~2.5 s) ride. | `procedural.js`; `play/play.js` | FIN-01 | S | NICE |
| AUDIO-03 | Server hum drop (ASK-A21) | Sustained procedural hum bed near the server rack zone; frequency −1 semitone once `ch16-test` passed. | `procedural.js`; `AudioManager.js` zone hook | — | M | NICE |
| AUDIO-04 | Eye glint (ASK-A24) | On `ccq_promotion_for` consumption while portrait in frustum + same floor: 1-frame white glint sprite at eye positions. | `play/play.js` | PROP-04 | S | NICE |

### 3.4 Finale chain (§5)

| # | Task | Description | Files | Depends | Effort | Tag |
|---|---|---|---|---|---|
| FIN-01 | Elevator M button (ASK-A1) | Blank slot row below F1 in `openElevatorModal` from day one (disabled, unlabeled, subtly styled); at tier T7-eligible (`ch16-test` passed) + Marcus door scene seen → glowing `M`. `requestFloorChange(5)` path; story gate, not `badgeFloor`. Optional 3D blank plate on call-button housing. | `play/play.js` (~4808 modal, ~4849 floor change); `play/world/elevator.js` (plate) | SYS-01 | M | MUST |
| FIN-02 | Floor M room (ASK-A4) | `play/world/floorM.js` builder invoked from `loadFloor(5)`: one ~14×8 m room — monitor wall (8–12 canvas-texture screens incl. one showing a stylized lobby), rack (reuse ch16 server prop builder), camp bed, 3–4 plants (reuse existing decoration assets in `play/decorations/decorationAssets.js`), long desk + 16 folder-stack boxes, reversed portrait twin (portrait group, photo plane facing wall), warm practical lighting, `learnings.md fragment 2` readable on the desk (SYS-06). Colliders via `rebuildColliders` pattern. | new `play/world/floorM.js`; `play/play.js` (`loadFloor`, `floorBaseY`, visibility) | FIN-01 | XL | MUST |
| FIN-03 | Maya NPC (ASK-A26) | Roster def `{ id:'maya', kind:'flavor→scene', floor 5 }`; rig: `western_female` from `play/assets/characters/manifest.json` (idle/walk via existing clips). Bespoke look: **recommend Meshy `meshy_retexture` (~10 credits)** on western_female for the cardigan-over-blazer palette → new GLB `maya.glb` + manifest entry (`statureVary:false`); fallback if credits declined: default rig + distinct name tag + portrait-matched accent (acceptable, she's met in a dim loft). | `play/play.js` roster; `manifest.json`; `npcCasting.js` | FIN-02 | M (+Meshy) | MUST |
| FIN-04 | Server-room door beat (§5.1) | Marcus finale dialogue: state-based — `ch16-test` passed && `!sceneSeen('marcusDoor')` → Marcus (Floor 1 NPC; see Risk R-3 for where "the server-room door" is) gets prompt override + SYS-03 scene (2 beats + 1 choice). Completion lights the M button. | `data/story_scenes.js`; `play/play.js` | SYS-03, FIN-01 | M | MUST |
| FIN-05 | Maya scene (§5.3) | SYS-03 scene, 6 beats + 4 choices, run on approaching Maya on Floor M. Completion → `sceneSeen('mayaScene')`, auto-ride to Floor 1 (reuse `requestFloorChange(1)` under fade) and chain FIN-06. | `data/story_scenes.js` | FIN-02/03, SYS-03 | M | MUST |
| FIN-06 | Finale ceremony (ASK-A5, §5.4) | `CeremonyManager.startFinale()`: spawn ceremony cast on Floor 1 lobby (named mentors + Maya + Ines via `window.__playApi.spawnNpcFromDef`, capped ~14), gold VP-of-AI title flip (capstone path exists), de-synced claps (per-clapper random phase offset + raise `MAX_CLAPPERS` for finale), 5 scripted line pops on a timeline (speech bubbles), live hearts + plaque flip via `setPortraitCelebration(true)` (PROP-04 refactor), Ines hearts line. Guard: ch16's **normal** capstone ceremony already fires from `ccq_promotion_for` — the finale ceremony is a *separate, later* event triggered by FIN-05, so no flag collision (see R-6 for the recommended ordering). | `play/ceremony/ceremonyManager.js`; `npcReactions.js` (phase param); `play/play.js` | FIN-05, PROP-04 | XL | MUST |
| FIN-07 | Epilogue state (ASK-A6, §5.5) | Permanent post-finale world (flag in `ccq_story`): Maya idle NPC near reception (re-talk line), second child chair at Ines's spawn (rooms entry gated by flag), Ines line swap, NEW ARRIVAL flavor NPC at the doors (AUTO_POOL rig, visitor-badge name tag), proximity-triggered closing exchange (SYS-03, 2 beats) ending in fade-to-title card `THE KEDASH PROTOCOL` (DOM overlay), post-finale ambient set (COPY-05). | `play/play.js`; `data/story_scenes.js`; `style.css` (title card) | FIN-06, SYS-04 | L | MUST |
| FIN-08 | Finale/epilogue copy wiring | §5.1–5.5 dialogue (verbatim) into `data/story_scenes.js`. | `data/story_scenes.js` | — | S | MUST |

### 3.5 Verification & deploy hygiene (every phase)

Per project convention: `node --check` all touched JS, `bash scripts/audit/run-all.sh`
green, cache-bust `?v=YYYYMMDD<letter>` on touched scripts in `index.html`
(`data/*.js` is already `?t=Date.now()`-busted), new script tags respect load order
(story data files load **after** `curriculum2.js`, before `app.js`), deploy via
`nas-deploy`. Add a small audit rule: every `STORY_LINES` key must match an existing
NPC id pattern (`^(linda|marcus|…|auto-ch\d\d-(l\d\d|test))$`).

---

## 4. ASSET LIST

Guiding constraint: NAS-served page, no build step, character GLBs already cost
~150 MB warm-cache. **Default sourcing for every prop is procedural Three.js geometry +
canvas textures (≈0 bytes shipped, KBs of JS)** — this also matches the existing art
style (every current prop is procedural). Meshy is reserved for the one case where
procedural can't deliver: Maya's bespoke skin.

### 3D / textures

| Asset | For | Sourcing | Budget |
|---|---|---|---|
| Maya Kedash character | FIN-03 | **Meshy retexture of `western_male/female` rig (~10 credits)** → reuses existing 24-bone rig + walk/run clips, no re-rig needed. Fallback: stock `western_female`, zero cost. | ≤ existing rig size (~15 MB GLB — only loaded with Floor M / epilogue) |
| New-arrival NPC | FIN-07 | Reuse AUTO_POOL rig + `statureVary` | 0 new bytes |
| 3 loop-actor NPCs | TWIST1-02 | AUTO_POOL rigs + procedural folder prop | 0 new bytes |
| Floor M room kit (monitor wall, rack, camp bed, desk, folder stacks) | FIN-02 | Procedural (box/plane geo + canvas screens); rack/plants reuse existing builders (`server` prop, `decorationAssets.js`) | < 200 draw calls target for the room; canvas textures ≤ 512² each, ~10 screens |
| Reversed portrait twin | FIN-02 | Reuse `buildCeoPortrait` group, flipped | 0 |
| Readable-note prop (×8 + variants) | SYS-06 | Procedural; one shared geometry, per-instance canvas label | trivial |
| Framed wall documents (house rules, photos, corkboard, mirror) | PROP-01/07/12/13 | One `wallDocument.js` builder, canvas faces | ≤ 512² canvas each |
| Badge printer, seats display, token counter, folder/drawer | PROP-06/09/11/08 | Procedural | trivial |
| Cable trays | PROP-05 | Procedural tubes/boxes, 1 material | ~30 meshes; consider merged geometry |
| Dispatch ghost cards / permissions green state | PROP-02/03 | Edits to existing procedural props | 0 |
| Stock-office "team photo" image | PROP-07 | **Canvas-drawn** stylized office (matches manga-canvas portrait style); avoid real CC0 photos (style clash + file weight) | 0 files |

### Audio

| Asset | For | Sourcing | Budget |
|---|---|---|---|
| Floor M chime | A22 | Procedural synth in `procedural.js` | 0 bytes |
| Anomaly sting | A25 | Procedural (filtered noise swell) | 0 bytes |
| Server hum + semitone drop | A21 | Procedural oscillator bed | 0 bytes |
| Finale ragged applause | FIN-06 | Layer existing `playCheer` voices with random offsets | 0 bytes |
| (Optional) Floor M ambient track | FIN-02 | Only if owner wants it: short loop mp3 ≤ 1 MB in `play/assets/audio/music/` via `zoneConfig.js` | ≤ 1 MB |

### UI

| Asset | For | Sourcing |
|---|---|---|
| Scene-runner choice buttons | SYS-03 | CSS, extends `.dlg-actions` |
| Document viewer chrome | SYS-05 | CSS + DOM, memo/terminal styling |
| Title card `THE KEDASH PROTOCOL` | FIN-07 | DOM overlay + CSS animation |
| Elevator blank/M slot styling | FIN-01 | CSS on `.elev-floor-btn` |
| Speech-bubble name-tag variant | TWIST1-02, FIN-06 | Canvas sprite, extends `play/ui/nameTags.js` |

**Meshy total if all recommendations accepted: ~10 credits (Maya retexture only).**
No other generation is justified — everything else is cheaper, lighter, and more
style-consistent done procedurally.

---

## 5. PHASED DELIVERY PLAN

Each phase ships a playable, deployable increment (compound deploys per project
convention). MUST items only unless noted; NICE items batch into Phase 5.

### Phase 1 — Plumbing + Act I (copy-heavy, light code) · ~6–8 days
SYS-01 (tier engine), SYS-02 (dialogue channel), SYS-07 (all 15 test framing appends —
copy-only, safe to ship in one pass), COPY-01, PROP-04 portrait inspect (first visible
story feature) + portrait warm light, PROP-06 badge printer (cheap, sells Chapter 1's
beat — promoted from NICE because it's S).
**Ships:** Acts I anomalies live end-to-end; tier gating proven; zero risk to lessons.
**Mix:** ~50% copy.

### Phase 2 — The world performs + TWIST 1 (code-heavy) · ~9–11 days
SYS-03 (scene runner — the critical-path system, built here against the most
demanding consumer), SYS-04 + COPY-05 (ambient flavor NPCs + act line sets),
TWIST1-01/02, CURTAIN-01, PROP-01 house rules frame, COPY-02.
**Ships:** Floor 1–2 fully story-dressed; the Act-break sting; the game's first
set-piece.
**Mix:** ~75% code.

### Phase 3 — The Program + TWIST 2 (balanced) · ~7–9 days
SYS-05 (doc viewer), SYS-06 (collectibles), COPY-03, COPY-06/07, TWIST2-01,
PROP-02 (dispatch ghosts), PROP-03 (permissions green).
**Ships:** Floor 3 arc, the predecessor reveal, all 8 collectibles hidden in the world.
**Mix:** ~55% code.

### Phase 4 — The Operator + Finale (code-heavy, biggest phase) · ~12–15 days
COPY-04, PROP-05 (cable trays), FIN-01…FIN-08 in order (M button → Floor M → Maya →
door beat → Maya scene → finale ceremony → epilogue).
**Ships:** the complete game, T0→T7, credits-equivalent ending.
**Mix:** ~85% code. Recommend an internal milestone split: 4a = Floor M reachable +
Maya scene; 4b = ceremony + epilogue.

### Phase 5 — Polish & NICE pass · ~5–7 days
PROP-07…13, AUDIO-01…04, A24 glint, clap-count pin (tune `npcReactions.js`
`CLAP_DURATION_MS`/frequency so the loop reads as exactly 8 claps — S), any cut/swap
decisions from Risks. Items here are individually droppable with zero story damage
(§6.4 explicitly says the Ines line works even if claps aren't pinned).
**Mix:** ~70% code, all small.

**Total: ~39–50 dev-days.** Critical path: SYS-01 → SYS-02 → SYS-03 → TWIST1 → (FIN
chain). Phases 1 and 3 can partially parallelize with 2 and 4 if two implementation
streams exist (copy batches are independent of the scene runner).

---

## 6. RISKS & OPEN QUESTIONS

### Risks

- **R-1 — Existing saves / mid-progress players.** Tier is derived from `testResults`,
  so a player who already finished the game derives T7 instantly and would skip every
  twist. Mitigation built into this plan: twist triggers are **state-based** (flag +
  proximity), so a finished save still gets TWIST 1, TWIST 2, the Marcus door beat,
  Maya, and the finale on next play entry — just back-to-back. **Decision needed:** is
  back-to-back acceptable for the (probably 1–2) existing completed saves, or do we add
  a "story replay from Act I" option? Recommend: accept back-to-back; it's a training
  app, the owner is the main completed-save holder.
- **R-2 — Scene runner scope creep (SYS-03).** It's the only XL system and 4 set-pieces
  depend on it. Mitigation: v1 supports exactly: linear beats, single-choice advance,
  multi-choice with shared continuation (§4.2 needs the "both answered the same way"
  pattern), and an `action` callback. No branching trees, no camera system (scenario
  marks camera focus "optional" — cut it).
- **R-3 — "Server-room door" geography.** The scenario stages ch16/finale at a Floor-4
  NAS Server Room, but the actual ch16 server interactable lives on **Floor 1** at
  `[-12, 0, -31]` (`lessonRegistry.js`), while ch16's mentors/zone theme are Floor 4.
  **Decision needed:** (a) relocate the server prop to Floor 4 (one `LESSON_DELIVERY`
  entry + override edit, but moves an established interactable), or (b) stage Marcus's
  door beat at the Floor-1 rack. Recommend (a) — Act IV's "every cable runs up" beat
  (PROP-05) doesn't land if the NAS is in the Floor-1 library.
- **R-4 — Ambient population is thin.** 4 ambient agents desktop / **2 on mobile**;
  TWIST 1 needs 3 staged actors visible from Ines. Solved in-plan by TWIST1-02's three
  dedicated lobby NPCs exempt from the mobile cap — but that's +3 GLB character
  instances on Floor 1; verify mobile frame rate (the 10-rig warm cache is already
  ~150 MB).
- **R-5 — Disproportionate asks.** (i) ASK-A5 "ALL named NPCs attend" — spawning 14
  rigged characters into the lobby simultaneously is the heaviest single moment in the
  game; recommend capping the cast at ~10 and letting generated assessors skip.
  (ii) ASK-A14 token counter ticking "in real time" is cheap, keep. (iii) ASK-A24 eye
  glint is low value/medium fiddliness — first candidate to cut. (iv) Floor M monitor
  wall "every floor visible including the player's path" — interpret as static stylized
  canvas stills, NOT render-to-texture live feeds (which would be a perf cliff).
- **R-6 — Double ceremony at ch16.** Passing `ch16-test` fires the existing capstone
  ceremony via `ccq_promotion_for` *before* the finale chain even starts. Two big
  ceremonies minutes apart will feel redundant. Recommend: suppress the auto capstone
  ceremony for ch16 (skip in `maybeStartFromFlag` when the finale is pending) and let
  FIN-06 be *the* VP-of-AI moment — it uses the same tier-9 title machinery.
  Needs owner sign-off since it changes existing shipped behavior.
- **R-7 — Hearts easter egg semantics change.** Currently hearts appear at build time
  when all tests pass — i.e., *before* the finale is seen under the new model. Gate the
  hearts/plaque flip on the finale-seen flag instead (`setPortraitCelebration`), so the
  reveal lands in the ceremony. Mild behavior change to an existing feature; flag it.
- **R-8 — Educational Integrity regression risk.** D1 lines for generated mentors
  *replace* their procedural `INTRO_TEMPLATES` intro at certain tiers. The replacement
  lines from §3 all still introduce the lesson — but every COPY task must preserve the
  "Start lesson" button flow and never alter `lesson.content`. Add the audit rule from
  WBS 3.5.
- **R-9 — `data/npc_overrides.js` is editor-owned.** The checked-in file currently
  holds only linda/ines positions — the three mentor-persona entries described in
  RESUME may have been clobbered by a later editor export, or live uncommitted.
  Verify before Phase 1; this is exactly why SYS-02 puts story copy in a **separate**
  `data/story_lines.js` that the editor never regenerates.
- **R-10 — localStorage growth + reset path.** New `ccq_story` key must be cleared by
  `Progress.reset()` and the welcome-modal reset flow in `app.js`; otherwise a fresh
  playthrough starts with twists already "seen".

### Open questions for the project owner

1. **Q1 (R-1):** Back-to-back twist catch-up for already-completed saves — acceptable,
   or build a story-replay entry point?
2. **Q2 (R-3):** Relocate the ch16 server rack to Floor 4? (Recommended.)
3. **Q3:** Ambient six-line delivery — E-to-talk dialogue (recommended; reuses
   everything) vs. auto speech bubbles on proximity (more *Severance*, but a new
   bubble system + screen clutter on mobile)?
4. **Q4 (R-6):** OK to replace the existing ch16 auto-capstone ceremony with the finale
   ceremony?
5. **Q5:** Spend ~10 Meshy credits on Maya's bespoke retexture, or ship her on the
   stock `western_female` rig?
6. **Q6:** Cycle Report collectibles pre-T5: visible-but-locked (foreshadowing,
   recommended) or invisible until T5?
7. **Q7:** Is a fifth elevator-modal row an acceptable reading of ASK-A1's "blank slot
   on the panel", given floor selection is a DOM modal (with a cosmetic blank plate on
   the 3D call-button housing)? Full 3D in-cab panel interaction would add ~2 days for
   no mechanical gain.

---

*Plan ends. Implementation sessions should start at Phase 1 / SYS-01 and treat §2's
file/line references as the research baseline — re-verify line numbers against HEAD
before editing; functions and structures are named for grep-ability.*
