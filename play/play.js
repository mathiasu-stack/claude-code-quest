import * as THREE from 'three';
import { LightingManager } from './lighting/manager.js';
import { isMobile, effectivePixelRatio } from './lighting/mobile.js';
import { PostFxPipeline } from './postfx/composer.js';
import { DustMotes } from './lighting/dust-motes.js';
import { audio } from './audio/AudioManager.js';
import {
  playFootstep, playJumpGrunt, playLandThud,
  playUi, playDialogueBlip, blipPitchForNpc,
  playAchievementChime, playLevelUpFanfare, playPpPing,
  playKcCorrectTone, playKcIncorrectTone, playCrowdCheer,
} from './audio/procedural.js';
import { surfaceForZone, musicForZone } from './audio/zoneConfig.js';
import { mountAudioSettings, unmountAudioSettings } from './audio/settings.js';
import { attachFace, updateFace, setExpression } from './characters/face.js';
import { applyIdle } from './characters/idleAnimations.js';
import { loadCustomization, mountCustomization, unmountCustomization } from './characters/customization.js';
import { decorateReception } from './decorations/reception.js';
import { decorateLibrary } from './decorations/library.js';
import { buildReceptionCenterpiece } from './decorations/receptionCenterpiece.js';
import { SkyDome, getSkyPresetForZone } from './world/sky.js';
import { buildReceptionCeiling, buildLibraryCeiling } from './world/ceilings.js';
import { buildReceptionWindows, buildLibraryArchedWindow, buildReceptionHallway } from './world/depth.js';
import { TimeOfDay } from './world/timeOfDay.js';
import { LiveAgents } from './world/liveAgents.js';
import { NameTagSystem } from './ui/nameTags.js';

// ─── Tier outfits (player) ────────────────────────────────────────────────────
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

// ─── NPC roster ──────────────────────────────────────────────────────────────
// Each NPC teaches exactly ONE lesson (or runs the practical test).
const NPCS = [
  // ── Zone 1: Onboarding office (chapter 1) ────
  {
    id: 'linda',  zone: 1, pos: [0, -7], face: 0,
    name: 'Linda Park', role: 'HR Director', portrait: '👩‍💼',
    chapterId: 'ch01', lessonId: 'ch01-l01', kind: 'lesson',
    look: { skin: 0xfdd9b5, hair: 0x4a2c0f, hairStyle: 'bun', shirt: 0xd05a7e, pants: 0x263238, glasses: false, prop: 'clipboard', face: 'round', expression: 'kind', accent: 0xb71c1c, gesture: 'wave' },
    intro: "Welcome to Kedash Corp! I'm Linda from HR. Before you can start work, let's cover the basics — what Claude Code actually IS. Take a seat, this won't take long.",
    nextHint: "Done with me? Walk over to Marcus at the IT bench so he can get you set up.",
  },
  {
    id: 'marcus', zone: 1, pos: [-6, -3], face: Math.PI / 2,
    name: 'Marcus Webb', role: 'IT Setup Lead', portrait: '👨‍🔧',
    chapterId: 'ch01', lessonId: 'ch01-l02', kind: 'lesson',
    look: { skin: 0x8d5524, hair: 0x1a1a1a, hairStyle: 'short', shirt: 0x6b8090, pants: 0x263238, glasses: true, prop: 'tablet', beard: true, face: 'sharp', expression: 'focused', accent: 0x1565c0, gesture: 'glasses' },
    intro: "Hey there, new hire. Marcus, IT. Let's get the actual software on your machine — installation and setup. Pull up a chair.",
    nextHint: "All set up? Aisha is at the workstation cluster. She'll show you your first session.",
  },
  {
    id: 'aisha', zone: 1, pos: [6, -3], face: -Math.PI / 2,
    name: 'Aisha Mehta', role: 'Senior Engineer', portrait: '👩‍💻',
    chapterId: 'ch01', lessonId: 'ch01-l03', kind: 'lesson',
    look: { skin: 0xc68642, hair: 0x1a1a1a, hairStyle: 'long', shirt: 0xa6d4ff, pants: 0x37474f, glasses: false, prop: 'mug', face: 'round', expression: 'happy', accent: 0xff7043, gesture: 'typing' },
    intro: "Hi! I'm Aisha. Forget the manual — let me walk you through your first real Claude session. We'll just open it up and try things.",
    nextHint: "Now find Kenji over by the demo screens — he'll explain the interface in detail.",
  },
  {
    id: 'kenji',  zone: 1, pos: [-6, 3], face: Math.PI / 2,
    name: 'Kenji Tanaka', role: 'UX & Interface Lead', portrait: '🧑‍🎨',
    chapterId: 'ch01', lessonId: 'ch01-l04', kind: 'lesson',
    look: { skin: 0xf1c27d, hair: 0x2e1f0e, hairStyle: 'short', shirt: 0xb9e2bb, pants: 0x263238, glasses: true, prop: 'tablet', face: 'dot', expression: 'smug', accent: 0x6a1b9a, gesture: 'gesture' },
    intro: "Yo. Kenji. Now that you've poked at it, let me actually walk you through the interface so you know what every part does.",
    nextHint: "Almost there. Diana at the filing cabinets has one more important thing — about how this training stays valid.",
  },
  {
    id: 'diana',  zone: 1, pos: [6, 3], face: -Math.PI / 2,
    name: 'Diana Foley', role: 'Compliance Officer', portrait: '👩‍⚖️',
    chapterId: 'ch01', lessonId: 'ch01-l05', kind: 'lesson',
    look: { skin: 0xfdd9b5, hair: 0xb87333, hairStyle: 'short', shirt: 0xfff0a3, pants: 0x4a148c, glasses: true, prop: 'clipboard', face: 'sharp', expression: 'stern', accent: 0x4a148c, gesture: 'clipboard' },
    intro: "I'm Diana, Compliance. One quick thing before you graduate this floor: this training has a shelf life. Let me explain why.",
    nextHint: "Now go see Sarah Chen by the back door — she runs the practical assessment.",
  },
  {
    id: 'sarah',  zone: 1, pos: [0, 8.5], face: Math.PI,
    name: 'Sarah Chen', role: 'Engineering Manager', portrait: '👩‍💼',
    chapterId: 'ch01', testId: 'ch01-test', kind: 'test',
    look: { skin: 0xf1c27d, hair: 0x1a1a1a, hairStyle: 'short', shirt: 0x2c3a8f, pants: 0x263238, glasses: false, prop: 'badge', face: 'sharp', expression: 'focused', accent: 0xc9a44c, gesture: 'foottap' },
    intro: "Alright — last hurdle on this floor. I'm Sarah, EM. I'll send you a Slack-style scenario and want a real reply back. Pass and the door behind me opens.",
    nextHint: "Nice work. Walk through the door behind me — the Knowledge Library is open.",
  },

  // ── Zone 2: Knowledge Library (chapter 2) — coords in library at z=12..32 ──
  {
    id: 'elena',  zone: 2, pos: [-5, 18], face: Math.PI / 2,
    name: 'Dr. Elena Vasquez', role: 'Chief Strategist', portrait: '👩‍🏫',
    chapterId: 'ch02', lessonId: 'ch02-l01', kind: 'lesson',
    look: { skin: 0xfdd9b5, hair: 0xc0c0c0, hairStyle: 'long', shirt: 0xdba9e0, pants: 0x1a237e, glasses: true, prop: 'book', face: 'sharp', expression: 'smug', accent: 0x6a1b9a, gesture: 'reading' },
    intro: "Welcome to the Knowledge Library, kid. Elena. Doctor, technically. Forget prompt-engineering tricks — the real lever is centralised context. That's what a Business Brain is.",
    nextHint: "Find Raj over by the file shelves. He'll show you how to actually structure one.",
  },
  {
    id: 'raj',    zone: 2, pos: [5, 18], face: -Math.PI / 2,
    name: 'Raj Patel', role: 'Information Architect', portrait: '🧑‍💼',
    chapterId: 'ch02', lessonId: 'ch02-l02', kind: 'lesson',
    look: { skin: 0xc68642, hair: 0x2b1d0e, hairStyle: 'short', shirt: 0xa3def9, pants: 0x263238, glasses: true, prop: 'book', face: 'round', expression: 'kind', accent: 0x37474f, gesture: 'reading' },
    intro: "Knowing what a Business Brain is doesn't help if you can't lay one out. I'm Raj — let me show you how to structure the folder.",
    nextHint: "Mei is at the back workstation. She'll walk through how it actually plays out day-to-day.",
  },
  {
    id: 'mei',    zone: 2, pos: [0, 24], face: Math.PI,
    name: 'Mei Chen', role: 'Practitioner', portrait: '👩‍💻',
    chapterId: 'ch02', lessonId: 'ch02-l03', kind: 'lesson',
    look: { skin: 0xf1c27d, hair: 0x1a1a1a, hairStyle: 'bun', shirt: 0xffa388, pants: 0x263238, glasses: false, prop: 'mug', face: 'round', expression: 'happy', accent: 0xff5722, gesture: 'typing' },
    intro: "Theory's nice. Let me show you what a real Business Brain looks like in practice on a live project.",
    nextHint: "Last stop: Noor at the lectern runs the practical for this chapter.",
  },
  {
    id: 'noor',   zone: 2, pos: [-5, 30], face: Math.PI,
    name: 'Noor Ali', role: 'Senior Librarian', portrait: '👩‍🏫',
    chapterId: 'ch02', testId: 'ch02-test', kind: 'test',
    look: { skin: 0x8d5524, hair: 0x1a1a1a, hairStyle: 'long', shirt: 0xb9e2bb, pants: 0x4a148c, glasses: true, prop: 'clipboard', face: 'sharp', expression: 'kind', accent: 0xc9a44c, gesture: 'clipboard' },
    intro: "Hi. I'm Noor. I run the practical test for this chapter. When you're confident in the Business Brain, come back and I'll send you a scenario.",
    nextHint: "Excellent. The library has nothing more to teach you — for now.",
  },
];

// ─── Zone layout ─────────────────────────────────────────────────────────────
// Each zone is 22m wide and 22m deep. Zones extend along +Z.
const ZONE_COUNT = 16;
const ZONE_BOUNDS = Array.from({ length: ZONE_COUNT }, (_, i) => ({
  startZ: i * 22 - 11,
  endZ: (i + 1) * 22 - 11,
  centerZ: i * 22,
  chapterId: `ch${String(i + 1).padStart(2, '0')}`,
}));

function zoneIndexAt(z) {
  for (let i = 0; i < ZONE_BOUNDS.length; i++) {
    if (z >= ZONE_BOUNDS[i].startZ - 0.01 && z <= ZONE_BOUNDS[i].endZ + 0.01) return i;
  }
  return -1;
}
function isZoneIdxOpen(idx) {
  if (idx <= 0) return true;
  return isTestDone(`ch${String(idx).padStart(2, '0')}-test`);
}

// Themes for zones 3-16 (zones 1-2 are hand-built). Colors escalate.
const ZONE_THEMES = [
  null, null,
  { floor: 0xa1887f, wall: 0xefebe9, accent: '#5d4037', title: 'CLAUDE.md Atrium', metal: 0.05 },
  { floor: 0x90caf9, wall: 0xe3f2fd, accent: '#1565c0', title: 'Memory Vault', metal: 0.1 },
  { floor: 0xa5d6a7, wall: 0xe8f5e9, accent: '#2e7d32', title: 'Communications Hub', metal: 0.1 },
  { floor: 0xffcc80, wall: 0xfff3e0, accent: '#ef6c00', title: 'File Workshop', metal: 0.15 },
  { floor: 0xce93d8, wall: 0xf3e5f5, accent: '#6a1b9a', title: 'Token Lounge', metal: 0.2 },
  { floor: 0xff8a65, wall: 0xffccbc, accent: '#bf360c', title: 'Skill Forge', metal: 0.25 },
  { floor: 0x80cbc4, wall: 0xe0f2f1, accent: '#00695c', title: 'Methodology Lab', metal: 0.3 },
  { floor: 0xffd54f, wall: 0xfff9c4, accent: '#f57c00', title: 'Refinement Loop', metal: 0.35 },
  { floor: 0x9fa8da, wall: 0xeceff1, accent: '#283593', title: 'Slash Command Center', metal: 0.4 },
  { floor: 0xb39ddb, wall: 0xede7f6, accent: '#311b92', title: 'Plan War Room', metal: 0.45 },
  { floor: 0x4dd0e1, wall: 0xe0f7fa, accent: '#006064', title: 'Integration Bay', metal: 0.5 },
  { floor: 0xff7043, wall: 0xfbe9e7, accent: '#d84315', title: 'Mission Control', metal: 0.55 },
  { floor: 0xb2dfdb, wall: 0xfff8e1, accent: '#00897b', title: 'Architect Studio', metal: 0.6 },
  { floor: 0xffd700, wall: 0xfffde7, accent: '#ff6f00', title: 'NAS Server Room — Capstone', metal: 0.75 },
];

// ─── NPC generator (chapters 3-16) ───────────────────────────────────────────
const NAME_FIRST = ['Aiko','Ben','Carmen','Dario','Elena','Felix','Greta','Hassan','Imani','Joel','Kira','Lars','Maya','Nikhil','Omar','Priya','Quinn','Rita','Sven','Tara','Uma','Vince','Wren','Xander','Yara','Zane','Anna','Bilal','Camille','Diego','Esme','Farid','Gabi','Hugo','Iris','Jin','Karim'];
const NAME_LAST = ['Chen','Diaz','Hassan','Kim','Liu','Mehta','Nakamura','Olsen','Park','Rao','Singh','Tanaka','Volkov','Wong','Zhang','Patel','Garcia','Lopez','Khan','Hassan','Andersson','Dubois','Rossi','Schmidt'];
const PORTRAITS = ['👩‍💼','👨‍💼','🧑‍💼','👩‍💻','👨‍💻','🧑‍💻','👩‍🔬','👨‍🔬','👩‍🏫','👨‍🏫','🧑‍🚀','👨‍🚀','👩‍🚀','🧑‍🎨','👨‍🔧','👩‍🔧','👨‍⚕️','👩‍⚕️','👨‍🍳','👩‍🍳'];
const ROLES_LESSON = ['Senior Engineer','Tech Lead','Architect','Specialist','Principal','Researcher','Trainer','Practitioner','Coach','Engineer','Strategist','Operator','Maintainer','Designer','Reviewer'];
const SKIN_COLORS = [0xfdd9b5, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524];
const HAIR_COLORS = [0x000000, 0x1a1a1a, 0x3e2723, 0x5d4037, 0x8b6914, 0xb87333, 0xc0c0c0, 0xb87333, 0x4a2c0f];
const HAIR_STYLES = ['short','long','bun','short','long','short'];
const SHIRT_PALETTES = [
  0xc44a6e, 0x546e7a, 0x90caf9, 0xa5d6a7, 0xffe082, 0x81d4fa, 0xff8a65, 0xce93d8,
  0x4caf50, 0x00897b, 0x42a5f5, 0xab47bc, 0xec407a, 0xff7043, 0x66bb6a, 0x29b6f6,
];
const PROPS = ['clipboard','tablet','mug','book','badge','clipboard','tablet','book',null,'mug'];
const INTRO_TEMPLATES = [
  "Hey, {name} here. Quick lesson on “{title}” — pull up a chair.",
  "I'll walk you through {title}. Won't take long.",
  "{title} catches a lot of people out. Let me show you.",
  "Welcome over. I teach {title}. Ready?",
  "{name}, by the way. Your stop today is {title}. Let's dive in.",
  "Good — I cover {title}. The short version is: it actually matters more than people think.",
];
const TEST_INTROS = [
  "I run the practical for {chTitle}. Confident? Let's go.",
  "Final hurdle for {chTitle}. I send a scenario, you reply, I score it.",
  "{chTitle} assessor here. Pass and the door behind me opens.",
];
const NEXT_HINTS = [
  "Then find the next colleague — usually a desk over.",
  "Keep moving through this floor — there's more.",
  "Onward. Someone else here will pick up where I left off.",
];

function pick(arr, seed) { return arr[(seed * 9301 + 49297) % arr.length]; }
function npcLook(seed) {
  return {
    skin: pick(SKIN_COLORS, seed),
    hair: pick(HAIR_COLORS, seed + 1),
    hairStyle: pick(HAIR_STYLES, seed + 2),
    shirt: pick(SHIRT_PALETTES, seed + 3),
    pants: 0x263238,
    glasses: seed % 3 === 0,
    beard: seed % 5 === 0,
    prop: pick(PROPS, seed + 4),
  };
}

function generateChapterNPCs(chapterIdx) {
  const ch = window.CURRICULUM?.[chapterIdx];
  if (!ch) return [];
  const cZ = chapterIdx * 22;
  const slots = [
    { x: -6, z: cZ - 4, face: Math.PI / 2 },
    { x:  6, z: cZ - 4, face: -Math.PI / 2 },
    { x: -6, z: cZ + 0, face: Math.PI / 2 },
    { x:  6, z: cZ + 0, face: -Math.PI / 2 },
    { x: -6, z: cZ + 4, face: Math.PI / 2 },
    { x:  6, z: cZ + 4, face: -Math.PI / 2 },
  ];
  const npcs = [];
  ch.lessons.forEach((l, i) => {
    const slot = slots[i % slots.length];
    const seed = chapterIdx * 11 + i * 7;
    const first = pick(NAME_FIRST, seed);
    const last = pick(NAME_LAST, seed + 1);
    const tmpl = pick(INTRO_TEMPLATES, seed + 2);
    npcs.push({
      id: `auto-${l.id}`,
      zone: chapterIdx + 1,
      pos: [slot.x, slot.z],
      face: slot.face,
      name: `${first} ${last}`,
      role: pick(ROLES_LESSON, seed + 3),
      portrait: pick(PORTRAITS, seed + 4),
      chapterId: ch.id,
      lessonId: l.id,
      kind: 'lesson',
      look: npcLook(seed),
      intro: tmpl.replace('{name}', first).replace('{title}', l.title),
      nextHint: i < ch.lessons.length - 1
        ? pick(NEXT_HINTS, seed + 5)
        : `Now find the assessor by the back door — they run the practical for ${ch.title}.`,
    });
  });
  // Test NPC at south end (near door to next zone)
  const seed = chapterIdx * 11 + 99;
  const first = pick(NAME_FIRST, seed);
  const last = pick(NAME_LAST, seed + 1);
  npcs.push({
    id: `auto-${ch.id}-test`,
    zone: chapterIdx + 1,
    pos: [0, cZ + 8.5],
    face: Math.PI,
    name: `${first} ${last}`,
    role: 'Assessor',
    portrait: pick(PORTRAITS, seed + 2),
    chapterId: ch.id,
    testId: ch.practicalTest.id,
    kind: 'test',
    look: npcLook(seed),
    intro: pick(TEST_INTROS, seed).replace('{chTitle}', ch.title),
    nextHint: chapterIdx < ZONE_COUNT - 1
      ? `Pass it and the door to the next zone opens.`
      : `That's it — the capstone. Pass me and you'll have completed every chapter.`,
  });
  return npcs;
}

// ─── Module state ────────────────────────────────────────────────────────────
let renderer, scene, camera, clock;
let lighting = null;
let postfx = null;
let dust = null;
let lastZoneIdx = -1;
let footstepAccum = 0; // distance accumulated since last footstep SFX
let decoTickers = [];   // per-frame callbacks for animated decorations
let skyDome = null;
let receptionWindows = null;
let libraryWindow = null;
let receptionHallway = null;
let timeOfDay = null;
let liveAgents = null;
let nameTags = null;
let occluderWalls = [];
let player, npcMeshes = [];
let keys = {}, touchVec = { x: 0, y: 0 };
let jumpRequested = false;
let danceUntil = 0;
let interactionTarget = null;
let raf = null;
let resizeListener, keyDownListener, keyUpListener;
let container, promptEl, dialogueEl;
let inputLocked = false;
let zoneDoors = []; // each: { mesh, label, gateChapter }

function getProgress() { return window.App?.progress; }
function isLessonDone(id) { return id && window.Progress.isLessonComplete(getProgress(), id); }
function isTestDone(id) { return id && window.Progress.isTestPassed(getProgress(), id); }

function getCompletedChapterCount() {
  if (!window.Progress || !window.CURRICULUM || !window.App) return 0;
  return window.CURRICULUM.filter(ch =>
    window.Progress.isTestPassed(getProgress(), ch.practicalTest.id)
  ).length;
}
function getOutfit() {
  return OUTFITS[Math.min(getCompletedChapterCount(), OUTFITS.length - 1)];
}
function isZone2Open() {
  return isTestDone('ch01-test');
}

function clampMove(oldX, oldZ, newX, newZ) {
  // X always within zone width
  newX = Math.max(-10.5, Math.min(10.5, newX));

  // First, find what zone we're trying to be in
  // Doorway corridor: at any boundary z, x in [-1.7, 1.7], z within ±0.6 of boundary
  for (let i = 1; i < ZONE_COUNT; i++) {
    const bZ = ZONE_BOUNDS[i].startZ;
    if (Math.abs(newZ - bZ) <= 0.6) {
      // Near a boundary
      if (Math.abs(newX) <= 1.7) {
        // In doorway corridor
        if (isZoneIdxOpen(i)) {
          // Allow passage; clamp x to corridor width
          newX = Math.max(-1.7, Math.min(1.7, newX));
          return { x: newX, z: newZ };
        } else {
          // Locked: bounce back to whichever side player came from
          const oldIdx = zoneIndexAt(oldZ);
          if (oldIdx < i) newZ = bZ - 0.61;
          else newZ = bZ + 0.61;
          return { x: newX, z: newZ };
        }
      } else {
        // Near boundary but not in corridor: push into the zone we came from
        const oldIdx = zoneIndexAt(oldZ);
        if (oldIdx < i) newZ = Math.min(newZ, bZ - 0.61);
        else newZ = Math.max(newZ, bZ + 0.61);
        return { x: newX, z: newZ };
      }
    }
  }

  // Otherwise, in a normal zone interior
  const targetIdx = zoneIndexAt(newZ);
  if (targetIdx < 0) {
    // Out of all zones — clamp to entire range
    newZ = Math.max(ZONE_BOUNDS[0].startZ + 0.4,
      Math.min(ZONE_BOUNDS[ZONE_COUNT - 1].endZ - 0.4, newZ));
    return { x: newX, z: newZ };
  }
  if (!isZoneIdxOpen(targetIdx)) {
    // Trying to be inside a locked zone — push to last open zone end
    let lastOpen = targetIdx - 1;
    while (lastOpen >= 0 && !isZoneIdxOpen(lastOpen)) lastOpen--;
    if (lastOpen >= 0) newZ = ZONE_BOUNDS[lastOpen].endZ - 0.61;
  }
  return { x: newX, z: newZ };
}

// ─── Character builder ───────────────────────────────────────────────────────
function makeCharacter(look) {
  const g = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: look.skin || 0xfdd9b5 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: look.shirt });
  const pantsMat = new THREE.MeshStandardMaterial({ color: look.pants });
  const hairMat = new THREE.MeshStandardMaterial({ color: look.hair ?? 0x3e2723 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

  // Torso (slight emissive so silhouettes don't disappear in shadow).
  shirtMat.emissive = new THREE.Color(look.shirt);
  shirtMat.emissiveIntensity = 0.08;
  shirtMat.roughness = 0.85;
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.32), shirtMat);
  torso.position.y = 1.05; torso.castShadow = true; g.add(torso);

  // Accent stripe / scarf across the upper chest — recognisable per NPC.
  if (look.accent) {
    const accentMat = new THREE.MeshStandardMaterial({
      color: look.accent, emissive: look.accent, emissiveIntensity: 0.2, roughness: 0.6,
    });
    const accent = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.12, 0.34), accentMat);
    accent.position.y = 1.32;
    g.add(accent);
  }

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.12, 12), skinMat);
  neck.position.y = 1.5; g.add(neck);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 18, 14), skinMat);
  head.position.y = 1.66; head.castShadow = true; g.add(head);

  // Hair
  if (look.hairStyle !== 'bald' && look.hairStyle !== undefined) {
    const segY = look.hairStyle === 'long' ? Math.PI * 0.6 : Math.PI / 2;
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.225, 18, 14, 0, Math.PI * 2, 0, segY),
      hairMat,
    );
    hair.position.y = 1.66; g.add(hair);
    if (look.hairStyle === 'bun') {
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), hairMat);
      bun.position.set(0, 1.86, -0.05); g.add(bun);
    }
    if (look.hairStyle === 'long') {
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.32, 0.1), hairMat);
      back.position.set(0, 1.5, -0.16); g.add(back);
    }
  }

  // Glasses
  if (look.glasses) {
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const lensL = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 16), frameMat);
    lensL.rotation.y = Math.PI / 2;
    lensL.position.set(-0.07, 1.66, 0.2);
    g.add(lensL);
    const lensR = lensL.clone(); lensR.position.x = 0.07; g.add(lensR);
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.01), frameMat);
    bridge.position.set(0, 1.66, 0.21); g.add(bridge);
  }

  // Beard
  if (look.beard) {
    const beard = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.4), hairMat);
    beard.position.set(0, 1.6, 0.02); g.add(beard);
  }

  // Pants block
  const pants = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.3), pantsMat);
  pants.position.y = 0.59; g.add(pants);

  // Legs
  const legGeom = new THREE.BoxGeometry(0.2, 0.55, 0.24);
  const leftLeg = new THREE.Mesh(legGeom, pantsMat);
  leftLeg.position.set(-0.13, 0.27, 0); leftLeg.castShadow = true; g.add(leftLeg);
  const rightLeg = new THREE.Mesh(legGeom, pantsMat);
  rightLeg.position.set(0.13, 0.27, 0); rightLeg.castShadow = true; g.add(rightLeg);

  // Shoes
  const shoeGeom = new THREE.BoxGeometry(0.22, 0.08, 0.34);
  const leftShoe = new THREE.Mesh(shoeGeom, shoeMat);
  leftShoe.position.set(-0.13, -0.04, 0.04); g.add(leftShoe);
  const rightShoe = new THREE.Mesh(shoeGeom, shoeMat);
  rightShoe.position.set(0.13, -0.04, 0.04); g.add(rightShoe);

  // Arms
  const armGeom = new THREE.BoxGeometry(0.16, 0.6, 0.22);
  const leftArm = new THREE.Mesh(armGeom, shirtMat);
  leftArm.position.set(-0.38, 1.1, 0); leftArm.castShadow = true; g.add(leftArm);
  const rightArm = new THREE.Mesh(armGeom, shirtMat);
  rightArm.position.set(0.38, 1.1, 0); rightArm.castShadow = true; g.add(rightArm);

  // Hands
  const handGeom = new THREE.SphereGeometry(0.09, 10, 8);
  const leftHand = new THREE.Mesh(handGeom, skinMat);
  leftHand.position.set(-0.38, 0.78, 0.03); g.add(leftHand);
  const rightHand = new THREE.Mesh(handGeom, skinMat);
  rightHand.position.set(0.38, 0.78, 0.03); g.add(rightHand);

  // Prop
  if (look.prop) {
    const prop = new THREE.Group();
    if (look.prop === 'clipboard') {
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.02),
        new THREE.MeshStandardMaterial({ color: 0xeeeeee }));
      const clip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.025),
        new THREE.MeshStandardMaterial({ color: 0x888888 }));
      clip.position.y = 0.13; board.add(clip);
      prop.add(board);
    } else if (look.prop === 'tablet') {
      const tab = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x111111 }));
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.16),
        new THREE.MeshBasicMaterial({ color: 0x4fc3f7 }));
      screen.position.z = 0.012; tab.add(screen);
      prop.add(tab);
    } else if (look.prop === 'mug') {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.12, 12),
        new THREE.MeshStandardMaterial({ color: 0xffffff }));
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 8, 12),
        new THREE.MeshStandardMaterial({ color: 0xffffff }));
      handle.rotation.y = Math.PI / 2;
      handle.position.x = 0.07;
      m.add(handle);
      prop.add(m);
    } else if (look.prop === 'book') {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.18),
        new THREE.MeshStandardMaterial({ color: 0x6d4c41 }));
      const pages = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.045, 0.165),
        new THREE.MeshStandardMaterial({ color: 0xfff8e1 }));
      pages.position.y = 0.001; b.add(pages);
      b.rotation.x = -Math.PI / 2;
      prop.add(b);
    } else if (look.prop === 'badge') {
      const lan = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x1a237e }));
      const badge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.01),
        new THREE.MeshStandardMaterial({ color: 0xffffff }));
      lan.position.set(0, 1.3, 0.18);
      badge.position.set(0, 1.05, 0.18);
      g.add(lan); g.add(badge);
    }
    prop.position.set(0.42, 0.78, 0.18);
    g.add(prop);
  }

  g.userData.parts = { leftLeg, rightLeg, leftArm, rightArm, head, torso };
  // Stash look on the group so idle animations can read look.gesture etc.
  g.userData.look = look;
  // Procedural cartoon face on the head's front. Reads in any lighting.
  g.userData.face = attachFace(g, head, look);
  return g;
}

// ─── Sprite labels ───────────────────────────────────────────────────────────
function makeLabelSprite(text, fg = '#fff', bg = 'rgba(26,39,68,0.92)') {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  const r = 24, w = c.width, h = c.height;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(w - r, 0); ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r); ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(r, h); ctx.quadraticCurveTo(0, h, 0, h - r);
  ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = fg;
  ctx.font = 'bold 50px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sprite.scale.set(2.0, 0.5, 1);
  return sprite;
}

function makeWallSign(text, w = 8, h = 2, bg = '#1a2744', fg = '#c9a44c') {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = fg;
  ctx.font = 'bold 130px serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, c.width / 2, c.height / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
}

function makePoster(title, subtitle, w = 1.6, h = 2.2, accent = '#c9a44c') {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 768;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, '#1a2744'); grad.addColorStop(1, '#2d4263');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = accent;
  ctx.font = 'bold 70px serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(title, c.width / 2, c.height * 0.4);
  ctx.fillStyle = '#fff';
  ctx.font = '34px sans-serif';
  ctx.fillText(subtitle, c.width / 2, c.height * 0.55);
  ctx.strokeStyle = accent; ctx.lineWidth = 8;
  ctx.strokeRect(20, 20, c.width - 40, c.height - 40);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
}

// ─── Decor builders ──────────────────────────────────────────────────────────
function buildChair(x, z, ry = 0, color = 0x37474f) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.6), mat);
  seat.position.y = 0.5; seat.castShadow = true; g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.1), mat);
  back.position.set(0, 0.85, -0.25); g.add(back);
  const legGeom = new THREE.BoxGeometry(0.06, 0.5, 0.06);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  [[-0.25,-0.25],[0.25,-0.25],[-0.25,0.25],[0.25,0.25]].forEach(([lx,lz]) => {
    const l = new THREE.Mesh(legGeom, legMat);
    l.position.set(lx, 0.25, lz); g.add(l);
  });
  g.position.set(x, 0, z); g.rotation.y = ry;
  return g;
}

function buildDesk(x, z, ry = 0, w = 1.6, d = 0.8, color = 0x6b4f3a) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color });
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), mat);
  top.position.y = 0.75; top.castShadow = true; top.receiveShadow = true; g.add(top);
  const legGeom = new THREE.BoxGeometry(0.08, 0.75, 0.08);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x3e2723 });
  const dx = w / 2 - 0.1, dz = d / 2 - 0.1;
  [[-dx,-dz],[dx,-dz],[-dx,dz],[dx,dz]].forEach(([lx,lz]) => {
    const l = new THREE.Mesh(legGeom, legMat);
    l.position.set(lx, 0.375, lz); g.add(l);
  });
  g.position.set(x, 0, z); g.rotation.y = ry;
  return g;
}

function buildMonitor(x, z, ry = 0, screenColor = 0x4fc3f7) {
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
  return g;
}

function buildPlant(x, z) {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.25, 14),
    new THREE.MeshStandardMaterial({ color: 0x6d4c41 }));
  pot.position.y = 0.13; pot.castShadow = true; g.add(pot);
  const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x2e7d32 }));
  leaves.position.y = 0.55; leaves.castShadow = true;
  leaves.scale.set(1, 1.1, 1); g.add(leaves);
  g.position.set(x, 0, z);
  return g;
}

function buildWaterCooler(x, z) {
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
  return g;
}

function buildCouch(x, z, ry = 0) {
  const g = new THREE.Group();
  // Fabric — high roughness, no metalness.
  const mat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.95 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 0.8), mat);
  seat.position.y = 0.4; seat.castShadow = true; g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 0.2), mat);
  back.position.set(0, 0.75, -0.3); g.add(back);
  const armGeom = new THREE.BoxGeometry(0.2, 0.6, 0.8);
  const lA = new THREE.Mesh(armGeom, mat); lA.position.set(-1.1, 0.55, 0); g.add(lA);
  const rA = new THREE.Mesh(armGeom, mat); rA.position.set(1.1, 0.55, 0); g.add(rA);
  g.position.set(x, 0, z); g.rotation.y = ry;
  return g;
}

function buildFilingCabinet(x, z, ry = 0) {
  const g = new THREE.Group();
  // Painted metal — moderate metalness so it catches the directional.
  const mat = new THREE.MeshStandardMaterial({ color: 0x90a4ae, metalness: 0.6, roughness: 0.45 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 0.5), mat);
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
  return g;
}

function buildBookshelf(x, z, ry = 0, w = 2.2) {
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
  return g;
}

function buildTable(x, z, ry = 0, w = 2.2) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x6d4c41 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, 1.2), mat);
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
  return g;
}

function buildLamp(x, z) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x37474f });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 12), mat);
  base.position.y = 0.82; g.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 8), mat);
  pole.position.y = 1.03; g.add(pole);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.16, 12, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xfff59d, side: THREE.DoubleSide }));
  shade.position.y = 1.3; g.add(shade);
  const point = new THREE.PointLight(0xfff59d, 0.6, 4);
  point.position.set(0, 1.2, 0); g.add(point);
  g.position.set(x, 0, z);
  return g;
}

// ─── CEO portrait ────────────────────────────────────────────────────────────
let ceoHearts = null;

// Friendly cartoon CEO portrait — flat color blocks, large round eyes,
// soft smile, matches the blocky in-game style. No realism / no manga.
function drawCeoPortrait(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const X = (n) => n * W;
  const Y = (n) => n * H;

  // Background — warm gold gradient with subtle dots
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#f4d2a3');
  bg.addColorStop(1, '#c98c52');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  // Soft halftone dots
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H * 0.85;
    const r = 4 + Math.random() * 6;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Hair back layer (warm brown)
  ctx.fillStyle = '#3e2723';
  ctx.beginPath();
  ctx.ellipse(X(0.5), Y(0.46), W * 0.30, H * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hair side waves
  ctx.beginPath();
  ctx.moveTo(X(0.20), Y(0.4));
  ctx.bezierCurveTo(X(0.18), Y(0.6), X(0.28), Y(0.7), X(0.32), Y(0.62));
  ctx.lineTo(X(0.36), Y(0.52));
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(X(0.80), Y(0.4));
  ctx.bezierCurveTo(X(0.82), Y(0.6), X(0.72), Y(0.7), X(0.68), Y(0.62));
  ctx.lineTo(X(0.64), Y(0.52));
  ctx.closePath();
  ctx.fill();

  // Body / blazer (deep navy)
  ctx.fillStyle = '#1a2744';
  ctx.beginPath();
  ctx.moveTo(X(0.05), Y(1.0));
  ctx.lineTo(X(0.05), Y(0.85));
  ctx.bezierCurveTo(X(0.20), Y(0.72), X(0.40), Y(0.66), X(0.50), Y(0.66));
  ctx.bezierCurveTo(X(0.60), Y(0.66), X(0.80), Y(0.72), X(0.95), Y(0.85));
  ctx.lineTo(X(0.95), Y(1.0));
  ctx.closePath();
  ctx.fill();
  // White shirt v-neck
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(X(0.42), Y(0.72));
  ctx.lineTo(X(0.50), Y(0.92));
  ctx.lineTo(X(0.58), Y(0.72));
  ctx.bezierCurveTo(X(0.55), Y(0.71), X(0.45), Y(0.71), X(0.42), Y(0.72));
  ctx.closePath();
  ctx.fill();
  // Gold lapel pin
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath();
  ctx.arc(X(0.40), Y(0.80), 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff8c4';
  ctx.beginPath();
  ctx.arc(X(0.398), Y(0.798), 4, 0, Math.PI * 2);
  ctx.fill();

  // Face — big rounded shape, friendly proportions
  const cx = X(0.5), cy = Y(0.42);
  ctx.fillStyle = '#fde0c5';
  ctx.beginPath();
  ctx.ellipse(cx, cy, W * 0.18, H * 0.20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair front (bangs swept right)
  ctx.fillStyle = '#3e2723';
  ctx.beginPath();
  ctx.moveTo(X(0.32), Y(0.32));
  ctx.bezierCurveTo(X(0.40), Y(0.20), X(0.60), Y(0.20), X(0.68), Y(0.32));
  ctx.bezierCurveTo(X(0.62), Y(0.36), X(0.50), Y(0.32), X(0.42), Y(0.36));
  ctx.bezierCurveTo(X(0.36), Y(0.34), X(0.34), Y(0.34), X(0.32), Y(0.32));
  ctx.closePath();
  ctx.fill();

  // Eyes — large, round, friendly (matches the in-game face system)
  drawCeoEye(ctx, X(0.42), Y(0.43));
  drawCeoEye(ctx, X(0.58), Y(0.43));

  // Eyebrows — soft arched
  ctx.strokeStyle = '#2e1d0f';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(X(0.36), Y(0.36));
  ctx.quadraticCurveTo(X(0.42), Y(0.33), X(0.46), Y(0.36));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(X(0.54), Y(0.36));
  ctx.quadraticCurveTo(X(0.58), Y(0.33), X(0.64), Y(0.36));
  ctx.stroke();

  // Nose — single small line
  ctx.strokeStyle = '#c79a78';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(X(0.50), Y(0.46));
  ctx.lineTo(X(0.51), Y(0.50));
  ctx.stroke();

  // Cheeks (round blush dots)
  ctx.fillStyle = 'rgba(255,160,180,0.6)';
  ctx.beginPath();
  ctx.arc(X(0.39), Y(0.50), 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(X(0.61), Y(0.50), 14, 0, Math.PI * 2);
  ctx.fill();

  // Mouth — gentle smile
  ctx.strokeStyle = '#a0263c';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(X(0.50), Y(0.54), 22, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
  // Subtle lip color
  ctx.strokeStyle = '#c2456b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(X(0.50), Y(0.541), 22, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();

  // Earrings (small gold dots)
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath();
  ctx.arc(X(0.32), Y(0.46), 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(X(0.68), Y(0.46), 5, 0, Math.PI * 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = '#3e2723';
  ctx.lineWidth = 8;
  ctx.strokeRect(0, 0, W, H);
}

// Big round friendly eye — white sphere + dark iris + sparkle dot.
function drawCeoEye(ctx, cx, cy) {
  // White
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1a1010';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 22, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Iris — dark teal so it's not too aggressive
  ctx.fillStyle = '#2c5b6b';
  ctx.beginPath();
  ctx.ellipse(cx + 1, cy + 1, 11, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // Pupil
  ctx.fillStyle = '#0d0508';
  ctx.beginPath();
  ctx.ellipse(cx + 1, cy + 2, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Sparkle
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(cx - 4, cy - 4, 4, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 6, cy + 6, 1.7, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Lash
  ctx.strokeStyle = '#0d0508';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 18, cy - 14);
  ctx.lineTo(cx - 24, cy - 22);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 18, cy - 14);
  ctx.lineTo(cx + 24, cy - 22);
  ctx.stroke();
}

function buildCeoPortrait(targetScene) {
  const allDone = window.CURRICULUM?.every(ch =>
    window.Progress.isTestPassed(getProgress(), ch.practicalTest.id)
  );

  const group = new THREE.Group();

  // Outer wood frame
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 2.6, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x4e342e, metalness: 0.2, roughness: 0.5 })
  );
  frame.position.z = -0.04;
  group.add(frame);

  // Gold inner trim
  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 2.4, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xc9a44c, metalness: 0.7, roughness: 0.25 })
  );
  trim.position.z = 0;
  group.add(trim);

  // Manga-style portrait drawn on canvas (no external image needed)
  const portraitCanvas = document.createElement('canvas');
  portraitCanvas.width = 768; portraitCanvas.height = 1024;
  drawCeoPortrait(portraitCanvas);
  const portraitTex = new THREE.CanvasTexture(portraitCanvas);
  portraitTex.colorSpace = THREE.SRGBColorSpace;
  portraitTex.anisotropy = 8;
  const photo = new THREE.Mesh(
    new THREE.PlaneGeometry(1.85, 2.25),
    new THREE.MeshBasicMaterial({ map: portraitTex })
  );
  photo.position.z = 0.06;
  group.add(photo);

  // Name plaque
  const plaque = makeLabelSprite(
    allDone ? '♥  Maya Kedash · CEO  ♥' : 'Maya Kedash — CEO',
    '#fff',
    allDone ? 'rgba(180,30,80,0.95)' : 'rgba(26,39,68,0.95)'
  );
  plaque.scale.set(2.6, 0.55, 1);
  plaque.position.set(0, -1.55, 0.12);
  group.add(plaque);

  // Floating hearts when all chapters complete (CEO has fallen for the player)
  if (allDone) {
    ceoHearts = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const h = makeLabelSprite('♥', '#ff3366', 'rgba(255,255,255,0)');
      h.scale.set(0.5, 0.5, 1);
      h.userData.phase = i / 8;
      ceoHearts.add(h);
    }
    group.add(ceoHearts);
  }

  // Position centered on back wall, above reception desk
  group.position.set(0, 2.0, -10.86);
  targetScene.add(group);
  return group;
}

// ─── World construction ──────────────────────────────────────────────────────
function buildWorld() {
  scene = new THREE.Scene();
  // Skydome replaces the previous flat scene.background. Fog still set
  // per zone by LightingManager / SkyDome together so geometry doesn't
  // pop into existence at the boundary.
  scene.background = null;
  scene.fog = new THREE.Fog(0xeaf3ff, 30, 70);

  // All scene lighting is now driven by LightingManager + per-zone presets.
  // See play/lighting/zone-presets.js to author/tune zones (incl. 3-16).
  lighting = new LightingManager(scene, { mobile: isMobile() });

  // Skydome — gradient + sun. Per-zone preset applied alongside lighting.
  skyDome = new SkyDome(scene);
  skyDome.applyPreset(getSkyPresetForZone(0).sky);

  // ─── Zone 1 ground (office) ───
  const officeFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 22),
    new THREE.MeshStandardMaterial({ color: 0x9aa9bc }),
  );
  officeFloor.rotation.x = -Math.PI / 2;
  officeFloor.position.set(0, 0, 0);
  officeFloor.receiveShadow = true;
  scene.add(officeFloor);

  // Carpet runner
  const runner = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 18),
    new THREE.MeshStandardMaterial({
      color: 0xc9a44c, metalness: 0.85, roughness: 0.18,
    }),
  );
  runner.rotation.x = -Math.PI / 2;
  runner.position.set(0, 0.001, -1);
  scene.add(runner);

  // Office walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf4ecd8 });
  const wallH = 3.8;
  function wall(w, h, d, x, y, z, ry = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    m.position.set(x, y, z); m.rotation.y = ry;
    m.castShadow = true; m.receiveShadow = true;
    scene.add(m);
    return m;
  }
  // back, left, right
  wall(22, wallH, 0.3, 0, wallH/2, -11);
  wall(0.3, wallH, 22, -11, wallH/2, 0);
  wall(0.3, wallH, 22, 11, wallH/2, 0);
  // front split with doorway at center (z = 11)
  wall(8.5, wallH, 0.3, -6.75, wallH/2, 11);
  wall(8.5, wallH, 0.3, 6.75, wallH/2, 11);
  wall(4, 1.2, 0.3, 0, wallH - 0.6, 11);

  // CEO portrait on back wall (replaces wall logo) — real image, not shapes
  buildCeoPortrait(scene);

  // Wall sign (smaller, off to the side)
  const logo = makeWallSign('KEDASH CORP', 4, 0.9);
  logo.position.set(-7.5, 3.2, -10.84);
  scene.add(logo);

  // Posters on side walls
  const p1 = makePoster('GROW', 'with Kedash');
  p1.position.set(-10.83, 2.0, -3); p1.rotation.y = Math.PI / 2; scene.add(p1);
  const p2 = makePoster('SHIP IT', 'every Friday');
  p2.position.set(10.83, 2.0, -3); p2.rotation.y = -Math.PI / 2; scene.add(p2);
  const p3 = makePoster('LEARN', 'every day');
  p3.position.set(-10.83, 2.0, 5); p3.rotation.y = Math.PI / 2; scene.add(p3);

  // Reception desk
  const desk = new THREE.Mesh(
    new THREE.BoxGeometry(3, 1.0, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x6b4f3a }),
  );
  desk.position.set(0, 0.5, -8);
  desk.castShadow = true; desk.receiveShadow = true;
  scene.add(desk);

  // Decor
  scene.add(buildPlant(-10.2, -10.2));
  scene.add(buildPlant(10.2, -10.2));
  scene.add(buildPlant(-10.2, 9.5));
  scene.add(buildPlant(10.2, 9.5));
  scene.add(buildWaterCooler(-9.5, -2));
  scene.add(buildCouch(-8.5, 5, Math.PI / 2));
  scene.add(buildCouch(8.5, 5, -Math.PI / 2));

  // IT bench (Marcus area, x=-6 z=-3)
  scene.add(buildDesk(-7.5, -3, Math.PI / 2, 1.6, 0.8));
  scene.add(buildMonitor(-7.5, -3.4, Math.PI / 2));
  scene.add(buildMonitor(-7.5, -2.6, Math.PI / 2, 0x66bb6a));
  scene.add(buildChair(-6.4, -3));

  // Aisha area (x=6 z=-3)
  scene.add(buildDesk(7.5, -3, -Math.PI / 2, 1.6, 0.8));
  scene.add(buildMonitor(7.5, -3, -Math.PI / 2, 0xff8a65));
  scene.add(buildChair(6.4, -3, Math.PI));

  // Kenji area (x=-6 z=3) — multiple monitors / demo
  scene.add(buildDesk(-7.5, 3, Math.PI / 2, 2.2, 0.8));
  scene.add(buildMonitor(-7.5, 2.4, Math.PI / 2, 0xab47bc));
  scene.add(buildMonitor(-7.5, 3.2, Math.PI / 2, 0x29b6f6));
  scene.add(buildMonitor(-7.5, 4.0, Math.PI / 2, 0xffca28));
  scene.add(buildChair(-6.4, 3));

  // Diana area (x=6 z=3) — filing cabinets
  scene.add(buildFilingCabinet(7.6, 2));
  scene.add(buildFilingCabinet(7.6, 3));
  scene.add(buildFilingCabinet(7.6, 4));
  scene.add(buildChair(6.2, 3, Math.PI));

  // Door from zone 1 → zone 2 (gated by ch01 test)
  registerDoor(scene, 11, 'ch01', 'Knowledge Library');

  // ─── Zone 2 — Knowledge Library ──────────────────────────────────────────
  // Library starts at z = 11.5 going negative (since we use z=-22 for NPC positions, library is at z=-30 to -10)
  // Wait — we positioned zone-2 NPCs at z around -22 to -28, that's BEHIND the back wall of zone 1.
  // Restructure: zone 1 is z=-11..11 and zone 2 is z=-30..-12, accessed via the doorway at z=11... that doesn't match.
  // Fix: relocate zone 2 to be on the FAR SIDE of the door — z > 11.
  //   But our NPC positions are negative. Let me just remap: NPC z in NPCS for zone 2 are stored as -22, -22, -28, -27.
  //   We'll add 35 to them for actual scene placement (so -22 -> 13, -28 -> 7, etc.)
  //   That keeps the data clean. We do that in spawnNPC().

  // Build library walls (at z = 12 to 32)
  const libFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 22),
    new THREE.MeshStandardMaterial({ color: 0x8d6e63 }),
  );
  libFloor.rotation.x = -Math.PI / 2;
  libFloor.position.set(0, 0, 22);
  libFloor.receiveShadow = true;
  scene.add(libFloor);

  // Library walls — back wall split with doorway to zone 3
  wall(8.5, wallH, 0.3, -6.75, wallH/2, 33);
  wall(8.5, wallH, 0.3,  6.75, wallH/2, 33);
  wall(4, 1.2, 0.3, 0, wallH-0.6, 33);
  wall(0.3, wallH, 22, -11, wallH/2, 22);
  wall(0.3, wallH, 22, 11, wallH/2, 22);

  // Library sign on side wall
  const libSign = makeWallSign('KNOWLEDGE LIBRARY', 8, 1.6, '#3e2723', '#d4af37');
  libSign.position.set(-10.83, 2.8, 22);
  libSign.rotation.y = Math.PI / 2;
  scene.add(libSign);

  // Bookshelves along walls
  scene.add(buildBookshelf(-10.5, 14, Math.PI / 2));
  scene.add(buildBookshelf(-10.5, 18, Math.PI / 2));
  scene.add(buildBookshelf(-10.5, 26, Math.PI / 2));
  scene.add(buildBookshelf(10.5, 14, -Math.PI / 2));
  scene.add(buildBookshelf(10.5, 18, -Math.PI / 2));
  scene.add(buildBookshelf(10.5, 26, -Math.PI / 2));

  // Reading tables
  scene.add(buildTable(0, 16));
  scene.add(buildTable(0, 22));
  scene.add(buildChair(-1.6, 16, Math.PI / 2, 0x4e342e));
  scene.add(buildChair(1.6, 16, -Math.PI / 2, 0x4e342e));
  scene.add(buildChair(-1.6, 22, Math.PI / 2, 0x4e342e));
  scene.add(buildChair(1.6, 22, -Math.PI / 2, 0x4e342e));

  scene.add(buildLamp(0, 16));
  scene.add(buildLamp(0, 22));

  scene.add(buildPlant(-9.8, 13));
  scene.add(buildPlant(9.8, 13));
  scene.add(buildPlant(-9.8, 30));
  scene.add(buildPlant(9.8, 30));

  // Door from zone 2 → zone 3
  registerDoor(scene, 33, 'ch02', 'CLAUDE.md Atrium');

  // ─── Zones 3 - 16 (generated from ZONE_THEMES) ──────────────────────────────
  for (let zoneIdx = 2; zoneIdx < ZONE_COUNT; zoneIdx++) {
    buildGenericZone(zoneIdx);
  }

  // ─── Ceilings + crown molding + fixtures (architectural finish) ────────────
  try { buildReceptionCeiling(scene); } catch (e) { console.warn('reception ceiling failed', e); }
  try { buildLibraryCeiling(scene); } catch (e) { console.warn('library ceiling failed', e); }

  // ─── Depth: windows + skyline + library arched window ──────────────────────
  // Note: the planned hallway-peek feature was skipped — see
  // NIGHT_RUN_NOTES_ENVIRONMENT.md for why (it conflicted with the
  // existing room layout). Windows + skyline + Library doorway already
  // give plenty of depth signal.
  try { receptionWindows = buildReceptionWindows(scene); } catch (e) { console.warn('reception windows failed', e); }
  try { libraryWindow    = buildLibraryArchedWindow(scene); } catch (e) { console.warn('library window failed', e); }

  // ─── Decoration density passes ──────────────────────────────────────────────
  decoTickers = [];
  try { decorateReception(scene, decoTickers); } catch (e) { console.warn('reception deco failed', e); }
  try { decorateLibrary(scene, decoTickers);   } catch (e) { console.warn('library deco failed', e); }
  try { buildReceptionCenterpiece(scene, decoTickers); } catch (e) { console.warn('centerpiece failed', e); }
}

// ─── Generic zone builder (used for chapters 3-16) ───────────────────────────
function registerDoor(targetScene, atZ, gateChId, nextTitle) {
  const passed = isTestDone(`${gateChId}-test`);
  const doorMat = new THREE.MeshStandardMaterial({
    color: passed ? 0x4caf50 : 0x5d4037,
    metalness: 0.3, roughness: 0.6,
  });
  const door = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.6, 0.2), doorMat);
  door.position.set(0, 1.3, atZ - 0.01);
  targetScene.add(door);
  const label = makeLabelSprite(
    passed ? `${nextTitle} — Open` : `${nextTitle} — Locked`,
    '#fff', passed ? 'rgba(34,139,34,0.92)' : 'rgba(120,40,40,0.92)',
  );
  label.scale.set(3.0, 0.7, 1);
  label.position.set(0, 3.4, atZ + 0.05);
  targetScene.add(label);
  zoneDoors.push({ mesh: door, label, gateChapter: gateChId, nextTitle, lastOpen: passed });
}

function buildGenericZone(idx) {
  const theme = ZONE_THEMES[idx];
  if (!theme) return;
  const cZ = idx * 22;
  const startZ = cZ - 11;
  const endZ = cZ + 11;
  const wallH = 3.8;

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 22),
    new THREE.MeshStandardMaterial({
      color: theme.floor, metalness: theme.metal, roughness: Math.max(0.15, 0.85 - theme.metal),
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, cZ);
  floor.receiveShadow = true;
  scene.add(floor);

  // Side walls
  const wallMat = new THREE.MeshStandardMaterial({
    color: theme.wall, metalness: theme.metal * 0.4, roughness: 0.7,
  });
  function w(width, height, depth, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMat);
    m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    scene.add(m);
    return m;
  }
  w(0.3, wallH, 22, -11, wallH / 2, cZ);
  w(0.3, wallH, 22,  11, wallH / 2, cZ);

  // Front wall (split with doorway), or solid back wall if last zone
  const isLast = idx === ZONE_COUNT - 1;
  if (!isLast) {
    w(8.5, wallH, 0.3, -6.75, wallH/2, endZ);
    w(8.5, wallH, 0.3,  6.75, wallH/2, endZ);
    w(4, 1.2, 0.3, 0, wallH - 0.6, endZ);
    const nextTheme = ZONE_THEMES[idx + 1];
    const nextTitle = nextTheme?.title || `Chapter ${idx + 2}`;
    registerDoor(scene, endZ, ZONE_BOUNDS[idx].chapterId, nextTitle);
  } else {
    // Solid back wall for the last zone
    w(22, wallH, 0.3, 0, wallH/2, endZ);
    // Capstone trophy plaque
    const trophy = makeWallSign('🏆 CAPSTONE COMPLETE 🏆', 8, 1.6, '#1a2744', '#ffd700');
    trophy.position.set(0, 2.8, endZ - 0.16);
    scene.add(trophy);
  }

  // Title sign on left wall
  const sign = makeWallSign(theme.title.toUpperCase(), 7, 1.4, '#1a2744', theme.accent);
  sign.position.set(-10.83, 2.6, cZ);
  sign.rotation.y = Math.PI / 2;
  scene.add(sign);

  // Generic decor
  scene.add(buildTable(0, cZ));
  scene.add(buildPlant(-9.5, startZ + 1.5));
  scene.add(buildPlant( 9.5, startZ + 1.5));
  scene.add(buildPlant(-9.5, endZ - 1.5));
  scene.add(buildPlant( 9.5, endZ - 1.5));
  scene.add(buildLamp(0, cZ));

  // Themed accent strip on floor — gets shinier with idx
  const accentColor = parseInt(theme.accent.replace('#',''), 16);
  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 18),
    new THREE.MeshStandardMaterial({
      color: accentColor, metalness: 0.6, roughness: 0.2, emissive: accentColor, emissiveIntensity: theme.metal * 0.6,
    }),
  );
  strip.rotation.x = -Math.PI / 2;
  strip.position.set(0, 0.002, cZ);
  scene.add(strip);
}

// ─── Player + NPCs ───────────────────────────────────────────────────────────
function addPlayerAccessories(group, tier) {
  // Tier 1+: name badge / lanyard
  if (tier >= 1) {
    const lan = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.36, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x1a237e }));
    lan.position.set(0, 1.25, 0.18);
    group.add(lan);
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.012),
      new THREE.MeshStandardMaterial({ color: 0xffffff }));
    badge.position.set(0, 1.0, 0.19);
    group.add(badge);
  }
  // Tier 2+: tie
  if (tier >= 2) {
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.42, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xb71c1c, metalness: 0.1, roughness: 0.6 }));
    tie.position.set(0, 1.05, 0.18);
    group.add(tie);
    const knot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x7f1313 }));
    knot.position.set(0, 1.32, 0.17);
    group.add(knot);
  }
  // Tier 3+: watch (small block on left wrist)
  if (tier >= 3) {
    const watch = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x424242, metalness: 0.7, roughness: 0.3 }));
    watch.position.set(-0.38, 0.84, 0.06);
    group.add(watch);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.04),
      new THREE.MeshBasicMaterial({ color: 0xfff59d }));
    face.position.set(-0.38, 0.84, 0.082);
    group.add(face);
  }
  // Tier 4+: vest (overlay on torso)
  if (tier >= 4) {
    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.78, 0.36),
      new THREE.MeshStandardMaterial({ color: 0x263238, metalness: 0.3, roughness: 0.5 }));
    vest.position.set(0, 1.05, 0);
    group.add(vest);
    // gold buttons down the front
    for (let i = 0; i < 3; i++) {
      const btn = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0xc9a44c, metalness: 0.8, roughness: 0.2 }));
      btn.position.set(0, 1.25 - i * 0.18, 0.19);
      group.add(btn);
    }
  }
  // Tier 5+: glasses
  if (tier >= 5) {
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.6, roughness: 0.3 });
    const lensL = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 16), frameMat);
    lensL.rotation.y = Math.PI / 2;
    lensL.position.set(-0.07, 1.66, 0.2);
    group.add(lensL);
    const lensR = lensL.clone(); lensR.position.x = 0.07; group.add(lensR);
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.01), frameMat);
    bridge.position.set(0, 1.66, 0.21); group.add(bridge);
  }
  // Tier 6+: gold necklace
  if (tier >= 6) {
    const chain = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.012, 8, 32),
      new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.1 }));
    chain.rotation.x = Math.PI / 2;
    chain.position.set(0, 1.32, 0.04);
    chain.scale.set(1, 0.65, 1);
    group.add(chain);
    const pendant = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.1 }));
    pendant.position.set(0, 1.18, 0.18);
    group.add(pendant);
  }
  // Tier 7: lapel pin + sparkly halo crown
  if (tier >= 7) {
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0xff4081, metalness: 0.5, roughness: 0.2, emissive: 0x331122 }));
    pin.position.set(-0.18, 1.28, 0.18);
    group.add(pin);
    // Halo
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.022, 12, 32),
      new THREE.MeshStandardMaterial({ color: 0xffeb3b, metalness: 0.8, roughness: 0.2, emissive: 0x222200 }));
    halo.position.set(0, 1.95, 0);
    halo.rotation.x = Math.PI / 2;
    group.add(halo);
    group.userData.halo = halo;
  }
}

function buildPlayer() {
  const o = getOutfit();
  const tier = getCompletedChapterCount();
  const cust = loadCustomization();
  player = makeCharacter({
    skin: cust.skin, hair: cust.hairColor, hairStyle: 'short',
    shirt: o.shirt, pants: o.pants, glasses: false, prop: null,
    face: cust.face, expression: 'happy',
  });
  addPlayerAccessories(player, tier);

  let startX = 0, startZ = 5;
  try {
    const saved = JSON.parse(sessionStorage.getItem('ccq_play_pos') || 'null');
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.z)) {
      startX = saved.x; startZ = saved.z;
    }
  } catch {}
  player.position.set(startX, 0, startZ);
  player.rotation.y = Math.PI; // face north (toward Linda) by default
  player.userData.velocityY = 0;
  player.userData.grounded = true;
  scene.add(player);

  const tierTag = makeLabelSprite(o.label, '#1a2744', 'rgba(201,164,76,0.95)');
  tierTag.position.set(0, 2.4, 0);
  player.add(tierTag);
}

function spawnNPC(npcDef) {
  const mesh = makeCharacter(npcDef.look);
  mesh.position.set(npcDef.pos[0], 0, npcDef.pos[1]);
  mesh.rotation.y = npcDef.face;
  mesh.userData.npc = npcDef;
  scene.add(mesh);

  const tag = makeLabelSprite(`${npcDef.portrait} ${npcDef.name}`);
  tag.position.set(0, 2.45, 0);
  tag.scale.set(2.6, 0.55, 1);
  mesh.add(tag);

  npcMeshes.push(mesh);
}

function buildNPCs() {
  npcMeshes = [];
  // Hand-written NPCs for chapters 1 + 2
  NPCS.forEach(spawnNPC);
  // Auto-generated NPCs for chapters 3-16
  for (let i = 2; i < ZONE_COUNT; i++) {
    generateChapterNPCs(i).forEach(spawnNPC);
  }
}

// ─── Renderer & camera ───────────────────────────────────────────────────────
function setupRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: !isMobile() });
  renderer.setPixelRatio(effectivePixelRatio());
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Pin to legacy lighting so our preset intensity values (calibrated for
  // pre-r163 lighting) render predictably. Tone-mapping gives bloom +
  // strong key lights room to breathe without clipping.
  renderer.useLegacyLights = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
  camera.position.set(0, 5, 12);
  camera.lookAt(0, 1, 0);
  resize();
}
function resize() {
  if (!renderer || !container) return;
  const w = container.clientWidth, h = container.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  if (postfx) postfx.resize(w, h);
}

// ─── Input ───────────────────────────────────────────────────────────────────
function setupInput() {
  keyDownListener = (e) => {
    if (inputLocked) return;
    keys[e.key.toLowerCase()] = true;
    if (e.key === 'e' || e.key === 'E') tryInteract();
    if (e.key === ' ' || e.code === 'Space') {
      jumpRequested = true;
      e.preventDefault();
    }
  };
  keyUpListener = (e) => { keys[e.key.toLowerCase()] = false; };
  window.addEventListener('keydown', keyDownListener);
  window.addEventListener('keyup', keyUpListener);

  const j = document.getElementById('play-joystick');
  const t = document.getElementById('play-joystick-thumb');
  let active = false, baseX = 0, baseY = 0;
  const max = 50;
  const onStart = (e) => {
    if (inputLocked) return;
    active = true;
    const rect = j.getBoundingClientRect();
    baseX = rect.left + rect.width / 2; baseY = rect.top + rect.height / 2;
    onMove(e);
  };
  const onMove = (e) => {
    if (!active) return;
    const tt = (e.touches ? e.touches[0] : e);
    let dx = tt.clientX - baseX, dy = tt.clientY - baseY;
    const dist = Math.hypot(dx, dy);
    if (dist > max) { dx = (dx / dist) * max; dy = (dy / dist) * max; }
    t.style.transform = `translate(${dx}px, ${dy}px)`;
    touchVec.x = dx / max; touchVec.y = dy / max;
  };
  const onEnd = () => {
    active = false; touchVec.x = 0; touchVec.y = 0;
    t.style.transform = 'translate(0,0)';
  };
  j.addEventListener('touchstart', onStart, { passive: true });
  j.addEventListener('touchmove', onMove, { passive: true });
  j.addEventListener('touchend', onEnd);
  j.addEventListener('touchcancel', onEnd);

  document.getElementById('play-prompt').addEventListener('click', () => { playUi('click'); tryInteract(); });
  document.getElementById('play-back-btn').addEventListener('click', () => {
    playUi('cancel');
    window.App.navigate('dashboard');
  });
  document.getElementById('play-interact-btn').addEventListener('click', () => { playUi('click'); tryInteract(); });
  document.getElementById('play-jump-btn')?.addEventListener('click', () => {
    if (!inputLocked) jumpRequested = true;
  });
  // Tap inside dialogue panel: if typewriter is running, fast-forward to end.
  if (dialogueEl) {
    dialogueEl.addEventListener('click', (e) => {
      if (currentTypewriter && !e.target.closest('button')) {
        currentTypewriter.cancel();
        currentTypewriter = null;
      }
    });
  }

  resizeListener = () => resize();
  window.addEventListener('resize', resizeListener);
}

// ─── Dialogue & intro ────────────────────────────────────────────────────────
function showIntro() {
  const seen = localStorage.getItem('ccq_play_intro_seen') === '1';
  if (seen) return;
  const overlay = document.getElementById('play-intro-overlay');
  if (!overlay) return;
  const playerName = getProgress()?.playerName || 'New Hire';
  overlay.querySelector('.intro-name').textContent = playerName;
  overlay.classList.add('visible');
  inputLocked = true;
  overlay.querySelector('.intro-btn').onclick = () => {
    overlay.classList.remove('visible');
    inputLocked = false;
    localStorage.setItem('ccq_play_intro_seen', '1');
  };
}

function tryInteract() {
  if (!interactionTarget || inputLocked) return;
  const npc = interactionTarget.userData.npc;
  openDialogue(npc);
}

function openDialogue(npc) {
  inputLocked = true;
  const d = dialogueEl;
  const done = npc.kind === 'lesson' ? isLessonDone(npc.lessonId) : isTestDone(npc.testId);

  // Determine status & next-step pointer
  let statusLine = '';
  if (done) {
    statusLine = `<div class="dlg-status dlg-done">✓ You've already completed this with ${npc.name.split(' ')[0]}.</div>`;
  }
  let nextHint = done ? `<div class="dlg-next">${npc.nextHint}</div>` : '';

  d.innerHTML = `
    <div class="dlg-card">
      <button class="dlg-close" aria-label="Close">×</button>
      <div class="dlg-header">
        <div class="dlg-portrait">${npc.portrait}</div>
        <div class="dlg-who">
          <div class="dlg-name">${npc.name}</div>
          <div class="dlg-role">${npc.role}</div>
        </div>
      </div>
      ${statusLine}
      <div class="dlg-body" data-typewriter></div>
      ${nextHint}
      <div class="dlg-actions">
        <button class="btn-primary dlg-go">${
          npc.kind === 'test'
            ? (done ? 'Retake practical →' : 'Take the practical →')
            : (done ? 'Revisit lesson →' : `Start lesson — ${getLessonTitle(npc) || 'Begin'} →`)
        }</button>
        <button class="btn-secondary dlg-cancel">Maybe later</button>
      </div>
    </div>
  `;
  d.classList.add('visible');
  // Open chime
  playUi('confirm');
  // Typewriter the intro line — plays a blip per character (rate-limited).
  startTypewriter(d.querySelector('[data-typewriter]'), npc.intro, blipPitchForNpc(npc.id));

  d.querySelector('.dlg-cancel').onclick = () => { playUi('cancel'); closeDialogue(); };
  d.querySelector('.dlg-close').onclick  = () => { playUi('cancel'); closeDialogue(); };
  d.querySelector('.dlg-go').onclick = () => {
    playUi('confirm');
    if (player) {
      sessionStorage.setItem('ccq_play_pos', JSON.stringify({
        x: player.position.x, z: player.position.z,
      }));
    }
    if (npc.kind === 'test') {
      window.App.navigate('test', { chapterId: npc.chapterId, fromPlay: true });
    } else {
      window.App.navigate('lesson', { chapterId: npc.chapterId, lessonId: npc.lessonId, fromPlay: true });
    }
  };
}

function getLessonTitle(npc) {
  const ch = window.CURRICULUM?.find(c => c.id === npc.chapterId);
  const l = ch?.lessons.find(x => x.id === npc.lessonId);
  return l?.title || '';
}

function closeDialogue() {
  if (currentTypewriter) { currentTypewriter.cancel(); currentTypewriter = null; }
  dialogueEl.classList.remove('visible');
  dialogueEl.innerHTML = '';
  inputLocked = false;
}

let currentTypewriter = null;
function startTypewriter(el, text, pitch = 1.0) {
  if (!el) return;
  el.textContent = '';
  let i = 0;
  let blipCounter = 0;
  let cancelled = false;
  const charDelay = 22; // ms per character

  function tick() {
    if (cancelled) return;
    if (i >= text.length) { currentTypewriter = null; return; }
    const ch = text.charAt(i++);
    el.textContent += ch;
    // Blip every ~2 visible characters; skip whitespace + punctuation
    if (/[A-Za-z0-9]/.test(ch)) {
      blipCounter++;
      if (blipCounter % 2 === 0) playDialogueBlip(pitch);
    }
    setTimeout(tick, charDelay);
  }
  currentTypewriter = {
    cancel() {
      cancelled = true;
      el.textContent = text; // reveal everything if cancelled
    },
  };
  tick();
}

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Update loop ─────────────────────────────────────────────────────────────
function applyDance(t) {
  const p = player.userData.parts;
  if (!p) return;
  // bouncy spin + arms up
  player.rotation.y += 0.08;
  player.position.y = Math.abs(Math.sin(t * 8)) * 0.35;
  p.leftArm.rotation.x = -2.2 + Math.sin(t * 12) * 0.3;
  p.rightArm.rotation.x = -2.2 + Math.cos(t * 12) * 0.3;
  p.leftArm.rotation.z = 0.4;
  p.rightArm.rotation.z = -0.4;
  p.leftLeg.rotation.x = Math.sin(t * 10) * 0.5;
  p.rightLeg.rotation.x = -Math.sin(t * 10) * 0.5;
}

function update(dt) {
  // Dance animation
  if (performance.now() < danceUntil) {
    applyDance(performance.now() * 0.001);
    // camera circle around dancing player
    const angle = (performance.now() * 0.001) * 1.2;
    const camDist = 6;
    camera.position.x = player.position.x + Math.sin(angle) * camDist;
    camera.position.z = player.position.z + Math.cos(angle) * camDist;
    camera.position.y = 4.0;
    camera.lookAt(player.position.x, 1.0, player.position.z);
    return;
  }

  if (inputLocked) {
    const p = player.userData.parts;
    if (p) {
      p.leftLeg.rotation.x *= 0.85;
      p.rightLeg.rotation.x *= 0.85;
      p.leftArm.rotation.x *= 0.85;
      p.rightArm.rotation.x *= 0.85;
      p.leftArm.rotation.z = 0;
      p.rightArm.rotation.z = 0;
    }
    return;
  }

  // Jump
  if (jumpRequested && player.userData.grounded) {
    player.userData.velocityY = 6.5;
    player.userData.grounded = false;
    playJumpGrunt();
  }
  jumpRequested = false;

  // Gravity + Y position
  const wasAirborne = !player.userData.grounded;
  if (!player.userData.grounded || player.position.y > 0) {
    player.userData.velocityY -= 18 * dt;
    player.position.y += player.userData.velocityY * dt;
    if (player.position.y <= 0) {
      player.position.y = 0;
      player.userData.velocityY = 0;
      player.userData.grounded = true;
      if (wasAirborne) playLandThud();
    }
  }

  // Camera-relative input. W/up = forward in camera direction, A/left =
  // perpendicular (camera-left), etc. Holding A continuously rotates the
  // character (and camera following it) in a circle, because each frame
  // "left" is recomputed against the camera's CURRENT facing direction.
  let inputForward = 0, inputRight = 0;
  if (keys['w'] || keys['arrowup'])    inputForward += 1;
  if (keys['s'] || keys['arrowdown'])  inputForward -= 1;
  if (keys['a'] || keys['arrowleft'])  inputRight   -= 1;
  if (keys['d'] || keys['arrowright']) inputRight   += 1;
  inputRight   += touchVec.x;
  inputForward -= touchVec.y; // joystick up (touchVec.y < 0) → forward

  // Project camera forward onto the XZ plane.
  const camFwd = new THREE.Vector3();
  camera.getWorldDirection(camFwd);
  camFwd.y = 0;
  const camFwdLen = Math.hypot(camFwd.x, camFwd.z);
  if (camFwdLen > 0.001) { camFwd.x /= camFwdLen; camFwd.z /= camFwdLen; }
  else { camFwd.x = 0; camFwd.z = -1; }
  // camRight: 90° clockwise of camFwd in XZ plane (so +X is to camera's right).
  const camRightX = -camFwd.z;
  const camRightZ =  camFwd.x;

  let mx = camRightX * inputRight + camFwd.x * inputForward;
  let mz = camRightZ * inputRight + camFwd.z * inputForward;

  const len = Math.hypot(mx, mz);
  if (len > 0.05) {
    mx /= len; mz /= len;
    const speed = 4.4;
    let nx = player.position.x + mx * speed * dt;
    let nz = player.position.z + mz * speed * dt;

    // Generic movement bounds across all zones with doorways
    const clamped = clampMove(player.position.x, player.position.z, nx, nz);
    nx = clamped.x; nz = clamped.z;

    // Footstep accumulator: trigger a step every ~0.65m of horizontal movement
    // while grounded. Surface comes from the current zone's audio config.
    if (player.userData.grounded) {
      const stepDx = nx - player.position.x;
      const stepDz = nz - player.position.z;
      footstepAccum += Math.hypot(stepDx, stepDz);
      if (footstepAccum > 0.65) {
        footstepAccum = 0;
        const idx = zoneIndexAt(nz);
        playFootstep(surfaceForZone(idx));
      }
    }

    player.position.x = nx;
    player.position.z = nz;
    // Smoother rotation: lerp toward target heading instead of snapping.
    const targetRot = Math.atan2(mx, mz);
    let dRot = ((targetRot - player.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (dRot < -Math.PI) dRot += Math.PI * 2;
    const rotLerp = 1 - Math.exp(-dt * 7); // slower than camera so the camera trails the body
    player.rotation.y += dRot * rotLerp;

    const p = player.userData.parts;
    if (player.userData.grounded && p) {
      const t = performance.now() * 0.012;
      p.leftLeg.rotation.x = Math.sin(t) * 0.5;
      p.rightLeg.rotation.x = -Math.sin(t) * 0.5;
      p.leftArm.rotation.x = -Math.sin(t) * 0.4;
      p.rightArm.rotation.x = Math.sin(t) * 0.4;
    } else if (p) {
      // Airborne pose: arms forward slightly, legs tucked
      p.leftLeg.rotation.x = -0.3;
      p.rightLeg.rotation.x = -0.3;
      p.leftArm.rotation.x = -0.6;
      p.rightArm.rotation.x = -0.6;
    }
  } else {
    const p = player.userData.parts;
    if (p) {
      p.leftLeg.rotation.x *= 0.85;
      p.rightLeg.rotation.x *= 0.85;
      p.leftArm.rotation.x *= 0.85;
      p.rightArm.rotation.x *= 0.85;
    }
  }

  // Camera orbits behind the player based on facing direction.
  // dt-aware exponential smoothing so the same feel survives 30fps & 60fps.
  const camDist = 6.5, camH = 4.2;
  const angle = player.rotation.y;
  const targetCamX = player.position.x - Math.sin(angle) * camDist;
  const targetCamZ = player.position.z - Math.cos(angle) * camDist;
  // Stiffness 5 reads as smooth camera trail — the body lerps at 7 above
  // so the camera lags slightly behind direction changes (more cinematic).
  const camLerp = 1 - Math.exp(-dt * 5);
  camera.position.x += (targetCamX - camera.position.x) * camLerp;
  camera.position.z += (targetCamZ - camera.position.z) * camLerp;
  camera.position.y = camH + player.position.y * 0.3;
  camera.lookAt(player.position.x, player.position.y + 1.0, player.position.z);

  // Update door colors live in case a chapter unlocks during play
  for (const d of zoneDoors) {
    const open = isTestDone(`${d.gateChapter}-test`);
    d.mesh.material.color.set(open ? 0x4caf50 : 0x5d4037);
    if (open !== d.lastOpen) {
      // Refresh the label texture
      const newSprite = makeLabelSprite(
        open ? `${d.nextTitle} — Open` : `${d.nextTitle} — Locked`,
        '#fff', open ? 'rgba(34,139,34,0.92)' : 'rgba(120,40,40,0.92)',
      );
      if (d.label.material.map) d.label.material.map.dispose();
      d.label.material.map = newSprite.material.map;
      d.label.material.needsUpdate = true;
      d.lastOpen = open;
    }
  }

  // Detect zone change → swap lighting, post-fx, sky, and music together.
  if (lighting && player) {
    const idx = zoneIndexAt(player.position.z);
    if (idx >= 0 && idx !== lastZoneIdx) {
      lastZoneIdx = idx;
      lighting.applyPreset(idx);
      if (postfx) postfx.applyPreset(lighting.getPostFx());
      if (skyDome) {
        const skyP = getSkyPresetForZone(idx);
        skyDome.applyPreset(skyP.sky);
        if (skyP.fog) scene.fog = new THREE.Fog(skyP.fog.color, skyP.fog.near, skyP.fog.far);
      }
      // Time-of-day baseline scales the preset values, so re-apply on transition.
      if (timeOfDay) timeOfDay.reapply();
      // Crossfade zone music. fail-silent inside AudioManager.
      try { audio.startMusic(`zone-${idx}`, musicForZone(idx), 2500); } catch {}
    }
  }
  // Skydome anchors to camera each frame so the player never reaches it.
  if (skyDome && camera) skyDome.followCamera(camera);

  // Parallax skyline shifts opposite to player X.
  if (receptionWindows?.update && player) {
    receptionWindows.update(dt, performance.now(), player.position);
  }

  // Time-of-day self-throttles to 1Hz internally; cheap to call each frame.
  if (timeOfDay) timeOfDay.tick(performance.now());

  // Live agent routines (named NPC pathing + ambient workers).
  if (liveAgents && player) {
    liveAgents.update(dt, performance.now(), player.position);
  }
  // Name tag fade pass (distance + closest-NPC emphasis).
  if (nameTags) nameTags.update();

  // Drift dust motes around the player (desktop-only; mobile is a no-op).
  if (dust && player) dust.update(dt, player.position);
  // Animated decorations (clock hands, server LEDs, demo screens, globe spin)
  if (decoTickers.length) {
    const _now = performance.now();
    for (let i = 0; i < decoTickers.length; i++) decoTickers[i](dt, _now);
  }
  // Update audio listener position so PannerNode sources track the camera.
  if (camera) audio.listenerPosition(camera.position.x, camera.position.y, camera.position.z);

  // Drive face animations (blink + idle look-at-player) on every character.
  const nowMs = performance.now();
  if (player?.userData?.face) updateFace(player.userData.face, nowMs);
  // Player breathing/head-bob — applyIdle is safe because player has no
  // signature gesture (`look.gesture` undefined ⇒ gesture switch falls
  // through to the no-op default).
  if (player) applyIdle(player, dt, nowMs);
  for (const m of npcMeshes) {
    if (m.userData?.face) updateFace(m.userData.face, nowMs);
    // Idle breathing + signature gesture per NPC.
    applyIdle(m, dt, nowMs);
    // Look-at-player: when player within 4m of NPC, gently rotate the head
    // toward the player. Otherwise reset slowly.
    const head = m.userData?.parts?.head;
    if (head && player) {
      const dx = player.position.x - m.position.x;
      const dz = player.position.z - m.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 4.0 && dist > 0.05) {
        const desired = Math.atan2(dx, dz) - m.rotation.y;
        // wrap to [-π, π]
        let d = ((desired + Math.PI) % (Math.PI * 2)) - Math.PI;
        if (d < -Math.PI) d += Math.PI * 2;
        // Clamp to a moderate cone so heads don't snap backward.
        d = Math.max(-0.7, Math.min(0.7, d));
        head.rotation.y += (d - head.rotation.y) * (1 - Math.exp(-dt * 4));
      } else {
        head.rotation.y += (0 - head.rotation.y) * (1 - Math.exp(-dt * 2));
      }
    }
  }

  // Animate hearts around CEO portrait if all chapters complete
  if (ceoHearts) {
    const t = performance.now() * 0.001;
    ceoHearts.children.forEach(h => {
      const phase = (t * 0.5 + h.userData.phase) % 1;
      const angle = phase * Math.PI * 2;
      const radius = 1.4 + Math.sin(t * 2 + h.userData.phase * 6) * 0.15;
      h.position.set(Math.cos(angle) * radius, Math.sin(angle) * 0.8 - 0.3, 0.15);
      const s = 0.4 + Math.sin(t * 3 + h.userData.phase * 8) * 0.12;
      h.scale.set(s, s, 1);
    });
  }

  // Interaction proximity
  let nearest = null, nearestDist = Infinity;
  for (const m of npcMeshes) {
    const dx = player.position.x - m.position.x;
    const dz = player.position.z - m.position.z;
    const d = Math.hypot(dx, dz);
    if (d < 2.4 && d < nearestDist) { nearest = m; nearestDist = d; }
  }
  if (nearest) {
    if (interactionTarget !== nearest) {
      interactionTarget = nearest;
      const npc = nearest.userData.npc;
      promptEl.classList.add('visible');
      promptEl.textContent = `Talk to ${npc.name.split(' ')[0]} — press E or tap`;
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
  if (postfx) postfx.render();
  else renderer.render(scene, camera);
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────
export function start(host) {
  container = host;
  promptEl = document.getElementById('play-prompt');
  dialogueEl = document.getElementById('play-dialogue');
  clock = new THREE.Clock();
  danceUntil = 0;
  jumpRequested = false;
  setupRenderer();
  buildWorld();
  buildPlayer();
  buildNPCs();
  setupInput();
  // Apply the initial zone preset so the first frame renders with proper
  // lighting; subsequent transitions are picked up by update().
  if (lighting) {
    const idx = zoneIndexAt(player.position.z);
    lighting.applyPreset(idx >= 0 ? idx : 0);
    lastZoneIdx = idx >= 0 ? idx : 0;
    // Initial zone music — silent fallback if the file isn't there.
    try { audio.startMusic(`zone-${lastZoneIdx}`, musicForZone(lastZoneIdx), 2500); } catch {}
  }
  // Time-of-day modulates the current preset (intensity, sun, sky, exposure).
  timeOfDay = new TimeOfDay({ lighting, skyDome, renderer, receptionWindows });
  timeOfDay.tick(performance.now());
  // Live world: routines for Marcus/Aisha/Linda + a few ambient workers.
  liveAgents = new LiveAgents({
    scene, npcMeshes, makeCharacter, isMobile: isMobile(),
  });
  // Name-tag fade system. We pass `walls=[]` so occlusion is disabled
  // (wall meshes aren't tagged for raycast — see notes file). Distance
  // fade + closest-NPC emphasis still apply.
  nameTags = new NameTagSystem({
    camera, npcMeshes, walls: [], mobile: isMobile(),
  });
  // Build the post-fx pipeline AFTER renderer/scene/camera exist; sync
  // initial bloom/vignette values to the current zone preset.
  postfx = new PostFxPipeline(renderer, scene, camera, { mobile: isMobile() });
  if (lighting) postfx.applyPreset(lighting.getPostFx());
  // Re-sync size in case container has actual dimensions now.
  if (container) postfx.resize(container.clientWidth, container.clientHeight);
  // Dust motes (desktop only — mobile gets count=0 and renders nothing).
  dust = new DustMotes(scene, { mobile: isMobile() });
  // Audio: attach unlock listeners (no-op once unlocked) and start zone music.
  audio.ensureUnlocked(document.body);
  // Mount the audio settings gear inside the play container so it lives
  // alongside the back button and tier badge.
  mountAudioSettings(container);
  // Customization button: when the user changes their face/hair/skin, we
  // tear down and rebuild the player mesh so the change is visible
  // immediately. Saves to localStorage via customization.js.
  mountCustomization(container, () => {
    if (player) {
      const oldX = player.position.x, oldZ = player.position.z;
      const oldRot = player.rotation.y;
      scene.remove(player);
      buildPlayer();
      player.position.set(oldX, 0, oldZ);
      player.rotation.y = oldRot;
    }
  });
  // If after 1.5s the audio is still locked (mobile autoplay restriction),
  // surface a brief hint. Auto-removes once a tap unlocks the context.
  setTimeout(() => {
    if (!audio.isUnlocked()) {
      const hint = document.createElement('div');
      hint.className = 'play-toast visible';
      hint.style.background = 'rgba(26,39,68,0.92)';
      hint.style.color = '#fff';
      hint.textContent = '🔊 Tap anywhere to enable audio';
      container.appendChild(hint);
      const poll = setInterval(() => {
        if (audio.isUnlocked()) {
          clearInterval(poll);
          hint.classList.remove('visible');
          setTimeout(() => hint.remove(), 400);
        }
      }, 250);
      // hard timeout so it never hangs around forever
      setTimeout(() => {
        clearInterval(poll);
        if (hint.isConnected) {
          hint.classList.remove('visible');
          setTimeout(() => hint.remove(), 400);
        }
      }, 8000);
    }
  }, 1500);
  showIntro();
  // Trigger celebration dance if player just passed a test
  try {
    const danceFlag = sessionStorage.getItem('ccq_dance_for');
    if (danceFlag) {
      sessionStorage.removeItem('ccq_dance_for');
      setTimeout(() => {
        danceUntil = performance.now() + 4500;
        showCelebrationToast();
        // Crowd cheer + level-up fanfare-ish stinger over the celebration.
        try {
          playCrowdCheer(4.0);
          playLevelUpFanfare();
          // Switch zone music to the celebration stinger; it falls back to
          // silence if the file isn't present.
          audio.startMusic('celebration', 'play/assets/audio/music/celebration.mp3', 600);
        } catch {}
      }, 400);
    }
  } catch {}
  loop();
}

function showCelebrationToast() {
  const toast = document.createElement('div');
  toast.className = 'play-toast';
  toast.textContent = '🎉 Chapter complete! New tier unlocked.';
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('visible'), 50);
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

export function stop() {
  if (raf) cancelAnimationFrame(raf);
  raf = null;
  if (resizeListener) window.removeEventListener('resize', resizeListener);
  if (keyDownListener) window.removeEventListener('keydown', keyDownListener);
  if (keyUpListener) window.removeEventListener('keyup', keyUpListener);
  if (renderer) {
    if (renderer.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    renderer.dispose();
  }
  if (scene) {
    scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
      }
    });
  }
  if (liveAgents) { liveAgents.dispose(); liveAgents = null; }
  if (dust) { dust.dispose(); dust = null; }
  if (postfx) { postfx.dispose(); postfx = null; }
  if (lighting) { lighting.dispose(); lighting = null; }
  try { audio.stopMusic(800); } catch {}
  try { unmountAudioSettings(); } catch {}
  try { unmountCustomization(); } catch {}
  lastZoneIdx = -1;
  footstepAccum = 0;
  decoTickers = [];
  renderer = null; scene = null; camera = null;
  player = null; npcMeshes = []; interactionTarget = null;
  zoneDoors = [];
  ceoHearts = null;
  keys = {}; touchVec = { x: 0, y: 0 };
  inputLocked = false;
  jumpRequested = false;
  danceUntil = 0;
}

window.Play = { start, stop };

// Bridge for non-module scripts (engine/achievements.js, ui/lesson.js, ui/test.js).
// These scripts can fire game audio without importing modules directly.
window.PlayAudio = {
  achievement: () => playAchievementChime(),
  levelUp:     () => playLevelUpFanfare(),
  ppPing:      () => playPpPing(),
  kcCorrect:   () => playKcCorrectTone(),
  kcIncorrect: () => playKcIncorrectTone(),
  uiClick:     () => playUi('click'),
  uiHover:     () => playUi('hover'),
  uiConfirm:   () => playUi('confirm'),
  uiCancel:    () => playUi('cancel'),
  cheer:       (d) => playCrowdCheer(d),
};
