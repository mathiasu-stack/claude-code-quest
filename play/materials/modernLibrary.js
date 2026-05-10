// modernLibrary.js — luxury corporate material presets.
//
// All textures are generated procedurally and cached so we pay the
// allocation once per session. Returns standard MeshStandardMaterial /
// MeshPhysicalMaterial so existing meshes can swap in without changes.
//
// Catalogue:
//   marbleWhite()     — atrium floor, executive desks
//   marbleDarkGreen() — accent panels, elevator floor
//   marbleBlackGold() — top-floor flourish
//   brushedSilver()   — Kedash logo letters, elevator frame, signage
//   polishedChrome()  — handrails, reception desk trim
//   glassClear()      — elevator walls, partitions, curtain wall
//   glassFrosted()    — meeting pod walls
//   polishedConcrete()— operations floor (floor 2)
//   brass()           — top floor accents
//   darkStone()       — reception desk body
//
// Mobile fallback: PhysicalMaterial transmission is heavy on mobile.
// `glassClear()` accepts `{ mobile: true }` and returns an alpha-blended
// MeshStandardMaterial that costs nothing extra.

import * as THREE from 'three';

const _texCache = new Map();
const _matCache = new Map();
function cachedTex(key, builder) {
  if (!_texCache.has(key)) _texCache.set(key, builder());
  return _texCache.get(key);
}

// ── Procedural textures ─────────────────────────────────────────────────────

// Soft veined marble. Veins are an additive layer of curvy strokes on a
// muted base. Two-pass for depth.
function marbleTexture(baseHex, veinHex, accentHex, repeat = 4) {
  return cachedTex(`marble-${baseHex.toString(16)}-${veinHex.toString(16)}`, () => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#' + baseHex.toString(16).padStart(6, '0');
    ctx.fillRect(0, 0, c.width, c.height);

    // Coarse cloudy noise for stone variation
    for (let i = 0; i < 1200; i++) {
      const v = Math.random();
      const a = 0.04 + v * 0.06;
      ctx.fillStyle = `rgba(0,0,0,${a})`;
      ctx.beginPath();
      ctx.arc(Math.random() * c.width, Math.random() * c.height,
        4 + Math.random() * 16, 0, Math.PI * 2);
      ctx.fill();
    }

    // Veins — bezier strokes
    ctx.strokeStyle = '#' + veinHex.toString(16).padStart(6, '0');
    for (let v = 0; v < 14; v++) {
      ctx.lineWidth = 0.6 + Math.random() * 1.6;
      ctx.globalAlpha = 0.35 + Math.random() * 0.5;
      ctx.beginPath();
      const x0 = Math.random() * c.width;
      const y0 = Math.random() * c.height;
      ctx.moveTo(x0, y0);
      let x = x0, y = y0;
      const steps = 6 + Math.floor(Math.random() * 6);
      for (let s = 0; s < steps; s++) {
        const cx = x + (Math.random() - 0.5) * 200;
        const cy = y + (Math.random() - 0.5) * 200;
        x += (Math.random() - 0.5) * 200;
        y += (Math.random() - 0.5) * 200;
        ctx.quadraticCurveTo(cx, cy, x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Accent flecks (gold or silver)
    if (accentHex !== null && accentHex !== undefined) {
      ctx.fillStyle = '#' + accentHex.toString(16).padStart(6, '0');
      for (let i = 0; i < 80; i++) {
        ctx.fillRect(Math.random() * c.width, Math.random() * c.height,
          0.6 + Math.random() * 1.5, 0.6 + Math.random() * 1.5);
      }
    }

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat, repeat);
    tex.anisotropy = 4;
    return tex;
  });
}

// Polished concrete: subtle grit + cloudy lighter patches.
function concreteTexture() {
  return cachedTex('concrete', () => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#cbcbc6';
    ctx.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 600; i++) {
      const a = 0.05 + Math.random() * 0.08;
      ctx.fillStyle = `rgba(0,0,0,${a})`;
      ctx.beginPath();
      ctx.arc(Math.random() * c.width, Math.random() * c.height,
        1 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 3000; i++) {
      ctx.fillStyle = `rgba(${[40, 200, 140][i % 3]},${[40, 200, 140][i % 3]},${[40, 200, 140][i % 3]},${0.05 + Math.random() * 0.1})`;
      ctx.fillRect(Math.random() * c.width, Math.random() * c.height, 1, 1);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    return tex;
  });
}

// Brushed metal — directional anisotropic streaks via stripes.
function brushedTexture(baseHex) {
  return cachedTex(`brushed-${baseHex.toString(16)}`, () => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#' + baseHex.toString(16).padStart(6, '0');
    ctx.fillRect(0, 0, c.width, c.height);
    // Horizontal streaks
    for (let i = 0; i < 600; i++) {
      const y = Math.random() * c.height;
      const w = 30 + Math.random() * 80;
      const a = Math.random() * 0.18;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(Math.random() * c.width, y, w, 0.6);
      ctx.fillStyle = `rgba(0,0,0,${a * 0.5})`;
      ctx.fillRect(Math.random() * c.width, y + 0.6, w, 0.6);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  });
}

// ── Material factories ──────────────────────────────────────────────────────

export function marbleWhite() {
  return _matCache.get('marbleWhite') || (() => {
    const m = new THREE.MeshStandardMaterial({
      map: marbleTexture(0xeeeae3, 0xb0a48b, null, 3),
      color: 0xffffff,
      metalness: 0.06,
      roughness: 0.18,
      envMapIntensity: 1.0,
    });
    _matCache.set('marbleWhite', m);
    return m;
  })();
}

export function marbleDarkGreen() {
  return _matCache.get('marbleDarkGreen') || (() => {
    const m = new THREE.MeshStandardMaterial({
      map: marbleTexture(0x1d3a2f, 0x3a604f, 0xc9a44c, 3),
      color: 0xeeeeee,
      metalness: 0.1, roughness: 0.22,
    });
    _matCache.set('marbleDarkGreen', m);
    return m;
  })();
}

export function marbleBlackGold() {
  return _matCache.get('marbleBlackGold') || (() => {
    const m = new THREE.MeshStandardMaterial({
      map: marbleTexture(0x101012, 0x4a4a4a, 0xc9a44c, 4),
      color: 0xffffff,
      metalness: 0.18, roughness: 0.18,
    });
    _matCache.set('marbleBlackGold', m);
    return m;
  })();
}

export function brushedSilver() {
  const m = new THREE.MeshStandardMaterial({
    map: brushedTexture(0xc7cdd5),
    color: 0xffffff,
    metalness: 0.85,
    roughness: 0.32,
  });
  return m;
}

export function polishedChrome() {
  return new THREE.MeshStandardMaterial({
    color: 0xeef2f5,
    metalness: 0.95,
    roughness: 0.05,
  });
}

// Glass — uses transmission on desktop, alpha-blend fallback on mobile.
export function glassClear({ mobile = false, tint = 0xeaf3ff } = {}) {
  if (mobile) {
    return new THREE.MeshStandardMaterial({
      color: tint, transparent: true, opacity: 0.18,
      metalness: 0.2, roughness: 0.05, depthWrite: false,
    });
  }
  return new THREE.MeshPhysicalMaterial({
    color: tint,
    transmission: 0.92,
    thickness: 0.06,
    roughness: 0.04,
    metalness: 0,
    transparent: true,
    opacity: 0.5,
    ior: 1.45,
    depthWrite: false,
  });
}

export function glassFrosted({ mobile = false, tint = 0xf2f7fc } = {}) {
  if (mobile) {
    return new THREE.MeshStandardMaterial({
      color: tint, transparent: true, opacity: 0.32,
      metalness: 0.05, roughness: 0.55, depthWrite: false,
    });
  }
  return new THREE.MeshPhysicalMaterial({
    color: tint,
    transmission: 0.65,
    thickness: 0.18,
    roughness: 0.5,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
}

export function polishedConcrete() {
  return _matCache.get('polishedConcrete') || (() => {
    const m = new THREE.MeshStandardMaterial({
      map: concreteTexture(),
      color: 0xffffff,
      metalness: 0.15,
      roughness: 0.55,
    });
    _matCache.set('polishedConcrete', m);
    return m;
  })();
}

export function brass() {
  return new THREE.MeshStandardMaterial({
    color: 0xc9a44c,
    metalness: 0.92,
    roughness: 0.18,
  });
}

export function darkStone() {
  return _matCache.get('darkStone') || (() => {
    const m = new THREE.MeshStandardMaterial({
      map: marbleTexture(0x1c1d22, 0x2e2f36, null, 3),
      color: 0xeeeeee, metalness: 0.2, roughness: 0.42,
    });
    _matCache.set('darkStone', m);
    return m;
  })();
}

export function backlitGlassSign() {
  return new THREE.MeshStandardMaterial({
    color: 0xfbfdff,
    emissive: 0xb6d6ff,
    emissiveIntensity: 0.85,
    metalness: 0.05,
    roughness: 0.2,
    transparent: true,
    opacity: 0.95,
  });
}

// Convenience: a "light strip" material for cove lighting.
export function coveLight(color = 0xfff1c5) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.85,
  });
}
