// ambience.js — procedural per-zone roomtone beds + story-tier shift.
//
// Generalizes the updateServerHum pattern: one bed plays at a time,
// crossfaded on zone change. Everything is synthesized (zero assets) and
// mobile-cheap: one looping noise buffer + two biquads + a gain LFO per
// bed, plus (T4+) a single barely-audible beating oscillator pair.
//
// Design intent: the beds are FELT, not heard — HVAC roomtone at the
// edge of audibility. The tier shift (T3/T4/T5+) detunes the bed a few
// cents, closes the lowpass slightly and adds a slow beat; at no tier
// should a player consciously notice. T7 (resolution) returns to neutral.
//
// Public surface (play.js):
//   startAmbience(zoneIdx)     — crossfade to the zone's bed
//   stopAmbience(fadeMs?)      — fade out + tear down (Floor M / leaving play)
//   tickAmbience()             — slow-poll retry while the ctx is locked
//   applyStoryTierAudio(tier)  — ambience detune/lowpass/beat + music shelf
//
// Routes through the 'ambience' channel bus (persisted pref like the
// other channels — see AudioManager DEFAULT_PREFS).

import { audio } from './AudioManager.js?v=20260612c';
import { ambienceBedForZone } from './zoneConfig.js?v=20260612c';

// ── Bed recipes ──────────────────────────────────────────────────────────────
// gain values are pre-bus: effective loudness ≈ gain × ambience(0.8) ×
// master(0.85) — i.e. office lands around -32 dBFS. Barely audible.
const BEDS = {
  //          lowpass  level   LFO rate  LFO depth   high shimmer?
  office:  { lpHz: 420, gain: 0.040, lfoHz: 0.060, lfoDepth: 0.010, shimmer: false },
  library: { lpHz: 300, gain: 0.028, lfoHz: 0.045, lfoDepth: 0.008, shimmer: true  },
  atrium:  { lpHz: 760, gain: 0.036, lfoHz: 0.070, lfoDepth: 0.010, shimmer: false },
};

// ── Tier shift table ─────────────────────────────────────────────────────────
// detune in cents (via playbackRate), lowpass multiplier, beat-pair gain.
// Steps engage as the tier rises past T2 / T4 / T6; T7 resolves to neutral.
function tierShape(t) {
  if (t >= 7 || t <= 2) return { cents: 0,   lpMul: 1.00, beat: 0     };
  if (t === 3)          return { cents: -10, lpMul: 0.94, beat: 0     };
  if (t === 4)          return { cents: -12, lpMul: 0.90, beat: 0.012 };
  if (t === 5)          return { cents: -15, lpMul: 0.87, beat: 0.012 };
  /* t === 6 */         return { cents: -15, lpMul: 0.83, beat: 0.016 };
}
const centsToRate = (c) => Math.pow(2, c / 1200);

const CROSSFADE_S = 1.6;

let _bed = null;          // current bed: { name, nodes:{...}, stopped, shimmerTimer }
let _pendingZone = -1;    // zone waiting for an unlocked/locked-but-buildable ctx
let _tier = 0;

// ── Noise loops (cached per type) ────────────────────────────────────────────
// Brown noise (integrated white) reads as distant machinery/airflow once
// lowpassed. 2 s loop; the tail is crossfaded into the head so the loop
// seam never clicks.
let _brownBuf = null;
function brownBuffer(ctx) {
  if (_brownBuf && _brownBuf.sampleRate === ctx.sampleRate) return _brownBuf;
  const len = Math.ceil(ctx.sampleRate * 2.0);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let b = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    b = (b + 0.02 * w) / 1.02;
    d[i] = b * 3.5;
  }
  // De-click the loop seam: blend the last N samples toward the first N.
  const N = Math.min(4096, len >> 2);
  for (let i = 0; i < N; i++) {
    const f = i / N;
    d[len - N + i] = d[len - N + i] * (1 - f) + d[i] * f;
  }
  _brownBuf = buf;
  return buf;
}

function bus() {
  return audio.channels?.ambience?.gain || null;
}

// ── Bed lifecycle ────────────────────────────────────────────────────────────
function buildBed(name) {
  const cfg = BEDS[name] || BEDS.office;
  const ctx = audio.ctx;
  const out = bus();
  if (!ctx || !out) return null;
  const t0 = ctx.currentTime;
  const shape = tierShape(_tier);

  // noise → lowpass → bedGain (level + LFO) → fade (crossfade 0..1) → bus
  const src = ctx.createBufferSource();
  src.buffer = brownBuffer(ctx);
  src.loop = true;
  src.playbackRate.value = centsToRate(shape.cents);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = cfg.lpHz * shape.lpMul;
  lp.Q.value = 0.5;
  const bedGain = ctx.createGain();
  bedGain.gain.value = cfg.gain;
  // Very slow LFO on the bed level — the "building breathing" HVAC drift.
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = cfg.lfoHz;
  const lfoG = ctx.createGain();
  lfoG.gain.value = cfg.lfoDepth;
  lfo.connect(lfoG).connect(bedGain.gain);
  const fade = ctx.createGain();
  fade.gain.setValueAtTime(0, t0);
  fade.gain.setTargetAtTime(1, t0, CROSSFADE_S / 3);
  src.connect(lp).connect(bedGain).connect(fade).connect(out);
  src.start(t0);
  lfo.start(t0);

  // T4+ beat pair — two near-unison low sines whose ~0.35 Hz beating sits
  // under the bed. Created lazily by applyStoryTierAudio when needed;
  // routed through `fade` so it crossfades with the bed.
  const bed = {
    name,
    cfg,
    stopped: false,
    shimmerTimer: null,
    nodes: { src, lp, bedGain, lfo, lfoG, fade, beatA: null, beatB: null, beatG: null },
  };
  if (shape.beat > 0) ensureBeatPair(bed, shape.beat);
  if (cfg.shimmer) scheduleShimmer(bed);
  return bed;
}

function ensureBeatPair(bed, level) {
  const ctx = audio.ctx;
  if (!ctx || bed.stopped) return;
  const n = bed.nodes;
  if (!n.beatG) {
    n.beatG = ctx.createGain();
    n.beatG.gain.value = 0;
    n.beatA = ctx.createOscillator();
    n.beatA.type = 'sine';
    n.beatA.frequency.value = 46.0;
    n.beatB = ctx.createOscillator();
    n.beatB.type = 'sine';
    n.beatB.frequency.value = 46.35; // ~0.35 Hz beating
    n.beatA.connect(n.beatG);
    n.beatB.connect(n.beatG);
    n.beatG.connect(n.fade);
    n.beatA.start();
    n.beatB.start();
  }
  n.beatG.gain.setTargetAtTime(level, ctx.currentTime, 2.0);
}

// Library shimmer — every 9–18 s a soft, high sine ping (2–4 kHz) with a
// long decay, quiet enough to read as a distant page/glass resonance.
function scheduleShimmer(bed) {
  bed.shimmerTimer = setTimeout(() => {
    const ctx = audio.ctx;
    if (bed.stopped || !ctx) return;
    try {
      const t0 = ctx.currentTime;
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = 2000 + Math.random() * 2000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.010, t0 + 0.5);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.2);
      o.connect(g).connect(bed.nodes.fade);
      o.start(t0);
      o.stop(t0 + 2.3);
      setTimeout(() => { try { g.disconnect(); } catch {} }, 2600);
    } catch { /* bed torn down mid-schedule — fine */ }
    scheduleShimmer(bed);
  }, 9000 + Math.random() * 9000);
}

function teardownBed(bed, fadeMs) {
  if (!bed || bed.stopped) return;
  bed.stopped = true;
  if (bed.shimmerTimer) { clearTimeout(bed.shimmerTimer); bed.shimmerTimer = null; }
  const ctx = audio.ctx;
  const n = bed.nodes;
  const fadeS = Math.max(0.1, fadeMs / 1000);
  try {
    n.fade.gain.cancelScheduledValues(ctx.currentTime);
    n.fade.gain.setTargetAtTime(0, ctx.currentTime, fadeS / 3);
  } catch {}
  setTimeout(() => {
    for (const node of [n.src, n.lfo, n.beatA, n.beatB]) {
      if (node) { try { node.stop(); } catch {} }
    }
    for (const node of Object.values(n)) {
      if (node) { try { node.disconnect(); } catch {} }
    }
  }, fadeMs + 300);
}

// ── Public API ───────────────────────────────────────────────────────────────
export function startAmbience(zoneIdx) {
  _pendingZone = zoneIdx;
  if (!audio.ctx) {
    // Same lazy pattern as audio.play — builds a (possibly suspended)
    // context; sources start once the mobile unlock resumes it.
    try { audio._buildContext(); } catch {}
  }
  if (!audio.ctx || !bus()) return; // retried by tickAmbience()
  const bedName = ambienceBedForZone(zoneIdx);
  if (_bed && !_bed.stopped && _bed.name === bedName) return;
  const old = _bed;
  _bed = buildBed(bedName);
  if (old) teardownBed(old, CROSSFADE_S * 1000);
}

export function stopAmbience(fadeMs = 1200) {
  _pendingZone = -1;
  if (_bed) { teardownBed(_bed, fadeMs); _bed = null; }
}

// Called on the slow (1 Hz) poll in play.js — restarts a bed that never
// got built (locked ctx at zone change) or got torn down out-of-band.
export function tickAmbience() {
  if (_pendingZone < 0) return;
  if (_bed && !_bed.stopped) return;
  startAmbience(_pendingZone);
}

// Story tier → ambience detune/lowpass/beat + the music-bus highshelf.
// Subtle by design; every move is a slow setTargetAtTime ramp.
export function applyStoryTierAudio(tier) {
  const t = Math.max(0, Math.min(7, tier | 0));
  try { audio.setStoryTier(t); } catch {}
  if (t === _tier) return;
  _tier = t;
  const ctx = audio.ctx;
  if (!ctx || !_bed || _bed.stopped) return;
  const shape = tierShape(t);
  const n = _bed.nodes;
  const now = ctx.currentTime;
  try {
    n.src.playbackRate.setTargetAtTime(centsToRate(shape.cents), now, 1.5);
    n.lp.frequency.setTargetAtTime(_bed.cfg.lpHz * shape.lpMul, now, 1.5);
  } catch {}
  if (shape.beat > 0) ensureBeatPair(_bed, shape.beat);
  else if (n.beatG) { try { n.beatG.gain.setTargetAtTime(0, now, 2.0); } catch {} }
}
