// lesson_delivery_overrides.js — per-chapter interactable position overrides.
// EXPORTED FROM IN-GAME EDITOR — generated 2026-06-15T08:28:03.059Z
//
// Keyed by chapterId. Applied at build time in play.js's interactable
// spawn loop, layered over LESSON_DELIVERY[chapterId].objectLocation.
//
// Supported per-chapter fields:
//   position: [x, y, z]   — move the spawn point
//   scale:    [sx, sy, sz] — resize at spawn
//   hidden:   true        — skip spawn entirely (editor delete)
window.LESSON_DELIVERY_OVERRIDES = {
  'ch05': { position: [-1.3884, 1.03, -8.746] },
};
