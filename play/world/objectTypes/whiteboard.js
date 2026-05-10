// whiteboard.js — interactable whiteboard. Walk up, press E, opens
// the lesson overlay styled as a digital whiteboard with diagrams
// appearing as the lesson plays.

import * as THREE from 'three';
import { registerInteractable } from '../interactables.js';

export function buildWhiteboardObject({
  scene, position, lookAt = 0, chapterId, lessonId, onInteract,
}) {
  const g = new THREE.Group();
  g.position.set(position[0], 0, position[2]);
  g.rotation.y = lookAt;
  scene.add(g);

  // Frame — wood-coloured edge
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 1.4, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.5 }),
  );
  frame.position.set(0, 1.6, 0);
  g.add(frame);

  // Whiteboard surface — flat white emissive plane
  const surfMat = new THREE.MeshStandardMaterial({
    color: 0xfafafa,
    emissive: 0xfafafa,
    emissiveIntensity: 0.2,    // ramps up when hovered
    roughness: 0.4,
  });
  const surf = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 1.2),
    surfMat,
  );
  surf.position.set(0, 1.6, 0.04);
  g.add(surf);

  // Marker tray
  const tray = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.06, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.5 }),
  );
  tray.position.set(0, 0.92, 0.04);
  g.add(tray);

  // Markers (red, blue, black)
  const markers = [0xe53935, 0x1e88e5, 0x212121];
  markers.forEach((c, i) => {
    const marker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.10, 8),
      new THREE.MeshStandardMaterial({ color: c }),
    );
    marker.rotation.z = Math.PI / 2;
    marker.position.set(-0.20 + i * 0.10, 0.96, 0.06);
    g.add(marker);
  });

  registerInteractable({
    mesh: g,
    kind: 'Whiteboard',
    position: [position[0], position[2]],
    radius: 1.8,
    glowSize: 2.4,
    glowColor: 0xb6e0ff,
    parent: scene,
    getPromptText: () => 'Press E to use the whiteboard',
    onInteract: () => {
      if (onInteract) onInteract({ kind: 'whiteboard', chapterId, lessonId });
    },
  });

  return {
    group: g,
    update(dt, hovered) {
      const target = hovered ? 0.65 : 0.20;
      surfMat.emissiveIntensity += (target - surfMat.emissiveIntensity) * (1 - Math.exp(-dt * 5));
    },
  };
}
