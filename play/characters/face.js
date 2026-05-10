// face.js — procedural cartoon face on a canvas-textured plane,
// parented to the head front. Cheap, swappable, and reads well in
// every lighting condition.
//
// Usage from makeCharacter():
//   import { attachFace } from './characters/face.js';
//   const face = attachFace(g, head, look);
//   g.userData.face = face;   // for blink + look-at-player updates
//
// Each face exposes:
//   .group         — the THREE.Group containing pupils + plane
//   .leftPupil, .rightPupil — small spheres we slide for "look at player"
//   .planeMaterial — reference to the eye-and-mouth material so we can
//                    swap to a "blink" texture briefly
//   .blinkSchedule(now) — call every frame; flips eye texture on schedule
//   .lookAt(localXOffset) — slides pupils toward a [-1, 1] X target
//
// Expression is encoded in the canvas at attach time; switching expression
// requires rebuilding the texture (cheap, but called only once per spawn).

import * as THREE from 'three';
import { getExpression } from './expressions.js';

// Cache textures so identical (face, expression) configs don't reallocate.
const _texCache = new Map();

function makeFaceCanvas({ faceStyle, expression, blink }) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);

  // Eye geometry
  const eyeY = 100;
  const eyeXL = 86;
  const eyeXR = 170;

  if (blink) {
    // Closed eyelids: two slim arcs.
    ctx.strokeStyle = '#1a1010';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(eyeXL, eyeY, 14, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(eyeXR, eyeY, 14, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else {
    drawEyes(ctx, faceStyle, eyeXL, eyeY);
    drawEyes(ctx, faceStyle, eyeXR, eyeY);
  }

  // Brows — drawn over eyes
  drawBrow(ctx, expression.brow, eyeXL, eyeY - 30, false);
  drawBrow(ctx, expression.brow, eyeXR, eyeY - 30, true);

  // Mouth
  drawMouth(ctx, expression.mouth, c.width / 2, 175);

  // Blush
  if (expression.blush) {
    ctx.fillStyle = 'rgba(255,150,170,0.6)';
    ctx.beginPath();
    ctx.ellipse(50, 165, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(206, 165, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  return c;
}

function drawEyes(ctx, style, cx, cy) {
  // White
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#1a1010';
  ctx.lineWidth = 3;

  if (style === 'round') {
    ctx.beginPath();
    ctx.ellipse(cx, cy, 14, 14, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a1010';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 1, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cx - 2, cy - 2, 2, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === 'dot') {
    ctx.fillStyle = '#1a1010';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === 'sleepy') {
    // Half eyes — top half white, bottom hidden under upper lash
    ctx.beginPath();
    ctx.ellipse(cx, cy, 14, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // upper lash
    ctx.fillStyle = '#1a1010';
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy - 1);
    ctx.lineTo(cx + 14, cy - 1);
    ctx.lineTo(cx + 14, cy + 6);
    ctx.lineTo(cx - 14, cy + 6);
    ctx.closePath();
    ctx.fill();
    // pupil dot under lash
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, 4, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === 'sharp') {
    // Almond
    ctx.beginPath();
    ctx.ellipse(cx, cy, 16, 9, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a1010';
    ctx.beginPath();
    ctx.ellipse(cx + 1, cy, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  } else { // default round
    drawEyes(ctx, 'round', cx, cy);
  }
}

function drawBrow(ctx, kind, cx, cy, mirror) {
  ctx.strokeStyle = '#1a1010';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  const w = 18;
  if (kind === 'flat') {
    ctx.beginPath();
    ctx.moveTo(cx - w, cy);
    ctx.lineTo(cx + w, cy);
    ctx.stroke();
  } else if (kind === 'arched') {
    ctx.beginPath();
    ctx.moveTo(cx - w, cy + 4);
    ctx.quadraticCurveTo(cx, cy - 6, cx + w, cy + 4);
    ctx.stroke();
  } else if (kind === 'droop') {
    ctx.beginPath();
    if (mirror) {
      ctx.moveTo(cx - w, cy + 6);
      ctx.lineTo(cx + w, cy);
    } else {
      ctx.moveTo(cx - w, cy);
      ctx.lineTo(cx + w, cy + 6);
    }
    ctx.stroke();
  } else if (kind === 'one-up') {
    ctx.beginPath();
    if (!mirror) {
      ctx.moveTo(cx - w, cy);
      ctx.lineTo(cx + w, cy - 6);
    } else {
      ctx.moveTo(cx - w, cy);
      ctx.lineTo(cx + w, cy);
    }
    ctx.stroke();
  } else if (kind === 'soft') {
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - w + 2, cy + 2);
    ctx.quadraticCurveTo(cx, cy - 2, cx + w - 2, cy + 2);
    ctx.stroke();
  } else if (kind === 'angry') {
    ctx.beginPath();
    if (!mirror) {
      ctx.moveTo(cx - w, cy - 4);
      ctx.lineTo(cx + w, cy + 4);
    } else {
      ctx.moveTo(cx - w, cy + 4);
      ctx.lineTo(cx + w, cy - 4);
    }
    ctx.stroke();
  }
}

function drawMouth(ctx, kind, cx, cy) {
  ctx.strokeStyle = '#1a1010';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  if (kind === 'thin') {
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy);
    ctx.lineTo(cx + 18, cy);
    ctx.stroke();
  } else if (kind === 'smile') {
    ctx.beginPath();
    ctx.arc(cx, cy - 6, 18, 0.18 * Math.PI, 0.82 * Math.PI);
    ctx.stroke();
  } else if (kind === 'flat') {
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy);
    ctx.lineTo(cx + 14, cy);
    ctx.stroke();
  } else if (kind === 'smirk') {
    ctx.beginPath();
    ctx.moveTo(cx - 16, cy + 4);
    ctx.quadraticCurveTo(cx, cy - 4, cx + 16, cy - 4);
    ctx.stroke();
  } else if (kind === 'soft') {
    ctx.beginPath();
    ctx.arc(cx, cy - 3, 14, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  } else { // fallback
    drawMouth(ctx, 'thin', cx, cy);
  }
}

function getCachedTexture(faceStyle, expression, blink) {
  const key = `${faceStyle}|${expression.brow}|${expression.mouth}|${expression.blush}|${blink ? '1' : '0'}`;
  if (_texCache.has(key)) return _texCache.get(key);
  const c = makeFaceCanvas({ faceStyle, expression, blink });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  _texCache.set(key, tex);
  return tex;
}

// Attach a face to a character group. `head` is the head mesh in the
// group (so we can parent the face plane to it). `look` may include
// `face` (style) and `expression`.
export function attachFace(group, head, look = {}) {
  const faceStyle = look.face || 'round';
  const expression = getExpression(look.expression);

  const openTex = getCachedTexture(faceStyle, expression, false);
  const blinkTex = getCachedTexture(faceStyle, expression, true);

  // DoubleSide so the face is visible from any viewing angle. The face
  // plane sits 0.225 from head center (head sphere radius 0.21), so it's
  // safely outside the sphere — no z-fighting. Without DoubleSide, third
  // person views from behind showed the back of the plane (invisible).
  const planeMat = new THREE.MeshBasicMaterial({
    map: openTex,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), planeMat);
  plane.position.set(0, 0, 0.225);
  head.add(plane);

  const face = {
    plane,
    planeMaterial: planeMat,
    openTex, blinkTex,
    nextBlinkAt: performance.now() + 2000 + Math.random() * 4000,
    blinkUntil: 0,
    look,
    expression,
    faceStyle,
  };

  return face;
}

export function updateFace(face, nowMs) {
  if (!face) return;
  // Blink scheduling
  if (face.blinkUntil > 0) {
    if (nowMs > face.blinkUntil) {
      face.blinkUntil = 0;
      face.planeMaterial.map = face.openTex;
      face.planeMaterial.needsUpdate = true;
      face.nextBlinkAt = nowMs + 2500 + Math.random() * 4500;
    }
  } else if (nowMs > face.nextBlinkAt) {
    face.blinkUntil = nowMs + 100; // 100 ms blink
    face.planeMaterial.map = face.blinkTex;
    face.planeMaterial.needsUpdate = true;
  }
}

// Switch the expression on a face. Rebuilds the textures (cached).
export function setExpression(face, name) {
  if (!face) return;
  const expr = getExpression(name);
  if (expr === face.expression) return;
  face.expression = expr;
  face.openTex = getCachedTexture(face.faceStyle, expr, false);
  face.blinkTex = getCachedTexture(face.faceStyle, expr, true);
  if (face.blinkUntil === 0) {
    face.planeMaterial.map = face.openTex;
    face.planeMaterial.needsUpdate = true;
  }
}
