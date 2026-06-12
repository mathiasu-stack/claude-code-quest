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

// Zone 1 — Knowledge Library (west wing, room center [-22, -22]).
//
// HISTORY: the library originally sat directly south of reception
// (z=+11..+33) and this preset's accents were authored for that slot.
// The floor-1 restructure moved the library to the west wing — the
// accents below are the same recipe TRANSLATED to the new room:
//   • three tungsten pendants down the room's spine at z=-28/-22/-16
//     (paired with the pendant cone shades in world/ceilings.js)
//   • a soft head-height fill at room center so faces have key
// Brightness-lift tuning notes from the old slot still apply (ambient
// 1.35 / directional 1.20 — playtests below that felt dim).
//
// LIGHT BUDGET: 4 accents here + 4 always-on builder table lamps on
// floor 1 (2 library lounge + 1 Files + 1 Plan Mode) = 8 point lights
// active in this zone. Do not add accents without removing something.
const LIBRARY_PRESET = {
  ambient: {
    skyColor: 0xc8d4f0,    // brighter, slightly warmer cool sky
    groundColor: 0x6b5436, // brighter warm wood bounce
    intensity: 1.35,
  },
  directional: {
    color: 0xdde6f4,
    intensity: 1.20,
    position: [-28, 14, -26],  // above the west wing, raking NW → SE
    castShadow: true,
    shadowMapSize: 1024,
    shadowBounds: 14,
    shadowBias: -0.0005,
  },
  accents: [
    // Tungsten pendants over the bookshelf rows + lounge spine.
    { type: 'point', color: 0xffc77a, intensity: 2.6, distance: 11, decay: 1.4, position: [-22, 2.1, -28] },
    { type: 'point', color: 0xffc77a, intensity: 2.4, distance: 11, decay: 1.4, position: [-22, 2.1, -22] },
    { type: 'point', color: 0xffc77a, intensity: 2.6, distance: 11, decay: 1.4, position: [-22, 2.1, -16] },
    // Soft fill at character head height — lifts faces out of silhouette.
    { type: 'point', color: 0xfff1c5, intensity: 1.20, distance: 16, decay: 1.4, position: [-22, 1.7, -22] },
  ],
  background: 0x2c344a,
  fog: { color: 0x2c344a, near: 28, far: 75 },
  postfx: {
    bloomStrength: 0.65,
    bloomRadius: 0.80,
    bloomThreshold: 0.82,   // only true highlights bloom
    vignette: 0.32,         // corners were eating characters at 0.55
    grain: 0.04,
  },
};

// Zone 2 — File Workshop (west wing, room center [-22, 0]).
// Warm neutral office: one overhead warm pool at room center (over the
// table + lamp), one cool rim off the filing-cabinet west wall.
// Budget: 2 accents + the 4 floor-1 builder lamps = 6 points active.
const WEST_FILES_PRESET = {
  ambient: {
    skyColor: 0xf2ead8,
    groundColor: 0x5c4a38,
    intensity: 1.05,
  },
  directional: {
    color: 0xffeccc,
    intensity: 1.10,
    position: [-30, 14, 8],
    castShadow: true,
    shadowMapSize: 1024,
    shadowBounds: 16,
    shadowBias: -0.0005,
  },
  accents: [
    { type: 'point', color: 0xffe2bc, intensity: 1.20, distance: 14, decay: 1.5, position: [-22, 2.6, 0] },
    { type: 'point', color: 0xb8d8ff, intensity: 0.45, distance: 12, decay: 1.8, position: [-30, 2.6, 0] },
  ],
  background: 0xefe6d4,
  fog: { color: 0xefe6d4, near: 30, far: 80 },
  postfx: {
    bloomStrength: 0.40,
    bloomRadius: 0.70,
    bloomThreshold: 0.85,
    vignette: 0.30,
    grain: 0.02,
  },
};

// Zone 3 — Plan Mode (west wing, room center [-22, 22]).
// Same office recipe shifted south, cooled toward the zone's blue
// "Memory Vault"-adjacent theme. Budget: 2 accents + 4 lamps = 6.
const WEST_PLANMODE_PRESET = {
  ambient: {
    skyColor: 0xdfe8f6,
    groundColor: 0x46506a,
    intensity: 1.05,
  },
  directional: {
    color: 0xeaf2ff,
    intensity: 1.10,
    position: [-30, 14, 30],
    castShadow: true,
    shadowMapSize: 1024,
    shadowBounds: 16,
    shadowBias: -0.0005,
  },
  accents: [
    { type: 'point', color: 0xdce8ff, intensity: 1.20, distance: 14, decay: 1.5, position: [-22, 2.6, 22] },
    { type: 'point', color: 0xffe2bc, intensity: 0.50, distance: 12, decay: 1.8, position: [-30, 2.6, 22] },
  ],
  background: 0xe4ebf6,
  fog: { color: 0xe4ebf6, near: 30, far: 80 },
  postfx: {
    bloomStrength: 0.40,
    bloomRadius: 0.70,
    bloomThreshold: 0.85,
    vignette: 0.30,
    grain: 0.02,
  },
};

// Indexed lookup. Add new entries here for zones 4..15 as they're authored.
//
// Zone indexes are ROOM-AWARE now (play.js zoneIndexAt checks the room
// AABBs in data/rooms.js first): zone 1 means "inside the library room"
// at [-22,-22], not the old z=+11..+33 band. The exterior space that
// band used to cover resolves to zone 0 (bright daytime) via the
// fallback in zoneIndexAt, so mapping 1 → LIBRARY_PRESET no longer
// darkens the outdoors.
export const ZONE_PRESETS = {
  0: RECEPTION_PRESET,
  1: LIBRARY_PRESET,
  2: WEST_FILES_PRESET,
  3: WEST_PLANMODE_PRESET,
};

// Unauthored zones (chapters 3-16 on floor 1's z-axis don't represent
// real interior rooms anymore; the building is now multi-room with
// the library + west wing on the X axis instead) fall back to
// RECEPTION_PRESET. That means anywhere outside the building — far
// south, north, or wherever a player wanders without a preset —
// reads as bright daytime instead of the dim DEFAULT_PRESET which
// was making "outside" feel like night.
export function getPresetForZone(idx) {
  return ZONE_PRESETS[idx] || RECEPTION_PRESET;
}
