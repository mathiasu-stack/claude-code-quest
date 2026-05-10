# Flat-face architecture pivot + bug sweep — overnight run log

Branch: `bugfix/flat-faces` (forked from `main`, merged with `feature/fidelity-pass` to have the full atrium/marble/staircase context the bugs reference).

## B1 — Audit findings

### Maya portrait — the reference technique
- `play/play.js:779 drawCeoPortrait(canvas)` — paints the full Maya face onto a **single 768×1024 canvas** using Canvas2D drawing calls only.
- `play/play.js:972 buildCeoPortrait(targetScene)` — creates the wood/gold picture frame as 3D geometry, builds the canvas, wraps it in a `THREE.CanvasTexture`, applies to a `MeshBasicMaterial` and that material to a `PlaneGeometry` mesh placed inside the frame.
- The face is a **single flat quad with a canvas texture** sitting inside the frame. There is no 3D mouth/nose/eye/eyebrow assembly. This is exactly the technique to use for every character.

### Player build path
- `play/play.js:1477 buildPlayer()` calls `makeCharacter(playerLook)`.
- `playerLook` comes from `play/characters/playerLook.js` — converts the customization choices into a `look` object.
- `makeCharacter` at `play.js:396` creates body parts including the head sphere, then at line 526 calls `attachCartoonFace(g, head, look)`.
- **Both the player and every NPC currently use `attachCartoonFace`.** That function (the previous run's 3D-primitive approach) is what's making faces look bad.
- I will REPLACE the call to `attachCartoonFace` with a call to a new `attachFlatFace` so every character — player included — goes through the new path.

### NPC build path
- `spawnNPC(npcDef)` at `play.js:1517` calls `makeCharacter(mergedLook)`. Same path as the player.
- Auto-generated NPCs (chapters 3-16) also go through `spawnNPC` → `makeCharacter`. Covered.

### Ambient agents
- `play/world/liveAgents.js _spawnAmbient` calls `this.makeCharacter(look)` — the same factory. Covered.

### Library lighting preset
- `play/lighting/zone-presets.js:91 LIBRARY_PRESET`. Current values: ambient intensity 0.5, directional 0.55, two desk lamp accents at intensity 1.9. **Critical bug A**: ambient + directional are too low. Will bump ambient to **0.85** and directional to **0.85** in the fix.
- Desk lamps at z=16 and z=22 ARE attached as `point` accents (verified at lines 108-109). They DO emit light — not just emissive meshes.

### Staircase
- `play/world/atrium.js:323` — `stairGroup` at world position **(-10.2, 0, -3)** with a vertical chrome support pillar already in place (the previous run's fix). Stairs themselves are at local `x ≈ 0.10 + cos(a)*0.30`, so step world x ≈ -10.1 to -9.8. **The player movement clamp is x ∈ [-10.5, 10.5].** This means the player CAN reach the staircase footprint at x = -10.0 (the steps protrude into the playable zone by 0.5m).
- **Fix for collision**: pull the staircase steps further west AND tighten the movement clamp near the staircase to prevent player walking through.

### Collision system
- The "collision" in this codebase is the `clampMove` function at `play.js:345`. It's not mesh-based — it clamps the player's x and z into rectangular zone bounds with doorway corridors.
- To "add staircase collision" I need to add an exclusion rectangle to clampMove for the staircase footprint OR move the staircase entirely behind the wall clamp.
- I'll pick the SIMPLER fix: move the staircase entirely behind the wall clamp (x ≤ -10.5) so the player physically cannot reach it. The visible part will still be visible (it's beyond the wall clamp but in front of the wall mesh at x = -10.95).

### Decisions made

1. **Replace** `attachCartoonFace` with a new `attachFlatFace` at the SINGLE point in `makeCharacter`. This guarantees every character (player, NPCs, ambient agents) goes through the new path. No risk of selective application.
2. **playerLook.js stays as-is** but I'll add a check at the bottom of `buildPlayer` that asserts the player has a face quad attached — and logs loudly if not. The brief is explicit that "if after 5 attempts the player still has no face, write a detailed entry". I want a CI-style guard.
3. **Flat-face quad anchored, not billboarded** — per the brief. Angle-based opacity fade for >70° off-axis.
4. **Canvas size 256×256** — crisp at typical character distances, cheaper than 512. Each character's canvas is generated ONCE at attach time + repainted only on blink / expression change.
5. **Library lighting**: bump ambient to 0.85 (+70%), directional to 0.85 (+55%), keep desk lamps at 1.9 (already strong).
6. **Staircase**: move it entirely behind the wall clamp (`x = -10.7`). Player can never reach it.

