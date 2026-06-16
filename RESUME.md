# Resume prompt — Claude Code Quest (next session)

Paste this whole block into the new Claude Code session to pick up.

---

I'm resuming work on **Claude Code Quest** at `/volume1/projects/claude-code-quest`. This is a vanilla JS Three.js 3D office game with a corporate "Kedash Corp" training/welcome theme. No build step, no npm — served via Synology Web Station/Nginx at `http://ds925-urlacher:8888` (Tailscale) or `http://192.168.70.9:8888` (local). Deploy by running `nas-deploy "commit message"` from the NAS — that stages, commits, and pushes to GitHub in one shot.

Read `CLAUDE.md` first (it has full stack + deploy details). Key context the previous session built up that you should treat as live state:

## VISUAL UPGRADE ROADMAP (2026-06-16 session, IN PROGRESS)

A 4-discipline art team (Environment Artist, Level Designer, Hard-Surface
Modeler, Technical Artist — run as parallel subagents) proposed a phased
"semi-realistic" upgrade. User greenlit the whole plan and said "push Phase 4
as far as we can". Goal: at least semi-realistic. The agents discovered the
engine is further along than RESUME claimed: **post-FX is already live**
(`play/postfx/composer.js` — EffectComposer+Bloom+vignette/grain, per-zone via
`play/lighting/zone-presets.js`), a **marble material lib exists**
(`play/materials/modernLibrary.js`, with `envMapIntensity:1.0` that was wired
to a non-existent envMap), meshopt decoder is wired, dust-motes exist, and
`renderer.useLegacyLights = true` (load-bearing — env/PBR work must respect it).

Dependency chain (do in order): **Phase0 gltfpack → Phase1 IBL → {Phase2 PBR
maps, tiering} → Phase3 bevels-before-materials → Phase4 spatial}**. Guardrails:
mobile budget (≤~150 draws/floor, no SSAO, no added PointLights on mobile,
procedural maps ≤256px on mobile until gltfpack frees memory); `useLegacyLights`
means one ambient rebalance when IBL lands; instance only NON-editable clutter
(merged/instanced meshes lose the editor's `_roomId` tagging); **the finale is a
fragile scripted chain — any reception/Floor-M spatial change needs the full
playtest path (admin skip → ch16 → Marcus → elevator → Maya → ceremony)**.

### Increment 1 — COMMITTED + LIVE (`703316c`, cache-bust `play/play.js?v=20260616a`)
- **See-through office windows (floors 2/3/4)** — `buildFloorOffice` in play.js
  now builds CURTAIN WALLS (new `addCurtainWall(axis,fixed)`): solid sill
  (0→0.4) + header (2.4→3.8) band, slim mullions, and 5 transparent glass
  openings/wall on N/S/W (`officeGlassMaterial()`, shared, `envMapIntensity 1`).
  East stays solid. New `buildOfficeSkyline(floorIdx)` adds a distant procedural
  building ring + hazy ground (tagged `userData.floor` for single-floor culling)
  so windows look onto a city. **Removed all 45 opaque `id:'window'` decorations
  from data/rooms.js.** Collision unchanged (±17.5 clamp), so openings are safe.
  NOTE: floor-1 reception windows were ALREADY see-through (`buildReceptionWindows`
  in depth.js, procedural frame + transparent glass) — left as-is; user should
  confirm they read fine.
- **Phase 1 IBL — DONE** — new `play/lighting/envProbe.js` `buildSkyEnvTexture
  (renderer)`: PMREMGenerator over a procedural equirect sky gradient → returned
  texture assigned to `scene.environment` in `start()` (after timeOfDay init),
  disposed in `stop()` (`_envTexture`). Baked ONCE at moderate brightness — NO
  light rebalance (avoids fighting the 3 hemi-intensity writers: manager
  _applyImmediate, manager tick, timeOfDay tick). **Tuning knob:** if too
  hot/cold, pass `{top,horizon,ground}` hex (or dim them) to `buildSkyEnvTexture`
  in play.js. **Deferred (TA #9):** env regen on zone/time-of-day change — v1
  bakes one daytime sky; reflections don't track sunset yet.
- **Ines child voice** (earlier same session, finally deployed here): Azure
  `en-US-AnaNeural` cloud TTS + raised pitch/rate local fallback; `child` flag in
  `voiceProfileFor`.

### Increment 2 — Audit harness FIXED + green (`bf81dbd`)
The audit was dead (pre-existing): `scripts/audit/lib/extract.cjs` parsed
`NAME_FIRST`/`NAME_LAST` string arrays that play.js had replaced with
`PEOPLE_POOL` (objects). Rewrote the mirror to parse `PEOPLE_POOL` +
`ROLES_LESSON` and match current seeds (lesson `chapterIdx*11+i*7`, test
`chapterIdx*11+99`, test pos `cZ+8.5`). Added `nonce` to data-consistency's
`EVALUATOR_TYPES`. `bash scripts/audit/run-all.sh` → "AUDIT: all clean." again.

### Increment 3 — Phase 4 safe win: office ceiling + baseboard (`3627691`, `?v=20260616b`)
`buildFloorOffice` (play.js): blank white ceiling → procedural suspended
acoustic-tile grid (`ceilingTileTexture()`, 0.6 m tiles) + a 4×4 grid of
emissive recessed light panels (flat quads, catch the post-fx bloom) + a dark
baseboard band along all 4 walls. All overhead/wall-hug — no collision/NPC/
finale coupling. Deterministic, mobile-cheap (shared geo/mat).

### Increment 4 — Phase 4 cove lighting + Phase 2 color grade (`929f152`, `?v=20260616c`)
- Office cove lighting (`buildFloorOffice`): recessed soffit lip + warm emissive
  strip near each wall top, uplighting the ceiling edge. Overhead/wall-hug.
- Color grade: extended the post ShaderPass (`play/postfx/composer.js`
  `VignetteGrainShader`) with `uContrast`/`uSaturation`/`uTemperature` (gentle
  defaults 1.05/1.06/+0.012). Per-zone tunable via `postfx.contrast/saturation/
  temperature` in `zone-presets.js`; set 1/1/0 to disable. `applyPreset` reads
  them if present, else keeps the global defaults.

### Increment 5 — Phase 2 roughness maps + Phase 3 bevels (`c7b0b6a`, `?v=20260616d`)
- Wall material + office floor plates gained low-frequency `roughnessMap`s
  (`_wallRoughTex`, NoColorSpace, roughness set to 1.0 and modulated) so big
  surfaces catch the IBL with buffed/matte variation, not one flat sheen.
- Vendored `three@0.169 RoundedBoxGeometry` (play/vendor/addons/geometries/) +
  new `bevelBox(w,h,d,r?)` drop-in (1 seg = small rounded chamfer; same dims →
  colliders/proportions unchanged). Applied to procedural furniture FALLBACKS
  (chair/desk/couch/cabinet/table) + the always-procedural `buildLibraryCounter`.
  Caveat: furniture mostly renders as GLBs at runtime, so bevels mainly show
  during the two-phase load / when GLBs are absent — lower ROI than hoped.

### Increment 6 — emissive blowout fix + finale-coupled framing (`dda17c7`, `2d20667`, `?v=20260616f`)
- Tamed the office cove/recessed-panel emissive (user screenshots showed wall
  blowout under bloom): cove 1.2→0.45, panels 0.9→0.4.
- CEO portrait gallery niche built INTO the portrait group (editor-selectable,
  moves with it): flanking stone pilasters + header + low plinth + a
  widened/stronger warm light. Additive — no spawn/script/collider changes.
- Floor M: warm key light pooling on Maya's standing spot ([4.0,-7.6]) as the
  elevator-exit reveal terminus.
- DEFERRED (needs a finale playtest to tune): finale cast semicircle staging —
  positions/`face` are script-safe to change but risky to get right blind.

### Increment 7 — Scene-wide bloom blowout FIX (`b6e599f`, `?v=20260616g`)
User screenshots (reception + exterior, floor 1) showed a white wash hiding the
VP-of-AI finale. It was NOT the office cove/panels (wrong first guess in incr 6).
Real cause = bright surfaces blooming into a white sheet, introduced after the
"looking great" state:
- Wall/floor `roughnessMap`s (incr 5) → glossy patches reflecting the bright sky
  via IBL. REVERTED: walls flat roughness 0.92, office floors matte (min 0.35);
  envMapIntensity lowered (walls 0.5, floors 0.4).
- CEO-portrait niche stone was reflective + sat in the wash corner → made matte
  (roughness 0.85 / envMapIntensity 0.3); warm light 0.75→0.55.
- **Bloom safety clamp** in `composer.applyPreset`: `strength ×0.6`,
  `threshold = max(preset, 0.9)`. If the scene now looks under-glowy, raise/relax
  these — single chokepoint.
LESSON: the IBL reflections only look good on TRULY low-roughness hero surfaces
(marble/glass/metal). Do NOT lower roughness on big diffuse surfaces (walls/
floors) — they bloom out. Keep their envMapIntensity low.

### Increment 8 — finale lobby camera fix (`43c89f0`, `?v=20260616h`)
Finale rode player to floor 1, default spawn = east elevator (x=10) facing west
into reception's SHORT (1–1.8m) window-wall segments, which camera occlusion
(only catches walls ≥2.5m) can't see → chase cam backed through → showed wall.
Fix: one-shot `_spawnOverride` consumed by `spawnPlayerOnFloor`; finale sets it
to lobby vantage (1, 2.5) facing north (cast+portrait), camera lands inside.
Under the ride fade (no teleport). Normal rides unchanged.
KNOWN (pre-existing, low-pri): any NON-finale elevator ride DOWN to reception
hits the same east-wall camera issue. Broader fix = lower the cameraWalls `tall`
threshold (~1.6) or clamp camera to floor interior — deferred (furniture-occlude
risk). The "Locked — internal" files are STORY collectibles (Cycle Reports +
learnings fragments), tier-gated (mostly unlockTier 5); optional lore.

### Increment 9 — Post-finale (T7) dialogue for every character (`61672e8`, `?v=20260616i`)
After finale (tier T7), revisiting any character plays a NEW arc-aware line.
- play.js `postFinaleLineFor(npc)` + done-intro hook (`tier >= 7` branch in
  openDialogue, after the doneIntroByTier check): topical fallback naming the
  NPC's lesson/chapter, varied by id-hash across 5 lesson + 3 test templates.
  Covers ALL ~80 lesson/test NPCs automatically (all are `done` at T7).
- Bespoke `doneIntroByTier: { T7 }` in story_lines.js for the named cast: linda,
  kenji, aisha, sarah, elena, auto-ch10-l01 (Engelhardt), auto-ch14-l01 (Okoye),
  auto-ch15-l01 (Vasquez), auto-ch16-l05 (capstone), + new `marcus` entry.
  ines/maya/newhire already had T7 introByTier (flavor → intro slot, not done).
- NOT covered (by design): pure background/ambient flavor NPCs (folderman/tania/
  ambient workers) keep their stock intros — not "characters we interacted with".

### Increment 10 — generic flavor T7 lines + violin harmony (`d16d433`, `?v=20260616j`)
- Post-finale flavor NPCs: `genericFlavorPostFinaleLine` + hook in openDialogue's
  intro path (`isFlavor && tier>=7`, skips bespoke-T7 ines/maya, resets carried
  sting/hero). Now EVERY talkable character has a post-finale line.
- Violin harmony (`play/audio/proceduralMusic.js`): new `playViolinNote` bowed
  voice (2 detuned saws + lowpass + vibrato, slow attack/sustain) scheduled in
  `scheduleBar` as a sustained counter-melody over the 4-chord piano —
  `VIOLIN_PHRASE` chord-tone contour, a register above the piano, quieter so it
  harmonises not doubles. All 4 zone tracks. Single-importer + no-cache.

### Increment 11 — REAL sampled piano + violin (`d557f1f`)
Replaced the oscillator voices (synthetic; the saw "violin" sounded like a
harmonica) with real recorded samples, pitch-shifted to nearest.
- Vendored multisamples under `play/assets/audio/instruments/`: 14 piano (A1..C6)
  + 8 violin (G3..C6) mp3s from gleitz/midi-js-soundfonts (MusyngKite, MIT),
  ~540KB. mp3 served day-cached.
- `proceduralMusic.js`: lazy module-wide `_bank` (fetch + decodeAudioData on
  first start), `playSampleNote` (nearest sample + playbackRate shift + gain
  env). `notePiano`/`noteViolin` route to samples when loaded ELSE the original
  oscillator voices (graceful fallback — never breaks on 404/offline). Synth
  plays until bank resolves (~a few sec), then upgrades to samples.
- Tuning knobs: `SAMPLE_GAIN = { piano: 0.8, violin: 1.3 }`. NOT verified by ear
  (can't hear) — adjust if balance is off. Module is no-cache (loads fresh).

### NEXT / OPEN
- **Verify:** music now sounds like real piano + violin (a few sec after it
  starts, once samples load); balance ok? (tune SAMPLE_GAIN). Finale reveal
  frames the lobby; post-finale every NPC has a fresh line.
- If under-glowy anywhere, relax the bloom clamp in composer.js.
  Floor M reveal (on a Floor-M visit); run the finale to check the ceremony +
  to tune the deferred cast staging together.
- **IBL CONFIRMED GOOD** → Phase 2 done (roughness maps + color grade). Optional
  remainder: desktop 512px texture tiering (minor); normal maps (deferred —
  bump already present; colorSpace care needed).
- **Most safe/deterministic blind wins are now harvested** (windows, IBL,
  ceiling/cove/baseboard, grade, roughness, bevels). Remaining work needs the
  user:
  - **Per-zone cinematic lighting mood** (zone-presets.js) — high impact, but
    subjective: best tuned WITH the user (warm reception / cool offices / amber
    library / cold lab / intimate Floor M; also fixes dark-library debt).
  - **FINALE-COUPLED Phase 4** (needs user to run finale playtest after): spine
    corridor + NPC waypoint repath (liveAgents), CEO-portrait niche + ceremony
    staging, Floor M reveal composition.
- **Phase 0 gltfpack still BLOCKED** (no gltfpack/npm on NAS). curl works on the
  box (used it to vendor RoundedBoxGeometry), so a gltfpack static binary COULD
  be fetched if the user wants the ~150MB rig-compression win.
- All tuning knobs: envProbe gradient (`buildSkyEnvTexture` opts), grade
  uniforms (`composer.js` defaults or per-zone `zone-presets.js`), cove/panel
  `emissiveIntensity` (play.js).
- **Phase 0 gltfpack BLOCKED**: gltfpack not on the NAS and project is npm-free.
  Needs a tooling decision (install gltfpack binary, or compress off-box). NOT
  required for other phases — just the biggest perf win.
- **Phase 4 remaining**, in rough safety order:
  - SAFE/blind-ok (deterministic geometry): vertical scale + ceiling-height
    raise (watch camera ceilCap clamp), structural columns (mind collision vs
    desks), elevator/atrium vertical landmark, floor-identity signage.
  - VISUAL/needs user eyes: per-zone cinematic lighting mood (zone-presets.js;
    also fixes dark-library debt) — best tuned WITH the user since it's
    subjective and layered on the unverified IBL.
  - FINALE-COUPLED (needs the user to run the finale playtest after): spine
    corridor + NPC waypoint repath (liveAgents), CEO-portrait niche + ceremony
    staging in reception, Floor M reveal composition.
- Phases 2 (materials) and 3 (bevels/arch-kit/instancing) not yet started.

## LATEST — Audio, voices & wall textures (2026-06-15 session, COMMITTED + LIVE)

All shipped via `nas-deploy` and verified. Current entry cache-bust: **`play/play.js?v=20260615k`** in `index.html`. `voice.js` / `settings.js` / `AudioManager.js` / `zone-presets.js` are served **no-cache** by `save_server.py` (revalidate-on-reload), so edits to them load fresh WITHOUT a `?v=` bump — only the `play.js` entry tag is bumped by convention. **Do not** give the AudioManager.js singleton mismatched `?v=` across importers (forks module state).

- **Cloud neural TTS (Azure Speech) — the headline feature.** Character dialogue now plays genuinely human neural voices (the user explicitly wanted "Alexa/ChatGPT-level"). Architecture:
  - **Server**: `save_server.py` has a `POST /tts` endpoint — takes `{text, voice}`, validates the voice name against `^[a-z]{2}-[A-Z]{2}-[A-Za-z0-9]+Neural$`, XML-escapes text into SSML, calls Azure `…tts.speech.microsoft.com/cognitiveservices/v1` (mp3 24kHz), and **caches every unique (voice,text) line to `tts-cache/` on disk** (sha256 key) so each line is billed once. Returns 503 when unconfigured → client falls back to on-device voices (game still works with no key).
  - **Secret**: key+region read from env (`AZURE_SPEECH_KEY`/`AZURE_SPEECH_REGION`) or a **gitignored** `tts_config.json` at repo root: `{ "azure_speech_key": "...", "azure_speech_region": "westeurope" }`. **The user's key is region `westeurope`** (Azure keys are region-locked; `eastus` 401'd). `tts_config.json` + `tts-cache/` are in `.gitignore` and GET-blocked in `save_server.py` `_BLOCKED_PREFIXES`. NEVER commit them.
  - **Client**: `play/audio/voice.js` `speakLine()` tries cloud first (`speakCloud` → `fetch('/tts')` → play mp3 via `HTMLAudioElement`, volume = master×Voice-slider), falls back to `speakLocal()` (Web Speech) on any failure/503. `azureVoiceFor({gender,lang,id})` maps profile → Azure voice via `AZ_VOICES` (en-US / en-GB / en-IN / en-NG / en-HK buckets). A `_speakToken` guards against stale async responses; `cancelSpeech()` stops both the `<audio>` and `speechSynthesis`.
  - **Toggle**: audio settings panel (⚙) has **"✨ Natural voice (cloud)"** (`isCloudVoiceEnabled`/`setCloudVoiceEnabled`, localStorage `ccq_voice_cloud`, default ON) to disable cloud calls / cost.
  - **OPERATIONAL**: `save_server.py` is a detached process (PID parent=init, no auto-respawn). Editing it requires a **manual restart** to load new routes: `kill <pid>; setsid python3 /volume1/projects/claude-code-quest/save_server.py > /tmp/save_server.log 2>&1 < /dev/null &`. After a NAS reboot, relaunch it the same way. The `tts_config.json` is read per-request, so changing the key needs NO restart.
- **Voice gender/accent matching** (`voice.js` + `play.js voiceProfileFor`): `voiceProfileFor(npc)` derives `{gender, lang, id}` from the rig name (`_male`/`_female`/`hijab`) + named-character regex; `lang` now maps ethnicity → accent: sasian→en-IN, african→en-NG, easian→en-HK, arab/hijab→en-GB, else en-US. Threaded via `_currentVoiceProfile` → `startTypewriter` → `speakLine`. For the **local** fallback, `pickVoice` ranks voices by `qualityScore` (neural/network/Siri up, compact/eSpeak/Desktop down), expanded male/female name-hint lists (Edge/Azure "Natural" names), and only pitch-shifts decisively when no name-matched gendered voice exists (pitch-shift = the robotic culprit, so minimized).
- **Music dial real-bug fix** (earlier same session, committed): `AudioManager.setChannelVolume/setChannelMute/duckMusic` called `.gain.setTargetAtTime` on the GainNode (no such method → threw every call) instead of `.gain.gain` (the AudioParam). Channels are `channels[name] = { gain: GainNode }`, so the param is `channels[name].gain.gain`. Fixed; `duckMusic(factor)` added (lesson overlay ducks to 0.5).
- **Procedural wall textures** (`play/play.js`): replaced flat "Roblox" `MeshStandardMaterial({color})` walls with `makeWallMaterial(color, metal)` — one shared 256px near-white plaster CanvasTexture (mottle + grain) tinting through `material.color`, + matching bump map (`bumpScale 0.04`), roughness 0.92. Wired into the 3 play.js floor-room builders AND data-driven walls via `registerSharedHelpers({ wallMaterialFactory })` (roomsLoader's `_wallMaterialFactory` was declared-but-never-supplied until now). Textures generated once, reused (mobile-cheap).

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

- `8fcb02e` — Kedash Protocol Phase 5 + art-pass fixes (props, audio stings, library rework). **Everything below marked "UNCOMMITTED" is now committed** — Phases 1–3 in `3b54729`, Phase 4 in `4c22fcb`, Phase 5 + fixes in `8fcb02e`.
- `4c22fcb` — Phase 4: finale chain + Maya bespoke skin via manifest textureOverride.
- `3b54729` — Phases 1–3: tier engine, scene runner, TWIST 1+2, doc viewer, collectibles, Floor M module, title card, admin chapter skip.
- `5b4b29f` — Camera vertical range expansion (pitch -69° to +83°, Y clamp).
- `4b89c82` — CEO portrait moved into standard loader path so the editor can select/drag it.

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

## Kedash Protocol — Phase 5 + art pass (committed `8fcb02e`, 2026-06-10)

Phase 5 (final polish: PROP-07..13, AUDIO-01..04) shipped, plus a full art/scale
audit and a library rework driven by user mobile-playtest screenshots.
Current cache-bust generation: **`?v=20260610k`** on play.js in index.html.

**Phase 5 new modules** (all in `play/world/objectTypes/`): `wallDocument.js`
(team photos wall + EOTM corkboard), `seatsDashboard.js`, `tokenCounter.js`
(module-level count + `resetTokenCounter()` on floor-3 entry), `recMirror.js`.
Wired via `registerRoomBuilder` entries in play.js + data/rooms.js placements
(library team_photos; floor2 seats_dashboard; floor3 token_counter /
eotm_corkboard / rec_mirror). Audio (`play/audio/procedural.js`):
`playAnomalySting()` (fired by `sting: true` story lines — ines/aisha/elena T2),
`playFloorMChime()` (elevator → Floor M, music stops), `updateServerHum()`
(floor-4 NE proximity, lowered post-ch16). Portrait eye glint on promotion;
ceremony claps pinned to exactly 8 (`CLAP_COUNT` in npcReactions.js).

**Art-pass fixes** (root causes worth remembering):
- `makeDecoration()` uniform-scales by the MOST RESTRICTIVE axis of
  width/height/depth vs the GLB's natural bbox. The bookshelf GLB is
  ~0.63×2.0×0.85 m, so the old `depth: 0.45` target shrank shelves to ~1.06 m
  (waist height) — and the blank-spine anomaly rows (library.js, hardcoded at
  y=2.6) floated in mid-air. Fix: height-only scale `{ height: 2.6 }`.
  **Check natural GLB proportions before adding size targets** (GLBs are
  meshopt-quantized; parse accessor min/max × node scale).
- Library lesson NPCs were landing exactly on the 18-bookshelf grid
  (`floor1WestWingPositionForNPC`: library uses xOff ±3 = aisles, other
  west-wing rooms ±6). Elena now at [-18.8, -14.9] behind the new counter.
- Library checkout counter is now a bespoke procedural builder
  (`buildLibraryCounter` in play.js, rooms builder kind `library_counter`,
  at [-18.8, 0, -13.8]) — replaced the cloned reception_desk, which also sat
  inside the door swing (door leaf is 3.5 m, hinged x=-23.75, sweeps
  z -11..-14.5 into the library when open).
- liveAgents ambient workers had stale spawn/waypoints at the library's OLD
  pre-move location; now in the library's south reading band (z -16.5..-14.5).
- Double `loadRoom(library)` removed; FLOOR N + chapter signs grounded to the
  36 m office envelope (signs at ±13); Floor M portrait lean +0.12 / cable
  runs at -17.6.

**Known cosmetic debt (user hasn't asked yet)**: the library is dark — only
two lamps in the north lounge; shelf grid + south band have no light source.
Offered to add aisle lamps; no answer yet.

## NPC clothing-color variants (2026-06-11 session, IN PROGRESS / partially blocked)

Goal: per-NPC shirt recolors (mustard/purple/charcoal/teal/burgundy) on the 10
shared ethnicity rigs so reused models stop looking like clones.

- **Code wiring DONE** (`play/characters/gltfCharacter.js`): below the stature
  hash, a salted hash of `look._id` (+ `':shirt'`, `fin-` prefix stripped so
  ceremony stand-ins match their originals, `player` skipped) picks
  `hash % (textureVariants.length + 1)` — outcome 0 keeps the original baked
  atlas; otherwise the variant jpg is applied through the same cloned-material
  path as maya's `textureOverride` (which still wins when present).
  Cache-bust: gltfCharacter import in play.js + play.js tag in index.html →
  `?v=20260611b`. Harmless until the manifest gains `textureVariants`.
- **Generation BLOCKED**: the Bash safety classifier was down for the whole
  session — python could not be executed even once. The complete pipeline
  lives in `scripts/gen_clothing_variants.py` (extract baked atlas from each
  GLB, hue-select shirt pixels, luminance-preserving recolor, write
  `<rig>_v1..v4.jpg` q85, verify skin invariance, then auto-patch
  manifest.json `textureVariants`). Run:
  1. `python3 scripts/gen_clothing_variants.py inspect` — check each rig's
     detected shirt band; add per-rig `RIG_SHIRT` selector overrides for any
     rig whose auto-detect grabs the wrong band (white shirts need
     `{'white': True}`).
  2. `python3 scripts/gen_clothing_variants.py generate` — writes jpgs,
     verifies (skin-region diff must be jpg-noise only), and wires
     manifest.json automatically when ALL rigs verify.
  3. Hard-reload; NPCs on shared rigs get stable per-id shirt colors.
- `node --check` could NOT be run on gltfCharacter.js / play.js (classifier
  down) — visually reviewed only. Run it + `scripts/audit/run-all.sh` first
  thing next session. manifest.json was NOT modified yet (by design — refs to
  not-yet-existing jpgs would blank-texture every NPC on the live site).

## Character loading perf + stale-fallback fix (2026-06-12 session, UNCOMMITTED)

User reported (1) characters load too slowly and (2) blocky procedural NPCs
persist after assets finish loading. Audit + fix:

- **Audit finding (do NOT lose this)**: the 10 ethnicity rigs
  (`western_male.glb` etc.) are NOT compressed to project standard. The
  standard (hero/ines/linda/marcus/Idle) is gltfpack-style: meshopt +
  KHR_mesh_quantization + WebP textures → 0.3–1.5 MB each. The ethnicity
  rigs are raw Meshy exports: float32 positions, NO meshopt, NO
  quantization, one ~6.3–8 MB embedded PNG atlas each → 14.6–17.9 MB
  per rig, 184 MB total warm payload. Recompression with gltfpack
  (`gltfpack -i in.glb -o out.glb -cc -tc` or `-tj` WebP/jpeg textures)
  projected ~2–3 MB per rig (~25–35 MB total). NOT done (out of scope).
- **Root cause of stale fallback**: warmCache fired all 15 GLBs in
  parallel; on mobile/Tailscale the per-asset 60s timeout fired, cached
  a permanent null (late download was discarded), and `makeCharacter`'s
  sync `getResolved()` miss → procedural body forever (no upgrade pass).
- **assetLoader.js (`?v=20260612b`)**: `get()` now keeps the underlying
  load alive past the 60s timeout and adopts late arrivals
  (`_adoptLate` → resolved cache + `onAssetResolved(id)` hook); one
  retry on load error (`_loadWithRetry`); `warmCache(ids, onProgress,
  {concurrency})` is a worker-pool (no more 15 parallel 16 MB streams)
  and fires `onAssetResolved` per id; `_mergeOnce` guards duplicate
  extraAnimations merges across play sessions (loader is a singleton).
- **play.js (`?v=20260612b` in index.html)**: `_preloadGltfAssets` is
  two-phase — phase 1 blocks on hero/ines/linda/marcus (~5 MB, overlay),
  phase 2 streams maya + 10 ethnicity rigs (~165 MB) in the background
  at concurrency 3, NOT awaited. New `upgradeProceduralNpcs()` (below
  spawnNPC): on every `onAssetResolved`, respawns procedural spawnNPC
  products (roster / auto chapter / fin- stand-ins) via spawnNPC
  preserving live position/rotation/visibility, then
  `liveAgents.upgradeAmbients()` + `liveAgents.reindex()`. stop()
  detaches the loader hook.
- **liveAgents.js (`?v=20260612b`)**: new `reindex()` (refresh
  `named[id]` mesh refs after respawn) + `upgradeAmbients()` (in-place
  body swap for ambient agents using their stored `userData.look`).
- Expected UX now: loading overlay clears in seconds; background NPCs
  appear procedural briefly and pop to GLTF per rig as downloads land.
- Recommendations not implemented: recompress the 10 rigs with gltfpack
  (biggest win, ~85% smaller); player-mesh upgrade pass (player is
  phase-1 hero so only matters if hero itself times out); deleting the
  unused space-named original uploads (~140 MB on disk, never fetched).

## How to start

Begin by running `git log -10 --oneline` and `git status` to confirm the working tree matches what's described here, then wait for the user's next ask. If the working tree has changes you don't recognize, **don't discard them** — surface them to the user.
