// accessoryUnveil.js — per-tier mini-animations that introduce the new
// accessory onto the player at promotion time. Each function builds the
// accessory mesh, parents it to the player, and animates it into place
// over ~1.5–2.5 seconds.
//
// The previous (regular) addPlayerAccessories() in play.js still runs
// when the player is rebuilt — the unveil animation REPLACES THE ADD
// for the most-recently-earned tier. Older tiers are added immediately
// (they were already earned).

import * as THREE from 'three';

// Lerp helper with easing.
function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function animate(durationMs, onTick) {
  const t0 = performance.now();
  function step() {
    const now = performance.now();
    const t = Math.min(1, (now - t0) / durationMs);
    onTick(t);
    if (t < 1) requestAnimationFrame(step);
  }
  step();
}

// Sparkle puff at a world position — quick burst of small bright planes.
function sparkleBurst(parent, localPos, color = 0xfff1c5) {
  const group = new THREE.Group();
  group.position.copy(localPos);
  parent.add(group);
  for (let i = 0; i < 8; i++) {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.04, 0.04),
      new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 1,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }),
    );
    const angle = (i / 8) * Math.PI * 2;
    plane.position.set(
      Math.cos(angle) * 0.05,
      Math.sin(angle) * 0.05,
      0,
    );
    group.add(plane);
    animate(600, (t) => {
      const r = 0.05 + t * 0.25;
      plane.position.set(Math.cos(angle) * r, Math.sin(angle) * r + t * 0.1, 0);
      plane.material.opacity = 1 - t;
      if (t === 1) {
        group.remove(plane);
        plane.geometry.dispose();
        plane.material.dispose();
      }
    });
  }
  setTimeout(() => parent.remove(group), 800);
}

// ─── Tier 1: Lanyard + name badge ──────────────────────────────────────────
function unveilLanyard(player) {
  const lan = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.36, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x1a237e }),
  );
  const badge = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.18, 0.012),
    new THREE.MeshStandardMaterial({ color: 0xffffff }),
  );
  lan.position.set(0, 1.55, 0.18);  // above target
  badge.position.set(0, 1.50, 0.19);
  player.add(lan);
  player.add(badge);
  animate(1200, (t) => {
    const e = easeOutBack(t);
    lan.position.y = 1.55 - e * 0.3;
    badge.position.y = 1.50 - e * 0.5;
    if (t === 1) sparkleBurst(player, { x: 0, y: 1.0, z: 0.2 }, 0xffffff);
  });
}

// ─── Tier 2: Red tie ──────────────────────────────────────────────────────
function unveilTie(player) {
  const tieMat = new THREE.MeshStandardMaterial({
    color: 0xb71c1c, metalness: 0.1, roughness: 0.6,
  });
  const knot = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.08, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x7f1313 }),
  );
  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.42, 0.04), tieMat);
  knot.position.set(0, 2.5, 0.17); // start above
  tie.position.set(0, 2.4, 0.18);
  player.add(knot);
  player.add(tie);
  animate(1400, (t) => {
    const e = easeOutBack(t);
    knot.position.y = 2.5 - e * 1.18;   // → 1.32
    tie.position.y = 2.4 - e * 1.35;    // → 1.05
    if (t === 1) sparkleBurst(player, { x: 0, y: 1.32, z: 0.2 }, 0xff8a8a);
  });
}

// ─── Tier 3: Wrist watch ─────────────────────────────────────────────────
function unveilWatch(player) {
  const watch = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.06, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x424242, metalness: 0.7, roughness: 0.3 }),
  );
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.06, 0.04),
    new THREE.MeshBasicMaterial({ color: 0xfff59d }),
  );
  // Slide in from the player's left
  watch.position.set(-1.5, 0.84, 0.06);
  face.position.set(-1.5, 0.84, 0.082);
  player.add(watch);
  player.add(face);
  animate(1300, (t) => {
    const e = easeOutCubic(t);
    watch.position.x = -1.5 + e * 1.12;  // → -0.38
    face.position.x = -1.5 + e * 1.12;
    if (t === 1) sparkleBurst(player, { x: -0.38, y: 0.84, z: 0.1 }, 0xfff59d);
  });
}

// ─── Tier 4: Vest with gold buttons popping in ───────────────────────────
function unveilVest(player) {
  const vest = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.78, 0.36),
    new THREE.MeshStandardMaterial({
      color: 0x263238, metalness: 0.3, roughness: 0.5,
      transparent: true, opacity: 0,
    }),
  );
  vest.position.set(0, 1.05, 0);
  player.add(vest);
  animate(1000, (t) => { vest.material.opacity = t; });
  // Gold buttons pop in one by one with sparkle
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const btn = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 8, 6),
        new THREE.MeshStandardMaterial({
          color: 0xc9a44c, metalness: 0.8, roughness: 0.2,
        }),
      );
      btn.position.set(0, 1.25 - i * 0.18, 0.19);
      btn.scale.setScalar(0);
      player.add(btn);
      animate(400, (t) => { btn.scale.setScalar(easeOutBack(t)); });
      sparkleBurst(player, { x: 0, y: 1.25 - i * 0.18, z: 0.2 }, 0xffd54f);
    }, 700 + i * 250);
  }
}

// ─── Tier 5: Glasses descending onto the face ──────────────────────────
function unveilGlasses(player) {
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x111111, metalness: 0.6, roughness: 0.3,
  });
  const lensL = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 16), frameMat);
  lensL.rotation.y = Math.PI / 2;
  const lensR = lensL.clone();
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.01), frameMat);
  // Start above the head
  lensL.position.set(-0.07, 2.4, 0.2);
  lensR.position.set(0.07, 2.4, 0.2);
  bridge.position.set(0, 2.4, 0.21);
  player.add(lensL); player.add(lensR); player.add(bridge);
  animate(1300, (t) => {
    const e = easeOutBack(t);
    const y = 2.4 - e * 0.74;  // → 1.66
    lensL.position.y = y; lensR.position.y = y; bridge.position.y = y;
    if (t === 1) {
      // Lens flare on landing
      const flare = new THREE.Mesh(
        new THREE.PlaneGeometry(0.4, 0.1),
        new THREE.MeshBasicMaterial({
          color: 0xffffff, transparent: true, opacity: 0.7,
          blending: THREE.AdditiveBlending, depthWrite: false,
        }),
      );
      flare.position.set(0, 1.66, 0.22);
      player.add(flare);
      animate(500, (ft) => {
        flare.material.opacity = 0.7 * (1 - ft);
        flare.scale.x = 1 + ft * 1.5;
      });
      setTimeout(() => {
        player.remove(flare);
        flare.geometry.dispose();
        flare.material.dispose();
      }, 600);
    }
  });
}

// ─── Tier 6: Gold necklace + pendant materializing ──────────────────────
function unveilNecklace(player) {
  const chain = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.012, 8, 32),
    new THREE.MeshStandardMaterial({
      color: 0xffd700, metalness: 0.95, roughness: 0.1,
      transparent: true, opacity: 0,
    }),
  );
  chain.rotation.x = Math.PI / 2;
  chain.position.set(0, 1.32, 0.04);
  chain.scale.set(1, 0.65, 1);
  const pendant = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 12, 10),
    new THREE.MeshStandardMaterial({
      color: 0xffd700, metalness: 0.95, roughness: 0.1,
      transparent: true, opacity: 0,
    }),
  );
  pendant.position.set(0, 1.18, 0.18);
  player.add(chain); player.add(pendant);
  animate(1200, (t) => {
    chain.material.opacity = t;
    pendant.material.opacity = t;
    // Pendant swings (slight x-translation)
    pendant.position.x = Math.sin(t * 6) * (1 - t) * 0.05;
  });
  sparkleBurst(player, { x: 0, y: 1.25, z: 0.1 }, 0xffd700);
}

// ─── Tier 7: Lapel pin + halo (capstone+) ──────────────────────────────
function unveilHalo(player) {
  const pin = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 12, 10),
    new THREE.MeshStandardMaterial({
      color: 0xff4081, metalness: 0.5, roughness: 0.2,
      emissive: 0x331122,
    }),
  );
  pin.position.set(-0.18, 1.28, 0.18);
  pin.scale.setScalar(0);
  player.add(pin);
  animate(800, (t) => { pin.scale.setScalar(easeOutBack(t)); });
  sparkleBurst(player, { x: -0.18, y: 1.28, z: 0.2 }, 0xff77aa);

  // Halo descends onto the head with a glow
  setTimeout(() => {
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.27, 0.022, 12, 32),
      new THREE.MeshStandardMaterial({
        color: 0xffeb3b, metalness: 0.8, roughness: 0.2,
        emissive: 0x222200, transparent: true, opacity: 0,
      }),
    );
    halo.position.set(0, 3, 0);
    halo.rotation.x = Math.PI / 2;
    player.add(halo);
    animate(1500, (t) => {
      const e = easeOutCubic(t);
      halo.position.y = 3 - e * 1.05;  // → 1.95
      halo.material.opacity = t * 0.95;
      halo.material.emissiveIntensity = 0.4 + Math.sin(t * 18) * 0.2;
    });
  }, 600);
}

const UNVEILS_BY_TIER = {
  1: unveilLanyard,
  2: unveilTie,
  3: unveilWatch,
  4: unveilVest,
  5: unveilGlasses,
  6: unveilNecklace,
  7: unveilHalo,
};

// GLTF unveil: the procedural unveil functions above use absolute Y
// positions tuned for primitive body proportions. On a GLTF rig those
// positions land at chest/floor/inside-the-head levels. So for GLTF
// players we run a SIMPLER unveil: scale the most-recently-added
// child of the relevant bone from 0 → 1 with the easeOutBack curve,
// plus a sparkle burst at the bone's world position.
function unveilGltfTier(tier, player) {
  const c = player.userData?.gltfChar;
  if (!c) return;
  // The accessory was already attached by addGltfPlayerAccessories —
  // we find the bone for this tier and animate scale-in on its most
  // recently-added children.
  const tierBone = {
    1: 'chest', 2: 'chest', 3: 'leftHand', 4: 'chest',
    5: 'head',  6: 'neck',  7: 'head',
  }[tier] || 'chest';
  const bone = c.skeleton ? c.attachAt && (
    // resolveBone is on assetLoader; quickest path: get bone from a
    // freshly-attached dummy, then remove it. Cleaner: store the
    // bone reference at attach time. For now: walk the rig.
    null
  ) : null;
  // Animate any non-zero-scale children on the rig that were JUST
  // added (we tag them via userData.unveilFresh in attachAt — but
  // since attachAt is generic, fall back to: scale every Mesh whose
  // userData.unveiled !== true UP from 0).
  const candidates = [];
  player.traverse(o => {
    if (o.isMesh && !o.userData.unveiled) candidates.push(o);
  });
  // Mark them so the next ceremony only animates *new* additions.
  for (const m of candidates) {
    m.userData.unveiled = true;
    m.userData._unveilStartScale = m.scale.clone();
    m.scale.setScalar(0);
  }
  animate(900, (t) => {
    const e = easeOutBack(t);
    for (const m of candidates) {
      const target = m.userData._unveilStartScale;
      m.scale.set(target.x * e, target.y * e, target.z * e);
    }
  });
  // Sparkle at the rig root level for a friendly "ping" effect.
  sparkleBurst(player, { x: 0, y: 1.4, z: 0.15 }, 0xffd700);
}

// Run the unveil animation for a specific tier. If we don't have an
// unveil for that tier, no-op (older tiers' accessories were already
// added at player build time by addPlayerAccessories).
export function unveilForTier(tier, player, audio) {
  // GLTF route — use the simpler scale-in unveil.
  if (player?.userData?.gltfChar) {
    try {
      unveilGltfTier(tier, player);
    } catch (e) {
      console.warn('GLTF accessory unveil failed', e);
    }
    if (audio?.playPpPing) setTimeout(() => audio.playPpPing(), 250);
    return null;
  }
  // We don't have unveils for tiers > 7; for tiers 8+ (capstone+),
  // run the halo animation as a flourish.
  const fn = UNVEILS_BY_TIER[tier] || (tier > 7 ? unveilHalo : null);
  if (!fn) return null;
  try {
    fn(player);
  } catch (e) {
    // Failsafe — never let an unveil error abort the ceremony
    console.warn('accessory unveil failed', e);
  }
  if (audio?.playPpPing) {
    setTimeout(() => audio.playPpPing(), 250);
  }
  return null;
}
