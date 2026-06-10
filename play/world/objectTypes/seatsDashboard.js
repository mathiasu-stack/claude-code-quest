// seatsDashboard.js — Kedash Protocol PROP-09. Wall-mounted "usage"
// dashboard that cycles three fake chart frames every ~4 s. Every frame
// carries the same fixed legend: "ACTIVE SEATS: 1" — the whole company
// is one seat.
//
// Returns { group, update(dt) }. Group is unpositioned, screen faces
// local +Z; caller places/rotates and ticks update.

import * as THREE from 'three';

const NAVY = '#0b1020';
const GOLD = '#c9a44c';
const BLUE = 'rgba(143,163,200,0.7)';

function paintFrame(x) {
  x.fillStyle = NAVY;
  x.fillRect(0, 0, 256, 160);
  x.strokeStyle = 'rgba(201,164,76,0.35)';
  x.strokeRect(2, 2, 252, 156);
}

function paintLegend(x) {
  x.fillStyle = 'rgba(201,164,76,0.15)';
  x.fillRect(2, 134, 252, 24);
  x.fillStyle = GOLD;
  x.font = '700 13px monospace';
  x.textAlign = 'left';
  x.fillText('ACTIVE SEATS: 1', 10, 151);
}

function paintLineChart(x) {
  paintFrame(x);
  x.fillStyle = GOLD; x.font = '700 10px monospace';
  x.fillText('USAGE · TOKENS/HR', 10, 16);
  x.strokeStyle = 'rgba(143,163,200,0.3)';
  for (let gy = 36; gy <= 120; gy += 21) {
    x.beginPath(); x.moveTo(10, gy); x.lineTo(246, gy); x.stroke();
  }
  x.strokeStyle = GOLD; x.lineWidth = 2;
  x.beginPath();
  for (let i = 0; i <= 24; i++) {
    const px = 10 + i * 9.8;
    const py = 100 - Math.sin(i * 0.7 + 1.3) * 18 - i * 1.4;
    i === 0 ? x.moveTo(px, py) : x.lineTo(px, py);
  }
  x.stroke();
  x.lineWidth = 1;
  paintLegend(x);
}

function paintBarChart(x) {
  paintFrame(x);
  x.fillStyle = GOLD; x.font = '700 10px monospace';
  x.fillText('SESSIONS / DAY', 10, 16);
  const vals = [0.55, 0.72, 0.64, 0.88, 0.79, 0.95, 0.91];
  vals.forEach((v, i) => {
    x.fillStyle = i === vals.length - 1 ? GOLD : BLUE;
    const h = v * 90;
    x.fillRect(16 + i * 33, 124 - h, 22, h);
  });
  paintLegend(x);
}

function paintDonut(x) {
  paintFrame(x);
  x.fillStyle = GOLD; x.font = '700 10px monospace';
  x.fillText('SEAT ALLOCATION', 10, 16);
  const cx = 78, cy = 80, r = 38;
  // One gold sliver vs a ring of "provisioned" grey.
  x.strokeStyle = BLUE; x.lineWidth = 16;
  x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke();
  x.strokeStyle = GOLD;
  x.beginPath(); x.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + 0.5); x.stroke();
  x.lineWidth = 1;
  x.fillStyle = GOLD; x.font = '700 18px monospace';
  x.textAlign = 'center';
  x.fillText('1', cx, cy + 6);
  x.textAlign = 'left';
  x.fillStyle = BLUE; x.font = '10px monospace';
  x.fillText('PROVISIONED: 240', 140, 70);
  x.fillStyle = GOLD;
  x.fillText('IN USE: 1', 140, 88);
  paintLegend(x);
}

const FRAMES = [paintLineChart, paintBarChart, paintDonut];

export function buildSeatsDashboard({ y = 1.85 } = {}) {
  const group = new THREE.Group();

  const bezel = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 1.12, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x1c1c1c, metalness: 0.4, roughness: 0.5 }),
  );
  bezel.position.set(0, y, 0);
  bezel.castShadow = true;
  group.add(bezel);

  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 160;
  const ctx = canvas.getContext('2d');
  FRAMES[0](ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.64, 0.98),
    new THREE.MeshBasicMaterial({ map: tex }),
  );
  screen.position.set(0, y, 0.034);
  group.add(screen);

  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x66bb6a, emissive: 0x66bb6a, emissiveIntensity: 0.9, roughness: 0.2,
  });
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), ledMat);
  led.position.set(0.82, y - 0.50, 0.035);
  group.add(led);

  let _t = 0;
  let frameTimer = 0;
  let frameIdx = 0;

  return {
    group,
    update(dt) {
      _t += dt;
      frameTimer += dt;
      if (frameTimer >= 4) {     // repaint only on frame switch — uploads aren't free
        frameTimer = 0;
        frameIdx = (frameIdx + 1) % FRAMES.length;
        FRAMES[frameIdx](ctx);
        tex.needsUpdate = true;
      }
      ledMat.emissiveIntensity = 0.7 + Math.sin(_t * 2.8) * 0.25;
    },
  };
}
