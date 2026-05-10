// gltfCharacter.js — character builder backed by a GLTF asset.
//
// Public API (matches makeCharacter so call sites don't change):
//   const group = await makeGltfCharacter(look, assetLoader);
//   group.position / group.rotation / etc. (it's a THREE.Group)
//   group.userData.parts.head        — for head-rotation code
//   group.userData.faceKind = 'gltf' — tells the per-frame face
//                                       updater to skip flat-face
//   group.userData.gltfChar.mixer    — AnimationMixer
//   group.userData.gltfChar.setMotion('idle' | 'walk' | 'run')
//   group.userData.gltfChar.update(dt, now)
//   group.userData.gltfChar.attachAt('head'|'leftHand'|...,
//                                    primitiveMesh)
//
// If the requested asset is unavailable, this returns null. The caller
// MUST fall back to procedural makeCharacter in that case (handled by
// the wrapper in play.js — see G6).
//
// What this builder does NOT do:
//   • Build a flat-face quad. The GLTF model has its own painted face.
//   • Drive blink/talk via canvas. Those rely on blendshapes; if the
//     pack ships with morphTargetDictionary entries we use them,
//     otherwise we skip cleanly.
//   • Construct primitive limbs. The GLTF skeleton replaces them.

import * as THREE from 'three';
import { clone as cloneSkeletal } from 'three/addons/utils/SkeletonUtils.js';

// Character variant id → asset id. The mapping lives in npcCasting.js;
// this module just consumes look._gltfAsset (already resolved) or the
// look._id (we resolve via npcCasting if needed).
//
// NOTE: this builder is SYNCHRONOUS by design. The caller must have
// already warmed the asset cache with assetLoader.warmCache() — we
// reach into the resolved map and clone synchronously. Returning null
// signals "asset not loaded; fall back to procedural makeCharacter".

export function makeGltfCharacter(look, assetLoader) {
  const assetId = look._gltfAsset;
  if (!assetId) return null;

  const gltf = assetLoader.getResolved(assetId);
  if (!gltf || !gltf.scene) return null;

  // Build a per-instance copy. Skeleton-aware clone so two instances
  // don't share rig state.
  const root = cloneSkeletal(gltf.scene);
  const entry = assetLoader.entryFor(assetId);
  if (entry?.scale && entry.scale !== 1.0) root.scale.setScalar(entry.scale);
  if (entry?.yOffset) root.position.y = entry.yOffset;

  // Find the SkinnedMesh skeleton + ensure shadow flags.
  let skeleton = null;
  root.traverse((obj) => {
    if (!skeleton && obj.isSkinnedMesh) skeleton = obj.skeleton;
    if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; }
  });
  const inst = { root, skeleton, animations: gltf.animations || [] };

  const group = new THREE.Group();
  group.add(inst.root);

  // Find a "head" node we can hand to the head-rotation code in
  // play.js:2136-2152. Prefer the rig's Head bone; fall back to an
  // empty pivot if none found.
  let headNode = null;
  if (inst.skeleton) {
    headNode = assetLoader.resolveBone(inst.skeleton, 'head');
  }
  if (!headNode) {
    // Empty pivot at approximate head height so callers don't crash
    // when reading head.getWorldPosition / head.rotation.
    headNode = new THREE.Object3D();
    headNode.position.y = 1.66;
    inst.root.add(headNode);
  }

  // Set up AnimationMixer. We bind clips from the GLTF first, then
  // augment with shared-pack clips (loadAnimations in assetLoader).
  const mixer = new THREE.AnimationMixer(inst.root);
  const actions = {};
  const sharedClipNames = ['idle', 'walk', 'run'];

  // Take the first clip whose lowercase name matches the semantic.
  function bindFromClips(semantic, clips) {
    if (actions[semantic]) return;
    const want = semantic.toLowerCase();
    const match = clips.find(c => (c.name || '').toLowerCase().includes(want));
    if (match) {
      const a = mixer.clipAction(match);
      a.setLoop(THREE.LoopRepeat);
      actions[semantic] = a;
    }
  }
  for (const sem of sharedClipNames) bindFromClips(sem, inst.animations);
  for (const sem of sharedClipNames) {
    if (!actions[sem]) {
      const shared = assetLoader.getAnimationClip(sem);
      if (shared) {
        const a = mixer.clipAction(shared);
        a.setLoop(THREE.LoopRepeat);
        actions[sem] = a;
      }
    }
  }

  // Default to idle if available; otherwise leave the model in T-pose.
  let currentMotion = null;
  function setMotion(name) {
    if (currentMotion === name) return;
    const next = actions[name];
    const prev = actions[currentMotion];
    currentMotion = name;
    if (prev && next) {
      prev.fadeOut(0.18);
      next.reset().fadeIn(0.18).play();
    } else if (next) {
      next.reset().play();
    } else if (prev) {
      prev.fadeOut(0.18);
    }
  }
  setMotion('idle');

  // Attach an accessory primitive (or any Object3D) to a named bone.
  // Used by the outfit / accessory tier system to put a tie on the
  // chest, glasses on the head, watch on the wrist, etc.
  function attachAt(semantic, child) {
    if (!inst.skeleton) {
      group.add(child);
      return;
    }
    const bone = assetLoader.resolveBone(inst.skeleton, semantic);
    if (bone) {
      bone.add(child);
    } else {
      console.warn(`[gltfCharacter] no bone for '${semantic}' on asset ${assetId}; attaching to root`);
      group.add(child);
    }
  }

  // Per-frame update. Pass dt seconds.
  function update(dt /*, now */) {
    mixer.update(dt);
  }

  // Stash the look so existing systems (idleAnimations, dialogue,
  // etc.) that read group.userData.look continue to work.
  group.userData.look = look;
  group.userData.parts = { head: headNode };
  group.userData.faceKind = 'gltf';
  group.userData.face = null;        // flat-face guard treats null as "skip"
  group.userData.gltfChar = {
    assetId,
    mixer,
    actions,
    setMotion,
    attachAt,
    update,
    skeleton: inst.skeleton,
  };

  return group;
}
