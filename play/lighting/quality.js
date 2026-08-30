// Graphics quality tier — deliberately NOT the same question as isMobile().
//
// The engine always had a "reduced" tier (smaller bloom targets, no grain, no
// spot shadows, no dust motes, fewer skyline blocks), but every one of those
// switches hung off isMobile(). A locked-down work laptop with an integrated
// GPU reads as a desktop by that test, so it got the full treatment: device
// pixel ratio up to 2 (four times the fragments of a 1x buffer), MSAA, a
// full-resolution bloom chain, soft shadows and every accent light. That
// machine is exactly the one that cannot afford any of it.
//
// So: isMobile() keeps answering "is this a touch device" (it drives input and
// layout), and isLowGraphics() answers "should we spend GPU here". They agree
// on phones and diverge precisely where it matters.
//
// Modes, stored in localStorage under `ccq_graphics`:
//   'auto' (default) — low on touch devices, and low if the runtime sampler
//                      below decides the machine can't hold a playable rate
//   'high'           — force the full pipeline
//   'low'            — force the cheap pipeline
//
// Progress lives in localStorage keyed by origin+port, and so does this, which
// is why the offline launcher pins a fixed port: a player who turns graphics
// down keeps that setting the next time they launch.

import { isMobile } from './mobile.js';

const KEY = 'ccq_graphics';
const VALID = new Set(['auto', 'high', 'low']);

// Set by the sampler, not persisted: a machine that was busy once shouldn't be
// branded slow forever, and re-measuring costs nothing.
let _autoLow = false;

export function getGraphicsMode() {
  try {
    const v = localStorage.getItem(KEY);
    return VALID.has(v) ? v : 'auto';
  } catch {
    return 'auto';
  }
}

export function setGraphicsMode(mode) {
  if (!VALID.has(mode)) return;
  try { localStorage.setItem(KEY, mode); } catch {}
  // An explicit choice retires the sampler's verdict in both directions:
  // picking High after an auto-downgrade must actually restore quality.
  if (mode !== 'auto') _autoLow = false;
}

export function isLowGraphics() {
  const mode = getGraphicsMode();
  if (mode === 'low') return true;
  if (mode === 'high') return false;
  return isMobile() || _autoLow;
}

// True only when 'auto' resolved to low *because of the sampler* — used to
// explain the downgrade to the player rather than leaving them wondering why
// the office lost its bloom.
export function isAutoDowngraded() {
  return getGraphicsMode() === 'auto' && _autoLow;
}

// Pixel ratio is the single biggest lever: at DPR 2 the renderer fills four
// fragments for every one at DPR 1, and a weak GPU feels that before it feels
// any amount of geometry. Supersedes the copy in mobile.js.
export function effectivePixelRatio() {
  const dpr = window.devicePixelRatio || 1;
  if (isMobile()) return Math.min(1.25, dpr);
  return isLowGraphics() ? 1 : Math.min(2, dpr);
}

// ── up-front hardware probe ─────────────────────────────────────────────────
// The sampler below only reaches a verdict after several seconds of bad
// frames, which means a struggling machine still gets a bad first impression.
// Some hardware can be recognised before the first frame is drawn, so this
// runs once at start-up and pre-seeds the verdict.
//
// The signal that matters most on a locked-down work laptop is a software
// renderer: with no usable GPU driver, browsers fall back to SwiftShader or
// Microsoft's Basic Render Driver and rasterise on the CPU. That is not a
// "slightly slow GPU", it is no GPU at all, and no amount of tuning makes the
// full pipeline viable there.
//
// Deliberately narrow. It only ever downgrades, never upgrades, and anything
// it can't positively identify is left to the sampler — guessing that a GPU
// is weak from its name is how you end up degrading hardware that was fine.
const SOFTWARE_RENDERER = /swiftshader|basic render|llvmpipe|softpipe|software|microsoft basic/i;

export function probeHardware() {
  if (getGraphicsMode() !== 'auto' || _autoLow) return null;
  let canvas = null;
  let gl = null;
  try {
    canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      // No WebGL at all — the caller has bigger problems, but low is right.
      _autoLow = true;
      return 'no-webgl';
    }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '') : '';
    if (name && SOFTWARE_RENDERER.test(name)) {
      _autoLow = true;
      return `software-renderer:${name}`;
    }
    // A machine reporting very few logical cores is usually a thin client or
    // a heavily restricted VM; paired with no dedicated GPU it will struggle.
    const cores = navigator.hardwareConcurrency;
    if (typeof cores === 'number' && cores > 0 && cores <= 2) {
      _autoLow = true;
      return `low-core-count:${cores}`;
    }
    return null;
  } catch {
    return null;   // never let a probe failure decide anything
  } finally {
    // Release the probe context immediately; browsers cap how many a page may
    // hold, and the real renderer needs one.
    try { gl?.getExtension('WEBGL_lose_context')?.loseContext(); } catch {}
    canvas = null;
  }
}

// ── runtime sampler ─────────────────────────────────────────────────────────
// Most people on a constrained laptop will never open a settings panel, so
// 'auto' has to notice for them. Kept deliberately reluctant:
//   • a long warm-up, because the first seconds are shader compiles, GLB
//     decodes and texture uploads, and would condemn a perfectly good machine
//   • a whole window of frames, not a spike — the loop already reports isolated
//     spikes separately
//   • it fires once and never reverses, because a tier that flickers mid-play
//     is more distracting than either tier is on its own
const WARMUP_MS = 6000;
const BAD_FRAME_MS = 40;   // slower than ~25fps
const WINDOW = 120;        // frames per verdict
const BAD_RATIO = 0.6;     // most of the window has to be bad

let _firstSampleAt = 0;
let _frames = 0;
let _badFrames = 0;
let _fired = false;

// Returns true exactly once, on the frame the verdict flips to low, so the
// caller can apply the parts of the tier that are safe to change live.
export function noteFrameTime(frameMs, nowMs) {
  if (_fired) return false;
  // Nothing to decide when the answer is already fixed, by the player or by
  // the device being a phone (which is low regardless).
  if (getGraphicsMode() !== 'auto' || isMobile()) return false;

  if (!_firstSampleAt) _firstSampleAt = nowMs;
  if (nowMs - _firstSampleAt < WARMUP_MS) return false;

  _frames++;
  if (frameMs > BAD_FRAME_MS) _badFrames++;
  if (_frames < WINDOW) return false;

  const ratio = _badFrames / _frames;
  _frames = 0;
  _badFrames = 0;
  if (ratio >= BAD_RATIO) {
    _autoLow = true;
    _fired = true;
    return true;
  }
  return false;
}

// Let a fresh session re-measure (stop() calls this).
export function resetSampler() {
  _firstSampleAt = 0;
  _frames = 0;
  _badFrames = 0;
  _fired = false;
}
