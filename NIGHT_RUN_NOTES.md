# Overnight visual upgrade run — log

Run started 2026-05-09 (system date), kicked off via the "overnight autonomous run" prompt. The goal is a focused visual upgrade pass — lighting overhaul + post-processing — without touching gameplay, geometry, or persistence.

## Step 1 — Codebase exploration

Everything 3D-related lives in **`play/play.js`** (one big ES module). Findings:

### Render loop
- `play/play.js:1947` — `loop()` is the rAF loop. It calls `update(dt)` then `renderer.render(scene, camera)`. **This is the single line I will replace with the EffectComposer in step 5** so the post-fx chain runs.
- `play/play.js:1608` — `setupRenderer()` constructs the `WebGLRenderer`, sets pixel ratio, enables `PCFSoftShadowMap`, sets `SRGBColorSpace`. Camera is also created here.

### Current lighting (very basic)
- `play/play.js:1192-1201` — only two scene-wide lights:
  - `HemisphereLight(0xffffff, 0x99aab5, 0.65)` — bright neutral fill.
  - `DirectionalLight(0xffffff, 0.85)` at (8, 14, 6), shadow map 2048², covers a 50×50 area, casts shadows.
- `play/play.js:684-694` — `buildLamp(x, z)` is the *only* localised light: a `PointLight(0xfff59d, 0.6, 4)` (warm-tungsten color, weak intensity, tiny range). Used in:
  - Library zone 2: `buildLamp(0, 16)` and `buildLamp(0, 22)` (the two reading tables).
  - Every generic zone 3-16: one centre lamp.
- Reception zone 1 has **no localised lights** beyond the global directional.
- No per-zone presets — same global lighting everywhere.

### Zone tracking
- `play/play.js:96` — `ZONE_BOUNDS` array (16 entries, 22m wide each, along +Z).
- `play/play.js:113` — `zoneIndexAt(z)` returns which zone the player is in.
- **There is no zone-enter event yet.** The update loop computes `zoneIndexAt(player.position.z)` indirectly through the movement clamp, but never fires a callback when the index changes. **I'll need to add a `lastZoneIdx` field on module state and emit a transition when it changes inside `update()`** so lighting/post-fx can swap presets.

### Renderer / canvas
- Output element is `#play-canvas-host`. Renderer is appended via `container.appendChild(renderer.domElement)`.
- Renderer is created with `antialias: true`. With a post-process chain we typically disable AA on the WebGLRenderer and rely on FXAA/SMAA in the composer; for now I'll keep antialias on for the base pass since I'm not adding SMAA to keep bundle small.

### THREE.js loading
- `index.html:25` — importmap maps `three` → `https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js`. **Postprocessing addons are at `three/examples/jsm/postprocessing/...`** — I will need to extend the importmap so `three/addons/` resolves on jsdelivr, then import `EffectComposer`, `RenderPass`, `UnrealBloomPass`, `ShaderPass`.
- Bundle impact: those addons total ~30-50 KB gzipped from jsdelivr. Well under the 150 KB cap.

### What's safe to change
- All lighting in `buildWorld()` (start of function).
- `setupRenderer` (add composer, attach passes).
- `loop()` (swap `renderer.render` for `composer.render`).
- Add new files under `play/lighting/` and `play/postfx/`.

### What I will not touch (per the brief)
- NPC roster, dialogue, lesson navigation.
- Geometry positions of any prop.
- Movement, camera, jump, accessories.
- Anything in `engine/` or `data/`.

### Decisions taken so far
- **Module style.** `play/play.js` is already an ES module via importmap. The new `play/lighting/` and `play/postfx/` modules will also be ESM and imported from `play.js`.
- **No SMAA / FXAA** in the composer for now. The base pass keeps `antialias: true`. SMAA would add ~15 KB and pixelation from bloom is minor at the resolutions we render. Documented here as a possible follow-up.
- **Mobile detection.** Using `'ontouchstart' in window || /Android|iPhone|iPad/i.test(navigator.userAgent)`. Same heuristic the existing CSS uses (`@media (hover: none) and (pointer: coarse)`). This will live in `play/lighting/mobile.js` so it's available to both modules.

## Step 2 — Lighting module scaffold

Three files created under `play/lighting/`:

- **`mobile.js`** — `isMobile()` plus `effectivePixelRatio()`. Single source of truth so the lighting and post-fx modules pull from the same heuristic.
- **`zone-presets.js`** — `DEFAULT_PRESET`, `RECEPTION_PRESET`, `LIBRARY_PRESET`, plus `getPresetForZone(idx)`. Zones 3–15 currently fall back to default; the file has commented-out slots showing where to plug them in.
- **`manager.js`** — `LightingManager` class. Owns hemi + directional and a list of accent lights. `applyPreset(idx)` retunes the persistent lights and replaces the accent list. Drops `castShadow` from accents on mobile and halves shadow map sizes.

## Step 3 — Reception lighting wired

- Imported `LightingManager` + `isMobile` into `play.js`.
- Replaced the inline `HemisphereLight` + `DirectionalLight` in `buildWorld()` with a `LightingManager` instance.
- `start()` now calls `lighting.applyPreset(zoneIndexAt(player.position.z))` before the first frame so Reception lighting is in from t=0.
- Update loop tracks `lastZoneIdx` and re-applies the preset on transitions — that's the zone-enter event the brief asked for.
- Reception preset (zone 0): warm `0xffd9a0` directional from the +X (east) at a 45° angle for golden-hour mood; spotlight on the CEO portrait (target 0,2.0,-10.86); soft front-fill point on the lobby; cool blue rim from the doorway side. Background warmed to `0xf3e7d2`, fog tightened to 28–70m.

## Mid-run interrupt — camera-relative WASD

The user added a request mid-run: WASD should be camera-relative (press A → character moves to the camera's left, holding A spirals because "left" rotates with the camera each frame). Implemented:

- `update()` now reads input as `inputForward`/`inputRight` and projects against `camera.getWorldDirection()` flattened to XZ. World-space mx/mz fall out of `camRight * inputRight + camFwd * inputForward`.
- Touch joystick: `+x` = camera-right, `-y` = camera-forward (joystick "up" pushes forward).
- Camera follow lerp converted to dt-aware exponential smoothing (`1 - exp(-dt * 9)`), so 30fps and 60fps feel the same.

Result (traced manually): hold A → west → south → east → north → west loop, ~once per ~3 seconds at default speed. That's the intended circular spiral.

## Step 4 — Library lighting

Already authored in `zone-presets.js` (`LIBRARY_PRESET`). Verified preset accent positions:
- Two `point(0xffb95c, intensity 1.6, range 7)` at (0, 2.1, 16) and (0, 2.1, 22) — sit just above the existing `buildLamp` lampshades on the two reading tables.
- Cool 0x7db0ff rim point at (0, 3.0, 30) — lights up the rear bookshelves.
- Directional dropped to `0xb6c5e5` × 0.4, low angle, `castShadow:true` and shadowBounds 14 — bookshelves throw long shadows into the centre.
- Hemisphere ambient swapped to cool dusk `0x6c7da3` × 0.35 — the room reads as evening.
- Background `0x1a1d2a`, fog 18–55m → much darker and moodier than reception.

The pre-existing `buildLamp` `PointLight(0xfff59d, 0.6, 4)` is left in place inside both lampshades — small range, light yellow, adds a small inner-glow bias. The preset's brighter outer point dominates the actual light pool.


