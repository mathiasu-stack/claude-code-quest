// elevator.js — visible glass elevator running through the atrium.
//
// For this run the elevator is mainly a visual centerpiece: a glass
// shaft, an animated cab that moves between floors on its own, a call
// button at lobby level, and a small floor indicator. Functional
// floor-to-floor navigation is wired into ceremonyManager when the
// upper floors get content.
//
// Public API:
//   const elev = buildElevator(scene, opts);
//   elev.tick(dt, now);     // each frame
//   elev.summon(targetFloor); // animate cab to a specific floor

import * as THREE from 'three';
import {
  brushedSilver, polishedChrome, glassClear,
  marbleDarkGreen, brass,
} from '../materials/modernLibrary.js';

const SHAFT_X = 8.5;     // east side of atrium, near the curtain wall
const SHAFT_Z = -8.5;    // back of atrium near reception
const SHAFT_W = 2.4;
const SHAFT_D = 2.4;
const FLOOR_HEIGHT = 4.5;
const FLOOR_COUNT = 6;
const TOTAL_HEIGHT = FLOOR_HEIGHT * FLOOR_COUNT;

export function buildElevator(scene, opts = {}) {
  const mobile = !!opts.mobile;
  const out = {};

  const shaftGroup = new THREE.Group();
  shaftGroup.position.set(SHAFT_X, 0, SHAFT_Z);
  scene.add(shaftGroup);

  // ── 1. Shaft — glass tube ──────────────────────────────────────────
  // 4 glass walls (plus a frame) running floor to ceiling+more.
  const glassMat = glassClear({ mobile, tint: 0xeef6ff });
  const frame = brushedSilver();

  const shaftWalls = [
    // (w, h, d, x, y, z, ry)
    // South side facing into atrium — open at lobby (no glass below 2.4)
    { w: SHAFT_W, h: TOTAL_HEIGHT - 2.6, d: 0.06, x: 0, y: (TOTAL_HEIGHT - 2.6) / 2 + 2.6, z:  SHAFT_D / 2 },
    // North side
    { w: SHAFT_W, h: TOTAL_HEIGHT, d: 0.06, x: 0, y: TOTAL_HEIGHT / 2, z: -SHAFT_D / 2 },
    // East side
    { w: 0.06, h: TOTAL_HEIGHT, d: SHAFT_D, x: SHAFT_W / 2, y: TOTAL_HEIGHT / 2, z: 0 },
    // West side
    { w: 0.06, h: TOTAL_HEIGHT, d: SHAFT_D, x: -SHAFT_W / 2, y: TOTAL_HEIGHT / 2, z: 0 },
  ];
  for (const wConf of shaftWalls) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(wConf.w, wConf.h, wConf.d),
      glassMat,
    );
    m.position.set(wConf.x, wConf.y, wConf.z);
    shaftGroup.add(m);
  }

  // Vertical chrome corner posts
  for (const [x, z] of [[-SHAFT_W/2, -SHAFT_D/2], [SHAFT_W/2, -SHAFT_D/2],
                         [-SHAFT_W/2,  SHAFT_D/2], [SHAFT_W/2,  SHAFT_D/2]]) {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, TOTAL_HEIGHT, 0.08),
      frame,
    );
    post.position.set(x, TOTAL_HEIGHT / 2, z);
    shaftGroup.add(post);
  }

  // Floor markers — thin chrome bands at each floor level
  for (let f = 1; f <= FLOOR_COUNT; f++) {
    const y = f * FLOOR_HEIGHT;
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(SHAFT_W, 0.06, SHAFT_D),
      polishedChrome(),
    );
    band.position.set(0, y, 0);
    shaftGroup.add(band);
  }

  // ── 2. Elevator cab ────────────────────────────────────────────────
  // A box slightly smaller than the shaft, with a marble floor and
  // a tiny floor indicator panel inside.
  const cab = new THREE.Group();
  shaftGroup.add(cab);

  const cabFloor = new THREE.Mesh(
    new THREE.BoxGeometry(SHAFT_W - 0.2, 0.1, SHAFT_D - 0.2),
    marbleDarkGreen(),
  );
  cabFloor.position.y = 0.05;
  cab.add(cabFloor);
  const cabCeiling = new THREE.Mesh(
    new THREE.BoxGeometry(SHAFT_W - 0.2, 0.06, SHAFT_D - 0.2),
    brushedSilver(),
  );
  cabCeiling.position.y = 2.4;
  cab.add(cabCeiling);
  // 4 transparent walls so you can see through; they read as the cab.
  const cabWallMat = glassClear({ mobile, tint: 0xfff8e1 });
  // Back wall
  const backW = new THREE.Mesh(new THREE.PlaneGeometry(SHAFT_W - 0.2, 2.4), cabWallMat);
  backW.position.set(0, 1.2, -(SHAFT_D / 2) + 0.12);
  cab.add(backW);
  // Side walls
  const sideMat = brushedSilver();
  const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.4, SHAFT_D - 0.24), sideMat);
  sideL.position.set(-(SHAFT_W / 2) + 0.12, 1.2, 0);
  cab.add(sideL);
  const sideR = sideL.clone(); sideR.position.x = (SHAFT_W / 2) - 0.12;
  cab.add(sideR);
  // Glowing ceiling light
  const cabLight = new THREE.Mesh(
    new THREE.PlaneGeometry(SHAFT_W - 0.4, SHAFT_D - 0.4),
    new THREE.MeshBasicMaterial({
      color: 0xfff5d0, transparent: true, opacity: 0.85,
    }),
  );
  cabLight.rotation.x = Math.PI / 2;
  cabLight.position.y = 2.36;
  cab.add(cabLight);
  const cabPoint = new THREE.PointLight(0xfff5d0, 0.8, 4, 1.5);
  cabPoint.position.y = 1.5;
  cab.add(cabPoint);

  // Floor indicator panel (canvas, updates each tick to show the
  // current floor — built once, texture refreshed when floor changes).
  const indCanvas = document.createElement('canvas');
  indCanvas.width = 128; indCanvas.height = 48;
  const indTex = new THREE.CanvasTexture(indCanvas);
  indTex.colorSpace = THREE.SRGBColorSpace;
  function paintIndicator(floor) {
    const ctx = indCanvas.getContext('2d');
    ctx.fillStyle = '#0d0d12'; ctx.fillRect(0, 0, indCanvas.width, indCanvas.height);
    ctx.fillStyle = '#ffd54f';
    ctx.font = 'bold 28px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`F${floor}`, indCanvas.width / 2, indCanvas.height / 2);
    indTex.needsUpdate = true;
  }
  paintIndicator(1);
  const indPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.18),
    new THREE.MeshBasicMaterial({ map: indTex, transparent: true }),
  );
  indPlane.position.set(0, 2.0, -(SHAFT_D / 2) + 0.13);
  cab.add(indPlane);

  // Initial cab position — random floor for ambience.
  let currentY = (1 + Math.floor(Math.random() * FLOOR_COUNT)) * FLOOR_HEIGHT - FLOOR_HEIGHT;
  let targetY = currentY;
  let speed = 1.6;

  cab.position.y = currentY;
  paintIndicator(Math.round(currentY / FLOOR_HEIGHT) + 1);

  // ── 3. Call button at lobby level (south side of shaft) ────────────
  const btnHousing = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.4, 0.05),
    brushedSilver(),
  );
  btnHousing.position.set(SHAFT_X + (SHAFT_W / 2) + 0.4, 1.2, SHAFT_Z + 0.5);
  scene.add(btnHousing);
  const btnUp = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 12, 8),
    new THREE.MeshStandardMaterial({
      color: 0xffd54f, emissive: 0xffaa00, emissiveIntensity: 0.5,
    }),
  );
  btnUp.position.set(SHAFT_X + (SHAFT_W / 2) + 0.4, 1.32, SHAFT_Z + 0.53);
  scene.add(btnUp);

  // ── 4. Floor signage on the south wall of each floor ──────────────
  // (For floors above the atrium that aren't built yet, this is a
  // visible cue that the floor exists.)
  for (let f = 2; f <= FLOOR_COUNT; f++) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#0d0d12'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#c9a44c'; ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, c.width - 8, c.height - 8);
    ctx.fillStyle = '#c9a44c';
    ctx.font = 'bold 30px "Segoe UI", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`FLOOR ${f}`, c.width / 2, c.height / 2);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 0.25),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true }),
    );
    sign.position.set(SHAFT_X + (SHAFT_W / 2) + 0.06, f * FLOOR_HEIGHT + 0.4, SHAFT_Z);
    sign.rotation.y = -Math.PI / 2;
    scene.add(sign);
  }

  // ── 5. tick() — animate cab between floors slowly ──────────────────
  let nextDecide = 0;
  out.tick = (dt, now) => {
    if (now > nextDecide) {
      // Pick a new random target floor every 6-12 s.
      const targetFloor = 1 + Math.floor(Math.random() * FLOOR_COUNT);
      targetY = (targetFloor - 1) * FLOOR_HEIGHT;
      nextDecide = now + 6000 + Math.random() * 6000;
    }
    if (Math.abs(targetY - currentY) > 0.02) {
      const dir = Math.sign(targetY - currentY);
      currentY += dir * speed * dt;
      // clamp so we don't overshoot
      if ((dir > 0 && currentY > targetY) || (dir < 0 && currentY < targetY)) {
        currentY = targetY;
      }
      cab.position.y = currentY;
    } else {
      paintIndicator(Math.round(currentY / FLOOR_HEIGHT) + 1);
    }
  };

  // Manual override (used by ceremonyManager later).
  out.summon = (targetFloor) => {
    targetY = Math.max(0, Math.min(FLOOR_COUNT - 1, targetFloor - 1)) * FLOOR_HEIGHT;
    nextDecide = performance.now() + 30000; // hold target for a while
  };

  return out;
}
