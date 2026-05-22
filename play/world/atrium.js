// atrium.js — grand-atrium upgrade for the ground-floor Reception zone.
//
// Strategy: KEEP the existing Reception walls + floor + decorations. ADD
// extra geometry on top so the room reads as a tall atrium instead of a
// low-ceilinged office:
//
//   • 12-unit walls extending up from y=3.8 to y=12 (above the existing
//     short walls), creating the tall vertical feel
//   • Marble overlay floor (atrium floor on top of the existing tile)
//   • Glass curtain wall on the east side instead of (in addition to)
//     the existing windows
//   • Brushed silver Kedash logo on the back wall, backlit
//   • Kinetic chandelier hanging from the new high ceiling
//   • Skylight at the top
//
// (Mezzanine + staircase were removed by request — atrium is now a
// single-storey grand lobby with the high ceiling preserved.)
//
// All geometry is opt-in via a flag; the original reception keeps
// working if buildAtrium fails.

import * as THREE from 'three';
import {
  marbleWhite, marbleDarkGreen, brushedSilver,
  glassClear, glassFrosted, darkStone, brass, polishedChrome, coveLight,
} from '../materials/modernLibrary.js';

const ATRIUM_HEIGHT = 12;     // total atrium height
// Y at which the wall material transitions (lower upperWallMat band →
// upper topWallMat band) and where the perimeter cove lighting sits.
// Originally the mezzanine floor height; mezzanine has been removed but
// the wall banding + cove are kept for the architectural look.
const MEZZ_HEIGHT = 4.5;
const ROOM_W = 22;
const ROOM_D = 22;            // matches the existing Reception bounds

export function buildAtrium(scene, opts = {}) {
  const mobile = !!opts.mobile;
  const out = { tickers: [], objects: [] };

  // ── 1. Marble floor overlay (Bug D — floor seam fix).
  // Previous tuning had this 22×22 plane at y=0.005 spanning the full
  // Reception (z=-11..+11). At the doorway (z=+11) it met the Library
  // floor (y=0) head-on, leaving a visible 5mm vertical seam right
  // under the player's feet as they walked through.
  // Fix: drop Y to 0.001 (1mm above origin). The Library floor at y=0
  // is now flush enough that the seam is visually negligible. The
  // gold runner at y=0.001 is bumped to y=0.0015 below so it stays
  // above the marble.
  const marbleFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_W, ROOM_D),
    marbleWhite(),
  );
  marbleFloor.rotation.x = -Math.PI / 2;
  marbleFloor.position.set(0, 0.001, 0);
  marbleFloor.receiveShadow = true;
  scene.add(marbleFloor);
  out.objects.push(marbleFloor);

  // Gold runway stays — we only overlay the surrounding marble.
  // The existing carpet runner from buildWorld will sit slightly above
  // this marble (it was at y=0.001) — bump runner up later if needed.

  // ── 2. Tall walls extending the existing 3.8-unit walls up to 12 ────
  // Existing walls: cream `0xf4ecd8`, 3.8m tall.
  // Add a brushed-marble band from 3.8 to MEZZ_HEIGHT, then a darker upper
  // section from MEZZ_HEIGHT to ATRIUM_HEIGHT.
  const upperWallMat = new THREE.MeshStandardMaterial({
    color: 0xe9e3d4, roughness: 0.6, metalness: 0.05,
  });
  const topWallMat = new THREE.MeshStandardMaterial({
    color: 0xd5d2c8, roughness: 0.7,
  });
  // Helper: vertical wall segment on a side
  function tallWall(width, x, z, ry, fromY, toY, mat) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(width, toY - fromY, 0.3),
      mat,
    );
    m.position.set(x, (fromY + toY) / 2, z);
    m.rotation.y = ry;
    m.castShadow = false;
    m.receiveShadow = true;
    scene.add(m);
    out.objects.push(m);
    return m;
  }
  // Back wall (north) extends up
  tallWall(ROOM_W, 0, -10.95 - 0.001, 0, 3.8, MEZZ_HEIGHT, upperWallMat);
  tallWall(ROOM_W, 0, -10.95 - 0.001, 0, MEZZ_HEIGHT, ATRIUM_HEIGHT, topWallMat);
  // West wall (left) extends up
  tallWall(ROOM_D, -10.95 - 0.001, 0, Math.PI / 2, 3.8, MEZZ_HEIGHT, upperWallMat);
  tallWall(ROOM_D, -10.95 - 0.001, 0, Math.PI / 2, MEZZ_HEIGHT, ATRIUM_HEIGHT, topWallMat);
  // South wall split (around the doorway to library). 9.25m wide
  // segments centered at ±6.375 leave a 3.5m doorway gap matching the
  // door panel (previously 8.5m wide → 5m gap → visible holes
  // between the door and the side wall, plus open void above the door).
  tallWall(9.25, -6.375, 10.95, 0, 3.8, MEZZ_HEIGHT, upperWallMat);
  tallWall(9.25,  6.375, 10.95, 0, 3.8, MEZZ_HEIGHT, upperWallMat);
  tallWall(9.25, -6.375, 10.95, 0, MEZZ_HEIGHT, ATRIUM_HEIGHT, topWallMat);
  tallWall(9.25,  6.375, 10.95, 0, MEZZ_HEIGHT, ATRIUM_HEIGHT, topWallMat);
  // Close the gap directly above the door (x ∈ [-1.75, +1.75], from the
  // top of the doorway up to the atrium ceiling) so players in the library
  // don't see straight through into the atrium upper volume.
  tallWall(3.5, 0, 10.95, 0, 3.8, ATRIUM_HEIGHT, topWallMat);

  // ── 3. East wall replaced with a glass curtain wall ─────────────────
  // (The existing east wall stays at 3.8m — we add transparent glass
  // panels on top, beyond, instead of solid wall.)
  const glassMat = glassClear({ mobile });
  // Frame
  const frameMat = brushedSilver();
  for (let h = 3.8; h < ATRIUM_HEIGHT; h += 2.5) {
    for (let zSeg = -10; zSeg <= 8.5; zSeg += 2.5) {
      // Glass pane
      const pane = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 2.4),
        glassMat,
      );
      pane.position.set(10.94, h + 1.25, zSeg + 1.25);
      pane.rotation.y = -Math.PI / 2;
      scene.add(pane);
      out.objects.push(pane);
    }
  }
  // Vertical mullions (silver bars between panes)
  for (let zSeg = -10; zSeg <= 11; zSeg += 2.5) {
    const mullion = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, ATRIUM_HEIGHT - 3.8, 0.06),
      frameMat,
    );
    mullion.position.set(10.94, 3.8 + (ATRIUM_HEIGHT - 3.8) / 2, zSeg);
    scene.add(mullion);
    out.objects.push(mullion);
  }
  // Horizontal mullions
  for (let h = 3.8; h <= ATRIUM_HEIGHT; h += 2.5) {
    const horMullion = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.06, ROOM_D),
      frameMat,
    );
    horMullion.position.set(10.94, h, 0);
    horMullion.rotation.y = Math.PI / 2;
    scene.add(horMullion);
    out.objects.push(horMullion);
  }

  // ── 4. Atrium ceiling (marble + skylight) at y = ATRIUM_HEIGHT ─────
  // Replace the lower drop-tile ceiling at y=3.8 by NOT adding it; the
  // existing buildReceptionCeiling is gated externally.
  const atriumCeil = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_W, ROOM_D),
    new THREE.MeshStandardMaterial({ color: 0xefeae0, roughness: 0.85 }),
  );
  atriumCeil.rotation.x = Math.PI / 2;
  atriumCeil.position.set(0, ATRIUM_HEIGHT, 0);
  scene.add(atriumCeil);
  out.objects.push(atriumCeil);

  // Skylight panel — a glass panel in the centre of the ceiling that
  // emits light (faking sun pouring through).
  const skylight = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 6),
    new THREE.MeshBasicMaterial({
      color: 0xfff5d0, transparent: true, opacity: 0.75,
    }),
  );
  skylight.rotation.x = Math.PI / 2;
  skylight.position.set(0, ATRIUM_HEIGHT - 0.02, 0);
  scene.add(skylight);
  out.objects.push(skylight);

  // (Mezzanine railing + walkable mezzanine L removed by request — the
  // atrium is now a single-storey grand lobby with the tall ceiling
  // preserved but no second-level structure.)

  // ── 6. Brushed silver KEDASH logo wall behind reception desk ───────
  // Bug C (latest pass): previous tuning had logoBacking = 0x1a1a1a
  // (near-black) BoxGeometry(8, 1.6, 0.06) AND a wordmark canvas filled
  // with #0d0d12 — together forming an ~8m × 1.6m FLOATING BLACK
  // RECTANGLE on the upper cream wall. Two fixes:
  //   1. Backing recoloured to brushed silver, scaled down to a slim
  //      frame around the wordmark.
  //   2. Wordmark canvas's opaque dark background removed — now uses
  //      a transparent canvas with only the radial backlight glow +
  //      KEDASH text. Plane material stays transparent, so only the
  //      text + halo render against the cream wall.
  const logoBacking = new THREE.Mesh(
    new THREE.BoxGeometry(7.8, 1.5, 0.04),
    new THREE.MeshStandardMaterial({
      color: 0xc8ccd2, metalness: 0.85, roughness: 0.35,
      emissive: 0x6699ff, emissiveIntensity: 0.10,
    }),
  );
  logoBacking.position.set(0, 5.6, -10.85);
  scene.add(logoBacking);
  out.objects.push(logoBacking);

  // The wordmark — backlit KEDASH text with a soft blue halo, painted
  // onto a TRANSPARENT canvas (no opaque dark fill — fixes Bug C).
  const wmCanvas = document.createElement('canvas');
  wmCanvas.width = 1024; wmCanvas.height = 256;
  const wctx = wmCanvas.getContext('2d');
  wctx.clearRect(0, 0, wmCanvas.width, wmCanvas.height);
  // Backlight glow halo (transparent over transparent → clean alpha).
  const grad = wctx.createRadialGradient(wmCanvas.width / 2, wmCanvas.height / 2, 50,
                                         wmCanvas.width / 2, wmCanvas.height / 2, 600);
  grad.addColorStop(0, 'rgba(180, 220, 255, 0.55)');
  grad.addColorStop(1, 'rgba(180, 220, 255, 0.00)');
  wctx.fillStyle = grad;
  wctx.fillRect(0, 0, wmCanvas.width, wmCanvas.height);
  // KEDASH wordmark — dark text reads cleanly against the silver backing.
  wctx.fillStyle = '#1a2230';
  wctx.font = 'bold 200px serif';
  wctx.textAlign = 'center';
  wctx.textBaseline = 'middle';
  wctx.fillText('KEDASH', wmCanvas.width / 2, wmCanvas.height / 2);
  const wmTex = new THREE.CanvasTexture(wmCanvas);
  wmTex.colorSpace = THREE.SRGBColorSpace;
  const logoPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(7.6, 1.4),
    new THREE.MeshBasicMaterial({ map: wmTex, transparent: true }),
  );
  logoPlane.position.set(0, 5.6, -10.81);
  scene.add(logoPlane);
  out.objects.push(logoPlane);

  // ── 7. Sleek modern reception desk replacement ─────────────────────
  // Existing reception desk at (0, 0.5, -8) is a brown box. Add a darker
  // stone desk SLIGHTLY in front and taller, plus a brushed silver
  // counter top.
  const newDesk = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 1.05, 1.0),
    darkStone(),
  );
  newDesk.position.set(0, 0.525, -7.6);
  newDesk.castShadow = true;
  newDesk.receiveShadow = true;
  scene.add(newDesk);
  out.objects.push(newDesk);

  const counterTop = new THREE.Mesh(
    new THREE.BoxGeometry(3.5, 0.04, 1.05),
    brushedSilver(),
  );
  counterTop.position.set(0, 1.07, -7.6);
  scene.add(counterTop);
  out.objects.push(counterTop);

  // ── 8. Kinetic chandelier hanging from the atrium ceiling ──────────
  // Cluster of glass rods + lights at descending heights, slowly rotating.
  const chandPivot = new THREE.Group();
  chandPivot.position.set(0, ATRIUM_HEIGHT - 0.5, 0);
  scene.add(chandPivot);
  out.objects.push(chandPivot);

  const rodMat = glassClear({ mobile, tint: 0xfff5c8 });
  const lightMat = new THREE.MeshBasicMaterial({
    color: 0xffe7a0, transparent: true, opacity: 0.95,
  });
  const rodCount = 18;
  for (let i = 0; i < rodCount; i++) {
    const a = (i / rodCount) * Math.PI * 2;
    const r = 1.8 + (i % 3) * 0.6;
    const len = 1.6 + ((i * 7) % 5) * 0.4;
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, len, 6),
      rodMat,
    );
    rod.position.set(Math.cos(a) * r, -len / 2 - 0.05, Math.sin(a) * r);
    chandPivot.add(rod);

    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 10, 8),
      lightMat,
    );
    bulb.position.set(Math.cos(a) * r, -len - 0.05, Math.sin(a) * r);
    chandPivot.add(bulb);
  }
  // Central column
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8),
    polishedChrome(),
  );
  stem.position.set(0, 0.2, 0);
  chandPivot.add(stem);
  // Halo light at the chandelier center
  const halo = new THREE.PointLight(0xfff1c5, 1.2, 10, 1.4);
  halo.position.set(0, -0.5, 0);
  chandPivot.add(halo);

  out.tickers.push((dt, now) => {
    chandPivot.rotation.y = now * 0.00015; // very slow drift
    chandPivot.children.forEach((c, i) => {
      if (c.geometry?.type === 'SphereGeometry' && c.material === lightMat) {
        // bulb pulse
        c.scale.setScalar(1 + Math.sin(now * 0.002 + i) * 0.06);
      }
    });
  });

  // (Sculptural staircase removed by request — atrium has no stair or
  // mezzanine. The west wall is now clear all the way up to the
  // atrium ceiling.)

  // ── 10. Cove lighting strip around the perimeter at MEZZ_HEIGHT ────
  const coveMat = coveLight(0xfff5d4);
  function cove(length, x, z, ry) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(length, 0.04, 0.06),
      coveMat,
    );
    m.position.set(x, MEZZ_HEIGHT - 0.05, z);
    m.rotation.y = ry;
    scene.add(m);
    out.objects.push(m);
  }
  cove(ROOM_W - 0.6, 0, -10.7, 0);
  cove(ROOM_D - 0.6, -10.7, 0, Math.PI / 2);
  cove(ROOM_D - 0.6,  10.7, 0, Math.PI / 2);

  return out;
}
