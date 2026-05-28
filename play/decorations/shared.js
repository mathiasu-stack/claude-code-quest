// shared.js — small reusable decoration primitives used by Reception and
// Library decorators. Keep each one in <30 lines and avoid heavy
// allocations (cache materials where possible).
//
// Each builder that has a matching Meshy GLB tries makeDecoration()
// first and only falls back to its procedural geometry if the asset
// failed to preload.

import * as THREE from 'three';
import { makeDecoration } from './decorationAssets.js?v=20260528j';

const _matCache = new Map();
function mat(key, ctor) {
  if (!_matCache.has(key)) _matCache.set(key, ctor());
  return _matCache.get(key);
}

// ── Helpers ─────────────────────────────────────────────────────────────────
export function buildMug(color = 0xffffff, accent = null) {
  const glb = makeDecoration('mug', { width: 0.10, height: 0.12, depth: 0.10 });
  if (glb) return glb;
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.05, 0.12, 14),
    new THREE.MeshStandardMaterial({ color, roughness: 0.85 }),
  );
  body.position.y = 0.06; body.castShadow = true; g.add(body);
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.04, 0.012, 8, 16),
    new THREE.MeshStandardMaterial({ color, roughness: 0.85 }),
  );
  handle.rotation.y = Math.PI / 2;
  handle.position.set(0.07, 0.06, 0);
  g.add(handle);
  if (accent != null) {
    const stripe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.061, 0.061, 0.02, 14),
      new THREE.MeshStandardMaterial({ color: accent, roughness: 0.6 }),
    );
    stripe.position.y = 0.1; g.add(stripe);
  }
  return g;
}

export function buildPenCup() {
  const glb = makeDecoration('pen_cup', { width: 0.10, height: 0.20, depth: 0.10 });
  if (glb) return glb;
  const g = new THREE.Group();
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.045, 0.1, 14),
    new THREE.MeshStandardMaterial({ color: 0x424242, roughness: 0.7 }),
  );
  cup.position.y = 0.05; g.add(cup);
  const colors = [0x1976d2, 0xd32f2f, 0x388e3c, 0xfbc02d];
  for (let i = 0; i < 4; i++) {
    const pen = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.004, 0.14, 6),
      new THREE.MeshStandardMaterial({ color: colors[i] }),
    );
    pen.position.set((i - 1.5) * 0.012, 0.12, (i % 2) * 0.005);
    pen.rotation.z = (i - 1.5) * 0.05;
    g.add(pen);
  }
  return g;
}

export function buildStapler() {
  const glb = makeDecoration('stapler', { width: 0.18, height: 0.07, depth: 0.08 });
  if (glb) return glb;
  const g = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.05, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x424242, metalness: 0.55, roughness: 0.4 }),
  );
  base.position.y = 0.025; g.add(base);
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.04, 0.07),
    new THREE.MeshStandardMaterial({ color: 0xc62828, metalness: 0.4, roughness: 0.4 }),
  );
  top.position.y = 0.07; top.position.x = 0.01; top.rotation.z = -0.08;
  g.add(top);
  return g;
}

export function buildStickyPad() {
  const g = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.025, 0.1),
    new THREE.MeshStandardMaterial({ color: 0xfff59d, roughness: 0.95 }),
  );
  g.position.y = 0.012; return g;
}

export function buildLaptopOpen() {
  const glb = makeDecoration('laptop', { width: 0.36, height: 0.26, depth: 0.26 });
  if (glb) return glb;
  const g = new THREE.Group();
  const matBody = new THREE.MeshStandardMaterial({ color: 0xb0bec5, metalness: 0.7, roughness: 0.3 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.02, 0.26), matBody);
  base.position.y = 0.01; g.add(base);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.02), matBody);
  screen.position.set(0, 0.13, -0.13);
  screen.rotation.x = -0.18;
  g.add(screen);
  const screenFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.32, 0.2),
    new THREE.MeshBasicMaterial({ color: 0x4fc3f7 }),
  );
  screenFace.position.set(0, 0.13, -0.118);
  screenFace.rotation.x = -0.18;
  g.add(screenFace);
  return g;
}

export function buildPaperStack(count = 3) {
  const glb = makeDecoration('paper_stack', { width: 0.20, height: 0.04, depth: 0.26 });
  if (glb) return glb;
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const sheet = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.005, 0.22),
      new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.95 }),
    );
    sheet.position.set((Math.random() - 0.5) * 0.02, i * 0.006, (Math.random() - 0.5) * 0.02);
    sheet.rotation.y = (Math.random() - 0.5) * 0.06;
    g.add(sheet);
  }
  return g;
}

export function buildPlantTall() {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.18, 0.4, 14),
    new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.85 }),
  );
  pot.position.y = 0.2; pot.castShadow = true; g.add(pot);
  // Trunk
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.05, 0.6, 8),
    new THREE.MeshStandardMaterial({ color: 0x4e342e }),
  );
  trunk.position.y = 0.7; g.add(trunk);
  // Leafy crown — 3 cones stacked
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32 });
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.4 - i * 0.07, 0.45, 12), leafMat);
    cone.position.y = 1.05 + i * 0.18;
    cone.castShadow = true;
    g.add(cone);
  }
  return g;
}

export function buildPlantSucculent() {
  const glb = makeDecoration('succulent', { width: 0.18, height: 0.18, depth: 0.18 });
  if (glb) return glb;
  return buildPlantSucculentProcedural();
}
function buildPlantSucculentProcedural() {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.08, 0.1, 12),
    new THREE.MeshStandardMaterial({ color: 0xe57373, roughness: 0.7 }),
  );
  pot.position.y = 0.05; g.add(pot);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x66bb6a, roughness: 0.6 });
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), leafMat);
  center.position.y = 0.1; g.add(center);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), leafMat);
    leaf.position.set(Math.cos(a) * 0.06, 0.11, Math.sin(a) * 0.06);
    leaf.scale.set(0.6, 1.4, 0.6);
    g.add(leaf);
  }
  return g;
}

export function buildPlantHanging() {
  const glb = makeDecoration('hanging_plant', { width: 0.50, height: 0.80, depth: 0.50 });
  if (glb) return glb;
  return buildPlantHangingProcedural();
}
function buildPlantHangingProcedural() {
  const g = new THREE.Group();
  // Cord from the pot up to the ceiling — without this the plant
  // appeared to float ("flying stool" feedback from playtest). Both
  // placements (reception y=3.6, library y=3.4) leave ~0.2-0.4m to the
  // ceiling above; 0.5m of cord covers either and disappears slightly
  // into the ceiling, reading as anchored.
  const cord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 }),
  );
  cord.position.y = 0.25; // group-local — runs from pot top (~0) up to 0.5
  g.add(cord);
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.13, 0.2, 14),
    new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.7 }),
  );
  pot.position.y = -0.1; g.add(pot);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x43a047, roughness: 0.6 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const vine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.005, 0.4 + Math.random() * 0.2, 6),
      leafMat,
    );
    vine.position.set(Math.cos(a) * 0.13, -0.3, Math.sin(a) * 0.13);
    vine.rotation.z = Math.cos(a) * 0.2;
    vine.rotation.x = Math.sin(a) * 0.2;
    g.add(vine);
  }
  return g;
}

export function buildClock() {
  const g = new THREE.Group();
  const face = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.04, 24),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }),
  );
  face.rotation.x = Math.PI / 2;
  g.add(face);
  // Hour markers (12 small dashes)
  const tickMat = new THREE.MeshStandardMaterial({ color: 0x1a2744 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.005, 0.012), tickMat);
    tick.position.set(Math.sin(a) * 0.24, 0.025, Math.cos(a) * 0.24);
    tick.rotation.y = -a;
    g.add(tick);
  }
  // Hour + minute hand
  const handMat = new THREE.MeshStandardMaterial({ color: 0x1a2744 });
  const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.005, 0.16), handMat);
  hourHand.position.set(0, 0.025, -0.08);
  g.add(hourHand);
  const minHand = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.005, 0.22), handMat);
  minHand.position.set(0, 0.027, -0.11);
  g.add(minHand);
  // Pivot for animation
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xc9a44c, metalness: 0.8 }));
  center.position.y = 0.03; g.add(center);
  // Stamp the hand meshes so play.js can rotate them.
  g.userData.hourHand = hourHand;
  g.userData.minHand = minHand;
  return g;
}

export function buildPosterTexture(title, subtitle, accentHex = '#c9a44c') {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 768;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, '#1a2744'); grad.addColorStop(1, '#2d4263');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, c.width, c.height);
  // Big bold title
  ctx.fillStyle = accentHex;
  ctx.font = 'bold 140px serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, c.width / 2, c.height * 0.4);
  // Subtitle
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 38px sans-serif';
  ctx.fillText(subtitle, c.width / 2, c.height * 0.55);
  // Border
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 12;
  ctx.strokeRect(20, 20, c.width - 40, c.height - 40);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Open book — rectangle base with page rectangles drawn on top.
export function buildOpenBook() {
  const g = new THREE.Group();
  const cover = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.02, 0.26),
    new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.85 }),
  );
  cover.position.y = 0.01; g.add(cover);
  const pages = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.025, 0.24),
    new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.9 }),
  );
  pages.position.y = 0.022; g.add(pages);
  // Center crease
  const crease = new THREE.Mesh(
    new THREE.BoxGeometry(0.005, 0.001, 0.24),
    new THREE.MeshStandardMaterial({ color: 0xc8c8c8 }),
  );
  crease.position.y = 0.035; g.add(crease);
  return g;
}

export function buildBookmark(color = 0xc62828) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.04, 0.001),
    new THREE.MeshStandardMaterial({ color }),
  );
  return m;
}

export function buildArmchair() {
  const g = new THREE.Group();
  const matFabric = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.95 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.85), matFabric);
  seat.position.y = 0.4; seat.castShadow = true; g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.85, 0.18), matFabric);
  back.position.set(0, 0.85, -0.33); g.add(back);
  const armGeom = new THREE.BoxGeometry(0.16, 0.45, 0.85);
  const lA = new THREE.Mesh(armGeom, matFabric); lA.position.set(-0.45, 0.55, 0); g.add(lA);
  const rA = new THREE.Mesh(armGeom, matFabric); rA.position.set(0.45, 0.55, 0); g.add(rA);
  return g;
}

export function buildGlobe() {
  const g = new THREE.Group();
  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.18, 0.04, 16),
    new THREE.MeshStandardMaterial({ color: 0x6d4c41 }),
  );
  stand.position.y = 0.02; g.add(stand);
  const ax = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x6d4c41 }),
  );
  ax.position.y = 0.27; ax.rotation.z = 0.4; g.add(ax);
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 24, 16),
    new THREE.MeshStandardMaterial({ color: 0x1976d2, roughness: 0.6 }),
  );
  ball.position.y = 0.3; g.add(ball);
  // A few "continents" — small darker patches
  for (let i = 0; i < 5; i++) {
    const a = Math.random() * Math.PI * 2;
    const b = (Math.random() - 0.5) * Math.PI;
    const patch = new THREE.Mesh(
      new THREE.SphereGeometry(0.06 + Math.random() * 0.04, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0x33691e, roughness: 0.7 }),
    );
    patch.position.set(
      Math.cos(a) * Math.cos(b) * 0.18,
      0.3 + Math.sin(b) * 0.18,
      Math.sin(a) * Math.cos(b) * 0.18,
    );
    patch.scale.set(1, 0.4, 0.7);
    g.add(patch);
  }
  ball.userData.spin = true;
  g.userData.ball = ball;
  return g;
}

export function buildLadder(height = 2.6) {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.85 });
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, height, 0.06), wood);
  rail.position.set(-0.18, height / 2, 0); g.add(rail);
  const railR = rail.clone(); railR.position.x = 0.18; g.add(railR);
  const rungs = Math.floor(height / 0.32);
  for (let i = 0; i < rungs; i++) {
    const rung = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.06), wood);
    rung.position.y = 0.2 + i * 0.32;
    g.add(rung);
  }
  return g;
}

export function buildGrandfatherClock() {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.7 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.4, 0.4), wood);
  body.position.y = 1.2; body.castShadow = true; g.add(body);
  const face = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.04, 24),
    new THREE.MeshStandardMaterial({ color: 0xfff8e1, roughness: 0.6 }),
  );
  face.rotation.x = Math.PI / 2;
  face.position.set(0, 2.0, 0.21); g.add(face);
  const handMat = new THREE.MeshStandardMaterial({ color: 0x1a2744 });
  const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.005, 0.13), handMat);
  hourHand.position.set(0, 2.0, 0.235);
  g.add(hourHand);
  const minHand = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.005, 0.18), handMat);
  minHand.position.set(0, 2.0, 0.235);
  g.add(minHand);
  // Pendulum
  const pend = new THREE.Group();
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.7, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xc9a44c, metalness: 0.8 }));
  arm.position.y = -0.35; pend.add(arm);
  const bob = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 16),
    new THREE.MeshStandardMaterial({ color: 0xc9a44c, metalness: 0.85 }));
  bob.position.y = -0.7; pend.add(bob);
  pend.position.set(0, 1.0, 0.21);
  g.add(pend);
  g.userData.pendulum = pend;
  g.userData.hourHand = hourHand;
  g.userData.minHand = minHand;
  return g;
}

export function buildSidetable() {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x6d4c41 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 16), wood);
  top.position.y = 0.5; g.add(top);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 10), wood);
  post.position.y = 0.25; g.add(post);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.04, 16), wood);
  base.position.y = 0.02; g.add(base);
  return g;
}

export function buildBookStack(count = 5) {
  const g = new THREE.Group();
  const colors = [0xb71c1c, 0x1a237e, 0x33691e, 0xff6f00, 0x4a148c, 0x004d40];
  let y = 0;
  for (let i = 0; i < count; i++) {
    const h = 0.04 + Math.random() * 0.02;
    const w = 0.18 + Math.random() * 0.06;
    const d = 0.22 + Math.random() * 0.05;
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.8 }),
    );
    book.position.y = y + h / 2;
    book.rotation.y = (Math.random() - 0.5) * 0.18;
    g.add(book);
    y += h;
  }
  return g;
}

export function buildLibraryCart() {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.6 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.4), metal);
  top.position.y = 0.55; g.add(top);
  const mid = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.4), metal);
  mid.position.y = 0.3; g.add(mid);
  // 4 wheels
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222 });
  for (const [x, z] of [[-0.3,-0.18],[0.3,-0.18],[-0.3,0.18],[0.3,0.18]]) {
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), wheelMat);
    w.position.set(x, 0.04, z); g.add(w);
  }
  // Books on top
  const stack = buildBookStack(4);
  stack.position.set(0, 0.57, 0); g.add(stack);
  return g;
}

// Skirting board — single thin strip along a wall edge.
export function buildSkirting(length, position, rotationY = 0) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(length, 0.12, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.7 }),
  );
  m.position.set(position[0], 0.06, position[1]);
  m.rotation.y = rotationY;
  return m;
}

// Throw pillow on a couch.
export function buildPillow(color) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.18, 0.32),
    new THREE.MeshStandardMaterial({ color, roughness: 0.95 }),
  );
  return m;
}

// Doormat at the entrance.
export function buildDoormat() {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.012, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.95 }),
  );
  m.position.y = 0.006;
  return m;
}

// Recessed ceiling fixture — a small disc with a glow plane.
export function buildCeilingLight(emissiveStrength = 0.5) {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.04, 14),
    new THREE.MeshStandardMaterial({
      color: 0xffe4b5, emissive: 0xfff5d4, emissiveIntensity: emissiveStrength,
      metalness: 0.1, roughness: 0.4,
    }),
  );
  disc.rotation.x = 0; // already flat with cylinder default
  g.add(disc);
  return g;
}

// Server tower with blinking LED row (returns the LED mesh too).
export function buildServerTower() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.7, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.55, roughness: 0.4 }),
  );
  body.position.y = 0.35; g.add(body);
  // Vent slats
  const ventMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
  for (let i = 0; i < 8; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.012, 0.005), ventMat);
    slat.position.set(0, 0.35 + (i - 4) * 0.04, 0.205); g.add(slat);
  }
  // LED row
  const leds = [];
  const ledMat = new THREE.MeshStandardMaterial({ color: 0x4caf50, emissive: 0x4caf50, emissiveIntensity: 0.8 });
  for (let i = 0; i < 5; i++) {
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.011, 6, 6), ledMat.clone());
    led.position.set(-0.13 + i * 0.045, 0.62, 0.205); g.add(led);
    leds.push(led);
  }
  g.userData.leds = leds;
  return g;
}

// Whiteboard — drawn with marker text on canvas.
export function buildWhiteboard(text = 'Q4 GOALS\n• Ship 16 chapters\n• Hire 3\n• Coffee') {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fafafa'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, c.width - 16, c.height - 16);
  ctx.fillStyle = '#1565c0';
  ctx.font = 'bold 60px sans-serif';
  const lines = text.split('\n');
  lines.forEach((line, i) => ctx.fillText(line, 50, 100 + i * 80));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 1.0),
    new THREE.MeshBasicMaterial({ map: tex }),
  );
}

// Demo screen — animated canvas (graphs / code that scrolls). Returns
// { mesh, tick } where tick(dt, now) updates the texture every ~0.4s.
export function buildDemoScreen(kind = 'graph') {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 192;
  const ctx = c.getContext('2d');
  let lastUpdate = -Infinity;

  function render(now) {
    if (kind === 'graph') {
      ctx.fillStyle = '#0d1024'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 2;
      ctx.beginPath();
      const offset = (now * 0.05) % c.width;
      for (let x = 0; x < c.width; x++) {
        const phase = (x + offset) * 0.05;
        const y = c.height / 2 + Math.sin(phase) * 20 + Math.sin(phase * 0.3) * 30;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = '12px monospace';
      ctx.fillText('DEMO MODE', 10, 16);
    } else if (kind === 'code') {
      ctx.fillStyle = '#0d1024'; ctx.fillRect(0, 0, c.width, c.height);
      const colors = ['#80cbc4', '#ce93d8', '#ffe082', '#a5d6a7', '#ffab91'];
      ctx.font = '11px monospace';
      const offset = ((now * 0.04) % 16);
      for (let row = 0; row < 16; row++) {
        ctx.fillStyle = colors[(row * 7) % colors.length];
        const indent = (row % 3) * 12 + 6;
        const len = 10 + (row * 13) % 30;
        ctx.fillRect(indent, row * 12 - offset + 4, len * 4, 6);
      }
    } else {
      ctx.fillStyle = '#1a237e'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LIVE', c.width / 2, c.height / 2);
    }
  }
  render(0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return {
    canvas: c, texture: tex,
    tick(dt, nowMs) {
      if (nowMs - lastUpdate > 320) {
        render(nowMs);
        tex.needsUpdate = true;
        lastUpdate = nowMs;
      }
    },
  };
}
