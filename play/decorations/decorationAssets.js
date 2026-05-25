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
const CACHE_BUST = '?v=20260526a';

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

// Build a positioned + uniformly-scaled instance.
//
// opts:
//   width, depth, height — any subset. The instance is uniformly scaled
//     so that the LARGEST specified axis fits its target. If multiple
//     axes are specified, the most restrictive wins (so the instance
//     fits inside the AABB you describe).
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

  // Compute uniform scale so each specified target axis is fit.
  let scale = 1;
  const want = (name, axis) => {
    const t = opts[name];
    if (typeof t !== 'number' || t <= 0) return Infinity;
    return t / Math.max(size[axis], 1e-6);
  };
  scale = Math.min(want('width', 'x'), want('height', 'y'), want('depth', 'z'));
  if (!isFinite(scale)) scale = 1;

  // Apply scale on a wrapper group so the caller can still position via
  // .position / .rotation on the returned group itself.
  const root = new THREE.Group();
  inst.scale.setScalar(scale);

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
