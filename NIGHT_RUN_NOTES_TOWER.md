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

## T2 — PART A bug sweep — what shipped

| # | Bug | Fix |
|---|-----|-----|
| 1 | Black featureless heads | Face plane is now `DoubleSide` and pulled out to z=0.225 (clearly outside the 0.21 head sphere). Head skin material gets a tiny self-emissive (intensity 0.08) so it's never read as pure black under shadow. Commit `2dc257a`. |
| 2 | Name tag size inconsistency | All NPC tags now set to a uniform `(2.4, 0.5, 1)` scale in `spawnNPC`. NameTagSystem only modifies opacity, never scale. Commit `8dfbbc8`. |
| 3 | Duplicate Junior Hire tag | `buildPlayer` now disposes any pre-existing player mesh + children before creating the new one. Eliminates ghosts left from customisation rebuild. Commit `2dc257a`. |
| 4 | Duplicate adjacent GROW posters | Removed the inline poster set in `buildWorld()` — `decorateReception()` is the only place posters are placed. Commit `8dfbbc8`. |
| 5 | Z-fighting | Centerpiece light pulled inside the K sculpture (1.7m up); marble floor overlay sits 5mm above the carpet runner; door labels nudged to z+0.05 from doors. Commit `8dfbbc8`. |
| 6 | Floating orange light | Centerpiece pool moved to inside the rotating K so the glow reads as emanating from the sculpture, not nowhere. Commit `8dfbbc8`. |
| 7 | Stars / dust motes inside rooms | Volume shrunk from 24×9×24 to 10×6×10 around the player; count dropped 100→80. Commit `8dfbbc8`. |
| 8 | Floating characters in distant zones | Deferred — the auto-generated NPCs in zones 3-16 still live in their corridor positions because the full multi-floor relocation is deferred. Distance fog hides most of them. **Documented as deferred**. |
| 9 | Awards sculpture readability | Plinth restyled — brushed silver column + gold trim band + glass disc top with brass ring. No more "black bowl". Commit `8dfbbc8`. |
| 10 | Demo screen on couch | Demo screens pulled forward to z=2.2 / 3.0 / 3.8 (was 2.4 / 3.2 / 4.0) — moved away from the couches at z=5. Commit `8dfbbc8`. |
| 11 | Zone label colour inconsistency | Unified pair: `rgba(38,140,90,0.95)` for "Open" (warm green) and `rgba(60,72,110,0.95)` for "Locked" (corporate slate-blue). Commit `8dfbbc8`. |
| 12 | Skybox flat orange band | Reception gradient bumped — top is now `0x4b8ed8` (clear blue), horizon `0xffd9a0` (warm), bottom `0x8c5a2c` (earth). Fog far pulled to 95m so it doesn't wash the dome. Commit `8dfbbc8`. |

## What was BUILT in PART B

### T3 — modernLibrary (`play/materials/modernLibrary.js`)
Cached, reusable factories for: marbleWhite, marbleDarkGreen, marbleBlackGold, brushedSilver, polishedChrome, glassClear (transmission on desktop, alpha on mobile), glassFrosted, polishedConcrete, brass, darkStone, backlitGlassSign, coveLight. Marble uses procedural canvas with cloudy noise + curvy bezier veins. Brushed metal uses horizontal streak texture. All textures are cached per-key.

### T5 — Grand atrium (`play/world/atrium.js`)
- Ceiling raised to **12 units** (was 3.8) over the existing Reception room.
- Marble floor overlay at y=0.005 (sits over the existing tile so existing carpet/runway aren't affected).
- Tall walls extend up from y=3.8 to y=12 in two-tone bands; the existing low room walls stay intact.
- **Glass curtain wall** on the east side: 2.4m × 2.4m glass panels with brushed-silver mullions, running from y=3.8 to y=12.
- **Skylight panel** in the centre of the atrium ceiling (additive glowing plane).
- **Mezzanine railing** at y=4.5 wrapping 3 sides — glass infill with chrome top/bottom rails. Reads as a balcony above.
- **Backlit KEDASH wordmark** behind reception (silver letters on dark backing with cyan emissive halo).
- Sleek **dark-stone reception desk** with brushed-silver counter top.
- **Kinetic chandelier** — 18 glass rods with bulbs in concentric rings, slow rotation, pulsing bulbs, central PointLight (1.2 intensity).
- **Sculptural curving stair** along the west wall (decorative — purely visual; player can't climb it).
- **Cove light strips** at the mezzanine perimeter for indirect glow.

### T6 — Glass elevator (`play/world/elevator.js`)
- **Glass shaft** at (8.5, 0, -8.5) — 2.4m square, runs floor-to-ceiling+ for 6 floors (4.5m each = 27m tall total).
- 4 chrome corner posts; 6 floor-level chrome bands.
- **Visible glass cab** with marble floor, brushed silver side walls, glowing ceiling panel + interior PointLight, floor indicator panel showing "F1"–"F6".
- **Animated cab** picks a random floor every 6–12s and travels to it at 1.6 m/s. Floor indicator updates on arrival.
- **Call button** at lobby level (silver housing + glowing yellow sphere).
- **Floor signs** "FLOOR 2" through "FLOOR 6" on the shaft outside, gold-on-navy.
- API exposes `summon(targetFloor)` for ceremonyManager / future scripted travel.

## What was BUILT in PART C

### T9 — CeremonyManager (`play/ceremony/ceremonyManager.js`)
- Reads `sessionStorage.ccq_promotion_for` (set by test.js on a fresh chapter pass).
- Locks player input.
- Spawns a spotlight beam (additive cone + halo + PointLight) at the player's position.
- Schedules the existing dance via `setDanceUntil` after a 1.8s delay (dance plays for 4.5s normal / 5.5s milestone / 7s capstone).
- Plays fanfare + crowd cheer.
- Shows a centred "PROMOTION → [Title]" toast with gold glow.
- Once-per-chapter guard via `localStorage.ccq_promotion_fired` (a Set of completed chapter IDs).
- Auto-cleanup after 6.5–9.0 seconds depending on chapter type.

### T10 — Accessory unveils (`play/ceremony/accessoryUnveil.js`)
Per-tier mini-animations, each ~1.2–1.5s:
- **Tier 1**: lanyard + name badge drop down from above with easeOutBack.
- **Tier 2**: red tie + dark knot drop from y=2.5 to chest with sparkle puff.
- **Tier 3**: silver wrist watch slides in from the player's left with sparkle on landing.
- **Tier 4**: dark vest fades in over 1s; gold buttons pop in one by one with `easeOutBack` and sparkle bursts at each button.
- **Tier 5**: glasses descend from y=2.4 to face level; lens flare on landing (additive plane stretches and fades).
- **Tier 6**: gold chain + pendant fade in over 1.2s; pendant swings briefly with damped sine.
- **Tier 7**: pink lapel pin scales from 0; halo descends with `easeOutCubic` and pulses emissive intensity.
- Tier 8+ runs the halo flourish.

### T11 — Title transition (`play/ceremony/titleTransition.js`)
- 3D card flip on the player's role tag — old text on the front face, new text on the back, rotated 0→π over 1.2s with easeInOutQuad.
- Slight Y lift during the flip (`sin(t*π) * 0.18`) for "tossing" feel.
- After the flip, the original Sprite is reused with the new texture (so steady-state cost stays at 1 sprite, not 2 planes).

### T11 — NPC reactions (`play/ceremony/npcReactions.js`)
- Finds up to 3 NPCs within 12m of the player.
- Each turns to face the player (smoothed lerp, stiffness 5).
- Both arms lift to ≈ -2.0 rad and oscillate at 12Hz (clap motion).
- Originals are stashed and restored on cleanup so NPCs return to their idle gestures cleanly.
- The chapter's announcer NPC (Sarah for ch01, Noor for ch02, etc.) shows a **white speech bubble** centred on the screen: "Welcome to the team, [Name]! You're now promoted." Capstone gets a custom line.

### T12 — Wiring
- `ui/test.js`: on a fresh PASS, sets `sessionStorage.ccq_promotion_for = ch.id` in addition to the existing dance flag.
- `play/play.js start()`: prefers the promotion flag — kicks off CeremonyManager via `maybeStartFromFlag()`. Falls through to the legacy dance-only path when only `ccq_dance_for` is set (so a re-celebration / hot-reload still works).
- New CSS in `style.css`: `.play-promotion-toast` (centred big gold toast) and `.play-congrats-bubble` (NPC speech bubble).

## DEFERRED — what was NOT built (logged for follow-up)

These were skipped to keep the branch in a shippable state. The brief explicitly allowed pragmatic deferrals provided they're documented.

- **Multi-floor tower shell with 6 floors** (T4, B1). Only the atrium ceiling and the visible elevator shaft suggest the upper floors. Floors 2–6 don't have built geometry above the atrium; the elevator cab idles in the empty shaft. Reason: relocating the existing 16 zones into floors carries high risk for the audio / lighting / movement-bound systems and the brief noted "not every floor needs full geometry on day one". The atrium + elevator gives the visual upgrade without the relocation risk.
- **Glass partitions between zones on each floor** (T7). Reception/Library walls are unchanged.
- **Move existing zones into tower** (T8). Zones 1 and 2 stay where they were; zones 3–16 still live in the original south-extending corridor. The elevator's `summon(floor)` API exists but isn't wired to actually transport the player to a different physical zone.
- **Floor 6 capstone executive level**, separate from the elevator's "FLOOR 6" sign.
- **Scripted ceremonial elevator ride after the capstone test**. The ceremonyManager has the chapter-16 special path scaffolded but doesn't ride the elevator — it just plays a longer dance + cheer.

## Morning review checklist (priority-ordered)

Hard-refresh first. Cache-buster `?v=10` in the URL is your friend.

### 1. Verify the atrium reads correctly
1. Open the game on the `feature/tower-rebuild` branch URL (or pull + serve locally).
2. Walk into Reception. Look up — there should be a tall atrium ceiling at ~12m, with crown-style banding on the walls and a kinetic chandelier rotating slowly above the centre.
3. Look out the east windows — the city skyline should still parallax behind them.
4. Look at the back wall: a backlit silver "KEDASH" wordmark above the CEO portrait.
5. Walk to the south-east corner — visible glass elevator shaft running floor-to-ceiling. The cab should idle and move between floors every ~6–12s.

### 2. Verify the bug fixes
6. Walk around the player and study the head — face features should be readable from any camera angle (front and back, due to DoubleSide).
7. Linda / Sarah's name tags should read at the SAME size as everyone else's (no giant tags).
8. Reception should have ONE GROW poster (not two). Posters scattered around the side walls.
9. The Kedash 'K' centerpiece should sit on a brushed-silver pedestal with a glass disc top — no black bowl.
10. Demo screens at Kenji's desk should cluster at z=2.2 / 3.0 / 3.8 — none should be on the couches at z=5.
11. The skybox horizon should read as a clear gradient (blue → warm → earth) rather than a flat orange band.
12. Locked door labels should be slate-blue; open ones should be warm green.

### 3. Verify the promotion ceremony
13. Pass a chapter-1 test (or any test). Click "Return to the office".
14. **Lock-in**: input freezes briefly; a gold spotlight beam shafts down from above; the K sculpture's gold pool already glows.
15. **Accessory**: a red tie should drop down to the player's chest with a sparkle puff (chapter 2 unveils a different accessory).
16. **Title flip**: the player's role tag should 3D-flip from the old title to the new one (e.g., "Junior Hire" → "Associate").
17. **NPC clap**: 1–3 nearby NPCs should turn to face you and clap their arms.
18. **Speech bubble**: a centered white bubble appears: "Welcome to the team, [Name]! You're now promoted."
19. **Toast**: a big "PROMOTION → [Title]" gold-bordered toast appears mid-screen.
20. **Dance**: the existing player dance plays for ~4.5 seconds.
21. **Resume**: input unlocks; the toast fades out; you can move freely.
22. Pass the SAME chapter test again — the ceremony should NOT re-fire (the `ccq_promotion_fired` Set guards it).

### 4. Performance / mobile
23. The atrium adds glass + chandelier + skylight + mezzanine — desktop should remain at 60. Mobile should still hit 30. If it drops, the easiest perf cuts are:
    - Drop chandelier rod count from 18 to 10 in `atrium.js`.
    - Skip the floor signage outside the elevator shaft on mobile.
    - Reduce skydome subdivision (already at 3).

### 5. Things that might look weird (known)
- The mezzanine railing at y=4.5 has no actual floor behind it — it's a visual cue. From inside the atrium looking up + back, you can see "into" the void above. **Not a bug**, just unfinished.
- The elevator cab moves but you can't ride it. Pressing the call button does nothing yet.
- Floors 2–6 don't exist as walkable spaces.

### 6. Easy revert paths
- Atrium too dramatic / breaks lighting? Revert `a576a3e` (just the atrium build).
- Ceremony has a bug? Revert `fc20621` (just the ceremony) — the atrium and elevator stay.
- The whole branch is risky? `git reset --hard main` — feature branch never merged.

### Branch / merge
- This branch (`feature/tower-rebuild`) has not been merged to main and won't be unless explicitly asked.
- All work is `git push`-ed. Pull request URL: see the latest push output for the GitHub PR-create link.

### Files added this run
```
NIGHT_RUN_NOTES_TOWER.md            (this file)
play/materials/modernLibrary.js     (300 lines, material presets)
play/world/atrium.js                (270 lines, atrium upgrade)
play/world/elevator.js              (220 lines, glass elevator)
play/ceremony/ceremonyManager.js    (220 lines, orchestration)
play/ceremony/accessoryUnveil.js    (260 lines, per-tier animations)
play/ceremony/titleTransition.js    (90 lines, role tag flip)
play/ceremony/npcReactions.js       (110 lines, clap + bubble)
```

### Files modified this run
- `play/play.js` — wiring + bug fixes.
- `play/characters/face.js` — DoubleSide face plane.
- `play/lighting/zone-presets.js` — centerpiece light position.
- `play/lighting/dust-motes.js` — smaller volume.
- `play/world/sky.js` — Reception sky gradient bumped.
- `play/decorations/reception.js` — demo screen positions.
- `play/decorations/receptionCenterpiece.js` — silver+glass plinth.
- `ui/test.js` — sets `ccq_promotion_for` flag.
- `style.css` — promotion toast + congrats bubble CSS.

