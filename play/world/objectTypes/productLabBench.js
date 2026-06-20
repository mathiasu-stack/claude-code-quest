// productLabBench.js — the capstone "Product Lab" workbench (reception).
//
// A freestanding desk with a glowing holo-emitter. Press E to open the
// Product Lab catalog overlay (play/ui/productLab.js) — but only once
// ch17-test is passed; before that it's a dim, locked prompt. The emitter
// brightens when the Lab unlocks, and a one-shot toast fires the first frame
// it sees the unlock. Modelled on playbookBoard.js (self-adds + self-registers
// its interactable; floor-tagged for single-floor culling).

import * as THREE from 'three';
import { registerInteractable } from '../interactables.js';

export function buildProductLabBench({ scene, position, rotY = 0, floor = 1, isUnlocked, onInteract, onFirstUnlock }) {
  const g = new THREE.Group();
  g.position.set(position[0], 0, position[2]);
  g.rotation.y = rotY;
  g.userData.floor = floor;
  scene.add(g);

  // Desk top + legs.
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x2a3346, roughness: 0.7, metalness: 0.2 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.8), deskMat);
  top.position.set(0, 0.92, 0); top.castShadow = true; g.add(top);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x1a2030, roughness: 0.5, metalness: 0.5 });
  const legGeo = new THREE.BoxGeometry(0.08, 0.92, 0.08);
  for (const [x, z] of [[-0.72, -0.34], [0.72, -0.34], [-0.72, 0.34], [0.72, 0.34]]) {
    const leg = new THREE.Mesh(legGeo, legMat); leg.position.set(x, 0.46, z); g.add(leg);
  }

  // Holo emitter base on the desk.
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x11151d, emissive: 0x2bd1c4, emissiveIntensity: 0.4, roughness: 0.3, metalness: 0.6,
  });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.05, 24), baseMat);
  base.position.set(0, 0.99, 0); g.add(base);

  // Floating "product" hologram — a rotating polyhedron + a halo ring.
  const holoMat = new THREE.MeshStandardMaterial({
    color: 0x8ef7ec, emissive: 0x2bd1c4, emissiveIntensity: 0.9,
    transparent: true, opacity: 0.85, roughness: 0.2,
  });
  const holo = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), holoMat);
  holo.position.set(0, 1.42, 0); g.add(holo);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x2bd1c4, emissive: 0x2bd1c4, emissiveIntensity: 0.7, transparent: true, opacity: 0.7,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.012, 8, 40), ringMat);
  ring.position.set(0, 1.42, 0); ring.rotation.x = Math.PI / 2; g.add(ring);

  const it = registerInteractable({
    mesh: g,
    kind: 'Product Lab',
    position: [position[0], position[2]],
    radius: 1.8,
    glowSize: 2.4,
    glowColor: 0x2bd1c4,
    parent: scene,
    getPromptText: () => ((isUnlocked && isUnlocked())
      ? 'Press E — open the Product Lab'
      : 'Press E — Product Lab (opens after Chapter 17)'),
    onInteract: () => { if (onInteract) onInteract(); },
  });
  if (it?.glow) it.glow.userData.floor = floor;

  let _t = 0;
  let _firedUnlock = false;
  return {
    group: g,
    update(dt) {
      _t += dt;
      holo.rotation.y += dt * 0.8;
      holo.rotation.x += dt * 0.3;
      holo.position.y = 1.42 + Math.sin(_t * 1.6) * 0.04;
      ring.rotation.z += dt * 0.5;
      const unlocked = !!(isUnlocked && isUnlocked());
      const tgt = unlocked ? 1.1 : 0.18;
      holoMat.emissiveIntensity += (tgt - holoMat.emissiveIntensity) * (1 - Math.exp(-dt * 3));
      baseMat.emissiveIntensity = unlocked ? (0.5 + Math.sin(_t * 2.2) * 0.2) : 0.12;
      if (unlocked && !_firedUnlock) {
        _firedUnlock = true;
        if (onFirstUnlock) { try { onFirstUnlock(); } catch {} }
      }
    },
  };
}
