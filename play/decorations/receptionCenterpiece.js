// receptionCenterpiece.js — central feature for Reception. Picked the
// rotating "K" sculpture over the seating cluster for branding payoff.
// Logged in NIGHT_RUN_NOTES_ENVIRONMENT.md.
//
// Components:
//   - circular brass plinth (low cylinder)
//   - 3D extruded "K" character mounted on the plinth, slowly rotating
//   - golden ring around the plinth at floor level
//   - small "KEDASH" name plate facing the entrance

import * as THREE from 'three';

export function buildReceptionCenterpiece(scene, decoTickers) {
  const group = new THREE.Group();
  group.position.set(0, 0, 1); // a metre south of room centre

  // Plinth — black marble base + brass top
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.3, roughness: 0.4 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.0, 0.5, 32), baseMat);
  base.position.y = 0.25;
  base.castShadow = true; base.receiveShadow = true;
  group.add(base);
  const topPlate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.85, 0.04, 32),
    new THREE.MeshStandardMaterial({ color: 0xc9a44c, metalness: 0.85, roughness: 0.18 }),
  );
  topPlate.position.y = 0.52;
  group.add(topPlate);

  // Floor ring (gold, slightly emissive so it reads as decorative).
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.5, 0.05, 12, 48),
    new THREE.MeshStandardMaterial({
      color: 0xc9a44c, emissive: 0xc9a44c, emissiveIntensity: 0.3,
      metalness: 0.85, roughness: 0.2,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  group.add(ring);

  // Kedash 'K' — built from boxes for the blocky aesthetic.
  const kPivot = new THREE.Group();
  kPivot.position.y = 1.7;
  group.add(kPivot);

  const kMat = new THREE.MeshStandardMaterial({
    color: 0xfff1c5, emissive: 0xc9a44c, emissiveIntensity: 0.45,
    metalness: 0.7, roughness: 0.3,
  });
  // Vertical stem of the K
  const stem = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.7, 0.22), kMat);
  stem.position.set(-0.35, 0, 0);
  stem.castShadow = true;
  kPivot.add(stem);
  // Upper diagonal of the K
  const upper = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.0, 0.18), kMat);
  upper.position.set(0.05, 0.4, 0);
  upper.rotation.z = Math.PI / 4;
  kPivot.add(upper);
  // Lower diagonal of the K
  const lower = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.0, 0.18), kMat);
  lower.position.set(0.05, -0.4, 0);
  lower.rotation.z = -Math.PI / 4;
  kPivot.add(lower);

  // Brand name plate facing the entrance (south-facing).
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0a0a14'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = '#c9a44c'; ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, c.width - 16, c.height - 16);
  ctx.fillStyle = '#c9a44c';
  ctx.font = 'bold 56px serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('KEDASH', c.width / 2, c.height * 0.4);
  ctx.fillStyle = '#fff';
  ctx.font = '22px sans-serif';
  ctx.fillText('Empowering Engineers Since Now™', c.width / 2, c.height * 0.7);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 0.42),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true }),
  );
  plate.position.set(0, 0.52, 0.86);
  group.add(plate);

  scene.add(group);

  decoTickers.push((dt, now) => {
    kPivot.rotation.y = now * 0.0005;
  });

  return group;
}
