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
- **Settings panel: gear button** in the top-left corner of the play view (next to the existing Back button), since the sidebar is hidden in play. On the dashboard, the same panel is reachable from a small text link in the sidebar.

