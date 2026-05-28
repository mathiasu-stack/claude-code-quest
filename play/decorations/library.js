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
  decoTickers.push((dt, now) => {
    const t = now * 0.001;
    if (gClock.userData.pendulum) gClock.userData.pendulum.rotation.z = Math.sin(t * 1.6) * 0.18;
    if (gClock.userData.minHand)  gClock.userData.minHand.rotation.y  = t * 0.5;
    if (gClock.userData.hourHand) gClock.userData.hourHand.rotation.y = t * 0.04;
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
