// play/world/furniture.js — procedural / GLB-backed office furniture.
//
// Extracted from play/play.js (2026-11-25, first seam of the play.js split
// recommended in docs/review-2026-11.md). Pure builders: each returns a
// THREE.Group and touches no scene, collider or session state, so the
// rooms loader (via play.js registerRoomBuilders) and floor builders can
// share them. Import paths match play.js exactly — a different ?v= on
// decorationAssets.js would fork its GLB cache (audit layout::4.5).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { makeDecoration } from '../decorations/decorationAssets.js?v=20260528j';
import { isLowGraphics } from '../lighting/quality.js';

// ─── Decor builders ──────────────────────────────────────────────────────────
// Chamfered box — a drop-in for THREE.BoxGeometry that softens the edges so
// they catch a highlight (no real edge is perfectly sharp — the #1 "Roblox"
// tell). Same w/h/d as a box, so proportions and collider footprints are
// unchanged. 1 segment = a flat 45° chamfer (cheap); radius auto-clamped to
// thin pieces. Used by the procedural furniture fallbacks + architectural trim.
export function bevelBox(w, h, d, radius) {
  const r = radius != null ? radius : Math.min(0.03, Math.min(w, h, d) * 0.22);
  if (r <= 0.004) return new THREE.BoxGeometry(w, h, d);
  return new RoundedBoxGeometry(w, h, d, 1, r);
}

export function buildChair(x, z, ry = 0, color = 0x37474f) {
  const glb = makeDecoration('chair', { width: 0.6, depth: 0.6, height: 1.1 });
  if (glb) {
    glb.position.set(x, 0, z); glb.rotation.y = ry;
    glb.userData.surface = 'floor';
    return glb;
  }
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color });
  const seat = new THREE.Mesh(bevelBox(0.6, 0.1, 0.6), mat);
  seat.position.y = 0.5; seat.castShadow = true; g.add(seat);
  const back = new THREE.Mesh(bevelBox(0.6, 0.7, 0.1), mat);
  back.position.set(0, 0.85, -0.25); g.add(back);
  const legGeom = new THREE.BoxGeometry(0.06, 0.5, 0.06);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  [[-0.25,-0.25],[0.25,-0.25],[-0.25,0.25],[0.25,0.25]].forEach(([lx,lz]) => {
    const l = new THREE.Mesh(legGeom, legMat);
    l.position.set(lx, 0.25, lz); g.add(l);
  });
  g.position.set(x, 0, z); g.rotation.y = ry;
  g.userData.surface = 'floor';
  return g;
}

// ── Contact shadows ──────────────────────────────────────────────────
// One shared 64px radial-gradient canvas texture; each furniture
// builder drops a small transparent plane under itself so big props
// feel grounded even where the directional shadow map doesn't reach
// (and on mobile, where shadows are reduced). Cost: 1 texture total +
// 1 tiny transparent quad per prop.
let _contactShadowTex = null;
export function contactShadowTexture() {
  if (_contactShadowTex) return _contactShadowTex;
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
  grad.addColorStop(0, 'rgba(0,0,0,0.85)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.38)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  _contactShadowTex = new THREE.CanvasTexture(c);
  return _contactShadowTex;
}
// Parents a shadow quad to `node` (whose origin must sit on the floor).
export function addContactShadow(node, w = 1.6, d = 1.0, opacity = 0.3) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({
      map: contactShadowTexture(), transparent: true, opacity,
      depthWrite: false,
    }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.012; // above floor plates + the reception tile decal
  m.renderOrder = 1;
  m.userData._contactShadow = true;
  node.add(m);
  return node;
}

export function buildDesk(x, z, ry = 0, w = 1.6, d = 0.8, color = 0x6b4f3a) {
  // stretch:true honours width/depth/height EXACTLY (non-uniform scale),
  // instead of the uniform-fit default which picks the SMALLEST scale
  // ratio across axes. The desk GLB's natural proportions are taller
  // than the requested 0.78m, so uniform fit was shrinking the desk
  // down to ~50% of the requested width/depth — the "tiny desk vs
  // character" symptom. Stretching slightly distorts the model but
  // gives a desk that visibly matches a 1.85m character at the right
  // height (top at 0.78, surface at waist-ish).
  const glb = makeDecoration('desk', { width: w, depth: d, height: 0.78, stretch: true });
  if (glb) {
    glb.position.set(x, 0, z); glb.rotation.y = ry;
    glb.userData.surface = 'floor';
    return addContactShadow(glb, w + 0.5, d + 0.5);
  }
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color });
  const top = new THREE.Mesh(bevelBox(w, 0.06, d), mat);
  top.position.y = 0.78; top.castShadow = true; top.receiveShadow = true; g.add(top);
  const legGeom = new THREE.BoxGeometry(0.08, 0.78, 0.08);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x3e2723 });
  const dx = w / 2 - 0.1, dz = d / 2 - 0.1;
  [[-dx,-dz],[dx,-dz],[-dx,dz],[dx,dz]].forEach(([lx,lz]) => {
    const l = new THREE.Mesh(legGeom, legMat);
    l.position.set(lx, 0.39, lz); g.add(l);
  });
  g.position.set(x, 0, z); g.rotation.y = ry;
  g.userData.surface = 'floor';
  return addContactShadow(g, w + 0.5, d + 0.5);
}

export function buildMonitor(x, z, ry = 0, screenColor = 0x4fc3f7) {
  const glb = makeDecoration('monitor', { width: 0.6, height: 0.55, depth: 0.2 });
  if (glb) {
    glb.position.set(x, 0.78, z);   // sits on top of desk (desks ~0.78 tall)
    glb.rotation.y = ry;
    // Apply the per-call screen color tint to any emissive sub-mesh so
    // the existing colour-coding pattern (Marcus blue, Aisha orange…)
    // still reads.
    glb.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        const m = obj.material;
        if (m.emissive && m.emissive.getHex() !== 0) {
          m.emissive = new THREE.Color(screenColor);
          m.emissiveIntensity = 0.5;
        }
      }
    });
    glb.userData.surface = 'top';
    return glb;
  }
  const g = new THREE.Group();
  // Glossy plastic stand + bezel
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, 0.2, 12),
    new THREE.MeshStandardMaterial({ color: 0x222, metalness: 0.4, roughness: 0.4 }));
  stand.position.y = 0.88; g.add(stand);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x111, metalness: 0.55, roughness: 0.4 }));
  back.position.y = 1.2; g.add(back);
  // Screen — emissive so it reads as "on" without lights, slightly toned down
  // by the post-fx bloom in the composer.
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4),
    new THREE.MeshStandardMaterial({
      color: screenColor, emissive: screenColor, emissiveIntensity: 0.7,
      roughness: 0.4, metalness: 0,
    }));
  screen.position.set(0, 1.2, 0.026); g.add(screen);
  g.position.set(x, 0, z); g.rotation.y = ry;
  g.userData.surface = 'top'; // sits on the desk top below it
  return g;
}

export function buildPlant(x, z) {
  const glb = makeDecoration('plant', { width: 0.7, height: 1.4, depth: 0.7 });
  if (glb) {
    glb.position.set(x, 0, z);
    glb.userData.surface = 'floor';
    return glb;
  }
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.25, 14),
    new THREE.MeshStandardMaterial({ color: 0x6d4c41 }));
  pot.position.y = 0.13; pot.castShadow = true; g.add(pot);
  const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x2e7d32 }));
  leaves.position.y = 0.55; leaves.castShadow = true;
  leaves.scale.set(1, 1.1, 1); g.add(leaves);
  g.position.set(x, 0, z);
  g.userData.surface = 'floor';
  return g;
}

export function buildWaterCooler(x, z) {
  const glb = makeDecoration('water_cooler', { width: 0.45, height: 1.4, depth: 0.45 });
  if (glb) {
    glb.position.set(x, 0, z);
    glb.userData.surface = 'floor';
    return glb;
  }
  const g = new THREE.Group();
  // Base reads as smooth painted plastic
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.4),
    new THREE.MeshStandardMaterial({ color: 0xeceff1, metalness: 0.45, roughness: 0.4 }));
  base.position.y = 0.4; base.castShadow = true; g.add(base);
  // Glass-like bottle (transmission too expensive for mobile, fake with low opacity)
  const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.45, 16),
    new THREE.MeshStandardMaterial({
      color: 0x80d8ff, metalness: 0.2, roughness: 0.05,
      transparent: true, opacity: 0.6,
    }));
  bottle.position.y = 1.05; g.add(bottle);
  g.position.set(x, 0, z);
  g.userData.surface = 'floor';
  return g;
}

export function buildCouch(x, z, ry = 0) {
  const glb = makeDecoration('couch', { width: 2.2, depth: 0.9, height: 0.95 });
  if (glb) {
    glb.position.set(x, 0, z); glb.rotation.y = ry;
    glb.userData.surface = 'floor';
    return addContactShadow(glb, 2.8, 1.4);
  }
  const g = new THREE.Group();
  // Fabric — high roughness, no metalness.
  const mat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.95 });
  const seat = new THREE.Mesh(bevelBox(2.2, 0.4, 0.8), mat);
  seat.position.y = 0.4; seat.castShadow = true; g.add(seat);
  const back = new THREE.Mesh(bevelBox(2.2, 0.7, 0.2), mat);
  back.position.set(0, 0.75, -0.3); g.add(back);
  const armGeom = bevelBox(0.2, 0.6, 0.8);
  const lA = new THREE.Mesh(armGeom, mat); lA.position.set(-1.1, 0.55, 0); g.add(lA);
  const rA = new THREE.Mesh(armGeom, mat); rA.position.set(1.1, 0.55, 0); g.add(rA);
  g.position.set(x, 0, z); g.rotation.y = ry;
  g.userData.surface = 'floor';
  return addContactShadow(g, 2.8, 1.4);
}

export function buildFilingCabinet(x, z, ry = 0) {
  const glb = makeDecoration('cabinet', { width: 0.6, height: 1.4, depth: 0.5 });
  if (glb) {
    glb.position.set(x, 0, z); glb.rotation.y = ry;
    glb.userData.surface = 'floor';
    return glb;
  }
  const g = new THREE.Group();
  // Painted metal — moderate metalness so it catches the directional.
  const mat = new THREE.MeshStandardMaterial({ color: 0x90a4ae, metalness: 0.6, roughness: 0.45 });
  const body = new THREE.Mesh(bevelBox(0.6, 1.4, 0.5), mat);
  body.position.y = 0.7; body.castShadow = true; g.add(body);
  // drawer lines
  for (let i = 0; i < 3; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.01),
      new THREE.MeshStandardMaterial({ color: 0x37474f }));
    line.position.set(0, 0.3 + i * 0.4, 0.255); g.add(line);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x37474f }));
    handle.position.set(0, 0.3 + i * 0.4 - 0.05, 0.27); g.add(handle);
  }
  g.position.set(x, 0, z); g.rotation.y = ry;
  g.userData.surface = 'floor';
  return g;
}

export function buildBookshelf(x, z, ry = 0, w = 2.2) {
  // Height-only scale. The GLB's natural footprint (~0.63 × 0.85 m) is
  // much deeper than the old procedural 0.45 m — passing depth:0.45 let
  // it win makeDecoration's uniform min() and shrank the whole unit to
  // ~1.06 m (waist-high shelves, with the blank-spine anomaly rows
  // floating at the assumed 2.6 m top).
  const glb = makeDecoration('bookshelf', { height: 2.6 });
  if (glb) {
    glb.position.set(x, 0, z); glb.rotation.y = ry;
    glb.userData.surface = 'floor';
    return glb;
  }
  const g = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x4e342e });
  const back = new THREE.Mesh(new THREE.BoxGeometry(w, 2.6, 0.05), woodMat);
  back.position.set(0, 1.3, -0.18); g.add(back);
  const sides = new THREE.BoxGeometry(0.08, 2.6, 0.4);
  const left = new THREE.Mesh(sides, woodMat); left.position.set(-w/2, 1.3, 0); g.add(left);
  const right = new THREE.Mesh(sides, woodMat); right.position.set(w/2, 1.3, 0); g.add(right);
  for (let i = 0; i < 4; i++) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, 0.4), woodMat);
    shelf.position.set(0, 0.4 + i * 0.65, 0); g.add(shelf);
    // books
    const colors = [0xb71c1c, 0x1a237e, 0x33691e, 0xff6f00, 0x4a148c, 0x004d40];
    let bx = -w/2 + 0.15;
    while (bx < w/2 - 0.1) {
      const bw = 0.06 + Math.random() * 0.06;
      const bh = 0.35 + Math.random() * 0.18;
      const book = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.25),
        new THREE.MeshStandardMaterial({ color: colors[Math.floor(Math.random() * colors.length)] }));
      book.position.set(bx + bw/2, 0.4 + i * 0.65 + bh/2 + 0.02, 0);
      g.add(book);
      bx += bw + 0.005;
    }
  }
  g.position.set(x, 0, z); g.rotation.y = ry;
  g.userData.surface = 'floor';
  return g;
}

// Library checkout counter — deliberately NOT the reception_desk GLB
// (the library should read as its own space): dark walnut body with
// inset panels, a card-catalog drawer bank, brass desk bell and a
// stack of returned books. Front face is +z (faces the entrance door).
export function buildLibraryCounter(x, z, ry = 0) {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 });
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.85 });
  const topMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.55 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.35 });

  const base = new THREE.Mesh(bevelBox(3.0, 0.95, 0.65), wood);
  base.position.y = 0.475; base.castShadow = true; g.add(base);
  const top = new THREE.Mesh(bevelBox(3.2, 0.06, 0.85), topMat);
  top.position.y = 0.98; top.castShadow = true; g.add(top);

  // Two inset front panels (left + center); the right section is a
  // card-catalog drawer bank.
  for (let i = -1; i <= 0; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.6, 0.03), panelMat);
    p.position.set(i * 0.95, 0.5, 0.33);
    g.add(p);
  }
  const drawerMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.75 });
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.26, 0.04), drawerMat);
      d.position.set(0.74 + c * 0.42, 0.36 + r * 0.3, 0.33);
      g.add(d);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), brass);
      knob.position.set(0.74 + c * 0.42, 0.36 + r * 0.3, 0.36);
      g.add(knob);
    }
  }

  // Brass desk bell on the counter top.
  const bellBase = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.02, 16), brass);
  bellBase.position.set(1.2, 1.02, 0.15); g.add(bellBase);
  const bellDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), brass);
  bellDome.position.set(1.2, 1.03, 0.15); g.add(bellDome);

  // Small stack of returned books.
  const bookCols = [0xb71c1c, 0x1a237e, 0x33691e];
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Mesh(
      new THREE.BoxGeometry(0.34 - i * 0.03, 0.05, 0.24),
      new THREE.MeshStandardMaterial({ color: bookCols[i], roughness: 0.7 }));
    b.position.set(-1.1, 1.04 + i * 0.05, -0.1);
    b.rotation.y = (i % 2) * 0.18;
    g.add(b);
  }

  g.position.set(x, 0, z); g.rotation.y = ry;
  g.userData.surface = 'floor';
  return g;
}

export function buildTable(x, z, ry = 0, w = 2.2) {
  const glb = makeDecoration('table', { width: w, depth: 1.2, height: 0.78 });
  if (glb) {
    glb.position.set(x, 0, z); glb.rotation.y = ry;
    glb.userData.surface = 'floor';
    return addContactShadow(glb, w + 0.5, 1.7);
  }
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x6d4c41 });
  const top = new THREE.Mesh(bevelBox(w, 0.06, 1.2), mat);
  top.position.y = 0.78; top.castShadow = true; top.receiveShadow = true; g.add(top);
  const legGeom = new THREE.BoxGeometry(0.08, 0.78, 0.08);
  [[-w/2+0.1,-0.5],[w/2-0.1,-0.5],[-w/2+0.1,0.5],[w/2-0.1,0.5]].forEach(([lx,lz]) => {
    const l = new THREE.Mesh(legGeom, mat); l.position.set(lx, 0.39, lz); g.add(l);
  });
  // a stack of books on the table
  const book = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.16),
    new THREE.MeshStandardMaterial({ color: 0xb71c1c }));
  book.position.set(0, 0.83, 0); g.add(book);
  const book2 = book.clone();
  book2.material = new THREE.MeshStandardMaterial({ color: 0x004d40 });
  book2.position.y = 0.87; g.add(book2);
  g.position.set(x, 0, z); g.rotation.y = ry;
  g.userData.surface = 'floor';
  return addContactShadow(g, w + 0.5, 1.7);
}

export function buildLamp(x, z, opts = {}, y = null) {
  // `y` is the lamp BASE height from the rooms data (pos[1]). It MUST be
  // honoured so the in-game editor can place the lamp on a table and have
  // the change survive a reload — the old code dropped pos[1] entirely
  // and hard-pinned the table lamp to y=0.78, so every editor move was
  // silently reverted. A table lamp with no explicit Y still defaults to
  // table-top height; a floor lamp defaults to the floor.
  const hasY = (typeof y === 'number' && y > 0.01);
  // Floor-standing variant — its geometry is a tall pole + shade, base at
  // the group origin, so the group sits directly at the data Y (or the
  // floor). Rooms entries opt in via args: { floor: true }.
  if (opts.floor) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.4, roughness: 0.5 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.04, 16), mat);
    base.position.y = 0.02; base.castShadow = true; g.add(base);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.42, 8), mat);
    pole.position.y = 0.75; g.add(pole);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.28, 14, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xfff59d, emissive: 0x6d5a1f, side: THREE.DoubleSide }));
    shade.position.y = 1.52; g.add(shade);
    const point = new THREE.PointLight(0xfff59d, 0.7, 6);
    point.position.set(0, 1.42, 0); g.add(point);
    g.position.set(x, hasY ? y : 0, z);
    g.userData.surface = 'floor';
    return g;
  }
  // Table lamp — its GLB origin is at the lamp base, so the group sits at
  // the data Y (where the lamp base should rest, e.g. a table top ~0.78),
  // defaulting to 0.78 when the data leaves Y at 0.
  //
  // LOW GRAPHICS: skip the PointLight entirely (point lights are the single
  // biggest per-fragment cost on weak GPUs) and compensate by boosting
  // emissive on the shade so the lamp still reads as "on". Keyed to the
  // quality tier rather than to touch input — an integrated-GPU laptop pays
  // this cost just as dearly as a phone does.
  const baseY = hasY ? y : 0.78;
  const mob = isLowGraphics();
  const glb = makeDecoration('table_lamp', { width: 0.35, height: 0.55, depth: 0.35 });
  if (glb) {
    glb.position.set(x, baseY, z);
    if (mob) {
      // Light-colored sub-meshes are the shade; make them glow.
      glb.traverse((o) => {
        if (o.isMesh && o.material && o.material.emissive !== undefined && o.material.color) {
          const hsl = { h: 0, s: 0, l: 0 };
          o.material.color.getHSL(hsl);
          if (hsl.l > 0.55) {
            o.material.emissive = new THREE.Color(0xffd98a);
            o.material.emissiveIntensity = 0.85;
          }
        }
      });
    } else {
      // Warm point light at the bulb height for actual illumination.
      const point = new THREE.PointLight(0xfff59d, 0.6, 4);
      point.position.set(0, 0.35, 0);
      glb.add(point);
    }
    glb.userData.surface = 'top';
    return glb;
  }
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x37474f });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 12), mat);
  base.position.y = 0.82; g.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 8), mat);
  pole.position.y = 1.03; g.add(pole);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.16, 12, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xfff59d, side: THREE.DoubleSide,
      emissive: mob ? 0xffd98a : 0x000000,
      emissiveIntensity: mob ? 1.0 : 0,
    }));
  shade.position.y = 1.3; g.add(shade);
  if (!mob) {
    const point = new THREE.PointLight(0xfff59d, 0.6, 4);
    point.position.set(0, 1.2, 0); g.add(point);
  }
  // This procedural fallback models its parts at table-relative heights
  // (base at y≈0.82), so the group sits at the data Y minus that built-in
  // offset, landing the visible base at the requested Y.
  g.position.set(x, hasY ? y - 0.82 : 0, z);
  g.userData.surface = 'top'; // sits on a table at y≈0.78
  return g;
}
