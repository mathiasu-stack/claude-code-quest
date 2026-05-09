// reception.js — extra clutter for zone 1 (Reception). Called once
// from buildWorld() AFTER the existing inline geometry, so we don't
// fight over positions.

import * as THREE from 'three';
import {
  buildMug, buildPenCup, buildStapler, buildStickyPad, buildLaptopOpen,
  buildPaperStack, buildPlantTall, buildPlantSucculent, buildPlantHanging,
  buildClock, buildPosterTexture, buildPillow, buildDoormat,
  buildCeilingLight, buildServerTower, buildWhiteboard, buildDemoScreen,
} from './shared.js';

export function decorateReception(scene, decoTickers) {
  // Reception desk clutter (desk top is at y=1.0, length 3 along X, depth 1.2 z)
  const d0 = [0, 1.0, -7]; // desk top centre

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

  // Doormat at the front doorway
  const mat = buildDoormat();
  mat.position.set(0, 0.001, 9);
  scene.add(mat);

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

  // Recessed ceiling lights (purely visual — actual light comes from
  // the directional + accents, this just gives the eye something to look up at)
  for (const [x, z] of [[-4, -4], [4, -4], [-4, 4], [4, 4], [0, 0]]) {
    const ceil = buildCeilingLight(0.5);
    ceil.position.set(x, 3.7, z);
    scene.add(ceil);
  }

  // Diverse plants (replacing some of the existing identical pots)
  const tallPlant = buildPlantTall();
  tallPlant.position.set(-9.5, 0, 9);
  scene.add(tallPlant);
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

  // Kenji's demo screens — three animated displays attached to existing screens
  const screens = [
    { x: -7.5, z: 2.4, kind: 'code'  },
    { x: -7.5, z: 3.2, kind: 'graph' },
    { x: -7.5, z: 4.0, kind: 'live'  },
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

  // Bigger / more legible posters along walls (replacing the small ones)
  const posters = [
    { title: 'GROW',      sub: 'with Kedash',     pos: [-10.83, 2.2,  0], rot: Math.PI / 2 },
    { title: 'SHIP IT',   sub: 'every Friday',    pos: [10.83, 2.2,  0], rot: -Math.PI / 2 },
    { title: 'STAY',      sub: 'curious',         pos: [-10.83, 2.2,  8], rot: Math.PI / 2 },
    { title: 'BE KIND',   sub: 'always',          pos: [10.83, 2.2,  8], rot: -Math.PI / 2 },
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
