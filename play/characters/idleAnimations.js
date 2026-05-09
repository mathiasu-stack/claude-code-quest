// idleAnimations.js — procedural idle anims for NPCs.
//
// Each call takes the character group, dt, and an absolute time stamp, and
// applies subtle deformation: breathing scale on torso, gentle head bob,
// and a per-NPC signature gesture keyed on look.gesture.
//
// Rules:
//   • Pure procedural; no clips, no AnimationMixer.
//   • Modifies arm/leg/head transforms ONLY, never position/rotation of
//     the character group itself (so movement stays clean).
//   • Reset state to baseline if no input — these are absolute deformations
//     that overwrite each frame.
//
// Usage:
//   import { applyIdle } from './characters/idleAnimations.js';
//   applyIdle(npcMesh, dt, performanceNow);

const TWO_PI = Math.PI * 2;

export function applyIdle(group, dt, now) {
  const parts = group.userData?.parts;
  if (!parts) return;
  const t = now * 0.001;
  const phase = (group.userData._phase ??= Math.random() * 10);

  // Breathing — torso scale Y oscillation
  if (parts.torso) {
    parts.torso.scale.y = 1.0 + Math.sin((t + phase) * Math.PI) * 0.018;
  }

  // Head bob — slight Y position offset (head is at y=1.66 baseline)
  if (parts.head) {
    parts.head.position.y = 1.66 + Math.sin((t + phase) * Math.PI * 0.7) * 0.012;
  }

  // Signature gesture — only when not currently moving (player parts have
  // walk anims overwriting these every frame, which is fine — the player's
  // gesture is just 'breathing' anyway).
  const gesture = group.userData?.look?.gesture;
  if (!gesture) return;

  switch (gesture) {
    case 'wave': {
      // Slow continuous wave with the right arm; cycles every ~6s.
      const c = (Math.sin(t * 0.6 + phase) + 1) * 0.5;
      const wave = Math.sin(t * 4) * c;
      parts.rightArm && (parts.rightArm.rotation.x = -1.4 - wave * 0.6);
      parts.rightArm && (parts.rightArm.rotation.z = -0.4 + wave * 0.4);
      break;
    }
    case 'glasses': {
      // Periodic adjust-glasses motion.
      const cycle = (t * 0.45 + phase) % TWO_PI;
      if (cycle < 0.6) {
        const k = Math.sin((cycle / 0.6) * Math.PI);
        parts.rightArm && (parts.rightArm.rotation.x = -1.6 - k * 0.5);
        parts.rightArm && (parts.rightArm.rotation.z = -0.6 - k * 0.4);
      } else {
        parts.rightArm && (parts.rightArm.rotation.x = 0);
        parts.rightArm && (parts.rightArm.rotation.z = 0);
      }
      break;
    }
    case 'typing': {
      // Both arms bent forward, hands jittering.
      parts.leftArm && (parts.leftArm.rotation.x = -1.4);
      parts.rightArm && (parts.rightArm.rotation.x = -1.4);
      const j1 = Math.sin(t * 18 + phase) * 0.08;
      const j2 = Math.sin(t * 22 + phase + 1.5) * 0.08;
      parts.leftArm && (parts.leftArm.rotation.z = -0.4 + j1);
      parts.rightArm && (parts.rightArm.rotation.z = 0.4 + j2);
      break;
    }
    case 'gesture': {
      // Open-handed gesture — arm sweeping right then resetting.
      const cycle = (t * 0.4 + phase) % TWO_PI;
      const k = Math.sin(cycle) * 0.5 + 0.5; // 0..1
      parts.rightArm && (parts.rightArm.rotation.x = -1.0 - k * 0.4);
      parts.rightArm && (parts.rightArm.rotation.z = -0.3 - k * 0.6);
      break;
    }
    case 'clipboard': {
      // Holding clipboard, occasionally flipping a page (forward jab).
      parts.leftArm && (parts.leftArm.rotation.x = -1.4);
      parts.rightArm && (parts.rightArm.rotation.x = -1.4);
      const flip = ((t * 0.3 + phase) % TWO_PI);
      if (flip < 0.4) {
        const k = Math.sin((flip / 0.4) * Math.PI);
        parts.rightArm && (parts.rightArm.rotation.x = -1.4 - k * 0.5);
      }
      break;
    }
    case 'foottap': {
      // One-leg foot tap; the other leg stays still.
      const tap = Math.max(0, Math.sin(t * 6 + phase));
      parts.rightLeg && (parts.rightLeg.rotation.x = -tap * 0.35);
      break;
    }
    case 'reading': {
      // Book held up; head tilts slightly down.
      parts.leftArm && (parts.leftArm.rotation.x = -1.6);
      parts.rightArm && (parts.rightArm.rotation.x = -1.6);
      parts.head && (parts.head.rotation.x = 0.18);
      break;
    }
    default:
      break;
  }
}

// Reset arms/legs to neutral. Called by play.js for the player when not
// moving so the gesture system doesn't fight with the movement code.
export function resetIdleArms(group) {
  const parts = group.userData?.parts;
  if (!parts) return;
  if (parts.leftArm)  { parts.leftArm.rotation.x  *= 0.85; parts.leftArm.rotation.z  *= 0.85; }
  if (parts.rightArm) { parts.rightArm.rotation.x *= 0.85; parts.rightArm.rotation.z *= 0.85; }
  if (parts.leftLeg)  parts.leftLeg.rotation.x  *= 0.85;
  if (parts.rightLeg) parts.rightLeg.rotation.x *= 0.85;
  if (parts.head)     parts.head.rotation.x *= 0.85;
}
