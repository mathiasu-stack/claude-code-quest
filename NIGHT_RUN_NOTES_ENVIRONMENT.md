# Overnight environment + atmosphere run — log

Goal: fix the "unfinished demo" feel — sky, ceilings, depth, name tags — then push production value with time-of-day, NPC routines, and a parallax skyline.

## E1 — Exploration

### Hot points
- **Scene root**: `play/play.js:1019` — `scene = new THREE.Scene()` inside `buildWorld()`. Background and fog already set on lines 1022-1023 (currently a flat `0xeaf3ff` color and a linear fog 30–70m). Sky/fog are also re-applied per zone by `LightingManager.applyPreset()` (in `play/lighting/manager.js:60-70`). **The sky upgrade plugs in at LightingManager so it stays preset-driven.**
- **Renderer**: `setupRenderer()` at `play.js:1448`. Tone mapping is `ACESFilmicToneMapping`, exposure 1.05. Lighting rebalance at the end of the run will retune zone hemisphere intensities, not exposure.
- **Walls / room boundaries** (zone 1): the back wall `wall(22, wallH, 0.3, 0, wallH/2, -11)` and side walls / front wall split with doorway. Walls are `wallH = 3.8`. **Ceiling plane sits at y=wallH (3.8).** Library has the same dimensions.
- **Name tags**: `makeLabelSprite` at `play.js:512`. Each NPC gets a tag in `spawnNPC` at `play.js:1417`. Tag is currently a Sprite added to the NPC's group at y=2.45. Tier badge on the player at y=2.4. Same factory used for door labels and the CEO plaque. **Refactor will not touch the factory — instead, I'll add a per-tag fade/occlusion pass each frame inside the existing main loop.**
- **NPC update loop**: `play.js:~2050` — for each NPC: face blink + applyIdle + look-at-player head turn. **NPC routines slot in here** (waypoint lerps + face direction adjust).
- **Dust system**: `play/lighting/dust-motes.js` — already tinted warm. The library window light streaming will emphasise these existing dust motes; no new particle system needed.
- **Audio bridge**: `window.PlayAudio.cheer/uiClick/...` already exposed. Live-world ambient sounds (typing, page turn, phone ring) will use the existing AudioManager directly via small procedural builders.

### Conservative choices made up-front
- **Sky = 12-vertex inverted sphere with vertex colors** (gradient top→bottom) on the `BackSide`. Cheaper than a real Sky shader and avoids importing Three.js's `Sky` add-on.
- **Time-of-day update cadence: 1 Hz, not per-frame.** Cheap to compute. Per-frame interpolation between the two anchor times happens cheaply (one lerp on directional intensity + a few color sets per second).
- **Skyline: Group of ~15 instanced-ish Boxes.** No instancing API — at 15 boxes the cost is negligible. Parallax shift = 5% of player movement subtracted from skyline group position (so it appears further away).
- **Name tag fade**: linear distance falloff from camera, no occlusion raycast on mobile (raycast adds CPU cost with N tags). Desktop gets a simple raycast against scene walls only.
- **Reception centerpiece** — picking the **rotating Kedash logo installation** for branding payoff over the seating cluster. Logged.
- **Hallway depth illusion**: a separate "fake" room mesh outside the build but visible through the front doorway gap; it has a distant point light and fog so geometry fades. Player can't enter (movement bounds clamp them at the doorway already).
