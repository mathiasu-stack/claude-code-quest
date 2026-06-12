// floorM.js — Maya Kedash's hidden loft (Floor M, finale set — FIN-02 / ASK-A4).
//
// One ~14×8 m room: monitor wall (10 canvas-texture screens, one showing a
// stylized lobby feed), a NAS rack twin, camp bed, thriving plants, a long
// desk with sixteen folder stacks, and the CEO portrait's twin leaning
// against the wall FACING AWAY. Lived-in and hidden — warm pools of light,
// not corporate ceiling wash.
//
// ── CONTRACT ────────────────────────────────────────────────────────────────
//   import { buildFloorM } from './world/floorM.js';
//   const fm = buildFloorM({ baseY: <world Y of floor M's ground plane> });
//   → { group, colliders, fragmentSpot, update }
//
//   group        THREE.Group, positioned at (0, baseY, 0), already tagged
//                group.userData.floor = floorIndex (default 5) so
//                applyFloorVisibility() toggles it like any other floor.
//                Integrator: scene.add(fm.group).
//   colliders    Array of { minX, maxX, minZ, maxZ, floor } — the exact AABB
//                shape play.js's `colliders` array / clampMove consumes.
//                Integrator: push these inside registerStaticColliders()
//                (or right after rebuildColliders()) so they survive editor
//                collider rebuilds.
//   fragmentSpot THREE.Vector3 (WORLD coords, baseY included) — the cleared,
//                lamp-lit spot on the desk where the `learnings.md fragment 2`
//                readable (SYS-06) should be placed. The collectible itself is
//                NOT built here.
//   update(dt)   Optional per-frame tick (seconds). Animates 2 screens
//                (scrolling log + lobby-feed flicker) and the rack LEDs.
//                Integrator: decoTickers.push((dt) => fm.update(dt)).
//
// ── LOCAL ORIGIN / LAYOUT ───────────────────────────────────────────────────
//   The group sits at (0, baseY, 0); all child positions double as world XZ.
//   Room footprint: x ∈ [-3.0, 11.2], z ∈ [-11.6, -3.6] (14.2 × 8.0 m).
//   The single door gap is in the EAST wall at z ∈ [-8.8, -6.4] — the same
//   opening the floors 2–4 elevator shaft uses, so the standard post-ride
//   spawn at (10.0, baseY, -7.6) lands just inside the door. Colliders
//   include a shaft vestibule back-stop mirroring play.js's per-floor shaft
//   AABBs (registerStaticColliders only emits those for f ≤ FLOORS_TOTAL).
//
//   NOTE: floorBaseY() in play.js clamps to FLOORS_TOTAL (4); the integrator
//   must extend it (or special-case floor 5) before computing baseY.

import * as THREE from 'three';

// Room bounds (world XZ).
const X_MIN = -3.0, X_MAX = 11.2;
const Z_MIN = -11.6, Z_MAX = -3.6;
const CX = (X_MIN + X_MAX) / 2, CZ = (Z_MIN + Z_MAX) / 2;
const WALL_H = 3.8;          // matches FLOOR_OFFICE_WALL_H
const WALL_T = 0.3;
const DOOR_Z0 = -8.8, DOOR_Z1 = -6.4;   // east-wall gap, matches shaft opening

// ─── Canvas screen painters ──────────────────────────────────────────────────
// All screens are 256×160 canvases on MeshBasicMaterial (unlit → reads as
// emissive). Two are repainted at runtime (log scroll, lobby flicker).

const NAVY = '#0b1020';
const GOLD = '#c9a44c';

function makeScreenCanvas() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 160;
  return c;
}

function paintFrame(x) {
  x.fillStyle = NAVY;
  x.fillRect(0, 0, 256, 160);
  x.strokeStyle = 'rgba(201,164,76,0.35)';
  x.strokeRect(2, 2, 252, 156);
}

const LOG_POOL = [
  'cycle07/submission accepted',
  'diff: +42 -7  src/handoff.md',
  'ccq: /cost — unprompted',
  'watch: floor4 cam-2 idle',
  'compact @ 02:14 ok',
  'maya.local: backup green',
  'seat-count: 1 (still)',
  'hook post-test → notify',
  'tier check: T7 eligible',
  'ines.ping: "she asked again"',
  'reply-cache refresh: rena',
  'nas: smoke test PASS',
];

function paintLog(x, lines) {
  paintFrame(x);
  x.font = '10px monospace';
  x.textBaseline = 'top';
  for (let i = 0; i < lines.length; i++) {
    x.fillStyle = i === lines.length - 1 ? '#9be09b' : 'rgba(120,190,120,0.75)';
    x.fillText('> ' + lines[i], 8, 8 + i * 13);
  }
}

// Stylized top-down-ish lobby feed: floor wash, reception desk, portrait
// rect on the back wall, a couple of figure dots — one gold (the player).
function paintLobby(x, t) {
  paintFrame(x);
  x.fillStyle = '#16203a';
  x.fillRect(8, 30, 240, 122);
  // back wall + portrait
  x.fillStyle = '#1d2a4a';
  x.fillRect(8, 30, 240, 16);
  x.fillStyle = GOLD;
  x.fillRect(118, 32, 20, 12);
  // reception desk
  x.fillStyle = '#3a2d20';
  x.fillRect(96, 70, 64, 14);
  // figures (slow drift so the feed reads as live)
  x.fillStyle = '#8fa3c8';
  x.beginPath(); x.arc(60 + Math.sin(t * 0.4) * 8, 110, 3, 0, 7); x.fill();
  x.beginPath(); x.arc(190 + Math.cos(t * 0.3) * 6, 96, 3, 0, 7); x.fill();
  x.fillStyle = GOLD;
  x.beginPath(); x.arc(128 + Math.sin(t * 0.6) * 12, 120, 3.4, 0, 7); x.fill();
  // header + scanline flicker
  x.fillStyle = 'rgba(201,164,76,0.9)';
  x.font = '700 10px monospace';
  x.fillText('CAM-01 · LOBBY · LIVE', 10, 12);
  x.fillStyle = `rgba(255,255,255,${0.02 + 0.025 * Math.abs(Math.sin(t * 7))})`;
  x.fillRect(8, 30 + ((t * 26) % 122), 240, 3);
}

function paintLineChart(x, title, seed) {
  paintFrame(x);
  x.fillStyle = GOLD; x.font = '700 10px monospace';
  x.fillText(title, 10, 16);
  x.strokeStyle = 'rgba(143,163,200,0.3)';
  for (let gy = 40; gy <= 140; gy += 25) {
    x.beginPath(); x.moveTo(10, gy); x.lineTo(246, gy); x.stroke();
  }
  x.strokeStyle = GOLD; x.lineWidth = 2;
  x.beginPath();
  for (let i = 0; i <= 24; i++) {
    const px = 10 + i * 9.8;
    const py = 110 - Math.sin(i * 0.7 + seed) * 22 - i * 1.2;
    i === 0 ? x.moveTo(px, py) : x.lineTo(px, py);
  }
  x.stroke();
  x.lineWidth = 1;
}

function paintBars(x, title) {
  paintFrame(x);
  x.fillStyle = GOLD; x.font = '700 10px monospace';
  x.fillText(title, 10, 16);
  const vals = [0.9, 0.95, 0.88, 0.97, 0.92, 0.99, 0.96];
  vals.forEach((v, i) => {
    x.fillStyle = i === vals.length - 1 ? GOLD : 'rgba(143,163,200,0.7)';
    const h = v * 100;
    x.fillRect(18 + i * 33, 140 - h, 22, h);
  });
}

function paintBigStat(x, label, value, sub) {
  paintFrame(x);
  x.fillStyle = 'rgba(143,163,200,0.8)'; x.font = '10px monospace';
  x.fillText(label, 10, 20);
  x.fillStyle = GOLD; x.font = '700 44px monospace';
  x.textAlign = 'center';
  x.fillText(value, 128, 95);
  x.textAlign = 'left';
  if (sub) { x.fillStyle = 'rgba(143,163,200,0.6)'; x.font = '10px monospace'; x.fillText(sub, 10, 145); }
}

function paintFloorMap(x) {
  paintFrame(x);
  x.fillStyle = GOLD; x.font = '700 10px monospace';
  x.fillText('FLOOR PLAN · F1–F4', 10, 16);
  x.strokeStyle = 'rgba(143,163,200,0.7)';
  const cells = [[14, 28], [134, 28], [14, 92], [134, 92]];
  cells.forEach(([px, py], i) => {
    x.strokeRect(px, py, 108, 58);
    x.fillStyle = 'rgba(143,163,200,0.6)'; x.font = '9px monospace';
    x.fillText('F' + (i + 1), px + 4, py + 12);
    x.fillStyle = i === 0 ? GOLD : '#3c4d75';
    x.beginPath(); x.arc(px + 54 + i * 7, py + 32, 2.5, 0, 7); x.fill();
  });
}

function paintCamGrid(x) {
  paintFrame(x);
  const cells = [[8, 8], [132, 8], [8, 84], [132, 84]];
  cells.forEach(([px, py], i) => {
    x.fillStyle = '#101830';
    x.fillRect(px, py, 116, 68);
    x.fillStyle = '#d33';
    x.beginPath(); x.arc(px + 106, py + 10, 3, 0, 7); x.fill();
    x.fillStyle = 'rgba(143,163,200,0.6)'; x.font = '8px monospace';
    x.fillText('CAM-0' + (i + 2), px + 4, py + 62);
  });
}

function paintDiff(x) {
  paintFrame(x);
  x.font = '9px monospace'; x.textBaseline = 'top';
  const rows = [
    ['  ## learnings.md', '#8fa3c8'],
    ['- trust no summary', '#d77'],
    ['+ trust, then verify', '#9be09b'],
    ['+ write the ask rule', '#9be09b'],
    ['  …', '#8fa3c8'],
    ['- I am the failover', '#d77'],
    ['+ the second chair is', '#9be09b'],
    ['+ the failover', '#9be09b'],
  ];
  rows.forEach(([s, col], i) => { x.fillStyle = col; x.fillText(s, 10, 10 + i * 14); });
}

function paintTerminal(x) {
  paintFrame(x);
  x.font = '10px monospace'; x.textBaseline = 'top';
  x.fillStyle = 'rgba(155,224,155,0.85)';
  ['$ claude --resume', '  session: capstone', '  2 terminals attached', '$ ▍'].forEach((s, i) =>
    x.fillText(s, 8, 10 + i * 14));
}

// ─── Small prop builders ─────────────────────────────────────────────────────

function makeCampBed() {
  const g = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x37404a, metalness: 0.5, roughness: 0.5 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.12, 2.0), frameMat);
  frame.position.y = 0.32;
  g.add(frame);
  for (const [lx, lz] of [[-0.42, -0.92], [0.42, -0.92], [-0.42, 0.92], [0.42, 0.92]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.32, 0.05), frameMat);
    leg.position.set(lx, 0.16, lz);
    g.add(leg);
  }
  const mattress = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.14, 1.95),
    new THREE.MeshStandardMaterial({ color: 0x4a5d52, roughness: 0.95 }),
  );
  mattress.position.y = 0.45;
  g.add(mattress);
  const pillow = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.1, 0.35),
    new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 1 }),
  );
  pillow.position.set(0, 0.55, -0.72);
  g.add(pillow);
  const blanket = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.05, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x7a2e3a, roughness: 1 }),
  );
  blanket.position.set(0, 0.54, 0.55);
  g.add(blanket);
  return g;
}

// Procedural plant; tries the shared GLB decoration first. Kept async-free:
// makeDecoration is sync (cache hit or null) so this works whether or not
// preloadDecorations() ran before the floor builds.
let _makeDecoration = null;
async function _lazyDecorations() {
  try {
    const mod = await import('../decorations/decorationAssets.js');
    _makeDecoration = mod.makeDecoration;
  } catch { /* fall back to procedural pots */ }
}
const _decorationsReady = _lazyDecorations();

function makePlantProcedural(h = 1.0) {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.12, 0.24, 10),
    new THREE.MeshStandardMaterial({ color: 0x8d5524, roughness: 0.9 }),
  );
  pot.position.y = 0.12;
  g.add(pot);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.9 });
  for (let i = 0; i < 3; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.16 - i * 0.03, h * (0.5 + i * 0.22), 7), leafMat);
    leaf.position.set((i - 1) * 0.07, 0.24 + h * (0.25 + i * 0.11), (i - 1) * 0.05);
    g.add(leaf);
  }
  return g;
}

function makeWateringCan() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x607d8b, metalness: 0.6, roughness: 0.4 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.18, 10), mat);
  body.position.y = 0.09;
  g.add(body);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.025, 0.22, 6), mat);
  spout.position.set(0.13, 0.13, 0);
  spout.rotation.z = -Math.PI / 3.2;
  g.add(spout);
  return g;
}

// NAS rack — simplified twin of the ch16 prop (objectTypes/serverRack.js).
// Deliberately NOT reusing buildServerRack: it scene.adds itself and
// registers a "run diagnostic" interactable, which is wrong for the loft
// (the rack here is set dressing for the Maya scene, not a lesson prop).
function makeNasRack() {
  const g = new THREE.Group();
  const cab = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 1.9, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7, roughness: 0.4 }),
  );
  cab.position.y = 0.95;
  cab.castShadow = true;
  g.add(cab);
  const ventMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  for (let i = 0; i < 8; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.012, 0.005), ventMat);
    slat.position.set(0, 0.45 + i * 0.17, 0.305);
    g.add(slat);
  }
  const leds = [];
  for (let i = 0; i < 6; i++) {
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x4caf50, emissive: 0x4caf50, emissiveIntensity: 0.6 }),
    );
    led.position.set(0.3, 1.4 - i * 0.06, 0.31);
    g.add(led);
    leds.push(led);
  }
  return { group: g, leds };
}

// Reversed CEO portrait twin. Same frame/trim dims as buildCeoPortrait in
// play.js; the photo plane faces the WALL — the player only ever sees the
// brown paper backing. Built fresh rather than reusing buildCeoPortrait
// (it lives in play.js scope, reads progress state, and adds a plaque +
// hearts we don't want here).
function makeReversedPortrait() {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 2.6, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x4e342e, metalness: 0.2, roughness: 0.5 }),
  );
  g.add(frame);
  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 2.4, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xc9a44c, metalness: 0.7, roughness: 0.25 }),
  );
  trim.position.z = 0.04;
  g.add(trim);
  // Photo plane on the wall-facing side (+z in local space).
  const photo = new THREE.Mesh(
    new THREE.PlaneGeometry(1.85, 2.25),
    new THREE.MeshBasicMaterial({ color: 0xd9c9a8 }),
  );
  photo.position.z = 0.1;
  g.add(photo);
  // Paper backing the player actually sees, with a taped corner detail.
  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 2.3),
    new THREE.MeshStandardMaterial({ color: 0x6d5a44, roughness: 1 }),
  );
  back.rotation.y = Math.PI;
  back.position.z = -0.065;
  g.add(back);
  const tapeC = document.createElement('canvas');
  tapeC.width = 128; tapeC.height = 40;
  const tx = tapeC.getContext('2d');
  tx.fillStyle = '#e8e0cc'; tx.fillRect(0, 0, 128, 40);
  tx.fillStyle = '#5b4636'; tx.font = 'italic 14px serif';
  tx.textAlign = 'center'; tx.textBaseline = 'middle';
  tx.fillText('do not hang — M.K.', 64, 21);
  const tapeTex = new THREE.CanvasTexture(tapeC);
  tapeTex.colorSpace = THREE.SRGBColorSpace;
  const tape = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.22), new THREE.MeshBasicMaterial({ map: tapeTex }));
  tape.rotation.y = Math.PI;
  tape.position.set(0.3, 0.75, -0.07);
  g.add(tape);
  return g;
}

// ─── Main builder ────────────────────────────────────────────────────────────

export function buildFloorM({ baseY, floorIndex = 5 }) {
  const group = new THREE.Group();
  group.position.set(0, baseY, 0);
  group.userData.floor = floorIndex;

  const colliders = [];
  const addAABB = (minX, maxX, minZ, maxZ) =>
    colliders.push({ minX, maxX, minZ, maxZ, floor: floorIndex });

  // ── Shell ──────────────────────────────────────────────────────────
  const floorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(X_MAX - X_MIN, Z_MAX - Z_MIN),
    new THREE.MeshStandardMaterial({ color: 0x5d4a36, roughness: 0.85 }),  // worn wood, not office tile
  );
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.set(CX, 0, CZ);
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(X_MAX - X_MIN, Z_MAX - Z_MIN),
    new THREE.MeshStandardMaterial({ color: 0x23242a, roughness: 0.95 }),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(CX, WALL_H - 0.01, CZ);
  group.add(ceiling);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x2b3442, roughness: 0.8 });
  function addWallMesh(w, d, x, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, WALL_H, d), wallMat);
    m.position.set(x, WALL_H / 2, z);
    m.castShadow = true; m.receiveShadow = true;
    group.add(m);
  }
  const W = X_MAX - X_MIN;
  addWallMesh(W + WALL_T, WALL_T, CX, Z_MIN);            // north (monitor wall)
  addWallMesh(W + WALL_T, WALL_T, CX, Z_MAX);            // south
  addWallMesh(WALL_T, Z_MAX - Z_MIN, X_MIN, CZ);         // west
  // East wall — two segments around the door gap.
  addWallMesh(WALL_T, DOOR_Z0 - Z_MIN, X_MAX, (Z_MIN + DOOR_Z0) / 2);
  addWallMesh(WALL_T, Z_MAX - DOOR_Z1, X_MAX, (DOOR_Z1 + Z_MAX) / 2);

  addAABB(X_MIN - 0.15, X_MIN + 0.15, Z_MIN, Z_MAX);
  addAABB(X_MIN, X_MAX, Z_MIN - 0.15, Z_MIN + 0.15);
  addAABB(X_MIN, X_MAX, Z_MAX - 0.15, Z_MAX + 0.15);
  addAABB(X_MAX - 0.15, X_MAX + 0.15, Z_MIN, DOOR_Z0);
  addAABB(X_MAX - 0.15, X_MAX + 0.15, DOOR_Z1, Z_MAX);
  // Shaft vestibule beyond the door gap — registerStaticColliders only
  // emits the elevator-shaft AABBs for floors ≤ FLOORS_TOTAL, so mirror
  // them here (back-stop + sides) to keep the player out of the void.
  addAABB(13.40, 13.60, DOOR_Z0, DOOR_Z1);
  addAABB(11.10, 13.50, -8.90, -8.70);
  addAABB(11.10, 13.50, -6.50, -6.30);

  // ── Monitor wall (north) ───────────────────────────────────────────
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(11.6, 2.4, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x14171f, roughness: 0.7 }),
  );
  board.position.set(3.6, 1.95, Z_MIN + WALL_T / 2 + 0.05);
  group.add(board);

  const animated = [];   // { canvas, ctx, tex, repaint(t) } — ticked in update()
  const SCREENS = [
    { paint: (x) => paintLog(x, LOG_POOL.slice(0, 9)), anim: 'log' },
    { paint: paintFloorMap },
    { paint: (x) => paintLobby(x, 0), anim: 'lobby' },
    { paint: (x) => paintLineChart(x, 'CSAT · 36 MONTHS', 1.3) },
    { paint: paintCamGrid },
    { paint: (x) => paintBigStat(x, 'ACTIVE SEATS', '1', 'since 1129 days') },
    { paint: paintDiff },
    { paint: (x) => paintBars(x, 'CYCLE SCORES 01–07') },
    { paint: paintTerminal },
    { paint: (x) => paintBigStat(x, 'UPTIME', '1129d', 'maya.local · nas') },
  ];
  const screenGeo = new THREE.PlaneGeometry(1.9, 1.05);
  SCREENS.forEach((def, i) => {
    const canvas = makeScreenCanvas();
    const ctx = canvas.getContext('2d');
    def.paint(ctx);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({ map: tex }));
    const col = i % 5, row = Math.floor(i / 5);
    mesh.position.set(-0.6 + col * 2.1, 2.5 - row * 1.15, Z_MIN + WALL_T / 2 + 0.1);
    mesh.rotation.x = (row === 0 ? 0.05 : -0.03);   // slight tilt toward the room
    group.add(mesh);
    if (def.anim === 'log') animated.push({ kind: 'log', ctx, tex, lines: LOG_POOL.slice(0, 9), next: 0 });
    if (def.anim === 'lobby') animated.push({ kind: 'lobby', ctx, tex });
  });
  // Cool spill from the screens — the only "corporate" light in the room.
  const screenGlow = new THREE.PointLight(0x86a8ff, 0.35, 7);
  screenGlow.position.set(3.6, 2.4, Z_MIN + 1.2);
  group.add(screenGlow);

  // ── NAS rack (in-fiction twin of the ch16 box) ─────────────────────
  const rack = makeNasRack();
  rack.group.position.set(-1.9, 0, Z_MIN + 0.75);
  group.add(rack.group);
  addAABB(-2.3, -1.5, Z_MIN + 0.4, Z_MIN + 1.1);

  // ── Long desk + 16 folder stacks (south wall) ──────────────────────
  const DESK_Y = 0.78;
  const desk = new THREE.Group();
  const deskTop = new THREE.Mesh(
    new THREE.BoxGeometry(7.2, 0.06, 0.85),
    new THREE.MeshStandardMaterial({ color: 0x6d4c33, roughness: 0.6 }),
  );
  deskTop.position.y = DESK_Y;
  deskTop.castShadow = true; deskTop.receiveShadow = true;
  desk.add(deskTop);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x3b2a1c, roughness: 0.7 });
  for (const lx of [-3.4, 0, 3.4]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, DESK_Y, 0.7), legMat);
    leg.position.set(lx, DESK_Y / 2, 0);
    desk.add(leg);
  }
  desk.position.set(3.9, 0, Z_MAX - 0.65);
  group.add(desk);
  addAABB(0.3, 7.5, Z_MAX - 1.1, Z_MAX - 0.2);

  // 16 stacks — one per cycle-week. Cheap shared geometry, jittered.
  const folderGeo = new THREE.BoxGeometry(0.26, 0.035, 0.34);
  const folderMats = [0x8a7340, 0x9b8a5c, 0x7b6a4a].map(c =>
    new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 }));
  for (let s = 0; s < 16; s++) {
    // Leave the desk's east end (fragment spot) clear: stacks span 14 slots
    // west of it, two rows deep.
    const col = s % 8, row = Math.floor(s / 8);
    const sx = 0.75 + col * 0.78 + (Math.sin(s * 12.9898) * 0.04);
    const sz = Z_MAX - 0.45 - row * 0.38;
    const count = 3 + (s * 7) % 4;
    for (let b = 0; b < count; b++) {
      const f = new THREE.Mesh(folderGeo, folderMats[(s + b) % 3]);
      f.position.set(
        sx + Math.sin(s * 3.1 + b * 1.7) * 0.02,
        DESK_Y + 0.05 + b * 0.037,
        sz + Math.cos(s * 2.3 + b) * 0.02,
      );
      f.rotation.y = Math.sin(s * 5.7 + b * 2.2) * 0.12;
      group.add(f);
    }
  }

  // ── Fragment spot (SYS-06 hook — collectible NOT built here) ───────
  // A cleared leather mat under its own reading lamp at the desk's west
  // end, unmistakably staged. Another module places the learnings.md
  // fragment 2 readable at `fragmentSpot`.
  const mat = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x40342a, roughness: 0.95 }),
  );
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(0.85, DESK_Y + 0.035, Z_MAX - 0.62);
  group.add(mat);
  const lampArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x2c2c2c, metalness: 0.6, roughness: 0.4 }),
  );
  lampArm.position.set(0.5, DESK_Y + 0.28, Z_MAX - 0.85);
  lampArm.rotation.z = 0.5;
  group.add(lampArm);
  const lampShade = new THREE.Mesh(
    new THREE.ConeGeometry(0.1, 0.12, 8, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x2c2c2c, emissive: 0xffd9a0, emissiveIntensity: 0.5, side: THREE.DoubleSide,
    }),
  );
  lampShade.position.set(0.62, DESK_Y + 0.5, Z_MAX - 0.82);
  lampShade.rotation.z = 0.4;
  group.add(lampShade);
  const lampLight = new THREE.PointLight(0xffd9a0, 0.8, 3.5);
  lampLight.position.set(0.78, DESK_Y + 0.45, Z_MAX - 0.72);
  group.add(lampLight);
  const fragmentSpot = new THREE.Vector3(0.85, baseY + DESK_Y + 0.06, Z_MAX - 0.62);

  // ── Camp bed (west end) ────────────────────────────────────────────
  const bed = makeCampBed();
  bed.position.set(-2.2, 0, -6.2);
  group.add(bed);
  addAABB(-2.75, -1.65, -7.3, -5.1);

  // ── Plants + watering can — genuinely thriving, per §5.3 ───────────
  const plantSlots = [
    { x: -2.4, z: -4.3, h: 1.2 },
    { x: -2.5, z: -8.4, h: 0.9 },
    { x: 8.9, z: Z_MAX - 0.45, h: 0.8 },
    { x: 10.5, z: Z_MIN + 0.7, h: 1.3 },
  ];
  // Decorations module loads async; swap procedural pots for GLB plants
  // if/when the cache is warm. Procedural stays if the import fails.
  const plantAnchors = plantSlots.map((p) => {
    const anchor = new THREE.Group();
    anchor.position.set(p.x, 0, p.z);
    anchor.add(makePlantProcedural(p.h));
    group.add(anchor);
    return { anchor, h: p.h };
  });
  _decorationsReady.then(() => {
    if (!_makeDecoration) return;
    for (const { anchor, h } of plantAnchors) {
      const glb = _makeDecoration('plant', { height: h + 0.3 });
      if (glb) { anchor.clear(); anchor.add(glb); }
    }
  });
  const can = makeWateringCan();
  can.position.set(-2.0, 0, -4.55);
  group.add(can);

  // ── Reversed portrait twin (story beat) ────────────────────────────
  // Leans against the south wall, photo plane toward the wall. Local +z
  // (the photo side) must point at the wall at Z_MAX → no Y rotation;
  // a slight backward lean rests the top edge on the wall.
  const portrait = makeReversedPortrait();
  portrait.position.set(-1.4, 1.32, Z_MAX - 0.45);
  portrait.rotation.x = 0.12;
  group.add(portrait);

  // ── Lighting — warm pools, dim hidden-loft feel ────────────────────
  // No ceiling wash. The integrator may additionally dim the global
  // ambient while currentFloor === floorIndex; these lights toggle with
  // the group's visibility automatically.
  const bedLight = new THREE.PointLight(0xffc98a, 0.9, 6);
  bedLight.position.set(-2.0, 2.1, -6.2);
  group.add(bedLight);
  const deskLight = new THREE.PointLight(0xffd9a0, 0.7, 7);
  deskLight.position.set(4.5, 2.4, Z_MAX - 1.4);
  group.add(deskLight);
  const doorLight = new THREE.PointLight(0xffe2b8, 0.5, 5);
  doorLight.position.set(9.8, 2.6, -7.6);
  group.add(doorLight);
  // Floor lamp prop motivating the bed pool.
  const lampPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.04, 1.7, 8),
    new THREE.MeshStandardMaterial({ color: 0x2c2c2c, metalness: 0.5, roughness: 0.5 }),
  );
  lampPole.position.set(-2.55, 0.85, -7.5);
  group.add(lampPole);
  const lampHead = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.22, 10, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x3a3a3a, emissive: 0xffc98a, emissiveIntensity: 0.6, side: THREE.DoubleSide,
    }),
  );
  lampHead.position.set(-2.55, 1.78, -7.5);
  group.add(lampHead);

  // ── Per-frame animation ────────────────────────────────────────────
  let tAcc = 0, logTimer = 0, lobbyTimer = 0, ledTime = 0;
  function update(dt) {
    tAcc += dt;
    ledTime += dt;
    // Rack LEDs — same alternating flicker as the ch16 prop.
    rack.leds.forEach((led, i) => {
      const phase = (ledTime * 2 + i * 0.4) % 2;
      led.material.emissiveIntensity = phase < 1 ? 0.9 : 0.4;
    });
    for (const a of animated) {
      if (a.kind === 'log') {
        logTimer += dt;
        if (logTimer >= 0.9) {     // throttled — canvas uploads aren't free on mobile
          logTimer = 0;
          a.lines.push(LOG_POOL[a.next % LOG_POOL.length]);
          a.next++;
          if (a.lines.length > 9) a.lines.shift();
          paintLog(a.ctx, a.lines);
          a.tex.needsUpdate = true;
        }
      } else if (a.kind === 'lobby') {
        lobbyTimer += dt;
        if (lobbyTimer >= 0.25) {
          lobbyTimer = 0;
          paintLobby(a.ctx, tAcc);
          a.tex.needsUpdate = true;
        }
      }
    }
  }

  return { group, colliders, fragmentSpot, update };
}

// ─── PROP-05 — Floor 4 cable trays (ASK-A18) ─────────────────────────────────
// Set dressing for the Integration Bay: dark wall-tray boxes + cable-tube
// bundles running along the Floor 4 ceiling edges, converging on the
// elevator shaft (world x≈12.3, z≈-7.6), plus a vertical run continuing
// ABOVE the F4 ceiling line inside the shaft — it points at Floor M
// before the player knows Floor M exists. Registered as the 'cable_trays'
// room builder (data/rooms.js → office_floor4); positions are relative to
// the floor base (roomsLoader applies yOffset).
export function buildCableTrays() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x23282e, roughness: 0.85, metalness: 0.25 });
  const TRAY_Y = 3.55;                 // just under the 3.8 wall top
  const HUB = { x: 12.3, z: -7.6 };    // elevator shaft centerline

  // One tray run = a long flat box + 3 cable tubes resting in it.
  function addRun(x0, z0, x1, z1) {
    const dx = x1 - x0, dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, dz);
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, len), mat);
    tray.position.set(cx, TRAY_Y, cz);
    tray.rotation.y = yaw;
    group.add(tray);
    for (let i = 0; i < 3; i++) {
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, len - 0.1, 6), mat);
      tube.rotation.x = Math.PI / 2;                  // along local Z
      const holder = new THREE.Group();
      holder.add(tube);
      holder.position.set(cx, TRAY_Y + 0.09, cz);
      holder.rotation.y = yaw;
      tube.position.x = (i - 1) * 0.12;
      group.add(holder);
    }
  }

  // Four runs along the ceiling edges, all draining toward the shaft.
  addRun(-17.0, -17.6, HUB.x, -17.6);          // north edge, west→east
  addRun(HUB.x, -17.6, HUB.x, HUB.z);          // east side, north edge → shaft
  addRun(-17.6, 12.0, -17.6, HUB.z);           // west edge, south→north
  addRun(-17.6, HUB.z, HUB.x, HUB.z);          // straight west→shaft feeder
  addRun(HUB.x, 16.8, HUB.x, HUB.z);           // east side, south edge → shaft

  // Vertical run: the bundle turns 90° at the shaft and climbs past the
  // F4 ceiling line (wall top 3.8, ceiling ~4.0) — visible through the
  // shaft glass, terminating out of sight above.
  for (let i = 0; i < 5; i++) {
    const rise = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.6, 6), mat);
    rise.position.set(HUB.x - 0.3 + i * 0.15, TRAY_Y + 2.3, HUB.z + 0.55);
    group.add(rise);
  }
  const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.16, 0.22), mat);
  clamp.position.set(HUB.x, TRAY_Y + 1.6, HUB.z + 0.55);
  group.add(clamp);
  const clamp2 = clamp.clone();
  clamp2.position.y = TRAY_Y + 3.4;
  group.add(clamp2);

  return group;
}
