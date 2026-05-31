// lesson_delivery_overrides.js — per-chapter interactable position overrides.
// EXPORTED FROM IN-GAME EDITOR — generated 2026-05-29T08:10:04.655Z
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
  // ch04 whiteboard override (floor-1 position [-10.68, 0, 3.08]) was
  // dropped — ch04 now maps to floor 2 (Memory Vault) per the curriculum
  // order, and the stale floor-1 position left the whiteboard floating
  // mid-air visible from the west-wing Plan War Room. The default in
  // LESSON_DELIVERY[ch04] now places it on the floor-2 NE-quadrant east
  // wall where the ch04 NPCs actually are.
};
