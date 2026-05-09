import * as THREE from 'three';

let renderer, scene, camera, clock;
let player, npc, ground;
let keys = {};
let touchVec = { x: 0, y: 0 };
let interactionTarget = null;
let raf = null;
let resizeListener, keyDownListener, keyUpListener;
let container, promptEl;

const OUTFITS = [
  { shirt: 0xb0bec5, pants: 0x37474f, label: 'Intern' },
  { shirt: 0x90caf9, pants: 0x37474f, label: 'Junior Hire' },
  { shirt: 0x81d4fa, pants: 0x263238, label: 'Associate' },
  { shirt: 0xa5d6a7, pants: 0x263238, label: 'Engineer' },
  { shirt: 0xffe082, pants: 0x263238, label: 'Senior' },
  { shirt: 0xff8a65, pants: 0x1a237e, label: 'Lead' },
  { shirt: 0xce93d8, pants: 0x1a237e, label: 'Principal' },
  { shirt: 0xffd54f, pants: 0x4a148c, label: 'Director' },
];

function getCompletedChapterCount() {
  if (!window.Progress || !window.CURRICULUM || !window.App) return 0;
  const progress = window.App.progress;
  return window.CURRICULUM.filter(ch =>
    window.Progress.isTestPassed(progress, ch.practicalTest.id)
  ).length;
}

function getOutfit() {
  const n = Math.min(getCompletedChapterCount(), OUTFITS.length - 1);
  return OUTFITS[n];
}

function makeCharacter(outfit, accentColor) {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.8, 0.35),
    new THREE.MeshStandardMaterial({ color: outfit.shirt })
  );
  body.position.y = 1.0; body.castShadow = true;
  group.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xfdd9b5 })
  );
  head.position.y = 1.62; head.castShadow = true;
  group.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.235, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x3e2723 })
  );
  hair.position.y = 1.62;
  group.add(hair);

  const pants = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.55, 0.3),
    new THREE.MeshStandardMaterial({ color: outfit.pants })
  );
  pants.position.y = 0.32; pants.castShadow = true;
  group.add(pants);

  const legGeom = new THREE.BoxGeometry(0.22, 0.5, 0.25);
  const legMat = new THREE.MeshStandardMaterial({ color: outfit.pants });
  const leftLeg = new THREE.Mesh(legGeom, legMat);
  leftLeg.position.set(-0.13, 0.0, 0); leftLeg.castShadow = true;
  group.add(leftLeg);
  const rightLeg = new THREE.Mesh(legGeom, legMat);
  rightLeg.position.set(0.13, 0.0, 0); rightLeg.castShadow = true;
  group.add(rightLeg);

  const armGeom = new THREE.BoxGeometry(0.18, 0.65, 0.25);
  const armMat = new THREE.MeshStandardMaterial({ color: outfit.shirt });
  const leftArm = new THREE.Mesh(armGeom, armMat);
  leftArm.position.set(-0.4, 1.05, 0); leftArm.castShadow = true;
  group.add(leftArm);
  const rightArm = new THREE.Mesh(armGeom, armMat);
  rightArm.position.set(0.4, 1.05, 0); rightArm.castShadow = true;
  group.add(rightArm);

  if (accentColor) {
    const tie = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.4, 0.05),
      new THREE.MeshStandardMaterial({ color: accentColor })
    );
    tie.position.set(0, 1.0, 0.18);
    group.add(tie);
  }

  group.userData.parts = { body, head, hair, pants, leftLeg, rightLeg, leftArm, rightArm };
  return group;
}

function makeLabelSprite(text, fg = '#ffffff', bg = 'rgba(26, 39, 68, 0.9)') {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const r = 24, w = canvas.width, h = canvas.height;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(w - r, 0); ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r); ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(r, h); ctx.quadraticCurveTo(0, h, 0, h - r);
  ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = fg;
  ctx.font = 'bold 56px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.0, 0.5, 1);
  return sprite;
}

function makeWallSign(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1a2744';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#c9a44c';
  ctx.font = 'bold 140px serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(8, 2),
    new THREE.MeshBasicMaterial({ map: tex })
  );
}

function buildWorld() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeaf3ff);
  scene.fog = new THREE.Fog(0xeaf3ff, 25, 60);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x99aab5, 0.7);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(8, 12, 6);
  dir.castShadow = true;
  dir.shadow.mapSize.set(1024, 1024);
  dir.shadow.camera.left = -15; dir.shadow.camera.right = 15;
  dir.shadow.camera.top = 15; dir.shadow.camera.bottom = -15;
  scene.add(dir);

  ground = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ color: 0x9aa9bc })
  );
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  scene.add(ground);

  const runner = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 18),
    new THREE.MeshStandardMaterial({ color: 0xc9a44c })
  );
  runner.rotation.x = -Math.PI / 2;
  runner.position.set(0, 0.001, -3);
  scene.add(runner);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf4ecd8 });
  const wallH = 3.5;
  function wall(w, h, d, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    scene.add(m);
    return m;
  }
  wall(20, wallH, 0.3, 0, wallH / 2, -10);
  wall(0.3, wallH, 20, -10, wallH / 2, 0);
  wall(0.3, wallH, 20, 10, wallH / 2, 0);
  wall(8, wallH, 0.3, -6, wallH / 2, 10);
  wall(8, wallH, 0.3, 6, wallH / 2, 10);
  wall(4, 1, 0.3, 0, wallH - 0.5, 10);

  const desk = new THREE.Mesh(
    new THREE.BoxGeometry(3, 1.0, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x6b4f3a })
  );
  desk.position.set(0, 0.5, -7);
  desk.castShadow = true; desk.receiveShadow = true;
  scene.add(desk);

  const logo = makeWallSign('ACME CORP');
  logo.position.set(0, 2.6, -9.84);
  scene.add(logo);

  const ch1Done = window.Progress && window.App &&
    window.Progress.isTestPassed(window.App.progress, 'ch01-test');
  const doorMat = new THREE.MeshStandardMaterial({
    color: ch1Done ? 0x4caf50 : 0x5d4037,
  });
  const door = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.6, 0.2), doorMat);
  door.position.set(0, 1.3, 9.9);
  scene.add(door);

  const doorLabel = makeLabelSprite(
    ch1Done ? 'Chapter 2 — Open' : 'Chapter 2 — Locked',
    '#ffffff',
    ch1Done ? 'rgba(34,139,34,0.9)' : 'rgba(120,40,40,0.9)'
  );
  doorLabel.position.set(0, 3.2, 9.9);
  scene.add(doorLabel);
}

function buildPlayer() {
  player = makeCharacter(getOutfit(), 0xc9a44c);
  player.position.set(0, 0.25, 4);
  scene.add(player);

  const tier = getOutfit().label;
  const tierTag = makeLabelSprite(tier, '#1a2744', 'rgba(201,164,76,0.95)');
  tierTag.position.set(0, 2.4, 0);
  player.add(tierTag);
}

function buildNPC() {
  npc = makeCharacter({ shirt: 0xc44a6e, pants: 0x263238 }, null);
  npc.position.set(0, 0.25, -7.5);
  npc.rotation.y = Math.PI;
  npc.userData.chapterId = 'ch01';
  scene.add(npc);

  const tag = makeLabelSprite('Linda — Onboarding');
  tag.position.set(0, 2.4, 0);
  npc.add(tag);
}

function setupRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 5, 10);
  camera.lookAt(0, 1, 0);
  resize();
}

function resize() {
  if (!renderer || !container) return;
  const w = container.clientWidth;
  const h = container.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function setupInput() {
  keyDownListener = (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === 'e' || e.key === 'E') tryInteract();
  };
  keyUpListener = (e) => { keys[e.key.toLowerCase()] = false; };
  window.addEventListener('keydown', keyDownListener);
  window.addEventListener('keyup', keyUpListener);

  const joystickEl = document.getElementById('play-joystick');
  const thumbEl = document.getElementById('play-joystick-thumb');
  let active = false, baseX = 0, baseY = 0;
  const max = 50;

  const onStart = (e) => {
    active = true;
    const rect = joystickEl.getBoundingClientRect();
    baseX = rect.left + rect.width / 2;
    baseY = rect.top + rect.height / 2;
    onMove(e);
  };
  const onMove = (e) => {
    if (!active) return;
    const t = (e.touches ? e.touches[0] : e);
    let dx = t.clientX - baseX, dy = t.clientY - baseY;
    const dist = Math.hypot(dx, dy);
    if (dist > max) { dx = (dx / dist) * max; dy = (dy / dist) * max; }
    thumbEl.style.transform = `translate(${dx}px, ${dy}px)`;
    touchVec.x = dx / max;
    touchVec.y = dy / max;
  };
  const onEnd = () => {
    active = false;
    touchVec.x = 0; touchVec.y = 0;
    thumbEl.style.transform = 'translate(0,0)';
  };
  joystickEl.addEventListener('touchstart', onStart, { passive: true });
  joystickEl.addEventListener('touchmove', onMove, { passive: true });
  joystickEl.addEventListener('touchend', onEnd);
  joystickEl.addEventListener('touchcancel', onEnd);

  document.getElementById('play-prompt').addEventListener('click', tryInteract);
  document.getElementById('play-back-btn').addEventListener('click', () => {
    window.App.navigate('dashboard');
  });
  document.getElementById('play-interact-btn').addEventListener('click', tryInteract);

  resizeListener = () => resize();
  window.addEventListener('resize', resizeListener);
}

function tryInteract() {
  if (!interactionTarget) return;
  const chapterId = interactionTarget.userData.chapterId;
  window.App.navigate('chapter', { chapterId });
}

function update(dt) {
  let mx = 0, mz = 0;
  if (keys['w'] || keys['arrowup']) mz -= 1;
  if (keys['s'] || keys['arrowdown']) mz += 1;
  if (keys['a'] || keys['arrowleft']) mx -= 1;
  if (keys['d'] || keys['arrowright']) mx += 1;
  if (touchVec.x !== 0 || touchVec.y !== 0) {
    mx += touchVec.x;
    mz += touchVec.y;
  }
  const len = Math.hypot(mx, mz);
  const moving = len > 0.05;
  if (moving) {
    mx /= len; mz /= len;
    const speed = 4.0;
    player.position.x += mx * speed * dt;
    player.position.z += mz * speed * dt;
    player.position.x = Math.max(-9.5, Math.min(9.5, player.position.x));
    player.position.z = Math.max(-9.5, Math.min(9.5, player.position.z));
    player.rotation.y = Math.atan2(mx, mz);

    const t = performance.now() * 0.012;
    const p = player.userData.parts;
    if (p) {
      p.leftLeg.rotation.x = Math.sin(t) * 0.5;
      p.rightLeg.rotation.x = -Math.sin(t) * 0.5;
      p.leftArm.rotation.x = -Math.sin(t) * 0.4;
      p.rightArm.rotation.x = Math.sin(t) * 0.4;
    }
  } else if (player.userData.parts) {
    const p = player.userData.parts;
    p.leftLeg.rotation.x *= 0.85;
    p.rightLeg.rotation.x *= 0.85;
    p.leftArm.rotation.x *= 0.85;
    p.rightArm.rotation.x *= 0.85;
  }

  const camDist = 6, camH = 4;
  camera.position.x += (player.position.x - camera.position.x) * 0.08;
  camera.position.z += (player.position.z + camDist - camera.position.z) * 0.08;
  camera.position.y = camH;
  camera.lookAt(player.position.x, 1.0, player.position.z);

  const dx = player.position.x - npc.position.x;
  const dz = player.position.z - npc.position.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 2.4) {
    if (interactionTarget !== npc) {
      interactionTarget = npc;
      promptEl.classList.add('visible');
      promptEl.textContent = 'Press E or tap to talk to Linda';
      document.getElementById('play-interact-btn').classList.add('visible');
    }
  } else if (interactionTarget) {
    interactionTarget = null;
    promptEl.classList.remove('visible');
    document.getElementById('play-interact-btn').classList.remove('visible');
  }
}

function loop() {
  raf = requestAnimationFrame(loop);
  const dt = Math.min(0.05, clock.getDelta());
  update(dt);
  renderer.render(scene, camera);
}

export function start(host) {
  container = host;
  promptEl = document.getElementById('play-prompt');
  clock = new THREE.Clock();
  setupRenderer();
  buildWorld();
  buildPlayer();
  buildNPC();
  setupInput();
  loop();
}

export function stop() {
  if (raf) cancelAnimationFrame(raf);
  raf = null;
  if (resizeListener) window.removeEventListener('resize', resizeListener);
  if (keyDownListener) window.removeEventListener('keydown', keyDownListener);
  if (keyUpListener) window.removeEventListener('keyup', keyUpListener);
  if (renderer) {
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    renderer.dispose();
  }
  if (scene) {
    scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(m => {
          if (m.map) m.map.dispose();
          m.dispose();
        });
      }
    });
  }
  renderer = null; scene = null; camera = null;
  player = null; npc = null; ground = null;
  interactionTarget = null;
  keys = {}; touchVec = { x: 0, y: 0 };
}

window.Play = { start, stop };
