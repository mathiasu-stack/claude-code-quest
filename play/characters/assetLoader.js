// assetLoader.js — GLTF asset loading + caching for character pipeline.
//
// Public API:
//   const loader = new AssetLoader();
//   await loader.loadManifest();              // fetches manifest.json
//   const gltf = await loader.get('casual_male_01'); // null if unavailable
//   loader.preload(['casual_male_01', 'business_female_01'], onProgress);
//
// Design notes:
//   • Loads are cached. Calling get() twice returns the same parsed GLTF.
//   • If `available: false` (or the file 404s), get() returns null. The
//     caller is responsible for falling back to procedural builders.
//   • The manifest's bone-alias table is exposed via boneAliases for
//     gltfCharacter.js to use when attaching accessories.
//   • Animations: if manifest.animations.available is true, the
//     animations GLB is loaded once and its clips are accessible via
//     loader.getAnimationClip(name).
//   • Cloning: GLTF scenes that include SkinnedMesh need bone-aware
//     cloning. We use the official SkeletonUtils.clone for that.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as cloneSkeletal } from 'three/addons/utils/SkeletonUtils.js';

const MANIFEST_URL = 'play/assets/characters/manifest.json';
const ASSET_DIR = 'play/assets/characters/';

export class AssetLoader {
  constructor() {
    this._gltfLoader = new GLTFLoader();
    this._gltfLoader.setMeshoptDecoder(MeshoptDecoder);
    this._manifest = null;
    this._cache = new Map();        // id -> Promise<GLTF | null>
    this._resolved = new Map();     // id -> GLTF (sync-accessible after warmCache)
    this._animClips = new Map();    // name -> THREE.AnimationClip
    this._animLoaded = false;
    this._merged = new Set();       // ids whose extraAnimations were merged
    // Optional hook: fired with (id) each time an asset becomes
    // sync-resolvable — warmCache batches, recovered timeouts, retried
    // failures. play.js uses it to upgrade procedural stand-in NPCs
    // that spawned before their rig finished downloading.
    this.onAssetResolved = null;
  }

  _notifyResolved(id) {
    try { this.onAssetResolved?.(id); }
    catch (e) { console.warn('[assetLoader] onAssetResolved hook failed:', e); }
  }

  // Merge a character's extraAnimations exactly once (warmCache can
  // re-run across play sessions — the loader is a singleton — and a
  // second merge would duplicate every clip).
  async _mergeOnce(id, gltf) {
    if (this._merged.has(id)) return;
    this._merged.add(id);
    await this._mergeExtraAnimations(id, gltf);
  }

  // GLTFLoader.load as a promise. Retries once on error (transient
  // mobile network blips shouldn't strand a character procedural for
  // the whole session); resolves null on final failure.
  _loadWithRetry(id, url, retries = 1) {
    return new Promise((resolve) => {
      const attempt = (left) => {
        this._gltfLoader.load(
          url,
          (gltf) => resolve(gltf),
          undefined,
          (err) => {
            if (left > 0) {
              console.warn(`[assetLoader] ${id} (${url}) failed — retrying:`, err?.message || err);
              setTimeout(() => attempt(left - 1), 800);
            } else {
              console.warn(`[assetLoader] failed to load ${id} (${url}):`, err);
              resolve(null);
            }
          },
        );
      };
      attempt(retries);
    });
  }

  // A download that outlived its safety timeout finally landed —
  // adopt it into the caches and notify, so NPCs that already spawned
  // procedural can upgrade instead of staying blocky all session.
  async _adoptLate(id, gltf) {
    await this._mergeOnce(id, gltf);
    this._cache.set(id, Promise.resolve(gltf));
    this._resolved.set(id, gltf);
    this._notifyResolved(id);
  }

  // Load and parse the manifest. Safe to call multiple times.
  async loadManifest() {
    if (this._manifest) return this._manifest;
    try {
      // Cache-bust per page load — Web Station / mobile Chrome will
      // otherwise serve a stale manifest after deploys, masking new
      // `extraAnimations` / `available` flags.
      const res = await fetch(MANIFEST_URL + '?v=' + Date.now());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this._manifest = await res.json();
    } catch (err) {
      console.warn('[assetLoader] manifest unavailable:', err.message,
                   '— falling back to no-asset mode (everything procedural).');
      this._manifest = { characters: [], animations: { available: false } };
    }
    return this._manifest;
  }

  // Returns the manifest entry for this id (or undefined).
  entryFor(id) {
    return this._manifest?.characters?.find(c => c.id === id);
  }

  // Bone-alias table. Used by gltfCharacter to map semantic bone names
  // (head, leftHand, rightHand, ...) to actual rig bone names.
  get boneAliases() {
    return this._manifest?._boneAliases || {};
  }

  // Resolve a semantic bone name to the first matching rig bone.
  resolveBone(skeleton, semantic) {
    const candidates = this.boneAliases[semantic] || [];
    for (const name of candidates) {
      const b = skeleton.getBoneByName(name);
      if (b) return b;
    }
    return null;
  }

  // Load (or return cached) GLTF for this id. Returns the parsed GLTF
  // object (not yet cloned). Caller should clone before using in scene.
  // Returns null if the asset is unavailable.
  get(id) {
    if (this._cache.has(id)) return this._cache.get(id);
    const entry = this.entryFor(id);
    if (!entry || !entry.available) {
      this._cache.set(id, Promise.resolve(null));
      return this._cache.get(id);
    }
    const url = ASSET_DIR + entry.file;
    // 60s safety timeout — without this a stalled mobile request would
    // freeze warmCache() forever (the loading bar gets stuck at N-1/N).
    // The underlying load is NOT abandoned on timeout: when it lands
    // late, _adoptLate swaps it into the resolved cache and fires
    // onAssetResolved so procedural stand-ins can upgrade.
    const loadP = this._loadWithRetry(id, url);
    const p = new Promise((resolve) => {
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        console.warn(`[assetLoader] ${id} (${url}) timeout after 60s — continuing; will adopt when it lands`);
        resolve(null);
      }, 60000);
      loadP.then((gltf) => {
        clearTimeout(timer);
        if (!timedOut) { resolve(gltf); return; }
        if (gltf) this._adoptLate(id, gltf);
      });
    });
    this._cache.set(id, p);
    return p;
  }

  // Returns a fresh, deep-cloned, skeleton-aware copy of the GLTF
  // scene root that can be safely added to the scene without sharing
  // skinning state with other instances. Returns null if asset
  // missing.
  async getInstance(id) {
    const gltf = await this.get(id);
    if (!gltf || !gltf.scene) return null;
    const root = cloneSkeletal(gltf.scene);
    // Apply manifest scale + yOffset.
    const entry = this.entryFor(id);
    if (entry?.scale && entry.scale !== 1.0) {
      root.scale.setScalar(entry.scale);
    }
    if (entry?.yOffset) {
      root.position.y = entry.yOffset;
    }
    // Find the first SkinnedMesh's skeleton + AnimationMixer base.
    let skeleton = null;
    root.traverse((obj) => {
      if (!skeleton && obj.isSkinnedMesh) skeleton = obj.skeleton;
      // Cast/receive shadows by default.
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    return {
      root,
      skeleton,
      animations: gltf.animations || [],
    };
  }

  // Preload a batch of character ids. Calls onProgress(loaded, total)
  // as each one finishes (success or fail). Resolves when all done.
  async preload(ids, onProgress) {
    const total = ids.length;
    let loaded = 0;
    await Promise.all(ids.map(async (id) => {
      await this.get(id);
      loaded += 1;
      onProgress?.(loaded, total);
    }));
  }

  // Like preload(), but ALSO populates the sync-accessible resolved
  // cache. Call this at scene boot so makeCharacter can look up
  // assets synchronously without await.
  //
  // opts.concurrency caps how many GLBs stream at once. The ethnicity
  // rigs are 15-18 MB each; firing all of them in parallel saturates a
  // mobile/Tailscale link, makes every per-asset timeout fire, and
  // strands those characters procedural. Fires onAssetResolved per id
  // (if installed) so callers can upgrade NPCs incrementally instead
  // of waiting for the whole batch.
  async warmCache(ids, onProgress, opts = {}) {
    const total = ids.length;
    let loaded = 0;
    const queue = ids.slice();
    const workerCount = Math.max(1, Math.min(opts.concurrency || total, total));
    const worker = async () => {
      while (queue.length) {
        const id = queue.shift();
        const gltf = await this.get(id);
        if (gltf) {
          await this._mergeOnce(id, gltf);
          this._resolved.set(id, gltf);
          this._notifyResolved(id);
        }
        loaded += 1;
        onProgress?.(loaded, total);
      }
    };
    await Promise.all(Array.from({ length: workerCount }, worker));
    return this._resolved.size;
  }

  // For characters whose manifest entry has `extraAnimations: [...]`,
  // load each listed GLB and append its clips to the character's own
  // animations array. Used for Meshy-rigged characters whose walk/run
  // clips ship as separate files (same bind pose, so they bind directly
  // without Mixamo-style retargeting).
  async _mergeExtraAnimations(id, gltf) {
    const entry = this.entryFor(id);
    const files = entry?.extraAnimations;
    if (!files || !files.length) return;
    await Promise.all(files.map(async (file) => {
      const url = ASSET_DIR + file;
      try {
        const sub = await new Promise((resolve, reject) => {
          let done = false;
          const timer = setTimeout(() => {
            if (!done) { done = true; reject(new Error('timeout 60s')); }
          }, 60000);
          this._gltfLoader.load(
            url,
            (g) => { if (!done) { done = true; clearTimeout(timer); resolve(g); } },
            undefined,
            (e) => { if (!done) { done = true; clearTimeout(timer); reject(e); } },
          );
        });
        for (const clip of sub.animations || []) {
          gltf.animations.push(clip);
        }
      } catch (err) {
        console.warn(`[assetLoader] extra animation ${file} failed:`, err.message);
      }
    }));
  }

  // Sync accessor — returns the parsed GLTF (or null) for an id that
  // was previously warmed via warmCache(). Returns null for misses
  // (caller falls back to procedural).
  getResolved(id) {
    return this._resolved.get(id) || null;
  }

  // Load the optional shared animation pack. Returns true if it
  // succeeded (clips are now indexed), false if it was unavailable.
  async loadAnimations() {
    if (this._animLoaded) return this._animClips.size > 0;
    this._animLoaded = true;
    const animMeta = this._manifest?.animations;
    if (!animMeta || !animMeta.available) return false;
    const url = ASSET_DIR + animMeta.file;
    try {
      const gltf = await new Promise((resolve, reject) => {
        this._gltfLoader.load(url, resolve, undefined, reject);
      });
      const clipMap = animMeta.clips || {};
      for (const [semantic, clipName] of Object.entries(clipMap)) {
        // Manifest may name the clip exactly, but Mixamo's default export
        // names every clip "Armature|mixamo.com|Layer0" with no semantic
        // substring. Fall back to a semantic-substring search, then to the
        // file's only clip when there's just one.
        const found = gltf.animations.find(a => a.name === clipName)
                   || gltf.animations.find(a => (a.name || '').toLowerCase().includes(semantic.toLowerCase()))
                   || (gltf.animations.length === 1 ? gltf.animations[0] : null);
        if (found) this._animClips.set(semantic, found);
      }
      return this._animClips.size > 0;
    } catch (err) {
      console.warn('[assetLoader] animations pack unavailable:', err.message);
      return false;
    }
  }

  // Returns an AnimationClip for a semantic name, or null if not loaded.
  getAnimationClip(name) {
    return this._animClips.get(name) || null;
  }

  // True if at least one character entry in the manifest is available
  // AND we successfully loaded the manifest.
  get hasAnyAssets() {
    return !!(this._manifest?.characters?.some(c => c.available));
  }
}

// Singleton — convenient for the rest of the app.
let _instance = null;
export function getAssetLoader() {
  if (!_instance) _instance = new AssetLoader();
  return _instance;
}

