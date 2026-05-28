// compoundChildren.js — helper for compound builders that add many
// child meshes to the scene (decorate_reception, decorate_library,
// reception_centerpiece, atrium, elevator). Each child gets a stable
// id so the in-game editor can:
//   • select the child via raycast (userData._isCompoundChild)
//   • drag/translate, mirroring writes into window.COMPOUND_OVERRIDES
//   • persist via Export Layout (data/compound_overrides.js)
//
// The override is applied at build time — by the time the helper
// returns the mesh has been positioned, tagged and parented to the
// scene. Per-frame tickers (clock hands, LED blinks, etc.) still work
// because they only touch sub-meshes / materials, never the root pos.
//
// IDs are positional-by-convention. For solo items use a descriptive
// name ("stapler", "clock", "whiteboard"). Inside loops include the
// loop index ("ceiling_lamp_0"). Renaming an id orphans existing
// overrides — keep the keys stable across edits.

export function placeCompoundChild(scene, mesh, ownerId, childId, opts = {}) {
  const ov = window.COMPOUND_OVERRIDES?.[ownerId]?.[childId];
  // Editor-set deletion: bail before adding to scene so the child
  // never renders on this load. Geometry + material are still
  // allocated by the compound builder above this call — we leak that
  // memory on purpose since recovering the entry is just a re-toggle.
  if (ov?.hidden === true) return null;
  if (ov?.pos && ov.pos.length === 3) {
    mesh.position.set(ov.pos[0], ov.pos[1], ov.pos[2]);
  }
  if (typeof ov?.rotY === 'number') {
    mesh.rotation.y = ov.rotY;
  }
  if (Array.isArray(ov?.scale) && ov.scale.length === 3) {
    mesh.scale.set(ov.scale[0], ov.scale[1], ov.scale[2]);
  }
  mesh.userData._isCompoundChild = true;
  mesh.userData._compoundOwner = ownerId;
  mesh.userData._compoundChildId = childId;
  if (opts.floor != null) mesh.userData.floor = opts.floor;
  if (opts.yOffset != null) mesh.userData._yOffset = opts.yOffset;
  scene.add(mesh);
  return mesh;
}
