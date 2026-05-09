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

## Step 2+ — to come
Will append to this file as I work through scaffolding, lighting, post-fx, mobile guards, dust motes, then a final morning checklist.
