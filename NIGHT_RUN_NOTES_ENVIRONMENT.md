# Overnight environment + atmosphere run — log

Goal: fix the "unfinished demo" feel — sky, ceilings, depth, name tags — then push production value with time-of-day, NPC routines, and a parallax skyline.

## E1 — Exploration

### Hot points
- **Scene root**: `play/play.js:1019` — `scene = new THREE.Scene()` inside `buildWorld()`. Background and fog already set on lines 1022-1023 (currently a flat `0xeaf3ff` color and a linear fog 30–70m). Sky/fog are also re-applied per zone by `LightingManager.applyPreset()` (in `play/lighting/manager.js:60-70`). **The sky upgrade plugs in at LightingManager so it stays preset-driven.**
- **Renderer**: `setupRenderer()` at `play.js:1448`. Tone mapping is `ACESFilmicToneMapping`, exposure 1.05. Lighting rebalance at the end of the run will retune zone hemisphere intensities, not exposure.
- **Walls / room boundaries** (zone 1): the back wall `wall(22, wallH, 0.3, 0, wallH/2, -11)` and side walls / front wall split with doorway. Walls are `wallH = 3.8`. **Ceiling plane sits at y=wallH (3.8).** Library has the same dimensions.
- **Name tags**: `makeLabelSprite` at `play.js:512`. Each NPC gets a tag in `spawnNPC` at `play.js:1417`. Tag is currently a Sprite added to the NPC's group at y=2.45. Tier badge on the player at y=2.4. Same factory used for door labels and the CEO plaque. **Refactor will not touch the factory — instead, I'll add a per-tag fade/occlusion pass each frame inside the existing main loop.**
- **NPC update loop**: `play.js:~2050` — for each NPC: face blink + applyIdle + look-at-player head turn. **NPC routines slot in here** (waypoint lerps + face direction adjust).
- **Dust system**: `play/lighting/dust-motes.js` — already tinted warm. The library window light streaming will emphasise these existing dust motes; no new particle system needed.
- **Audio bridge**: `window.PlayAudio.cheer/uiClick/...` already exposed. Live-world ambient sounds (typing, page turn, phone ring) will use the existing AudioManager directly via small procedural builders.

### Conservative choices made up-front
- **Sky = 12-vertex inverted sphere with vertex colors** (gradient top→bottom) on the `BackSide`. Cheaper than a real Sky shader and avoids importing Three.js's `Sky` add-on.
- **Time-of-day update cadence: 1 Hz, not per-frame.** Cheap to compute. Per-frame interpolation between the two anchor times happens cheaply (one lerp on directional intensity + a few color sets per second).
- **Skyline: Group of ~15 instanced-ish Boxes.** No instancing API — at 15 boxes the cost is negligible. Parallax shift = 5% of player movement subtracted from skyline group position (so it appears further away).
- **Name tag fade**: linear distance falloff from camera, no occlusion raycast on mobile (raycast adds CPU cost with N tags). Desktop gets a simple raycast against scene walls only.
- **Reception centerpiece** — picking the **rotating Kedash logo installation** for branding payoff over the seating cluster. Logged.
- **Hallway depth illusion**: a separate "fake" room mesh outside the build but visible through the front doorway gap; it has a distant point light and fog so geometry fades. Player can't enter (movement bounds clamp them at the doorway already).

## E2-E13 — what shipped

### Mid-run UX fix (committed mid-stream)
- Lessons / tests now **auto-return to play** after success (1.4s lesson, 2.6s passed test). Failed tests don't auto-return — feedback stays.
- Player rotation lerps toward the input heading (stiffness 7) instead of snapping. Camera follow lerp dropped to stiffness 5 so it trails the body slightly. Result: smoother turns, more cinematic.

### E2 Sky + fog (`world/sky.js`)
Inverted icosphere skydome with vertex-color gradient (top, horizon, bottom). Optional sun quad with adjustable direction/opacity. Per-zone presets (`RECEPTION`, `LIBRARY`, `SERVER_ROOM`, `DEFAULT_SKY`). Skydome anchors to camera each frame so the player can't reach the boundary. **The blown-out white horizon is gone.** Fog values tightened per zone — Reception 30→75m warm cream, Library 18→55m moody dark.

### E3 Ceilings (`world/ceilings.js`)
Reception now has a drop-tile ceiling at y=3.8 with a 6×6 grid texture, crown molding around the perimeter, six recessed light fixtures (2 over each desk pair plus 2 over the runway), and 2 air vents. Library has a wood-beam plank ceiling at y=3.6 with three heavy crossbeams and 2 hanging pendant lamps over the reading tables (geometry only — light comes from the pre-existing point lights underneath).

### E4 Reception windows + skyline (`world/depth.js`)
Three 2.4×1.8 wood-framed windows at x=10.83 (east wall) z=-3, 0, 3. Behind them, a procedural city skyline of 14 boxes with canvas-generated lit-window facing planes. Skyline parallaxes 5% opposite the player's movement so it reads as far away. Window glass has subtle blue tint with low opacity.

### E5 Library arched window
Tall arched east-wall window at x=10.83 z=24, with a torus-half forming the arch. An additive golden plane on the floor angled toward the reading tables fakes "light streaming in" — picks up the existing dust motes nicely.

### E6/E7 Doorway peeks + hallway (DECISION: skipped explicit work)
- Doorway peek between Reception and Library is already provided by the existing geometry (the doorway gap at z=11 lets you see straight in). No additional work needed.
- Hallway: removed from build because Reception has no usable wall for it (back is CEO portrait, sides are walls / windows, front is the Library doorway). Documented and skipped. The hallway code in `world/depth.js` is preserved for future use.

### E8 Time-of-day (`world/timeOfDay.js`)
Reads `Date.now()` once per second. Anchor times: 0, 5, 7, 12, 17, 20, 22 hours, each with `{skyTint, ambientTint, directionalIntensityScale, ambientIntensityScale, sunOpacity, sunDirY, exposure, nightWindowGlow}`. Linearly interpolates between adjacent anchors. Modifies the LightingManager's hemi/dir/exposure values **on top of** the preset baseline (re-applied on zone change so transitions don't double-apply). At night, the city skyline windows fade up via `nightWindowGlow`.

### E9/E10 Live agents (`world/liveAgents.js`)
- **Marcus** loops desk → water cooler → desk every ~50s.
- **Aisha** loops desk → Library entrance → into Library → back, ~80s.
- **Linda** turns to face the player when they enter Reception (z>6, |x|<4). Reverts after 6s.
- **Ambient agents**: 4 desktop / 2 mobile, walking random rectangular waypoint loops in the Library. Featureless faces (`face: 'dot'`, `expression: 'neutral'`).
- All movement is simple lerps between waypoints with dwells. No pathfinding, no collision against walls (waypoints stay inside room bounds).

### E11 Name-tag fade (`ui/nameTags.js`)
Per-frame distance falloff: tags fully opaque ≤6.5m, transparent ≥12m, linear in between. Closest NPC gets a +0.18 alpha bump for emphasis. Occlusion (raycast against walls) implemented but **disabled by default** because walls aren't tagged for raycast lookups; documented as a follow-up.

### E12 Reception centerpiece (`decorations/receptionCenterpiece.js`)
Picked the **rotating Kedash 'K' sculpture** over the seating cluster (per the brief's "pick one, log decision" — branding payoff over generic furniture). Black-marble plinth with a brass top, gold floor ring, glowing emissive 'K' built from 3 boxes (stem + two diagonals), name plate facing the entrance. The K rotates ~1 turn per ~8 seconds.

### E13 Lighting rebalance (`lighting/zone-presets.js`)
- **Reception ambient** 0.55 → **0.85** (was over-corrected dim).
- **Reception directional** 1.05 → **1.25**.
- Added a second front-fill point on the east side, plus a small gold pool above the centerpiece.
- **Library ambient** 0.35 → **0.5**, sky color slightly lighter, ground bounce warmer.
- **Library directional** 0.4 → **0.55**.
- Reading-table lamps 1.6 → **1.9** for clearer pools.
- Added a warm point at (8, 2.5, 24) where the arched-window light hits the floor.
- Bloom thresholds nudged up slightly so they don't bloom on already-bright surfaces.

---

## Morning checklist

Hard-refresh first. Test in Reception, then Library, then run the dance / lesson loop to verify the auto-return fix.

### Sky + fog (was the biggest visual problem)
1. Stand at the doorway between Reception and Library and look out. The horizon should now read as a soft warm gradient in Reception, deep blue in Library — not a flat white block.
2. The fog should subtly fade distant objects but not be heavy.
3. Spin in place — the skydome anchors to the camera, so you should never reach an edge.

### Ceilings + architecture
4. Look up in Reception — drop-tile ceiling with crown molding, ~6 recessed fixtures, 2 vents. Should read as a proper office room.
5. Look up in Library — wood-beam ceiling, 2 hanging pendant lamps over reading tables, 3 heavy crossbeams.

### Depth (windows + skyline)
6. East wall in Reception (positive X) — three windows. Through them, a city skyline of ~14 distant building silhouettes. Walk side to side: skyline should subtly parallax (move opposite ~5%).
7. Library east wall — arched window with golden light streaming onto the floor toward the reading tables. Existing dust motes catch the light.

### Time-of-day
8. The current time of your computer drives lighting. If you load at midday — bright neutral. At sunset — warm golden directional, lower angle. After dark — sky goes deep blue, city windows on the skyline light up, lamps dominate.
9. To test all phases without waiting: temporarily override `Date.now()` in DevTools or change your system clock.

### Live world
10. Stand in Reception and watch Marcus — every ~50s he should walk from his desk to the water cooler and back.
11. Watch Aisha — she occasionally walks from her desk to the Library and back.
12. Walk into Reception from the south doorway (or any z>6 position with |x|<4) — Linda should turn to face you for 6s.
13. Walk into the Library — you should see 2-4 background workers walking random loops between bookshelves.

### Name tags
14. Tags on far NPCs should be transparent / invisible. Walk closer — they fade in.
15. The closest NPC's tag should be slightly brighter than the others.

### Reception centerpiece
16. Centre of Reception, just south of room middle: a black-marble plinth with a glowing gold 'K' rotating slowly. Gold ring at floor level. "KEDASH" plate facing south (toward the entrance).

### Auto-return fix
17. Talk to Linda → "Start lesson". Mark complete. After ~1.4s you should auto-return to the 3D world (no longer stuck on the lesson page).
18. Take Sarah's practical test, pass it. After ~2.6s you should auto-return to play (failed tests stay so you can read feedback).

### Smoother controls
19. Hold A. Player + camera should turn smoothly into a gentle CCW circle, not snap.

### Mobile
20. Skydome + skyline + 2 ambient agents + clamped voice cap + halved bloom RT — should still hit 30+ FPS.
21. The audio "Tap to enable" hint still appears on first load.

### Files added (clean diff for review)
- `play/world/sky.js` (~205 lines)
- `play/world/ceilings.js` (~245)
- `play/world/depth.js` (~325)
- `play/world/timeOfDay.js` (~155)
- `play/world/liveAgents.js` (~225)
- `play/ui/nameTags.js` (~100)
- `play/decorations/receptionCenterpiece.js` (~90)

### Files modified
- `play/play.js` — module imports + lifecycle wiring.
- `play/lighting/zone-presets.js` — value rebalance only.
- `play/lighting/manager.js` — `_lastPreset` exposed for time-of-day.
- `ui/lesson.js` + `ui/test.js` — auto-return to play after success.

### Known issues / follow-ups
- **Skydome IcosahedronGeometry uses 12-vertex base, subdivided to 3.** Vertex count ~80. If the gradient looks faceted, bump subdivisions to 4 (cost: 4x triangles).
- **Time-of-day edits the LightingManager.dir/.hemi values directly.** When the zone preset changes, those values are reset by `applyPreset`, then `timeOfDay.reapply()` re-modifies them. Should always be in sync, but if you tune zone presets at runtime you'd need to re-apply ToD.
- **Window glass uses MeshStandardMaterial with `transparent: true`.** It's not a real refractive material — looks fine for the price.
- **Skyline buildings have no shadows** (per the constraint).
- **Ambient agents don't blink or look-at-player.** They use `expression: 'neutral'` and run only their idle gesture (none defined → just breathing). Cheap.
- **Hallway depth illusion is not built** — see E6/E7 entry above.
- **Name-tag occlusion** is implemented but disabled. See E11.
- **Linda's greeting** uses world coordinates. If she ever moves out of her starting position, the greeting will face wherever she is — which is correct behavior.
- **Aisha's routine takes her through the doorway**, which means she briefly stands inside the doorway. If the player is also in the doorway it could feel awkward. Acceptable.

### Single-revert target
If anything visually breaks, the cleanest single revert is `ac7ed2a` (the moment the SkyDome appeared). Reverting that brings back the pre-environment-run flat sky + no ceilings + no depth.

### Commits to review (newest first)
- `d4f9f69` E13 lighting rebalance
- `7eaf463` E12 reception centerpiece
- `f85dba0` E11 name tag fade
- `30a97dd` E9/E10 live agents
- `b9392a0` E8 time-of-day
- `e0f3c25` E4/E5 windows + skyline + arched window
- `07055ed` E3 ceilings
- `0a6d234` mid-run fix: auto-return + smoother turn
- `ac7ed2a` E2 skydome + per-zone fog/sky
- `7dcd274` E1 exploration notes
