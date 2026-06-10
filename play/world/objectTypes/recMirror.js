// recMirror.js — Kedash Protocol PROP-13. A framed "mirror" that doesn't
// reflect: dark gradient glass with a faint specular streak (canvas
// texture only — no env-map, no real reflection) and a blinking red
// "● REC" tag in the corner. A mirror that records instead of reflecting.
//
// Returns { group, update(dt) }; group is unpositioned, glass faces
// local +Z. Caller places/rotates against a wall.

import * as THREE from 'three';

function glassTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const x = c.getContext('2d');

  const grad = x.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#1c2438');
  grad.addColorStop(0.55, '#0e1424');
  grad.addColorStop(1, '#070a12');
  x.fillStyle = grad;
  x.fillRect(0, 0, 128, 256);

  // Diagonal specular streak — the only hint of "glass".
  x.save();
  x.translate(64, 128);
  x.rotate(-0.5);
  const streak = x.createLinearGradient(-40, 0, 40, 0);
  streak.addColorStop(0, 'rgba(255,255,255,0)');
  streak.addColorStop(0.5, 'rgba(220,230,255,0.09)');
  streak.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = streak;
  x.fillRect(-50, -200, 100, 400);
  x.restore();

  // Faint edge vignette
  x.strokeStyle = 'rgba(0,0,0,0.5)';
  x.lineWidth = 6;
  x.strokeRect(0, 0, 128, 256);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function recTexture() {
  const c = document.createElement('canvas');
  c.width = 96; c.height = 40;
  const x = c.getContext('2d');
  x.clearRect(0, 0, 96, 40);
  x.fillStyle = '#ff5252';
  x.beginPath(); x.arc(16, 20, 8, 0, 7); x.fill();
  x.font = '700 20px monospace';
  x.textBaseline = 'middle';
  x.fillText('REC', 32, 22);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildRecMirror({ y = 1.55 } = {}) {
  const group = new THREE.Group();

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(0.84, 1.44, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x4a3b22, metalness: 0.5, roughness: 0.45 }),
  );
  frame.position.set(0, y, 0);
  frame.castShadow = true;
  group.add(frame);

  // Low roughness + metalness gives a vague light-source sheen on the
  // gradient without any env-map cost.
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(0.72, 1.32),
    new THREE.MeshStandardMaterial({
      map: glassTexture(), roughness: 0.15, metalness: 0.6,
    }),
  );
  glass.position.set(0, y, 0.028);
  group.add(glass);

  const recMat = new THREE.MeshBasicMaterial({
    map: recTexture(), transparent: true, depthWrite: false,
  });
  const rec = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.07), recMat);
  rec.position.set(0.22, y + 0.56, 0.034);
  group.add(rec);

  const recLight = new THREE.PointLight(0xff5252, 0.0, 1.6);
  recLight.position.set(0.22, y + 0.56, 0.18);
  group.add(recLight);

  let _t = 0;
  return {
    group,
    update(dt) {
      _t += dt;
      const on = (_t % 1.0) < 0.55;
      recMat.opacity = on ? 1.0 : 0.06;
      recLight.intensity = on ? 0.35 : 0.0;
    },
  };
}
