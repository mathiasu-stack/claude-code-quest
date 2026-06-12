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
  return url;
}

// Public API — cached dataURL of the character's portrait, or null when the
// mesh is missing / rendering fails (caller keeps the emoji fallback).
export function getPortrait(mesh, id) {
  if (id && cache.has(id)) return cache.get(id);
  if (!mesh || !ensureStudio()) return null;
  let url = null;
  try {
    url = renderPortrait(mesh);
  } catch (e) {
    console.warn('[portraitStudio] render failed', id, e);
  }
  if (url && id) cache.set(id, url);
  return url;
}
