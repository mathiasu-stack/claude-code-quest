# Phase 4a advance-work handoff — FIN-02 + FIN-07 modules

Two new self-contained ES modules, no existing files touched.

## play/world/floorM.js (FIN-02)

```js
import { buildFloorM } from './world/floorM.js';
const fm = buildFloorM({ baseY, floorIndex = 5 });
// → { group, colliders, fragmentSpot, update }
```

- `group` — THREE.Group at (0, baseY, 0), pre-tagged `userData.floor = floorIndex`
  so `applyFloorVisibility()` works untouched. Integrator: `scene.add(fm.group)`.
- `colliders` — array of `{ minX, maxX, minZ, maxZ, floor }` (the exact shape the
  `colliders` array in play.js consumes). **Caution:** `rebuildColliders()` /
  `registerStaticColliders()` rebuilds the array from scratch — push the Floor M
  AABBs inside that function (gated on `loadedFloors.has(5)`) or they'll vanish
  on the next editor rebuild. Includes a shaft-vestibule back-stop mirroring the
  per-floor shaft AABBs (the `for f` loop only covers f ≤ FLOORS_TOTAL).
- `fragmentSpot` — THREE.Vector3, world coords (baseY included):
  the lamp-lit cleared mat at the desk's west end. SYS-06 places the
  `learnings.md fragment 2` readable there. Collectible NOT built here.
- `update(dt)` — dt in seconds; animates the scrolling-log screen, the lobby
  cam feed, and rack LEDs. Wire: `decoTickers.push((dt) => fm.update(dt))`
  (decoTickers callbacks receive `(dt, now)`; only dt is used).

### Layout / interface assumptions made

- Room footprint x ∈ [-3.0, 11.2], z ∈ [-11.6, -3.6] (14.2 × 8 m). Child
  positions are world XZ (group sits at x=0,z=0). The one door gap is in the
  EAST wall at z ∈ [-8.8, -6.4] — same opening as the floors 2–4 elevator
  shaft, so the standard post-ride spawn `player.position.set(10.0,
  floorBaseY(f), -7.6)` lands just inside the door. No play.js spawn change
  needed beyond the floor number.
- **floorBaseY(5) currently clamps to floor 4** (`FLOORS_TOTAL = 4`). The
  integrator must raise FLOORS_TOTAL or special-case floor 5 before computing
  baseY (FIN-01/FIN-02 glue). Same clamp exists in `_restoreSavedFloor`.
- `loadFloor(5)` wiring: call `buildFloorM` instead of `buildFloorOffice(5)`,
  then the usual `spawnNPCsForFloor` is N/A (Maya is FIN-03's roster job),
  then `registerReadableNotes()` + `refreshCameraWalls()` (the loft's walls
  satisfy the thin/tall camera-wall heuristic automatically).
- Wall height 3.8 / ceiling at +4.0 matches FLOOR_OFFICE_WALL_H so the
  elevator camera path behaves identically.
- Lighting is warm point-light pools only (no ceiling wash). Global scene
  ambient still applies; for the full hidden-loft feel the integrator may
  dim the global ambient while `currentFloor === 5` (optional).
- Server rack is a simplified twin, NOT `buildServerRack` from
  `objectTypes/serverRack.js` — that builder scene.adds itself and registers
  a "run diagnostic" interactable (wrong story affordance for the loft).
- Plants render procedurally immediately and upgrade themselves to the
  `plant.glb` decoration via a lazy dynamic import of
  `decorationAssets.js` if the GLB cache is (or becomes) warm. No await
  needed at the loadFloor call site.
- Draw calls ≈ 150 (16 folder stacks × 3–6 shared-geometry boxes is the bulk).
  Canvas textures: 10 × 256×160 + 1 tape label.

## play/ui/titleCard.js (FIN-07)

```js
import { showTitleCard } from './ui/titleCard.js';
showTitleCard({ text = 'THE KEDASH PROTOCOL', subtext, holdMs = 2200, onDone });
```

- DOM overlay, z-index 99990, `pointer-events: none` — non-blocking, sits
  over the three.js canvas. Timeline: 1.2 s fade-in → holdMs → 1.4 s fade-out
  (~4.8 s default), then the node removes itself and `onDone` fires.
- Styles self-injected via one-time `<style>` tag (roomsEditor pattern);
  style.css untouched. Gold serif with animated letter-tracking, navy-black
  radial backdrop, gold hairline rule, optional mono subtext line.
- Re-entrant: calling again replaces the active card (old onDone NOT fired).
- Epilogue wiring (FIN-07): call from the closing-exchange scene completion,
  ideally under the existing fade so the cut-to-black lands first.

## Verification status

`node --check` could NOT be run — the Bash safety classifier was unavailable
for the whole session ("claude-fable-5 is temporarily unavailable"). Both
files need a syntax pass before wiring. Both are ES modules using bare
`import * as THREE from 'three'` like sibling modules; index.html script-tag
load order is unaffected (play/ side is module-imported, not script-tagged).
