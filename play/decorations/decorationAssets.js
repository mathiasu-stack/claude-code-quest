// decorationAssets.js — loads + caches the 12 Meshy-generated office props.
//
// Public API:
//   await preloadDecorations(onProgress);
//   const node = makeDecoration('desk', { width: 1.6, depth: 0.8 });
//
// Each asset is cloned per call so multiple instances can be placed in
// the scene without sharing state. If an asset failed to load, the
// helper returns null and the caller should fall back to its procedural
// builder.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const ASSET_DIR = 'play/assets/decorations/';
const CACHE_BUST = '?v=20260528j';

// Asset id → file (relative to ASSET_DIR).
const FILES = {
  desk: 'desk.glb',
  chair: 'chair.glb',
  monitor: 'monitor.glb',
  reception_desk: 'reception_desk.glb',
  door: 'door.glb',
  cabinet: 'cabinet.glb',
  elevator: 'elevator.glb',
  plant: 'plant.glb',
  table: 'table.glb',
  floor_mat: 'floor_mat.glb',
  window: 'window.glb',
  ceiling_lamp: 'ceiling_lamp.glb',
  // Round 2: replaces remaining procedural props.
  mug: 'mug.glb',
  pen_cup: 'pen_cup.glb',
  stapler: 'stapler.glb',
  paper_stack: 'paper_stack.glb',
  couch: 'couch.glb',
  bookshelf: 'bookshelf.glb',
  water_cooler: 'water_cooler.glb',
  laptop: 'laptop.glb',
  table_lamp: 'table_lamp.glb',
  hanging_plant: 'hanging_plant.glb',
  succulent: 'succulent.glb',
  // Reception floor tile — golden-frame tile pattern, intended to be
  // stretched to cover the 22×22 reception floor as a single instance.
  floor_tile: 'floor_tile.glb',
};

const _cache = new Map(); // id → { gltf, bbox: THREE.Box3 }
let _loader = null;

function getLoader() {
  if (_loader) return _loader;
  _loader = new GLTFLoader();
  _loader.setMeshoptDecoder(MeshoptDecoder);
  return _loader;
}

function loadOne(id) {
  return new Promise((resolve) => {
    const url = ASSET_DIR + FILES[id] + CACHE_BUST;
    const timer = setTimeout(() => {
      console.warn(`[decorationAssets] ${id} timeout — skipping`);
      resolve(null);
    }, 30000);
    getLoader().load(
      url,
      (gltf) => {
        clearTimeout(timer);
        const bbox = new THREE.Box3().setFromObject(gltf.scene);
        _cache.set(id, { gltf, bbox });
        resolve({ gltf, bbox });
      },
      undefined,
      (err) => {
        clearTimeout(timer);
        console.warn(`[decorationAssets] ${id} failed:`, err?.message || err);
        resolve(null);
      },
    );
  });
}

// Loads every decoration GLB in parallel. onProgress is optional.
export async function preloadDecorations(onProgress) {
  const ids = Object.keys(FILES);
  const total = ids.length;
  let loaded = 0;
  await Promise.all(ids.map(async (id) => {
    await loadOne(id);
    loaded += 1;
    onProgress?.(loaded, total);
  }));
  return _cache.size;
}

// Clone the cached scene tree (decorations are non-skinned so a plain
// SkeletonUtils-free deep clone is fine).
function cloneScene(scene) {
  const clone = scene.clone(true);
  clone.traverse((obj) => {
    if (obj.isMesh) {
      // Cast/receive shadows by default for nicer integration with the
      // existing scene lights.
      obj.castShadow = true;
      obj.receiveShadow = true;
      // Clone the material so per-instance tweaks (emissive etc) don't
      // leak across instances.
      if (obj.material) obj.material = obj.material.clone();
    }
  });
  return clone;
}

// Returns true if the asset has been loaded and is ready to clone.
export function hasDecoration(id) {
  return _cache.has(id);
}

// Build a positioned + scaled instance.
//
// opts:
//   width, depth, height — any subset. The instance is uniformly scaled
//     so that the most restrictive specified axis fits its target.
//   stretch — when true, each specified axis is scaled INDEPENDENTLY
//     (non-uniform scale) so the bbox matches the target dimensions
//     exactly. Useful when the source asset's natural proportions
//     don't match the scene slot — e.g. a squarish desk that needs
//     to span a wide reception counter. Distorts the model.
//   yOffset — vertical translation after scale (e.g. plant pots should
//     sit on the floor at y=0, so yOffset = 0).
//   rotationY — applied after scaling (so it works regardless of the
//     auto-scale).
//
// Returns a THREE.Group containing the scaled mesh, or null if the
// asset isn't cached (caller falls back to procedural).
export function makeDecoration(id, opts = {}) {
  const entry = _cache.get(id);
  if (!entry) return null;

  const inst = cloneScene(entry.gltf.scene);

  // Compute fresh bbox from this clone (cached bbox is from the
  // unscaled scene root, but we want to be defensive in case the
  // clone changed anything).
  const bbox = new THREE.Box3().setFromObject(inst);
  const size = new THREE.Vector3();
  bbox.getSize(size);

  // Compute scale. Uniform unless `stretch` requested.
  const want = (name, axis) => {
    const t = opts[name];
    if (typeof t !== 'number' || t <= 0) return Infinity;
    return t / Math.max(size[axis], 1e-6);
  };
  const sX = want('width', 'x'), sY = want('height', 'y'), sZ = want('depth', 'z');
  let scaleX, scaleY, scaleZ;
  if (opts.stretch) {
    // Non-uniform: any axis with no target falls through to a sensible
    // default — use the MAX scale of the specified axes so the whole
    // model grows together if some axes are constrained and others aren't.
    const specified = [sX, sY, sZ].filter(s => isFinite(s));
    const fallback = specified.length ? Math.max(...specified) : 1;
    scaleX = isFinite(sX) ? sX : fallback;
    scaleY = isFinite(sY) ? sY : fallback;
    scaleZ = isFinite(sZ) ? sZ : fallback;
  } else {
    const uniform = Math.min(sX, sY, sZ);
    scaleX = scaleY = scaleZ = isFinite(uniform) ? uniform : 1;
  }

  // Apply scale on a wrapper group so the caller can still position via
  // .position / .rotation on the returned group itself.
  const root = new THREE.Group();
  inst.scale.set(scaleX, scaleY, scaleZ);

  // Re-measure after scaling, then translate so the bottom-center of the
  // bbox sits at the group's origin. This makes the existing builder
  // call-sites (which assume the returned group's origin is at the
  // floor) work without modification.
  inst.updateMatrixWorld(true);
  const scaledBox = new THREE.Box3().setFromObject(inst);
  const c = new THREE.Vector3();
  scaledBox.getCenter(c);
  inst.position.x -= c.x;
  inst.position.z -= c.z;
  inst.position.y -= scaledBox.min.y;

  if (typeof opts.yOffset === 'number') inst.position.y += opts.yOffset;

  root.add(inst);
  if (typeof opts.rotationY === 'number') root.rotation.y = opts.rotationY;
  root.userData.decorationId = id;
  return root;
}
