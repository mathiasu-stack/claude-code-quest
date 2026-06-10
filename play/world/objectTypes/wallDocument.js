// wallDocument.js — Kedash Protocol wall-document props.
//
//   buildTeamPhotosWall (PROP-07) — a row of framed "team photos" for the
//     ch05 zone wall. One stylized canvas drawing, cropped differently per
//     frame so the row reads as different photos at a glance.
//   buildEotmCorkboard (PROP-12) — "EMPLOYEE OF THE MONTH" corkboard. Six
//     pinned cards, same face every month, drawn at shrinking scale.
//
// Both return an unpositioned THREE.Group (readableNote convention); the
// rooms-loader wrapper places + rotates. Frames face local +Z.

import * as THREE from 'three';

const NAVY = '#0b1020';
const GOLD = '#c9a44c';

// ─── PROP-07: team photos wall ───────────────────────────────────────────────

// Drawn once, shared by every frame via per-texture UV crops.
function drawTeamPhoto() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 320;
  const x = c.getContext('2d');

  // Wall + warm light wash
  const wall = x.createLinearGradient(0, 0, 0, 320);
  wall.addColorStop(0, '#1a2440');
  wall.addColorStop(1, '#10182e');
  x.fillStyle = wall;
  x.fillRect(0, 0, 512, 320);

  // Window with blinds, top-left
  x.fillStyle = '#2c3c64';
  x.fillRect(36, 30, 110, 90);
  x.strokeStyle = 'rgba(201,164,76,0.45)';
  x.lineWidth = 2;
  x.strokeRect(36, 30, 110, 90);
  x.strokeStyle = 'rgba(11,16,32,0.6)';
  for (let by = 40; by < 118; by += 10) {
    x.beginPath(); x.moveTo(38, by); x.lineTo(144, by); x.stroke();
  }

  // Kedash logo plaque, top-right
  x.fillStyle = GOLD;
  x.fillRect(380, 38, 86, 50);
  x.fillStyle = NAVY;
  x.font = '700 16px monospace';
  x.textAlign = 'center';
  x.fillText('KEDASH', 423, 68);
  x.textAlign = 'left';

  // Floor band
  x.fillStyle = '#23283a';
  x.fillRect(0, 268, 512, 52);

  // Long shared desk
  x.fillStyle = '#3a2d20';
  x.fillRect(40, 226, 432, 18);
  x.fillStyle = '#2c2118';
  x.fillRect(56, 244, 14, 32);
  x.fillRect(442, 244, 14, 32);

  // Five flat poster-style figures behind the desk
  const FIGURES = [
    { fx: 96,  suit: '#26314f', skin: '#e6c39a', tie: GOLD },
    { fx: 178, suit: '#1f2a45', skin: '#caa07a', tie: '#8fa3c8' },
    { fx: 258, suit: '#2b3658', skin: '#f0d2ae', tie: GOLD },
    { fx: 338, suit: '#222d4a', skin: '#d9b48e', tie: '#8fa3c8' },
    { fx: 420, suit: '#293254', skin: '#e6c39a', tie: GOLD },
  ];
  for (const f of FIGURES) {
    // body
    x.fillStyle = f.suit;
    x.beginPath();
    x.moveTo(f.fx - 26, 226);
    x.quadraticCurveTo(f.fx - 26, 168, f.fx, 164);
    x.quadraticCurveTo(f.fx + 26, 168, f.fx + 26, 226);
    x.closePath();
    x.fill();
    // shirt + tie
    x.fillStyle = '#e8e4d8';
    x.beginPath();
    x.moveTo(f.fx - 8, 168); x.lineTo(f.fx + 8, 168);
    x.lineTo(f.fx + 4, 200); x.lineTo(f.fx - 4, 200);
    x.closePath(); x.fill();
    x.fillStyle = f.tie;
    x.fillRect(f.fx - 2, 170, 4, 26);
    // head + hair
    x.fillStyle = f.skin;
    x.beginPath(); x.arc(f.fx, 138, 22, 0, 7); x.fill();
    x.fillStyle = '#1c1408';
    x.beginPath(); x.arc(f.fx, 132, 22, Math.PI * 1.05, Math.PI * 1.95); x.fill();
    // flat smile
    x.strokeStyle = '#6b4a2e';
    x.lineWidth = 2;
    x.beginPath(); x.arc(f.fx, 144, 9, 0.25 * Math.PI, 0.75 * Math.PI); x.stroke();
  }

  // Potted plant, right edge
  x.fillStyle = '#3a2d20';
  x.fillRect(484, 240, 22, 30);
  x.fillStyle = '#3f6b45';
  x.beginPath(); x.arc(495, 222, 18, 0, 7); x.fill();
  x.beginPath(); x.arc(483, 234, 12, 0, 7); x.fill();

  // Caption strip
  x.fillStyle = 'rgba(201,164,76,0.85)';
  x.font = '700 13px monospace';
  x.fillText('KEDASH CORP · TEAM', 16, 304);

  // Poster grain
  x.fillStyle = 'rgba(255,255,255,0.03)';
  for (let i = 0; i < 90; i++) {
    x.fillRect(Math.random() * 512, Math.random() * 320, 2, 2);
  }
  return c;
}

export function buildTeamPhotosWall({ count = 5, spacing = 0.66, y = 1.6 } = {}) {
  const group = new THREE.Group();
  const photo = drawTeamPhoto();

  // Each frame crops the same canvas differently so the row reads as a
  // set of distinct shots from the same shoot.
  const CROPS = [
    { r: [1.00, 1.00], o: [0.00, 0.00] },           // full group
    { r: [0.45, 0.55], o: [0.02, 0.30] },           // left pair
    { r: [0.40, 0.50], o: [0.42, 0.32] },           // centre figure
    { r: [0.50, 0.60], o: [0.48, 0.25] },           // right pair + plant
    { r: [0.70, 0.45], o: [0.15, 0.40] },           // tight desk row
    { r: [0.35, 0.42], o: [0.62, 0.36] },           // single, off-centre
  ];

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x3e2f23, roughness: 0.65,
  });
  const n = Math.max(4, Math.min(6, count));
  const x0 = -((n - 1) * spacing) / 2;

  for (let i = 0; i < n; i++) {
    const crop = CROPS[i % CROPS.length];
    // Slight size variance so the wall doesn't read as a print run.
    const w = 0.50 + (i % 3) * 0.04;
    const h = 0.36 + ((i + 1) % 2) * 0.05;

    const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, h + 0.06, 0.035), frameMat);
    frame.position.set(x0 + i * spacing, y + (i % 2 === 0 ? 0 : 0.04), 0);
    frame.castShadow = true;
    group.add(frame);

    const tex = new THREE.CanvasTexture(photo);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(crop.r[0], crop.r[1]);
    tex.offset.set(crop.o[0], crop.o[1]);

    const pic = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }),
    );
    pic.position.set(frame.position.x, frame.position.y, 0.02);
    group.add(pic);
  }

  return group;
}

// ─── PROP-12: Employee of the Month corkboard ────────────────────────────────

function corkTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 176;
  const x = c.getContext('2d');
  x.fillStyle = '#a9885a';
  x.fillRect(0, 0, 256, 176);
  for (let i = 0; i < 900; i++) {
    const shade = Math.random();
    x.fillStyle = shade < 0.5
      ? `rgba(120,90,50,${0.10 + shade * 0.3})`
      : `rgba(220,190,140,${0.06 + (shade - 0.5) * 0.25})`;
    x.fillRect(Math.random() * 256, Math.random() * 176, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function drawPlaceholderPortrait(x, w, h) {
  x.fillStyle = '#d8dce4';
  x.fillRect(0, 0, w, h);
  x.fillStyle = '#43506b';
  x.beginPath(); x.arc(w / 2, h * 0.38, w * 0.20, 0, 7); x.fill();
  x.beginPath();
  x.moveTo(w * 0.22, h);
  x.quadraticCurveTo(w * 0.22, h * 0.62, w / 2, h * 0.60);
  x.quadraticCurveTo(w * 0.78, h * 0.62, w * 0.78, h);
  x.closePath();
  x.fill();
}

function eotmCardTexture(monthLabel, scale, drawPortrait) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 160;
  const x = c.getContext('2d');
  x.fillStyle = '#f4f0e4';
  x.fillRect(0, 0, 128, 160);
  x.strokeStyle = 'rgba(90,74,47,0.5)';
  x.strokeRect(2, 2, 124, 156);

  x.fillStyle = '#5a4a2f';
  x.textAlign = 'center';
  x.font = '700 11px monospace';
  x.fillText(monthLabel, 64, 18);

  // The portrait shrinks month over month — same face, more margin.
  const pw = Math.round(96 * scale);
  const ph = Math.round(110 * scale);
  x.save();
  x.translate(64 - pw / 2, 88 - ph / 2);
  x.beginPath();
  x.rect(0, 0, pw, ph);
  x.clip();
  if (typeof drawPortrait === 'function') drawPortrait(x, pw, ph);
  else drawPlaceholderPortrait(x, pw, ph);
  x.restore();
  x.strokeStyle = 'rgba(90,74,47,0.45)';
  x.strokeRect(64 - pw / 2, 88 - ph / 2, pw, ph);

  x.fillStyle = 'rgba(90,74,47,0.8)';
  x.font = '9px monospace';
  x.fillText('OUTSTANDING', 64, 152);
  x.textAlign = 'left';

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildEotmCorkboard({ drawPortrait, y = 1.7 } = {}) {
  const group = new THREE.Group();

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(1.74, 1.24, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x3e2f23, roughness: 0.65 }),
  );
  frame.position.set(0, y, 0);
  frame.castShadow = true;
  group.add(frame);

  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1.18),
    new THREE.MeshStandardMaterial({ map: corkTexture(), roughness: 0.95 }),
  );
  board.position.set(0, y, 0.028);
  group.add(board);

  const titleC = document.createElement('canvas');
  titleC.width = 512; titleC.height = 48;
  const tx = titleC.getContext('2d');
  tx.fillStyle = NAVY;
  tx.fillRect(0, 0, 512, 48);
  tx.fillStyle = GOLD;
  tx.font = '700 26px monospace';
  tx.textAlign = 'center';
  tx.textBaseline = 'middle';
  tx.fillText('EMPLOYEE OF THE MONTH', 256, 26);
  const titleTex = new THREE.CanvasTexture(titleC);
  titleTex.colorSpace = THREE.SRGBColorSpace;
  const title = new THREE.Mesh(
    new THREE.PlaneGeometry(1.30, 0.12),
    new THREE.MeshBasicMaterial({ map: titleTex }),
  );
  title.position.set(0, y + 0.45, 0.032);
  group.add(title);

  const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE'];
  const SCALES = [0.95, 0.78, 0.62, 0.47, 0.33, 0.21];
  const pinMat = new THREE.MeshStandardMaterial({
    color: 0xc62828, roughness: 0.3, metalness: 0.2,
  });

  for (let i = 0; i < 6; i++) {
    const col = i % 3, row = Math.floor(i / 3);
    const cx = -0.50 + col * 0.50;
    const cy = y + 0.13 - row * 0.50;

    const card = new THREE.Mesh(
      new THREE.PlaneGeometry(0.34, 0.425),
      new THREE.MeshStandardMaterial({
        map: eotmCardTexture(MONTHS[i], SCALES[i], drawPortrait),
        roughness: 0.9,
      }),
    );
    card.position.set(cx, cy, 0.034);
    card.rotation.z = (i % 2 === 0 ? 1 : -1) * (0.015 + (i % 3) * 0.012);
    group.add(card);

    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), pinMat);
    pin.position.set(cx, cy + 0.195, 0.045);
    group.add(pin);
  }

  return group;
}
