// library.js — clutter for zone 2 (Knowledge Library).
//
// Every scene.add() goes through placeCompoundChild() so each item
// is selectable + draggable in the in-game editor and editable
// positions persist via data/compound_overrides.js.

import * as THREE from 'three';
import {
  buildOpenBook, buildBookmark, buildArmchair, buildGlobe, buildLadder,
  buildGrandfatherClock, buildSidetable, buildBookStack, buildLibraryCart,
  buildMug, buildPlantHanging, buildPosterTexture,
} from './shared.js?v=20260526d';
import { placeCompoundChild } from '../world/compoundChildren.js?v=20260528g';

const OWNER = 'decorate_library';

// PROP-10 (Kedash Protocol): every clock in the library reads 9:41 —
// the time the hands stopped mattering. Hands are pinned, pendulum may
// keep swinging (alive, but no longer keeping time).
// Rx(-π/2) stands the hand's long axis up (tip at 12); Rz(-θ) sweeps it
// clockwise as seen from the front. 'ZYX' order so Rx applies first.
function pinClockHandsAt941(gClock) {
  const minA = (41 / 60) * Math.PI * 2;
  const hourA = ((9 + 41 / 60) / 12) * Math.PI * 2;
  for (const [hand, a] of [[gClock.userData.minHand, minA], [gClock.userData.hourHand, hourA]]) {
    if (!hand) continue;
    hand.rotation.order = 'ZYX';
    hand.rotation.set(-Math.PI / 2, 0, -a);
  }
}

export function decorateLibrary(scene, decoTickers) {
  // Open books on the two reading tables (existing tables at z=16 & z=22)
  let tableIdx = 0;
  for (const z of [16, 22]) {
    const key = tableIdx === 0 ? 'a' : 'b';
    const book = buildOpenBook();
    book.position.set(0.6, 0.78, z);
    book.rotation.y = -0.2;
    placeCompoundChild(scene, book, OWNER, `open_book_${key}`);
    // teacup with steam — fakes steam by sliding a few small dust planes up
    const tea = buildMug(0xfff8e1, 0x6d4c41);
    tea.position.set(-0.5, 0.78, z - 0.2);
    placeCompoundChild(scene, tea, OWNER, `tea_mug_${key}`);
    // bookmark sticking out of book
    const bm = buildBookmark(0xb71c1c);
    bm.position.set(0.74, 0.81, z + 0.05);
    placeCompoundChild(scene, bm, OWNER, `bookmark_${key}`);
    tableIdx++;
  }

  // Globe on a stand near the centre of the library
  const globe = buildGlobe();
  globe.position.set(-3.5, 0, 19);
  placeCompoundChild(scene, globe, OWNER, 'globe');
  decoTickers.push((dt, now) => {
    if (globe.userData.ball) globe.userData.ball.rotation.y = now * 0.0003;
  });

  // Rolling library ladder against the left bookshelf
  const ladder = buildLadder(2.6);
  ladder.position.set(-9.8, 0, 18);
  ladder.rotation.y = Math.PI / 2;
  placeCompoundChild(scene, ladder, OWNER, 'ladder');

  // Reading nook at the back-right corner: armchair + lamp + sidetable + books
  const armchair = buildArmchair();
  armchair.position.set(8, 0, 30);
  armchair.rotation.y = -Math.PI / 4;
  placeCompoundChild(scene, armchair, OWNER, 'nook_armchair');
  const sidetable = buildSidetable();
  sidetable.position.set(7.4, 0, 28.6);
  placeCompoundChild(scene, sidetable, OWNER, 'nook_sidetable');
  const stackOnSide = buildBookStack(4);
  stackOnSide.position.set(7.4, 0.52, 28.6);
  placeCompoundChild(scene, stackOnSide, OWNER, 'nook_book_stack');

  // Grandfather clock against the back-left wall
  const gClock = buildGrandfatherClock();
  gClock.position.set(-9.5, 0, 31);
  placeCompoundChild(scene, gClock, OWNER, 'grandfather_clock');
  pinClockHandsAt941(gClock);
  decoTickers.push((dt, now) => {
    const t = now * 0.001;
    if (gClock.userData.pendulum) gClock.userData.pendulum.rotation.z = Math.sin(t * 1.6) * 0.18;
  });

  // Librarian's cart with returned books, parked next to a shelf
  const cart = buildLibraryCart();
  cart.position.set(8, 0, 14);
  placeCompoundChild(scene, cart, OWNER, 'librarian_cart');

  // Hanging plant near the entrance
  const hang = buildPlantHanging();
  hang.position.set(-3, 3.4, 13);
  placeCompoundChild(scene, hang, OWNER, 'hanging_plant');

  // A stylised "QUIET" poster on the side wall.
  const tex = buildPosterTexture('QUIET', 'reading in progress', '#d4af37');
  const poster = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 2.0),
    new THREE.MeshBasicMaterial({ map: tex }),
  );
  poster.position.set(10.83, 2.2, 26);
  poster.rotation.y = -Math.PI / 2;
  placeCompoundChild(scene, poster, OWNER, 'poster_quiet');

  // Skirting along library walls
  const skirtMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.7 });
  let skirtIdx = 0;
  function skirting(length, x, z, rotY) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(length, 0.12, 0.04), skirtMat);
    m.position.set(x, 0.06, z);
    m.rotation.y = rotY;
    placeCompoundChild(scene, m, OWNER, `skirting_${skirtIdx++}`);
  }
  // back wall has the doorway gap so we use two segments
  skirting(8.5, -6.75, 32.95, 0);
  skirting(8.5,  6.75, 32.95, 0);
  skirting(22, -10.95, 22, Math.PI / 2);
  skirting(22,  10.95, 22, Math.PI / 2);
}

// PROP-10 — Kedash Protocol dressing for the CURRENT west-wing library
// (data/rooms.js id 'library', center [-22, -22]). decorateLibrary()
// above targets the legacy layout and is no longer wired into rooms
// data, so the anomaly props live in their own builder:
//   (a) a uniform row of identical BLANK spines on top of every shelf
//       unit — the archive above reach has no titles;
//   (b) a grandfather clock with its hands pinned at 9:41.
export function decorateLibraryAnomalies(scene, decoTickers) {
  // (a) Blank spines. Shelf-unit positions mirror the 18 'bookshelf'
  // entries in data/rooms.js (library) — the GLB unit, height-scaled to
  // 2.6 m, has a ~0.81 m-wide top, so the row is kept narrower than
  // that; it sits on the 2.6 m top so it never intersects the shelf.
  const COLS = [-28, -22, -16];
  const ROWS = [-28, -26, -24, -22, -20, -18];
  const w = 0.07, gapX = 0.013, h = 0.42, d = 0.26, rowWidth = 0.7;
  const perRow = Math.floor((rowWidth + gapX) / (w + gapX));
  const count = COLS.length * ROWS.length * perRow;
  const inst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(w, h, d),
    // One flat colour, zero jitter — uniformity IS the anomaly.
    new THREE.MeshStandardMaterial({ color: 0xcfc6b4, roughness: 0.85 }),
    count,
  );
  const m4 = new THREE.Matrix4();
  let i = 0;
  for (const cx of COLS) {
    for (const cz of ROWS) {
      for (let k = 0; k < perRow; k++) {
        m4.setPosition(cx - rowWidth / 2 + k * (w + gapX) + w / 2, 2.6 + h / 2, cz);
        inst.setMatrixAt(i++, m4);
      }
    }
  }
  inst.instanceMatrix.needsUpdate = true;
  placeCompoundChild(scene, inst, OWNER, 'blank_spines');

  // (b) Grandfather clock against the north wall, pinned at 9:41.
  // Pendulum still swings — the clock is alive, it just stopped counting.
  const gClock = buildGrandfatherClock();
  gClock.position.set(-29.2, 0, -32.4);
  placeCompoundChild(scene, gClock, OWNER, 'kedash_clock');
  pinClockHandsAt941(gClock);
  decoTickers.push((dt, now) => {
    if (gClock.userData.pendulum) {
      gClock.userData.pendulum.rotation.z = Math.sin(now * 0.0016) * 0.18;
    }
  });
}
