// demoScreen.js — large display panel. Walk up, press E, opens the
// lesson overlay styled as a video player.

import * as THREE from 'three';
import { registerInteractable } from '../interactables.js';

export function buildDemoScreenObject({
  scene, position, lookAt = 0, chapterId, lessonId, onInteract,
}) {
  const g = new THREE.Group();
  g.position.set(position[0], 0, position[2]);
  g.rotation.y = lookAt;
  scene.add(g);

  // Stand — chrome arm
  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.06, 1.4, 12),
    new THREE.MeshStandardMaterial({ color: 0xb8c0c8, metalness: 0.85, roughness: 0.25 }),
  );
  stand.position.y = 0.7;
  g.add(stand);

  // Foot
  const foot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.30, 0.30, 0.04, 16),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.6, roughness: 0.4 }),
  );
  foot.position.y = 0.02;
  g.add(foot);

  // Display housing
  const housing = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.9, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x111, metalness: 0.6, roughness: 0.3 }),
  );
  housing.position.y = 1.5;
  g.add(housing);

  // Screen — emissive bright with "DEMO" text
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0xffd54f,
    emissive: 0xffaa00,
    emissiveIntensity: 0.4,
    roughness: 0.3,
  });
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 0.82),
    screenMat,
  );
  screen.position.set(0, 1.5, 0.034);
  g.add(screen);

  registerInteractable({
    mesh: g,
    kind: 'Display',
    position: [position[0], position[2]],
    radius: 1.8,
    glowSize: 2.0,
    glowColor: 0xffd54f,
    parent: scene,
    getPromptText: () => 'Press E to watch the presentation',
    onInteract: () => {
      if (onInteract) onInteract({ kind: 'display', chapterId, lessonId });
    },
  });

  return {
    group: g,
    update(dt, hovered) {
      const target = hovered ? 1.0 : 0.4;
      screenMat.emissiveIntensity += (target - screenMat.emissiveIntensity) * (1 - Math.exp(-dt * 5));
    },
  };
}
