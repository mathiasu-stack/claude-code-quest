# Overnight audio run — log

Goal: take the game from silent to atmospheric. Per-zone music, footsteps, UI clicks, dialogue blips, achievement / level-up / KC stings, dance fanfare, with proper mobile + persistence handling.

## A1 — Hook discovery

### In `play/play.js`
- **Footsteps.** Movement happens in the `update(dt)` block at `play.js:~1856` after the camera-relative input is computed. The `len > 0.05` branch with `player.userData.grounded` is the right cadence gate. **Plan: trigger a footstep when accumulated horizontal distance crosses ~0.65m AND grounded.**
- **Jump.** `jumpRequested && player.userData.grounded` at `play.js:1831`. **Plan: trigger a jump grunt right at the velocityY = 6.5 set.**
- **Land.** `if (player.position.y <= 0)` after gravity at `play.js:1843`. Add a soft thud.
- **Dialogue text reveal.** `openDialogue(npc)` at `play.js:1719` currently injects full HTML. **Plan: replace `${escapeHtml(npc.intro)}` with a typewriter that triggers a blip per char (rate-limited).**
- **NPC interaction click.** `dlg-go` button click — UI confirm sound.
- **Cancel.** `dlg-cancel` / `dlg-close` — UI cancel sound.
- **Zone enter.** Already detected in `update()` (`if (idx !== lastZoneIdx)`). I'll piggyback on this for music crossfade.
- **Dance trigger.** `danceUntil = performance.now() + 4500` at `play.js:~2027` inside `start()`. **Plan: kick off celebration music + crowd cheer at that moment.**
- **Jump button** / **Talk button** / **Back button** — UI clicks already wired in `setupInput`.

### In `engine/achievements.js`
- `showAchievementToast(achievement)` is called when a new achievement unlocks. **Plan: call `audio.playAchievementChime()` at the top of this function (only fires when called, so no double trigger).**

### In `ui/lesson.js`
- `completeLesson` at `:73`: marks complete, then `showXpToast(lesson.xpReward)` at `:101`. **PP ping** plays alongside the toast.
- `handleCheckAnswer` at `:173`: branches on `correct`. **Plan: KC correct/incorrect tones in this function.**
- Both award XP — XP awards may level the player up. **Level-up detection: compare `Scoring.getLevel(...).label` before vs after the XP add and play fanfare on change.**

### In `ui/test.js`
- `renderFeedback` at `:124`: passed/failed branch. Plays the celebration flag write at `:194` (after-passing the test). The dance is triggered when the player returns to play and reads `ccq_dance_for`. **The celebration music should kick in at the start of the dance, not at test pass time — keeps the audio in the play scene.** Confirmed via the `start()` path.

### Sidebar / app
- `app.js` sidebar buttons fire `App.navigate(...)`. UI clicks. The sidebar is hidden in play mode (per the previous CSS pass), so these clicks only happen outside play. Still wire them — they make navigation feel responsive on dashboard / lessons.
- Welcome-modal "Start Training" button — confirm.
- Reset progress button — cancel/click.

### Persistence
- `engine/progress.js` uses `localStorage` key `ccq_progress`. **Audio prefs will use a separate key `ccq_audio_prefs`** so I never touch the existing schema.

### Mobile autoplay
- `AudioContext` must be created on first user gesture or it stays in `suspended` state on Android Chrome / iOS Safari. **Plan: lazy-construct the context on the first `keydown`/`pointerdown`/`touchstart` and `ctx.resume()` it in the same handler.**

### Voice cap
- All non-music sources (SFX/UI/Voice channels) go through a "voice pool" — array of currently-playing nodes. On mobile, cap at 8; when full, stop the oldest. Music is not counted because there are at most 2 simultaneous tracks (during crossfade).

### Conservative choices made up-front
- **No Tone.js.** Web Audio is enough for the SFX list. Less bundle, fewer dependencies.
- **All SFX procedural.** No bundled .wav/.ogg files. Music is the only file dependency, and it's optional (silent fallback).
- **Channel split.** master → {music, sfx, ui, voice} → context destination. Each leaf has a mute toggle and 0–100 volume.
- **Crossfade duration 2.5s** — middle of the brief's 2–3s range.
- **Settings panel: gear button** in the top-right corner of the play view, **below the tier badge** (sidebar is hidden in play mode, the previous attempt to share top-right with the tier badge collided so it was nudged down).

## A2–A10 — what shipped

### A2 AudioManager core (`play/audio/AudioManager.js`)
master → 4 channel buses (music/sfx/ui/voice). Volume + mute persisted to `ccq_audio_prefs`. Lazy context construction on first interaction. Voice pool capped (8 mobile / 24 desktop) — oldest stolen. `playSpatial()` adds a `PannerNode` for 3D-positioned sources. `startMusic(url, fade)` crossfades; missing files **log once and silently fall through** so the game doesn't break.

### A3 Procedural SFX (`play/audio/procedural.js`)
Every SFX is a few oscillators or a noise burst with envelope:
- `playFootstep(surface)` — 4 surface profiles (carpet/wood/tile/metal), per-call jitter so consecutive steps don't clone
- `playJumpGrunt`, `playLandThud`
- `playUi('click'|'hover'|'confirm'|'cancel'|'toggle')`
- `playDialogueBlip(pitch)` — short triangle pulse, called per character of typewritered text
- `playAchievementChime` — C–E–G arpeggio, sine + triangle layer
- `playLevelUpFanfare` — G–C–E–G–C with delay-line tail
- `playPpPing` — single high blip
- `playKcCorrectTone` / `playKcIncorrectTone` — happy duo / sad sawtooth
- `playCrowdCheer(durSec)` — wide bandpass noise crescendo
- `blipPitchForNpc(id)` — per-NPC pitch table so each colleague has a recognisable "voice"

### A4 Footsteps + jump
- Step accumulator inside the movement block; fires when ≥0.65 m horizontal travel since last step. Surface from the zone-audio config.
- `playJumpGrunt()` at velocityY = 6.5; `playLandThud()` when re-grounded after an airborne frame.

### A5 UI clicks + dialogue blips
- Open dialogue → `confirm`. Close/cancel → `cancel`. `dlg-go` → `confirm`.
- The intro line is now revealed by a typewriter (~22 ms/char). A blip fires every two letter/digit characters; whitespace and punctuation are skipped. **Tap inside the dialogue panel** during reveal fast-forwards to full text.
- The play HUD buttons (back, prompt, talk) all play `click`/`cancel` accordingly.

### A6 Achievement / level-up / PP / KC
- `engine/achievements.js` `showAchievementToast` calls `window.PlayAudio.achievement()` (chime).
- `ui/lesson.js completeLesson` plays PP ping every time; if `Scoring.getLevel(...).label` changed, plays the level-up fanfare instead.
- KC correct/incorrect tone in `handleCheckAnswer` regardless of XP.
- Bonus 5 PP for first-attempt KC also plays the PP ping.
- `ui/test.js handleTestSubmit` plays PP ping on first pass, level-up if rank changed, sad tone on fail.
- `play.js start()` — when the dance flag is set on entry: crowd cheer + level-up fanfare + crossfade to `celebration.mp3` (silent if missing).

### A7 Music + crossfade
- `audio.startMusic(name, url, 2500)` called on initial preset apply and on every zone transition (right next to `lighting.applyPreset`).
- `audio.stopMusic(800)` in `Play.stop()` so leaving play stops the music gracefully.
- Listener position synced from camera each frame (so once you author spatial sources they pan correctly).

### A8 Settings panel (`play/audio/settings.js`)
Gear button at top-right (under tier badge). Click → 5 sliders + mute toggles (Master, Music, SFX, UI, Voice). Click outside / "Close" dismisses. CSS lives in `style.css` under "Audio settings".

### A9 Mobile autoplay + voice cap
- AudioContext built lazily on first `pointerdown` / `touchstart` / `keydown` / `click`. Listeners self-remove once context is `running`.
- Hint toast appears after 1.5 s if still suspended, auto-clears within 8 s or on unlock.
- Voice cap hard-coded: 8 on mobile (steal oldest), 24 on desktop. Music does not count.

### A10 Music README
Fully populated `play/assets/audio/music/README.md` listing every expected file, vibe/tempo/length, plus Suno prompts and free-source pointers.

---

## Morning checklist

### Sounds you can hear without any music files (everything below is procedural)
1. Walk in Reception. You should hear muffled carpet steps every ~0.65 m, slightly varied per step.
2. Press **Space** — soft jump grunt; soft thud on landing.
3. Walk into the Library doorway — surface flips to wood (sharper, brighter).
4. Approach Linda. The "Talk" prompt appearing makes no sound, but tapping it plays a UI click + a confirm tone. The dialogue body types out one character at a time with **pitched blips** (Linda is high-pitched, Marcus low, etc.).
5. Tap the dialogue panel during typewriter reveal → text snaps to full.
6. **Audio settings gear** at top-right under the tier badge. Open it, drag the music slider — should be silent if you don't have music files yet.
7. Inside a lesson, answer the knowledge check correctly → rising two-note tone. Wrong → low sawtooth.
8. Mark a lesson complete → short PP ping. If you cross a level boundary (50 PP, 200 PP, etc.) you also get the 5-note level-up fanfare.
9. Pass a chapter test → return to the office → crowd cheer + fanfare during the celebration dance.
10. Achievement unlocked at any point → 3-note chime.

### What needs music files to verify
- Per-zone music. Drop `play/assets/audio/music/reception.mp3` and `library.mp3` and walk between the rooms — should crossfade ~2.5 s.
- `celebration.mp3` plays once during the post-test dance.
- Missing files do **not** log errors after the first one (single info line per URL). They never break gameplay.

### Mobile
- First load may show "🔊 Tap anywhere to enable audio" within ~1.5 s. Tapping anywhere clears it.
- Voice cap is 8 — under heavy load, oldest steps/blips drop. Don't be surprised by a missing footstep when you spam jump+talk simultaneously.
- Bloom + dust + audio are bandwidth/CPU friends. Should hold 30+ FPS.

### What I deliberately did NOT touch
- Lighting / post-fx / dust motes / camera-relative WASD. All untouched.
- Persistence schema. Audio prefs live under a new key `ccq_audio_prefs`.
- Any gameplay numbers (XP, PP, achievement rules, lesson flow).

### Known issues / follow-ups
- The CEO portrait spotlight from the previous run still doesn't actually light the photo plane (it's MeshBasicMaterial). Unrelated to audio but worth noting.
- The dialogue typewriter reveal is **22 ms/char** — for very long intros (chapter 7 onward) that's around ~3 s. Fast enough; tap-skip works.
- Footstep volume isn't reduced when crouching/standing-still — there's no crouch state. Left as-is.
- Music files for zones 3–16 are placeholder paths only. Game runs silently in those zones until they're populated. README has prompts for each.
- Voice channel ducking under music is NOT implemented — when the dance plays, the cheer + fanfare can clip on top of celebration music. Mitigated by the music channel default being 0.55. Player can lower further from the panel.
- I did not attach NPC dialogue to spatial sources. Dialogue blips play through the regular voice bus. Could be upgraded with `playSpatial` later, but the dialogue panel is HUD-anchored so positional audio would feel wrong.

### Commits to review (newest first)
- `fe71a5b` A10 music README
- `9870bb9` A9 mobile autoplay hint + voice cap
- `0b1906f` A8 settings UI panel
- `a296883` A7 music crossfade on zone enter
- `6331236` A6 achievement / level-up / PP / KC sounds
- `8110b2e` A5 UI clicks + typewriter blips
- `71e1b69` A4 footsteps + jump + zone audio config
- `23a5823` A3 procedural SFX library
- `5bcdf4b` A2 AudioManager core
- `0163ef4` A1 hook discovery notes

If anything sounds broken, the cleanest single revert target is `5bcdf4b` (the moment AudioManager appeared). Everything before it has zero audio.


