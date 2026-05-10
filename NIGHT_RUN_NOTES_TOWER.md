# Tower rebuild + ceremony overhaul — overnight run log

Branch: `feature/tower-rebuild`. Will not be merged to `main`.

Goal in one line: turn Kedash Corp from a row of small rooms into a real corporate tower with a grand atrium, a working glass elevator, six floors of escalating personality, and a proper promotion ceremony when you complete a chapter.

## T1 — Codebase exploration

### Hot points
- **Scene root + zone layout**. `play.js:1040` builds `scene`. ZONE_BOUNDS is a 16-entry array of `{ startZ, endZ, centerZ, chapterId }` at `play.js:131`. Today the world is 16 zones laid out along +Z in a single corridor (z = -11 → 341). For the tower rebuild I'll **keep the 16 zone IDs and chapter mapping** (so audio/lighting/movement-bound systems still work) but the zone's *physical position* will move into the tower. The physical-z coordinate only matters for `clampMove`, so I'll redirect it to a flat "lobby plane" while the real geometry lives at the new floor heights.
- **Character build**. `makeCharacter` at `play.js:376` always calls `attachFace` at line 528. Every character gets a face if it goes through this. Ambient agents in `liveAgents.js` use the same factory — so faces *should* apply universally. The "black featureless head" report likely comes from BackSide culling on the face plane (PlaneGeometry's normal points one way; from the camera's third-person angle behind the player, you're looking at the back of the head, where the face plane's invisible side is presented).
- **Name tag system**. `play.js:1457` (`spawnNPC`) sets `tag.scale.set(2.6, 0.55, 1)` for every NPC. Door labels at `play.js:1257` use `(3.0, 0.7, 1)`. Player tier tag uses the makeLabelSprite default `(2.0, 0.5, 1)`. The "tag size inconsistency" bug is likely about the *door labels being mistaken for character tags* in screenshots — they're different scales by design but they share the visual language.
- **Persistence schema (read-only contract)**. `ccq_progress` (lessons/tests/XP/achievements/streak), `ccq_audio_prefs`, `ccq_customization`, `ccq_play_pos` (sessionStorage), `ccq_dance_for` (sessionStorage), `ccq_play_intro_seen`. **New keys I'll add this run**: `ccq_promotion_fired` (chapter IDs already celebrated, prevents re-firing), `ccq_current_floor` (sessionStorage, so refresh stays on the floor you were on).
- **Lesson → 3D return path**. `ui/lesson.js` and `ui/test.js` already auto-redirect to `'play'` on completion. The dance flag is written to sessionStorage by `test.js:196` and read in `play.js:2122`. The promotion ceremony will **replace the existing dance trigger** and reuse it as the celebration phase.
- **Existing audio bridge**. `window.PlayAudio.{achievement, levelUp, ppPing, kcCorrect, kcIncorrect, uiClick, uiHover, uiConfirm, uiCancel, cheer}`. Ceremony will use `cheer`, `levelUp`, and a new `congrats` blip from procedural.js.
- **Existing accessory system**. `addPlayerAccessories(group, tier)` in `play.js` puts on accessories *immediately* based on tier count. For the ceremony I need to: (a) build a fresh-no-accessories player at ceremony start; (b) play unveil animations that *add* the accessory mid-air; (c) leave the regular `addPlayerAccessories` path intact for non-ceremony loads (e.g., when you re-enter play normally).

### Conservative-overridden choices (per brief: pick the ambitious option)
- **Atrium centerpiece**: kinetic chandelier (cascading glass rods + light). Documented.
- **Library placement**: stays on the ground floor adjacent to Reception (across the atrium). Floors 2–6 hold chapters 3–16. Library is recognisable for ch1-finishers without an elevator ride. Documented.
- **Stairwell**: built as visible-only glass-and-steel sculpture in the atrium. Player cannot use it (the elevator is canonical navigation), but it's a strong vertical accent. Documented.
- **Tower height**: 12-unit atrium, 4.5-unit per floor on floors 2–6 = total tower ~30 units tall. Documented.
- **Glass elevator**: visible glass shaft running through the atrium with the cab on it; idle position randomized; player presses a call button to summon, picks a floor inside; brief animated travel; 6 floor buttons (floors with no playable chapters yet show "Under construction").

### Known existing systems I'll reuse, not rewrite
- LightingManager + zone-presets — extend by adding per-floor presets keyed by `floorIdx` rather than zone idx. Backwards compatible.
- SkyDome — kept; I'll just change the background-fog combos for the new atrium.
- Post-fx pipeline — unchanged; bloom + vignette already pop nicely on glass.
- Audio (music + SFX) — unchanged; will trigger more sounds during ceremony.
- TimeOfDay — kept; tower windows reflect time-of-day (lit windows at night).
- LiveAgents — kept; ambient agent count cap stays 4 desktop / 2 mobile.

## T2 — PART A bug sweep (running log)

(Filled in as bugs are fixed below.)
