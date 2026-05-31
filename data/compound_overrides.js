// compound_overrides.js — per-child position/rotation/scale/hidden overrides
// for compound builders.
// EXPORTED FROM IN-GAME EDITOR — generated 2026-05-29T08:10:04.655Z
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
    // marcus_* compound children sat on / beside Marcus's IT-bench desk
    // which was removed from the reception lobby (lobby shouldn't house
    // a workstation). Hidden here so the laptop + succulent don't float
    // at desk-surface height and the server tower isn't a lone box on
    // the floor.
    'marcus_server_tower': { hidden: true },
    'marcus_laptop': { hidden: true },
    'marcus_succulent': { hidden: true },
    'service_elevator': { pos: [11.2866, 0, -7.5032], rotY: 1.5708, scale: [4.7, 5.2, 4.7] },
    'aisha_whiteboard': { pos: [10.1831, 2, -9.6273], rotY: -1.5708, scale: [0.65, 0.65, 0.65] },
    'clock': { hidden: true },
    'west_window': { hidden: true },
    'poster_be_kind': { hidden: true },
    'poster_ship_it': { hidden: true },
    'poster_grow': { hidden: true },
    'poster_stay': { hidden: true },
  },
  'atrium': {
    'mullion_h_0': { hidden: true },
  },
  'reception_centerpiece': {
    'k_sculpture': { pos: [0.0358, 0, 0.6345], rotY: 0 },
  },
  'library_ceiling': {
    'beam_0': { hidden: true },
    'beam_1': { hidden: true },
    'beam_2': { hidden: true },
    'molding_1': { hidden: true },
  },
  'library_arched_window': {
    'header': { hidden: true },
    'glass': { hidden: true },
    'arch': { hidden: true },
    'jamb_left': { hidden: true },
    'jamb_right': { hidden: true },
    'light_stream': { hidden: true },
  },
  'reception_windows': {
    'window_2_frame': { hidden: true },
    'window_1_frame': { hidden: true },
    'window_0_frame': { hidden: true },
    'window_0_glass': { pos: [10.84, 1.9, -3], rotY: -1.5708, scale: [1.2, 1.2, 1.2] },
    'window_1_glass': { pos: [10.84, 1.9, 0], rotY: -1.5708, scale: [1.2, 1.2, 1.2] },
    'window_2_glass': { pos: [10.84, 1.9, 3], rotY: -1.5708, scale: [1.2, 1.2, 1.2] },
  },
};
