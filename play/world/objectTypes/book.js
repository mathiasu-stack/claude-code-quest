// book.js — book on a podium / lectern. Walk up, press E, opens the
// lesson overlay styled as an open book.

import * as THREE from 'three';
import { registerInteractable } from '../interactables.js';

export function buildBook({
  scene, position, lookAt = 0, chapterId, lessonId, onInteract,
}) {
  const g = new THREE.Group();
  g.position.set(position[0], 0, position[2]);
  g.rotation.y = lookAt;
  scene.add(g);

  // Lectern — angled-top stand
  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.40, 1.0, 12),
    new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.6 }),
  );
  stand.position.y = 0.5;
  stand.castShadow = true;
  g.add(stand);

  // Top — angled platform
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.04, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.6 }),
  );
  top.position.y = 1.0;
  top.rotation.x = -0.18;
  g.add(top);

  // Book cover (closed)
  const book = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.05, 0.28),
    new THREE.MeshStandardMaterial({
      color: 0x6a1b1b, roughness: 0.5,
      emissive: 0x4a0a0a, emissiveIntensity: 0.15,
    }),
  );
  book.position.set(0, 1.06, 0);
  book.rotation.x = -0.18;
  book.castShadow = true;
  g.add(book);

  // Gold trim on book cover
  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.005, 0.24),
    new THREE.MeshStandardMaterial({ color: 0xc9a44c, metalness: 0.9, roughness: 0.2 }),
  );
  trim.position.set(0, 1.087, 0);
  trim.rotation.x = -0.18;
  g.add(trim);

  registerInteractable({
    mesh: g,
    kind: 'Book',
    position: [position[0], position[2]],
    radius: 1.6,
    glowSize: 1.4,
    glowColor: 0xffe0a0,
    parent: scene,
    getPromptText: () => 'Press E to read the book',
    onInteract: () => {
      if (onInteract) onInteract({ kind: 'book', chapterId, lessonId });
    },
  });

  return { group: g, update: () => {} };
}
