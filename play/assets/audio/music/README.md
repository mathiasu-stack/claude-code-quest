# Music slots

Drop `.mp3` files at the paths below. The game **silently falls back to no music** if a file is missing — so empty slots are fine; the player just walks through that zone in silence.

Engineering knobs:
- All tracks **must loop seamlessly**. Either trim to a tight loop or use a tail that fades into the head.
- Aim for **mono or stereo, 128 kbps**. Mobile bandwidth caps suggest staying under ~3 MB per track.
- Length: 60–180 s is ideal. Shorter loops are fine if the seam is clean.
- LUFS: roughly **-20 LUFS** so it sits under SFX. The in-game music channel volume defaults to 0.55 and is user-adjustable.

| File | Vibe | Tempo | Length | Mood |
|------|------|-------|--------|------|
| `reception.mp3` | Lo-fi corporate jazz, brushed kit, warm Rhodes | 70–90 BPM | 90 s loop | Welcoming, slightly aspirational |
| `library.mp3` | Soft solo piano + low pad, dust-in-sunbeam | 55–70 BPM | 120 s loop | Quiet, contemplative, nighttime |
| `atrium.mp3` | Clean acoustic guitar, tap percussion | 80–100 BPM | 90 s | Bright, "writing the rulebook" |
| `memory-vault.mp3` | Synth pad + soft arpeggio, gentle bass pulse | 80 BPM | 90 s | Cool, mysterious, tech-archive |
| `communications.mp3` | Light electronica, retro modem motif | 100–115 BPM | 90 s | Connected, broadcasty |
| `workshop.mp3` | Hand percussion + acoustic guitar | 95–110 BPM | 90 s | Hands-on, productive |
| `lounge.mp3` | Chillhop with vinyl crackle | 75–90 BPM | 100 s | Relaxed, café-style |
| `forge.mp3` | Synthwave + percussive metal hits | 110 BPM | 90 s | Building, energetic |
| `lab.mp3` | Glitchy ambient + soft beat | 90 BPM | 100 s | Curious, scientific |
| `refinement.mp3` | Looping piano + soft orchestral pad | 70 BPM | 100 s | Iterative, thoughtful |
| `command.mp3` | Pulsing synth + clean four-on-the-floor | 120 BPM | 90 s | In-control, terminal vibes |
| `warroom.mp3` | Slow strings + low timpani | 70 BPM | 100 s | Strategic, weighty |
| `integration.mp3` | Bright electro-pop with phrasing pauses | 110 BPM | 90 s | Connecting things up |
| `mission.mp3` | Hybrid orchestral / synth, "control room" | 100–115 BPM | 100 s | Operational, watchful |
| `studio.mp3` | Acoustic guitar + soft horn | 80 BPM | 90 s | Senior-craft, polished |
| `server-room.mp3` | Deep ambient drone + ticking subtle rhythm | 60 BPM | 120 s | Capstone, late-night ops |
| `celebration.mp3` | Short victory stinger — orchestral hit + chord swell | 120 BPM | **15 s one-shot** | Triumphant; doesn't loop, played once over the post-test dance |
| `menu.mp3` | (optional) Title-screen loop | 80 BPM | 60 s | Welcoming brand cue |

## Suggested Suno prompts (free tier, no login required for inference)

Reception:
> "Lo-fi corporate jazz instrumental, 80 BPM, brushed drums, warm Rhodes electric piano, soft upright bass, very slight vinyl noise, calm and welcoming, no vocals, seamless loop"

Library:
> "Solo grand piano, 60 BPM, slow rubato, soft pad underneath, contemplative, library ambience, no vocals, seamless loop"

Memory Vault:
> "Cool ambient synth pad, gentle 80 BPM arpeggio, soft sub bass pulses, mysterious tech archive vibe, no vocals, seamless loop"

Forge:
> "Synthwave with metallic percussion, 110 BPM, building energy, retro analog leads, no vocals, seamless loop"

Server Room (capstone):
> "Deep ambient drone in C minor, faint clock-tick percussion, very low BPM, late-night data center, dark and peaceful, seamless loop"

Celebration stinger (one-shot, not loop):
> "Triumphant 15-second orchestral stinger, brass fanfare, descending cymbal swell, percussive hits, no vocals"

## Free-source alternatives

- **Pixabay Music** (CC0): https://pixabay.com/music/ — search "lo-fi", "ambient piano", "synthwave"
- **Freesound.org** (CC variants): for ambient loops, but check licensing.
- **Incompetech (Kevin MacLeod)**: high quality, attribution required.
- **YouTube Audio Library**: free for any use, attribution optional.

## How the game plays them

When the player enters a zone, `play.js` calls
`audio.startMusic(name, musicForZone(idx), 2500)`.

- File found → AudioManager fetches, decodes, crossfades over 2.5 s.
- File missing (404 / network error) → logs **once** to console, fades out previous track, plays nothing.

So you can drop in tracks one by one — every existing zone keeps working, and silent zones simply remain silent.
