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
import { placeCompoundChild } from './compoundChildren.js?v=20260528g';

const OWNER = 'elevator';

// Shaft now sits OUTSIDE the atrium's east wall (which is at x=11), so
// the elevator takes no floor space inside the reception room. The
// shaftGroup is rotated -π/2 around Y so the opening (originally on
// local +Z, "south") faces world -X — i.e. west, into the atrium.
const SHAFT_X = 12.3;    // just east of the atrium east wall
const SHAFT_Z = -7.6;    // centered in the south cap of the east wall
const SHAFT_W = 2.4;     // dimension along local X (becomes world Z after rotation)
const SHAFT_D = 2.4;     // dimension along local Z (becomes world X after rotation)
const FLOOR_HEIGHT = 4.5;
const FLOOR_COUNT = 6;
const TOTAL_HEIGHT = FLOOR_HEIGHT * FLOOR_COUNT;

export function buildElevator(scene, opts = {}) {
  const mobile = !!opts.mobile;
  const out = {};

  const shaftGroup = new THREE.Group();
  shaftGroup.position.set(SHAFT_X, 0, SHAFT_Z);
  shaftGroup.rotation.y = -Math.PI / 2; // opening now faces west (into atrium)
  shaftGroup.userData.crossFloor = true;
  placeCompoundChild(scene, shaftGroup, OWNER, 'shaft_group');

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

  // Vertical chrome corner posts — thickened from 0.08m so the shaft
  // reads as architecture, not "thin floating bars".
  for (const [x, z] of [[-SHAFT_W/2, -SHAFT_D/2], [SHAFT_W/2, -SHAFT_D/2],
                         [-SHAFT_W/2,  SHAFT_D/2], [SHAFT_W/2,  SHAFT_D/2]]) {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.20, TOTAL_HEIGHT, 0.20),
      frame,
    );
    post.position.set(x, TOTAL_HEIGHT / 2, z);
    shaftGroup.add(post);
  }

  // South-facing entrance frame — a thick door header above the lobby
  // opening so the entry reads as a proper elevator portal rather than
  // an open gap between bars.
  const entryHeader = new THREE.Mesh(
    new THREE.BoxGeometry(SHAFT_W + 0.3, 0.3, 0.18),
    frame,
  );
  entryHeader.position.set(0, 2.55, SHAFT_D / 2 + 0.02);
  shaftGroup.add(entryHeader);
  // Pair of side jambs flanking the entry
  for (const sx of [-SHAFT_W / 2 - 0.08, SHAFT_W / 2 + 0.08]) {
    const jamb = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 2.6, 0.18),
      frame,
    );
    jamb.position.set(sx, 1.3, SHAFT_D / 2 + 0.02);
    shaftGroup.add(jamb);
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

  // Cab starts at ground floor and stays there (was randomly cycling
  // floors before — now static; only snapCabToFloor moves it when the
  // player explicitly takes the elevator via the modal).
  cab.position.y = 0;
  paintIndicator(1);

  // ── 3. Call button — placed inside the atrium just west of the
  // doorway so the player can press E from the reception side.
  const CALL_BTN_X = 10.85;  // ~10cm inside the atrium from the east wall
  const CALL_BTN_Z = SHAFT_Z;
  const btnHousing = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.4, 0.2),
    brushedSilver(),
  );
  btnHousing.position.set(CALL_BTN_X, 1.2, CALL_BTN_Z + 1.5);
  btnHousing.userData.crossFloor = true;
  placeCompoundChild(scene, btnHousing, OWNER, 'call_button_housing');
  const btnUp = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 12, 8),
    new THREE.MeshStandardMaterial({
      color: 0xffd54f, emissive: 0xffaa00, emissiveIntensity: 0.5,
    }),
  );
  btnUp.position.set(CALL_BTN_X - 0.03, 1.32, CALL_BTN_Z + 1.5);
  btnUp.userData.crossFloor = true;
  placeCompoundChild(scene, btnUp, OWNER, 'call_button_light');
  out.callButton = btnHousing;

  // ── 4. Floor signage above the elevator door, atrium-side.
  // Floors 2 & 3 only — those Y heights still fit under the atrium
  // ceiling at y=12. Higher floors would clip through the ceiling.
  for (let f = 2; f <= 3; f++) {
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
    // On the east wall, above the door, facing west (into the atrium).
    sign.position.set(10.94, 3.0 + (f - 2) * 0.45, SHAFT_Z);
    sign.rotation.y = -Math.PI / 2;
    sign.userData.crossFloor = true;
    placeCompoundChild(scene, sign, OWNER, `floor_sign_${f}`);
  }

  // Expose constants the host needs (call-button XZ for proximity, cab
  // snap for teleport). No tick() — the cab is static.
  out.callButtonPos = { x: CALL_BTN_X, z: CALL_BTN_Z + 1.5 };
  out.snapCabToFloor = (floorIdx) => {
    cab.position.y = (floorIdx - 1) * FLOOR_HEIGHT;
    paintIndicator(floorIdx);
  };

  // Manual override (used by ceremonyManager later).
  out.summon = (targetFloor) => {
    targetY = Math.max(0, Math.min(FLOOR_COUNT - 1, targetFloor - 1)) * FLOOR_HEIGHT;
    nextDecide = performance.now() + 30000; // hold target for a while
  };

  return out;
}
