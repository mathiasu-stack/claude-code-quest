// Per-zone lighting + post-fx presets.
//
// One config object per zone index (0 = Reception, 1 = Library, etc.).
// Zones 3-16 (indexes 2-15) currently fall back to DEFAULT_PRESET.
// To author a custom preset for a later zone, add an entry to ZONE_PRESETS
// keyed by the zone index (matching ZONE_BOUNDS in play.js).
//
// All numeric values are intentionally explicit so a designer can tweak
// without reading the LightingManager. Colors are hex (THREE.Color
// understands the number form).

export const DEFAULT_PRESET = {
  ambient: {
    skyColor: 0xeaf3ff,    // top hemisphere fill
    groundColor: 0x445566, // bottom hemisphere fill (subtle bounce)
    intensity: 0.45,
  },
  directional: {
    color: 0xfff4e6,
    intensity: 0.7,
    position: [10, 16, 8],
    castShadow: true,
    shadowMapSize: 1024,
    shadowBounds: 18,   // half-width of orthographic shadow camera
    shadowBias: -0.0005,
  },
  // Optional: extra accent lights (spot/point). Each one is opt-in per zone.
  accents: [],
  // Background + fog tied to zone mood.
  background: 0xeaf3ff,
  fog: { color: 0xeaf3ff, near: 30, far: 70 },
  // Post-fx preset (consumed by play/postfx/composer.js).
  postfx: {
    bloomStrength: 0.35,
    bloomRadius: 0.6,
    bloomThreshold: 0.85,
    vignette: 0.35,        // 0 = off, 1 = heavy
    grain: 0.0,            // disabled by default
  },
};

// Zone 0 — Reception. Warm sunlight through implied windows + soft fill.
// CEO portrait gets its own accent so the gilded frame catches highlights.
const RECEPTION_PRESET = {
  ambient: {
    skyColor: 0xfff5e0,    // warm sky
    groundColor: 0x4a3a2a, // warm bounce off carpet
    intensity: 0.55,
  },
  directional: {
    color: 0xffd9a0,       // golden-hour sun
    intensity: 1.05,
    // Coming through the right wall (positive X) at a low angle, simulating
    // tall windows on the east side of the office.
    position: [14, 11, 4],
    castShadow: true,
    shadowMapSize: 1536,
    shadowBounds: 16,
    shadowBias: -0.0005,
  },
  accents: [
    // Soft warm front-fill so faces aren't pure shadow on the back side.
    { type: 'point',  color: 0xffe2bc, intensity: 0.45, distance: 16, decay: 1.6, position: [-4, 3.0, 4]  },
    // Spotlight on the CEO portrait (back wall, centred).
    { type: 'spot',
      color: 0xfff1d4, intensity: 1.4, distance: 9, decay: 1.4,
      angle: 0.42, penumbra: 0.55,
      position: [0, 3.4, -7],
      target:   [0, 2.0, -10.86],
      castShadow: false },
    // Cool rim from the doorway side to balance the warm sun.
    { type: 'point',  color: 0xb8d8ff, intensity: 0.25, distance: 14, decay: 2.0, position: [0, 2.8, 9]   },
  ],
  background: 0xf3e7d2,
  fog: { color: 0xf3e7d2, near: 28, far: 70 },
  postfx: {
    bloomStrength: 0.55,
    bloomRadius: 0.75,
    bloomThreshold: 0.8,
    vignette: 0.35,
    grain: 0.04,
  },
};

// Zone 1 — Knowledge Library. Dim, warm tungsten lamps with cool ambient.
// Long shadows pulled from bookshelves with a low directional sun.
const LIBRARY_PRESET = {
  ambient: {
    skyColor: 0x6c7da3,    // cool dusk
    groundColor: 0x231a12, // dark-wood bounce
    intensity: 0.35,
  },
  directional: {
    color: 0xb6c5e5,       // pale moonish daylight through skylights
    intensity: 0.4,
    position: [-6, 14, 18],
    castShadow: true,
    shadowMapSize: 1024,
    shadowBounds: 14,
    shadowBias: -0.0005,
  },
  accents: [
    // Two tungsten desk lamps over the reading tables (matching geometry
    // already placed at z=16 and z=22). These REPLACE the weak 0.6-intensity
    // PointLights baked into buildLamp(). The originals are left in place
    // since they're embedded in the geometry; LightingManager dims them.
    { type: 'point', color: 0xffb95c, intensity: 1.6, distance: 7,  decay: 1.4, position: [0, 2.1, 16] },
    { type: 'point', color: 0xffb95c, intensity: 1.6, distance: 7,  decay: 1.4, position: [0, 2.1, 22] },
    // Cool rim from the back / Capstone doorway side to give bookshelves edges.
    { type: 'point', color: 0x7db0ff, intensity: 0.35, distance: 16, decay: 2.0, position: [0, 3.0, 30] },
  ],
  background: 0x1a1d2a,
  fog: { color: 0x1a1d2a, near: 18, far: 55 },
  postfx: {
    bloomStrength: 0.85,
    bloomRadius: 0.85,
    bloomThreshold: 0.7,
    vignette: 0.55,
    grain: 0.06,
  },
};

// Indexed lookup. Add new entries here for zones 2..15 as they're authored.
export const ZONE_PRESETS = {
  0: RECEPTION_PRESET,
  1: LIBRARY_PRESET,
  // 2: ATRIUM_PRESET,         // ch03 — to author later
  // 3: MEMORY_VAULT_PRESET,   // ch04 — to author later
  // ...
};

export function getPresetForZone(idx) {
  return ZONE_PRESETS[idx] || DEFAULT_PRESET;
}
