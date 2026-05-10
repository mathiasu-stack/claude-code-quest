// titleTransition.js — animated swap of the player's role tag.
//
// The player has a tier label sprite parented to the group at y=2.4
// (created in buildPlayer via makeLabelSprite). On promotion, we
// animate a 3D card flip to swap the old text for the new one.

import * as THREE from 'three';

function makeRoleTexture(text, fg = '#1a2744', bg = 'rgba(201,164,76,0.95)') {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  const r = 24, w = c.width, h = c.height;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(w - r, 0); ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r); ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(r, h); ctx.quadraticCurveTo(0, h, 0, h - r);
  ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = fg;
  ctx.font = 'bold 56px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function findExistingTierTag(player) {
  // The tier tag is a Sprite child of the player group, added in
  // buildPlayer at y=2.4. Find the highest sprite child.
  for (let i = player.children.length - 1; i >= 0; i--) {
    const c = player.children[i];
    if (c.isSprite) return c;
  }
  return null;
}

// Replaces the player's role tag with a new title using a 3D card-flip
// effect. Implementation: swap the existing Sprite for two Plane meshes
// (front/back), then animate a Y-axis rotation. Once the flip completes,
// we put the new title on a fresh Sprite (cheaper for the steady-state
// rendering) and clean up the planes.
export function animateTitleTransition(player, newTitle, durationSec = 1.2) {
  const oldTag = findExistingTierTag(player);
  const oldText = oldTag?.userData?._roleText || 'Junior Hire';
  const newText = newTitle;

  // Build front (old) and back (new) plane meshes — slightly above the
  // sprite location so they don't collide.
  const frontTex = makeRoleTexture(oldText, '#1a2744', 'rgba(255,205,90,0.95)');
  const backTex  = makeRoleTexture(newText, '#1a2744', 'rgba(255,205,90,0.95)');
  const flipper = new THREE.Group();
  flipper.position.set(0, 2.4, 0);
  player.add(flipper);

  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 0.5),
    new THREE.MeshBasicMaterial({ map: frontTex, transparent: true, side: THREE.DoubleSide }),
  );
  flipper.add(front);
  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 0.5),
    new THREE.MeshBasicMaterial({ map: backTex, transparent: true, side: THREE.DoubleSide }),
  );
  back.rotation.y = Math.PI;
  flipper.add(back);

  // Hide the old sprite during the flip
  if (oldTag) oldTag.visible = false;

  const t0 = performance.now();
  const dur = durationSec * 1000;
  function step() {
    const t = Math.min(1, (performance.now() - t0) / dur);
    // Eased rotation 0 → π
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad
    flipper.rotation.y = e * Math.PI;
    // Bigger arc on Y to give a "lift" feel
    flipper.position.y = 2.4 + Math.sin(t * Math.PI) * 0.18;
    if (t < 1) requestAnimationFrame(step);
    else {
      // Replace the old tier sprite with a NEW sprite holding the new title.
      // (Sprite renders cheaper than 2 planes for the rest of the session.)
      if (oldTag) {
        oldTag.material.map?.dispose?.();
        oldTag.material.map = backTex;
        oldTag.material.needsUpdate = true;
        oldTag.visible = true;
        oldTag.userData._roleText = newText;
      }
      // Cleanup the flip planes
      player.remove(flipper);
      front.geometry.dispose(); front.material.dispose();
      back.geometry.dispose(); back.material.dispose();
      frontTex.dispose();
    }
  }
  step();

  return { oldText, newText };
}
