// procedural.js — every SFX synthesized at runtime via Web Audio.
// No bundled audio files. Each function takes (ctx, output, opts) and
// returns { stop } so AudioManager can steal voices on mobile.
//
// Design rules:
//  • Keep tail length to <2s wherever possible.
//  • Always include a small fade-out so we never click on stop.
//  • Use small filtered noise bursts for percussion / footsteps.
//  • Use sine + triangle for clean melodic blips.
//  • Never schedule more than ~5 nodes per call.
//
// Public surface (called from play.js / lesson.js / test.js / app.js
// via AudioManager.play(channel, builder):
//
//   sfx:    footstep(surface), jumpGrunt, landThud, dialogueBlip(pitch)
//   ui:     uiClick(kind), uiHover, uiConfirm, uiCancel
//   voice:  achievementChime, levelUpFanfare, ppGain,
//           kcCorrectTone, kcIncorrectTone, crowdCheer

import { audio } from './AudioManager.js?v=20260615b';

// ── helpers ─────────────────────────────────────────────────────────────────
function envGain(ctx, output, attack = 0.005, release = 0.1, peak = 0.6) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(peak, ctx.currentTime + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + attack + release);
  g.connect(output);
  return g;
}

function noiseBuffer(ctx, durationSec) {
  const len = Math.ceil(ctx.sampleRate * durationSec);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function makeOsc(ctx, type, freq, detune = 0) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  if (detune) o.detune.value = detune;
  return o;
}

function safeStop(node, when) {
  try { node.stop(when); } catch {}
}

// Schedule a generic stop wrapper to clean up after a builder.
function scheduleStop(ctx, nodes, atSec, onStop) {
  setTimeout(() => {
    for (const n of nodes) {
      try { n.stop?.(); } catch {}
      try { n.disconnect?.(); } catch {}
    }
    onStop?.();
  }, Math.ceil(atSec * 1000) + 30);
}

// ─────────────────────────────────────────────────────────────────────────────
// Footsteps. Surface: 'carpet' | 'wood' | 'metal' | 'tile'
// Each step layers two ingredients so it sounds like an actual footfall
// rather than a single noise click:
//   • thump  — low-freq sine (60–130Hz) sweeping down, soft attack;
//              this is the body-weight impact you feel more than hear.
//   • swish  — bandpass-filtered noise at mid frequency for the
//              shoe-sole rustle; low peak so it doesn't dominate.
// Per-call jitter on pitch/duration keeps consecutive steps distinct.
// ─────────────────────────────────────────────────────────────────────────────
const SURFACE_PROFILES = {
  carpet: { thumpHz:  75, thumpPeak: 0.34, swishFreq:  700, swishQ: 0.7, swishPeak: 0.05, dur: 0.18, jitter: 0.4  },
  wood:   { thumpHz:  95, thumpPeak: 0.30, swishFreq: 1100, swishQ: 1.0, swishPeak: 0.10, dur: 0.16, jitter: 0.35 },
  tile:   { thumpHz: 110, thumpPeak: 0.26, swishFreq: 1800, swishQ: 1.8, swishPeak: 0.14, dur: 0.14, jitter: 0.3  },
  metal:  { thumpHz: 130, thumpPeak: 0.26, swishFreq: 2400, swishQ: 2.2, swishPeak: 0.18, dur: 0.13, jitter: 0.3  },
};

export function playFootstep(surface = 'carpet') {
  const prof = SURFACE_PROFILES[surface] || SURFACE_PROFILES.carpet;
  audio.play('sfx', (ctx, output) => {
    const dur = prof.dur * (1 - prof.jitter * 0.5 + Math.random() * prof.jitter);
    const t0 = ctx.currentTime;

    // Thump — low-freq sine, slight pitch-down, soft attack.
    const thumpDur = Math.min(dur, 0.10);
    const thumpHz = prof.thumpHz * (0.9 + Math.random() * 0.2);
    const o = makeOsc(ctx, 'sine', thumpHz);
    o.frequency.exponentialRampToValueAtTime(thumpHz * 0.55, t0 + thumpDur);
    const og = envGain(ctx, output, 0.006, thumpDur - 0.006, prof.thumpPeak);
    o.connect(og);
    o.start();
    safeStop(o, t0 + thumpDur);
    scheduleStop(ctx, [o, og], thumpDur);

    // Swish — bandpass noise, softer envelope, longer than thump.
    const buf = noiseBuffer(ctx, dur);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = prof.swishFreq * (1 - prof.jitter * 0.3 + Math.random() * prof.jitter * 0.6);
    bp.Q.value = prof.swishQ;
    const g = envGain(ctx, output, 0.014, dur - 0.016, prof.swishPeak);
    src.connect(bp).connect(g);
    src.start();
    safeStop(src, t0 + dur);
    scheduleStop(ctx, [src, bp, g], dur);

    return { stop: () => { safeStop(o, ctx.currentTime); safeStop(src, ctx.currentTime); } };
  }, { expectedDuration: prof.dur + 0.05 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Jump grunt — short pitched noise burst with descending filter.
// ─────────────────────────────────────────────────────────────────────────────
export function playJumpGrunt() {
  audio.play('sfx', (ctx, output) => {
    const dur = 0.18;
    const buf = noiseBuffer(ctx, dur);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900, ctx.currentTime);
    lp.frequency.exponentialRampToValueAtTime(380, ctx.currentTime + dur);
    lp.Q.value = 5;
    const g = envGain(ctx, output, 0.005, dur - 0.01, 0.5);
    src.connect(lp).connect(g);
    src.start();
    safeStop(src, ctx.currentTime + dur);
    scheduleStop(ctx, [src, lp, g], dur);
    return { stop: () => safeStop(src, ctx.currentTime) };
  }, { expectedDuration: 0.25 });
}

// Land thud — softer than the jump grunt, dropping pitch.
export function playLandThud() {
  audio.play('sfx', (ctx, output) => {
    const dur = 0.16;
    const o = makeOsc(ctx, 'sine', 100);
    o.frequency.exponentialRampToValueAtTime(48, ctx.currentTime + dur);
    const g = envGain(ctx, output, 0.005, dur, 0.45);
    o.connect(g);
    o.start();
    safeStop(o, ctx.currentTime + dur);
    scheduleStop(ctx, [o, g], dur);
    return { stop: () => safeStop(o, ctx.currentTime) };
  }, { expectedDuration: 0.25 });
}

// ─────────────────────────────────────────────────────────────────────────────
// UI — short pitched sine blips. kind = 'click' | 'hover' | 'confirm' | 'cancel'
// ─────────────────────────────────────────────────────────────────────────────
const UI_PROFILES = {
  click:   { freqs: [880, 0],            type: 'sine',     dur: 0.06, peak: 0.3 },
  hover:   { freqs: [660, 0],            type: 'triangle', dur: 0.04, peak: 0.18 },
  confirm: { freqs: [660, 990],          type: 'sine',     dur: 0.18, peak: 0.32 },
  cancel:  { freqs: [550, 350],          type: 'sine',     dur: 0.18, peak: 0.32 },
  toggle:  { freqs: [780, 880],          type: 'triangle', dur: 0.12, peak: 0.28 },
};

export function playUi(kind = 'click') {
  const prof = UI_PROFILES[kind] || UI_PROFILES.click;
  audio.play('ui', (ctx, output) => {
    const o = makeOsc(ctx, prof.type, prof.freqs[0]);
    if (prof.freqs[1]) {
      o.frequency.setValueAtTime(prof.freqs[0], ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(
        prof.freqs[1] || prof.freqs[0], ctx.currentTime + prof.dur,
      );
    }
    const g = envGain(ctx, output, 0.003, prof.dur, prof.peak);
    o.connect(g);
    o.start();
    safeStop(o, ctx.currentTime + prof.dur + 0.02);
    scheduleStop(ctx, [o, g], prof.dur + 0.05);
    return { stop: () => safeStop(o, ctx.currentTime) };
  }, { expectedDuration: prof.dur + 0.05 });
}

// ─────────────────────────────────────────────────────────────────────────────
// NPC dialogue blips — quick triangle pulses, base pitch shifted per NPC,
// played repeatedly while text reveals (rate-limited by caller).
// ─────────────────────────────────────────────────────────────────────────────
export function playDialogueBlip(basePitch = 1.0) {
  audio.play('voice', (ctx, output) => {
    const dur = 0.045;
    const o = makeOsc(ctx, 'triangle', 320 * basePitch * (0.92 + Math.random() * 0.16));
    const g = envGain(ctx, output, 0.002, dur, 0.18);
    o.connect(g);
    o.start();
    safeStop(o, ctx.currentTime + dur + 0.02);
    scheduleStop(ctx, [o, g], dur + 0.05);
    return { stop: () => safeStop(o, ctx.currentTime) };
  }, { expectedDuration: 0.07 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Achievement chime — 3-note arpeggio (C E G), sine + triangle blend.
// ─────────────────────────────────────────────────────────────────────────────
export function playAchievementChime() {
  const notes = [523.25, 659.25, 783.99]; // C5 E5 G5
  audio.play('voice', (ctx, output) => {
    const cleanup = [];
    notes.forEach((freq, i) => {
      const t0 = ctx.currentTime + i * 0.10;
      const a = makeOsc(ctx, 'sine', freq);
      const b = makeOsc(ctx, 'triangle', freq * 2);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.32, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
      a.connect(g); b.connect(g); g.connect(output);
      a.start(t0); b.start(t0);
      a.stop(t0 + 0.5); b.stop(t0 + 0.5);
      cleanup.push(a, b, g);
    });
    scheduleStop(ctx, cleanup, 0.85);
    return { stop: () => cleanup.forEach(n => safeStop(n, ctx.currentTime)) };
  }, { expectedDuration: 0.85 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Level-up fanfare — 5 ascending notes with a sine + triangle blend and
// a faux reverb tail (delayed echo).
// ─────────────────────────────────────────────────────────────────────────────
export function playLevelUpFanfare() {
  const notes = [392.0, 523.25, 659.25, 783.99, 1046.5]; // G C E G C
  audio.play('voice', (ctx, output) => {
    const cleanup = [];
    // Send bus + delay for tail
    const wet = ctx.createGain();
    wet.gain.value = 0.32;
    const delay = ctx.createDelay(0.6);
    delay.delayTime.value = 0.18;
    const fb = ctx.createGain();
    fb.gain.value = 0.42;
    delay.connect(fb).connect(delay);
    delay.connect(wet).connect(output);
    cleanup.push(wet, delay, fb);

    notes.forEach((freq, i) => {
      const t0 = ctx.currentTime + i * 0.13;
      const a = makeOsc(ctx, 'sine', freq);
      const b = makeOsc(ctx, 'triangle', freq * 1.5);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.36, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);
      a.connect(g); b.connect(g); g.connect(output); g.connect(delay);
      a.start(t0); b.start(t0);
      a.stop(t0 + 0.6); b.stop(t0 + 0.6);
      cleanup.push(a, b, g);
    });
    scheduleStop(ctx, cleanup, notes.length * 0.13 + 1.4);
    return { stop: () => cleanup.forEach(n => safeStop(n, ctx.currentTime)) };
  }, { expectedDuration: 2.2 });
}

// ─────────────────────────────────────────────────────────────────────────────
// PP gain ping — single high blip, brighter than UI confirm.
// ─────────────────────────────────────────────────────────────────────────────
export function playPpPing() {
  audio.play('voice', (ctx, output) => {
    const dur = 0.22;
    const o = makeOsc(ctx, 'sine', 1200);
    o.frequency.setValueAtTime(1200, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + dur * 0.4);
    const g = envGain(ctx, output, 0.003, dur, 0.32);
    o.connect(g);
    o.start();
    safeStop(o, ctx.currentTime + dur + 0.02);
    scheduleStop(ctx, [o, g], dur + 0.05);
    return { stop: () => safeStop(o, ctx.currentTime) };
  }, { expectedDuration: 0.3 });
}

// ─────────────────────────────────────────────────────────────────────────────
// KC tones — happy rising vs sad falling pair.
// ─────────────────────────────────────────────────────────────────────────────
export function playKcCorrectTone() {
  audio.play('voice', (ctx, output) => {
    const o1 = makeOsc(ctx, 'sine', 660);
    const o2 = makeOsc(ctx, 'sine', 990);
    const g1 = envGain(ctx, output, 0.005, 0.18, 0.34);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0, ctx.currentTime + 0.12);
    g2.gain.linearRampToValueAtTime(0.34, ctx.currentTime + 0.13);
    g2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    g2.connect(output);
    o1.connect(g1); o2.connect(g2);
    o1.start(); o2.start();
    safeStop(o1, ctx.currentTime + 0.5); safeStop(o2, ctx.currentTime + 0.5);
    scheduleStop(ctx, [o1, o2, g1, g2], 0.6);
    return { stop: () => { safeStop(o1, ctx.currentTime); safeStop(o2, ctx.currentTime); } };
  }, { expectedDuration: 0.6 });
}

export function playKcIncorrectTone() {
  audio.play('voice', (ctx, output) => {
    const o1 = makeOsc(ctx, 'sawtooth', 220);
    const o2 = makeOsc(ctx, 'sawtooth', 165);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 800; lp.Q.value = 1.0;
    const g = envGain(ctx, output, 0.005, 0.32, 0.28);
    o1.connect(lp); o2.connect(lp); lp.connect(g);
    o1.start(); o2.start();
    safeStop(o1, ctx.currentTime + 0.4); safeStop(o2, ctx.currentTime + 0.4);
    scheduleStop(ctx, [o1, o2, lp, g], 0.5);
    return { stop: () => { safeStop(o1, ctx.currentTime); safeStop(o2, ctx.currentTime); } };
  }, { expectedDuration: 0.5 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Floor-4 clearance chime (Kedash Protocol, TWIST2-01) — two rising
// notes, sine + octave triangle, longer release than UI confirm so it
// reads as "the building acknowledged you" rather than a button press.
// ─────────────────────────────────────────────────────────────────────────────
export function playClearanceChime() {
  const notes = [659.25, 987.77]; // E5 → B5
  audio.play('voice', (ctx, output) => {
    const cleanup = [];
    notes.forEach((freq, i) => {
      const t0 = ctx.currentTime + i * 0.16;
      const a = makeOsc(ctx, 'sine', freq);
      const b = makeOsc(ctx, 'triangle', freq * 2);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.30, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.7);
      a.connect(g); b.connect(g); g.connect(output);
      a.start(t0); b.start(t0);
      a.stop(t0 + 0.75); b.stop(t0 + 0.75);
      cleanup.push(a, b, g);
    });
    scheduleStop(ctx, cleanup, 1.1);
    return { stop: () => cleanup.forEach(n => safeStop(n, ctx.currentTime)) };
  }, { expectedDuration: 1.1 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Anomaly sting (Kedash Protocol, AUDIO-01) — a soft room-tone swell for
// the handful of "wait, what did she just say?" dialogue lines. NOT a
// horror sting: low sine bed + a faint filtered-noise breath that rises
// and settles over ~2 s, quiet enough to register subliminally.
// ─────────────────────────────────────────────────────────────────────────────
export function playAnomalySting() {
  audio.play('voice', (ctx, output) => {
    const t0 = ctx.currentTime;
    const dur = 2.2;
    // Low bed — A2 sine with a slightly detuned partner for slow beating.
    const o1 = makeOsc(ctx, 'sine', 110);
    const o2 = makeOsc(ctx, 'sine', 110, 8);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.10, t0 + 0.9);
    g.gain.linearRampToValueAtTime(0.07, t0 + 1.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o1.connect(g); o2.connect(g); g.connect(output);
    o1.start(t0); o2.start(t0);
    safeStop(o1, t0 + dur); safeStop(o2, t0 + dur);
    // Air — narrow bandpass noise swell, barely above the noise floor.
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, dur);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 2.5;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0, t0);
    ng.gain.linearRampToValueAtTime(0.045, t0 + 1.1);
    ng.gain.linearRampToValueAtTime(0, t0 + dur);
    src.connect(bp).connect(ng).connect(output);
    src.start(t0);
    safeStop(src, t0 + dur);
    scheduleStop(ctx, [o1, o2, g, src, bp, ng], dur + 0.1);
    return { stop: () => { safeStop(o1, ctx.currentTime); safeStop(o2, ctx.currentTime); safeStop(src, ctx.currentTime); } };
  }, { expectedDuration: 2.4 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Floor-M arrival chime (Kedash Protocol, AUDIO-02) — deliberately the
// inverse of playClearanceChime: lower register (A3 → E4), slower note
// gap, longer release. The slot below '1' shouldn't sound like a promotion.
// ─────────────────────────────────────────────────────────────────────────────
export function playFloorMChime() {
  const notes = [220.0, 329.63]; // A3 → E4
  audio.play('voice', (ctx, output) => {
    const cleanup = [];
    notes.forEach((freq, i) => {
      const t0 = ctx.currentTime + i * 0.42;
      const a = makeOsc(ctx, 'sine', freq);
      const b = makeOsc(ctx, 'triangle', freq * 2);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.26, t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.5);
      a.connect(g); b.connect(g); g.connect(output);
      a.start(t0); b.start(t0);
      a.stop(t0 + 1.55); b.stop(t0 + 1.55);
      cleanup.push(a, b, g);
    });
    scheduleStop(ctx, cleanup, 2.1);
    return { stop: () => cleanup.forEach(n => safeStop(n, ctx.currentTime)) };
  }, { expectedDuration: 2.1 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Server hum bed (Kedash Protocol, AUDIO-03 / A21) — sustained low drone
// near the ch16 rack. play.js calls updateServerHum(active, lowered, pos)
// every frame from its proximity check; state is managed here so a stolen
// voice (mobile voice cap) simply restarts on the next frame. `lowered`
// drops every partial one semitone (×2^(-1/12)) once the capstone passes.
// When `position` ([x,y,z] world coords) is given, the hum routes through
// the HRTF playSpatial path so it sits AT the rack and attenuates with
// distance instead of toggling on/off; the proximity boolean then only
// bounds CPU (no nodes when far away).
// ─────────────────────────────────────────────────────────────────────────────
let _hum = null; // { handle, lowered }
export function updateServerHum(active, lowered = false, position = null) {
  if (!active || (_hum && _hum.lowered !== lowered)) {
    if (_hum) { try { _hum.handle.stop?.(); } catch {} _hum = null; }
    if (!active) return;
  }
  if (_hum) return;
  const ratio = lowered ? Math.pow(2, -1 / 12) : 1;
  const entry = { handle: null, lowered };
  const builder = (ctx, output) => {
    const t0 = ctx.currentTime;
    const o1 = makeOsc(ctx, 'sine', 55 * ratio);
    const o2 = makeOsc(ctx, 'triangle', 110 * ratio, 6);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 260; lp.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    // Spatial path attenuates with distance (inverse model), so its base
    // level is hotter than the old binary toggle's flat 0.07.
    g.gain.linearRampToValueAtTime(position ? 0.13 : 0.07, t0 + 1.4);
    // Slow ±15% wobble so it reads as machinery, not a test tone.
    const lfo = makeOsc(ctx, 'sine', 0.4);
    const lfoG = ctx.createGain();
    lfoG.gain.value = 0.01;
    lfo.connect(lfoG).connect(g.gain);
    o1.connect(lp); o2.connect(lp); lp.connect(g).connect(output);
    o1.start(t0); o2.start(t0); lfo.start(t0);
    return {
      stop: () => {
        if (_hum === entry) _hum = null;
        const t = ctx.currentTime;
        try { g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, 0.2); } catch {}
        // In the spatial case `output` is a dedicated PannerNode — include
        // it in cleanup. (Never disconnect the shared bus gain.)
        const nodes = [o1, o2, lfo, lfoG, lp, g];
        if (position) nodes.push(output);
        scheduleStop(ctx, nodes, 0.8);
      },
    };
  };
  const handle = position
    ? audio.playSpatial('sfx', builder, position, { refDistance: 2.5, maxDistance: 28, rolloffFactor: 1.3 })
    : audio.play('sfx', builder);
  if (handle) { entry.handle = handle; _hum = entry; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Elevator ride (AUDIO design pass) — low triangle "motor" ramp plus a
// narrow filtered-noise band (cable/air shoosh) for the ride duration.
// Fired from requestFloorChange alongside the floor chimes. The Floor-M
// arrival stays silent — this ends exactly when the doors open.
// ─────────────────────────────────────────────────────────────────────────────
export function playElevatorRide(durationSec = 1.6) {
  const dur = Math.max(0.4, Math.min(2.5, durationSec));
  audio.play('sfx', (ctx, output) => {
    const t0 = ctx.currentTime;
    // Motor — low triangle, spins up a fourth, settles back down.
    const o = makeOsc(ctx, 'triangle', 58);
    o.frequency.setValueAtTime(58, t0);
    o.frequency.linearRampToValueAtTime(76, t0 + dur * 0.35);
    o.frequency.linearRampToValueAtTime(60, t0 + dur);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 320; lp.Q.value = 0.7;
    const og = ctx.createGain();
    og.gain.setValueAtTime(0, t0);
    og.gain.linearRampToValueAtTime(0.11, t0 + Math.min(0.18, dur * 0.25));
    og.gain.setValueAtTime(0.11, t0 + dur * 0.8);
    og.gain.linearRampToValueAtTime(0, t0 + dur);
    o.connect(lp).connect(og).connect(output);
    o.start(t0);
    safeStop(o, t0 + dur + 0.05);
    // Shoosh — narrow bandpass noise riding the same envelope shape.
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, dur);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 7;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0, t0);
    ng.gain.linearRampToValueAtTime(0.05, t0 + Math.min(0.25, dur * 0.3));
    ng.gain.setValueAtTime(0.05, t0 + dur * 0.75);
    ng.gain.linearRampToValueAtTime(0, t0 + dur);
    src.connect(bp).connect(ng).connect(output);
    src.start(t0);
    safeStop(src, t0 + dur + 0.05);
    scheduleStop(ctx, [o, lp, og, src, bp, ng], dur + 0.1);
    return { stop: () => { safeStop(o, ctx.currentTime); safeStop(src, ctx.currentTime); } };
  }, { expectedDuration: dur + 0.2 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Crowd cheer — wide-band noise with an envelope crescendo. Used during
// the post-test celebration dance alongside the celebration music track
// (if music file is present).
// ─────────────────────────────────────────────────────────────────────────────
export function playCrowdCheer(durationSec = 3.0) {
  audio.play('voice', (ctx, output) => {
    const buf = noiseBuffer(ctx, durationSec);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.42, ctx.currentTime + 0.5);
    g.gain.linearRampToValueAtTime(0.32, ctx.currentTime + durationSec - 0.5);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + durationSec);
    src.connect(bp).connect(g).connect(output);
    src.start();
    safeStop(src, ctx.currentTime + durationSec + 0.05);
    scheduleStop(ctx, [src, bp, g], durationSec + 0.1);
    return { stop: () => safeStop(src, ctx.currentTime) };
  }, { expectedDuration: durationSec + 0.2 });
}

// Convenience map for the dialogue blip pitch per NPC ID — keeps NPC
// "voices" recognisable. Falls back to 1.0 for unknown ids.
const NPC_PITCH = {
  linda: 1.2, marcus: 0.78, aisha: 1.05, kenji: 0.88, diana: 1.15, sarah: 1.0,
  elena: 0.9, raj: 0.82, mei: 1.1, noor: 0.95,
};
export function blipPitchForNpc(id) {
  return NPC_PITCH[id] || 1.0;
}
