// LightingManager — owns all scene lighting + background/fog and
// swaps presets when the player changes zone.
//
// Usage from play.js:
//   import { LightingManager } from './lighting/manager.js';
//   const lighting = new LightingManager(scene, { mobile: isMobile() });
//   lighting.applyPreset(0);   // call this once after buildWorld()
//   ...
//   lighting.applyPreset(newZoneIdx);   // when zone changes
//
// Notes
//  • `mobile` flag halves shadow map sizes and discards `castShadow` on
//    accent spot/point lights to keep mobile under budget.
//  • Lights are owned by the manager and reused across preset changes
//    (we tween or replace, depending on type) so we don't churn GL state.
//  • If a preset doesn't define a key (e.g. no `accents`), the previous
//    accents are removed.

import * as THREE from 'three';
import { getPresetForZone, DEFAULT_PRESET } from './zone-presets.js';

export class LightingManager {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.mobile = !!opts.mobile;
    this.currentIdx = -1;

    // Persistent core lights — we re-tune these per preset rather than
    // re-allocate, so the renderer's light list stays stable.
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x445566, 0.45);
    this.scene.add(this.hemi);

    this.dir = new THREE.DirectionalLight(0xffffff, 0.7);
    this.dir.position.set(10, 16, 8);
    this.dir.castShadow = true;
    this.dir.shadow.camera.near = 0.5;
    this.dir.shadow.camera.far = 60;
    this.dir.shadow.bias = -0.0005;
    this._setShadowBounds(this.dir, 18);
    this._setShadowMapSize(this.dir, 1024);
    this.scene.add(this.dir);

    // Track of accent lights we own for the current preset.
    this.accents = [];
    this.accentTargets = []; // for spotlights with target objects

    // Track the current postfx params — read by the post-fx module via
    // getPostFx() (so the composer can be retuned on transition).
    this.postfx = { ...DEFAULT_PRESET.postfx };
  }

  applyPreset(zoneIdx) {
    if (zoneIdx === this.currentIdx) return; // no-op
    const preset = getPresetForZone(zoneIdx);
    this.currentIdx = zoneIdx;

    // Ambient
    this.hemi.color.setHex(preset.ambient.skyColor);
    this.hemi.groundColor.setHex(preset.ambient.groundColor);
    this.hemi.intensity = preset.ambient.intensity;

    // Directional
    const d = preset.directional;
    this.dir.color.setHex(d.color);
    this.dir.intensity = d.intensity;
    this.dir.position.set(d.position[0], d.position[1], d.position[2]);
    this.dir.castShadow = !!d.castShadow;
    if (d.shadowBias !== undefined) this.dir.shadow.bias = d.shadowBias;
    this._setShadowBounds(this.dir, d.shadowBounds);
    const baseSize = d.shadowMapSize || 1024;
    this._setShadowMapSize(this.dir, this.mobile ? Math.max(512, baseSize / 2) : baseSize);

    // Background + fog
    if (preset.background !== undefined) {
      this.scene.background = new THREE.Color(preset.background);
    }
    if (preset.fog) {
      this.scene.fog = new THREE.Fog(preset.fog.color, preset.fog.near, preset.fog.far);
    } else {
      this.scene.fog = null;
    }

    // Replace accents — simpler than diffing for this scale.
    this._removeAccents();
    if (Array.isArray(preset.accents)) {
      preset.accents.forEach((a) => this._addAccent(a));
    }

    // Stash post-fx for the composer to read.
    this.postfx = { ...preset.postfx };
  }

  getPostFx() {
    return this.postfx;
  }

  dispose() {
    this._removeAccents();
    this.scene.remove(this.hemi);
    this.scene.remove(this.dir);
    if (this.dir.shadow?.map) this.dir.shadow.map.dispose();
  }

  // ── internal ──────────────────────────────────────────────────────────────

  _setShadowBounds(light, half) {
    light.shadow.camera.left = -half;
    light.shadow.camera.right = half;
    light.shadow.camera.top = half;
    light.shadow.camera.bottom = -half;
    light.shadow.camera.updateProjectionMatrix();
  }

  _setShadowMapSize(light, size) {
    if (light.shadow.mapSize.x !== size) {
      light.shadow.mapSize.set(size, size);
      // Force GL texture rebuild on next render
      if (light.shadow.map) {
        light.shadow.map.dispose();
        light.shadow.map = null;
      }
    }
  }

  _addAccent(cfg) {
    let light;
    if (cfg.type === 'spot') {
      light = new THREE.SpotLight(
        cfg.color,
        cfg.intensity,
        cfg.distance ?? 0,
        cfg.angle ?? Math.PI / 6,
        cfg.penumbra ?? 0.4,
        cfg.decay ?? 1.5,
      );
      light.position.set(cfg.position[0], cfg.position[1], cfg.position[2]);
      if (cfg.target) {
        const target = new THREE.Object3D();
        target.position.set(cfg.target[0], cfg.target[1], cfg.target[2]);
        this.scene.add(target);
        light.target = target;
        this.accentTargets.push(target);
      }
      // Spot shadows are expensive — only honour castShadow on desktop.
      light.castShadow = !!cfg.castShadow && !this.mobile;
      if (light.castShadow) {
        light.shadow.mapSize.set(512, 512);
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = (cfg.distance || 10) + 2;
      }
    } else {
      // point (default)
      light = new THREE.PointLight(
        cfg.color,
        cfg.intensity,
        cfg.distance ?? 0,
        cfg.decay ?? 1.5,
      );
      light.position.set(cfg.position[0], cfg.position[1], cfg.position[2]);
      light.castShadow = !!cfg.castShadow && !this.mobile;
    }
    this.scene.add(light);
    this.accents.push(light);
  }

  _removeAccents() {
    for (const a of this.accents) {
      this.scene.remove(a);
      if (a.shadow?.map) a.shadow.map.dispose();
    }
    for (const t of this.accentTargets) {
      this.scene.remove(t);
    }
    this.accents = [];
    this.accentTargets = [];
  }
}
