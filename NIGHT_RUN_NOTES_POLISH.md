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

---

## Morning checklist

Hard-refresh first. Web Station/browser caches are aggressive.

### Characters — what to look for
1. **Faces.** Every NPC and the player have a cartoon face. Linda has soft eyes + smile (kind), Marcus has narrow eyes + flat mouth (focused), Kenji has dot eyes + smirk (smug), Diana has angled brows + flat mouth (stern), Sarah is sharp/focused, Aisha is round/happy.
2. **Blink.** Watch any NPC for 5 seconds; they should blink with a 100 ms closed eyelid. The player blinks too.
3. **Look-at-player.** Walk within 4 m of any NPC; their head should turn toward you, smoothly. Walk away and the head returns to neutral.
4. **Idle gestures.** Stand near each NPC for 5–10 s:
   - Linda: occasional wave with the right arm.
   - Marcus: periodic glasses-adjust.
   - Aisha: typing in mid-air, hands jittering.
   - Kenji: open-handed sweeping gesture.
   - Diana: holds clipboard up, occasionally jabs to flip a page.
   - Sarah: foot tap with the right leg.
   - Elena/Raj: head tilted slightly, both arms raised reading.
   - Mei: typing.
   - Noor: clipboard.
5. **Breathing.** Stand still and watch the player. Torso should oscillate ±2% Y-scale at ~1 Hz. Subtle.
6. **Accent stripes.** Each NPC has a thin horizontal stripe across the upper chest in their accent color. They should be identifiable by colour from across the room.
7. **Customization.** Click the 👤 button on the top-left (below the back arrow). Pick a different face style — the player should rebuild instantly with the new face. Try hair colour and skin tone too. Reload — your selection persists.

### Reception — what to look for
8. **Posters.** GROW / SHIP IT / STAY curious / BE KIND should be readable from 5 m away. Big, gold-on-navy.
9. **Reception desk.** Should have a stapler, a pen cup with 4 pens, a sticky pad, a mug, a small succulent, a paper stack — all on the surface.
10. **Doormat.** Dark mat at the front entrance.
11. **Couches.** Two couches now have throw pillows in red, yellow, blue.
12. **Wall clock.** On the left wall — minute hand should rotate visibly (1 deg/sec).
13. **Ceiling lights.** Five recessed warm-glow discs in the ceiling. Look up.
14. **Marcus's bench.** Open laptop, server tower with 5 LEDs (green, blinking individually), succulent on the desk.
15. **Kenji's screens.** Three displays — one shows scrolling code, one a sine wave, one "LIVE". All animate (~3 fps refresh).
16. **Diana's cabinets.** Each has a label (A–F, G–M, N–Z).
17. **Whiteboard.** "Q4 GOALS" with bullet list on the right wall.
18. **Skirting.** Dark wood trim along every wall edge.
19. **CEO portrait.** Friendly cartoon now, NOT the unsettling manga. Big round teal eyes, soft smile, gold halftone background, navy blazer with gold lapel pin.

### Library — what to look for
20. **Reading tables.** Each has an open book with bookmark + a teacup.
21. **Globe.** Spinning slowly on a stand to the left of the front tables.
22. **Ladder.** 2.6 m wood library ladder against the left bookshelf.
23. **Grandfather clock.** Back-left wall — pendulum should swing visibly, hands rotate.
24. **Reading nook.** Armchair + sidetable + book stack at the back-right.
25. **Librarian cart.** Wheeled cart with a stack of books.
26. **Hanging plant.** Near the entrance, vines drooping down.
27. **QUIET poster** on the right wall.

### Material variety
28. **Gold runway** — should look genuinely metallic, catching the warm directional. Reception gets brighter where it crosses the runway.
29. **Filing cabinets** read as painted metal (visible specular highlights from the directional).
30. **Monitors** glow even in the darkest part of the Library — emissive screens.
31. **Couches** look matte fabric (no shine), pillows likewise.
32. **Water cooler bottle** has a glassy sheen at the right viewing angle.

### Mobile
33. The new face textures are tiny (256×256, cached) and the new geometry is all primitives. Should still hit 30+ FPS.
34. Customization panel should be tap-friendly (chip targets are 60×~36).
35. Audio panel + customization panel both auto-close on outside-tap.

### Files added (clean diff for review)
- `play/characters/face.js` (~270 lines)
- `play/characters/expressions.js` (~30)
- `play/characters/idleAnimations.js` (~110)
- `play/characters/customization.js` (~140)
- `play/decorations/shared.js` (~370)
- `play/decorations/reception.js` (~150)
- `play/decorations/library.js` (~80)
- `play/materials/presets.js` (~70)
- `NIGHT_RUN_NOTES_POLISH.md` (this file)

### Files modified
- `play/play.js` — wiring + roster updates + a few inline material tunes + replaced `drawMangaCEO` with `drawCeoPortrait`.
- `style.css` — customization panel CSS.

### Known issues / follow-ups
- Faces are flat planes pinned to the head's +Z; they don't billboard, so seen from directly behind, the back of the head is featureless (which is correct, but if you want hair-back detail you'd need extra geometry).
- The "look-at-player" head turn ignores Y — the head doesn't tilt up/down even if the player jumps. Acceptable.
- Marcus's gesture (glasses-adjust) writes to `rightArm.rotation.x` — same channel as his prop's tablet hand, so during a long gesture cycle the tablet visibly moves. Looks OK on review but could read odd.
- The grandfather clock's pendulum and hour/minute hands run on a fictional fast clock (1 deg/sec on the minute hand) for visual interest, not real time. Easy to fix later by computing from `Date.now()`.
- The new posters use bold serif "GROW" etc. — if you want a different typographic vibe, edit `buildPosterTexture` in `play/decorations/shared.js`.
- The CEO portrait's easter-egg ending was preserved end-to-end: when all 16 chapters are passed, plaque turns pink and hearts orbit.

### Commits to review (newest first)
- `fc4efe0` P12 scale decision + log
- `044b4d4` P11 friendly CEO portrait
- `aba9e0b` P10 material variety
- `db37c48` P8/P9 decoration density
- `3ed567c` P7 player customization
- `6cc7472` P5/P6 idle anim + signature gestures
- `653ad1d` P4 expressions + accent stripes + emissive shirts
- `d8cc7a6` P3 face roll-out + look-at-player
- `055681c` P2 face system module
- `5eb8241` P1 exploration

If anything looks off, revert target is `055681c` (the moment the face system appeared). Reverting that brings the previous featureless silhouettes back.




