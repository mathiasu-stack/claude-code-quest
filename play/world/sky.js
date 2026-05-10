// sky.js — gradient skydome + per-zone fog. Replaces the previous
// flat scene.background color so the horizon doesn't blow out.
//
// Approach: an inverted (BackSide) icosphere with vertex colors. Top
// vertices get the "sky" color, bottom vertices get the "horizon" color,
// and we lerp by latitude. A small "sun disc" plane is parented to the
// skydome and orbited by the time-of-day system later.
//
// Public API:
//   const sky = new SkyDome(scene);
//   sky.applyPreset({ top, horizon, sunColor, sunSize, sunDir })
//   sky.setSunDirection(dirVec)        // for time-of-day
//   sky.followCamera(camera)            // each frame
//   sky.dispose()

import * as THREE from 'three';

export class SkyDome {
  constructor(scene) {
    this.scene = scene;

    // Skydome — inverted sphere with vertex colors.
    const geom = new THREE.IcosahedronGeometry(120, 3);
    geom.deleteAttribute('normal');
    const colors = new Float32Array(geom.attributes.position.count * 3);
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.renderOrder = -1; // draw behind everything
    scene.add(this.mesh);

    // Sun — quad facing the camera, parented to a transform we rotate.
    this.sunPivot = new THREE.Group();
    scene.add(this.sunPivot);
    const sunGeom = new THREE.PlaneGeometry(8, 8);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xfff5d0, transparent: true, opacity: 0.85,
      depthTest: false, depthWrite: false, fog: false,
    });
    this.sun = new THREE.Mesh(sunGeom, sunMat);
    this.sun.position.set(0, 0, -110); // far in front of the pivot
    this.sun.renderOrder = -1;
    this.sunPivot.add(this.sun);

    // Cache of last applied preset
    this.preset = null;

    this._tmpDir = new THREE.Vector3();
  }

  applyPreset(p) {
    this.preset = p;
    this._paintGradient(p.top, p.horizon, p.bottom || p.horizon);
    if (p.sunColor) this.sun.material.color.setHex(p.sunColor);
    if (typeof p.sunOpacity === 'number') this.sun.material.opacity = p.sunOpacity;
    if (p.sunSize) this.sun.scale.setScalar(p.sunSize);
    if (p.sunDir) this.setSunDirection(p.sunDir);
  }

  // Direction in world space (vec3-like with x,y,z). Sun gets placed
  // on the inside of the skydome along this direction.
  setSunDirection(dir) {
    const v = this._tmpDir.set(dir.x, dir.y, dir.z).normalize();
    this.sunPivot.lookAt(v.x, v.y, v.z);
    // Negative z because the sun sits at -Z of the pivot.
    this.sun.position.set(0, 0, -110);
    // Hide the sun if it dips below the horizon (Y < 0).
    this.sun.material.opacity = (v.y > 0 ? (this.preset?.sunOpacity ?? 0.85) : 0);
  }

  // Each frame, keep the skydome anchored at the camera so the player
  // can never reach the inside boundary.
  followCamera(camera) {
    if (!this.mesh || !camera) return;
    this.mesh.position.copy(camera.position);
    this.sunPivot.position.copy(camera.position);
  }

  dispose() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }
    if (this.sunPivot) this.scene.remove(this.sunPivot);
    if (this.sun) {
      this.sun.geometry.dispose();
      this.sun.material.dispose();
    }
    this.mesh = null; this.sun = null; this.sunPivot = null;
  }

  // Paint vertex colors as a top→bottom lerp.
  _paintGradient(topHex, horizonHex, bottomHex) {
    const top = new THREE.Color(topHex);
    const horizon = new THREE.Color(horizonHex);
    const bottom = new THREE.Color(bottomHex);
    const pos = this.mesh.geometry.attributes.position;
    const col = this.mesh.geometry.attributes.color;
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      // Latitude in [-1, 1]; 1 = top, 0 = horizon, -1 = bottom.
      const r = pos.array[i * 3 + 0];
      const yV = pos.array[i * 3 + 1];
      const z = pos.array[i * 3 + 2];
      const len = Math.hypot(r, yV, z) || 1;
      const lat = yV / len;
      if (lat >= 0) {
        tmp.copy(horizon).lerp(top, Math.pow(lat, 0.7));
      } else {
        tmp.copy(horizon).lerp(bottom, Math.pow(-lat, 0.9));
      }
      col.setXYZ(i, tmp.r, tmp.g, tmp.b);
    }
    col.needsUpdate = true;
  }
}

// Per-zone sky + fog presets. Lighting manager swaps these alongside
// the lighting preset on zone change so mood transitions feel coordinated.
//
// Each preset includes:
//   sky:  { top, horizon, bottom, sunColor, sunOpacity, sunSize, sunDir }
//   fog:  { color, near, far }    (or null = no fog)
const RECEPTION = {
  sky: {
    top:     0x4b8ed8,   // strong blue so the gradient reads vertically
    horizon: 0xffd9a0,   // warm horizon band
    bottom:  0x8c5a2c,   // earthy lower band
    sunColor: 0xffe7b0,
    sunOpacity: 0.95,
    sunSize:  1.3,
    sunDir:   { x: 0.5, y: 0.55, z: -0.7 },
  },
  // Pull fog far in and lighten so it doesn't wash out the skydome behind
  // the windows (was previously eating the gradient with cream haze).
  fog: { color: 0xf8e2c5, near: 28, far: 95 },
};
const LIBRARY = {
  sky: {
    top:     0x121831,
    horizon: 0x2c3450,
    bottom:  0x100b1e,
    sunColor: 0xb6c5ff,
    sunOpacity: 0.5,
    sunSize:  0.7,
    sunDir:   { x: -0.4, y: 0.2, z: 0.8 },
  },
  fog: { color: 0x1a1d2a, near: 16, far: 55 },
};
const DEFAULT_SKY = {
  sky: {
    top:     0x9bc0e8,
    horizon: 0xeaf3ff,
    bottom:  0xa0b8c8,
    sunColor: 0xffffff,
    sunOpacity: 0.4,
    sunSize:  1.0,
    sunDir:   { x: 0.6, y: 0.55, z: -0.5 },
  },
  fog: { color: 0xeaf3ff, near: 24, far: 75 },
};
// Capstone gets a moody server-room feel.
const SERVER_ROOM = {
  sky: {
    top:     0x0a0a18,
    horizon: 0x140c1e,
    bottom:  0x080612,
    sunColor: 0x2a2a55,
    sunOpacity: 0.0,
    sunSize:  0.4,
    sunDir:   { x: 0, y: 0.1, z: 1 },
  },
  fog: { color: 0x080612, near: 12, far: 35 },
};

const PRESETS = {
  0: RECEPTION,
  1: LIBRARY,
  15: SERVER_ROOM,
};

export function getSkyPresetForZone(idx) {
  return PRESETS[idx] || DEFAULT_SKY;
}
