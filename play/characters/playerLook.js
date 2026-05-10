// playerLook.js — explicit player face configuration.
//
// Lives in its own file so a future "I forgot to apply faces to the
// player" regression is impossible: the player face setup is owned
// here and intentionally separate from the NPC pipeline.
//
// Reads customization (face style, hair color, skin tone) and emits a
// `look` whose `_id` is 'player' — that routes to FACE_CONFIGS.player
// in faceConfigs.js, with customization values overriding.

import { loadCustomization } from './customization.js';

// Map customization face style to drawing defaults.
const STYLE_PRESETS = {
  round:  { browShape: 'soft',   mouthShape: 'smile',  blush: true,  eyeShape: 'oval' },
  dot:    { browShape: 'thin',   mouthShape: 'gentle', blush: false, eyeShape: 'dot' },
  sleepy: { browShape: 'soft',   mouthShape: 'gentle', blush: false, eyeShape: 'sleepy' },
  sharp:  { browShape: 'arched', mouthShape: 'smirk',  blush: false, eyeShape: 'sharp' },
};

export function buildPlayerLook(outfit) {
  const cust = loadCustomization();
  const preset = STYLE_PRESETS[cust.face] || STYLE_PRESETS.round;
  return {
    // Body / outfit — used by makeCharacter for the 3D body.
    skin: cust.skin,
    hair: cust.hairColor,
    hairStyle: 'short',
    shirt: outfit.shirt,
    pants: outfit.pants,
    glasses: false,
    prop: null,
    // Face — read by flatFace.js. The makeCharacter wrapper passes these
    // through into the canvas drawing config so the customization is
    // honored.
    _faceConfig: {
      skin: cust.skin,
      hair: cust.hairColor,
      hairStyle: 'short',
      eyeColor: 0x4a7a96,        // friendly bright blue
      eyeShape: preset.eyeShape,
      browShape: preset.browShape,
      mouthShape: preset.mouthShape,
      blush: preset.blush,
      glasses: false,
      beard: null,
    },
  };
}
