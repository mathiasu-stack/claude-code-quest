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

---

## Pillar 1 — flat face architecture (B2/B3/B4)

Branched: `bugfix/flat-faces`.

- **B2** (`0f0d0e0`): Built `play/characters/flatFace.js` and
  `play/characters/faceConfigs.js`. Replaced the `attachCartoonFace` call inside
  `makeCharacter` (the SINGLE attach point) with `attachFlatFace`. Player passes
  through a `_faceConfig` object so customization values land in the canvas.
- **B3** (`f43b7df`): Ambient agents in `play/world/liveAgents.js` now set
  `_id: 'ambient-${seed}'` so each gets a unique deterministic config via
  `getFaceConfig`'s hash branch.
- **B4** (`48c4141`): Talk pulse wired into the dialogue typewriter — open/close
  mouth at ~110ms cadence for the duration of the intro line.

Result: every character — player, named NPC, auto NPC, ambient — now routes
through the flat-quad face. Structurally impossible to skip.

---

## Pillar 2 — critical bug sweep (B5/B6/B7)

### Bug A — Library brightness (B5, `b1545c9`)
File: `play/lighting/zone-presets.js`. Lifted ambient 0.5 → 0.95, directional
0.55 → 0.95, added a head-height fill at `[0, 1.7, 20]`, softened bloom +
vignette, pushed fog back. Verified accents of type `'point'` instantiate as
`THREE.PointLight` at `lighting/manager.js:154` — they ARE real lights paired
with the pendant cone shades at `world/ceilings.js:209-225`.

### Bug B — Staircase support + collision (B6, `3811eac`)
File: `play/world/atrium.js`, `play/play.js`. Two parts:
- Added a slanted chrome STRINGER directly under all 14 steps —
  `BoxGeometry(0.18, 0.16, 4.69)` tilted -0.479 rad. Reads as the structural
  backbone, kills the "floating" look.
- Added an atrium-only collision rect to `clampMove`: inside `newZ ∈ [-3.4,
  0.7]` with `newX < -8.85`, push to `-8.85`. (Player torso half-width 0.275
  → -8.85 keeps body fully clear of step east edge at -9.13.)

Math verified by node REPL — see commit message.

### Bug C — Floating black rectangle (B7, `e504b70`)
File: `play/world/atrium.js`. The KEDASH wordmark backing was an
`8 × 1.6 × 0.06` `0x1a1a1a` (near-black) box on the cream upper wall, paired
with a wordmark canvas opaquely filled with `#0d0d12`. Together: a giant
floating black rectangle.
- Backing recoloured to brushed silver (`0xc8ccd2`, metalness 0.85), slimmed to
  `7.8 × 1.5 × 0.04`.
- Wordmark canvas: `clearRect` instead of opaque dark fill, halo gradient now
  fully transparent at edges, text colour swapped to dark `#1a2230` so it reads
  against the silver backing.

### Bug D — Reception floor seam (B7, `e504b70`)
File: `play/world/atrium.js`, `play/play.js`. Atrium marble overlay at y=0.005
met Library floor (y=0) head-on at the doorway → 5mm vertical seam under
player's feet. Dropped marble Y to 0.001, bumped gold runner Y to 0.0025 to
keep it above the marble.

### Bug E — GROW poster clipping into staircase (B7, `e504b70`)
File: `play/decorations/reception.js`. GROW poster at world z=0 on the west
wall — its z-extent (±0.8) overlapped the stair's top steps at z=-0.7..-0.5.
Moved to z=+5 (clear of stair footprint, 1.4m gap from STAY at z=+8).

### Bugs F/G — Player face missing, named NPCs missing faces
Resolved as part of Pillar 1 (every character routes through `attachFlatFace`
in `makeCharacter`; player has a guard at `buildPlayer` that logs
`[buildPlayer] FACE MISSING` if userData.face is null).

---

## Self-check

- All 8 touched JS files parse cleanly via `node --check`.
- All Pillar 1 + Pillar 2 commits land on `bugfix/flat-faces` (not `main`).
- No `attachCartoonFace` remaining in `makeCharacter` path.
- Visual confirmation in browser is deferred — cannot launch a 3D
  WebGL scene from this environment. The geometry math, light wiring,
  and canvas drawing logic have been verified by reading the code,
  but final pixel-level "looks right" judgment needs a human in a
  browser session.
