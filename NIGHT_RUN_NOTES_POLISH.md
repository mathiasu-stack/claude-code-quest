# Overnight character + decoration polish run — log

Goal: silhouettes lose the "dark blob" look, rooms feel inhabited, materials get variety, characters get faces and personality. Aesthetic target: stylized blocky / Animal Crossing-ish, not realistic.

## P1 — Exploration

### Character build (`play/play.js`)
- **`makeCharacter(look)` at `:349-486`** — produces a Group with neck, head, torso, hair, glasses, beard, pants, legs, shoes, arms, hands, optional prop. Currently only sets `g.userData.parts = { leftLeg, rightLeg, leftArm, rightArm }`. **For the face system I need to also expose `head`, `torso`, and the new `face` group.**
- **`look` schema today**: `{ skin, hair, hairStyle, shirt, pants, glasses?, beard?, prop? }`. **I'll extend it with `face?: 'round'|'dot'|'sleepy'|'sharp'`, `expression?: 'happy'|'focused'|'tired'|'smug'|'kind'`, `accent?: hex`** without breaking existing callers.
- The torso material is `MeshStandardMaterial { color }` — flat. The user complaint "dark silhouettes" comes from no rim or emissive, plus dim shirts in shadow. **I'll bump shirt color brightness +12% in software** (HSL lift) and add a tiny rim emissive at intensity 0.06–0.10 so each character has a dim outline that prevents them disappearing in unlit areas.

### NPC roster (`play/play.js:9-105`)
- Hand-written for chapters 1-2 (10 NPCs) with `look` objects.
- Chapters 3-16 are generator-based via `generateChapterNPCs(idx)`. **Both paths flow through `spawnNPC(npcDef)` → `makeCharacter(npcDef.look)`** so as long as I update `makeCharacter`, every NPC inherits the face system for free.
- I'll **add per-NPC fields directly in the hand-written roster** (Linda's red scarf, Marcus's blue tie, etc.) and rely on default expression for the auto-generated 3-16 NPCs.

### Zone build
- `buildWorld()` builds zones 1 (Reception) and 2 (Library) inline in one big function, then loops over `buildGenericZone(idx)` for 3-16. **Reception decoration goes inline**, library decoration goes inline; for genericness, I'll factor reusable primitives (`buildMug`, `buildStapler`, `buildSticky`, `buildPosterTexture`, etc.) into a separate file `play/decorations/shared.js`.
- `buildLamp` and the existing `buildPlant` already exist as helpers in `play.js`. I'll **add new variants** (`buildPlantTall`, `buildPlantHanging`) without touching the originals.

### Materials
- All existing materials are `MeshStandardMaterial { color }` — no metalness, no roughness variation. **I'll create `play/materials/presets.js` with named factory functions: `metalShiny()`, `wood()`, `fabric()`, `glass()`, `plastic()`, etc.** and replace the inline `new THREE.MeshStandardMaterial({...})` calls in zones 1-2 with these. Shared ones should be cached so we don't pay the alloc cost N times.

### CEO portrait
- The current portrait is `drawMangaCEO(canvas)` at `play/play.js:~705`, a hand-painted manga drawing on canvas. The user finds it "creepy". **I'll replace this single function** with a flat-color cartoon mascot in the same dimensions (768×1024). Easter egg `if (allDone)` floating-hearts logic stays untouched.

### Conservative choices made up-front
- **No external dependencies**, all primitives.
- **Reuse the existing dust system** for steam/smoke (per the brief).
- **Keep room dimensions** for now — reach for the 15-20% downscale only if Reception still feels empty after decoration.
- **Faces are flat sprites parented to the head** rather than 3D meshes — cheaper and easier to swap expression. Anchored on the head's +Z so they always face the same way as the head.

