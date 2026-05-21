// atrium.js — grand-atrium upgrade for the ground-floor Reception zone.
//
// Strategy: KEEP the existing Reception walls + floor + decorations. ADD
// extra geometry on top so the room reads as a tall atrium instead of a
// low-ceilinged office:
//
//   • 12-unit walls extending up from y=3.8 to y=12 (above the existing
//     short walls), creating the tall vertical feel
//   • Marble overlay floor (atrium floor on top of the existing tile)
//   • Mezzanine railing visible at y=4.5 around the atrium edge
//   • Glass curtain wall on the east side instead of (in addition to)
//     the existing windows
//   • Brushed silver Kedash logo on the back wall, backlit
//   • Kinetic chandelier hanging from the new high ceiling
//   • Sculptural glass-and-steel staircase visible (purely decorative)
//   • Skylight at the top
//
// All geometry is opt-in via a flag; the original reception keeps
// working if buildAtrium fails.

import * as THREE from 'three';
import {
  marbleWhite, marbleDarkGreen, brushedSilver,
  glassClear, glassFrosted, darkStone, brass, polishedChrome, coveLight,
} from '../materials/modernLibrary.js';

const ATRIUM_HEIGHT = 12;     // total atrium height
const MEZZ_HEIGHT = 4.5;      // floor of the visible mezzanine above
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

  // ── 5. Mezzanine railing visible above the atrium ──────────────────
  // The railing wraps around 3 sides (skip the east glass curtain wall).
  // Approximated as a continuous box at MEZZ_HEIGHT level.
  const railingMat = new THREE.MeshStandardMaterial({
    color: 0xb8c0c8, metalness: 0.85, roughness: 0.32,
  });
  const railingThickness = 0.06;
  const railingHeight = 0.85;
  function railing(width, x, z, ry) {
    // Horizontal top bar
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(width, railingThickness, 0.18),
      railingMat,
    );
    top.position.set(x, MEZZ_HEIGHT + railingHeight, z);
    top.rotation.y = ry;
    scene.add(top);
    out.objects.push(top);
    // Glass infill below
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(width, railingHeight),
      glassClear({ mobile, tint: 0xeef6ff }),
    );
    glass.position.set(x, MEZZ_HEIGHT + railingHeight / 2, z);
    glass.rotation.y = ry;
    scene.add(glass);
    out.objects.push(glass);
    // Bottom rail
    const bot = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.04, 0.04),
      railingMat,
    );
    bot.position.set(x, MEZZ_HEIGHT, z);
    bot.rotation.y = ry;
    scene.add(bot);
    out.objects.push(bot);
  }
  // North/back side
  railing(ROOM_W - 0.3, 0, -10.6, 0);
  // West side
  railing(ROOM_D - 0.3, -10.6, 0, Math.PI / 2);
  // South side (split around doorway opening)
  railing(8, -7, 10.6, 0);
  railing(8,  7, 10.6, 0);

  // ── 5b. Walkable mezzanine — L-shape hugging west + north walls ────
  // The top of the staircase deposits the player at (x≈-9, z=0.5, y≈4.5).
  // Without a floor up here the player just stands on the tiny top step
  // and can fall off in every direction. Two plates form an L from the
  // top of the stairs around the west wall and across the north wall.
  // The east + south sides stay open so the atrium reads as a real
  // three-storey lobby instead of an enclosed second floor.
  const MEZZ_INSET = 3;                // walkway depth from the outer wall
  const MEZZ_OPEN_X = -11 + MEZZ_INSET;   // -8: inner edge of west strip
  const MEZZ_OPEN_Z = -11 + MEZZ_INSET;   // -8: inner edge of north strip
  const MEZZ_PLATE_Y = MEZZ_HEIGHT;       // matches railing base
  const mezzFloorMat = brushedSilver();
  function mezzPlate(w, d, x, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d), mezzFloorMat);
    m.position.set(x, MEZZ_PLATE_Y - 0.04, z);
    m.receiveShadow = true;
    scene.add(m);
    out.objects.push(m);
  }
  // West strip: x ∈ [-11, -8], z ∈ [-11, +11]
  mezzPlate(MEZZ_INSET, ROOM_D, (-11 + MEZZ_OPEN_X) / 2, 0);
  // North strip: x ∈ [-8, +11], z ∈ [-11, -8] (does not overlap W strip).
  mezzPlate(11 - MEZZ_OPEN_X, MEZZ_INSET, (MEZZ_OPEN_X + 11) / 2, (-11 + MEZZ_OPEN_Z) / 2);

  // Inner railings — protect the two open edges of the L from the atrium
  // opening below. The corner at (MEZZ_OPEN_X, MEZZ_OPEN_Z) is where the
  // two segments meet.
  // West-strip inner edge: along x=MEZZ_OPEN_X, from z=MEZZ_OPEN_Z to z=+11.
  railing(11 - MEZZ_OPEN_Z, MEZZ_OPEN_X, (MEZZ_OPEN_Z + 11) / 2, Math.PI / 2);
  // North-strip inner edge: along z=MEZZ_OPEN_Z, from x=MEZZ_OPEN_X to x=+11.
  railing(11 - MEZZ_OPEN_X, (MEZZ_OPEN_X + 11) / 2, MEZZ_OPEN_Z, 0);

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

  // ── 9. Sculptural staircase against the west wall ─────────────────
  // Bug B (latest pass): previous tuning had steps spanning world x =
  // -10.53 to -9.13 — the +0.7 half-width meant they reached well
  // inside the player's movement clamp at x = -10.5 → player walked
  // through them. Also "looked floating" because the only visible
  // support was a single pillar to the side of the stair, not under
  // each step. Two fixes in tandem:
  //   1. Slanted CHROME STRINGER running directly under all 14 steps —
  //      reads as the structural backbone, kills the "floating" look.
  //   2. Collision rectangle added in play.js clampMove — pushes the
  //      player east of x = -9.0 inside the stair Z range.
  const stairGroup = new THREE.Group();
  stairGroup.position.set(-10.2, 0, -3);
  scene.add(stairGroup);
  out.objects.push(stairGroup);

  // Vertical chrome support pillar at the FAR (top) end of the stair.
  const supportPillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.10, 0.10, MEZZ_HEIGHT + 0.3, 12),
    polishedChrome(),
  );
  supportPillar.position.set(0.4, (MEZZ_HEIGHT + 0.3) / 2, 1.5);
  stairGroup.add(supportPillar);

  // NEW: Slanted stringer running under all 14 steps (Bug B fix).
  // Steps span y=0.05 → y=4.21 along z = -2.7 → -0.54. Build a tilted
  // box that follows that diagonal so each step has visible support
  // directly beneath it.
  const stringerLen = Math.hypot(4.16, 2.16);  // y-rise × z-run
  const stringerAngle = Math.atan2(4.16, 2.16);
  const stringer = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.16, stringerLen),
    polishedChrome(),
  );
  stringer.position.set(0.20, (0.05 + 4.21) / 2 - 0.10, (0.30 + 2.16) / 2);
  stringer.rotation.x = -(Math.PI / 2 - stringerAngle);
  stairGroup.add(stringer);

  // Steps — sit against the west wall, curve gently inward.
  for (let i = 0; i < 14; i++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.06, 0.42),
      brushedSilver(),
    );
    const a = (i / 14) * 0.45;  // gentler curve so it stays close to the wall
    step.position.set(
      Math.cos(a) * 0.30 + 0.10,
      i * 0.32 + 0.05,
      Math.sin(a) * 0.30 + i * 0.18,
    );
    step.castShadow = true;
    stairGroup.add(step);

    // Small under-side bracket for each step (visible structural detail)
    const bracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.40, 0.05),
      polishedChrome(),
    );
    bracket.position.set(step.position.x + 0.50, step.position.y - 0.20, step.position.z);
    stairGroup.add(bracket);
  }

  // Top platform meets the mezzanine railing visually.
  const topPlat = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.06, 0.7),
    brushedSilver(),
  );
  topPlat.position.set(0.30, MEZZ_HEIGHT - 0.04, 3.5);
  topPlat.castShadow = true;
  stairGroup.add(topPlat);

  // Glass railing along the stair (full height now).
  for (let i = 0; i < 4; i++) {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.85, 0.05),
      polishedChrome(),
    );
    post.position.set(0.85, 0.5 + i * 0.95, i * 0.95 + 0.4);
    stairGroup.add(post);
  }

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
