// Dust motes — a tiny shared THREE.Points system that drifts particles
// around the player and pretends they're catching the key light. Skipped
// entirely on mobile (allocated count is 0).
//
// Single buffer, 100 vertices on desktop, no shader pass. Costs roughly
// nothing to render once allocated.
//
// Usage from play.js:
//   import { DustMotes } from './lighting/dust-motes.js';
//   const dust = new DustMotes(scene, { mobile });
//   ...
//   dust.update(dt, player.position);   // each frame
//   dust.dispose();                     // in stop()

import * as THREE from 'three';

const DEFAULT_COUNT = 100;
const VOLUME = { x: 12, y: 4.5, z: 12 }; // half-extents around the player

export class DustMotes {
  constructor(scene, opts = {}) {
    this.mobile = !!opts.mobile;
    this.count = this.mobile ? 0 : (opts.count ?? DEFAULT_COUNT);
    this.scene = scene;
    this.points = null;
    if (this.count <= 0) return;

    const positions = new Float32Array(this.count * 3);
    const drift = new Float32Array(this.count * 3); // per-particle drift speeds
    for (let i = 0; i < this.count; i++) {
      positions[i * 3 + 0] = (Math.random() * 2 - 1) * VOLUME.x;
      positions[i * 3 + 1] = Math.random() * VOLUME.y + 0.5;
      positions[i * 3 + 2] = (Math.random() * 2 - 1) * VOLUME.z;
      drift[i * 3 + 0] = (Math.random() - 0.5) * 0.18;
      drift[i * 3 + 1] = (Math.random() - 0.5) * 0.06;
      drift[i * 3 + 2] = (Math.random() - 0.5) * 0.18;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this._drift = drift;
    this._positions = positions;
    this._anchor = new THREE.Vector3(0, 0, 0);

    // Tiny round mote texture
    const tex = makeMoteTexture();

    const mat = new THREE.PointsMaterial({
      map: tex,
      size: 0.085,
      sizeAttenuation: true,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
      color: 0xfff5d4,
    });

    this.points = new THREE.Points(geom, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  update(dt, anchorPosition) {
    if (!this.points) return;
    const pos = this._positions;
    const drift = this._drift;
    const ax = anchorPosition.x, az = anchorPosition.z;
    for (let i = 0; i < this.count; i++) {
      const j = i * 3;
      pos[j + 0] += drift[j + 0] * dt;
      pos[j + 1] += drift[j + 1] * dt;
      pos[j + 2] += drift[j + 2] * dt;

      // Recycle motes that drift outside the volume relative to the anchor.
      // We keep them in a window around the player so they're always
      // visible without rendering 1000s of them.
      const dx = pos[j + 0] - ax;
      const dz = pos[j + 2] - az;
      if (dx >  VOLUME.x) pos[j + 0] -= VOLUME.x * 2;
      if (dx < -VOLUME.x) pos[j + 0] += VOLUME.x * 2;
      if (dz >  VOLUME.z) pos[j + 2] -= VOLUME.z * 2;
      if (dz < -VOLUME.z) pos[j + 2] += VOLUME.z * 2;
      if (pos[j + 1] > VOLUME.y + 0.5) pos[j + 1] = 0.4;
      if (pos[j + 1] < 0.3)            pos[j + 1] = VOLUME.y + 0.4;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }

  dispose() {
    if (!this.points) return;
    this.scene.remove(this.points);
    this.points.geometry.dispose();
    if (this.points.material.map) this.points.material.map.dispose();
    this.points.material.dispose();
    this.points = null;
  }
}

function makeMoteTexture() {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 32;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0,    'rgba(255,255,235,1.0)');
  g.addColorStop(0.4,  'rgba(255,240,200,0.65)');
  g.addColorStop(1.0,  'rgba(255,235,180,0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
