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

// Reusable scratch values so the per-frame transition tick allocates
// nothing. setHex/set return `this`, so they're safe to reuse.
const _tmpColor = new THREE.Color();
const _tmpVec3 = new THREE.Vector3();
function _lerp(a, b, t) { return a + (b - a) * t; }

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
    // Old accents fading out during a cross-fade transition.
    this._fadingAccents = [];

    // Track the current postfx params — read by the post-fx module via
    // getPostFx() (so the composer can be retuned on transition).
    this.postfx = { ...DEFAULT_PRESET.postfx };

    // Progressive zone transition state. The previous implementation
    // snapped every value the instant the player crossed a zone boundary,
    // which read as a strobe-like jump on the way into the west wing or
    // up the elevator. Now applyPreset() captures a FROM snapshot and the
    // tick(dt) loop lerps over ~1.2 s.
    this._fromState = null;
    this._targetPreset = null;
    this._targetIntensity = { accents: [] };
    this._transitionDur = 1.2;
    this._transitionT = 0;
  }

  applyPreset(zoneIdx, opts = {}) {
    if (zoneIdx === this.currentIdx && !opts.force) return; // no-op
    const preset = getPresetForZone(zoneIdx);
    this.currentIdx = zoneIdx;
    this._lastPreset = preset; // exposed for timeOfDay.js to read baseline

    // First call OR explicit immediate snap — write everything at once.
    if (opts.immediate || !this._fromState && this.currentIdx === zoneIdx && !this.accents.length) {
      this._applyImmediate(preset);
      return;
    }

    // Build a FROM snapshot from the LIVE state (handles mid-transition
    // gracefully — a fast back-and-forth keeps interpolating from where we
    // are, not from the previous TARGET).
    this._fromState = {
      hemiSky: this.hemi.color.clone(),
      hemiGround: this.hemi.groundColor.clone(),
      hemiIntensity: this.hemi.intensity,
      dirColor: this.dir.color.clone(),
      dirIntensity: this.dir.intensity,
      dirPosition: this.dir.position.clone(),
      background: this.scene.background?.isColor ? this.scene.background.clone() : null,
      fogColor: this.scene.fog?.color?.clone?.() || null,
      fogNear: this.scene.fog?.near ?? null,
      fogFar: this.scene.fog?.far ?? null,
      postfx: { ...this.postfx },
    };

    // Cross-fade accents: keep the current set, but mark them for fade-out
    // (store each accent's current intensity as its 'start' value so we can
    // ramp it to 0). The new accents spawn at intensity 0 and ramp UP to
    // their preset target during the transition.
    this._fadingAccents = this.accents.map(a => ({ light: a, start: a.intensity }));
    this.accents = [];
    this.accentTargets = [];   // new accents will push fresh targets

    // Shadow + permanent dir-config swap — these aren't lerped (changing
    // shadow map size mid-render is more disruptive than just letting the
    // next frame use the new size).
    const d = preset.directional;
    this.dir.castShadow = !!d.castShadow;
    if (d.shadowBias !== undefined) this.dir.shadow.bias = d.shadowBias;
    this._setShadowBounds(this.dir, d.shadowBounds);
    const baseSize = d.shadowMapSize || 1024;
    this._setShadowMapSize(this.dir, this.mobile ? Math.max(512, baseSize / 2) : baseSize);

    // Spawn new accents at intensity 0 — tick() will ramp them in.
    this._targetIntensity = { accents: [] };
    if (Array.isArray(preset.accents)) {
      preset.accents.forEach((a) => {
        const light = this._addAccent({ ...a, intensity: 0 });
        this._targetIntensity.accents.push(a.intensity);
        if (light) light._targetIntensity = a.intensity;
      });
    }

    // Background/fog get their TO value cached for the lerp. If the new
    // preset has no fog and the old one did, fade alpha-style by easing
    // far→∞; in practice we just clear at the end.
    this._targetPreset = preset;
    this._transitionT = 0;
  }

  // Snap-apply path used on the FIRST preset (no FROM state available)
  // and for explicit immediate re-apply (e.g. timeOfDay.reapply()).
  _applyImmediate(preset) {
    this.hemi.color.setHex(preset.ambient.skyColor);
    this.hemi.groundColor.setHex(preset.ambient.groundColor);
    this.hemi.intensity = preset.ambient.intensity;

    const d = preset.directional;
    this.dir.color.setHex(d.color);
    this.dir.intensity = d.intensity;
    this.dir.position.set(d.position[0], d.position[1], d.position[2]);
    this.dir.castShadow = !!d.castShadow;
    if (d.shadowBias !== undefined) this.dir.shadow.bias = d.shadowBias;
    this._setShadowBounds(this.dir, d.shadowBounds);
    const baseSize = d.shadowMapSize || 1024;
    this._setShadowMapSize(this.dir, this.mobile ? Math.max(512, baseSize / 2) : baseSize);

    if (preset.background !== undefined) {
      this.scene.background = new THREE.Color(preset.background);
    }
    if (preset.fog) {
      this.scene.fog = new THREE.Fog(preset.fog.color, preset.fog.near, preset.fog.far);
    } else {
      this.scene.fog = null;
    }

    this._removeAccents();
    this._fadingAccents = [];
    if (Array.isArray(preset.accents)) {
      preset.accents.forEach((a) => this._addAccent(a));
    }

    this.postfx = { ...preset.postfx };
    this._fromState = null;
    this._targetPreset = null;
    this._transitionT = this._transitionDur;
  }

  // Per-frame interpolation. Called from play.js main update loop.
  tick(dt) {
    if (!this._fromState || !this._targetPreset) return;
    this._transitionT = Math.min(this._transitionDur, this._transitionT + dt);
    const t = this._transitionT / this._transitionDur;
    // Smoothstep — easeInOut feels much less mechanical than linear,
    // especially on the directional Y position swing.
    const e = t * t * (3 - 2 * t);
    const f = this._fromState;
    const p = this._targetPreset;

    // Hemisphere
    this.hemi.color.copy(f.hemiSky).lerp(_tmpColor.setHex(p.ambient.skyColor), e);
    this.hemi.groundColor.copy(f.hemiGround).lerp(_tmpColor.setHex(p.ambient.groundColor), e);
    this.hemi.intensity = _lerp(f.hemiIntensity, p.ambient.intensity, e);

    // Directional
    this.dir.color.copy(f.dirColor).lerp(_tmpColor.setHex(p.directional.color), e);
    this.dir.intensity = _lerp(f.dirIntensity, p.directional.intensity, e);
    this.dir.position.lerpVectors(f.dirPosition,
      _tmpVec3.set(p.directional.position[0], p.directional.position[1], p.directional.position[2]), e);

    // Background — only if both presets specify one (color lerp).
    if (p.background !== undefined && f.background) {
      if (!this.scene.background?.isColor) this.scene.background = new THREE.Color();
      this.scene.background.copy(f.background).lerp(_tmpColor.setHex(p.background), e);
    } else if (p.background !== undefined && !f.background) {
      this.scene.background = new THREE.Color(p.background);
    }

    // Fog — lerp color + near + far when both have fog; otherwise snap on
    // completion (rare path).
    if (p.fog && f.fogColor) {
      if (!this.scene.fog) this.scene.fog = new THREE.Fog(p.fog.color, f.fogNear, f.fogFar);
      this.scene.fog.color.copy(f.fogColor).lerp(_tmpColor.setHex(p.fog.color), e);
      this.scene.fog.near = _lerp(f.fogNear, p.fog.near, e);
      this.scene.fog.far = _lerp(f.fogFar, p.fog.far, e);
    }

    // Accents — fade incoming UP and fading set DOWN.
    for (const a of this.accents) {
      if (a._targetIntensity !== undefined) a.intensity = a._targetIntensity * e;
    }
    for (const fa of this._fadingAccents) {
      fa.light.intensity = fa.start * (1 - e);
    }

    // Postfx — lerp scalar params so the composer ramps smoothly.
    const fpfx = f.postfx;
    const tpfx = p.postfx || {};
    const blended = { ...tpfx };
    for (const k of Object.keys(tpfx)) {
      if (typeof tpfx[k] === 'number' && typeof fpfx[k] === 'number') {
        blended[k] = _lerp(fpfx[k], tpfx[k], e);
      }
    }
    this.postfx = blended;

    // Done — clean up.
    if (t >= 1) {
      for (const fa of this._fadingAccents) {
        this.scene.remove(fa.light);
        if (fa.light.shadow?.map) fa.light.shadow.map.dispose();
      }
      this._fadingAccents = [];
      if (!p.fog) this.scene.fog = null;
      this.postfx = { ...tpfx };
      this._fromState = null;
      this._targetPreset = null;
    }
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
    // Caller may pre-zero the intensity for fade-in during transitions —
    // the lerp tick will ramp it to cfg._target.
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
    return light;
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
