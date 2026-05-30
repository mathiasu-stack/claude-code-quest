// modelConsole.js — interactable for ch10 "Choosing Your Model".
//
// Three vertical "engine" pillars side by side — Opus / Sonnet / Haiku —
// each glowing in a distinct colour and at a different scale that
// visualises the tier hierarchy (Opus tallest, Haiku shortest). A small
// control plinth in front carries a status screen. Walk up + press E to
// open the chapter's lesson overlay.

import * as THREE from 'three';
import { registerInteractable } from '../interactables.js';

export function buildModelConsole({
  scene, position, lookAt = 0, chapterId, lessonId, onInteract,
}) {
  const g = new THREE.Group();
  g.position.set(position[0], position[1] ?? 0, position[2]);
  g.rotation.y = lookAt;
  scene.add(g);

  // Plinth: brushed-metal base the engines stand on.
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.18, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.7, roughness: 0.45 }),
  );
  plinth.position.set(0, 0.09, 0);
  g.add(plinth);

  // The three engines, in order: Haiku (left, smallest, orange),
  // Sonnet (centre, medium, cyan — the default tier), Opus (right,
  // tallest, purple-gold premium).
  const TIERS = [
    { name: 'haiku',  x: -0.75, height: 0.70, color: 0xff8a3d, emissive: 0xff8a3d, intensity: 0.55 },
    { name: 'sonnet', x:  0.00, height: 1.00, color: 0x4fc3f7, emissive: 0x4fc3f7, intensity: 0.65 },
    { name: 'opus',   x:  0.75, height: 1.35, color: 0xb39ddb, emissive: 0xd1a85d, intensity: 0.85 },
  ];
  const engineMats = [];

  for (const t of TIERS) {
    // Engine pillar — capsule for a soft "engine block" silhouette.
    const matBody = new THREE.MeshStandardMaterial({
      color: 0x1c1f2a, metalness: 0.6, roughness: 0.35,
    });
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.26, t.height, 16),
      matBody,
    );
    body.position.set(t.x, 0.18 + t.height / 2, 0);
    g.add(body);

    // Inner glow strip — vertical tube that lights up by tier colour.
    const glowMat = new THREE.MeshStandardMaterial({
      color: t.color,
      emissive: t.emissive,
      emissiveIntensity: t.intensity * 0.4,   // dim on idle, brighter on hover
      roughness: 0.3,
    });
    const glow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.10, 0.10, t.height * 0.85, 12),
      glowMat,
    );
    glow.position.set(t.x, 0.18 + t.height / 2, 0.18);
    g.add(glow);
    engineMats.push({ mat: glowMat, base: t.intensity * 0.4, hot: t.intensity });

    // Top cap — a small dome that reads as the "exhaust".
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x202833, metalness: 0.8, roughness: 0.25 }),
    );
    cap.position.set(t.x, 0.18 + t.height, 0);
    g.add(cap);

    // Tier label plate on the plinth in front of each engine.
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.36, 0.10),
      new THREE.MeshStandardMaterial({
        color: 0x0a0c12, emissive: t.color, emissiveIntensity: 0.7, roughness: 0.5,
      }),
    );
    plate.position.set(t.x, 0.19, 0.42);
    plate.rotation.x = -Math.PI / 2;
    g.add(plate);
  }

  // Control screen in front of the plinth — small angled panel that
  // wakes up when the player approaches.
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x0d1422,
    emissive: 0x4fc3f7,
    emissiveIntensity: 0.18,
    roughness: 0.4,
    metalness: 0.1,
  });
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.28),
    screenMat,
  );
  screen.position.set(0, 0.32, 0.46);
  screen.rotation.x = -0.35;
  g.add(screen);

  // Bezel under the screen
  const bezel = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.04, 0.10),
    new THREE.MeshStandardMaterial({ color: 0x263238, metalness: 0.6, roughness: 0.5 }),
  );
  bezel.position.set(0, 0.19, 0.46);
  g.add(bezel);

  registerInteractable({
    mesh: g,
    kind: 'Model Console',
    position: [position[0], position[2]],
    radius: 2.0,
    glowSize: 2.6,
    glowColor: 0xd1a85d,
    parent: scene,
    getPromptText: () => 'Press E to spin up an engine',
    onInteract: () => {
      if (onInteract) onInteract({ kind: 'modelConsole', chapterId, lessonId });
    },
  });

  return {
    group: g,
    update(dt, hovered) {
      const k = 1 - Math.exp(-dt * 5);
      // Screen wakes up
      const sTarget = hovered ? 0.85 : 0.18;
      screenMat.emissiveIntensity += (sTarget - screenMat.emissiveIntensity) * k;
      // Each engine glow ramps up when hovered
      for (const e of engineMats) {
        const t = hovered ? e.hot : e.base;
        e.mat.emissiveIntensity += (t - e.mat.emissiveIntensity) * k;
      }
    },
  };
}
