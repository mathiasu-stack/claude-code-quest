// nameTags.js — per-frame fade + (desktop) occlusion for character labels.
// Linear distance falloff between FULL_RANGE and FADE_RANGE.
// Closest NPC to the camera gets a slight emphasis bump (alpha +0.15).

import * as THREE from 'three';

const FULL_RANGE = 6.5;   // fully opaque within this distance
const FADE_RANGE = 12;    // invisible beyond this distance
const EMPHASIS_BUMP = 0.18;

export class NameTagSystem {
  constructor({ camera, npcMeshes, walls, mobile }) {
    this.camera = camera;
    this.npcMeshes = npcMeshes;
    // Walls used for raycast occlusion (desktop only). Pass an array of
    // Mesh objects that are opaque; the system will skip occlusion check
    // entirely if this list is empty.
    this.walls = walls || [];
    this.mobile = !!mobile;
    this._raycaster = new THREE.Raycaster();
    this._tmpDir = new THREE.Vector3();
    this._tmpTarget = new THREE.Vector3();
  }

  update() {
    if (!this.camera || !this.npcMeshes?.length) return;
    const cam = this.camera;
    let closest = null;
    let closestDist = Infinity;
    for (const m of this.npcMeshes) {
      const tag = this._findTagOnGroup(m);
      if (!tag) continue;
      this._tmpTarget.copy(m.position);
      this._tmpTarget.y += 2.45;
      const d = this._tmpTarget.distanceTo(cam.position);
      if (d < closestDist) { closestDist = d; closest = m; }
      tag.userData._distance = d;
    }

    for (const m of this.npcMeshes) {
      const tag = this._findTagOnGroup(m);
      if (!tag) continue;
      const d = tag.userData._distance;
      let alpha;
      if (d <= FULL_RANGE) alpha = 1;
      else if (d >= FADE_RANGE) alpha = 0;
      else alpha = 1 - (d - FULL_RANGE) / (FADE_RANGE - FULL_RANGE);

      // Occlusion: only on desktop, only if alpha > 0.
      if (!this.mobile && alpha > 0 && this.walls.length > 0) {
        this._tmpTarget.copy(m.position);
        this._tmpTarget.y += 2.45;
        this._tmpDir.subVectors(this._tmpTarget, cam.position).normalize();
        this._raycaster.set(cam.position, this._tmpDir);
        // Far = distance to tag minus tiny epsilon
        this._raycaster.far = this._tmpTarget.distanceTo(cam.position) - 0.05;
        const hit = this._raycaster.intersectObjects(this.walls, false);
        if (hit && hit.length > 0) alpha = Math.min(alpha, 0.1);
      }

      // Emphasize the closest NPC.
      if (m === closest && alpha > 0) alpha = Math.min(1, alpha + EMPHASIS_BUMP);

      // Apply
      if (tag.material && tag.material.opacity !== alpha) {
        tag.material.opacity = alpha;
        tag.material.transparent = true;
      }
      tag.visible = alpha > 0.02;
    }
  }

  // The tag was added in spawnNPC at y=2.45 directly to the character
  // group. Locate it via a Sprite child.
  _findTagOnGroup(group) {
    if (!group?.children) return null;
    for (let i = group.children.length - 1; i >= 0; i--) {
      const c = group.children[i];
      if (c.isSprite) return c;
    }
    return null;
  }

  setWalls(arr) { this.walls = arr; }
}
