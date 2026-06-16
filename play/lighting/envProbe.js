// envProbe.js — image-based lighting (IBL) for the scene.
//
// Builds a prefiltered environment map from a procedural sky gradient and
// hands it back so play.js can assign it to `scene.environment`. With it set,
// every MeshStandardMaterial gains image-based ambient + specular reflections:
// the marble, glass curtain walls, brass, monitors and metal trim stop reading
// as flat plastic and start catching the world around them.
//
// The gradient is authored at a MODERATE brightness on purpose. The scene
// already has a hemisphere + directional rig (and timeOfDay drives their
// intensity per second), so a blazing-white env would double-count ambient and
// blow out under the ACES tone map. A gentle sky enriches reflections — the
// real win — while keeping the diffuse contribution subtle, so no light
// rebalance is needed. Brightness is tunable via opts if it reads too hot/cold.

import * as THREE from 'three';

// One equirect gradient → one PMREM texture. Returns the prefiltered texture
// (caller owns disposal via disposeEnv()). Safe to call once at world build.
export function buildSkyEnvTexture(renderer, opts = {}) {
  const equirect = makeSkyEquirect(opts);
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const rt = pmrem.fromEquirectangular(equirect);
  pmrem.dispose();
  equirect.dispose();
  return rt.texture;
}

export function disposeEnv(tex) {
  try { tex?.dispose?.(); } catch {}
}

// A simple vertical sky→horizon→ground gradient baked to a small canvas.
// Defaults approximate a soft overcast-blue daytime sky; callers can pass
// top/horizon/ground hex strings to retint per mood.
function makeSkyEquirect(opts = {}) {
  const top = opts.top || '#86acd6';      // upper sky
  const horizon = opts.horizon || '#d7e0e7'; // pale haze band
  const ground = opts.ground || '#595d61';   // muted ground bounce
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0.00, top);
  grad.addColorStop(0.46, top);
  grad.addColorStop(0.50, horizon);
  grad.addColorStop(0.54, horizon);
  grad.addColorStop(1.00, ground);
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
