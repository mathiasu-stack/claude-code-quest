// computer.js — interactable visitor info kiosk. Tall brushed-metal
// pedestal with a screen on top at eye level. Screen wakes up when the
// player enters range; opens the chapter overlay on E.
//
// (Previously this was a tiny desk-mounted PC meant to sit on top of an
// existing desk in the world. The lobby cleanup removed the host desk,
// so the builder was restructured to be self-supporting at a natural
// standing height instead of either floating or lying flat on the floor.)

import * as THREE from 'three';
import { registerInteractable } from '../interactables.js';

export function buildComputer({
  scene, position, lookAt = 0, chapterId, lessonId, onInteract,
}) {
  const g = new THREE.Group();
  g.position.set(position[0], position[1] ?? 0, position[2]);
  g.rotation.y = lookAt;
  scene.add(g);

  // Pedestal — main column the screen sits on. Brushed-graphite metal
  // so it reads as a museum / lobby info kiosk rather than a desk.
  const PED_H = 0.95;
  const pedestal = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, PED_H, 0.45),
    new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.55, roughness: 0.45 }),
  );
  pedestal.position.y = PED_H / 2;
  pedestal.castShadow = true; pedestal.receiveShadow = true;
  g.add(pedestal);

  // Foot ring — small flare at the base so the pedestal looks anchored
  // rather than dropped flat on the floor.
  const foot = new THREE.Mesh(
    new THREE.BoxGeometry(0.70, 0.06, 0.55),
    new THREE.MeshStandardMaterial({ color: 0x1c1c1c, metalness: 0.6, roughness: 0.5 }),
  );
  foot.position.y = 0.03;
  g.add(foot);

  // Top plate — darker cap where the monitor mounts.
  const topPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.04, 0.50),
    new THREE.MeshStandardMaterial({ color: 0x263238, metalness: 0.70, roughness: 0.40 }),
  );
  topPlate.position.y = PED_H + 0.02;
  g.add(topPlate);

  // Monitor mounted on top of the pedestal. Base offset = PED_H + plate.
  const baseY = PED_H + 0.04;

  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.10, 0.18, 12),
    new THREE.MeshStandardMaterial({ color: 0x222, metalness: 0.4, roughness: 0.4 }),
  );
  stand.position.y = baseY + 0.09;
  g.add(stand);

  const housing = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.45, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x111, metalness: 0.6, roughness: 0.4 }),
  );
  housing.position.set(0, baseY + 0.42, 0);
  g.add(housing);

  // Screen — emissive plane that glows brighter when the player approaches.
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x4fc3f7,
    emissive: 0x4fc3f7,
    emissiveIntensity: 0.25,
    roughness: 0.4,
    metalness: 0,
  });
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.66, 0.40),
    screenMat,
  );
  screen.position.set(0, baseY + 0.42, 0.03);
  g.add(screen);

  // Small underlit accent strip below the screen — reads as a status
  // indicator and helps glue the screen to the pedestal visually.
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x4fc3f7, emissive: 0x4fc3f7, emissiveIntensity: 0.55, roughness: 0.4,
  });
  const accent = new THREE.Mesh(
    new THREE.PlaneGeometry(0.40, 0.025),
    accentMat,
  );
  accent.position.set(0, PED_H - 0.10, 0.226);
  g.add(accent);

  // Register as interactable. Glow under the pedestal.
  const it = registerInteractable({
    mesh: g,
    kind: 'Computer',
    position: [position[0], position[2]],
    radius: 1.8,
    glowSize: 1.6,
    glowColor: 0x80d8ff,
    parent: scene,
    getPromptText: () => 'Press E to use the computer',
    onInteract: () => {
      if (onInteract) onInteract({ kind: 'computer', chapterId, lessonId });
    },
  });

  // Wake-up animation when in range — boost screen + accent emissive.
  const out = {
    group: g,
    interactable: it,
    update(dt, hovered) {
      const k = 1 - Math.exp(-dt * 6);
      const sTarget = hovered ? 0.95 : 0.25;
      screenMat.emissiveIntensity += (sTarget - screenMat.emissiveIntensity) * k;
      const aTarget = hovered ? 0.95 : 0.55;
      accentMat.emissiveIntensity += (aTarget - accentMat.emissiveIntensity) * k;
    },
  };
  return out;
}
