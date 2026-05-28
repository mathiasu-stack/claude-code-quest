// compound_overrides.js — per-child position/rotation overrides for
// compound builders (decorate_reception, decorate_library,
// reception_centerpiece, atrium, elevator).
//
// Format: { [ownerId]: { [childId]: { pos: [x, y, z], rotY?: number } } }
//
// Applied by play/world/compoundChildren.js at build time. Updated by
// the in-game editor's Export Layout when compound children are moved.
// Hand-edit here only if you want to lock in a placement permanently —
// otherwise prefer the editor.
window.COMPOUND_OVERRIDES = {};
