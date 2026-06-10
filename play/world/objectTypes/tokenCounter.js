// tokenCounter.js — Kedash Protocol PROP-11. Wall counter:
// "TOKENS SINCE LAST HUMAN CONVERSATION" over a 7-segment readout that
// climbs continuously — a few hundred per second, with jitter so it
// reads as live token flow.
//
// Count state is module-level so resetTokenCounter() works without an
// instance handle (play.js's openDialogue hook calls it on Floor 3).
// Returns { group, update(dt) }; group is unpositioned, faces local +Z.

import * as THREE from 'three';

const NAVY = '#0b1020';
const GOLD = '#c9a44c';
const DIGITS = 9;

let _count = 0;

export function resetTokenCounter() {
  _count = 0;
}

// 7-segment layout: a top, b/c right, d bottom, e/f left, g middle.
const SEG_MAP = {
  '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc',
  '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg',
};

function drawDigit(x, ox, oy, ch) {
  const w = 30, h = 56, t = 6;
  const SEGS = {
    a: [t * 0.5, 0, w - t, t],
    b: [w - t, t * 0.5, t, h / 2 - t],
    c: [w - t, h / 2 + t * 0.5, t, h / 2 - t],
    d: [t * 0.5, h - t, w - t, t],
    e: [0, h / 2 + t * 0.5, t, h / 2 - t],
    f: [0, t * 0.5, t, h / 2 - t],
    g: [t * 0.5, h / 2 - t / 2, w - t, t],
  };
  const lit = SEG_MAP[ch] || '';
  for (const [name, [sx, sy, sw, sh]] of Object.entries(SEGS)) {
    x.fillStyle = lit.includes(name) ? '#e8c873' : 'rgba(201,164,76,0.07)';
    x.fillRect(ox + sx, oy + sy, sw, sh);
  }
}

function paintCounter(x) {
  x.fillStyle = NAVY;
  x.fillRect(0, 0, 512, 176);
  x.strokeStyle = 'rgba(201,164,76,0.35)';
  x.strokeRect(3, 3, 506, 170);

  x.fillStyle = GOLD;
  x.font = '700 17px monospace';
  x.textAlign = 'center';
  x.fillText('TOKENS SINCE LAST HUMAN CONVERSATION', 256, 34);
  x.textAlign = 'left';

  x.fillStyle = '#060910';
  x.fillRect(48, 56, 416, 92);

  const str = String(Math.floor(_count)).padStart(DIGITS, '0').slice(-DIGITS);
  const cell = 44, x0 = 256 - (DIGITS * cell) / 2 + 7;
  for (let i = 0; i < DIGITS; i++) {
    drawDigit(x, x0 + i * cell, 74, str[i]);
  }
}

export function buildTokenCounter({ y = 1.8 } = {}) {
  const group = new THREE.Group();

  const housing = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.62, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x1c2330, metalness: 0.5, roughness: 0.45 }),
  );
  housing.position.set(0, y, 0);
  housing.castShadow = true;
  group.add(housing);

  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 176;
  const ctx = canvas.getContext('2d');
  paintCounter(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(1.56, 0.535),
    new THREE.MeshBasicMaterial({ map: tex }),
  );
  face.position.set(0, y, 0.034);
  group.add(face);

  let _t = 0;
  let redrawTimer = 0;

  return {
    group,
    update(dt) {
      _t += dt;
      // ~200–600 tokens/s with a slow swell + per-frame jitter.
      _count += dt * (340 + Math.sin(_t * 0.9) * 140 + Math.random() * 160);
      redrawTimer += dt;
      if (redrawTimer >= 0.25) {
        redrawTimer = 0;
        paintCounter(ctx);
        tex.needsUpdate = true;
      }
    },
  };
}
