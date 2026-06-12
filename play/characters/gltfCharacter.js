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
  console.log('[gltfCharacter] v20260611a — averaged idle pose on all rigs');
  window.__gltfCharVersionLogged = true;
}

// Manifest `textureOverride`: a base-color image applied over a shared
// rig's original UVs (e.g. maya = western_female rig + bespoke Meshy
// skin). Loaded once per URL; materials are cloned per instance because
// SkeletonUtils.clone shares material refs across clones.
const _overrideTexCache = {};
// Bump when regenerating variant jpgs in place (same filenames).
const _TEX_VER = '20260612a';
function _overrideTexture(file) {
  if (!_overrideTexCache[file]) {
    const tex = new THREE.TextureLoader().load('play/assets/characters/' + file + '?v=' + _TEX_VER);
    tex.flipY = false;              // GLTF UV convention
    tex.colorSpace = THREE.SRGBColorSpace;
    _overrideTexCache[file] = tex;
  }
  return _overrideTexCache[file];
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

  // Per-NPC stature variation — when a model is shared by multiple NPCs
  // (the ethnicity rigs are reused across named + auto NPCs), give each a
  // stable, slightly different build (~0.95–1.06× height) so they read as
  // distinct people rather than clones. Deterministic from the NPC id, so
  // it's stable across reloads. Gated on the manifest `statureVary` flag
  // so the established unique characters (hero/linda/marcus/ines) keep
  // their authored proportions.
  if (entry?.statureVary && look._id) {
    let h = 0;
    for (let i = 0; i < look._id.length; i++) h = (h * 31 + look._id.charCodeAt(i)) | 0;
    const t = (Math.abs(h) % 1000) / 1000;
    root.scale.multiplyScalar(0.95 + t * 0.11);
  }

  // Clothing-recolor variants: shared rigs carry `textureVariants` in the
  // manifest — recolored copies of the baked atlas (shirt pixels only).
  // Hash the NPC id into variants.length + 1 outcomes so the original
  // texture stays in rotation and an NPC keeps its outfit across reloads.
  // Salted so the pick doesn't correlate with the stature hash above.
  // 'fin-' ceremony stand-ins must dress like the NPCs they mirror; the
  // player keeps their customized look even on a fallback rig.
  let texFile = entry?.textureOverride || null;
  if (!texFile && entry?.textureVariants?.length && look._id && look._id !== 'player') {
    const vid = look._id.replace(/^fin-/, '') + ':shirt';
    let vh = 0;
    for (let i = 0; i < vid.length; i++) vh = (vh * 31 + vid.charCodeAt(i)) | 0;
    const pick = Math.abs(vh) % (entry.textureVariants.length + 1);
    if (pick > 0) texFile = entry.textureVariants[pick - 1];
  }

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
      if (texFile && obj.material) {
        obj.material = obj.material.clone();
        obj.material.map = _overrideTexture(texFile);
        obj.material.needsUpdate = true;
      }
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

  // Capture first-frame upper-body quaternions (shoulder + arm chain) —
  // used as the locomotion blend target in update(). Body-relative (the
  // values are in each bone's parent-local frame, so they rotate
  // naturally with the character at any yaw).
  const ARM_CHAIN = ['LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand',
                     'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand'];
  // Priority: idle clip first frame → walk clip first frame → bone bind
  // pose. NOTE: on these Meshy rigs the bind pose is a T-pose, so the
  // bind fallback only matters for rigs with no clips at all. The STATIC
  // idle pose is composed separately below (idlePose) — the walk first
  // frame is a mid-swing pose and must not be frozen as "idle".
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
  const bindQuat = {};
  if (inst.skeleton) {
    if (actions.idle) copyArmTrackToRest(actions.idle.getClip());
    if (actions.walk) copyArmTrackToRest(actions.walk.getClip());
    // Bone quaternions at instantiation time ARE the bind-pose values
    // (no mixer.update has run yet). Kept both as the final idleArmQuat
    // fallback and as the neutral-wrist / straight-elbow reference for
    // the composed idle pose below.
    for (const boneName of ARM_CHAIN) {
      const b = inst.skeleton.getBoneByName(boneName);
      if (b) bindQuat[boneName] = b.quaternion.clone();
      if (!idleArmQuat[boneName] && bindQuat[boneName]) {
        idleArmQuat[boneName] = bindQuat[boneName].clone();
      }
    }
  }

  // Shoulder tuck + forward tilt corrections, in bone-LOCAL axes.
  // Empirically swept (see /tmp/tuckmatrix): shoulder +X (NOT mirrored
  // per side — the shoulder bind frames are aligned so +X tucks both
  // sides inward), arm/shoulder -Z swings the chain forward (Z is the
  // sagittal axis in these bones' idle-clip frames).
  const tuckQ    = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.20);
  const armTiltQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -0.18);
  const shTiltQ  = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -0.09);

  const hasIdleClip = !!actions.idle;

  // Mean of a quaternion track's keyframes (sign-aligned component sum,
  // renormalized — fine for the clustered rotations of a walk cycle).
  function averageQuatTrack(track) {
    const v = track.values;
    let x = 0, y = 0, z = 0, w = 0;
    const sx = v[0], sy = v[1], sz = v[2], sw = v[3];
    for (let i = 0; i < v.length; i += 4) {
      let qx = v[i], qy = v[i + 1], qz = v[i + 2], qw = v[i + 3];
      if (qx * sx + qy * sy + qz * sz + qw * sw < 0) { qx = -qx; qy = -qy; qz = -qz; qw = -qw; }
      x += qx; y += qy; z += qz; w += qw;
    }
    const len = Math.hypot(x, y, z, w) || 1;
    return new THREE.Quaternion(x / len, y / len, z / len, w / len);
  }

  // Static idle target pose for the arm chain, composed from the WALK
  // clip for every rig (including those with a real idle clip — the
  // legacy idle-first-frame + tuck path made hero/ines/marcus read
  // broken next to the averaged pose, so all rigs now share it):
  // the walk clip's FIRST frame is a mid-swing pose, and freezing it
  // reads as broken (hyper-extended elbows, splayed wrists). Instead,
  // average each arm bone's quaternion track across the whole walk
  // cycle — the swing oscillation cancels and the mean is "arms hanging
  // relaxed at the sides" expressed in the rig's own local-frame
  // convention, with no axis-sign guessing. Elbows are then relaxed
  // toward the straight-arm bind pose (leaving a slight natural bend)
  // and wrists are set to bind (straight continuation of the forearm —
  // no splay, no flex).
  const idlePose = {};
  if (actions.walk && inst.skeleton) {
    const walkClip = actions.walk.getClip();
    for (const boneName of ARM_CHAIN) {
      const trk = walkClip.tracks.find(t => t.name === boneName + '.quaternion');
      if (trk && trk.values.length >= 4) idlePose[boneName] = averageQuatTrack(trk);
    }
    for (const side of ['Left', 'Right']) {
      const fore = idlePose[side + 'ForeArm'];
      const foreBind = bindQuat[side + 'ForeArm'];
      if (fore && foreBind) fore.slerp(foreBind, 0.55);
      if (bindQuat[side + 'Hand']) idlePose[side + 'Hand'] = bindQuat[side + 'Hand'].clone();
    }
    // The walk average keeps natural shoulder posture, arm twist and
    // elbow hinge, but its upper-arm DIRECTION still hangs ~35° outward
    // and behind the body (Meshy walks barely swing the upper arm — the
    // motion is mostly forearm). Solve the direction exactly instead of
    // hand-tuning local-axis corrections: compute the averaged arm's
    // root-space direction through the quaternion chain (bones are
    // still at bind here, matching the idle-time spine state), then
    // apply the minimal rotation taking it to "nearly straight down,
    // slightly outward + forward". setFromUnitVectors preserves the
    // averaged twist and assumes nothing about per-rig axis signs.
    // (Character forward is +Z; left side is +X — verified from the
    // toe-bone direction in the rig data.)
    const yUp = new THREE.Vector3(0, 1, 0);
    const chainQuatAbove = (bone) => {
      const stack = [];
      for (let b = bone.parent; b && b.isBone; b = b.parent) stack.push(b);
      const q = new THREE.Quaternion();
      for (let i = stack.length - 1; i >= 0; i--) q.multiply(stack[i].quaternion);
      return q;
    };
    for (const side of ['Left', 'Right']) {
      const sh = inst.skeleton.getBoneByName(side + 'Shoulder');
      const arm = inst.skeleton.getBoneByName(side + 'Arm');
      const qArm = idlePose[side + 'Arm'];
      if (!sh || !arm || !qArm) continue;
      const P = chainQuatAbove(sh).multiply(idlePose[side + 'Shoulder'] || sh.quaternion);
      const d0 = yUp.clone().applyQuaternion(P.clone().multiply(qArm));
      const dT = new THREE.Vector3(side === 'Left' ? 0.12 : -0.12, -0.99, 0.04).normalize();
      const qFix = new THREE.Quaternion().setFromUnitVectors(d0, dT);
      idlePose[side + 'Arm'] = P.clone().invert().multiply(qFix).multiply(P).multiply(qArm);
    }
  }
  for (const boneName of ARM_CHAIN) {
    if (idlePose[boneName] || !idleArmQuat[boneName]) continue;
    idlePose[boneName] = idleArmQuat[boneName].clone();
    if (hasIdleClip) {
      if (boneName === 'LeftShoulder' || boneName === 'RightShoulder') {
        idlePose[boneName].multiply(tuckQ).multiply(shTiltQ);
      } else if (boneName === 'LeftArm' || boneName === 'RightArm') {
        idlePose[boneName].multiply(armTiltQ);
      }
    }
  }

  // Subtle breathing during idle (no-idle-clip rigs only — rigs with a
  // real idle clip animate the spine themselves). Random phase so a
  // crowd doesn't breathe in lockstep.
  let spineBone = null;
  let spineBindQ = null;
  if (!hasIdleClip && inst.skeleton) {
    spineBone = inst.skeleton.getBoneByName('Spine02')
             || inst.skeleton.getBoneByName('Spine01')
             || inst.skeleton.getBoneByName('Spine');
    if (spineBone) spineBindQ = spineBone.quaternion.clone();
  }
  let breatheT = Math.random() * Math.PI * 2;
  const breatheAxis = new THREE.Vector3(1, 0, 0);
  const tmpQ = new THREE.Quaternion();

  // Smoothed weight of the static idle pose (0 = clip drives the arms,
  // 1 = idle pose fully applied). Ramped over ~0.22 s so walk→idle and
  // idle→walk transitions never snap.
  let idleW = 0;

  // Per-frame update. Pass dt seconds.
  function update(dt /*, now */) {
    mixer.update(dt);
    const isLocomotion = (currentMotion === 'walk' || currentMotion === 'run');
    const isIdle = (currentMotion === 'idle');
    const step = dt / 0.22;
    const wTarget = isIdle ? 1 : 0;
    idleW += Math.max(-step, Math.min(step, wTarget - idleW));
    if ((isIdle || isLocomotion) && inst.skeleton) {
      if (isLocomotion) {
        // Blend the arm chain toward the captured rest quaternions by
        // SLERP — keeps the rest pose but lets the walk clip's natural
        // arm swing show through at reduced amplitude (the Meshy walk
        // clip is too exaggerated raw). The captured quaternions are in
        // each bone's parent-local frame, so they're body-relative and
        // stay correct at any yaw.
        const BLEND = 0.7;
        for (const boneName of ARM_CHAIN) {
          const b = inst.skeleton.getBoneByName(boneName);
          if (!b || !idleArmQuat[boneName]) continue;
          b.quaternion.slerp(idleArmQuat[boneName], BLEND);
        }
        const lSh = inst.skeleton.getBoneByName('LeftShoulder');
        const rSh = inst.skeleton.getBoneByName('RightShoulder');
        if (lSh) lSh.quaternion.multiply(tuckQ).multiply(shTiltQ);
        if (rSh) rSh.quaternion.multiply(tuckQ).multiply(shTiltQ);
        const lArm = inst.skeleton.getBoneByName('LeftArm');
        const rArm = inst.skeleton.getBoneByName('RightArm');
        if (lArm) lArm.quaternion.multiply(armTiltQ);
        if (rArm) rArm.quaternion.multiply(armTiltQ);
      }
      if (idleW > 0.001) {
        for (const boneName of ARM_CHAIN) {
          const b = inst.skeleton.getBoneByName(boneName);
          if (!b || !idlePose[boneName]) continue;
          b.quaternion.slerp(idlePose[boneName], idleW);
        }
        if (spineBone && spineBindQ) {
          breatheT += dt;
          tmpQ.setFromAxisAngle(breatheAxis, Math.sin(breatheT * 1.5) * 0.02);
          tmpQ.premultiply(spineBindQ);
          spineBone.quaternion.slerp(tmpQ, idleW);
        }
      }
    }
    if (stanceBindData && inst.skeleton) {
      for (const name in stanceBindData) {
        const b = inst.skeleton.getBoneByName(name);
        if (!b) continue;
        const { axis, value } = stanceBindData[name];
        b.position[axis] = value * stanceFactor;
      }
    }
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
