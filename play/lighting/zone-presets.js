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
// Tuning notes (env run): bumped ambient intensity and added more fill
// so the room reads brighter overall while still keeping the warm key.
const RECEPTION_PRESET = {
  // Atrium needs to feel BRIGHT and grand, not dim/murky.
  ambient: {
    skyColor: 0xfff8ec,
    groundColor: 0x6a5240,
    intensity: 1.20,
  },
  directional: {
    color: 0xffe4b8,
    intensity: 1.50,
    position: [14, 14, 4],
    castShadow: true,
    shadowMapSize: 1536,
    shadowBounds: 18,
    shadowBias: -0.0005,
  },
  accents: [
    // High-up atrium fill near the chandelier — gives the tall space
    // overall warmth and reads as a chandelier source.
    { type: 'point',  color: 0xfff1c5, intensity: 2.2, distance: 24, decay: 1.4, position: [0, 10, 0]   },
    // Soft warm front-fill — bumped so faces are visible everywhere.
    { type: 'point',  color: 0xffe2bc, intensity: 0.85, distance: 18, decay: 1.5, position: [-4, 3.0, 4]  },
    // Second front-fill on the east side balancing the directional.
    { type: 'point',  color: 0xffe2bc, intensity: 0.65, distance: 14, decay: 1.6, position: [4, 3.0, 4]   },
    // Spotlight on the CEO portrait (back wall, centred).
    { type: 'spot',
      color: 0xfff1d4, intensity: 1.6, distance: 9, decay: 1.4,
      angle: 0.42, penumbra: 0.55,
      position: [0, 3.4, -7],
      target:   [0, 2.0, -10.86],
      castShadow: false },
    // Cool rim from the doorway side to balance the warm sun.
    { type: 'point',  color: 0xb8d8ff, intensity: 0.35, distance: 16, decay: 2.0, position: [0, 2.8, 9]   },
    // Centerpiece pool — light is emitted FROM INSIDE the rotating K
    // sculpture (1.7m up, where the K's body sits) instead of floating
    // above unanchored. Gives the K an internal glow without a phantom
    // light blob on the floor.
    { type: 'point', color: 0xffd680, intensity: 0.55, distance: 5, decay: 1.6, position: [0, 1.7, 1] },
  ],
  background: 0xf3e7d2,
  fog: { color: 0xf3e7d2, near: 30, far: 75 },
  postfx: {
    bloomStrength: 0.6,
    bloomRadius: 0.78,
    bloomThreshold: 0.82,
    vignette: 0.30,
    grain: 0.03,
  },
};

// Zone 1 — Knowledge Library. Dim + cozy, but readable now.
// Tuning notes: lifted ambient slightly so faces near desks aren't
// completely in shadow; pendant lamps already in geometry add the rest.
const LIBRARY_PRESET = {
  ambient: {
    skyColor: 0x8898c0,    // was 0x6c7da3 — slightly lighter
    groundColor: 0x2a1f17, // warmer wood bounce
    intensity: 0.5,         // was 0.35
  },
  directional: {
    color: 0xb6c5e5,
    intensity: 0.55,        // was 0.4
    position: [-6, 14, 18],
    castShadow: true,
    shadowMapSize: 1024,
    shadowBounds: 14,
    shadowBias: -0.0005,
  },
  accents: [
    // Two tungsten desk lamps — bumped slightly for clearer pools.
    { type: 'point', color: 0xffb95c, intensity: 1.9, distance: 8,  decay: 1.4, position: [0, 2.1, 16] },
    { type: 'point', color: 0xffb95c, intensity: 1.9, distance: 8,  decay: 1.4, position: [0, 2.1, 22] },
    // Warm light "streaming" from the new arched window onto the floor.
    { type: 'point', color: 0xfff1c5, intensity: 0.8, distance: 10, decay: 1.6, position: [8, 2.5, 24] },
    // Cool rim from the back wall.
    { type: 'point', color: 0x7db0ff, intensity: 0.45, distance: 16, decay: 2.0, position: [0, 3.0, 30] },
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
