// timeOfDay.js — modulate the active lighting + sky preset by the
// player's local clock. Updates once per second, then per-frame this
// just reads cached values.
//
// Anchor periods (linear interpolation between):
//   05:00 dawn          (deep blue + low warm sun)
//   07:00 sunrise       (warm gold, low directional)
//   12:00 midday        (bright neutral)
//   17:00 golden hour   (long orange shadows)
//   20:00 blue hour     (cooler ambient, lamps emphasized)
//   22:00 night         (dark sky, lamps dominant)
//
// We DO NOT replace the per-zone preset values — instead, we wrap them
// with a multiplier (intensity scale + color tint) that's applied on
// top each second. The original preset values stay intact in
// LightingManager.

import * as THREE from 'three';

// Anchor periods. Each anchor is (hour, modifier).
//   skyTopMul / skyHorizonMul: multiplied into sky preset colors.
//   sunOpacity: replaces the preset sunOpacity (clamped).
//   sunDir: replaces the preset sunDir (low at sunrise/sunset).
//   directionalIntensityScale: multiplier on the zone preset's directional.
//   ambientIntensityScale: multiplier on hemisphere intensity.
//   exposure: replaces tone-mapping exposure on the renderer.
//   nightWindowGlow: 0–1, fades up the lit-window planes on the skyline.
const ANCHORS = [
  // 0:00 — deep night
  { hour: 0,  skyTint: 0x0a0a18, ambientTint: 0x222244,
    directionalIntensityScale: 0.25, ambientIntensityScale: 0.55,
    sunOpacity: 0.0, sunDirY: 0.05, exposure: 0.85, nightWindowGlow: 1.0 },
  // 5:00 — dawn
  { hour: 5,  skyTint: 0x2a3a5a, ambientTint: 0x3a4060,
    directionalIntensityScale: 0.45, ambientIntensityScale: 0.7,
    sunOpacity: 0.4, sunDirY: 0.12, exposure: 0.9, nightWindowGlow: 0.8 },
  // 7:00 — sunrise
  { hour: 7,  skyTint: 0xfdb072, ambientTint: 0xffd9b5,
    directionalIntensityScale: 0.95, ambientIntensityScale: 0.95,
    sunOpacity: 0.85, sunDirY: 0.25, exposure: 1.05, nightWindowGlow: 0.4 },
  // 12:00 — midday
  { hour: 12, skyTint: 0xffffff, ambientTint: 0xffffff,
    directionalIntensityScale: 1.15, ambientIntensityScale: 1.0,
    sunOpacity: 0.9, sunDirY: 0.85, exposure: 1.1, nightWindowGlow: 0.0 },
  // 17:00 — golden hour
  { hour: 17, skyTint: 0xffaa68, ambientTint: 0xffdbaf,
    directionalIntensityScale: 1.05, ambientIntensityScale: 0.95,
    sunOpacity: 0.95, sunDirY: 0.30, exposure: 1.1, nightWindowGlow: 0.2 },
  // 20:00 — blue hour
  { hour: 20, skyTint: 0x506590, ambientTint: 0x6c7da3,
    directionalIntensityScale: 0.55, ambientIntensityScale: 0.8,
    sunOpacity: 0.4, sunDirY: 0.10, exposure: 1.0, nightWindowGlow: 0.7 },
  // 22:00 — night
  { hour: 22, skyTint: 0x1a223a, ambientTint: 0x2a3050,
    directionalIntensityScale: 0.30, ambientIntensityScale: 0.6,
    sunOpacity: 0.05, sunDirY: 0.07, exposure: 0.9, nightWindowGlow: 1.0 },
];

function lerpHexColor(a, b, t) {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = (ar + (br - ar) * t) | 0;
  const g = (ag + (bg - ag) * t) | 0;
  const bx = (ab + (bb - ab) * t) | 0;
  return (r << 16) | (g << 8) | bx;
}

function lerp(a, b, t) { return a + (b - a) * t; }

// Hour-of-day in [0, 24) → blended modifier.
function modifierForHour(hour) {
  // Find the two surrounding anchors (cyclic).
  let lo = ANCHORS[ANCHORS.length - 1];
  let hi = ANCHORS[0];
  for (let i = 0; i < ANCHORS.length; i++) {
    if (ANCHORS[i].hour > hour) {
      hi = ANCHORS[i];
      lo = ANCHORS[(i - 1 + ANCHORS.length) % ANCHORS.length];
      break;
    }
    lo = ANCHORS[i];
  }
  // Compute fractional position between lo.hour and hi.hour, with wrap.
  const span = hi.hour > lo.hour ? hi.hour - lo.hour : (24 - lo.hour + hi.hour);
  const since = hour >= lo.hour ? hour - lo.hour : (24 - lo.hour + hour);
  const t = span === 0 ? 0 : Math.min(1, since / span);
  return {
    skyTint: lerpHexColor(lo.skyTint, hi.skyTint, t),
    ambientTint: lerpHexColor(lo.ambientTint, hi.ambientTint, t),
    directionalIntensityScale: lerp(lo.directionalIntensityScale, hi.directionalIntensityScale, t),
    ambientIntensityScale: lerp(lo.ambientIntensityScale, hi.ambientIntensityScale, t),
    sunOpacity: lerp(lo.sunOpacity, hi.sunOpacity, t),
    sunDirY: lerp(lo.sunDirY, hi.sunDirY, t),
    exposure: lerp(lo.exposure, hi.exposure, t),
    nightWindowGlow: lerp(lo.nightWindowGlow, hi.nightWindowGlow, t),
  };
}

export class TimeOfDay {
  constructor({ lighting, skyDome, renderer, receptionWindows }) {
    this.lighting = lighting;
    this.skyDome = skyDome;
    this.renderer = renderer;
    this.receptionWindows = receptionWindows;

    this._lastUpdate = 0;
    this._mod = null;
    this._tmpColor = new THREE.Color();
  }

  // Advance once per ~1 s. dt unused — driven by absolute time.
  tick(now) {
    if (now - this._lastUpdate < 1000) return;
    this._lastUpdate = now;
    const date = new Date();
    const hours = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
    const mod = modifierForHour(hours);
    this._mod = mod;
    this._apply();
  }

  // Re-apply the current modifier (called when zone changes so the new
  // preset starts from a sensible baseline).
  reapply() {
    if (this._mod) this._apply();
  }

  _apply() {
    const m = this._mod;
    if (!m) return;

    // Renderer exposure
    if (this.renderer) {
      this.renderer.toneMappingExposure = m.exposure;
    }

    // Lighting tweaks — scale intensities based on the preset values.
    const L = this.lighting;
    if (L) {
      const preset = (typeof L.currentIdx === 'number' && L.currentIdx >= 0)
        ? this._presetForIdx(L.currentIdx) : null;
      if (preset && L.dir) {
        L.dir.intensity = preset.directional.intensity * m.directionalIntensityScale;
        // Tint the directional toward sky tint (subtle)
        L.dir.color.setHex(preset.directional.color);
        L.dir.color.lerp(this._tmpColor.setHex(m.skyTint), 0.15);
      }
      if (preset && L.hemi) {
        L.hemi.intensity = preset.ambient.intensity * m.ambientIntensityScale;
        L.hemi.color.setHex(preset.ambient.skyColor);
        L.hemi.color.lerp(this._tmpColor.setHex(m.ambientTint), 0.18);
      }
    }

    // Sky tinting + sun position
    if (this.skyDome && this.skyDome.preset) {
      const sky = this.skyDome.preset;
      // Update sun direction Y — keep XZ component from the preset.
      const dir = sky.sunDir || { x: 0.5, y: 0.5, z: -0.5 };
      this.skyDome.setSunDirection({ x: dir.x, y: m.sunDirY, z: dir.z });
      this.skyDome.sun.material.opacity = m.sunOpacity;
    }

    // City window glow at night
    if (this.receptionWindows?._cityWindowPlanes) {
      for (const p of this.receptionWindows._cityWindowPlanes) {
        if (p.material) p.material.opacity = m.nightWindowGlow;
      }
    }
  }

  // Look up the lighting preset object for a zone idx — duplicated logic
  // from LightingManager so we avoid coupling. Tolerant of missing data.
  _presetForIdx(idx) {
    // The lighting module exports getPresetForZone but doesn't re-export
    // it through the manager API. We can read via window-scoped fall-back
    // — keep it stub-tolerant: if the manager has the preset we use it.
    return this.lighting?._lastPreset || null;
  }
}
