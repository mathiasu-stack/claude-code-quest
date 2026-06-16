// proceduralMusic.js — chill 4-chord classical piano, synthesized live.
//
// No audio files, no licensing, no 404s — same philosophy as the
// procedural ambience + stings. Each "track" is a slow 4-chord
// progression (one bar per chord) with a soft piano left-hand arpeggio
// and a sparse right-hand melody drawn from the chord tones. Four
// variants give the zones distinct moods without authoring four MP3s.
//
// Public API:
//   const player = createPianoPlayer(ctx, destination, spec);
//   player.start(fadeMs);   // fades in, loops until stopped
//   player.stop(fadeMs);    // fades out + tears down the scheduler
//
// `destination` is an AudioNode (the music channel gain) so the master
// limiter + tier shelf in AudioManager apply to it like any music.

// ── Note → frequency ───────────────────────────────────────────────────────
// MIDI note number to Hz. A4 (69) = 440.
function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

// Named pitch (e.g. 'C4') → MIDI. Supports sharps with '#'.
const _NOTE_BASE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function noteToMidi(name) {
  const m = /^([A-G])(#?)(-?\d)$/.exec(name);
  if (!m) return 60;
  return (parseInt(m[3], 10) + 1) * 12 + _NOTE_BASE[m[1]] + (m[2] ? 1 : 0);
}

// ── Real instrument samples (multisampled, pitch-shifted) ───────────────────
// A handful of recorded notes per instrument, played at the nearest sample plus
// a playbackRate pitch shift. Loaded once, lazily, on first start(). If they
// fail to load (offline / 404), the oscillator voices below are used instead —
// so the music never breaks (the "no 404s" principle, as graceful degradation).
// Samples: gleitz/midi-js-soundfonts (MusyngKite), MIT-licensed, vendored under
// play/assets/audio/instruments/.
const SAMPLE_ROOT = '/play/assets/audio/instruments';
const SAMPLE_NOTES = {
  piano:  ['A1', 'C2', 'E2', 'G2', 'C3', 'E3', 'G3', 'C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6'],
  violin: ['G3', 'C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6'],
};
// Relative gain so sampled levels roughly match the old synth mix (tune here).
const SAMPLE_GAIN = { piano: 0.8, violin: 1.3 };
let _bank = null;          // { piano: Map<midi,buf>, violin: Map<midi,buf> } when ready
let _bankState = 'idle';   // 'idle' | 'loading' | 'ready' | 'failed'
async function loadInstrumentBank(ctx) {
  if (_bankState === 'loading' || _bankState === 'ready') return;
  _bankState = 'loading';
  try {
    const loadInst = async (inst) => {
      const map = new Map();
      await Promise.all(SAMPLE_NOTES[inst].map(async (n) => {
        const res = await fetch(`${SAMPLE_ROOT}/${inst}/${n}.mp3`);
        if (!res.ok) throw new Error(`sample ${inst}/${n} ${res.status}`);
        const buf = await ctx.decodeAudioData(await res.arrayBuffer());
        map.set(noteToMidi(n), buf);
      }));
      return map;
    };
    const [piano, violin] = await Promise.all([loadInst('piano'), loadInst('violin')]);
    _bank = { piano, violin };
    _bankState = 'ready';
  } catch (e) {
    _bank = null;
    _bankState = 'failed';   // synth fallback stays in effect
  }
}
function _nearestSampleMidi(map, midi) {
  let best = null, bestD = Infinity;
  for (const k of map.keys()) { const d = Math.abs(k - midi); if (d < bestD) { bestD = d; best = k; } }
  return best;
}
// Play a real sample for `midi`: nearest recorded note + pitch shift, a velocity
// gain, and a gentle release at note end so it doesn't ring forever.
function playSampleNote(ctx, dest, map, gainScale, midi, when, dur, velocity) {
  const sm = _nearestSampleMidi(map, midi);
  if (sm == null) return when + dur;
  const src = ctx.createBufferSource();
  src.buffer = map.get(sm);
  src.playbackRate.value = Math.pow(2, (midi - sm) / 12);
  const g = ctx.createGain();
  const peak = Math.max(0.0001, velocity * gainScale);
  const sus = Math.max(0.05, dur);
  const rel = 0.18;
  g.gain.setValueAtTime(peak, when);
  g.gain.setValueAtTime(peak, when + sus);
  g.gain.exponentialRampToValueAtTime(0.0001, when + sus + rel);
  src.connect(g).connect(dest);
  src.start(when);
  src.stop(when + sus + rel + 0.05);
  return when + dur;
}

// ── Track specs ─────────────────────────────────────────────────────────────
// Each spec: a key center + a 4-chord progression. Chords are arrays of
// scale-degree pitch names in a comfortable register. The melody is
// generated from chord tones at schedule time (sparse, with rests) so it
// never sounds like a fixed loop even though the harmony repeats.
//
// Progressions are classic "chill classical" shapes:
//   reception  — C major  I–V–vi–IV   (warm, welcoming)
//   library    — A minor  i–VI–III–VII (pensive)
//   andante    — D minor  i–VII–VI–V   (andalusian, a touch uncanny)
//   workshop   — G major  I–vi–IV–V    (gentle, optimistic)
export const PIANO_TRACKS = {
  reception: {
    bpm: 64,
    chords: [
      { bass: 'C2', notes: ['C4', 'E4', 'G4'] },   // C
      { bass: 'G2', notes: ['G3', 'B3', 'D4'] },   // G
      { bass: 'A2', notes: ['A3', 'C4', 'E4'] },   // Am
      { bass: 'F2', notes: ['F3', 'A3', 'C4'] },   // F
    ],
    scale: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'E5'],
  },
  library: {
    bpm: 58,
    chords: [
      { bass: 'A2', notes: ['A3', 'C4', 'E4'] },   // Am
      { bass: 'F2', notes: ['F3', 'A3', 'C4'] },   // F
      { bass: 'C2', notes: ['C4', 'E4', 'G4'] },   // C
      { bass: 'G2', notes: ['G3', 'B3', 'D4'] },   // G
    ],
    scale: ['A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5'],
  },
  andante: {
    bpm: 60,
    chords: [
      { bass: 'D2', notes: ['D3', 'F3', 'A3'] },   // Dm
      { bass: 'C2', notes: ['C3', 'E3', 'G3'] },   // C
      { bass: 'A1', notes: ['A2', 'C3', 'E3'] },   // Am (low)
      { bass: 'A2', notes: ['A3', 'C4', 'E4'] },   // A (resolve)
    ],
    scale: ['D4', 'E4', 'F4', 'A4', 'C5', 'D5'],
  },
  workshop: {
    bpm: 66,
    chords: [
      { bass: 'G2', notes: ['G3', 'B3', 'D4'] },   // G
      { bass: 'E2', notes: ['E3', 'G3', 'B3'] },   // Em
      { bass: 'C2', notes: ['C4', 'E4', 'G4'] },   // C
      { bass: 'D2', notes: ['D4', 'F4', 'A4'] },   // D (suspended-ish)
    ],
    scale: ['G4', 'A4', 'B4', 'D5', 'E5', 'G5'],
  },
};

// ── Piano voice ──────────────────────────────────────────────────────────────
// A piano-ish strike: a few harmonic partials with a fast attack and a
// long exponential decay, softened by a per-note lowpass. Cheap enough to
// schedule a few per beat on mobile.
function playPianoNote(ctx, dest, freq, when, dur, velocity) {
  const partials = [
    { ratio: 1.0,  gain: 1.0 },
    { ratio: 2.0,  gain: 0.42 },
    { ratio: 3.01, gain: 0.18 },   // slight inharmonicity
    { ratio: 4.02, gain: 0.08 },
  ];
  const vca = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = Math.min(7000, freq * 6 + 1200);
  lp.Q.value = 0.5;
  vca.connect(lp).connect(dest);

  const peak = Math.max(0.0001, velocity);
  const a = 0.006;                 // 6 ms attack
  const d = Math.max(0.6, dur);    // decay/release length
  vca.gain.setValueAtTime(0.0001, when);
  vca.gain.exponentialRampToValueAtTime(peak, when + a);
  vca.gain.exponentialRampToValueAtTime(0.0001, when + a + d);

  const oscs = [];
  for (const p of partials) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq * p.ratio;
    const g = ctx.createGain();
    g.gain.value = p.gain;
    o.connect(g).connect(vca);
    o.start(when);
    o.stop(when + a + d + 0.05);
    oscs.push(o, g);
  }
  // Auto-cleanup: oscillators disconnect themselves on stop; the vca/lp
  // are GC'd once their sources end.
  return when + a + d;
}

// ── Violin voice ─────────────────────────────────────────────────────────────
// A bowed-string timbre: two slightly-detuned sawtooths through a warm lowpass,
// a slow (bowed) attack, a sustain hold, and a gentle vibrato on the detune.
// Quieter than the piano so it sits as a harmony layer, not a lead.
function playViolinNote(ctx, dest, freq, when, dur, velocity) {
  const vca = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = Math.min(5000, freq * 5 + 800);
  lp.Q.value = 0.6;
  vca.connect(lp).connect(dest);

  const peak = Math.max(0.0001, velocity);
  const a = 0.13;                    // ~130 ms bowed swell
  const rel = 0.4;
  const sus = Math.max(0.3, dur);
  vca.gain.setValueAtTime(0.0001, when);
  vca.gain.exponentialRampToValueAtTime(peak, when + a);
  vca.gain.setValueAtTime(peak, when + sus);
  vca.gain.exponentialRampToValueAtTime(0.0001, when + sus + rel);

  // Vibrato LFO → detune (cents) of both saws.
  const vib = ctx.createOscillator();
  vib.type = 'sine';
  vib.frequency.value = 5.3;
  const vibGain = ctx.createGain();
  vibGain.gain.value = 8;            // ±8 cents
  vib.connect(vibGain);

  const ends = when + sus + rel + 0.05;
  for (let i = 0; i < 2; i++) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    o.detune.value = i === 0 ? -5 : 5;   // slight chorus between the two saws
    vibGain.connect(o.detune);
    const g = ctx.createGain();
    g.gain.value = 0.5;
    o.connect(g).connect(vca);
    o.start(when);
    o.stop(ends);
  }
  vib.start(when);
  vib.stop(ends);
  return when + sus + rel;
}

// Violin counter-melody contour — a chord-tone index (0=root, 1=3rd, 2=5th)
// per bar. Always a chord tone, so it harmonises with the piano by
// construction; the contour gives it a gentle, repeatable shape distinct from
// the piano's randomised right hand.
const VIOLIN_PHRASE = [2, 1, 2, 0];

export function createPianoPlayer(ctx, destination, spec) {
  const track = (typeof spec === 'string') ? PIANO_TRACKS[spec] : spec;
  const cfg = track || PIANO_TRACKS.reception;

  // Per-player gain for fade in/out, between the notes and the music bus.
  const out = ctx.createGain();
  out.gain.value = 0.0001;
  out.connect(destination);

  const beatDur = 60 / cfg.bpm;     // seconds per beat
  const barDur = beatDur * 4;       // 4 beats per bar, one chord per bar
  let nextBarTime = 0;              // ctx time of the next bar to schedule
  let barIndex = 0;
  let timer = null;
  let stopped = false;
  let scaleMidi = cfg.scale.map(noteToMidi);

  // Route each note to the real sample when the bank is loaded, else the
  // oscillator voice. Take MIDI (not Hz) so the sampler can pitch-shift.
  function notePiano(midi, when, dur, vel) {
    if (_bank && _bank.piano) return playSampleNote(ctx, out, _bank.piano, SAMPLE_GAIN.piano, midi, when, dur, vel);
    return playPianoNote(ctx, out, mtof(midi), when, dur, vel);
  }
  function noteViolin(midi, when, dur, vel) {
    if (_bank && _bank.violin) return playSampleNote(ctx, out, _bank.violin, SAMPLE_GAIN.violin, midi, when, dur, vel);
    return playViolinNote(ctx, out, mtof(midi), when, dur, vel);
  }

  // Schedule one bar: a soft bass + left-hand arpeggio of the chord, plus
  // a sparse right-hand melody. Deliberately leaves rests so it breathes.
  function scheduleBar(barStart) {
    const chord = cfg.chords[barIndex % cfg.chords.length];
    const chordMidi = chord.notes.map(noteToMidi);
    const bassMidi = noteToMidi(chord.bass);

    // Bass note on beat 1 (and a soft re-strike on beat 3).
    notePiano(bassMidi, barStart, barDur * 0.9, 0.22);
    notePiano(bassMidi, barStart + beatDur * 2, barDur * 0.5, 0.13);

    // Left-hand arpeggio: chord tones rolled across the bar's eighth notes.
    const arpPattern = [0, 1, 2, 1, 0, 2, 1, 2];
    for (let i = 0; i < 8; i++) {
      // Skip a couple of eighths so it's not a relentless arp.
      if (i === 3 || i === 6) continue;
      const t = barStart + i * (beatDur / 2);
      const m = chordMidi[arpPattern[i] % chordMidi.length];
      notePiano(m, t, beatDur * 1.1, 0.085 + (i === 0 ? 0.03 : 0));
    }

    // Right-hand melody: 2–3 notes per bar from the scale, biased to chord
    // tones, with gentle randomness so the loop never feels mechanical.
    const melodyBeats = (barIndex % 2 === 0) ? [0, 2.5] : [1, 2, 3.5];
    for (const b of melodyBeats) {
      // 35% chance to rest on any melody slot — keeps it sparse/chill.
      if (Math.random() < 0.35) continue;
      const t = barStart + b * beatDur;
      // Prefer a chord tone up an octave; sometimes a neighbouring scale note.
      let m;
      if (Math.random() < 0.6) {
        m = chordMidi[Math.floor(Math.random() * chordMidi.length)] + 12;
      } else {
        m = scaleMidi[Math.floor(Math.random() * scaleMidi.length)] + 12;
      }
      notePiano(m, t, beatDur * 1.6, 0.13);
    }

    // Violin counter-melody — same chords + meter, its own sustained line a
    // register above the piano so the two voices harmonise. One long bowed
    // chord tone per bar (entering just after the downbeat so it answers the
    // piano), plus a stepwise neighbour on alternate bars for counter-motion.
    const vi = VIOLIN_PHRASE[barIndex % VIOLIN_PHRASE.length];
    const vMain = chordMidi[vi % chordMidi.length] + 12;
    noteViolin(vMain, barStart + beatDur * 0.5, barDur * 0.72, 0.075);
    if (barIndex % 2 === 1) {
      const vNext = chordMidi[(vi + 1) % chordMidi.length] + 12;
      noteViolin(vNext, barStart + beatDur * 2.5, beatDur * 1.5, 0.062);
    }

    barIndex++;
  }

  // Lookahead scheduler — schedule any bar starting within the next 200 ms.
  function tick() {
    if (stopped) return;
    const ahead = ctx.currentTime + 0.2;
    while (nextBarTime < ahead) {
      scheduleBar(nextBarTime);
      nextBarTime += barDur;
    }
  }

  return {
    name: 'piano',
    start(fadeMs = 2500) {
      if (stopped) return;
      // Kick off the real-instrument sample load (cached module-wide). Bars
      // play the synth voices until it resolves, then upgrade to samples.
      try { loadInstrumentBank(ctx); } catch {}
      const now = ctx.currentTime;
      nextBarTime = now + 0.1;
      barIndex = 0;
      out.gain.cancelScheduledValues(now);
      out.gain.setValueAtTime(0.0001, now);
      out.gain.exponentialRampToValueAtTime(0.9, now + Math.max(0.2, fadeMs / 1000));
      tick();
      timer = setInterval(tick, 60);
    },
    stop(fadeMs = 1500) {
      if (stopped) return;
      stopped = true;
      const now = ctx.currentTime;
      const fade = Math.max(0.1, fadeMs / 1000);
      try {
        out.gain.cancelScheduledValues(now);
        out.gain.setValueAtTime(Math.max(0.0001, out.gain.value), now);
        out.gain.exponentialRampToValueAtTime(0.0001, now + fade);
      } catch {}
      if (timer) { clearInterval(timer); timer = null; }
      setTimeout(() => { try { out.disconnect(); } catch {} }, fadeMs + 300);
    },
  };
}
