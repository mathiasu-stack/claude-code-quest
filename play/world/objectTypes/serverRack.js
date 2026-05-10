// serverRack.js — interactable server rack for the NAS Capstone (ch16).
// Tall tower with blinking LEDs; on interact, opens a "diagnostic" UI.

import * as THREE from 'three';
import { registerInteractable } from '../interactables.js';

export function buildServerRack({
  scene, position, lookAt = 0, chapterId, lessonId, onInteract,
}) {
  const g = new THREE.Group();
  g.position.set(position[0], 0, position[2]);
  g.rotation.y = lookAt;
  scene.add(g);

  // Cabinet
  const cab = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 1.9, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x222, metalness: 0.7, roughness: 0.4 }),
  );
  cab.position.y = 0.95;
  cab.castShadow = true;
  g.add(cab);

  // Vent slats
  const ventMat = new THREE.MeshStandardMaterial({ color: 0x111 });
  for (let i = 0; i < 14; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.012, 0.005), ventMat);
    slat.position.set(0, 0.4 + i * 0.10, 0.305);
    g.add(slat);
  }

  // LED bank — 6 LEDs in a column
  const leds = [];
  for (let i = 0; i < 6; i++) {
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 8, 6),
      new THREE.MeshStandardMaterial({
        color: 0x4caf50, emissive: 0x4caf50, emissiveIntensity: 0.6,
      }),
    );
    led.position.set(0.30, 1.40 - i * 0.06, 0.31);
    g.add(led);
    leds.push(led);
  }

  registerInteractable({
    mesh: g,
    kind: 'Server',
    position: [position[0], position[2]],
    radius: 1.8,
    glowSize: 1.8,
    glowColor: 0x80ff90,
    parent: scene,
    getPromptText: () => 'Press E to run diagnostic',
    onInteract: () => {
      if (onInteract) onInteract({ kind: 'server', chapterId, lessonId });
    },
  });

  return {
    group: g,
    update(dt, hovered, now) {
      const t = (now ?? performance.now()) * 0.002;
      // LEDs flicker alternately
      leds.forEach((led, i) => {
        const phase = (t + i * 0.4) % 2;
        led.material.emissiveIntensity = phase < 1 ? 0.9 : (hovered ? 0.7 : 0.4);
      });
    },
  };
}
