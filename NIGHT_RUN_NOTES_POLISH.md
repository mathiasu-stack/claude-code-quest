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

## P2-P10 — what shipped

### P2 Face system (`play/characters/face.js` + `expressions.js`)
Procedural cartoon face on a 256×256 canvas plane parented to the head's +Z face. Four face styles (`round`, `dot`, `sleepy`, `sharp`) and seven expression presets (`neutral`, `happy`, `focused`, `tired`, `smug`, `kind`, `stern`). Texture is cached by `(faceStyle|brow|mouth|blush|blink)` so 70+ characters share at most ~14 unique textures. Blink is a separate cached texture; `updateFace(face, now)` ticks every 2.5–7 s with a 100 ms blink.

### P3 Roll-out
`makeCharacter` now returns `userData.parts.head/torso` and `userData.face`, so every character gets the system. Loop calls `updateFace` on all of them. Heads also get a soft "look-at-player" rotation when the player is within 4m of an NPC.

### P4 Per-NPC expressions + accent colors
The hand-written ch1/2 NPC roster now carries `face`, `expression`, `accent`, `gesture` fields:
- Linda — round / kind / red scarf / wave
- Marcus — sharp / focused / blue tie / glasses-adjust
- Aisha — round / happy / orange accent / typing
- Kenji — dot / smug / purple accent / gesture
- Diana — sharp / stern / purple accent / clipboard flip
- Sarah — sharp / focused / gold accent / foot-tap
- Elena — sharp / smug / purple / reading
- Raj — round / kind / dark grey / reading
- Mei — round / happy / orange / typing
- Noor — sharp / kind / gold / clipboard

Outfits also got a slight HSL lift across the palette and torso shirt material now has `emissive: shirtColor` × `0.08` so silhouettes don't disappear in shadow. A horizontal accent stripe across the upper chest is added when `look.accent` is set, with light emissive so it's recognisable across distances.

### P5 Idle breathing + head bob + look-at-player
- Torso Y-scale oscillates ±1.8% at 1 Hz, head Y-position oscillates ±1.2 cm at 0.7 Hz. Subtle but noticeable when characters stand still.
- NPC heads turn toward the player when within 4m, clamped to ±0.7 rad cone, smoothed with `1 - exp(-dt * 4)`.

### P6 Per-NPC signature gestures (`idleAnimations.js`)
Seven gesture types — wave, glasses, typing, gesture, clipboard, foottap, reading. Each is 5–10 lines of trig. NPC roster picks one per character. Player has none (his arms are owned by the walk anim) so the gesture switch falls through and only the breathing/head bob applies.

### P7 Player customization (`customization.js`)
Small panel triggered by a 👤 button on the top-LEFT (under the back button). Three picker rows — face style, hair color, skin tone. On change → save to `ccq_customization` localStorage → tear down and rebuild the player so changes are visible immediately.

### P8 Reception decoration (`decorations/reception.js`)
~30 new props: stapler, pen cup with 4 pens, sticky pad, recycled mug, succulent, paper stack on the desk; doormat at the entrance; throw pillows on both couches (red, yellow, blue); a wall clock with rotating hands on the left wall; 5 ceiling fixtures; tall ficus plant by the entrance; hanging vine plant from the ceiling; second succulent on Marcus's desk; an open laptop on his bench; a server tower with **5 blinking LEDs** under his desk; paper stack on Aisha's desk; **3 animated demo screens** for Kenji (one runs scrolling code, one a sine-wave graph, one a "LIVE" panel — all updated every ~320 ms); A–F / G–M / N–Z labels on Diana's filing cabinets; a whiteboard with marker text on the right wall; **4 large posters** along the side walls (GROW, SHIP IT, STAY curious, BE KIND); **dark-wood skirting** along every wall edge.

### P9 Library decoration (`decorations/library.js`)
~15 new props: open books on both reading tables (with cover, pages, crease, bookmark sticking out); teacups next to each book; a globe on a stand near the centre that **rotates slowly**; a 2.6m library ladder against the left bookshelves; a **grandfather clock** with a swinging pendulum on the back-left wall; a reading nook (armchair + sidetable + book stack of 4) at the back-right; a librarian's cart with a stack of books on top; a hanging plant near the entrance; a stylised "QUIET" poster on the right wall; skirting along every wall edge.

### P10 Material variety (`materials/presets.js`)
Created reusable factories: `metalShiny`, `metalBrushed`, `wood`, `fabric`, `plastic`, `glass`, `monitorScreen`, `glow`. Then tuned the existing inline materials in `play.js`:
- **Monitors** — emissive screen, brushed back, shiny stand. Reads as "on" without lights.
- **Gold runway** — `metalness: 0.85`, `roughness: 0.18` so it actually looks like polished metal.
- **Filing cabinets** — `metalness: 0.6`, `roughness: 0.45` so the directional catches their edges.
- **Couches** — `roughness: 0.95` (fabric).
- **Water cooler bottle** — slight transparency + low roughness for water glint.

### P11 Friendly CEO portrait
The previous "manga seductress" canvas drawing was unsettling and didn't match the game's blocky aesthetic. Replaced with `drawCeoPortrait` — a flat-color cartoon mascot consistent with the in-game face system: warm gold halftone background, big round teal eyes with sparkles + lashes, soft blush dots, gentle smile, small earrings, navy blazer with white v-neck and a gold lapel pin. The "♥ CEO ♥" / hearts easter egg path is unchanged — buildCeoPortrait still flips the plaque + spawns hearts when all 16 chapters complete.

### P12 Scale + density check — DECISION: keep current 22×22 dimensions
Reception now has ~30 distinct props on the floor / desks / walls. Library has ~15 plus 8 bookshelves + 2 tables. Both feel inhabited. Downscale not needed.



