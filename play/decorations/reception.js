// reception.js — extra clutter for zone 1 (Reception). Called once
// from buildWorld() AFTER the existing inline geometry, so we don't
// fight over positions.

import * as THREE from 'three';
import {
  buildMug, buildPenCup, buildStapler, buildStickyPad, buildLaptopOpen,
  buildPaperStack, buildPlantTall, buildPlantSucculent, buildPlantHanging,
  buildClock, buildPosterTexture, buildPillow, buildDoormat,
  buildCeilingLight, buildServerTower, buildWhiteboard, buildDemoScreen,
} from './shared.js?v=20260526d';
import { makeDecoration } from './decorationAssets.js?v=20260526l';

export function decorateReception(scene, decoTickers) {
  // Reception desk clutter — coords are the desk's top centre. The desk
  // itself is placed at (0, 0, -8) and stretched to 2.4×1.0×1.0m, so
  // top is at y=1.0 and centre on Z is -8.
  const d0 = [0, 1.0, -8]; // desk top centre

  const stapler = buildStapler();
  stapler.position.set(d0[0] - 0.9, d0[1], d0[2] - 0.05);
  scene.add(stapler);

  const penCup = buildPenCup();
  penCup.position.set(d0[0] - 1.0, d0[1], d0[2] + 0.2);
  scene.add(penCup);

  const sticky = buildStickyPad();
  sticky.position.set(d0[0] + 0.9, d0[1], d0[2] - 0.1);
  scene.add(sticky);

  const recMug = buildMug(0xffffff, 0xc62828);
  recMug.position.set(d0[0] + 0.5, d0[1], d0[2] + 0.2);
  scene.add(recMug);

  const succulent = buildPlantSucculent();
  succulent.position.set(d0[0] - 0.4, d0[1], d0[2] - 0.1);
  scene.add(succulent);

  const papers = buildPaperStack(4);
  papers.position.set(d0[0] + 0.2, d0[1], d0[2] + 0.2);
  scene.add(papers);

  // Doormat at the front doorway — Meshy floor mat if loaded, else procedural.
  const matGlb = makeDecoration('floor_mat', { width: 1.6, depth: 1.0 });
  if (matGlb) {
    matGlb.position.set(0, 0.001, 9);
    scene.add(matGlb);
  } else {
    const mat = buildDoormat();
    mat.position.set(0, 0.001, 9);
    scene.add(mat);
  }

  // Couch pillows (couches at -8.5 / 8.5, z=5, rotated to face inward)
  for (const [side, color] of [[-1, 0xc62828], [1, 0xfbc02d]]) {
    const p = buildPillow(color);
    p.position.set(side * 8.4, 0.78, 4.5);
    scene.add(p);
    const p2 = buildPillow(0x1976d2);
    p2.position.set(side * 8.4, 0.78, 5.5);
    scene.add(p2);
  }

  // Clock on left wall
  const clock = buildClock();
  clock.position.set(-10.83, 2.4, 5);
  clock.rotation.y = Math.PI / 2;
  scene.add(clock);
  decoTickers.push((dt, now) => {
    // Move minute hand at 1 deg/s for visible motion (not real time).
    const t = now * 0.001;
    if (clock.userData.minHand) clock.userData.minHand.rotation.y = t * 0.5;
    if (clock.userData.hourHand) clock.userData.hourHand.rotation.y = t * 0.04;
  });

  // Ceiling pendant lamps — Meshy if loaded, else original recessed flats.
  // Reception ceiling sits at ~3.7m; the pendants hang from there.
  for (const [x, z] of [[-4, -4], [4, -4], [-4, 4], [4, 4], [0, 0]]) {
    const lampGlb = makeDecoration('ceiling_lamp', { width: 0.4, height: 0.7 });
    if (lampGlb) {
      // y offset positions the TOP of the pendant near the ceiling
      // (makeDecoration parks the bottom of the AABB at the group origin,
      // so we raise the whole group so its BOTTOM is at ~3.0, top at ~3.7).
      lampGlb.position.set(x, 3.0, z);
      scene.add(lampGlb);
    } else {
      const ceil = buildCeilingLight(0.5);
      ceil.position.set(x, 3.7, z);
      scene.add(ceil);
    }
  }

  // Decorative interior doors on the south wall (next to the doorway
  // opening at z=+9), reading as "side-office doors". Only placed when
  // the GLB loaded — purely cosmetic.
  for (const x of [-3.5, 3.5]) {
    const doorGlb = makeDecoration('door', { width: 1.1, height: 2.3, depth: 0.1 });
    if (doorGlb) {
      doorGlb.position.set(x, 0, 10.85);
      doorGlb.rotation.y = Math.PI;   // face into the room
      scene.add(doorGlb);
    }
  }

  // Decorative window on the west wall, slotted between the GROW poster
  // (z=+5) and the BE KIND/STAY posters (z=+8). Centered at z=+1 in the
  // open wall stretch.
  const winGlb = makeDecoration('window', { width: 2.4, height: 1.8, depth: 0.15 });
  if (winGlb) {
    winGlb.position.set(-10.83, 1.4, 1.0);
    winGlb.rotation.y = Math.PI / 2;
    scene.add(winGlb);
  }

  // Service elevator on the west wall, at z=-5 (clear stretch between the
  // back corner and the GROW poster at z=+5). The functional atrium
  // elevator stays at its existing east-side shaft — this is purely a
  // decorative second-elevator facade.
  const elevGlb = makeDecoration('elevator', { width: 1.8, height: 2.6, depth: 0.2 });
  if (elevGlb) {
    elevGlb.position.set(-10.83, 0, -5.0);
    elevGlb.rotation.y = Math.PI / 2;
    scene.add(elevGlb);
  }

  // Diverse plants (replacing some of the existing identical pots).
  // The tall standing plant near the entrance uses the Meshy plant GLB
  // when loaded; falls back to the procedural fiddle-leaf-ish builder.
  const tallPlantGlb = makeDecoration('plant', { width: 0.9, height: 1.7, depth: 0.9 });
  if (tallPlantGlb) {
    tallPlantGlb.position.set(-9.5, 0, 9);
    scene.add(tallPlantGlb);
  } else {
    const tallPlant = buildPlantTall();
    tallPlant.position.set(-9.5, 0, 9);
    scene.add(tallPlant);
  }
  const hanging = buildPlantHanging();
  hanging.position.set(0, 3.6, 6);
  scene.add(hanging);
  const succ2 = buildPlantSucculent();
  succ2.position.set(-7.5, 1.05, -3);   // on Marcus's desk
  scene.add(succ2);

  // Marcus's IT bench — laptop, server tower, animated demo screens
  const laptop = buildLaptopOpen();
  laptop.position.set(-7.5, 1.0, -2.7);
  scene.add(laptop);
  const tower = buildServerTower();
  tower.position.set(-7.0, 0, -3.5);     // under his desk, slightly visible
  scene.add(tower);
  decoTickers.push((dt, now) => {
    if (!tower.userData.leds) return;
    for (let i = 0; i < tower.userData.leds.length; i++) {
      const led = tower.userData.leds[i];
      const phase = (now * 0.002 + i * 0.5) % 2;
      led.material.emissiveIntensity = phase < 1 ? 0.9 : 0.3;
    }
  });

  // Aisha's desk — papers + tablet (plus existing mug already in NPC prop)
  const aishaPapers = buildPaperStack(3);
  aishaPapers.position.set(7.5, 1.0, -2.7);
  scene.add(aishaPapers);

  // Kenji's demo screens — three animated displays attached to existing
  // monitors. Tightened spacing and pulled them forward so they cluster
  // on Kenji's desk instead of drifting toward the couch (which sits at
  // z = 5 and was reading as having a 'LIVE' panel pasted on its back).
  const screens = [
    { x: -7.5, z: 2.2, kind: 'code'  },
    { x: -7.5, z: 3.0, kind: 'graph' },
    { x: -7.5, z: 3.8, kind: 'live'  },
  ];
  for (const s of screens) {
    const dem = buildDemoScreen(s.kind);
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 0.36),
      new THREE.MeshBasicMaterial({ map: dem.texture }),
    );
    plane.position.set(s.x + 0.026, 1.2, s.z);
    plane.rotation.y = Math.PI / 2;
    scene.add(plane);
    decoTickers.push((dt, now) => dem.tick(dt, now));
  }

  // Diana's filing cabinets — small "FILES" labels (tiny canvas planes)
  for (let i = 0; i < 3; i++) {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 32;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#37474f'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#fafafa';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(['A–F', 'G–M', 'N–Z'][i], c.width / 2, c.height / 2);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(0.32, 0.08),
      new THREE.MeshBasicMaterial({ map: tex }),
    );
    label.position.set(7.32, 1.0, 2 + i);
    label.rotation.y = -Math.PI / 2;
    scene.add(label);
  }

  // Whiteboard near Aisha's area
  const whiteboard = buildWhiteboard();
  whiteboard.position.set(10.83, 2.0, -7);
  whiteboard.rotation.y = -Math.PI / 2;
  scene.add(whiteboard);

  // Bigger / more legible posters along walls (replacing the small ones).
  // Bug E fix: GROW was previously at z=0 on the west wall — directly
  // behind the atrium staircase (steps span world z=-3.0..-0.54), and
  // its z-extent (±0.8) overlapped the stair's top steps at z=-0.7..-0.5.
  // Moved south to z=+5 so it sits clear of the stair footprint, in the
  // open wall section between the stair (z<+0.7) and the doorway corner
  // (z>+9). The other three posters were already clear.
  // East-wall posters must clear the windows at z=-3, 0, +3 (each 2.4m
  // wide so they span ±1.2 around their center). SHIP IT was at z=0
  // directly over the middle window — moved to z=+5.5, the open
  // stretch between the last window (z=+3, ends at z=+4.2) and the
  // BE KIND poster (z=+8, starts at z=+7.2). Caught by audit
  // spatial::3.1.
  const posters = [
    { title: 'GROW',      sub: 'with Kedash',     pos: [-10.83, 2.2,  5  ], rot: Math.PI / 2 },
    { title: 'SHIP IT',   sub: 'every Friday',    pos: [ 10.83, 2.2,  5.5], rot: -Math.PI / 2 },
    { title: 'STAY',      sub: 'curious',         pos: [-10.83, 2.2,  8  ], rot: Math.PI / 2 },
    { title: 'BE KIND',   sub: 'always',          pos: [ 10.83, 2.2,  8  ], rot: -Math.PI / 2 },
  ];
  for (const p of posters) {
    const tex = buildPosterTexture(p.title, p.sub);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 2.4),
      new THREE.MeshBasicMaterial({ map: tex }),
    );
    mesh.position.set(p.pos[0], p.pos[1], p.pos[2]);
    mesh.rotation.y = p.rot;
    scene.add(mesh);
  }

  // Skirting along all four walls (procedural — thin dark trim, anchors
  // the floor visually).
  const skirtMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.7 });
  function skirting(length, x, z, rotY) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(length, 0.12, 0.04), skirtMat);
    m.position.set(x, 0.06, z);
    m.rotation.y = rotY;
    scene.add(m);
  }
  skirting(22, 0, -10.95, 0);
  skirting(22, -10.95, 0, Math.PI / 2);
  skirting(22, 10.95, 0, Math.PI / 2);
  skirting(8.5, -6.75, 10.95, 0);
  skirting(8.5, 6.75, 10.95, 0);
}
