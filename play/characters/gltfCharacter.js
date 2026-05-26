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

// Mixamo's FBX→GLB conversion stamps a per-export instance number onto the
// `mixamorig` bone prefix (e.g. `mixamorig4:Hips` in one file vs
// `mixamorig12:Hips` in another), so a clip loaded from a separate
// animation GLB won't bind to a character's own skeleton without renaming
// its track-name prefixes to match. Three.js's GLTFLoader also strips ":"
// from animation track names via PropertyBinding.sanitizeNodeName, so the
// tracks arrive as e.g. "mixamorig4Hips.position".
//
// Two target-rig conventions are handled:
//   • Mixamo-style: bones also start with `mixamorig<N>` — we just rewrite
//     the numeric instance so the clip's `<N>` matches the rig's `<N>`.
//   • Plain-name (e.g. Meshy auto-rig: Hips, Spine, Spine01, Head, ...):
//     strip the `mixamorig<N>` prefix entirely AND apply a small name-map
//     for the Mixamo↔Meshy bone-name mismatches.
const MESHY_NAME_REMAP = {
  Spine1: 'Spine01',
  Spine2: 'Spine02',
  Neck: 'neck',
  HeadTop_End: 'head_end',
};
function retargetMixamoPrefix(clip, skeleton) {
  if (!skeleton?.bones?.length) return clip;
  const rootName = skeleton.bones[0].name || '';
  const mixamoMatch = rootName.match(/^mixamorig(\d*)/);
  const out = clip.clone();
  if (mixamoMatch) {
    const tgtN = mixamoMatch[1];
    for (const t of out.tracks) {
      t.name = t.name.replace(/^mixamorig\d*/, 'mixamorig' + tgtN);
    }
    return out;
  }
  // Plain-name target: strip mixamorig prefix and remap mismatched names.
  // Track names look like `mixamorig4Hips.position` after sanitizeNodeName.
  // Also drop Hips position/rotation tracks — Meshy's auto-rig bakes a
  // corrective rotation into the Hips bind pose to compensate for an
  // internal axis convention. Letting the clip overwrite that with its
  // own absolute quaternion collapses the character sideways.
  const kept = [];
  for (const t of out.tracks) {
    const m = t.name.match(/^mixamorig\d*([^.]+)(\..+)$/);
    if (!m) { kept.push(t); continue; }
    const bone = m[1];
    const tail = m[2];
    if (bone === 'Hips') continue;
    const mapped = MESHY_NAME_REMAP[bone] || bone;
    t.name = mapped + tail;
    kept.push(t);
  }
  out.tracks = kept;
  return out;
}

// Character variant id → asset id. The mapping lives in npcCasting.js;
// this module just consumes look._gltfAsset (already resolved) or the
// look._id (we resolve via npcCasting if needed).
//
// NOTE: this builder is SYNCHRONOUS by design. The caller must have
// already warmed the asset cache with assetLoader.warmCache() — we
// reach into the resolved map and clone synchronously. Returning null
// signals "asset not loaded; fall back to procedural makeCharacter".

// Version banner: when the user reports caching issues, this lets us
// confirm in DevTools console that the latest code is running.
if (!window.__gltfCharVersionLogged) {
  console.log('[gltfCharacter] v20260524d — Linda Meshy character');
  window.__gltfCharVersionLogged = true;
}

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
  // Three.js does frustum-culling by default per Mesh; explicit reaffirm
  // here so a future asset-conversion step can't silently disable it.
  let skeleton = null;
  root.traverse((obj) => {
    if (!skeleton && obj.isSkinnedMesh) skeleton = obj.skeleton;
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      obj.frustumCulled = true;
    }
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
  //
  // CLIP_MATCH maps semantic name → substring of clip name. Multiple
  // semantics can match the same character if their clips have those
  // substrings; ambiguous ones (e.g. 'sit' matching both stand-to-sit
  // and sit-cross-legged) use longer, more specific patterns.
  const CLIP_MATCH = {
    idle:     'idle',
    walk:     'walk',
    run:      'run',
    dance:    'dancing',
    jump:     'jump',
    sit_down: 'stand_to_sit',
    sit_idle: 'cross_legged',
    stand_up: 'sit_to_stand',
  };
  const ONE_SHOT = new Set(['jump', 'sit_down', 'stand_up']);
  const mixer = new THREE.AnimationMixer(inst.root);
  const actions = {};
  const sharedClipNames = Object.keys(CLIP_MATCH);

  function bindFromClips(semantic, clips) {
    if (actions[semantic]) return;
    const want = (CLIP_MATCH[semantic] || semantic).toLowerCase();
    const match = clips.find(c => (c.name || '').toLowerCase().includes(want));
    if (match) {
      // Strip scale tracks before binding. Meshy occasionally bakes
      // non-identity bone scales into catalog animation clips (e.g. the
      // Idle clip's Hips.scale is 1.176, making the character ~18%
      // bigger during idle). Bind-pose scales are 1.0 across the board,
      // so dropping these tracks lets the bone stay at its bind size.
      const filtered = match.clone();
      filtered.tracks = filtered.tracks.filter(t => !t.name.endsWith('.scale'));
      const a = mixer.clipAction(filtered);
      if (ONE_SHOT.has(semantic)) {
        a.setLoop(THREE.LoopOnce);
        a.clampWhenFinished = true;
      } else {
        a.setLoop(THREE.LoopRepeat);
      }
      actions[semantic] = a;
    }
  }
  for (const sem of sharedClipNames) bindFromClips(sem, inst.animations);
  // If the character has its own bundled animations (e.g. Meshy auto-rig
  // ships walk/run via `extraAnimations`), DON'T fall back to the
  // Mixamo-style shared pack — the bind poses don't match and applying
  // absolute Mixamo quaternions on top of a Meshy bind pose distorts
  // every bone. Better to play only the native clips and leave missing
  // motions (e.g. idle) at bind pose.
  const ownEntry = assetLoader.entryFor(assetId);
  const useSharedPack = !(ownEntry?.extraAnimations?.length);
  if (useSharedPack) {
    for (const sem of sharedClipNames) {
      if (!actions[sem]) {
        const shared = assetLoader.getAnimationClip(sem);
        if (shared) {
          const retargeted = retargetMixamoPrefix(shared, inst.skeleton);
          const a = mixer.clipAction(retargeted);
          a.setLoop(THREE.LoopRepeat);
          actions[sem] = a;
        }
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

  // Optional per-character stance narrowing — pulls shoulders + hip
  // joints toward the centerline by `stanceFactor`. Meshy's auto-rigs
  // place these bones at the widest silhouette.
  //
  // Tricky bit: the "lateral" axis differs per bone family — shoulders
  // typically use X but Meshy's hips often use Y for left/right (because
  // Hips has a 90° bind-pose rotation). We auto-detect the lateral axis
  // by comparing the Left/Right bone positions and pick whichever axis
  // has the largest magnitude difference with opposite signs.
  const stanceFactor = ownEntry?.stanceFactor;
  let stanceBindData = null; // { boneName: { axis: 'x'|'y'|'z', value } }
  if (stanceFactor && stanceFactor !== 1.0 && inst.skeleton) {
    stanceBindData = {};
    const pairs = [
      ['LeftUpLeg', 'RightUpLeg'],
      ['LeftShoulder', 'RightShoulder'],
    ];
    for (const [lName, rName] of pairs) {
      const bl = inst.skeleton.getBoneByName(lName);
      const br = inst.skeleton.getBoneByName(rName);
      if (!bl || !br) continue;
      const dx = Math.abs(bl.position.x - br.position.x);
      const dy = Math.abs(bl.position.y - br.position.y);
      const dz = Math.abs(bl.position.z - br.position.z);
      const axis = (dx >= dy && dx >= dz) ? 'x' : (dy >= dz) ? 'y' : 'z';
      stanceBindData[lName] = { axis, value: bl.position[axis] };
      stanceBindData[rName] = { axis, value: br.position[axis] };
    }
  }

  // Optional per-character arm-tuck rotation — rotates the SHOULDER bones
  // around the world X axis so the arms swing in laterally toward the
  // body. armTuckRad is in radians; ~0.5 = ~28° per arm. We snapshot the
  // bind-pose shoulder quaternion at init and reset to it each frame
  // before applying the tuck — otherwise the rotation would accumulate
  // for any animation that doesn't animate the shoulder bone (e.g.
  // walk/run clips that only animate arm/forearm/leg), causing the arms
  // to drift further outward every frame.
  const armTuckRad = ownEntry?.armTuckRad || 0;
  const shoulderBind = {};
  if (armTuckRad && inst.skeleton) {
    for (const side of ['Left', 'Right']) {
      const sh = inst.skeleton.getBoneByName(side + 'Shoulder');
      if (sh) shoulderBind[side] = sh.quaternion.clone();
    }
  }

  // Capture idle's first-frame upper-body quaternions (shoulder + arm
  // chain). Meshy's idle clip puts the arms in a relaxed-at-sides pose;
  // we force these values onto the bones during idle/walk/run. This is
  // body-relative (the values are in each bone's parent-local frame, so
  // they rotate naturally with the character) and replaces the previous
  // armTuck rotation math which was world-space and broke at non-zero
  // yaws (arms swung into A-pose or cross-body when the player turned).
  const ARM_CHAIN = ['LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand',
                     'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand'];
  // Rest-pose quaternions for the arm chain. Used by update() to reset
  // each bone before the unconditional TUCK/TILT multiplies — without
  // this reset the tuck rotation accumulates on bones the current clip
  // doesn't animate, producing the helicopter-arm bug.
  //
  // Priority: idle clip first frame → walk clip first frame → bone bind
  // pose. Characters without an idle clip (e.g. the post-rig Crimson
  // Linda which only ships walk + run) fall through to the walk-first
  // frame, which is a neutral mid-step pose — better than the bind pose
  // (which on Meshy rigs is arms-pinned-to-sides and kills the walking
  // arm swing entirely after the BLEND).
  const idleArmQuat = {};
  function copyArmTrackToRest(clip) {
    for (const boneName of ARM_CHAIN) {
      if (idleArmQuat[boneName]) continue;
      const trk = clip.tracks.find(t => t.name === boneName + '.quaternion');
      if (trk && trk.values.length >= 4) {
        idleArmQuat[boneName] = new THREE.Quaternion(
          trk.values[0], trk.values[1], trk.values[2], trk.values[3]
        );
      }
    }
  }
  if (inst.skeleton) {
    if (actions.idle) copyArmTrackToRest(actions.idle.getClip());
    if (actions.walk) copyArmTrackToRest(actions.walk.getClip());
    // Final fallback — current bone quaternion at instantiation time IS
    // the bind-pose value (no mixer.update has run yet).
    for (const boneName of ARM_CHAIN) {
      if (idleArmQuat[boneName]) continue;
      const b = inst.skeleton.getBoneByName(boneName);
      if (b) idleArmQuat[boneName] = b.quaternion.clone();
    }
  }

  // Per-frame update. Pass dt seconds.
  function update(dt /*, now */) {
    mixer.update(dt);
    // Force arm-chain bones to idle's first-frame pose during idle AND
    // walk/run. The captured quaternions are in each bone's parent-local
    // frame, so they're body-relative and stay correct at any yaw.
    if ((currentMotion === 'idle' || currentMotion === 'walk' || currentMotion === 'run')
        && inst.skeleton) {
      // Idle: copy idle's first-frame pose verbatim. Walk/run: blend the
      // arm chain toward idle's pose by SLERP — keeps the rest pose but
      // lets the walk clip's natural arm swing show through at reduced
      // amplitude (the Meshy walk clip is too exaggerated raw).
      const isLocomotion = (currentMotion === 'walk' || currentMotion === 'run');
      const BLEND = isLocomotion ? 0.7 : 1.0; // 0=clip, 1=idle pose
      for (const boneName of ARM_CHAIN) {
        const b = inst.skeleton.getBoneByName(boneName);
        if (!b || !idleArmQuat[boneName]) continue;
        if (BLEND >= 1.0) b.quaternion.copy(idleArmQuat[boneName]);
        else b.quaternion.slerp(idleArmQuat[boneName], BLEND);
      }
      // Extra shoulder tuck — pulls the arms tighter against the body so
      // the hands hang near the hips instead of the slight A-shape that
      // Meshy's idle clip authors. Empirically swept (see
      // /tmp/tuckmatrix): bone-LOCAL X axis, +ve on both sides, mag=0.20
      // gives a natural relaxed pose at every yaw. The shoulder bind
      // frames are aligned such that +X tucks both sides inward (NOT
      // mirrored — the previous "flip sign per side" attempt pushed the
      // right arm outward).
      const TUCK_MAG = 0.20;
      const localX = new THREE.Vector3(1, 0, 0);
      const tuck = new THREE.Quaternion().setFromAxisAngle(localX, TUCK_MAG);
      const lSh = inst.skeleton.getBoneByName('LeftShoulder');
      const rSh = inst.skeleton.getBoneByName('RightShoulder');
      if (lSh) lSh.quaternion.multiply(tuck);
      if (rSh) rSh.quaternion.multiply(tuck);
      // Arm-bone forward tilt — Meshy's idle clip puts the arms slightly
      // BEHIND the body's vertical line. A -Z rotation in the arm bone's
      // local frame swings them forward (Z is the sagittal axis for this
      // rig — found via /tmp/tuckmatrix arm-axis sweep). Apply BOTH to
      // shoulder and arm bones so the whole chain tilts forward, not just
      // the upper arm — that prevents the elbow-back/hand-forward bent look.
      const ARM_FWD = -0.18;
      const localZ = new THREE.Vector3(0, 0, 1);
      const armTilt = new THREE.Quaternion().setFromAxisAngle(localZ, ARM_FWD);
      const shTilt = new THREE.Quaternion().setFromAxisAngle(localZ, ARM_FWD * 0.5);
      if (lSh) lSh.quaternion.multiply(shTilt);
      if (rSh) rSh.quaternion.multiply(shTilt);
      const lArm = inst.skeleton.getBoneByName('LeftArm');
      const rArm = inst.skeleton.getBoneByName('RightArm');
      if (lArm) lArm.quaternion.multiply(armTilt);
      if (rArm) rArm.quaternion.multiply(armTilt);
    }
    if (stanceBindData && inst.skeleton) {
      for (const name in stanceBindData) {
        const b = inst.skeleton.getBoneByName(name);
        if (!b) continue;
        const { axis, value } = stanceBindData[name];
        b.position[axis] = value * stanceFactor;
      }
    }
    // armTuck rotation removed — the idle-arm-chain override above already
    // forces shoulders to idle's relaxed pose (in each bone's parent-local
    // frame), which is body-relative by construction. The old armTuck did
    // a world-axis rotation that broke when the player turned.
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
    clips: inst.animations,
    setMotion,
    attachAt,
    update,
    skeleton: inst.skeleton,
  };

  return group;
}
