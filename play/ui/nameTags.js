// nameTags.js — per-frame fade + (desktop) occlusion for character labels.
// Linear distance falloff between FULL_RANGE and FADE_RANGE.
// Closest NPC to the camera gets a slight emphasis bump (alpha +0.15).
// Also exports showSpeechBubble — a transient overhead text sprite used
// by story scenes (TWIST 1 staged exchange).

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
      if (c.isSprite && !c.userData._isSpeechBubble) return c;
    }
    return null;
  }

  setWalls(arr) { this.walls = arr; }
}

// ─── Transient speech bubble (Kedash Protocol, TWIST1-01 staging) ────────────
// Attaches a self-disposing text sprite above a character group. The
// sprite holds for `holdMs`, fades over `fadeMs`, then removes itself
// and disposes its GPU resources — no caller-side update loop needed.
export function showSpeechBubble(mesh, text, { holdMs = 3000, fadeMs = 1000, y = 2.85 } = {}) {
  if (!mesh || !text) return null;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const font = '600 26px "Segoe UI", system-ui, sans-serif';

  // Word-wrap to ~360px lines.
  ctx.font = font;
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const probe = line ? `${line} ${w}` : w;
    if (ctx.measureText(probe).width > 360 && line) { lines.push(line); line = w; }
    else line = probe;
  }
  if (line) lines.push(line);

  const lineH = 34;
  const padX = 22, padY = 16;
  const textW = Math.max(...lines.map(l => ctx.measureText(l).width));
  const w = Math.ceil(textW + padX * 2);
  const h = Math.ceil(lines.length * lineH + padY * 2);
  canvas.width = w; canvas.height = h;

  // Rounded bubble.
  const c2 = canvas.getContext('2d');
  const r = 14;
  c2.fillStyle = 'rgba(16, 24, 36, 0.88)';
  c2.beginPath();
  c2.moveTo(r, 0);
  c2.arcTo(w, 0, w, h, r);
  c2.arcTo(w, h, 0, h, r);
  c2.arcTo(0, h, 0, 0, r);
  c2.arcTo(0, 0, w, 0, r);
  c2.closePath();
  c2.fill();
  c2.font = font;
  c2.fillStyle = '#f5f1e6';
  c2.textAlign = 'center';
  c2.textBaseline = 'middle';
  lines.forEach((l, i) => c2.fillText(l, w / 2, padY + lineH * i + lineH / 2));

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, opacity: 1 });
  const sprite = new THREE.Sprite(mat);
  const worldScale = 0.0048;
  sprite.scale.set(w * worldScale, h * worldScale, 1);
  sprite.position.set(0, y, 0);
  sprite.renderOrder = 999;
  // Flagged so NameTagSystem._findTagOnGroup skips it — a bubble must
  // never hijack the name-tag distance fade.
  sprite.userData._isSpeechBubble = true;
  mesh.add(sprite);

  const t0 = performance.now();
  function tick() {
    const t = performance.now() - t0;
    if (t >= holdMs + fadeMs || !sprite.parent) {
      if (sprite.parent) sprite.parent.remove(sprite);
      mat.dispose();
      tex.dispose();
      return;
    }
    if (t > holdMs) mat.opacity = 1 - (t - holdMs) / fadeMs;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  return sprite;
}
