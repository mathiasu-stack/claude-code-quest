// depth.js — windows, parallax skyline, arched library window, and a
// fake hallway visible through a Reception doorway. Together they make
// the world feel like it extends past the room boundary.
//
// Each builder takes (scene, opts) and returns an object with optional
// .update(dt, now, playerPos) for parallax / time-of-day animation.

import * as THREE from 'three';

// ── Reception windows + parallax city skyline ──────────────────────────────
// Strategy: replace the right-side wall (or part of it) with a window
// frame, render a "skyline group" outside, then translate the group by
// -5% of player horizontal motion so it appears further away.

function makeWindowFrame(width, height, color = 0x4e342e) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
  const tFrame = new THREE.Mesh(new THREE.BoxGeometry(width, 0.18, 0.12), mat);
  tFrame.position.y = height / 2;
  g.add(tFrame);
  const bFrame = new THREE.Mesh(new THREE.BoxGeometry(width, 0.18, 0.12), mat);
  bFrame.position.y = -height / 2;
  g.add(bFrame);
  const lFrame = new THREE.Mesh(new THREE.BoxGeometry(0.18, height, 0.12), mat);
  lFrame.position.x = -width / 2;
  g.add(lFrame);
  const rFrame = new THREE.Mesh(new THREE.BoxGeometry(0.18, height, 0.12), mat);
  rFrame.position.x = width / 2;
  g.add(rFrame);
  // Mullions (cross-bars)
  const mid = new THREE.Mesh(new THREE.BoxGeometry(width, 0.06, 0.08), mat);
  mid.position.y = 0;
  g.add(mid);
  const midV = new THREE.Mesh(new THREE.BoxGeometry(0.06, height, 0.08), mat);
  midV.position.x = 0;
  g.add(midV);
  return g;
}

function makeWindowGlass(width, height) {
  // Subtle blue-tinted glass plane. We layer this in front of the skyline
  // so the skyline reads as "outside, beyond the glass".
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({
      color: 0xa8d0f0, transparent: true, opacity: 0.18,
      metalness: 0.1, roughness: 0.05, depthWrite: false,
    }),
  );
}

// Build a procedural city skyline as a single Group of boxes. Each
// building has a tinted "window glow" texture stripe so the skyline
// reads as inhabited at a glance.
function buildSkylineGroup(opts = {}) {
  const g = new THREE.Group();
  const count = opts.count ?? 15;
  const colors = [0x2c3e50, 0x34495e, 0x1a2533, 0x3d4d5d, 0x2e3b48];
  for (let i = 0; i < count; i++) {
    const w = 0.6 + Math.random() * 1.4;
    const h = 1.5 + Math.random() * 4.5;
    const d = 0.8 + Math.random() * 1.0;
    // Slight self-emissive so the buildings catch light through the
    // transmission curtain wall — without this they read as solid black
    // silhouettes regardless of time of day.
    const baseColor = colors[i % colors.length];
    const mat = new THREE.MeshStandardMaterial({
      color: baseColor, roughness: 0.7, metalness: 0.2,
      emissive: baseColor, emissiveIntensity: 0.18,
    });
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    // Spread along X across a wide span, with random Z for layered depth.
    box.position.set(
      (i / count) * 28 - 14 + (Math.random() - 0.5) * 1.0,
      h / 2,
      -2 - Math.random() * 4,
    );
    g.add(box);

    // Tiny "window dot" texture on the side — canvas-generated.
    const winC = document.createElement('canvas');
    winC.width = 64; winC.height = 128;
    const ctx = winC.getContext('2d');
    ctx.fillStyle = '#1a1d2a'; ctx.fillRect(0, 0, winC.width, winC.height);
    for (let r = 1; r < 12; r++) {
      for (let c = 1; c < 6; c++) {
        const lit = Math.random() < 0.45;
        ctx.fillStyle = lit
          ? `rgba(${230 + Math.random() * 25 | 0},${200 + Math.random() * 40 | 0},${130},${0.7 + Math.random() * 0.3})`
          : 'rgba(0,0,0,0)';
        ctx.fillRect(c * 9 - 3, r * 9 - 3, 5, 5);
      }
    }
    const tex = new THREE.CanvasTexture(winC);
    tex.colorSpace = THREE.SRGBColorSpace;
    const facePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.9, h * 0.9),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true }),
    );
    facePlane.position.set(box.position.x, box.position.y, box.position.z + d / 2 + 0.001);
    g.add(facePlane);
    // Stash the lit-window plane for time-of-day fading.
    facePlane.userData._isCityWindow = true;
  }
  return g;
}

export function buildReceptionWindows(scene) {
  // Cut conceptual openings into the right wall (x = 10.83) at z = 1, 5.
  // We don't actually carve geometry; instead we lay the frame + glass
  // flush with the wall and slide the wall back behind it slightly.
  const out = { windows: [], skyline: null, _facingPlanes: [] };

  // Three windows along the east wall.
  const positions = [
    { z: -3, w: 2.4, h: 1.8 },
    { z:  0, w: 2.4, h: 1.8 },
    { z:  3, w: 2.4, h: 1.8 },
  ];
  for (const p of positions) {
    const frame = makeWindowFrame(p.w, p.h);
    frame.position.set(10.78, 1.9, p.z);
    frame.rotation.y = -Math.PI / 2;
    scene.add(frame);
    const glass = makeWindowGlass(p.w * 0.9, p.h * 0.9);
    glass.position.set(10.84, 1.9, p.z);
    glass.rotation.y = -Math.PI / 2;
    scene.add(glass);
    out.windows.push({ frame, glass });
  }

  // Skyline behind those windows. Place beyond the wall (positive X).
  // renderOrder=-1 ensures the skyline draws BEFORE the curtain wall
  // glass, so transmission shows the skyline through the glass.
  const skyline = buildSkylineGroup({ count: 14 });
  skyline.position.set(20, 0, 0);
  skyline.rotation.y = -Math.PI / 2;
  skyline.traverse((o) => { if (o.isMesh) o.renderOrder = -1; });
  scene.add(skyline);
  out.skyline = skyline;

  // Stash references for parallax + time-of-day window-glow toggle.
  out._cityWindowPlanes = [];
  skyline.traverse(o => {
    if (o.userData?._isCityWindow) out._cityWindowPlanes.push(o);
  });

  out.update = (dt, now, playerPos) => {
    if (!playerPos) return;
    // Parallax: shift skyline opposite to player x by ~5% so it reads "far".
    skyline.position.x = 20 - playerPos.x * 0.05;
    skyline.position.z = -playerPos.z * 0.05;
  };

  return out;
}

// ── Library arched window ──────────────────────────────────────────────────
// A tall arched glass panel on the east wall of the library, with a
// luminous golden plane "behind" it suggesting streaming light. Real
// shafts-of-light would need volumetrics; we fake with an additive
// quad oriented toward the floor.
export function buildLibraryArchedWindow(scene) {
  const out = { update: null };

  // Arched frame approximated with one box + half-circle on top.
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x3e2418, roughness: 0.65 });
  const lower = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.0, 0.16), frameMat);
  lower.position.set(10.78, 1.9, 22.4);
  scene.add(lower);
  const lowerR = lower.clone();
  lowerR.position.z = 25.6;
  scene.add(lowerR);
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 3.2), frameMat);
  top.position.set(10.78, 3.4, 24);
  scene.add(top);
  // Arch — semicircle approximation
  const arch = new THREE.Mesh(
    new THREE.TorusGeometry(1.6, 0.09, 8, 16, Math.PI),
    frameMat,
  );
  arch.position.set(10.78, 3.4, 24);
  arch.rotation.y = Math.PI / 2;
  arch.rotation.z = -Math.PI / 2;
  scene.add(arch);

  // Glass panel
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(3.0, 3.0),
    new THREE.MeshStandardMaterial({
      color: 0xa6c5e8, transparent: true, opacity: 0.20,
      metalness: 0.05, roughness: 0.05, depthWrite: false,
    }),
  );
  glass.position.set(10.83, 2.0, 24);
  glass.rotation.y = -Math.PI / 2;
  scene.add(glass);

  // Golden "streaming light" plane angled across the floor toward the
  // reading tables. Additive blending so it lifts whatever it crosses.
  const streamMat = new THREE.MeshBasicMaterial({
    color: 0xfff1c5, transparent: true, opacity: 0.30,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const stream = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 7.5),
    streamMat,
  );
  stream.position.set(7.8, 0.04, 22);
  stream.rotation.x = -Math.PI / 2;
  stream.rotation.z = Math.PI / 6;
  scene.add(stream);

  out.stream = stream;
  return out;
}

// ── Hallway depth illusion ─────────────────────────────────────────────────
// A long corridor visible through a "door window" inset on the BACK
// (north) wall of Reception. The corridor extends in -Z direction
// behind the wall. Player can't enter (movement clamps at z = -10.5),
// so the hallway only needs to LOOK like a corridor — fog hides the
// far end. We deliberately AVOID the south side of Reception because
// that's where the Library zone lives.
export function buildReceptionHallway(scene) {
  const out = {};

  // The hallway floor + ceiling + walls extend into negative Z, behind
  // the existing Reception back wall (which is at z = -11).
  const corridorStart = -11;
  const corridorLen   = 12;
  const corridorZ     = corridorStart - corridorLen / 2;

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(4, corridorLen),
    new THREE.MeshStandardMaterial({ color: 0x3e2c20, roughness: 0.85 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.001, corridorZ);
  scene.add(floor);

  // Side walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xe6d5a8, roughness: 0.7 });
  const wL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.0, corridorLen), wallMat);
  wL.position.set(-2, 1.5, corridorZ);
  scene.add(wL);
  const wR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.0, corridorLen), wallMat);
  wR.position.set(2, 1.5, corridorZ);
  scene.add(wR);

  // Ceiling
  const ceil = new THREE.Mesh(
    new THREE.PlaneGeometry(4, corridorLen),
    new THREE.MeshStandardMaterial({ color: 0xefe5d0, roughness: 0.85 }),
  );
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, 3.0, corridorZ);
  scene.add(ceil);

  // Far-end wall + glowing "exit" so the corridor reads as receding.
  const farZ = corridorStart - corridorLen + 0.5;
  const farWall = new THREE.Mesh(
    new THREE.BoxGeometry(4, 3.0, 0.2),
    new THREE.MeshStandardMaterial({
      color: 0xc9a44c, emissive: 0xc9a44c, emissiveIntensity: 0.25,
    }),
  );
  farWall.position.set(0, 1.5, farZ);
  scene.add(farWall);
  const exitDoor = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 2.4, 0.05),
    new THREE.MeshBasicMaterial({ color: 0xfff8c4 }),
  );
  exitDoor.position.set(0, 1.2, farZ + 0.12);
  scene.add(exitDoor);

  // A warm point light at the far end pulls the eye in (limited range
  // so it doesn't bleed into Reception).
  const farLight = new THREE.PointLight(0xfff5d4, 1.4, 8, 1.6);
  farLight.position.set(0, 2.4, farZ + 1.5);
  scene.add(farLight);

  // Tiny "DEPARTMENTS" sign above the corridor entrance — visible from
  // inside Reception when you stand near the door spot on the back wall.
  const signC = document.createElement('canvas');
  signC.width = 256; signC.height = 64;
  const ctx = signC.getContext('2d');
  ctx.fillStyle = '#1a2744'; ctx.fillRect(0, 0, signC.width, signC.height);
  ctx.fillStyle = '#c9a44c';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('DEPARTMENTS', signC.width / 2, signC.height / 2);
  const tex = new THREE.CanvasTexture(signC);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 0.5),
    new THREE.MeshBasicMaterial({ map: tex }),
  );
  sign.position.set(0, 2.7, corridorStart - 0.05);
  sign.rotation.y = Math.PI;
  scene.add(sign);

  // A doorway "opening" cut visually in the back wall — actually a black
  // plane positioned ~1cm in front of the wall to simulate the gap. The
  // wall behind it stays solid (the hallway is purely visual).
  const opening = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 2.6),
    new THREE.MeshBasicMaterial({ color: 0x05060a }),
  );
  opening.position.set(0, 1.3, corridorStart + 0.06);
  opening.rotation.y = Math.PI;
  scene.add(opening);

  return out;
}
