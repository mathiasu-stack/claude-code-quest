// playbookBoard.js — the capstone "Your Own Playbook" board.
//
// A wall-mounted board with one slot per chapter (4×4 = 16). Each slot lights
// gold ONLY when that chapter's test is verified-passed (isChapterDone) — an
// honest, diegetic trophy of the real artifact the player added to their
// portable .claude/ Playbook. Never self-reported. Press E to inspect the
// pack inventory (done / locked). Modelled on dispatchBoard.js.

import * as THREE from 'three';
import { registerInteractable } from '../interactables.js';

function slotLabelTexture(text, lit) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 72;
  const x = c.getContext('2d');
  x.fillStyle = lit ? '#1c2a14' : '#10141c';
  x.fillRect(0, 0, 128, 72);
  x.fillStyle = lit ? '#ffe39a' : '#5b6470';
  x.font = '700 17px monospace';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  // wrap to 2 lines on space
  const parts = String(text).split(' ');
  if (parts.length > 1) {
    x.fillText(parts[0], 64, 26);
    x.fillText(parts.slice(1).join(' '), 64, 48);
  } else {
    x.fillText(text, 64, 36);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// chapter id → short piece tag shown on its slot (and the inventory).
export const PLAYBOOK_PIECES = [
  ['ch01', 'CLAUDE.md'], ['ch02', 'Context'], ['ch03', 'Conventions'], ['ch04', 'Memory'],
  ['ch05', 'Prompt'], ['ch06', 'Safe-edit'], ['ch07', 'Lean ctx'], ['ch08', 'SKILL'],
  ['ch09', 'learnings'], ['ch10', 'Models'], ['ch11', 'Command'], ['ch12', 'Plan rule'],
  ['ch13', 'MCP'], ['ch14', 'Subagent'], ['ch15', 'Settings'], ['ch16', 'Schedule'],
];

export function buildPlaybookBoard({ scene, position, rotY = 0, floor = 1, isChapterDone, onInteract }) {
  const g = new THREE.Group();
  g.position.set(position[0], 0, position[2]);
  g.rotation.y = rotY;
  g.userData.floor = floor;   // single-floor culling
  scene.add(g);

  // Backboard + frame.
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(2.7, 1.9, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x222a35, roughness: 0.8 }),
  );
  board.position.set(0, 1.75, 0);
  g.add(board);
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(2.86, 2.06, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x12161d, metalness: 0.4, roughness: 0.5 }),
  );
  frame.position.set(0, 1.75, -0.02);
  g.add(frame);
  // Header bar — warm gold "YOUR PLAYBOOK".
  const header = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x0a0c12, emissive: 0xc9a44c, emissiveIntensity: 0.5, roughness: 0.45 }),
  );
  header.position.set(0, 2.62, 0.03);
  g.add(header);

  // 4×4 slot grid. Each slot = a labelled plane whose emissive ramps to lit
  // when its chapter is done.
  const COLS = [-0.93, -0.31, 0.31, 0.93];
  const ROWS = [2.30, 1.78, 1.26, 0.74];
  const slots = [];
  for (let i = 0; i < 16; i++) {
    const [chId, tag] = PLAYBOOK_PIECES[i];
    const mat = new THREE.MeshStandardMaterial({
      map: slotLabelTexture(tag, false),
      emissive: 0xc9a44c,
      emissiveIntensity: 0.06,
      roughness: 0.45,
    });
    const slot = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.40), mat);
    slot.position.set(COLS[i % 4], ROWS[Math.floor(i / 4)], 0.05);
    g.add(slot);
    slots.push({ chId, tag, mat, lit: false });
  }

  // Status LED.
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0xc9a44c, emissive: 0xc9a44c, emissiveIntensity: 0.9, roughness: 0.2,
  });
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), ledMat);
  led.position.set(1.36, 2.70, 0.04);
  g.add(led);

  const it = registerInteractable({
    mesh: g,
    kind: 'Your Playbook',
    position: [position[0], position[2]],
    radius: 2.0,
    glowSize: 2.8,
    glowColor: 0xc9a44c,
    parent: scene,
    getPromptText: () => 'Press E — open your Playbook',
    onInteract: () => { if (onInteract) onInteract(slots.map(s => ({ chId: s.chId, tag: s.tag, done: !!s.lit }))); },
  });
  if (it?.glow) it.glow.userData.floor = floor;   // glow ring follows floor culling

  let _t = 0;
  return {
    group: g,
    update(dt) {
      _t += dt;
      const k = 1 - Math.exp(-dt * 4);
      let anyChanged = false;
      for (const s of slots) {
        const done = !!(isChapterDone && isChapterDone(s.chId));
        if (done !== s.lit) {            // re-paint the label once on transition
          s.lit = done;
          if (s.mat.map) s.mat.map.dispose();
          s.mat.map = slotLabelTexture(s.tag, done);
          s.mat.map.colorSpace = THREE.SRGBColorSpace;
          s.mat.needsUpdate = true;
          anyChanged = true;
        }
        const tgt = done ? 0.85 : 0.06;
        s.mat.emissiveIntensity += (tgt - s.mat.emissiveIntensity) * k;
      }
      ledMat.emissiveIntensity = 0.7 + Math.sin(_t * 2.4) * 0.25;
      return anyChanged;
    },
  };
}
