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

## Step 5 — Post-fx pipeline

`play/postfx/composer.js`. Stack: `RenderPass` → `UnrealBloomPass` → `ShaderPass` (combined vignette + grain).

- Bloom is `UnrealBloomPass(bloomRT, 0.55, 0.75, 0.8)` initially; the per-zone preset retunes strength/radius/threshold via `applyPreset`.
- Vignette + grain are merged into a single fragment shader to avoid a second fullscreen pass on mobile.
- `index.html` importmap extended with `"three/addons/"` → `https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/`. Adds ~30–40 KB gzipped (well inside the 150 KB cap).
- `loop()` swapped from `renderer.render(scene, camera)` to `postfx.render()` (with safe fallback if postfx is null).
- `resize()` extended to call `postfx.resize(w, h)`.

## Step 6 — Per-zone post-fx presets

Reception preset: bloom 0.55 / radius 0.75 / threshold 0.8, vignette 0.35, grain 0.04 — bright, golden, mild grit.
Library preset: bloom 0.85 / radius 0.85 / threshold 0.7, vignette 0.55, grain 0.06 — heavy bloom around lamps, strong vignette, more grain.

Transition: when `zoneIndexAt(player.position.z)` changes, `update()` calls `lighting.applyPreset(idx)` and **then** `postfx.applyPreset(lighting.getPostFx())` so the lighting + post-fx swap is atomic.

## Step 7 — Mobile guards

- `play/lighting/mobile.js` exports `isMobile()` (matchMedia `(hover:none) and (pointer:coarse)` plus UA fallback) and `effectivePixelRatio()` (caps at 1.25 on mobile, 2 on desktop).
- `setupRenderer` now: `antialias: !isMobile()`, pixelRatio from `effectivePixelRatio()`.
- `LightingManager` halves shadow map sizes on mobile and drops `castShadow` from accent lights on mobile.
- `PostFxPipeline` halves the bloom render target on mobile and forces grain to 0 regardless of preset.

## Step 8 — Bug-fix pass

- **Mobile bloom downscaling was being clobbered.** `composer.setSize(w, h)` re-routes through `UnrealBloomPass.setSize(w, h)` which internally divides by 2 — overwriting our scaled `bloomRT`. Fixed by re-calling `bloom.setSize(w * scale, h * scale)` after `composer.setSize` on mobile.
- **r0.169 default lighting model would have rendered everything dark.** From r0.166 onward Three.js defaults `useLegacyLights = false`, which makes the preset values (calibrated for legacy intensities ~0.5–1.5) read as pitch-dark. Pinned to `useLegacyLights = true` in `setupRenderer` and added `ACESFilmicToneMapping` (exposure 1.05) so bloom + bright keys don't clip white.

## Step 9 (stretch) — Dust motes

`play/lighting/dust-motes.js`. 100-particle `THREE.Points` system on desktop, `count = 0` on mobile (constructor short-circuits and renders nothing). Particles drift inside a 24×9×24 window centred on the player; particles that drift outside the window wrap around so they're always visible without rendering thousands of them. Tiny `CanvasTexture` for the mote billboard. Disposed cleanly in `Play.stop()`.

Choices to flag for review:
- Particle count fixed at 100 — could ramp up/down per zone if I had per-zone density, didn't add since the brief said "shared system".
- Dust is a single warm color (`#fff5d4`); I considered tinting per-zone (warm in Reception, neutral in Library) but kept it shared per the brief.
- Particles are not affected by lights (PointsMaterial isn't lightable). They look like motes catching ambient warmth, which is acceptable as a fake.

---

## Morning review checklist

Open the live game on **desktop** first to validate visuals, then mobile to validate perf. Hard-refresh both before testing — Web Station / browsers cache CSS+JS aggressively.

### Reception (zone 1) — open the game and you spawn here
1. Background should be warm cream `#f3e7d2`, not pale blue.
2. CEO portrait on the back wall: gold frame should catch a clear specular highlight from the spotlight aimed at it. The painted portrait itself is `MeshBasicMaterial` so it stays at full brightness — the **frame** is what shows the lighting. (If the user wanted the portrait to dim/brighten with light, switch frame's child portrait mesh to MeshStandardMaterial. Noted as a potential follow-up.)
3. Soft warm shadows on the floor under the desk and couches from the new directional sun (off the +X side).
4. Subtle vignette (mild) + light bloom on the gold frame and door light.
5. **Camera-relative WASD**: stand still, hold A. The player should turn smoothly into a continuous CCW circle (mid-run feature added on top of the lighting pass).
6. Dust motes (desktop only): squint, you should see ~100 tiny warm specks drifting around the player. They wrap as you walk.

### Library (zone 2)
7. Walk through the door. Background should swap to dark blue/black `#1a1d2a`. Vignette should visibly tighten.
8. Two reading tables should have **bright warm pools of light** under the lamps — the bloom preset is heavier here so the lamps glow.
9. Bookshelves along the side walls should cast long shadows toward the centre because the directional is low and cool.
10. Audio cue for the swap is missing — only the visual transition. Possible follow-up.

### Zones 3–16
11. Fall back to `DEFAULT_PRESET` (cool daylight). Walking from Library into zone 3 will visibly brighten things back up. To author a unique preset for any of these, drop a new entry into `play/lighting/zone-presets.js`'s `ZONE_PRESETS` map keyed by zone index — manager picks it up on transition with no other code changes.

### Mobile
12. Open on a phone. Verify the page loads (importmap, ESM, postprocessing addons must resolve).
13. Frame rate should hold at ~30+ in both zones. If it doesn't, drop `bloomScale` further in `composer.js` constructor (currently 0.5 on mobile) or reduce shadow map size in `manager.js` (currently 512 on mobile).
14. Confirm dust motes are NOT rendered on mobile (the `DustMotes` constructor sets `count = 0` so nothing is allocated, but eyeball it).

### Things I deliberately did NOT change
- Geometry (no desk/NPC moved).
- Movement bounds, jump, camera distance.
- Persistence.
- Existing `buildLamp` PointLights still live inside lamp meshes — they add a tiny inner glow that the preset accent point lights wrap around. If they look like double-lighting, strip the embedded one.

### Known issues / follow-ups
- The portrait (the painted face inside the frame) is unaffected by lights because of the basic material. Frame is fine. Consider switching to MeshStandardMaterial with `emissiveMap` of the same canvas for a true "lit portrait" effect.
- Camera direction at `start()` may have a brief swing on the first frame because the camera-follow lerp hasn't converged yet. Acceptable.
- `useLegacyLights = true` is deprecated and will be removed in a future Three.js. If we upgrade to a newer minor that drops it, intensities need to be re-balanced (×2–3 typically for physical mode).
- After completing a chapter test in play mode and bouncing back, the dance plays for ~4.5s with a forced camera circle. During the dance, zone-change detection is skipped — fine because the player isn't moving, but flagged in case you walk through a doorway right as you press the dance trigger somehow.
- Bundle: net new gzipped weight is the three/addons/postprocessing imports (~30–40 KB) + my modules (~5 KB). Comfortably under the 150 KB cap.

### Commits to review (newest first)
- `c2df9e1` dust motes
- `a61e8ea` legacy lighting + tone mapping
- `937943b` mobile bloom downscale fix
- `d5bf014` mobile pixelRatio + AA
- `33d6999` post-fx swap on zone change
- `8980c43` EffectComposer wired
- `7486533` Library preset verified
- `5b031e9` camera-relative WASD (mid-run extra)
- `cf7e3d0` LightingManager wired into play.js
- `6e2525c` lighting module scaffold
- `04bb03f` step 1 codebase exploration

If anything looks visually off, the cleanest single revert target is `cf7e3d0` (the moment LightingManager replaced the inline lights). Reverting to before that brings the original flat hemisphere+directional back.

