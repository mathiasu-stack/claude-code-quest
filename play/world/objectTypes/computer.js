// computer.js — workstation interactable. Sits on a desk, screen wakes
// up when the player enters range, opens a "terminal" lesson overlay
// when interacted with.

import * as THREE from 'three';
import { registerInteractable } from '../interactables.js';

export function buildComputer({
  scene, position, lookAt = 0, chapterId, lessonId, onInteract,
}) {
  const g = new THREE.Group();
  g.position.set(position[0], position[1] ?? 0.78, position[2]);
  g.rotation.y = lookAt;
  scene.add(g);

  // Desk under the computer (small, just enough to anchor the screen).
  const desk = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.05, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.7 }),
  );
  desk.position.y = 0.02;
  g.add(desk);

  // Monitor stand
  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.10, 0.18, 12),
    new THREE.MeshStandardMaterial({ color: 0x222, metalness: 0.4, roughness: 0.4 }),
  );
  stand.position.y = 0.13;
  g.add(stand);

  // Monitor housing
  const housing = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.45, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x111, metalness: 0.6, roughness: 0.4 }),
  );
  housing.position.set(0, 0.46, 0);
  g.add(housing);

  // Screen — emissive plane that glows when the player approaches.
  // Initial state: dim. When in range, emissive ramps up to 0.85.
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x4fc3f7,
    emissive: 0x4fc3f7,
    emissiveIntensity: 0.25,    // starts dim ("standby")
    roughness: 0.4,
    metalness: 0,
  });
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.66, 0.40),
    screenMat,
  );
  screen.position.set(0, 0.46, 0.03);
  g.add(screen);

  // Keyboard
  const keyboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.025, 0.18),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.3, roughness: 0.6 }),
  );
  keyboard.position.set(0, 0.06, 0.20);
  g.add(keyboard);

  // Mouse
  const mouse = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.025, 0.10),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.3, roughness: 0.6 }),
  );
  mouse.position.set(0.30, 0.06, 0.20);
  g.add(mouse);

  // Register as interactable. Glow under the desk.
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

  // Wake-up animation when in range — boost screen emissive intensity.
  // The interactables system updates `it.isHovered` via the hover state;
  // we read that each frame via a small ticker. Since interactables
  // doesn't expose a ticker hook, we attach to play.js's main update
  // through the returned update() function.
  const out = {
    group: g,
    interactable: it,
    update(dt, hovered) {
      // hovered === true when this object is the nearest interactable.
      const target = hovered ? 0.95 : 0.25;
      screenMat.emissiveIntensity += (target - screenMat.emissiveIntensity) * (1 - Math.exp(-dt * 6));
    },
  };
  return out;
}
