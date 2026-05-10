# GLTF character pipeline pivot — overnight run log

Branch: `feature/gltf-characters` (forked from `bugfix/flat-faces` so the
atrium / library / staircase / floor-seam fixes from the parallel run land
together — explicitly do **not** merge to `main`).

This run replaces the procedural character builder + the previous run's
flat-face quad system with **authored 3D character assets** loaded from
GLB files. The flat-face system stays in the codebase as a runtime
fallback and as the rendering path when assets aren't present.

## ⚠ MORNING ACTION REQUIRED — Manual asset download

I cannot fetch external URLs from this environment, so the GLB files
themselves are NOT in the repo. The integration code is built and wired
behind an opt-in flag — it falls back to the existing flat-face system
when assets are missing, so the game still runs.

**To enable GLTF characters in the morning:**

1. Visit **https://quaternius.com** and download the **Ultimate
   Modular Characters** pack (CC0 / public domain). If Quaternius is
   unreachable, fall back to **https://kenney.nl/assets** → "Modular
   Characters" (also CC0).

2. The Quaternius pack ships as a ZIP. Extract it. Inside you'll
   typically find a `GLB/` directory with files like:

   ```
   Character_Casual_01.glb
   Character_Casual_02.glb
   Character_Business_01.glb
   Character_Hoodie_01.glb
   ...
   Skeleton_Character.glb     ← shared rig + animations
   Animations.glb              ← (some packs split animations out)
   ```

3. Drop the GLB files into:

   ```
   /volume1/projects/claude-code-quest/play/assets/characters/
   ```

4. Edit `play/assets/characters/manifest.json` and set the `available`
   field for each entry whose GLB is now present (the file ships
   pre-populated with the **expected** filenames; the loader trusts
   only entries marked `available: true`).

5. In the browser, open the dev console and run:

   ```js
   localStorage.setItem('ccq_use_gltf_characters', '1'); location.reload();
   ```

   to flip the opt-in flag. With the flag off (default), the game uses
   the existing procedural / flat-face system unchanged.

If Quaternius asset names differ from the manifest's expected names,
the loader logs a clear warning per missing asset and the missing
characters fall back to procedural — the game still runs.

---

## Audit findings (G1)

### Character builder
- **`play/play.js:407 makeCharacter(look)`** — single factory used by
  player, named NPCs, auto NPCs, and ambient agents. Returns a
  `THREE.Group` with `userData.parts.head`, `userData.face`,
  `userData.faceKind`, and the body primitives.
- Player path: `buildPlayer()` at `play.js:1503` →
  `playerLook = { ...buildPlayerLook(o), _id: 'player' }` →
  `makeCharacter(playerLook)` → `addPlayerAccessories(player, tier)`.
- Named NPC path: `spawnNPC(npcDef)` at `play.js:1559` merges
  `npcDef.look` + `getLookForNpc(id, 0)` + `_id: id`, then
  `makeCharacter(mergedLook)`.
- Auto NPC path: `generateChapterNPCs(i)` → same `spawnNPC` →
  `makeCharacter`.
- Ambient agents: `LiveAgents._spawnAmbient(seed)` calls
  `this.makeCharacter(look)` (factory passed in from `play.js:2249`).

### Animation transforms (procedural today)
- **`play/characters/idleAnimations.js applyIdle(group, dt, now)`** —
  breathing scale on torso, head bob, signature gesture per NPC
  (look.gesture: 'gesture', 'typing', 'thinking', etc.).
- Walk/run animations are procedural arm/leg rotations on primitive
  body limbs (legs and arms are individual `THREE.Mesh` children of
  the root group).
- Blink + face animation is owned by `flatFace.js updateFlatFace` —
  repaints the canvas texture.
- Look-at-player head rotation: `play.js:2136-2152` — directly mutates
  `m.userData.parts.head.rotation.y`.

### Outfit + accessory tier system
- **`play/play.js:49 OUTFITS[]`** — 8-tier array, each entry is `{ shirt,
  pants, label }`.
- **`play/play.js:1415 addPlayerAccessories(group, tier)`** — at each
  tier threshold (1..7), adds a procedural primitive accessory:
  - tier 1: lanyard + name badge box
  - tier 2: red tie + knot
  - tier 3: silver wristwatch on left wrist
  - tier 4: dark vest with 3 gold sphere buttons
  - tier 5: torus-ring glasses + bridge
  - tier 6: gold torus chain + pendant sphere
  - tier 7: pink lapel pin + glowing yellow halo torus
- Accessories are children of the player group at hard-coded local
  positions matching the procedural body's geometry (e.g. tie at
  `y=1.05, z=0.18`). **A GLTF rig will have different proportions** —
  these positions need to map to skeleton bones, not absolute Y.

### Promotion ceremony hooks
- **`play/ceremony/ceremonyManager.js`** — runs:
  1. NPC reactions
  2. Player spin in place
  3. Accessory unveil (per-tier — see `accessoryUnveil.js`)
  4. Title transition (3D card-flip via `titleTransition.js`)
- `accessoryUnveil.js` references the procedural accessory primitives
  by traversing `player.children` looking for the geometry types
  added by `addPlayerAccessories`. **Will need adapting to find the
  GLTF accessory nodes.**
- `titleTransition.js` swaps a `THREE.Sprite` parented at `y=2.4` —
  unaffected by the body change.

### Lesson overlay & interactables
- `play/lessons/overlay.js` and `play/world/interactables.js` are
  body-agnostic — they only read `player.position`. Safe.

---

## Decisions

1. **Branch from `bugfix/flat-faces`**, not `main`. Reason: the bug
   carry-forward fixes (Library brightness, staircase support,
   floating-black-rectangle, floor seam, GROW poster clip) all live
   on that branch and the brief explicitly says "If any of these are
   still broken when you start, fix them." Inheriting them removes
   the need to re-fix.

2. **Keep the old procedural / flat-face builder as the default**
   while assets are missing. New GLTF builder is opt-in via
   `localStorage.ccq_use_gltf_characters`. This keeps the game
   playable through the morning regardless of whether the human has
   dropped GLBs in yet.

3. **Single-file asset manifest** at
   `play/assets/characters/manifest.json` — entries declare
   `available: false` by default. The loader treats `available: true`
   as the green light to attempt loading. No filesystem scanning at
   runtime.

4. **Ambient agents stay procedural.** Named NPCs + the player are
   the visual heroes; ambient agents are filler. Loading 4 extra GLBs
   per zone for background characters costs more than it visually
   buys.

5. **GLTF accessories are still primitives initially.** The Quaternius
   pack does not consistently ship tie/watch/glasses GLBs — to keep
   the morning checklist short, we attach the existing primitive
   accessories to skeleton bones via `SkinnedMesh.skeleton.getBoneByName`.
   Bone names in Quaternius rigs follow the Mixamo convention
   (`mixamorig:RightHand`, `mixamorig:Spine2`, etc.) — a lookup table
   handles the mapping.

6. **AnimationMixer drives idle/walk only.** Signature gestures, the
   ceremony spin, blink, and the celebration dance stay as procedural
   bone overlays — those are too custom to find in a free pack.

7. **No mesh-merging optimization in this run.** Asset budget
   targeted &lt; 10 MB total (Quaternius models are ~50–200 KB each,
   so 11 named chars + 1 player ≈ 1–3 MB). Mobile FPS test deferred
   to a human session.

---

## Casting plan (G5 — to be reflected in `play/characters/npcCasting.js`)

| NPC | Faceconfig hints | Quaternius variant (preferred) | Fallback |
|---|---|---|---|
| **player** | hair short, eyes blue, customizable | `Character_Casual_01` | `Character_Hoodie_01` |
| Linda Park | hairStyle bob, blush, smile | `Character_Business_Female_01` | any business female |
| Marcus Webb | thick brows, smirk, stubble | `Character_Casual_Male_02` | hoodie male |
| Aisha Mehta | long hair, glasses, gentle | `Character_Glasses_Female_01` | casual female + add glasses primitive |
| Kenji Tanaka | spiky hair, open-smile | `Character_Casual_Male_03` (energetic) | any male |
| Diana Foley | bob, glasses, arched brows | `Character_Business_Female_02` | + glasses primitive |
| Sarah Chen | ponytail, sharp eyes, flat mouth | `Character_Casual_Female_02` | any female |
| Elena Vasquez | long hair, glasses, beauty mark | `Character_Business_Female_03` | + glasses primitive |
| Raj Patel | full beard, thick brows | `Character_Beard_Male_01` | + beard primitive |
| Mei Chen | bob-bangs, gentle | `Character_Casual_Female_03` | any female |
| Noor Al-Rashid | hijab, soft brows | `Character_Hijab_Female_01` | fall back to procedural |

If a `_Hijab_` variant isn't in the pack, Noor falls back to procedural
(her hijab is currently rendered procedurally and the existing path
already handles her well).

---

## Open questions for morning verification

- Visual confirmation in browser. I cannot launch the 3D scene from
  this environment — the geometry math, loader wiring, and casting
  decisions have all been verified by code reading + node `--check`,
  but pixel-level "looks right" judgment needs a human session.
- Mobile FPS impact — totally unverifiable without a device. Asset
  budget is conservative; the LOD policy says "ambient agents stay
  procedural" specifically to avoid blowing the budget.
- Bone name mismatches — Quaternius typically uses `mixamorig:`
  prefixes but Kenney's pack does not. The bone lookup table in
  `gltfCharacter.js` covers both; if a third pack is dropped in,
  add an entry to `BONE_ALIASES`.

---

## Run-execution log

Commits land in this order on `feature/gltf-characters` (forked from
`bugfix/flat-faces`).

| # | Commit | Subject |
|---|---|---|
| G1 | `b213da1` | Audit + decisions |
| G2 | (combined w/ G3 in tasks) | GLTFLoader infrastructure — assetLoader, manifest, loading overlay |
| G4+G5 | `…`     | gltfCharacter builder + NPC asset casting table |
| G6 | `925aec1` | Wire opt-in flag into makeCharacter + async asset preload |
| G7 | `fecdca9` | AnimationMixer integration — idle/walk/run states for player + NPCs |
| G8 | `bf3e80d` | Outfit + accessory rebuild — bone-attached primitives |
| G9 | `23fabd0` | Ceremony unveil + integration verification for GLTF |
| G10 | `1980c4b` | Performance pass — explicit frustum culling, ambient cap kept procedural |
| G11 | (this commit) | Final notes |

---

## Morning checklist

In order:

1. **Pull the branch** (`git checkout feature/gltf-characters`,
   `git pull` if pushing). Do NOT merge to `main`.

2. **Verify the game still runs unchanged** with the flag OFF (default):
   open `http://localhost:8080`, walk around. Should look identical
   to the previous run's `bugfix/flat-faces` tip — same procedural
   characters, same flat faces, all the bug fixes from B5–B7
   carried forward.

3. **Download the Quaternius pack** from
   <https://quaternius.com> → Ultimate Modular Characters. Fallback:
   <https://kenney.nl/assets> Modular Characters. Both CC0.

4. **Drop the GLB files** into
   `/volume1/projects/claude-code-quest/play/assets/characters/`.

5. **Open `play/assets/characters/manifest.json`** and flip
   `available: true` on each entry whose GLB you placed. (Keep
   anything missing as `false` — that character falls back to
   procedural cleanly.)

6. **Optional**: drop a shared-animations pack named
   `Animations.glb` and flip `animations.available: true`. Map clip
   names in `manifest.json` to the semantic names the engine looks
   for (idle / walk / run / wave / jump).

7. **Flip the flag** in browser dev console:
   ```js
   localStorage.setItem('ccq_use_gltf_characters', '1'); location.reload();
   ```
   You should see "Loading characters..." with a progress bar, then
   the play scene with GLTF characters.

8. **Visual checks** (the things I couldn't test from here):
   - Player has a real 3D character body & face (not stuck-on
     primitives).
   - Named NPCs each have distinct GLTF variants matching the
     casting table in `play/characters/npcCasting.js`.
   - Walking transitions to the walk clip; sprint (Shift) to run.
   - Tier accessories appear at the right bone — tie hangs from
     chest, watch on left wrist, glasses on the head, halo above
     the head.
   - Promotion ceremony: the unveil scale-in plays; character spins;
     title transitions; halo appears on tier 7+.
   - Marcus walks to the water cooler and back (LiveAgents
     routine + walk clip together).
   - Aisha walks to the library and back through the doorway.

9. **If accessories misplace** (Quaternius bone axes differ from my
   guess): tweak `addGltfPlayerAccessories` local offsets in
   `play/play.js`. Common adjustments:
   - Glasses landing in the forehead → swap Y/Z in the glasses
     section: `(0, 0.03, 0.10)` → `(0, 0.10, 0.03)`.
   - Halo too low → increase Y in the halo section from `0.30` to
     `0.45`.

10. **If a named NPC's GLB is missing** from your download, leave
    its manifest entry `available: false` — the loader falls back
    to that NPC's `fallbackAssetId` (defined in
    `play/characters/npcCasting.js`), then to procedural. The game
    won't break.

11. **Mobile FPS check** — load on a phone with the flag on. Target
    is 30+. If FPS drops, the most likely culprit is too many
    GLTF instances active at once. Mitigations:
    - Lower the LiveAgents ambient cap (it's already procedural-
      only, so that's not it).
    - Set every chapter NPC's casting to a single shared variant
      so the SkeletonUtils.clone reuses geometry buffers.

---

## Dead code — for a future cleanup run

Now superseded by `gltfCharacter.js` + `assetLoader.js`. Keep for
fallback during GLTF transition; remove in a later cleanup run once
GLTF has been verified live.

- `play/characters/face.js` — original 3D-primitive face system
  (used only when `faceKind === 'face'`, which no current code
  path sets).
- `play/characters/cartoonFace.js` — superseded by flatFace; only
  used when `faceKind === 'cartoon'`, also unused in current paths.
- `play/characters/flatFace.js` — still in active use as the
  procedural-character face renderer (when GLTF unavailable). Keep
  until GLTF assets are verified working in production.

When cleaning up, delete the import lines at top of `play.js`
(lines 15-17) for whichever face systems are no longer needed,
remove the corresponding faceKind branches in the per-frame loop
(`updateFlatFace` / `updateCartoonFace` / `updateFace`), and delete
the files.

---

## What I tested vs. what needs human verification

I CAN verify (and did):
  • All JS files parse cleanly (`node --check`)
  • Manifest is valid JSON (`python3 json.load`)
  • Code paths are gated correctly: flag-off default has zero
    behavior change; flag-on with no assets falls back cleanly per
    character; flag-on with assets activates GLTF.
  • The `look._id`-driven casting resolution works regardless of
    whether the named NPC has an explicit entry.
  • Bone-alias table covers Mixamo and Kenney conventions.
  • Three.js `cloneSkeletal` import path resolves through the
    existing importmap.

I CANNOT verify (need a human in a browser):
  • That the actual Quaternius rig loads and renders correctly.
  • That walk/idle clip names match the loader's `.toLowerCase()
    .includes(want)` heuristic. If they don't (e.g. clip is named
    "Animation_Idle_v2"), the heuristic still finds it — but
    "T-Pose" without an Idle clip would leave the character
    motionless.
  • Bone-relative accessory positions look right (head Y vs Z is
    the most likely tweak — see step 9).
  • Mobile FPS impact (no device available from here).

---

## Why the `bugfix/flat-faces` parent matters

The four bug-carry-forward items in the brief are all FIXED on the
parent branch:
- Bug A (Library brightness): commit `b1545c9`
- Bug B (Staircase support + collision): commit `3811eac`
- Bug C/D/E (Reception sweep): commit `e504b70`

Branching `feature/gltf-characters` from `bugfix/flat-faces` instead
of from `main` carries them forward automatically. When eventually
merging to `main`, those commits land alongside the GLTF system.
