// cartoonFace.js — 3D primitive cartoon face system.
//
// Built to match the Maya Kedash portrait visual reference: large round
// eyes with bright iris, soft eyebrows, cheek blush, simple mouth.
//
// Why not just a textured plane: PlaneGeometry is single-sided and
// 5mm-thin, and from third-person view behind the player the back of
// the plane is invisible. 3D eye/mouth/eyebrow primitives ride along
// when the head turns AND read from any camera angle. The previous
// "black blob head" bug (4 runs running) is fixed structurally.
//
// Public API:
//   const face = attachCartoonFace(group, head, look)
//   updateCartoonFace(face, nowMs, playerWorldPos?)  — each frame
//   setCartoonExpression(face, name)                 — for ceremonies
//
// `look` schema (see playerLook.js / npcLooks.js for examples):
//   {
//     skin:       0xfdd9b5,
//     hair:       0x3a2010,
//     hairStyle:  'short' | 'long' | 'bun' | 'spiky' | 'bob' |
//                 'side-part' | 'ponytail' | 'buzz' | 'hijab' | 'bald',
//     eyeColor:   0x6b4a2a,                  // brown / hazel / blue / green / grey
//     mouthShape: 'smile' | 'smirk' | 'flat' | 'open-smile' | 'gentle',
//     browShape:  'soft' | 'arched' | 'flat' | 'thick' | 'thin',
//     blush:      true | false,
//     glasses:    true | false,
//     beard:      false | 'stubble' | 'full',
//   }

import * as THREE from 'three';

// ── Shared materials (cached) ───────────────────────────────────────────────
const _matCache = new Map();
function mat(key, build) {
  if (!_matCache.has(key)) _matCache.set(key, build());
  return _matCache.get(key);
}

const eyeWhiteMat = () => mat('eyeWhite', () => new THREE.MeshStandardMaterial({
  color: 0xffffff, roughness: 0.45, metalness: 0,
  emissive: 0xffffff, emissiveIntensity: 0.05, // keep eyes from going pure black in shadow
}));
const pupilMat = () => mat('pupil', () => new THREE.MeshStandardMaterial({
  color: 0x0d0d0d, roughness: 0.3,
}));
const catchlightMat = () => mat('catchlight', () => new THREE.MeshBasicMaterial({
  color: 0xffffff,
}));
const browSoftMat = (color) => mat(`brow-${color}`, () => new THREE.MeshStandardMaterial({
  color, roughness: 0.6, metalness: 0,
}));
const blushMat = () => mat('blush', () => new THREE.MeshBasicMaterial({
  color: 0xff8aa6, transparent: true, opacity: 0.55,
  depthWrite: false, side: THREE.DoubleSide,
}));
const lipMat = (color) => new THREE.MeshStandardMaterial({
  color, roughness: 0.45, metalness: 0,
  emissive: color, emissiveIntensity: 0.06,
});
const hairMat = (color) => new THREE.MeshStandardMaterial({
  color, roughness: 0.7, metalness: 0,
});
const glassFrameMat = () => mat('glassFrame', () => new THREE.MeshStandardMaterial({
  color: 0x2a2a30, metalness: 0.6, roughness: 0.3,
}));

// Iris materials are per-character, not cached (cheap allocations).
function irisMat(color) {
  return new THREE.MeshStandardMaterial({
    color, roughness: 0.4, metalness: 0,
    emissive: color, emissiveIntensity: 0.10, // keeps iris visible in shadow
  });
}

// ── Hair builders ───────────────────────────────────────────────────────────
function buildHair(style, color) {
  const g = new THREE.Group();
  const m = hairMat(color);

  switch (style) {
    case 'short': {
      // Cap-shaped half sphere on top of the head.
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.225, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2),
        m,
      );
      cap.position.y = 0;
      g.add(cap);
      break;
    }
    case 'side-part': {
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.225, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2),
        m,
      );
      g.add(cap);
      // Sweep across the forehead — small box angled
      const sweep = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.05, 0.16),
        m,
      );
      sweep.position.set(-0.04, -0.08, 0.18);
      sweep.rotation.z = -0.25;
      g.add(sweep);
      break;
    }
    case 'spiky': {
      // Cap + a few cones angled outward.
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        m,
      );
      g.add(cap);
      const positions = [
        [0, 0.06, 0.16, 0],
        [-0.10, 0.05, 0.13, -0.5],
        [0.10, 0.05, 0.13, 0.5],
        [0, 0.10, 0.05, 0],
        [-0.13, 0.04, 0.06, -0.7],
        [0.13, 0.04, 0.06, 0.7],
      ];
      for (const [x, y, z, rotZ] of positions) {
        const spike = new THREE.Mesh(
          new THREE.ConeGeometry(0.04, 0.18, 6),
          m,
        );
        spike.position.set(x, y, z);
        spike.rotation.z = rotZ;
        g.add(spike);
      }
      break;
    }
    case 'long': {
      // Head cap + long back panel down to the shoulders.
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.235, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62),
        m,
      );
      g.add(cap);
      // Back panel — flowing curve
      const back = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.55, 0.10),
        m,
      );
      back.position.set(0, -0.32, -0.12);
      g.add(back);
      // Side strands
      for (const sx of [-0.18, 0.18]) {
        const strand = new THREE.Mesh(
          new THREE.BoxGeometry(0.10, 0.36, 0.10),
          m,
        );
        strand.position.set(sx, -0.16, 0.04);
        g.add(strand);
      }
      break;
    }
    case 'bob': {
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.235, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62),
        m,
      );
      g.add(cap);
      // Side panels that frame the face down to the chin
      for (const sx of [-0.18, 0.18]) {
        const side = new THREE.Mesh(
          new THREE.BoxGeometry(0.10, 0.20, 0.18),
          m,
        );
        side.position.set(sx, -0.10, 0.04);
        g.add(side);
      }
      // Bangs across the forehead
      const bangs = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.05, 0.18),
        m,
      );
      bangs.position.set(0, -0.05, 0.18);
      g.add(bangs);
      break;
    }
    case 'bob-bangs': {
      // Same as bob but with thicker straight bangs across the forehead.
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.235, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.6),
        m,
      );
      g.add(cap);
      for (const sx of [-0.18, 0.18]) {
        const side = new THREE.Mesh(
          new THREE.BoxGeometry(0.10, 0.18, 0.18),
          m,
        );
        side.position.set(sx, -0.08, 0.04);
        g.add(side);
      }
      const bangs = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, 0.10, 0.18),
        m,
      );
      bangs.position.set(0, -0.02, 0.20);
      g.add(bangs);
      break;
    }
    case 'bun': {
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.225, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2),
        m,
      );
      g.add(cap);
      const bun = new THREE.Mesh(
        new THREE.SphereGeometry(0.10, 12, 10),
        m,
      );
      bun.position.set(0, 0.16, -0.06);
      g.add(bun);
      break;
    }
    case 'ponytail': {
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.225, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2),
        m,
      );
      g.add(cap);
      // Long ponytail behind the head
      const tail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.06, 0.34, 8),
        m,
      );
      tail.position.set(0, -0.06, -0.20);
      tail.rotation.x = 0.2;
      g.add(tail);
      // Hair tie
      const tie = new THREE.Mesh(
        new THREE.TorusGeometry(0.05, 0.012, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0xa8a8a8, metalness: 0.4 }),
      );
      tie.position.set(0, 0.05, -0.18);
      tie.rotation.x = Math.PI / 2;
      g.add(tie);
      break;
    }
    case 'buzz': {
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.215, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2),
        m,
      );
      cap.scale.y = 0.6;
      g.add(cap);
      break;
    }
    case 'hijab': {
      // Soft fabric drape covering head + neck area
      const drape = new THREE.Mesh(
        new THREE.SphereGeometry(0.265, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.7),
        new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0 }),
      );
      drape.position.y = 0.02;
      g.add(drape);
      // Lower neck panel
      const neck = new THREE.Mesh(
        new THREE.BoxGeometry(0.30, 0.18, 0.20),
        new THREE.MeshStandardMaterial({ color, roughness: 0.85 }),
      );
      neck.position.set(0, -0.20, 0);
      g.add(neck);
      break;
    }
    case 'bald':
    default:
      // No hair geometry; head shows through.
      break;
  }
  return g;
}

// ── Beard / stubble ─────────────────────────────────────────────────────────
function buildBeard(kind, color) {
  if (!kind) return null;
  if (kind === 'stubble') {
    // Thin shadow on lower jaw — small flat plane with low alpha
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 12, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.4),
      new THREE.MeshStandardMaterial({
        color, transparent: true, opacity: 0.4, roughness: 0.95,
      }),
    );
    m.position.y = -0.02;
    return m;
  }
  if (kind === 'full') {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.155, 16, 12, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5),
      hairMat(color),
    );
    m.position.set(0, -0.04, 0.02);
    return m;
  }
  return null;
}

// ── Eye assembly ────────────────────────────────────────────────────────────
function buildEye(eyeColor, side /* -1 left, +1 right */) {
  const g = new THREE.Group();
  // Eye white — slightly squashed sphere, biased forward.
  const white = new THREE.Mesh(
    new THREE.SphereGeometry(0.040, 14, 10),
    eyeWhiteMat(),
  );
  white.scale.set(1.0, 0.85, 0.6);
  g.add(white);

  // Iris — small 3D sphere (not a flat disc) so it's visible from
  // any angle, including slightly off-axis camera positions.
  const iris = new THREE.Mesh(
    new THREE.SphereGeometry(0.022, 12, 8),
    irisMat(eyeColor),
  );
  iris.position.z = 0.014;
  g.add(iris);

  // Pupil — smaller dark sphere on the front of the iris.
  const pupil = new THREE.Mesh(
    new THREE.SphereGeometry(0.011, 10, 8),
    pupilMat(),
  );
  pupil.position.z = 0.025;
  g.add(pupil);

  // Catchlight — tiny bright dot offset upward-and-toward-nose.
  const catchlight = new THREE.Mesh(
    new THREE.SphereGeometry(0.005, 8, 6),
    catchlightMat(),
  );
  catchlight.position.set(side * 0.006, 0.010, 0.030);
  g.add(catchlight);

  return { group: g, white, iris, pupil, catchlight };
}

// ── Eyebrow ─────────────────────────────────────────────────────────────────
function buildEyebrow(shape, color, side /* -1 / +1 */) {
  const m = browSoftMat(color);
  // Use a small box rotated slightly. Shape controls thickness + tilt.
  let w = 0.075, h = 0.014, d = 0.025;
  let tilt = 0;
  switch (shape) {
    case 'arched':  h = 0.012; tilt = side * 0.18; break;
    case 'flat':    h = 0.014; tilt = 0; break;
    case 'thick':   h = 0.022; w = 0.080; tilt = side * 0.08; break;
    case 'thin':    h = 0.008; w = 0.070; tilt = side * 0.10; break;
    case 'soft':
    default:        h = 0.014; tilt = side * 0.10; break;
  }
  const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  box.rotation.z = tilt;
  return box;
}

// ── Mouth ───────────────────────────────────────────────────────────────────
function buildMouth(shape) {
  const g = new THREE.Group();
  const lip = lipMat(0xc44a6e);
  if (shape === 'open-smile') {
    // Open mouth — small dark hollow with bottom lip
    const dark = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x4a1818, roughness: 0.5 }),
    );
    dark.scale.set(1.4, 0.6, 0.6);
    dark.rotation.x = Math.PI;
    dark.position.y = -0.005;
    g.add(dark);
    // Bottom lip arc
    const lipArc = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 12, Math.PI), lip);
    lipArc.rotation.x = Math.PI;
    lipArc.position.y = -0.022;
    g.add(lipArc);
  } else if (shape === 'smirk') {
    // Asymmetric arc — half torus, slightly off-centre
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.044, 0.008, 6, 14, Math.PI), lip);
    arc.position.x = 0.012;
    arc.position.y = -0.005;
    arc.rotation.z = -0.18;
    g.add(arc);
  } else if (shape === 'flat') {
    const flat = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.008, 0.012),
      lip,
    );
    flat.position.y = -0.005;
    g.add(flat);
  } else if (shape === 'gentle') {
    // Very subtle smile — short curve
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.007, 6, 12, Math.PI), lip);
    arc.position.y = -0.005;
    g.add(arc);
  } else {
    // 'smile' default — moderate curve
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.044, 0.008, 6, 14, Math.PI), lip);
    arc.position.y = -0.005;
    g.add(arc);
  }
  return g;
}

// ── Glasses ────────────────────────────────────────────────────────────────
function buildGlasses() {
  const g = new THREE.Group();
  const fr = glassFrameMat();
  for (const x of [-0.055, 0.055]) {
    const lens = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.006, 8, 18), fr);
    lens.position.set(x, 0.005, 0.04);
    g.add(lens);
  }
  const bridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.030, 0.006, 0.006), fr,
  );
  bridge.position.set(0, 0.005, 0.04);
  g.add(bridge);
  return g;
}

// ── Skin shading texture (subtle warmth) ───────────────────────────────────
// Returns a CanvasTexture used to subtly warm the head sphere material.
const _skinTexCache = new Map();
function skinShadingTexture(skinColor) {
  if (_skinTexCache.has(skinColor)) return _skinTexCache.get(skinColor);
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  // Vertical gradient: lighter on top, darker near the chin
  const grad = ctx.createLinearGradient(0, 0, 0, c.height);
  const r = (skinColor >> 16) & 0xff;
  const g = (skinColor >> 8) & 0xff;
  const b = skinColor & 0xff;
  // 8% lighter at top, 8% darker at bottom
  const lighten = (v) => Math.min(255, Math.round(v + 20));
  const darken = (v) => Math.max(0, Math.round(v - 18));
  grad.addColorStop(0, `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`);
  grad.addColorStop(1, `rgb(${darken(r)}, ${darken(g)}, ${darken(b)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, c.width, c.height);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  _skinTexCache.set(skinColor, tex);
  return tex;
}

// Replace the head's plain skin material with a subtly-shaded texture
// while keeping the original color as a tint. Keeps the ovaloid shape.
function reshadeHead(head, skinColor) {
  const m = new THREE.MeshStandardMaterial({
    color: skinColor,
    map: skinShadingTexture(skinColor),
    roughness: 0.7,
    metalness: 0,
    emissive: skinColor,
    emissiveIntensity: 0.05,
  });
  head.material?.dispose?.();
  head.material = m;
  // Slightly squash to ovaloid (not perfect sphere)
  head.scale.set(1.0, 1.05, 0.95);
}

// ── Public API ─────────────────────────────────────────────────────────────
export function attachCartoonFace(group, head, look = {}) {
  // Defensive guards — the brief is explicit that this system MUST be
  // applied universally. Failing silently here is how we lost faces in
  // previous runs. If anything's wrong, log it loudly.
  if (!group) { console.warn('[cartoonFace] missing group'); return null; }
  if (!head)  { console.warn('[cartoonFace] missing head'); return null; }
  const eyeColor = look.eyeColor ?? 0x6b4a2a;          // brown default
  const browColor = look.hair ?? 0x3a2010;
  const browShape = look.browShape ?? 'soft';
  const mouthShape = look.mouthShape ?? 'smile';
  const blush = look.blush !== false;                  // default on for warmth

  // Rebuild the head material with subtle gradient + slight squash.
  reshadeHead(head, look.skin ?? 0xfdd9b5);

  // Eyes — parented to the head so they ride along on head turns.
  // Z position pushed forward to 0.230 so the eyes protrude clearly past
  // the head sphere surface (radius 0.21) — otherwise they'd be hidden
  // INSIDE the head, which was the silent root cause of "no face".
  const leftEye = buildEye(eyeColor, -1);
  const rightEye = buildEye(eyeColor, +1);
  leftEye.group.position.set(-0.075, 0.015, 0.180);
  rightEye.group.position.set( 0.075, 0.015, 0.180);
  head.add(leftEye.group);
  head.add(rightEye.group);

  // Eyebrows — above the eyes, pushed forward to clear the head sphere.
  const leftBrow = buildEyebrow(browShape, browColor, -1);
  const rightBrow = buildEyebrow(browShape, browColor, +1);
  leftBrow.position.set(-0.075, 0.085, 0.205);
  rightBrow.position.set( 0.075, 0.085, 0.205);
  head.add(leftBrow);
  head.add(rightBrow);

  // Mouth — small mesh, pushed forward.
  const mouth = buildMouth(mouthShape);
  mouth.position.set(0, -0.075, 0.215);
  head.add(mouth);

  // Cheek blush — small soft circles on the cheeks.
  let leftBlush = null, rightBlush = null;
  if (blush) {
    const bm = blushMat();
    leftBlush = new THREE.Mesh(new THREE.CircleGeometry(0.030, 16), bm);
    rightBlush = new THREE.Mesh(new THREE.CircleGeometry(0.030, 16), bm);
    leftBlush.position.set(-0.118, -0.020, 0.198);
    rightBlush.position.set( 0.118, -0.020, 0.198);
    head.add(leftBlush);
    head.add(rightBlush);
  }

  // Glasses — frames sit just in front of the eyes.
  let glasses = null;
  if (look.glasses) {
    glasses = buildGlasses();
    glasses.position.set(0, 0.015, 0.205);
    head.add(glasses);
  }

  // Beard.
  const beard = buildBeard(look.beard, browColor);
  if (beard) head.add(beard);

  // Hair (parented to head so it rides head turns).
  // Hair is its own mesh, NOT part of the existing makeCharacter hair.
  // The legacy hair mesh in makeCharacter is hidden by passing hairStyle
  // = undefined to it — see playerLook.js / npcLooks.js.
  const hair = buildHair(look.hairStyle ?? 'short', look.hair ?? 0x3a2010);
  hair.position.y = 0;
  head.add(hair);

  return {
    leftEye, rightEye,
    leftBrow, rightBrow,
    mouth,
    leftBlush, rightBlush,
    glasses,
    beard,
    hair,
    look,
    nextBlinkAt: performance.now() + 1500 + Math.random() * 4000,
    blinkUntil: 0,
    pupilOffsetTarget: { x: 0, y: 0 },
    pupilOffset: { x: 0, y: 0 },
  };
}

// ── Per-frame face animation ───────────────────────────────────────────────
const _tmpVec = new THREE.Vector3();
const _headWorldPos = new THREE.Vector3();
const _toPlayer = new THREE.Vector3();

export function updateCartoonFace(face, nowMs, playerWorldPos = null, headWorld = null) {
  if (!face) return;

  // Blink — squash both eye whites along Y for 100ms.
  if (face.blinkUntil > 0) {
    if (nowMs > face.blinkUntil) {
      face.blinkUntil = 0;
      face.leftEye.white.scale.set(1.0, 0.85, 0.55);
      face.rightEye.white.scale.set(1.0, 0.85, 0.55);
      face.nextBlinkAt = nowMs + 2500 + Math.random() * 4000;
    }
  } else if (nowMs > face.nextBlinkAt) {
    face.blinkUntil = nowMs + 100;
    face.leftEye.white.scale.set(1.0, 0.10, 0.55);
    face.rightEye.white.scale.set(1.0, 0.10, 0.55);
  }

  // Pupil look-at-player — only if playerWorldPos is given AND head world
  // pos is reachable. Slides pupils a few millimetres toward the player's
  // direction in head-local XY space.
  if (playerWorldPos && headWorld) {
    _toPlayer.copy(playerWorldPos).sub(headWorld);
    // Project into head local frame: simply use XY component of the world
    // direction — works well enough for cartoon eyes.
    const dx = _toPlayer.x;
    const dy = _toPlayer.y - 0.0;
    const len = Math.hypot(dx, dy) || 1;
    face.pupilOffsetTarget.x = (dx / len) * 0.006;
    face.pupilOffsetTarget.y = Math.max(-0.004, Math.min(0.006, (dy / len) * 0.004));
  } else {
    face.pupilOffsetTarget.x = 0;
    face.pupilOffsetTarget.y = 0;
  }
  // Smooth toward target
  face.pupilOffset.x += (face.pupilOffsetTarget.x - face.pupilOffset.x) * 0.08;
  face.pupilOffset.y += (face.pupilOffsetTarget.y - face.pupilOffset.y) * 0.08;
  face.leftEye.pupil.position.x = face.pupilOffset.x;
  face.leftEye.pupil.position.y = face.pupilOffset.y;
  face.rightEye.pupil.position.x = face.pupilOffset.x;
  face.rightEye.pupil.position.y = face.pupilOffset.y;
  face.leftEye.iris.position.x = face.pupilOffset.x * 0.5;
  face.leftEye.iris.position.y = face.pupilOffset.y * 0.5;
  face.rightEye.iris.position.x = face.pupilOffset.x * 0.5;
  face.rightEye.iris.position.y = face.pupilOffset.y * 0.5;
}

// ── Expression switching for ceremonies ───────────────────────────────────
export function setCartoonExpression(face, name) {
  if (!face) return;
  // Replace the mouth mesh with a new one matching the requested shape.
  if (face.mouth?.parent) {
    const head = face.mouth.parent;
    head.remove(face.mouth);
    face.mouth.traverse((c) => {
      c.geometry?.dispose?.();
      c.material?.dispose?.();
    });
    const mouthShape = name === 'happy' ? 'smile'
                    : name === 'cheer'  ? 'open-smile'
                    : name === 'focused' ? 'flat'
                    : 'gentle';
    face.mouth = buildMouth(mouthShape);
    face.mouth.position.set(0, -0.085, 0.180);
    head.add(face.mouth);
  }

  // Eyebrow tilt — quick "raise" for greeting / cheer
  if (face.leftBrow && face.rightBrow) {
    const lift = name === 'cheer' ? 0.015 : (name === 'focused' ? -0.005 : 0);
    face.leftBrow.position.y = 0.075 + lift;
    face.rightBrow.position.y = 0.075 + lift;
  }
}
