// npcLooks.js — per-NPC visual configs for the cartoonFace system.
//
// Lookup by NPC id (matches the id field in the NPCS roster in play.js).
// Each entry overrides specific look fields; missing fields fall back
// to the per-character defaults in the roster.

export const NPC_LOOKS = {
  linda: {
    skin: 0xfdd9b5,
    hair: 0x4a2c0f,
    hairStyle: 'bob',
    eyeColor: 0x6b4a2a,    // brown
    browShape: 'soft',
    mouthShape: 'smile',
    blush: true,
    glasses: false,
    beard: null,
  },
  marcus: {
    skin: 0x8d5524,
    hair: 0x1a1a1a,
    hairStyle: 'short',
    eyeColor: 0x5a3a1f,    // brown
    browShape: 'thick',
    mouthShape: 'smirk',
    blush: false,
    glasses: true,
    beard: 'stubble',
  },
  aisha: {
    skin: 0xc68642,
    hair: 0x1a1a1a,
    hairStyle: 'long',
    eyeColor: 0x4a2a14,    // dark brown
    browShape: 'soft',
    mouthShape: 'gentle',
    blush: true,
    glasses: true,
    beard: null,
  },
  kenji: {
    skin: 0xf1c27d,
    hair: 0x0d0d0d,
    hairStyle: 'spiky',
    eyeColor: 0x896a3d,    // hazel
    browShape: 'arched',
    mouthShape: 'open-smile',
    blush: false,
    glasses: false,
    beard: null,
  },
  diana: {
    skin: 0xfdd9b5,
    hair: 0xc8a572,        // blonde
    hairStyle: 'bob',
    eyeColor: 0x4a7a96,    // blue
    browShape: 'arched',
    mouthShape: 'gentle',
    blush: true,
    glasses: true,
    beard: null,
  },
  sarah: {
    skin: 0xf1c27d,
    hair: 0x1a1a1a,
    hairStyle: 'ponytail',
    eyeColor: 0x4a2a14,
    browShape: 'flat',
    mouthShape: 'flat',
    blush: false,
    glasses: false,
    beard: null,
  },
  elena: {
    skin: 0xfdd9b5,
    hair: 0x2c1810,
    hairStyle: 'long',
    eyeColor: 0x4a7a3f,    // green
    browShape: 'soft',
    mouthShape: 'gentle',
    blush: true,
    glasses: true,
    beard: null,
  },
  raj: {
    skin: 0xc68642,
    hair: 0x1a0c08,
    hairStyle: 'short',
    eyeColor: 0x4a2a14,
    browShape: 'thick',
    mouthShape: 'smile',
    blush: false,
    glasses: false,
    beard: 'full',
  },
  mei: {
    skin: 0xf1c27d,
    hair: 0x1a1a1a,
    hairStyle: 'bob-bangs',
    eyeColor: 0x4a2a14,
    browShape: 'soft',
    mouthShape: 'gentle',
    blush: true,
    glasses: false,
    beard: null,
  },
  noor: {
    skin: 0x8d5524,
    hair: 0x1a1a1a,
    hairStyle: 'hijab',
    eyeColor: 0x3a2010,
    browShape: 'soft',
    mouthShape: 'smile',
    blush: true,
    glasses: false,
    beard: null,
  },
};

// For auto-generated NPCs (chapters 3-16), this returns a randomized
// but deterministic look based on the NPC's id seed.
const HAIR_STYLES = ['short', 'long', 'bob', 'bun', 'ponytail', 'side-part', 'spiky', 'bob-bangs'];
const EYE_COLORS = [0x4a2a14, 0x6b4a2a, 0x896a3d, 0x4a7a96, 0x4a7a3f, 0x6a6a6a];
const BROW_SHAPES = ['soft', 'arched', 'flat', 'thick', 'thin'];
const MOUTH_SHAPES = ['smile', 'smirk', 'gentle', 'flat', 'open-smile'];
const SKIN_TONES = [0xfdd9b5, 0xf1c27d, 0xc68642, 0x8d5524, 0xe0ac69];
const HAIR_COLORS = [0x1a1a1a, 0x2c1810, 0x4a2c0f, 0x6a3c1a, 0xc8a572, 0xa67b5b];

function pick(arr, seed) { return arr[(seed * 9301 + 49297) % arr.length]; }

export function getLookForNpc(npcId, fallbackSeed = 0) {
  if (NPC_LOOKS[npcId]) return NPC_LOOKS[npcId];
  // Auto-generated character — derive from id hash.
  let seed = 0;
  for (let i = 0; i < (npcId || '').length; i++) seed += npcId.charCodeAt(i);
  seed += fallbackSeed;
  return {
    skin: pick(SKIN_TONES, seed),
    hair: pick(HAIR_COLORS, seed + 3),
    hairStyle: pick(HAIR_STYLES, seed + 5),
    eyeColor: pick(EYE_COLORS, seed + 7),
    browShape: pick(BROW_SHAPES, seed + 11),
    mouthShape: pick(MOUTH_SHAPES, seed + 13),
    blush: (seed % 3) !== 0,
    glasses: (seed % 4) === 0,
    beard: (seed % 7) === 0 ? 'full' : ((seed % 11) === 0 ? 'stubble' : null),
  };
}
