// roomsLoader.js — data-driven scene assembly.
//
// Reads window.ROOMS (from data/rooms.js) and dispatches each entry to
// a registered builder. Pixel-identical to the previous imperative
// code as long as each entry's args match the original call site.
//
// Object types:
//   - 'decoration'  → makeDecoration(id, size) — Meshy GLB; falls back
//                     to per-id procedural if unavailable.
//   - 'builder'     → registered builder fn by name. Builders own their
//                     own position+rotation+colors+geometry. The loader
//                     only forwards (pos, rotY, args, ctx).
//   - 'poster'      → wall poster: title + sub canvas texture on a plane.
//   - 'clutter'     → tiny props on the reception desk (from shared.js).
//   - 'wall'        → raw THREE.Mesh wall segment (BoxGeometry + material
//                     ref); positions in (x, y, z), optional rotY.
//   - 'floor_plate' → PlaneGeometry rotated -π/2 around X; color, size,
//                     position (x, y, z).
//   - 'wall_sign'   → makeWallSign(text, w, h, bg?, fg?) — sign mesh.
//   - 'ceo_portrait'→ buildCeoPortrait(scene) called once; placement is
//                     hard-coded inside that builder, so the data entry
//                     is just `{ type: 'ceo_portrait' }`.
//
// Builders register via registerRoomBuilder('name', fn). The fn signature:
//   (pos: [x, y, z], rotY: number|undefined, args: object, ctx: object)
//     → THREE.Object3D | { root, tickers, collidersAdded? }
//
// `ctx` carries shared state the builder may need: { scene, decoTickers,
// mobile, interactObjects, currentFloor, ... }. Builders that mutate
// the scene directly (like buildAtrium / buildElevator which call
// scene.add internally) return their tickers in the result so the
// loader can push them to ctx.decoTickers.

import * as THREE from 'three';
import { makeDecoration } from '../decorations/decorationAssets.js?v=20260528j';

const REGISTRY = new Map();

export function registerRoomBuilder(name, fn) {
  REGISTRY.set(name, fn);
}

// Helpers exposed for builders to share — mostly canvas drawers.
let _makeLabelSprite = null;
let _makeWallSign = null;
let _buildPosterTexture = null;
let _buildCeoPortrait = null;
let _wallMaterialFactory = null;

export function registerSharedHelpers({
  makeLabelSprite, makeWallSign, buildPosterTexture, buildCeoPortrait, wallMaterialFactory,
}) {
  if (makeLabelSprite)    _makeLabelSprite = makeLabelSprite;
  if (makeWallSign)       _makeWallSign = makeWallSign;
  if (buildPosterTexture) _buildPosterTexture = buildPosterTexture;
  if (buildCeoPortrait)   _buildCeoPortrait = buildCeoPortrait;
  if (wallMaterialFactory) _wallMaterialFactory = wallMaterialFactory;
}

// Main entry: place every object in a room. Returns the list of
// per-frame tickers produced by builders (the caller pushes those to
// decoTickers — or passes decoTickers in via ctx and the builders push
// directly; this return is a safety net).
//
// ctx.yOffset (number, default 0) shifts every placed node's Y by this
// amount AFTER its builder runs. Used by upper-floor rooms (2-4) so the
// data can declare positions relative to the floor's base (y=0) and the
// loader translates to floorBaseY(floor) automatically.
export function loadRoom(scene, room, ctx = {}) {
  const tickers = [];
  const yOffset = ctx.yOffset || 0;
  for (let i = 0; i < (room.objects || []).length; i++) {
    const obj = room.objects[i];
    const result = dispatch(obj, scene, ctx);
    if (!result) continue;
    if (Array.isArray(result.tickers)) tickers.push(...result.tickers);
    const node = result.isObject3D ? result : result.root;
    if (!node) continue;
    if (yOffset) node.position.y += yOffset;
    // Editor-set per-entry scale (entry.scale = [sx, sy, sz]). Applied
    // here so EVERY entry type (decoration, builder, wall, …) gets
    // resized uniformly regardless of how the dispatcher built it.
    if (Array.isArray(obj.scale) && obj.scale.length === 3) {
      node.scale.set(obj.scale[0], obj.scale[1], obj.scale[2]);
    }
    // Tag every node with room.floor for visibility culling. Builders
    // that need per-mesh override can set userData.floor before
    // returning; we only OVERWRITE entries that are currently undefined.
    if (room.floor != null) {
      tagFloor(node, room.floor);
    }
    // Tag with room id + entry index so the Phase 2 in-game editor can
    // map a clicked mesh back to its data entry (and serialize its
    // position/rotation/size back out via Export Layout).
    node.userData._roomId = room.id;
    node.userData._roomEntryIndex = i;
    node.userData._yOffset = yOffset;
    // The post-load settleStaticObjects() snaps every `surface: 'top'`
    // and `surface: 'floor'` item to its computed Y (raycast or
    // floorBaseY). That wins over any explicit Y in the data, so a
    // table lamp the editor lifted up to 0.85 would get re-snapped back
    // down to the table top on reload — silently overriding the save.
    // Flag entries that carry an explicit non-zero Y so the settler
    // leaves them alone (default y=0 items still settle normally).
    if (Array.isArray(obj.pos) && typeof obj.pos[1] === 'number' && obj.pos[1] !== 0) {
      node.userData._explicitY = true;
    }
    if (!node.parent) scene.add(node);
  }
  return tickers;
}

function tagFloor(root, floor) {
  if (root.userData.floor === undefined) root.userData.floor = floor;
  root.traverse((o) => {
    if (o.userData.floor === undefined) o.userData.floor = floor;
  });
}

function dispatch(obj, scene, ctx) {
  switch (obj.type) {
    case 'decoration':    return buildDecorationEntry(obj);
    case 'builder':       return buildFromRegistry(obj, scene, ctx);
    case 'poster':        return buildPosterEntry(obj);
    case 'clutter':       return buildFromRegistry({ ...obj, type: 'builder' }, scene, ctx);
    case 'wall':          return buildWallEntry(obj, ctx);
    case 'floor_plate':   return buildFloorPlateEntry(obj);
    case 'wall_sign':     return buildWallSignEntry(obj);
    case 'ceo_portrait':  return buildCeoPortraitEntry(obj);
    default:
      console.warn('[rooms] unknown object type:', obj.type);
      return null;
  }
}

// Public single-entry dispatcher — used by the in-game editor's
// "Add Item" path to place a freshly-created entry without re-loading
// the whole room. Returns the same shape dispatch() does (Object3D,
// { root, tickers }, or null). Caller is responsible for setting
// userData._roomId / ._roomEntryIndex / ._yOffset and adding the
// result to scene if it isn't already.
export function dispatchEntry(obj, scene, ctx = {}) {
  return dispatch(obj, scene, ctx);
}

function buildDecorationEntry(obj) {
  const node = makeDecoration(obj.id, obj.size || {});
  if (!node) return null;
  if (Array.isArray(obj.pos)) {
    node.position.set(obj.pos[0], obj.pos[1] || 0, obj.pos[2] || 0);
  }
  if (typeof obj.rotY === 'number') node.rotation.y = obj.rotY;
  return node;
}

function buildFromRegistry(obj, scene, ctx) {
  const fn = REGISTRY.get(obj.fn);
  if (!fn) {
    console.warn('[rooms] no builder registered for fn:', obj.fn);
    return null;
  }
  const result = fn(obj.pos, obj.rotY, obj.args || {}, { ...ctx, scene });
  return result;
}

function buildPosterEntry(obj) {
  if (!_buildPosterTexture) {
    console.warn('[rooms] poster builder not registered');
    return null;
  }
  const w = obj.size?.width || 1.6;
  const h = obj.size?.height || 2.4;
  const tex = _buildPosterTexture(obj.title || '', obj.sub || '');
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex }),
  );
  if (Array.isArray(obj.pos)) mesh.position.set(obj.pos[0], obj.pos[1] || 0, obj.pos[2] || 0);
  if (typeof obj.rotY === 'number') mesh.rotation.y = obj.rotY;
  return mesh;
}

function buildWallEntry(obj, ctx) {
  const mat = _wallMaterialFactory ? _wallMaterialFactory(obj.material) : new THREE.MeshStandardMaterial({ color: obj.color || 0xf4ecd8 });
  const sz = obj.size || {};
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sz.w || 1, sz.h || 1, sz.d || 1), mat);
  if (Array.isArray(obj.pos)) mesh.position.set(obj.pos[0], obj.pos[1], obj.pos[2]);
  if (typeof obj.rotY === 'number') mesh.rotation.y = obj.rotY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function buildFloorPlateEntry(obj) {
  const sz = obj.size || {};
  const mat = new THREE.MeshStandardMaterial({
    color: obj.color || 0x9aa9bc,
    metalness: obj.metalness ?? 0,
    roughness: obj.roughness ?? 1,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(sz.w || 22, sz.d || 22), mat);
  mesh.rotation.x = -Math.PI / 2;
  if (Array.isArray(obj.pos)) mesh.position.set(obj.pos[0], obj.pos[1], obj.pos[2]);
  if (typeof obj.rotY === 'number') mesh.rotation.y = obj.rotY;
  mesh.receiveShadow = true;
  return mesh;
}

function buildWallSignEntry(obj) {
  if (!_makeWallSign) return null;
  const w = obj.size?.width || 4;
  const h = obj.size?.height || 0.9;
  const sign = _makeWallSign(obj.text, w, h, obj.bg, obj.fg);
  if (Array.isArray(obj.pos)) sign.position.set(obj.pos[0], obj.pos[1], obj.pos[2]);
  if (typeof obj.rotY === 'number') sign.rotation.y = obj.rotY;
  return sign;
}

function buildCeoPortraitEntry(obj) {
  if (!_buildCeoPortrait) return null;
  const group = _buildCeoPortrait();
  if (!group) return null;
  if (Array.isArray(obj.pos)) {
    group.position.set(obj.pos[0], obj.pos[1] || 0, obj.pos[2] || 0);
  } else {
    // Default back-wall slot if the data entry is missing pos for
    // some reason (e.g., a hand-edited rooms.js).
    group.position.set(0, 2.0, -10.86);
  }
  if (typeof obj.rotY === 'number') group.rotation.y = obj.rotY;
  return group;
}
