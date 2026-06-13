// portraitStudio.js — rendered head-and-shoulders portraits for dialogue.
//
// getPortrait(mesh, id) returns a cached 256×256 dataURL of the character's
// face: the mesh is cloned (SkeletonUtils for skinned/GLTF rigs) into a tiny
// isolated scene with its own key light and a plain light-blue sky background
// (matching the in-game reference screenshot), framed on the head bone.
//
// Memory discipline (mobile matters):
//   - ONE small dedicated WebGLRenderer (256×256), created lazily on the
//     first portrait and reused for every subsequent one.
//   - Portraits render once per character id and are cached as dataURLs in a
//     Map — never re-rendered per-frame or per-dialogue.
//   - Clones share geometry/materials with the live mesh (clone() and
//     SkeletonUtils.clone() do NOT duplicate GPU resources), so the only
//     teardown needed is removing the clone from the studio scene. Nothing
//     owned by the live character is ever disposed.
//
// Failure-safe: every entry point returns null on any error — callers keep
// the emoji portrait as fallback.

import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

const SIZE = 256;
const SKY_BG = 0x87b7e8;          // plain light-blue sky, per reference shot

const cache = new Map();          // id → dataURL
// Per-id callbacks waiting for a texture-deferred render. Cleared once
// the texture finishes decoding and the cache entry is populated.
const pendingByCacheKey = new Map();
let renderer = null;
let studioScene = null;
let camera = null;

function ensureStudio() {
  if (renderer) return true;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,   // safe synchronous toDataURL readback
      powerPreference: 'low-power',
    });
    renderer.setSize(SIZE, SIZE);
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Match the main renderer's grade so portraits read like the game.
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    studioScene = new THREE.Scene();
    studioScene.background = new THREE.Color(SKY_BG);
    studioScene.add(new THREE.AmbientLight(0xffffff, 1.35));
    const key = new THREE.DirectionalLight(0xffffff, 1.9);
    key.position.set(0.8, 1.6, 2.2);   // over the camera's shoulder
    studioScene.add(key);
    const rim = new THREE.DirectionalLight(0xbfd9ff, 0.7);
    rim.position.set(-1.2, 0.9, -1.6);
    studioScene.add(rim);

    camera = new THREE.PerspectiveCamera(35, 1, 0.05, 50);
    return true;
  } catch (e) {
    console.warn('[portraitStudio] init failed', e);
    renderer = null;
    return false;
  }
}

// Path of child indices from root to node — used to find the head again in
// the clone (clone preserves children order; node references don't survive).
function indexPath(root, node) {
  const path = [];
  let cur = node;
  while (cur && cur !== root) {
    const parent = cur.parent;
    if (!parent) return null;
    const i = parent.children.indexOf(cur);
    if (i < 0) return null;
    path.unshift(i);
    cur = parent;
  }
  return cur === root ? path : null;
}

function nodeAtPath(root, path) {
  let cur = root;
  for (const i of path) {
    cur = cur.children?.[i];
    if (!cur) return null;
  }
  return cur;
}

// The head reference on the LIVE mesh: rigs expose userData.parts.head
// (both procedural and GLTF); skinned rigs also carry a 'Head' bone.
function findHeadSource(mesh) {
  let head = mesh.userData?.parts?.head || null;
  if (!head) {
    mesh.traverse((o) => {
      if (!head && o.isBone && /head/i.test(o.name)) head = o;
    });
  }
  return head;
}

// Clone the character. Object3D.clone() deep-copies userData via JSON and
// our rigs carry circular mesh references (userData.parts, faces, npc), so
// userData is temporarily stripped on every node and restored afterwards.
function cloneCharacter(mesh) {
  const saved = [];
  mesh.traverse((o) => { saved.push([o, o.userData]); o.userData = {}; });
  try {
    let skinned = false;
    mesh.traverse((o) => { if (o.isSkinnedMesh) skinned = true; });
    return skinned ? cloneSkinned(mesh) : mesh.clone(true);
  } finally {
    for (const [o, u] of saved) o.userData = u;
  }
}

// A texture is portrait-ready when its image is loaded AND decoded into
// pixels. TextureLoader.load() returns the Texture synchronously but the
// underlying Image is async — rendering before decode produces a blank/
// stale face (this was the Maya-doesn't-look-like-Maya bug: maya_skin.jpg
// hadn't decoded by the first portrait request, the placeholder rendered,
// and the cache pinned the bad face forever).
function _textureReady(tex) {
  if (!tex) return true;
  const img = tex.image;
  if (!img) return false;
  // ImageBitmap (modern decode path) lacks .complete but has width/height.
  if (typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap) {
    return img.width > 0 && img.height > 0;
  }
  // <img> element
  return !!img.complete && (img.naturalWidth || img.width) > 0;
}

// Walk every material that contributes to the visible portrait and
// collect any not-yet-ready textures so we can attach onload callbacks
// and re-render once they're all in.
function _pendingTextures(subject) {
  const pending = [];
  subject.traverse((o) => {
    if (!o.material) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      for (const slot of ['map', 'emissiveMap', 'normalMap']) {
        const t = m[slot];
        if (t && !_textureReady(t)) pending.push(t);
      }
    }
  });
  return pending;
}

function renderPortrait(mesh) {
  const headSrc = findHeadSource(mesh);
  const headPath = headSrc ? indexPath(mesh, headSrc) : null;

  const subject = cloneCharacter(mesh);
  if (!subject) return null;

  // Face +Z (character forward) straight at the camera, feet at origin.
  subject.position.set(0, 0, 0);
  subject.rotation.set(0, 0, 0);
  subject.traverse((o) => {
    if (o.isSprite) o.visible = false;          // name tags / speech bubbles
    if (o.isMesh || o.isSkinnedMesh) {
      o.frustumCulled = false;                  // skinned bounds are unreliable
      o.castShadow = false;
      o.receiveShadow = false;
    }
  });
  studioScene.add(subject);
  subject.updateMatrixWorld(true);

  // Return a signal so getPortrait() can defer caching and listen for
  // texture loads. The clone is left in the scene briefly so the bbox /
  // head lookup math below still runs and the caller can decide.
  const pendingTex = _pendingTextures(subject);
  if (pendingTex.length) {
    studioScene.remove(subject);
    return { deferred: true, pendingTex };
  }

  const bb = new THREE.Box3().setFromObject(subject);
  const height = Math.max(0.5, bb.max.y - bb.min.y);
  const headPos = new THREE.Vector3();
  const headNode = headPath ? nodeAtPath(subject, headPath) : null;
  if (headNode) {
    headNode.getWorldPosition(headPos);
  } else {
    headPos.set(0, bb.max.y - height * 0.12, 0); // estimate: just below crown
  }

  // Head + shoulders fill the frame: with fov 35° a distance of ~0.62×height
  // gives a vertical span of roughly a third of the character.
  const dist = THREE.MathUtils.clamp(height * 0.62, 0.4, 6);
  camera.position.set(headPos.x, headPos.y + height * 0.03, headPos.z + dist);
  camera.lookAt(headPos.x, headPos.y - height * 0.045, headPos.z);

  renderer.render(studioScene, camera);
  const url = renderer.domElement.toDataURL('image/png');

  // Teardown: the clone shares all GPU resources with the live character,
  // so removing it from the studio scene is the complete cleanup.
  studioScene.remove(subject);
  return { url };
}

// Schedule a re-render once every pending texture has decoded. Wired
// when the first render attempt found undecoded images (e.g. Maya's
// overlay JPG). Once all fire, the portrait is re-rendered, cached, and
// any callbacks registered via onReady are invoked so already-open
// dialogue cards can swap their emoji for the real face.
function _scheduleRender(mesh, id, pendingTex) {
  if (!id) return;                          // can't dedupe without a key
  if (pendingByCacheKey.has(id)) return;    // already waiting
  pendingByCacheKey.set(id, []);
  let remaining = pendingTex.length;
  const tryFinish = () => {
    if (--remaining > 0) return;
    let res = null;
    try { res = renderPortrait(mesh); } catch (e) {
      console.warn('[portraitStudio] deferred render failed', id, e);
    }
    if (res && res.url) {
      cache.set(id, res.url);
      const cbs = pendingByCacheKey.get(id) || [];
      pendingByCacheKey.delete(id);
      for (const cb of cbs) { try { cb(res.url); } catch {} }
    } else {
      // Still not ready (e.g. second-layer texture pending) — bail; the
      // next dialogue open will retry from scratch.
      pendingByCacheKey.delete(id);
    }
  };
  for (const tex of pendingTex) {
    if (_textureReady(tex)) { tryFinish(); continue; }
    // Three.js Texture exposes onUpdate but not a clean onLoad; we wrap
    // image.onload directly. Falls back to a polling check for browsers
    // that don't trigger onload when the texture was constructed with a
    // pre-existing Image.
    const img = tex.image;
    if (img && 'addEventListener' in img) {
      img.addEventListener('load', tryFinish, { once: true });
      img.addEventListener('error', tryFinish, { once: true });
    } else {
      const start = performance.now();
      const poll = () => {
        if (_textureReady(tex) || performance.now() - start > 8000) tryFinish();
        else setTimeout(poll, 100);
      };
      poll();
    }
  }
}

// Public API — cached dataURL of the character's portrait, or null when the
// mesh is missing / rendering fails (caller keeps the emoji fallback).
//
// `onReady` is called with the dataURL once an in-flight deferred render
// finishes (so the dialogue card that prompted the request can swap its
// emoji for the real face without waiting for the player to reopen).
export function getPortrait(mesh, id, onReady) {
  if (id && cache.has(id)) return cache.get(id);
  if (!mesh || !ensureStudio()) return null;
  let res = null;
  try {
    res = renderPortrait(mesh);
  } catch (e) {
    console.warn('[portraitStudio] render failed', id, e);
  }
  if (res && res.url) {
    if (id) cache.set(id, res.url);
    return res.url;
  }
  if (res && res.deferred) {
    if (typeof onReady === 'function' && id) {
      const list = pendingByCacheKey.get(id);
      if (list) list.push(onReady);
    }
    _scheduleRender(mesh, id, res.pendingTex);
  }
  return null;
}
