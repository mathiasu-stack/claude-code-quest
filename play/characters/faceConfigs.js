// faceConfigs.js — per-character configs for the flatFace canvas drawer.
//
// Each entry describes the values the drawing functions read. All values
// are optional with sensible defaults in flatFace.js, so missing entries
// don't crash.
//
// Schema:
//   skin:       0xRRGGBB — head + face canvas background
//   hair:       0xRRGGBB — used for brow color if browColor unset
//   browColor:  0xRRGGBB — explicit brow color (else derived from hair)
//   eyeColor:   0xRRGGBB — iris color
//   eyeShape:   'oval' | 'round' | 'sleepy' | 'sharp' | 'dot'
//   browShape:  'soft' | 'arched' | 'flat' | 'thick' | 'thin' | 'angry'
//   mouthShape: 'smile' | 'open-smile' | 'smirk' | 'flat' | 'gentle' |
//               'frown' | 'pout'
//   blush:      true | false
//   nose:       true | false
//   freckles:   true | false
//   beautyMark: true | false
//   beard:      null | 'stubble' | 'full'   (canvas-drawn, NOT 3D)
//   hairStyle:  'short' | 'long' | 'bob' | 'bob-bangs' | 'bun' |
//               'ponytail' | 'spiky' | 'buzz' | 'side-part' | 'hijab' |
//               'bald'   (used by the 3D hair builder)

export const FACE_CONFIGS = {
  // ── Player (explicit entry so the brief's "player must have a face"
  //    requirement is structurally guaranteed) ───────────────────────
  player: {
    skin: 0xfdd9b5, hair: 0x3a2010, hairStyle: 'short',
    eyeColor: 0x4a7a96,                  // friendly bright blue
    eyeShape: 'oval',
    browShape: 'soft',
    mouthShape: 'gentle',                // open-friendly default
    blush: true,
  },

  // ── Hand-tuned named NPCs ────────────────────────────────────────
  linda: {
    skin: 0xfdd9b5, hair: 0x4a2c0f, hairStyle: 'bob',
    eyeColor: 0x6b4a2a, eyeShape: 'oval',
    browShape: 'soft',
    mouthShape: 'smile',
    blush: true,
  },
  marcus: {
    skin: 0x8d5524, hair: 0x1a1a1a, hairStyle: 'short',
    eyeColor: 0x5a3a1f, eyeShape: 'sharp',
    browShape: 'thick',
    mouthShape: 'smirk',
    blush: false,
    beard: 'stubble',
  },
  aisha: {
    skin: 0xc68642, hair: 0x1a1a1a, hairStyle: 'long',
    eyeColor: 0x4a2a14, eyeShape: 'oval',
    browShape: 'soft',
    mouthShape: 'gentle',
    blush: true,
    glasses: true,                 // 3D glasses still added by makeCharacter
  },
  kenji: {
    skin: 0xf1c27d, hair: 0x0d0d0d, hairStyle: 'spiky',
    eyeColor: 0x896a3d, eyeShape: 'round',
    browShape: 'arched',
    mouthShape: 'open-smile',
    blush: false,
  },
  diana: {
    skin: 0xfdd9b5, hair: 0xc8a572, hairStyle: 'bob',
    eyeColor: 0x4a7a96, eyeShape: 'oval',
    browShape: 'arched',
    mouthShape: 'gentle',
    blush: true,
    glasses: true,
  },
  sarah: {
    skin: 0xf1c27d, hair: 0x1a1a1a, hairStyle: 'ponytail',
    eyeColor: 0x4a2a14, eyeShape: 'sharp',
    browShape: 'flat',
    mouthShape: 'flat',
    blush: false,
  },
  elena: {
    skin: 0xfdd9b5, hair: 0x2c1810, hairStyle: 'long',
    eyeColor: 0x4a7a3f, eyeShape: 'sharp',
    browShape: 'soft',
    mouthShape: 'gentle',
    blush: true,
    glasses: true,
    beautyMark: true,
  },
  raj: {
    skin: 0xc68642, hair: 0x1a0c08, hairStyle: 'short',
    eyeColor: 0x4a2a14, eyeShape: 'oval',
    browShape: 'thick',
    mouthShape: 'smile',
    blush: false,
    beard: 'full',
  },
  mei: {
    skin: 0xf1c27d, hair: 0x1a1a1a, hairStyle: 'bob-bangs',
    eyeColor: 0x4a2a14, eyeShape: 'oval',
    browShape: 'soft',
    mouthShape: 'gentle',
    blush: true,
  },
  noor: {
    skin: 0x8d5524, hair: 0x1a1a1a, hairStyle: 'hijab',
    eyeColor: 0x3a2010, eyeShape: 'oval',
    browShape: 'soft',
    mouthShape: 'smile',
    blush: true,
  },
};

// Auto-generated NPC config — derived from a hash of the NPC id so each
// stays consistent across reloads but is still varied.
const SKIN_POOL = [0xfdd9b5, 0xf1c27d, 0xc68642, 0x8d5524, 0xe0ac69];
const HAIR_POOL = [0x1a1a1a, 0x2c1810, 0x4a2c0f, 0x6a3c1a, 0xc8a572, 0xa67b5b];
const HAIR_STYLES = ['short', 'long', 'bob', 'bun', 'ponytail', 'side-part', 'spiky', 'bob-bangs'];
const EYE_COLORS = [0x4a2a14, 0x6b4a2a, 0x896a3d, 0x4a7a96, 0x4a7a3f, 0x6a6a6a];
const EYE_SHAPES = ['oval', 'round', 'sharp'];
const BROW_SHAPES = ['soft', 'arched', 'flat', 'thick', 'thin'];
const MOUTH_SHAPES = ['smile', 'gentle', 'smirk', 'flat'];

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function pick(arr, n) { return arr[n % arr.length]; }

export function getFaceConfig(id, fallbackSeed = 0) {
  if (FACE_CONFIGS[id]) return FACE_CONFIGS[id];
  const seed = hashStr(id) + fallbackSeed;
  return {
    skin:       pick(SKIN_POOL, seed),
    hair:       pick(HAIR_POOL, seed + 3),
    hairStyle:  pick(HAIR_STYLES, seed + 5),
    eyeColor:   pick(EYE_COLORS, seed + 7),
    eyeShape:   pick(EYE_SHAPES, seed + 11),
    browShape:  pick(BROW_SHAPES, seed + 13),
    mouthShape: pick(MOUTH_SHAPES, seed + 17),
    blush:      (seed % 3) !== 0,
    glasses:    (seed % 5) === 0,
    beard:      (seed % 9) === 0 ? 'stubble' : null,
    freckles:   (seed % 11) === 0,
  };
}
