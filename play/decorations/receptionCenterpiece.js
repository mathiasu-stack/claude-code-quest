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
import { placeCompoundChild } from '../world/compoundChildren.js?v=20260528g';

const OWNER = 'reception_centerpiece';

export function buildReceptionCenterpiece(scene, decoTickers) {
  const group = new THREE.Group();
  group.position.set(0, 0, 1); // a metre south of room centre

  // Plinth — brushed silver column + glass disc top, reads as a modern
  // corporate awards sculpture rather than the previous "black bowl".
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xb8c0c8, metalness: 0.85, roughness: 0.32,
  });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.55, 32), baseMat);
  base.position.y = 0.275;
  base.castShadow = true; base.receiveShadow = true;
  group.add(base);
  // Pinch-waist trim band for visual interest
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(0.78, 0.78, 0.04, 32),
    new THREE.MeshStandardMaterial({ color: 0x6a6a6a, metalness: 0.9, roughness: 0.2 }),
  );
  band.position.y = 0.46;
  group.add(band);
  // Glass disc top — clear, slight tint, with a brass ring around it
  const topPlate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.85, 0.05, 32),
    new THREE.MeshStandardMaterial({
      color: 0xe6f0fa, metalness: 0.6, roughness: 0.05,
      transparent: true, opacity: 0.6,
    }),
  );
  topPlate.position.y = 0.555;
  group.add(topPlate);
  const topRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.86, 0.04, 12, 32),
    new THREE.MeshStandardMaterial({ color: 0xc9a44c, metalness: 0.92, roughness: 0.15 }),
  );
  topRing.rotation.x = Math.PI / 2;
  topRing.position.y = 0.555;
  group.add(topRing);

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

  // Brand name plate facing the entrance (south-facing). Previously
  // the plate was transparent and sat 0.86 m forward of the K sculpture,
  // so the gold bars behind composited through and washed out the
  // "KEDASH" word from the player's POV. Switched to opaque material +
  // 2× canvas resolution + heavier wordmark; pushed the plate further
  // out so it stands clearly in front of the K.
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0a0a14'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = '#c9a44c'; ctx.lineWidth = 10;
  ctx.strokeRect(12, 12, c.width - 24, c.height - 24);
  ctx.fillStyle = '#ffd76b';
  ctx.font = '900 130px "Cinzel", "Trajan Pro", Georgia, serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('KEDASH', c.width / 2, c.height * 0.42);
  ctx.fillStyle = '#fff8e0';
  ctx.font = '44px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('Empowering Engineers Since Now™', c.width / 2, c.height * 0.78);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 0.48),
    new THREE.MeshBasicMaterial({ map: tex }), // opaque — no composite through to the K bars
  );
  plate.position.set(0, 0.52, 0.94);
  group.add(plate);

  placeCompoundChild(scene, group, OWNER, 'k_sculpture');

  decoTickers.push((dt, now) => {
    kPivot.rotation.y = now * 0.0005;
  });

  return group;
}
