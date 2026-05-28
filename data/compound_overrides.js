// compound_overrides.js — per-child position/rotation/scale/hidden overrides
// for compound builders.
// EXPORTED FROM IN-GAME EDITOR — generated 2026-05-28T17:05:05.595Z
//
// Keyed by [ownerId][childId]. Applied by play/world/compoundChildren.js
// at build time.
//
// Supported per-child fields:
//   pos:    [x, y, z]      — move spawn position
//   rotY:   number         — set Y rotation
//   scale:  [sx, sy, sz]   — resize at spawn
//   hidden: true           — skip spawn entirely (editor delete)
window.COMPOUND_OVERRIDES = {
  'decorate_reception': {
    'desk_succulent': { pos: [-0.0599, 1.26, -8.3232], rotY: 0 },
    'pen_cup': { pos: [-1.0126, 1.03, -8.6083], rotY: 0 },
    'reception_mug': { pos: [-0.421, 1.03, -8.638], rotY: 0 },
    'desk_papers': { pos: [0.2715, 1.03, -8.6715], rotY: 0 },
    'sticky_pad': { pos: [0.7485, 1.03, -8.6914], rotY: 0 },
    'stapler': { pos: [-0.812, 1.03, -8.662], rotY: 0 },
    'ceiling_lamp_2': { hidden: true },
    'ceiling_lamp_4': { hidden: true },
    'ceiling_lamp_1': { hidden: true },
    'hanging_plant': { hidden: true },
    'ceiling_lamp_3': { hidden: true },
    'ceiling_lamp_0': { hidden: true },
  },
  'atrium': {
    'mullion_h_0': { hidden: true },
  },
};
