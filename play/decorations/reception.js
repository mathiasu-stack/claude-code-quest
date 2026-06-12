// reception.js — extra clutter for zone 1 (Reception). Called once
// from buildWorld() AFTER the existing inline geometry, so we don't
// fight over positions.
//
// Every scene.add() goes through placeCompoundChild() so each item
// is selectable + draggable in the in-game editor and editable
// positions persist via data/compound_overrides.js.

import * as THREE from 'three';
import {
  buildMug, buildPenCup, buildStapler, buildStickyPad, buildLaptopOpen,
  buildPaperStack, buildPlantTall, buildPlantSucculent, buildPlantHanging,
  buildClock, buildPosterTexture, buildPillow, buildDoormat,
  buildCeilingLight, buildServerTower, buildWhiteboard, buildDemoScreen,
} from './shared.js?v=20260526d';
import { makeDecoration } from './decorationAssets.js?v=20260528j';
import { placeCompoundChild } from '../world/compoundChildren.js?v=20260528g';

const OWNER = 'decorate_reception';

export function decorateReception(scene, decoTickers) {
  // Reception desk clutter — coords are the COUNTER top (the lower
  // working surface of the desk, NOT the top of the tall back panel).
  // The desk is placed at (0, 0, -8) and stretched to 3.6W×2.2H×1.6D m,
  // so its depth spans z=-8.8..-7.2. The COUNTER occupies the front
  // half of that depth (z=-8.0..-7.2 → centre z=-7.6); the BACK PANEL
  // with Kedash branding rises from the rear half. Counter top lands
  // at ~y=1.10 after stretch + wrapper-bottom-at-origin (source
  // counter sits near Y=0 midline of the -0.57..0.57 bbox).
  const d0 = [0, 1.10, -7.6]; // counter top centre, front half

  const stapler = buildStapler();
  stapler.position.set(d0[0] - 0.9, d0[1], d0[2] - 0.05);
  placeCompoundChild(scene, stapler, OWNER, 'stapler');

  const penCup = buildPenCup();
  penCup.position.set(d0[0] - 1.0, d0[1], d0[2] + 0.2);
  placeCompoundChild(scene, penCup, OWNER, 'pen_cup');

  const sticky = buildStickyPad();
  sticky.position.set(d0[0] + 0.9, d0[1], d0[2] - 0.1);
  placeCompoundChild(scene, sticky, OWNER, 'sticky_pad');

  const recMug = buildMug(0xffffff, 0xc62828);
  recMug.position.set(d0[0] + 0.5, d0[1], d0[2] + 0.2);
  placeCompoundChild(scene, recMug, OWNER, 'reception_mug');

  const succulent = buildPlantSucculent();
  succulent.position.set(d0[0] - 0.4, d0[1], d0[2] - 0.1);
  placeCompoundChild(scene, succulent, OWNER, 'desk_succulent');

  const papers = buildPaperStack(4);
  papers.position.set(d0[0] + 0.2, d0[1], d0[2] + 0.2);
  placeCompoundChild(scene, papers, OWNER, 'desk_papers');

  // Doormat at the front doorway — Meshy floor mat if loaded, else procedural.
  const matGlb = makeDecoration('floor_mat', { width: 1.6, depth: 1.0 });
  if (matGlb) {
    matGlb.position.set(0, 0.001, 9);
    placeCompoundChild(scene, matGlb, OWNER, 'doormat');
  } else {
    const mat = buildDoormat();
    mat.position.set(0, 0.001, 9);
    placeCompoundChild(scene, mat, OWNER, 'doormat');
  }

  // Couch pillows (couches at -8.5 / 8.5, z=5, rotated to face inward)
  for (const [side, color] of [[-1, 0xc62828], [1, 0xfbc02d]]) {
    const sideKey = side < 0 ? 'L' : 'R';
    const p = buildPillow(color);
    p.position.set(side * 8.4, 0.78, 4.5);
    placeCompoundChild(scene, p, OWNER, `pillow_${sideKey}_a`);
    const p2 = buildPillow(0x1976d2);
    p2.position.set(side * 8.4, 0.78, 5.5);
    placeCompoundChild(scene, p2, OWNER, `pillow_${sideKey}_b`);
  }

  // Clock on left wall
  const clock = buildClock();
  clock.position.set(-10.83, 2.4, 5);
  clock.rotation.y = Math.PI / 2;
  placeCompoundChild(scene, clock, OWNER, 'clock');
  decoTickers.push((dt, now) => {
    // Move minute hand at 1 deg/s for visible motion (not real time).
    const t = now * 0.001;
    if (clock.userData.minHand) clock.userData.minHand.rotation.y = t * 0.5;
    if (clock.userData.hourHand) clock.userData.hourHand.rotation.y = t * 0.04;
  });

  // Ceiling pendant lamps — Meshy if loaded, else original recessed flats.
  // The reception sits inside the 12 m atrium (its own 3.8 m ceiling was
  // removed), so the pendants hang on long cords from the atrium ceiling
  // — without the cord they float in mid-air at y≈3.
  const lampCoords = [[-4, -4], [4, -4], [-4, 4], [4, 4], [0, 0]];
  const cordMat = new THREE.MeshStandardMaterial({ color: 0x22252a, roughness: 0.9 });
  for (let i = 0; i < lampCoords.length; i++) {
    const [x, z] = lampCoords[i];
    const lampGlb = makeDecoration('ceiling_lamp', { width: 0.4, height: 0.7 });
    if (lampGlb) {
      // y offset positions the TOP of the pendant near the ceiling
      // (makeDecoration parks the bottom of the AABB at the group origin,
      // so we raise the whole group so its BOTTOM is at ~3.0, top at ~3.7).
      lampGlb.position.set(x, 3.0, z);
      // Cord from the pendant top (local ~0.7) to the atrium ceiling at
      // world y=12 (local 9.0). Child of the lamp so editor moves keep
      // them together.
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 8.3, 6), cordMat);
      cord.position.set(0, 0.7 + 8.3 / 2, 0);
      lampGlb.add(cord);
      placeCompoundChild(scene, lampGlb, OWNER, `ceiling_lamp_${i}`);
    } else {
      const ceil = buildCeilingLight(0.5);
      ceil.position.set(x, 3.7, z);
      placeCompoundChild(scene, ceil, OWNER, `ceiling_lamp_${i}`);
    }
  }

  // Decorative interior doors on the south wall (next to the doorway
  // opening at z=+9), reading as "side-office doors". Only placed when
  // the GLB loaded — purely cosmetic.
  let doorIdx = 0;
  for (const x of [-3.5, 3.5]) {
    const doorGlb = makeDecoration('door', { width: 1.1, height: 2.3, depth: 0.1 });
    if (doorGlb) {
      doorGlb.position.set(x, 0, 10.85);
      doorGlb.rotation.y = Math.PI;   // face into the room
      placeCompoundChild(scene, doorGlb, OWNER, `south_door_${doorIdx}`);
    }
    doorIdx++;
  }

  // Decorative window on the west wall, slotted between the GROW poster
  // (z=+5) and the BE KIND/STAY posters (z=+8). Centered at z=+1 in the
  // open wall stretch.
  const winGlb = makeDecoration('window', { width: 2.4, height: 1.8, depth: 0.15 });
  if (winGlb) {
    winGlb.position.set(-10.83, 1.4, 1.0);
    winGlb.rotation.y = Math.PI / 2;
    placeCompoundChild(scene, winGlb, OWNER, 'west_window');
  }

  // Service elevator on the west wall, at z=-5 (clear stretch between the
  // back corner and the GROW poster at z=+5). The functional atrium
  // elevator stays at its existing east-side shaft — this is purely a
  // decorative second-elevator facade.
  const elevGlb = makeDecoration('elevator', { width: 1.8, height: 2.6, depth: 0.2 });
  if (elevGlb) {
    elevGlb.position.set(-10.83, 0, -5.0);
    elevGlb.rotation.y = Math.PI / 2;
    placeCompoundChild(scene, elevGlb, OWNER, 'service_elevator');
  }

  // Diverse plants (replacing some of the existing identical pots).
  // The tall standing plant near the entrance uses the Meshy plant GLB
  // when loaded; falls back to the procedural fiddle-leaf-ish builder.
  const tallPlantGlb = makeDecoration('plant', { width: 0.9, height: 1.7, depth: 0.9 });
  if (tallPlantGlb) {
    tallPlantGlb.position.set(-9.5, 0, 9);
    placeCompoundChild(scene, tallPlantGlb, OWNER, 'tall_plant_entry');
  } else {
    const tallPlant = buildPlantTall();
    tallPlant.position.set(-9.5, 0, 9);
    placeCompoundChild(scene, tallPlant, OWNER, 'tall_plant_entry');
  }
  const hanging = buildPlantHanging();
  hanging.position.set(0, 3.6, 6);
  placeCompoundChild(scene, hanging, OWNER, 'hanging_plant');
  const succ2 = buildPlantSucculent();
  succ2.position.set(-7.5, 1.05, -3);   // on Marcus's desk
  placeCompoundChild(scene, succ2, OWNER, 'marcus_succulent');

  // Marcus's IT bench — laptop, server tower, animated demo screens
  const laptop = buildLaptopOpen();
  laptop.position.set(-7.5, 1.0, -2.7);
  placeCompoundChild(scene, laptop, OWNER, 'marcus_laptop');
  const tower = buildServerTower();
  tower.position.set(-7.0, 0, -3.5);     // under his desk, slightly visible
  placeCompoundChild(scene, tower, OWNER, 'marcus_server_tower');
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
  placeCompoundChild(scene, aishaPapers, OWNER, 'aisha_papers');

  // Kenji's demo screens — three animated displays attached to existing
  // monitors. Tightened spacing and pulled them forward so they cluster
  // on Kenji's desk instead of drifting toward the couch (which sits at
  // z = 5 and was reading as having a 'LIVE' panel pasted on its back).
  const screens = [
    { x: -7.5, z: 2.2, kind: 'code'  },
    { x: -7.5, z: 3.0, kind: 'graph' },
    { x: -7.5, z: 3.8, kind: 'live'  },
  ];
  for (let i = 0; i < screens.length; i++) {
    const s = screens[i];
    const dem = buildDemoScreen(s.kind);
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 0.36),
      new THREE.MeshBasicMaterial({ map: dem.texture }),
    );
    plane.position.set(s.x + 0.026, 1.2, s.z);
    plane.rotation.y = Math.PI / 2;
    placeCompoundChild(scene, plane, OWNER, `kenji_screen_${i}`);
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
    placeCompoundChild(scene, label, OWNER, `diana_label_${i}`);
  }

  // Whiteboard near Aisha's area
  const whiteboard = buildWhiteboard();
  whiteboard.position.set(10.83, 2.0, -7);
  whiteboard.rotation.y = -Math.PI / 2;
  placeCompoundChild(scene, whiteboard, OWNER, 'aisha_whiteboard');

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
    { id: 'poster_grow',    title: 'GROW',    sub: 'with Kedash',  pos: [-10.83, 2.2,  5  ], rot: Math.PI / 2 },
    { id: 'poster_ship_it', title: 'SHIP IT', sub: 'every Friday', pos: [ 10.83, 2.2,  5.5], rot: -Math.PI / 2 },
    { id: 'poster_stay',    title: 'STAY',    sub: 'curious',      pos: [-10.83, 2.2,  8  ], rot: Math.PI / 2 },
    { id: 'poster_be_kind', title: 'BE KIND', sub: 'always',       pos: [ 10.83, 2.2,  8  ], rot: -Math.PI / 2 },
  ];
  for (const p of posters) {
    const tex = buildPosterTexture(p.title, p.sub);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 2.4),
      new THREE.MeshBasicMaterial({ map: tex }),
    );
    mesh.position.set(p.pos[0], p.pos[1], p.pos[2]);
    mesh.rotation.y = p.rot;
    placeCompoundChild(scene, mesh, OWNER, p.id);
  }

  // Skirting along all four walls (procedural — thin dark trim, anchors
  // the floor visually).
  const skirtMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.7 });
  let skirtIdx = 0;
  function skirting(length, x, z, rotY) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(length, 0.12, 0.04), skirtMat);
    m.position.set(x, 0.06, z);
    m.rotation.y = rotY;
    placeCompoundChild(scene, m, OWNER, `skirting_${skirtIdx++}`);
  }
  skirting(22, 0, -10.95, 0);
  skirting(22, -10.95, 0, Math.PI / 2);
  skirting(22, 10.95, 0, Math.PI / 2);
  skirting(8.5, -6.75, 10.95, 0);
  skirting(8.5, 6.75, 10.95, 0);
}
