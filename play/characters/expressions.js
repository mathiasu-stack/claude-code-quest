// expressions.js — preset eyebrow + mouth shapes for character faces.
//
// Each preset is consumed by face.js when drawing the canvas-textured
// face sprite. Add more presets here as needed.

export const EXPRESSIONS = {
  // Default — neutral resting face.
  neutral: { brow: 'flat',   mouth: 'thin',   blush: false },
  // Happy — slight smile, bright eyes.
  happy:   { brow: 'arched', mouth: 'smile',  blush: true  },
  // Focused — straight brows, small flat mouth.
  focused: { brow: 'flat',   mouth: 'thin',   blush: false },
  // Tired — droopy brow, slight frown.
  tired:   { brow: 'droop',  mouth: 'flat',   blush: false },
  // Smug — one brow up, tight smile.
  smug:    { brow: 'one-up', mouth: 'smirk',  blush: false },
  // Kind — soft eyebrows, gentle smile, blush.
  kind:    { brow: 'soft',   mouth: 'soft',   blush: true  },
  // Stern — angled inward brow, flat mouth.
  stern:   { brow: 'angry',  mouth: 'flat',   blush: false },
};

export function getExpression(name) {
  return EXPRESSIONS[name] || EXPRESSIONS.neutral;
}
