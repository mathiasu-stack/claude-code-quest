// playerLook.js — explicit player face configuration.
//
// Lives in its own file so a future "I forgot to apply faces to the
// player" regression is impossible: the player face setup is owned
// here and intentionally separate from the NPC pipeline.
//
// Reads the player's customisation choices (face style, hair color,
// skin tone) and converts them to the cartoonFace `look` schema.

import { loadCustomization } from './customization.js';

// Map customization face style to cartoonFace mouth/brow defaults.
const STYLE_PRESETS = {
  round:  { browShape: 'soft',   mouthShape: 'smile',  blush: true  },
  dot:    { browShape: 'thin',   mouthShape: 'gentle', blush: false },
  sleepy: { browShape: 'soft',   mouthShape: 'gentle', blush: false },
  sharp:  { browShape: 'arched', mouthShape: 'smirk',  blush: false },
};

export function buildPlayerLook(outfit) {
  const cust = loadCustomization();
  const preset = STYLE_PRESETS[cust.face] || STYLE_PRESETS.round;
  return {
    // Body / outfit
    skin: cust.skin,
    hair: cust.hairColor,
    hairStyle: 'short',          // single hair style for the player MVP
    shirt: outfit.shirt,
    pants: outfit.pants,
    glasses: false,
    prop: null,
    // Face — explicit fields
    face: cust.face,
    expression: 'happy',
    eyeColor: 0x6b4a2a,          // brown by default
    browShape: preset.browShape,
    mouthShape: preset.mouthShape,
    blush: preset.blush,
    beard: null,
  };
}
