// lesson_delivery_overrides.js — per-chapter interactable position overrides.
//
// Keyed by chapterId. Applied at build time in play.js's interactable
// spawn loop, AFTER reading LESSON_DELIVERY[chapterId].objectLocation.
//
// Format: { [chapterId]: { position: [x, y, z] } }
//
// Updated by the in-game editor's Export Layout when phones / computers /
// books / whiteboards / servers / display screens are moved. Hand-edit
// here only if you want to lock in a placement permanently — otherwise
// prefer the editor.
window.LESSON_DELIVERY_OVERRIDES = {};
