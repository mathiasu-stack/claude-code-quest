// dispatchBoard.js — interactable for ch14 "Subagents & Delegation".
//
// Wall-mounted "dispatch board" with three columns (TODO / IN PROGRESS /
// DONE) and coloured cards on each. Cards pulse when the player enters
// range to read as "live work". Press E to open the chapter overlay.

import * as THREE from 'three';
import { registerInteractable } from '../interactables.js';

export function buildDispatchBoard({
  scene, position, lookAt = 0, chapterId, lessonId, onInteract,
}) {
  const g = new THREE.Group();
  g.position.set(position[0], 0, position[2]);
  g.rotation.y = lookAt;
  scene.add(g);

  // Backboard — wide, dark cork-like surface.
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 1.6, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.85 }),
  );
  board.position.set(0, 1.7, 0);
  g.add(board);

  // Frame
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(2.74, 1.74, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x1c1c1c, metalness: 0.4, roughness: 0.5 }),
  );
  frame.position.set(0, 1.7, -0.02);
  g.add(frame);

  // Header bar
  const header = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 0.20),
    new THREE.MeshStandardMaterial({
      color: 0x0a0c12, emissive: 0xff7043, emissiveIntensity: 0.45, roughness: 0.5,
    }),
  );
  header.position.set(0, 2.36, 0.03);
  g.add(header);

  // Three column dividers (subtle lines)
  for (const x of [-0.40, 0.40]) {
    const divider = new THREE.Mesh(
      new THREE.PlaneGeometry(0.01, 1.20),
      new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.7 }),
    );
    divider.position.set(x, 1.6, 0.03);
    g.add(divider);
  }

  // Three columns × cards per column. Each column gets a header colour
  // and a stack of small "cards" (rounded planes).
  const COLUMNS = [
    { x: -0.80, color: 0xff8a65, label: 'TODO',     cards: 3 },  // warm — work to dispatch
    { x:  0.00, color: 0x4fc3f7, label: 'ACTIVE',   cards: 3 },  // cyan — live subagents
    { x:  0.80, color: 0x81c784, label: 'DONE',     cards: 2 },  // green — completed
  ];
  const cardMats = [];

  for (const col of COLUMNS) {
    // Column label — small bar at the top of the column.
    const labelBar = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 0.10),
      new THREE.MeshStandardMaterial({
        color: 0x0a0c12, emissive: col.color, emissiveIntensity: 0.55, roughness: 0.4,
      }),
    );
    labelBar.position.set(col.x, 2.18, 0.04);
    g.add(labelBar);

    // Cards stacked vertically inside the column.
    for (let i = 0; i < col.cards; i++) {
      const cardMat = new THREE.MeshStandardMaterial({
        color: 0xfafafa,
        emissive: col.color,
        emissiveIntensity: 0.30,    // dim on idle, brighter on hover
        roughness: 0.4,
      });
      const card = new THREE.Mesh(
        new THREE.PlaneGeometry(0.70, 0.30),
        cardMat,
      );
      // Stagger cards vertically; the ACTIVE column gets a slight
      // sideways jitter so it doesn't look perfectly stacked.
      const jitter = (col.label === 'ACTIVE') ? (i % 2 === 0 ? -0.03 : 0.03) : 0;
      card.position.set(col.x + jitter, 1.85 - i * 0.36, 0.05);
      g.add(card);
      cardMats.push({ mat: cardMat, base: 0.30, hot: 0.85 });
    }
  }

  // Tiny status LED on the frame — green pulse to read as "online".
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x66bb6a, emissive: 0x66bb6a, emissiveIntensity: 0.9, roughness: 0.2,
  });
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), ledMat);
  led.position.set(1.30, 2.45, 0.04);
  g.add(led);

  registerInteractable({
    mesh: g,
    kind: 'Dispatch Board',
    position: [position[0], position[2]],
    radius: 2.0,
    glowSize: 2.6,
    glowColor: 0xff7043,
    parent: scene,
    getPromptText: () => 'Press E to read the board',
    onInteract: () => {
      if (onInteract) onInteract({ kind: 'dispatchBoard', chapterId, lessonId });
    },
  });

  let _t = 0;
  return {
    group: g,
    update(dt, hovered) {
      _t += dt;
      const k = 1 - Math.exp(-dt * 5);
      for (const c of cardMats) {
        const tgt = hovered ? c.hot : c.base;
        c.mat.emissiveIntensity += (tgt - c.mat.emissiveIntensity) * k;
      }
      // LED soft heartbeat
      ledMat.emissiveIntensity = 0.7 + Math.sin(_t * 2.8) * 0.25;
    },
  };
}
