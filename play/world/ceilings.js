// ceilings.js — ceilings, crown molding, and visible fixtures so the
// rooms read as proper rooms instead of open boxes.
//
// Each builder takes (scene) and a small config and adds geometry directly.

import * as THREE from 'three';
import { placeCompoundChild } from './compoundChildren.js?v=20260528g';

// Reception ceiling — drop-tile look. Procedural canvas grid texture
// keeps it cheap and zone-agnostic.
function dropTileTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f3eee0';
  ctx.fillRect(0, 0, c.width, c.height);
  // Grout lines
  ctx.strokeStyle = '#cbbb95';
  ctx.lineWidth = 6;
  for (let i = 0; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * c.height / 2);
    ctx.lineTo(c.width, i * c.height / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i * c.width / 2, 0);
    ctx.lineTo(i * c.width / 2, c.height);
    ctx.stroke();
  }
  // Subtle stippling per tile so it's not perfectly flat.
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  for (let i = 0; i < 80; i++) {
    ctx.fillRect(Math.random() * c.width, Math.random() * c.height, 2, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Library ceiling — wood beam lines on warm planks.
function woodBeamTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 512;
  const ctx = c.getContext('2d');
  // Warm plank base
  ctx.fillStyle = '#5a3724';
  ctx.fillRect(0, 0, c.width, c.height);
  // Plank seams
  ctx.fillStyle = '#3e2418';
  for (let i = 0; i < 5; i++) {
    const y = i * (c.height / 5);
    ctx.fillRect(0, y, c.width, 4);
  }
  // Subtle grain noise
  for (let i = 0; i < 300; i++) {
    ctx.fillStyle = `rgba(40,20,8,${0.05 + Math.random() * 0.1})`;
    ctx.fillRect(Math.random() * c.width, Math.random() * c.height, 1, 6);
  }
  // Cross beams (perpendicular to the planks)
  ctx.fillStyle = '#2a1810';
  for (let i = 1; i < 4; i++) {
    const x = i * (c.width / 4);
    ctx.fillRect(x - 6, 0, 12, c.height);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Air vent grille texture for vent panels.
function ventTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8b8b8b';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#3a3a3a';
  for (let i = 1; i < 8; i += 1) {
    ctx.fillRect(0, i * 8, c.width, 4);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// One recessed light fixture: small inset cylinder + bright disc + tiny
// emissive plane underneath. Each piece is tagged with a unique child
// id so the in-game editor can select / move / hide it.
function buildRecessedLight(scene, x, y, z, color = 0xfff3d0, strength = 1.4,
                            owner = null, idPrefix = 'recessed_light') {
  const ring = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.16, 0.06, 16),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.5, roughness: 0.4 }),
  );
  ring.position.set(x, y, z);
  if (owner) placeCompoundChild(scene, ring, owner, `${idPrefix}_ring`);
  else scene.add(ring);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(0.13, 20),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 }),
  );
  disc.rotation.x = Math.PI / 2; // point down
  disc.position.set(x, y - 0.034, z);
  if (owner) placeCompoundChild(scene, disc, owner, `${idPrefix}_disc`);
  else scene.add(disc);
  // Underlit halo (slightly larger, dimmer, gives bloom something to grab)
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(0.6, 0.6),
    new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.18 * strength, depthWrite: false,
    }),
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.set(x, y - 0.05, z);
  if (owner) placeCompoundChild(scene, halo, owner, `${idPrefix}_halo`);
  else scene.add(halo);
  return { ring, disc, halo };
}

// One air vent grille on a ceiling.
function buildVent(scene, x, y, z, ventTex, owner = null, id = 'vent') {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 0.4),
    new THREE.MeshStandardMaterial({ map: ventTex, metalness: 0.4, roughness: 0.7 }),
  );
  m.rotation.x = Math.PI / 2;
  m.position.set(x, y - 0.005, z);
  if (owner) placeCompoundChild(scene, m, owner, id);
  else scene.add(m);
}

// Crown molding — a thin trim where wall meets ceiling.
function buildCrownMolding(scene, lengths, ceilingY, color = 0x4e342e,
                           owner = null, idPrefix = 'molding') {
  // lengths is an array of segments, each { len, x, z, ry }
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
  let idx = 0;
  for (const seg of lengths) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(seg.len, 0.16, 0.06), mat);
    m.position.set(seg.x, ceilingY - 0.08, seg.z);
    m.rotation.y = seg.ry || 0;
    if (owner) placeCompoundChild(scene, m, owner, `${idPrefix}_${idx}`);
    else scene.add(m);
    idx++;
  }
}

export function buildReceptionCeiling(scene) {
  const ceilingY = 3.8;
  const tileTex = dropTileTexture();
  tileTex.repeat.set(6, 6);
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 22),
    new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.85 }),
  );
  ceiling.rotation.x = Math.PI / 2; // facing down
  ceiling.position.set(0, ceilingY, 0);
  ceiling.receiveShadow = true;
  scene.add(ceiling);

  // Crown molding around the perimeter (back wall + sides + front splits)
  buildCrownMolding(scene, [
    { len: 22, x: 0, z: -10.95, ry: 0 },
    { len: 22, x: 10.95, z: 0, ry: Math.PI / 2 },
    { len: 22, x: -10.95, z: 0, ry: Math.PI / 2 },
    { len: 8.5, x: -6.75, z: 10.95 },
    { len: 8.5, x: 6.75, z: 10.95 },
  ], ceilingY);

  // Recessed lights at desk + couch positions so the existing lighting
  // reads as coming from the ceiling.
  const lights = [
    [-4, ceilingY - 0.02, -4],
    [ 4, ceilingY - 0.02, -4],
    [-4, ceilingY - 0.02,  4],
    [ 4, ceilingY - 0.02,  4],
    [ 0, ceilingY - 0.02,  0],
    [ 0, ceilingY - 0.02, -8],
  ];
  for (const [x, y, z] of lights) buildRecessedLight(scene, x, y, z);

  // Air vents (decorative)
  const ventTex = ventTexture();
  buildVent(scene, -7, ceilingY - 0.001, -7, ventTex);
  buildVent(scene,  7, ceilingY - 0.001,  7, ventTex);
}

export function buildLibraryCeiling(scene) {
  const OWNER = 'library_ceiling';
  const ceilingY = 3.6; // Library reads cosier — slightly lower
  const beamTex = woodBeamTexture();
  beamTex.repeat.set(2, 2);
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 22),
    new THREE.MeshStandardMaterial({ map: beamTex, roughness: 0.9 }),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, ceilingY, 22);
  placeCompoundChild(scene, ceiling, OWNER, 'ceiling');

  // Heavy beams crossing the room (visual only) — the "black bars"
  // the user noticed they couldn't select before this refactor.
  const beamMat = new THREE.MeshStandardMaterial({ color: 0x2c1810, roughness: 0.6 });
  const beam1 = new THREE.Mesh(new THREE.BoxGeometry(22, 0.18, 0.32), beamMat);
  beam1.position.set(0, ceilingY - 0.08, 16);
  placeCompoundChild(scene, beam1, OWNER, 'beam_0');
  const beam2 = beam1.clone(); beam2.position.z = 22;
  placeCompoundChild(scene, beam2, OWNER, 'beam_1');
  const beam3 = beam1.clone(); beam3.position.z = 28;
  placeCompoundChild(scene, beam3, OWNER, 'beam_2');

  // Crown molding (matches the warm-wood feel)
  buildCrownMolding(scene, [
    { len: 8.5, x: -6.75, z: 32.95 },
    { len: 8.5, x:  6.75, z: 32.95 },
    { len: 22,  x: 10.95, z: 22, ry: Math.PI / 2 },
    { len: 22,  x: -10.95, z: 22, ry: Math.PI / 2 },
  ], ceilingY, 0x2c1810, OWNER, 'molding');

  // Hanging warm pendant lamps over the reading tables (additive; the
  // existing buildLamp light pool stays).
  let lampIdx = 0;
  for (const z of [16, 22]) {
    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 1.2, 6),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a }),
    );
    cord.position.set(0, ceilingY - 0.6, z);
    placeCompoundChild(scene, cord, OWNER, `pendant_${lampIdx}_cord`);
    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.22, 14, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0xffe0a3, side: THREE.DoubleSide,
        emissive: 0xffd084, emissiveIntensity: 0.5, roughness: 0.5,
      }),
    );
    shade.position.set(0, ceilingY - 1.1, z);
    placeCompoundChild(scene, shade, OWNER, `pendant_${lampIdx}_shade`);
    lampIdx++;
  }

  // Recessed lights along the perimeter for ambient glow
  const lights = [
    [-7, ceilingY - 0.02, 14],
    [ 7, ceilingY - 0.02, 14],
    [-7, ceilingY - 0.02, 30],
    [ 7, ceilingY - 0.02, 30],
  ];
  let lightIdx = 0;
  for (const [x, y, z] of lights) {
    buildRecessedLight(scene, x, y, z, 0xffd084, 1.0, OWNER, `recessed_${lightIdx}`);
    lightIdx++;
  }
}
