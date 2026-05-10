// phone.js — desk phone interactable. Walk up, press E, opens the
// lesson overlay styled as an "incoming call" with a colleague's voice.

import * as THREE from 'three';
import { registerInteractable } from '../interactables.js';

export function buildPhone({
  scene, position, lookAt = 0, chapterId, lessonId, onInteract,
}) {
  const g = new THREE.Group();
  g.position.set(position[0], position[1] ?? 0.78, position[2]);
  g.rotation.y = lookAt;
  scene.add(g);

  // Base body
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.06, 0.20),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.4, roughness: 0.4 }),
  );
  base.position.y = 0.03;
  g.add(base);

  // Number pad — small canvas-textured plane
  const pad = new THREE.Mesh(
    new THREE.PlaneGeometry(0.25, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x6a6a6a, roughness: 0.6 }),
  );
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(0, 0.061, -0.02);
  g.add(pad);

  // Handset cradle (thin box on top)
  const cradle = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.08, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x222, metalness: 0.4, roughness: 0.4 }),
  );
  cradle.position.set(0, 0.10, 0.06);
  g.add(cradle);

  // Indicator light — flashing red when "incoming call"
  const light = new THREE.Mesh(
    new THREE.SphereGeometry(0.012, 8, 6),
    new THREE.MeshStandardMaterial({
      color: 0xff3333, emissive: 0xff3333, emissiveIntensity: 0.6,
    }),
  );
  light.position.set(0.12, 0.062, -0.06);
  g.add(light);

  registerInteractable({
    mesh: g,
    kind: 'Phone',
    position: [position[0], position[2]],
    radius: 1.5,
    glowSize: 1.4,
    glowColor: 0xff8888,
    parent: scene,
    getPromptText: () => 'Press E to answer the call',
    onInteract: () => {
      if (onInteract) onInteract({ kind: 'phone', chapterId, lessonId });
    },
  });

  return {
    group: g,
    update(dt, hovered, now) {
      // Blink indicator light to suggest incoming call.
      const t = (now ?? performance.now()) * 0.005;
      light.material.emissiveIntensity = 0.4 + (Math.sin(t) * 0.5 + 0.5) * 0.6;
    },
  };
}
