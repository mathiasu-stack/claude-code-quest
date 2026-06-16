// PostFxPipeline — wraps EffectComposer with bloom + vignette + grain.
//
// Usage from play.js:
//   import { PostFxPipeline } from './postfx/composer.js';
//   const postfx = new PostFxPipeline(renderer, scene, camera, { mobile });
//   postfx.applyPreset(lighting.getPostFx());
//   ...
//   postfx.resize(w, h);
//   postfx.render();   // <- replaces renderer.render(scene, camera)
//
// Mobile downgrades:
//  • bloom render-target halved
//  • film-grain pass skipped entirely (saves a fullscreen pass per frame)
//
// Bundle impact: imports are pulled from jsdelivr's three/addons/. Total
// addon JS pulled per session is around 30-40 KB gzipped — well inside
// the 150 KB cap.

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass }     from 'three/addons/postprocessing/ShaderPass.js';

// Combined colour-grade + vignette + film-grain shader. One pass to keep cost
// down on mobile. The grade (contrast/saturation/temperature) turns flat ACES
// output into a subtly more cinematic image; defaults are deliberately gentle
// so they polish rather than restyle. Each is per-zone tunable via applyPreset.
const VignetteGrainShader = {
  uniforms: {
    tDiffuse:  { value: null },
    uVignette: { value: 0.4 },
    uGrain:    { value: 0.0 },
    uContrast:    { value: 1.05 },   // 1 = neutral
    uSaturation:  { value: 1.06 },   // 1 = neutral
    uTemperature: { value: 0.012 },  // 0 = neutral; + = warmer
    uTime:     { value: 0.0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uVignette;
    uniform float uGrain;
    uniform float uContrast;
    uniform float uSaturation;
    uniform float uTemperature;
    uniform float uTime;
    uniform vec2  uResolution;
    varying vec2  vUv;

    // hash for grain
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec4 c = texture2D(tDiffuse, vUv);

      // ── colour grade ──
      // contrast around mid-grey
      c.rgb = (c.rgb - 0.5) * uContrast + 0.5;
      // saturation around luma
      float luma = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb = mix(vec3(luma), c.rgb, uSaturation);
      // temperature (warm up reds, cool down blues — or vice-versa)
      c.rgb *= vec3(1.0 + uTemperature, 1.0, 1.0 - uTemperature);
      c.rgb = clamp(c.rgb, 0.0, 1.0);

      // vignette (smooth radial darkening from corners)
      vec2 d = vUv - 0.5;
      float r = dot(d, d) * 2.0;          // 0 centre → ~0.5 corners
      float vig = 1.0 - smoothstep(0.25, 0.95, r) * uVignette;
      c.rgb *= vig;

      // film grain (skip if uGrain == 0)
      if (uGrain > 0.0) {
        float n = hash(vUv * uResolution + uTime * 60.0);
        c.rgb += (n - 0.5) * uGrain;
      }

      gl_FragColor = c;
    }
  `,
};

export class PostFxPipeline {
  constructor(renderer, scene, camera, opts = {}) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.mobile = !!opts.mobile;

    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));

    // Bloom — render targets at 1.0× on desktop, 0.5× on mobile.
    const bloomScale = this.mobile ? 0.5 : 1.0;
    const size = renderer.getSize(new THREE.Vector2());
    const bloomRT = new THREE.Vector2(
      Math.max(64, Math.floor(size.x * bloomScale)),
      Math.max(64, Math.floor(size.y * bloomScale)),
    );
    this.bloom = new UnrealBloomPass(bloomRT, 0.55, 0.75, 0.8);
    this.composer.addPass(this.bloom);

    // Combined vignette+grain. Skip grain on mobile (uGrain stays 0).
    this.vignettePass = new ShaderPass(VignetteGrainShader);
    this.vignettePass.material.uniforms.uResolution.value.set(size.x, size.y);
    this.composer.addPass(this.vignettePass);

    // Track the bloom-target scale so resize keeps the same ratio.
    this._bloomScale = bloomScale;
    this._t0 = performance.now();
  }

  applyPreset(postfx) {
    if (!postfx) return;
    if (typeof postfx.bloomStrength === 'number')  this.bloom.strength  = postfx.bloomStrength;
    if (typeof postfx.bloomRadius === 'number')    this.bloom.radius    = postfx.bloomRadius;
    if (typeof postfx.bloomThreshold === 'number') this.bloom.threshold = postfx.bloomThreshold;
    if (typeof postfx.vignette === 'number')       this.vignettePass.material.uniforms.uVignette.value = postfx.vignette;
    // Colour-grade keys are optional per zone; absent → keep the gentle global
    // defaults set in the shader uniforms.
    const u = this.vignettePass.material.uniforms;
    if (typeof postfx.contrast === 'number')    u.uContrast.value = postfx.contrast;
    if (typeof postfx.saturation === 'number')  u.uSaturation.value = postfx.saturation;
    if (typeof postfx.temperature === 'number') u.uTemperature.value = postfx.temperature;
    if (typeof postfx.grain === 'number') {
      const g = this.mobile ? 0.0 : postfx.grain; // perf: no grain on mobile
      this.vignettePass.material.uniforms.uGrain.value = g;
    }
  }

  resize(w, h) {
    this.composer.setSize(w, h);
    // composer.setSize calls bloom.setSize(w, h) internally, which then
    // halves to (w/2, h/2). To downscale further on mobile, call bloom
    // setSize again with scaled dimensions so its internal /2 gives us
    // the target resolution.
    if (this._bloomScale < 1.0) {
      this.bloom.setSize(
        Math.max(128, Math.floor(w * this._bloomScale)),
        Math.max(128, Math.floor(h * this._bloomScale)),
      );
    }
    this.vignettePass.material.uniforms.uResolution.value.set(w, h);
  }

  render() {
    this.vignettePass.material.uniforms.uTime.value =
      (performance.now() - this._t0) * 0.001;
    this.composer.render();
  }

  dispose() {
    if (this.composer) {
      // EffectComposer doesn't expose a clean dispose, so we manually
      // dispose render targets it owns.
      if (this.composer.renderTarget1) this.composer.renderTarget1.dispose();
      if (this.composer.renderTarget2) this.composer.renderTarget2.dispose();
    }
    if (this.bloom) {
      this.bloom.dispose?.();
    }
  }
}
