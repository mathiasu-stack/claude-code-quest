// flatFace.js — Maya-technique face system.
//
// This is the architectural pivot: faces are no longer assembled from
// 3D primitives (sphere eyes, rectangle eyebrows, etc.). Each character's
// face is a single FLAT QUAD with a CANVAS TEXTURE painted at runtime.
//
// The technique is exactly what `drawCeoPortrait` in play.js does for
// Maya — but applied per-character with per-character drawing config
// (skin tone, eye color, eyebrow shape, mouth shape, etc.).
//
// Why flat-quad-on-canvas is correct (per the brief):
//   • 3D facial primitives at the small head scale always look "stuck on".
//   • Lighting hits each piece differently, creating weird shadows.
//   • Geometry gaps show from any non-front angle.
//   • Cartoon faces in 3D are an art form Pixar spends millions on.
//   • Maya's portrait works because it's a 2D illustration in a 3D frame.
//   • Same technique scales to every character at near-zero cost.
//
// Public API:
//   const face = attachFlatFace(group, head, config)
//   updateFlatFace(face, nowMs, camera?)   — each frame; angle-fade + blink
//   setFlatExpression(face, name)          — switch mouth/brows
//   talkPulse(face, on)                    — start/stop mouth animation
//
// Performance: canvas is redrawn ONLY on blink toggle or expression
// change — at most ~5 times/sec per character. The texture upload via
// `texture.needsUpdate = true` is cheap.

import * as THREE from 'three';

const CANVAS_SIZE = 256;          // crisp at character distances
const QUAD_WIDTH  = 0.42;         // covers ~80% of head front area
const QUAD_HEIGHT = 0.42;
const QUAD_Z      = 0.21 + 0.02;  // head sphere radius 0.21 + 2cm safety

// ──────────────────────────────────────────────────────────────────────
// CANVAS DRAWING — the entire face is painted with Canvas2D calls.
// All the visual quality lives here, not in 3D geometry.
// ──────────────────────────────────────────────────────────────────────

function rgbHex(hex, alpha = 1) {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;
  return alpha < 1 ? `rgba(${r},${g},${b},${alpha})` : `rgb(${r},${g},${b})`;
}

function drawFace(ctx, config, state) {
  const w = CANVAS_SIZE, h = CANVAS_SIZE;
  const cx = w / 2, cy = h / 2;

  // 1. Skin background — fill the entire canvas with the head's skin
  //    color (so the quad edges blend with the 3D head sphere edge).
  ctx.fillStyle = rgbHex(config.skin);
  ctx.fillRect(0, 0, w, h);

  // 2. Subtle skin gradient (lighter on top — fakes ambient sky bounce).
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(255,255,255,0.16)');
  grad.addColorStop(1, 'rgba(0,0,0,0.10)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // ── Eyes ──
  const eyeY = cy - 14;             // slightly above the canvas centre
  const eyeXL = cx - 36;
  const eyeXR = cx + 36;
  const isBlinking = state.blinking;
  const eyeShape = config.eyeShape || 'oval';
  const eyeColor = config.eyeColor || 0x6b4a2a;

  drawEye(ctx, eyeXL, eyeY, eyeShape, eyeColor, isBlinking, -1);
  drawEye(ctx, eyeXR, eyeY, eyeShape, eyeColor, isBlinking, +1);

  // ── Eyebrows ──
  drawBrow(ctx, eyeXL, eyeY - 32, config.browShape || 'soft', config.browColor ?? config.hair ?? 0x3a2010, -1);
  drawBrow(ctx, eyeXR, eyeY - 32, config.browShape || 'soft', config.browColor ?? config.hair ?? 0x3a2010, +1);

  // ── Nose (very subtle — single small dot/line) ──
  if (config.nose !== false) {
    ctx.fillStyle = rgbHex(darken(config.skin, 30), 0.5);
    ctx.beginPath();
    ctx.ellipse(cx, cy + 16, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Cheek blush (optional) ──
  if (config.blush) {
    ctx.fillStyle = 'rgba(255, 130, 160, 0.40)';
    ctx.beginPath();
    ctx.ellipse(cx - 56, cy + 24, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 56, cy + 24, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Mouth ──
  drawMouth(ctx, cx, cy + 48, config.mouthShape || 'smile', state.talkPhase);

  // ── Optional accents — beauty mark, freckles ──
  if (config.freckles) {
    ctx.fillStyle = rgbHex(darken(config.skin, 60), 0.6);
    for (let i = 0; i < 8; i++) {
      const fx = cx - 40 + (i * 10) + ((i * 7) % 13);
      const fy = cy + 8 + ((i * 5) % 9);
      ctx.beginPath();
      ctx.arc(fx, fy, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (config.beautyMark) {
    ctx.fillStyle = rgbHex(0x3a2010);
    ctx.beginPath();
    ctx.arc(cx + 24, cy + 30, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Beard / stubble — drawn ON the canvas (not 3D) ──
  if (config.beard === 'stubble') {
    // Darken the lower jaw with a pattern of small dots.
    ctx.fillStyle = rgbHex(config.browColor ?? 0x3a2010, 0.35);
    for (let i = 0; i < 90; i++) {
      const a = (i / 90) * Math.PI + Math.PI;
      const r = 60 + Math.random() * 8;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.abs(Math.sin(a)) * 40 + 30;
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (config.beard === 'full') {
    ctx.fillStyle = rgbHex(config.browColor ?? 0x3a2010);
    ctx.beginPath();
    ctx.moveTo(cx - 56, cy + 36);
    ctx.quadraticCurveTo(cx, cy + 90, cx + 56, cy + 36);
    ctx.quadraticCurveTo(cx + 40, cy + 56, cx, cy + 60);
    ctx.quadraticCurveTo(cx - 40, cy + 56, cx - 56, cy + 36);
    ctx.fill();
  }
}

function drawEye(ctx, x, y, shape, irisHex, blink, side) {
  const ew = 18;     // eye half-width
  const eh = 14;     // eye half-height
  if (blink) {
    // Closed eye — short curve / dash
    ctx.strokeStyle = '#1a1010';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - ew, y);
    ctx.quadraticCurveTo(x, y + 3, x + ew, y);
    ctx.stroke();
    return;
  }

  // White sclera
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1a1010';
  ctx.lineWidth = 1.8;
  if (shape === 'oval') {
    ctx.beginPath();
    ctx.ellipse(x, y, ew, eh, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (shape === 'round') {
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (shape === 'sleepy') {
    // Half-closed eye
    ctx.beginPath();
    ctx.ellipse(x, y, ew, eh, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Heavy upper lid
    ctx.fillStyle = '#1a1010';
    ctx.beginPath();
    ctx.moveTo(x - ew, y - eh);
    ctx.lineTo(x + ew, y - eh);
    ctx.lineTo(x + ew, y - 2);
    ctx.quadraticCurveTo(x, y + 4, x - ew, y - 2);
    ctx.closePath();
    ctx.fill();
  } else if (shape === 'sharp') {
    // Almond shape
    ctx.beginPath();
    ctx.moveTo(x - ew, y);
    ctx.quadraticCurveTo(x, y - eh, x + ew, y);
    ctx.quadraticCurveTo(x, y + eh, x - ew, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (shape === 'dot') {
    // Simple dot eye
    ctx.fillStyle = '#1a1010';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    return; // skip iris/pupil overlay
  }

  // Iris
  ctx.fillStyle = rgbHex(irisHex);
  ctx.beginPath();
  ctx.arc(x + 1, y + 2, 8, 0, Math.PI * 2);
  ctx.fill();

  // Pupil
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.arc(x + 1, y + 2, 3.4, 0, Math.PI * 2);
  ctx.fill();

  // Catchlight (white dot — life)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - 1, y - 1, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Lower lash subtle line under eye
  ctx.strokeStyle = rgbHex(darken(irisHex, 40));
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - ew + 4, y + eh - 1);
  ctx.quadraticCurveTo(x, y + eh + 1, x + ew - 4, y + eh - 1);
  ctx.stroke();
}

function drawBrow(ctx, x, y, shape, hex, side) {
  ctx.fillStyle = rgbHex(hex);
  ctx.strokeStyle = rgbHex(hex);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const w = 22, h = 5;
  if (shape === 'soft' || shape === 'arched') {
    // Filled curved shape — like the Maya reference
    ctx.beginPath();
    ctx.moveTo(x - w, y + 2);
    ctx.quadraticCurveTo(x, y - (shape === 'arched' ? 6 : 3), x + w, y + 2);
    ctx.lineTo(x + w, y + 5);
    ctx.quadraticCurveTo(x, y + 2, x - w, y + 5);
    ctx.closePath();
    ctx.fill();
  } else if (shape === 'flat') {
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x - w, y + h);
    ctx.closePath();
    ctx.fill();
  } else if (shape === 'thick') {
    ctx.beginPath();
    ctx.moveTo(x - w - 2, y);
    ctx.quadraticCurveTo(x, y - 3, x + w + 2, y);
    ctx.lineTo(x + w + 2, y + 7);
    ctx.quadraticCurveTo(x, y + 4, x - w - 2, y + 7);
    ctx.closePath();
    ctx.fill();
  } else if (shape === 'thin') {
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x - w, y + 3);
    ctx.quadraticCurveTo(x, y - 1, x + w, y + 3);
    ctx.stroke();
  } else if (shape === 'angry') {
    // V-shaped tilted brow
    ctx.beginPath();
    if (side < 0) {
      ctx.moveTo(x - w, y - 3); ctx.lineTo(x + w, y + 4);
      ctx.lineTo(x + w, y + 8); ctx.lineTo(x - w, y + 1);
    } else {
      ctx.moveTo(x - w, y + 4); ctx.lineTo(x + w, y - 3);
      ctx.lineTo(x + w, y + 1); ctx.lineTo(x - w, y + 8);
    }
    ctx.closePath();
    ctx.fill();
  }
}

function drawMouth(ctx, cx, cy, shape, talkPhase) {
  ctx.strokeStyle = '#a02050';
  ctx.fillStyle = '#c93060';
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  // talkPhase: 0 = closed, 1 = open, fractional values are interpolations.
  // We tint shape by talkPhase to fake talking.
  if (talkPhase && talkPhase > 0.5 && shape !== 'frown') {
    // Open mouth O shape
    ctx.beginPath();
    ctx.ellipse(cx, cy, 9, 6 + talkPhase * 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    return;
  }
  if (shape === 'smile') {
    ctx.beginPath();
    ctx.arc(cx, cy - 3, 14, 0.18 * Math.PI, 0.82 * Math.PI);
    ctx.stroke();
  } else if (shape === 'open-smile') {
    // Curved upper lip + visible bottom row
    ctx.beginPath();
    ctx.arc(cx, cy - 3, 14, 0.18 * Math.PI, 0.82 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = '#3a1218';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2, 11, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'smirk') {
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy + 4);
    ctx.quadraticCurveTo(cx + 2, cy - 5, cx + 12, cy - 3);
    ctx.stroke();
  } else if (shape === 'flat') {
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy);
    ctx.lineTo(cx + 10, cy);
    ctx.stroke();
  } else if (shape === 'gentle') {
    ctx.beginPath();
    ctx.arc(cx, cy - 2, 10, 0.22 * Math.PI, 0.78 * Math.PI);
    ctx.stroke();
  } else if (shape === 'frown') {
    ctx.beginPath();
    ctx.arc(cx, cy + 14, 12, 1.20 * Math.PI, 1.80 * Math.PI);
    ctx.stroke();
  } else if (shape === 'pout') {
    ctx.beginPath();
    ctx.ellipse(cx, cy, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    // default to gentle smile
    ctx.beginPath();
    ctx.arc(cx, cy - 2, 10, 0.22 * Math.PI, 0.78 * Math.PI);
    ctx.stroke();
  }
}

function darken(hex, amount) {
  const r = Math.max(0, ((hex >> 16) & 0xff) - amount);
  const g = Math.max(0, ((hex >> 8) & 0xff) - amount);
  const b = Math.max(0, (hex & 0xff) - amount);
  return (r << 16) | (g << 8) | b;
}

// ──────────────────────────────────────────────────────────────────────
// PUBLIC API
// ──────────────────────────────────────────────────────────────────────

export function attachFlatFace(group, head, config = {}) {
  // Defensive: this is the one entry point used by EVERY character
  // (player + NPCs + ambient). If group or head is missing we log loudly
  // and return null — never silently skip.
  if (!group) { console.warn('[flatFace] missing group'); return null; }
  if (!head)  { console.warn('[flatFace] missing head');  return null; }

  // 1. Tint the head sphere so it matches the canvas skin tone.
  if (head.material) {
    const m = head.material;
    if (m.color?.setHex) m.color.setHex(config.skin ?? 0xfdd9b5);
    if (m.emissive?.setHex) m.emissive.setHex(config.skin ?? 0xfdd9b5);
    if (typeof m.emissiveIntensity === 'number') m.emissiveIntensity = 0.10;
    if (typeof m.roughness === 'number') m.roughness = 0.80;
  }

  // 2. Build the canvas + texture.
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE; canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  // 3. Build the quad — flat plane on the front of the head, slightly
  //    forward of the head sphere surface to avoid z-fighting.
  const planeMat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(QUAD_WIDTH, QUAD_HEIGHT),
    planeMat,
  );
  plane.position.set(0, 0, QUAD_Z);
  head.add(plane);

  const face = {
    config,
    canvas, ctx, texture, plane, planeMat,
    state: {
      blinking: false,
      blinkUntil: 0,
      nextBlinkAt: performance.now() + 1500 + Math.random() * 4500,
      talkPhase: 0,        // 0 = closed mouth, 1 = open
      talking: false,
      talkUntil: 0,
      talkFrameAt: 0,
    },
    headRef: head,
  };

  // Initial paint
  paint(face);
  return face;
}

function paint(face) {
  face.ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  drawFace(face.ctx, face.config, face.state);
  face.texture.needsUpdate = true;
}

// Per-frame update: blink scheduling + camera-angle opacity fade.
// Pass the camera so the system can fade the face when the head's normal
// is past ±70° from camera. This avoids the "face is a flat plane" look
// from hard side angles.
const _tmpV3a = new THREE.Vector3();
const _tmpV3b = new THREE.Vector3();
const _tmpV3c = new THREE.Vector3();

export function updateFlatFace(face, nowMs, camera = null) {
  if (!face) return;
  const s = face.state;

  // Blink scheduling
  if (s.blinking) {
    if (nowMs > s.blinkUntil) {
      s.blinking = false;
      s.nextBlinkAt = nowMs + 2500 + Math.random() * 4500;
      paint(face);
    }
  } else if (nowMs > s.nextBlinkAt) {
    s.blinking = true;
    s.blinkUntil = nowMs + 120;
    paint(face);
  }

  // Talking mouth animation
  if (s.talking && nowMs > s.talkUntil) {
    s.talking = false;
    s.talkPhase = 0;
    paint(face);
  } else if (s.talking && nowMs > s.talkFrameAt) {
    s.talkPhase = s.talkPhase > 0.5 ? 0 : 1;
    s.talkFrameAt = nowMs + 110 + Math.random() * 60;
    paint(face);
  }

  // Camera-angle opacity fade — head's local +Z (the direction the face
  // faces) projected to world space, compared to the head→camera vector.
  // cosAngle = 1 ⇒ face squarely at camera; ≤ cos(70°) ≈ 0.34 ⇒ fade out.
  if (camera && face.plane && face.headRef) {
    face.headRef.updateWorldMatrix(true, false);
    const headForward = _tmpV3a.set(0, 0, 1).transformDirection(face.headRef.matrixWorld);
    const headPos = _tmpV3b.setFromMatrixPosition(face.headRef.matrixWorld);
    const toCam = _tmpV3c.subVectors(camera.position, headPos).normalize();
    const cosAngle = headForward.dot(toCam);
    let opacity;
    if (cosAngle >= 0.34) opacity = 1.0;
    else if (cosAngle <= 0.0) opacity = 0.0;
    else opacity = cosAngle / 0.34;
    face.planeMat.opacity = opacity;
    face.plane.visible = opacity > 0.02;
  }
}

export function setFlatExpression(face, name) {
  if (!face) return;
  const map = {
    happy:    { mouthShape: 'smile' },
    cheer:    { mouthShape: 'open-smile' },
    focused:  { mouthShape: 'flat', browShape: 'flat' },
    sad:      { mouthShape: 'frown' },
    smirk:    { mouthShape: 'smirk' },
    neutral:  { mouthShape: 'gentle' },
  };
  const patch = map[name] || map.neutral;
  face.config = { ...face.config, ...patch };
  paint(face);
}

// Start / stop a talking animation (mouth opens and closes every ~120ms).
export function talkPulse(face, on, durationMs = 4000) {
  if (!face) return;
  const s = face.state;
  if (on) {
    s.talking = true;
    s.talkUntil = performance.now() + durationMs;
    s.talkFrameAt = 0;
  } else {
    s.talking = false;
    s.talkPhase = 0;
    paint(face);
  }
}

// Manual repaint — for ceremony / one-off effects.
export function repaintFlatFace(face) { paint(face); }
