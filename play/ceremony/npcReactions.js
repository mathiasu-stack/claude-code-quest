// npcReactions.js — nearby NPCs turn toward the player and clap during
// a promotion ceremony. Pure procedural — uses the existing arm
// transforms on each NPC.
//
// Returns a state object whose `update(dt, now)` advances the clap
// animation each frame. Returns `null` if there are no nearby NPCs.

import * as THREE from 'three';

const REACT_RADIUS = 12;     // metres — NPCs within this distance react
const MAX_CLAPPERS = 3;       // cap to keep perf predictable
// Kedash Protocol canon: the standard ceremony loop is EXACTLY eight
// claps ("They always clap eight times" — Ines, T2). One clap = one full
// swing cycle; synced clappers freeze their swing after 8 cycles. The
// finale's desync claps are deliberately ragged and exempt.
const CLAP_COUNT = 8;

// `desync` (finale, FIN-06): each clapper gets a random phase offset and
// slightly different clap rate — ragged, human, unsynced for the first
// time. `maxClappers` lets the finale raise the cap beyond the default.
export function spawnNpcReactions({ scene, npcMeshes, playerPos, announceWith, isCapstone, desync = false, maxClappers = MAX_CLAPPERS }) {
  if (!npcMeshes?.length) return null;
  // Find the closest N NPCs.
  const nearby = [];
  for (const m of npcMeshes) {
    const dx = m.position.x - playerPos.x;
    const dz = m.position.z - playerPos.z;
    const d = Math.hypot(dx, dz);
    if (d <= REACT_RADIUS) nearby.push({ m, d });
  }
  nearby.sort((a, b) => a.d - b.d);
  const clappers = nearby.slice(0, maxClappers);

  // Each NPC: stash original arm/leg/head rotations so we can restore
  // them after the clap loop ends. Also stash original group rotation
  // (if turning).
  const states = clappers.map(({ m }) => {
    const parts = m.userData?.parts;
    return {
      mesh: m,
      phaseOffset: desync ? Math.random() * Math.PI * 2 : 0,
      rate: desync ? 0.0095 + Math.random() * 0.005 : 0.012,
      orig: {
        rotY: m.rotation.y,
        leftArmX: parts?.leftArm?.rotation?.x ?? 0,
        leftArmZ: parts?.leftArm?.rotation?.z ?? 0,
        rightArmX: parts?.rightArm?.rotation?.x ?? 0,
        rightArmZ: parts?.rightArm?.rotation?.z ?? 0,
      },
      // Aim toward the player
      targetRot: Math.atan2(playerPos.x - m.position.x, playerPos.z - m.position.z),
    };
  });

  // Announcer NPC — emits a small text bubble + a procedural blip.
  let announcer = null;
  if (announceWith) {
    announcer = npcMeshes.find(n => n.userData?.npc?.id === announceWith);
  }
  let bubbleEl = null;
  if (announcer) {
    const playerName = window.App?.progress?.playerName || 'New Hire';
    bubbleEl = document.createElement('div');
    bubbleEl.className = 'play-congrats-bubble';
    const announcerName = announcer.userData?.npc?.name?.split(' ')[0] || 'Colleague';
    bubbleEl.textContent = isCapstone
      ? `Welcome to the C-suite, ${playerName}! You did it.`
      : `Welcome to the team, ${playerName}! You're now promoted.`;
    const host = document.getElementById('play-canvas-host')?.parentElement || document.body;
    host.appendChild(bubbleEl);
    setTimeout(() => bubbleEl.classList.add('visible'), 200);
  }

  const t0 = performance.now();
  const update = (dt, now) => {
    const elapsed = now - t0;
    const tFade = Math.min(1, elapsed / 500);
    // Turn each clapper toward the player
    for (const s of states) {
      const m = s.mesh;
      let dRot = ((s.targetRot - m.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (dRot < -Math.PI) dRot += Math.PI * 2;
      m.rotation.y += dRot * (1 - Math.exp(-dt * 5));
      // Clap arms — both arms come up and oscillate quickly
      const parts = m.userData?.parts;
      if (parts?.leftArm && parts?.rightArm) {
        // Clamp at CLAP_COUNT cycles for synced clappers — sin() lands on
        // 0 at the clamp so the arms settle smoothly into the held pose.
        let phase = elapsed * s.rate + s.phaseOffset;
        if (!desync) phase = Math.min(phase, CLAP_COUNT * Math.PI * 2);
        const swing = Math.sin(phase) * 0.4;
        // Lift arms to clap pose
        const liftAmount = -2.0 * tFade;  // up & forward
        parts.leftArm.rotation.x = liftAmount + swing * 0.2;
        parts.rightArm.rotation.x = liftAmount - swing * 0.2;
        // Bring them inward
        parts.leftArm.rotation.z = (0.6 + swing * 0.5) * tFade;
        parts.rightArm.rotation.z = (-0.6 - swing * 0.5) * tFade;
      }
    }
  };

  return {
    update,
    states,
    bubbleEl,
    announcer,
    cleanup() {
      // Restore arm transforms on each clapper
      for (const s of states) {
        const parts = s.mesh.userData?.parts;
        if (parts?.leftArm)  { parts.leftArm.rotation.x = s.orig.leftArmX; parts.leftArm.rotation.z = s.orig.leftArmZ; }
        if (parts?.rightArm) { parts.rightArm.rotation.x = s.orig.rightArmX; parts.rightArm.rotation.z = s.orig.rightArmZ; }
      }
      if (bubbleEl) {
        bubbleEl.classList.remove('visible');
        setTimeout(() => bubbleEl.remove(), 500);
      }
    },
  };
}

export function clearNpcReactions(state) {
  if (!state) return;
  state.cleanup?.();
}
