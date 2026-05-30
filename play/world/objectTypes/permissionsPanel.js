// permissionsPanel.js — interactable for ch15 "Settings, Permissions
// & Hooks". A compact, rugged security panel mounted on a stand. Top
// has a stylised lock; three traffic-light indicators below (ALLOW /
// ASK / DENY) cycle subtly on idle and lock to a steady glow on hover.

import * as THREE from 'three';
import { registerInteractable } from '../interactables.js';

export function buildPermissionsPanel({
  scene, position, lookAt = 0, chapterId, lessonId, onInteract,
}) {
  const g = new THREE.Group();
  g.position.set(position[0], 0, position[2]);
  g.rotation.y = lookAt;
  scene.add(g);

  // Floor stand — single tall pillar.
  const stand = new THREE.Mesh(
    new THREE.BoxGeometry(0.20, 1.10, 0.20),
    new THREE.MeshStandardMaterial({ color: 0x263238, metalness: 0.6, roughness: 0.4 }),
  );
  stand.position.set(0, 0.55, 0);
  g.add(stand);

  // Stand foot
  const foot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.30, 0.34, 0.06, 16),
    new THREE.MeshStandardMaterial({ color: 0x1c1c1c, metalness: 0.6, roughness: 0.5 }),
  );
  foot.position.set(0, 0.03, 0);
  g.add(foot);

  // Panel housing — slightly angled toward the player.
  const housing = new THREE.Mesh(
    new THREE.BoxGeometry(0.90, 1.10, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x1c2833, metalness: 0.5, roughness: 0.4 }),
  );
  housing.position.set(0, 1.55, 0.06);
  housing.rotation.x = -0.10;
  g.add(housing);

  // Front face — slightly recessed cyan-tinted screen behind the controls.
  const faceMat = new THREE.MeshStandardMaterial({
    color: 0x0a1018,
    emissive: 0x00bcd4,
    emissiveIntensity: 0.12,
    roughness: 0.3,
  });
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.78, 0.95),
    faceMat,
  );
  face.position.set(0, 1.55, 0.13);
  face.rotation.x = -0.10;
  g.add(face);

  // Lock icon at the top — body + shackle.
  const lockBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.14, 0.04),
    new THREE.MeshStandardMaterial({
      color: 0xeceff1, emissive: 0xb0bec5, emissiveIntensity: 0.4, metalness: 0.7, roughness: 0.3,
    }),
  );
  lockBody.position.set(0, 1.92, 0.16);
  lockBody.rotation.x = -0.10;
  g.add(lockBody);

  const shackle = new THREE.Mesh(
    new THREE.TorusGeometry(0.055, 0.018, 8, 16, Math.PI),
    new THREE.MeshStandardMaterial({
      color: 0xb0bec5, metalness: 0.85, roughness: 0.25,
    }),
  );
  shackle.position.set(0, 2.005, 0.16);
  shackle.rotation.x = Math.PI - 0.10;
  shackle.rotation.z = 0;
  g.add(shackle);

  // Three traffic-light indicators. The labels are colour-coded:
  // ALLOW (green), ASK (amber), DENY (red).
  const LIGHTS = [
    { label: 'ALLOW', color: 0x66bb6a, y: 1.70 },
    { label: 'ASK',   color: 0xffb300, y: 1.45 },
    { label: 'DENY',  color: 0xef5350, y: 1.20 },
  ];
  const lightMats = [];

  for (const l of LIGHTS) {
    // Indicator bulb
    const bulbMat = new THREE.MeshStandardMaterial({
      color: l.color,
      emissive: l.color,
      emissiveIntensity: 0.5,    // pulses on idle, full glow on hover
      roughness: 0.25,
      metalness: 0.1,
    });
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 14, 12),
      bulbMat,
    );
    bulb.position.set(-0.22, l.y, 0.16);
    g.add(bulb);

    // Label bar next to the bulb
    const labelBar = new THREE.Mesh(
      new THREE.PlaneGeometry(0.40, 0.10),
      new THREE.MeshStandardMaterial({
        color: 0x0a1018, emissive: l.color, emissiveIntensity: 0.55, roughness: 0.4,
      }),
    );
    labelBar.position.set(0.08, l.y, 0.135);
    labelBar.rotation.x = -0.10;
    g.add(labelBar);

    lightMats.push({ mat: bulbMat, label: l.label });
  }

  // Tiny status text strip at the bottom — reads as a console line.
  const statusBar = new THREE.Mesh(
    new THREE.PlaneGeometry(0.70, 0.06),
    new THREE.MeshStandardMaterial({
      color: 0x05080d, emissive: 0x00e5ff, emissiveIntensity: 0.45, roughness: 0.4,
    }),
  );
  statusBar.position.set(0, 1.05, 0.135);
  statusBar.rotation.x = -0.10;
  g.add(statusBar);

  registerInteractable({
    mesh: g,
    kind: 'Permissions Panel',
    position: [position[0], position[2]],
    radius: 2.0,
    glowSize: 1.8,
    glowColor: 0x00e5ff,
    parent: scene,
    getPromptText: () => 'Press E to check permissions',
    onInteract: () => {
      if (onInteract) onInteract({ kind: 'permissionsPanel', chapterId, lessonId });
    },
  });

  let _t = 0;
  return {
    group: g,
    update(dt, hovered) {
      _t += dt;
      const k = 1 - Math.exp(-dt * 5);
      // Lights cycle gently on idle (Allow → Ask → Deny in rotation),
      // lock to steady high glow when player is hovering — reads as
      // "panel is paying attention to you."
      if (hovered) {
        for (const l of lightMats) {
          l.mat.emissiveIntensity += (1.0 - l.mat.emissiveIntensity) * k;
        }
      } else {
        // Soft, offset breathing per light.
        for (let i = 0; i < lightMats.length; i++) {
          const phase = _t * 1.4 + i * 1.2;
          lightMats[i].mat.emissiveIntensity = 0.40 + Math.sin(phase) * 0.20;
        }
      }
      // Face wakes up
      const fTarget = hovered ? 0.55 : 0.12;
      faceMat.emissiveIntensity += (fTarget - faceMat.emissiveIntensity) * k;
    },
  };
}
