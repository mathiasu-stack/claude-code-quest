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
import { attachCartoonFace, updateCartoonFace, setCartoonExpression } from './characters/cartoonFace.js';
import { attachFlatFace, updateFlatFace, setFlatExpression, talkPulse } from './characters/flatFace.js';
import { getFaceConfig, FACE_CONFIGS } from './characters/faceConfigs.js';
import { getLookForNpc } from './characters/npcLooks.js';
import { buildPlayerLook } from './characters/playerLook.js';
import { applyIdle } from './characters/idleAnimations.js';
import { loadCustomization, mountCustomization, unmountCustomization } from './characters/customization.js';
import { getAssetLoader } from './characters/assetLoader.js?v=20260525a';
import { makeGltfCharacter } from './characters/gltfCharacter.js?v=20260526i';
import { resolveAssetForCharacter } from './characters/npcCasting.js';
import { createLoadingOverlay } from './characters/loadingOverlay.js';
import { decorateReception } from './decorations/reception.js?v=20260526e';
import { decorateLibrary } from './decorations/library.js?v=20260526d';
import { buildReceptionCenterpiece } from './decorations/receptionCenterpiece.js?v=20260526d';
import { buildPosterTexture } from './decorations/shared.js?v=20260526d';
import { preloadDecorations, makeDecoration, hasDecoration } from './decorations/decorationAssets.js?v=20260526l';
import { loadRoom, registerRoomBuilder, registerSharedHelpers } from './world/roomsLoader.js?v=20260526a';
import { mountToolbar as mountEditorToolbar, enterEditMode as enterRoomEdit,
         exitEditMode as exitRoomEdit, isEditorActive as isRoomEditorActive,
         exportLayout as exportRoomLayout } from './editor/roomsEditor.js?v=20260527c';
import { SkyDome, getSkyPresetForZone } from './world/sky.js';
import { buildReceptionCeiling, buildLibraryCeiling } from './world/ceilings.js';
import { buildAtrium } from './world/atrium.js?v=20260526b';
import { buildElevator } from './world/elevator.js';
import { CeremonyManager } from './ceremony/ceremonyManager.js';
import {
  registerInteractable, clearInteractables,
  updateInteractables, listInteractables,
} from './world/interactables.js';
import { buildComputer } from './world/objectTypes/computer.js';
import { buildBook } from './world/objectTypes/book.js';
import { buildWhiteboardObject } from './world/objectTypes/whiteboard.js';
import { buildServerRack } from './world/objectTypes/serverRack.js';
import { buildDemoScreenObject } from './world/objectTypes/demoScreen.js';
import { buildPhone } from './world/objectTypes/phone.js';
import { LESSON_DELIVERY } from './world/lessonRegistry.js';
import { mountLessonOverlay, unmountLessonOverlay } from './lessons/overlay.js';
import { buildReceptionWindows, buildLibraryArchedWindow, buildReceptionHallway } from './world/depth.js?v=20260526d';
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
    id: 'ines',   zone: 1, pos: [2, -4], face: 0, kind: 'flavor',
    name: 'Ines', role: 'Visitor, age 9', portrait: '👧',
    look: { skin: 0xfdd9b5, hair: 0x4a2c0f, hairStyle: 'braid', shirt: 0xf5f5f0, pants: 0x111111, glasses: false, prop: null, face: 'round', expression: 'happy' },
    intro: "Hi! I'm Ines. I'm 9. My dad works here on the third floor — he said I have to wait until his big meeting is done. The chairs spin really fast if you push hard! Are you a real engineer?",
    nextHint: "",
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

// ─── Floor / chapter layout ─────────────────────────────────────────────────
// 16 chapters split across 4 floors (4 chapters per floor). Floor 1 holds
// chapters 1-4 in the existing hand-built atrium + library + procedural
// zones at y=0. Floors 2-4 are compact office rooms built at higher Y;
// the elevator shaft passes through all four. Only ONE floor is visible
// at a time — non-current floors get hidden via userData.floor tagging.
const FLOORS_TOTAL = 4;
const CHAPTERS_PER_FLOOR = 4;
const FLOOR_HEIGHT_Y = 4.5;          // matches elevator.js FLOOR_HEIGHT
function floorBaseY(n) {
  return (Math.max(1, Math.min(FLOORS_TOTAL, n)) - 1) * FLOOR_HEIGHT_Y;
}
// Floor is determined by the chapter's POSITION in window.CURRICULUM,
// not by parsing the numeric suffix from its id. After the curriculum
// reshuffle (ids stay stable but display order changes) this is the
// only way to keep floor assignments in sync with the dashboard.
function indexForChapterId(chId) {
  return (window.CURRICULUM || []).findIndex(c => c.id === chId);
}
function floorForChapterIdx(idx) {
  if (idx < 0) return 1;
  return Math.min(FLOORS_TOTAL, Math.ceil((idx + 1) / CHAPTERS_PER_FLOOR));
}
function floorForChapterId(chId) {
  const idx = indexForChapterId(chId);
  return idx < 0 ? 1 : floorForChapterIdx(idx);
}
let currentFloor = 1;
// Mirror currentFloor onto window so the in-game editor's "Add Item"
// spawn picker can pick the right room without needing a play.js
// import. Kept in sync with currentFloor changes below.
try { if (typeof window !== 'undefined') window.__playCurrentFloor = currentFloor; } catch {}

// ─── Zone layout ─────────────────────────────────────────────────────────────
// Each zone is 22m wide and 22m deep. Zones extend along +Z.
// Floor 1's zones occupy z=-11..77 (ch01-04 only). Chapters 5+ are
// rendered on floors 2-4 in compact office rooms (see buildFloorOffice).
const ZONE_COUNT = 16;
const ZONE_BOUNDS = Array.from({ length: ZONE_COUNT }, (_, i) => ({
  startZ: i * 22 - 11,
  endZ: (i + 1) * 22 - 11,
  centerZ: i * 22,
  chapterId: (window.CURRICULUM || [])[i]?.id || `ch${String(i + 1).padStart(2, '0')}`,
}));

function zoneIndexAt(z) {
  for (let i = 0; i < ZONE_BOUNDS.length; i++) {
    if (z >= ZONE_BOUNDS[i].startZ - 0.01 && z <= ZONE_BOUNDS[i].endZ + 0.01) return i;
  }
  return -1;
}
// Zone N is "open" when the test of the chapter at CURRICULUM[N-1]
// is passed. Uses the CURRICULUM array position so the unlock chain
// matches the dashboard order after reshuffles.
function isZoneIdxOpen(idx) {
  if (idx <= 0) return true;
  const ch = (window.CURRICULUM || [])[idx - 1];
  if (!ch) return false;
  const testId = ch.practicalTest?.id || `${ch.id}-test`;
  return isTestDone(testId);
}

// Themes indexed by CURRICULUM array position (new chapter order).
// Position 0 (Onboarding) is hand-built so its theme is null. Each
// chapter's themed name stays attached to its CONTENT, not to a fixed
// zone — e.g. the "Memory Vault" theme follows ch04 wherever ch04
// lands in the order.
const ZONE_THEMES_BY_ID = {
  ch03: { floor: 0xa1887f, wall: 0xefebe9, accent: '#5d4037', title: 'CLAUDE.md Atrium',           metal: 0.05 },
  ch04: { floor: 0x90caf9, wall: 0xe3f2fd, accent: '#1565c0', title: 'Memory Vault',                metal: 0.10 },
  ch05: { floor: 0xa5d6a7, wall: 0xe8f5e9, accent: '#2e7d32', title: 'Communications Hub',          metal: 0.10 },
  ch06: { floor: 0xffcc80, wall: 0xfff3e0, accent: '#ef6c00', title: 'File Workshop',               metal: 0.15 },
  ch07: { floor: 0xce93d8, wall: 0xf3e5f5, accent: '#6a1b9a', title: 'Token Lounge',                metal: 0.20 },
  ch08: { floor: 0xff8a65, wall: 0xffccbc, accent: '#bf360c', title: 'Skill Forge',                 metal: 0.25 },
  ch09: { floor: 0x80cbc4, wall: 0xe0f2f1, accent: '#00695c', title: 'Methodology Lab',             metal: 0.30 },
  ch10: { floor: 0xffd54f, wall: 0xfff9c4, accent: '#f57c00', title: 'Refinement Loop',             metal: 0.35 },
  ch11: { floor: 0x9fa8da, wall: 0xeceff1, accent: '#283593', title: 'Slash Command Center',       metal: 0.40 },
  ch12: { floor: 0xb39ddb, wall: 0xede7f6, accent: '#311b92', title: 'Plan War Room',               metal: 0.45 },
  ch13: { floor: 0x4dd0e1, wall: 0xe0f7fa, accent: '#006064', title: 'Integration Bay',             metal: 0.50 },
  ch14: { floor: 0xff7043, wall: 0xfbe9e7, accent: '#d84315', title: 'Mission Control',             metal: 0.55 },
  ch15: { floor: 0xb2dfdb, wall: 0xfff8e1, accent: '#00897b', title: 'Architect Studio',            metal: 0.60 },
  ch16: { floor: 0xffd700, wall: 0xfffde7, accent: '#ff6f00', title: 'NAS Server Room — Capstone',  metal: 0.75 },
};
const ZONE_THEMES = (window.CURRICULUM || []).map(c => ZONE_THEMES_BY_ID[c.id] || null);

// ─── NPC generator (chapters 3-16) ───────────────────────────────────────────
const NAME_FIRST = ['Aiko','Ben','Carmen','Dario','Elena','Felix','Greta','Hassan','Imani','Joel','Kira','Lars','Maya','Nikhil','Omar','Priya','Quinn','Rita','Sven','Tara','Uma','Vince','Wren','Xander','Yara','Zane','Anna','Bilal','Camille','Diego','Esme','Farid','Gabi','Hugo','Iris','Jin','Karim'];
const NAME_LAST = ['Chen','Diaz','Hassan','Kim','Liu','Mehta','Nakamura','Olsen','Park','Rao','Singh','Tanaka','Volkov','Wong','Zhang','Patel','Garcia','Lopez','Khan','Hassan','Andersson','Dubois','Rossi','Schmidt'];
const PORTRAITS = ['👩‍💼','👨‍💼','🧑‍💼','👩‍💻','👨‍💻','🧑‍💻','👩‍🔬','👨‍🔬','👩‍🏫','👨‍🏫','🧑‍🚀','👨‍🚀','👩‍🚀','🧑‍🎨','👨‍🔧','👩‍🔧','👨‍⚕️','👩‍⚕️','👨‍🍳','👩‍🍳'];
// Role pool for the procedurally-generated NPCs. Each string MUST NOT
// exactly match any player-rank label in the RANKS array above (Intern,
// Junior Hire, Associate, Engineer, Senior, Lead, Principal, Director)
// or the NPC ends up showing the player-tier badge text instead of its
// role — the Diana-as-Intern bug. Audit data::1.1 enforces this.
// 'Engineer' → 'Staff Engineer', 'Principal' → 'Principal Engineer'.
const ROLES_LESSON = ['Senior Engineer','Tech Lead','Architect','Specialist','Principal Engineer','Researcher','Trainer','Practitioner','Coach','Staff Engineer','Strategist','Operator','Maintainer','Designer','Reviewer'];
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
// Camera yaw uses the SAME rotation convention as player.rotation.y
// (atan2(mx, mz) — see movement code below): θ=π → looking -Z (north).
// This alignment is critical: the auto-follow lerp targets
// player.rotation.y, so they must use the same convention or the lerp
// pulls the camera to the wrong side.
let cameraYaw = Math.PI;
// Camera pitch in radians — 0 = ride-height baseline (matches the
// long-standing fixed-height behaviour), positive = looking down from
// above, negative = looking up from below. Driven by middle-mouse drag
// (see setupInput). Clamped to PITCH_MIN/PITCH_MAX so the camera can't
// flip over or sink through the floor.
let cameraPitch = 0;
const PITCH_MIN = -0.45;    // ~-26° (camera looks up at player from low)
const PITCH_MAX =  0.95;    // ~+54° (camera looks down from above)
// True while the user holds the middle mouse button — suppresses the
// auto-follow yaw drift so the manual drag isn't fought by the
// player-heading-based lerp.
let mouseLook = false;
// Active touch IDs that are panning the camera. Used by the touch-swipe
// look path (mobile analog of middle-mouse drag). Auto-follow is
// suppressed whenever this is non-empty.
const cameraTouches = new Map();
// Third-person camera distance — adjustable with the mouse wheel.
let cameraDist = 6.5;
const CAM_DIST_MIN = 2.5;
const CAM_DIST_MAX = 18.0;
let decoTickers = [];   // per-frame callbacks for animated decorations
let skyDome = null;
let receptionWindows = null;
let libraryWindow = null;
let receptionHallway = null;
let timeOfDay = null;
let liveAgents = null;
let nameTags = null;
let occluderWalls = [];
// Wall meshes collected after build, used by the camera to clamp distance
// so the orbit doesn't punch through an exterior wall.
let cameraWalls = [];
// Per-frame cache of the floor-filtered cameraWalls list. Invalidated
// when cameraWalls itself changes (loadFloor → refreshCameraWalls) or
// when currentFloor changes. Avoids allocating a fresh Array.filter
// result every frame for the camera-occlusion raycast.
let _cameraWallsForCurrentFloor = null;
let _cameraWallsCacheFloor = -1;
let _cameraWallsCacheVersion = 0;
function _bumpCameraWallsVersion() {
  _cameraWallsCacheVersion++;
}
function _filteredCameraWalls() {
  if (_cameraWallsCacheFloor === currentFloor && _cameraWallsForCurrentFloor) {
    return _cameraWallsForCurrentFloor;
  }
  _cameraWallsForCurrentFloor = cameraWalls.filter(w =>
    !w.userData?.floor || w.userData.floor === currentFloor || w.userData.crossFloor
  );
  _cameraWallsCacheFloor = currentFloor;
  return _cameraWallsForCurrentFloor;
}
const _camRay = new THREE.Raycaster();
const _camRayDir = new THREE.Vector3();
const _camRayOrigin = new THREE.Vector3();
let ceremony = null;
let player, npcMeshes = [];
let keys = {}, touchVec = { x: 0, y: 0 };
let jumpRequested = false;
let danceUntil = 0;
let interactionTarget = null;
let interactObjects = []; // built interactable objects with per-frame update()
let raf = null;
let resizeListener, keyDownListener, keyUpListener, wheelListener;
let mouseDownListener, mouseMoveListener, mouseUpListener;
let cameraTouchStartListener, cameraTouchMoveListener, cameraTouchEndListener;
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

// ─── Static AABB colliders (chest-height+ furniture) ────────────────────────
// Populated once after world build via addColliderAABB. clampMove pushes the
// player out if a move would land them inside any of these boxes.
const colliders = [];
function addColliderAABB(minX, maxX, minZ, maxZ, floor = 1) {
  colliders.push({ minX, maxX, minZ, maxZ, floor });
}
const PLAYER_RADIUS = 0.30;

// (Staircase + mezzanine removed from the atrium — floor 1 is flat now.
// The gravity / clampMove paths below treat the ground as floorBaseY
// without any per-XZ ramp offset.)

function clampMove(oldX, oldZ, newX, newZ) {
  // Floor 1 has a 2×2 layout: the atrium + library occupy x∈[-10.5, 10.5]
  // while the new west-wing rooms (Files, Plan Mode) occupy x∈[-32.5, -10.5].
  // Floors 2-4 are a single 22×22 office (z∈[-10.5, 10.5]).
  if (currentFloor === 1) {
    newX = Math.max(-32.5, Math.min(10.5, newX));
    newZ = Math.max(-10.5, Math.min(32.5, newZ));
  } else {
    newX = Math.max(-10.5, Math.min(10.5, newX));
    newZ = Math.max(-10.5, Math.min(10.5, newZ));
  }

  if (currentFloor !== 1) {
    // skip the floor-1 zone-corridor logic
  } else if (newX > -10.5) {
    // Only run the atrium-library Z-corridor check when the player is
    // in the east half of floor 1 (atrium / library / their shared door
    // at x∈[-1.7, +1.7]). In the west wing (x<-10.5) the wall colliders
    // handle boundaries.

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
  } // close the floor===1 branch

  // Static furniture AABBs — push out along the shortest axis.
  // Only consider colliders for the player's current floor.
  const R = PLAYER_RADIUS;
  for (const c of colliders) {
    if (c.floor !== currentFloor) continue;
    if (newX > c.minX - R && newX < c.maxX + R &&
        newZ > c.minZ - R && newZ < c.maxZ + R) {
      const dxLeft  = (newX) - (c.minX - R);
      const dxRight = (c.maxX + R) - (newX);
      const dzNear  = (newZ) - (c.minZ - R);
      const dzFar   = (c.maxZ + R) - (newZ);
      const minPen = Math.min(dxLeft, dxRight, dzNear, dzFar);
      if      (minPen === dxLeft)  newX = c.minX - R - 0.001;
      else if (minPen === dxRight) newX = c.maxX + R + 0.001;
      else if (minPen === dzNear)  newZ = c.minZ - R - 0.001;
      else                          newZ = c.maxZ + R + 0.001;
    }
  }

  // NPC repulsion — treat each as a small cylinder so the player can't
  // walk through them. Skip the player's own mesh and any NPC on
  // another floor.
  const NPC_R = 0.55;
  for (const npc of npcMeshes) {
    if (!npc || npc === player) continue;
    if ((npc.userData.floor || 1) !== currentFloor) continue;
    const dx = newX - npc.position.x;
    const dz = newZ - npc.position.z;
    const distSq = dx * dx + dz * dz;
    if (distSq < NPC_R * NPC_R && distSq > 1e-6) {
      const d = Math.sqrt(distSq);
      newX = npc.position.x + (dx / d) * NPC_R;
      newZ = npc.position.z + (dz / d) * NPC_R;
    }
  }

  return { x: newX, z: newZ };
}

// ─── Character builder ───────────────────────────────────────────────────────
// GLTF assetLoader singleton — populated in start() if the opt-in flag
// is set and assets are available. Otherwise stays null and every
// makeCharacter() call falls through to the procedural path.
let gltfAssetLoader = null;

function makeCharacter(look) {
  // Try GLTF first when:
  //   1. the asset loader is ready and has resolved assets, AND
  //   2. either look._gltfAsset is explicitly set or look._id maps to
  //      an available asset via npcCasting.resolveAssetForCharacter.
  // If neither, fall through to the procedural builder.
  if (gltfAssetLoader) {
    let assetId = look._gltfAsset;
    if (!assetId && look._id) {
      assetId = resolveAssetForCharacter(look._id, gltfAssetLoader);
    }
    if (assetId) {
      const gltfGroup = makeGltfCharacter(
        { ...look, _gltfAsset: assetId },
        gltfAssetLoader,
      );
      if (gltfGroup) return gltfGroup;
    }
  }

  const g = new THREE.Group();
  // Skin material gets a tiny self-emissive tint so the head never reads
  // pure black under shadow — the face plane is DoubleSide so you can
  // see the face from any angle.
  const skinColor = look.skin || 0xfdd9b5;
  const skinMat = new THREE.MeshStandardMaterial({
    color: skinColor, emissive: skinColor, emissiveIntensity: 0.08, roughness: 0.85,
  });
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

  // Hair / glasses / beard are now ALL owned by the new cartoonFace
  // system (parented to head). The legacy makeCharacter add-ons here
  // were skipped to avoid double-rendering — see cartoonFace.js.

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
  // Flat-face system (Maya portrait technique): a SINGLE canvas-painted
  // quad on the head's front. Replaces all previous 3D-primitive face
  // assemblies (sphere eyes / box brows / etc.) which produced "stuck-on"
  // uncanny results across 5 runs. This is the architectural pivot.
  //
  // The config for the canvas drawing comes from faceConfigs.js, keyed
  // by NPC id (look._id). The player passes its own _id = 'player' via
  // playerLook.js. Auto-generated NPCs get a deterministic random config.
  const faceCfg = look._faceConfig
    || getFaceConfig(look._id || 'unknown', 0);
  // Carry the explicit hair/skin from `look` if they were set there —
  // configs in faceConfigs.js are authoritative for facial features,
  // but the body's skin / hair color may have been overridden by the
  // NPC roster's look (e.g. via npcLooks.js).
  if (typeof look.skin === 'number') faceCfg.skin = look.skin;
  if (typeof look.hair === 'number') faceCfg.hair = look.hair;
  if (typeof look.hairStyle === 'string') faceCfg.hairStyle = look.hairStyle;
  g.userData.face = attachFlatFace(g, head, faceCfg);
  g.userData.faceKind = 'flat';
  g.userData.faceConfig = faceCfg;
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

// Name tag for NPCs floating above their heads. Unlike makeLabelSprite,
// there's NO background pill — just white text with a thin dark stroke
// for legibility on bright/dark scene backgrounds alike. Used by
// spawnNPC; the CEO portrait plaque, player tier badge, and other
// pill-style HUD labels keep makeLabelSprite.
function makeNpcNameTag(text) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 96;
  const ctx = c.getContext('2d');
  ctx.font = '600 36px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  // Subtle dark stroke first, then white fill — looks like a soft
  // outline rather than a hard border, but keeps the name readable
  // against the cream walls and dark floors.
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.strokeText(text, c.width / 2, c.height / 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, c.width / 2, c.height / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sprite.scale.set(1.8, 0.34, 1);
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
  const glb = makeDecoration('chair', { width: 0.6, depth: 0.6, height: 1.1 });
  if (glb) {
    glb.position.set(x, 0, z); glb.rotation.y = ry;
    glb.userData.surface = 'floor';
    return glb;
  }
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
  g.userData.surface = 'floor';
  return g;
}

function buildDesk(x, z, ry = 0, w = 1.6, d = 0.8, color = 0x6b4f3a) {
  const glb = makeDecoration('desk', { width: w, depth: d, height: 0.78 });
  if (glb) {
    glb.position.set(x, 0, z); glb.rotation.y = ry;
    glb.userData.surface = 'floor';
    return glb;
  }
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
  g.userData.surface = 'floor';
  return g;
}

function buildMonitor(x, z, ry = 0, screenColor = 0x4fc3f7) {
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

function buildPlant(x, z) {
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

function buildWaterCooler(x, z) {
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

function buildCouch(x, z, ry = 0) {
  const glb = makeDecoration('couch', { width: 2.2, depth: 0.9, height: 0.95 });
  if (glb) {
    glb.position.set(x, 0, z); glb.rotation.y = ry;
    glb.userData.surface = 'floor';
    return glb;
  }
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
  g.userData.surface = 'floor';
  return g;
}

function buildFilingCabinet(x, z, ry = 0) {
  const glb = makeDecoration('cabinet', { width: 0.6, height: 1.4, depth: 0.5 });
  if (glb) {
    glb.position.set(x, 0, z); glb.rotation.y = ry;
    glb.userData.surface = 'floor';
    return glb;
  }
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
  g.userData.surface = 'floor';
  return g;
}

function buildBookshelf(x, z, ry = 0, w = 2.2) {
  const glb = makeDecoration('bookshelf', { width: w, height: 2.6, depth: 0.45 });
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

function buildTable(x, z, ry = 0, w = 2.2) {
  const glb = makeDecoration('table', { width: w, depth: 1.2, height: 0.78 });
  if (glb) {
    glb.position.set(x, 0, z); glb.rotation.y = ry;
    glb.userData.surface = 'floor';
    return glb;
  }
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
  g.userData.surface = 'floor';
  return g;
}

function buildLamp(x, z) {
  // Table lamp — sits on top of a 0.78m table, so the GLB origin needs
  // to be raised to y=0.78. The GLB itself is ~0.55m tall (lamp body).
  const glb = makeDecoration('table_lamp', { width: 0.35, height: 0.55, depth: 0.35 });
  if (glb) {
    glb.position.set(x, 0.78, z);
    // Warm point light at the bulb height for actual illumination.
    const point = new THREE.PointLight(0xfff59d, 0.6, 4);
    point.position.set(0, 0.35, 0);
    glb.add(point);
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
    new THREE.MeshStandardMaterial({ color: 0xfff59d, side: THREE.DoubleSide }));
  shade.position.y = 1.3; g.add(shade);
  const point = new THREE.PointLight(0xfff59d, 0.6, 4);
  point.position.set(0, 1.2, 0); g.add(point);
  g.position.set(x, 0, z);
  g.userData.surface = 'top'; // sits on a table at y≈0.78
  return g;
}

// ─── CEO portrait ────────────────────────────────────────────────────────────
let ceoHearts = null;

// Refined executive headshot — soft gradient shading, defined features,
// reads as a corporate oil-painting portrait at gameplay distance.
function drawCeoPortrait(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const X = (n) => n * W;
  const Y = (n) => n * H;

  // Studio background — soft radial dark-navy with corner vignette.
  const bg = ctx.createRadialGradient(W/2, H*0.45, W*0.1, W/2, H*0.5, W*0.85);
  bg.addColorStop(0, '#3a4a78');
  bg.addColorStop(0.5, '#1e2a4c');
  bg.addColorStop(1, '#0b1224');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Hair back — multi-tone brown with vertical gradient for depth.
  const hairBack = ctx.createLinearGradient(0, Y(0.18), 0, Y(0.70));
  hairBack.addColorStop(0, '#3a2418');
  hairBack.addColorStop(0.5, '#4d2e1e');
  hairBack.addColorStop(1, '#2e1810');
  ctx.fillStyle = hairBack;
  ctx.beginPath();
  ctx.ellipse(X(0.5), Y(0.45), W * 0.28, H * 0.30, 0, 0, Math.PI * 2);
  ctx.fill();
  // Side hair waves
  ctx.beginPath();
  ctx.moveTo(X(0.22), Y(0.40));
  ctx.bezierCurveTo(X(0.20), Y(0.60), X(0.28), Y(0.72), X(0.34), Y(0.66));
  ctx.lineTo(X(0.36), Y(0.55));
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(X(0.78), Y(0.40));
  ctx.bezierCurveTo(X(0.80), Y(0.60), X(0.72), Y(0.72), X(0.66), Y(0.66));
  ctx.lineTo(X(0.64), Y(0.55));
  ctx.closePath();
  ctx.fill();

  // Navy suit/blazer — vertical shading from mid-navy to near-black.
  const suit = ctx.createLinearGradient(0, Y(0.65), 0, Y(1.0));
  suit.addColorStop(0, '#22325e');
  suit.addColorStop(1, '#0e1830');
  ctx.fillStyle = suit;
  ctx.beginPath();
  ctx.moveTo(X(0.05), Y(1.0));
  ctx.lineTo(X(0.05), Y(0.85));
  ctx.bezierCurveTo(X(0.20), Y(0.72), X(0.40), Y(0.66), X(0.50), Y(0.66));
  ctx.bezierCurveTo(X(0.60), Y(0.66), X(0.80), Y(0.72), X(0.95), Y(0.85));
  ctx.lineTo(X(0.95), Y(1.0));
  ctx.closePath();
  ctx.fill();
  // Soft lapel highlights
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.beginPath();
  ctx.moveTo(X(0.34), Y(0.72));
  ctx.lineTo(X(0.45), Y(0.92));
  ctx.lineTo(X(0.42), Y(0.74));
  ctx.closePath();
  ctx.fill();

  // White blouse / shirt
  ctx.fillStyle = '#f5f3ed';
  ctx.beginPath();
  ctx.moveTo(X(0.43), Y(0.72));
  ctx.lineTo(X(0.50), Y(0.95));
  ctx.lineTo(X(0.57), Y(0.72));
  ctx.bezierCurveTo(X(0.54), Y(0.71), X(0.46), Y(0.71), X(0.43), Y(0.72));
  ctx.closePath();
  ctx.fill();

  // Gold lapel pin — radial gradient for metallic depth.
  const pinGrad = ctx.createRadialGradient(X(0.40), Y(0.79), 1, X(0.40), Y(0.79), 14);
  pinGrad.addColorStop(0, '#fff3b6');
  pinGrad.addColorStop(0.6, '#e8b73c');
  pinGrad.addColorStop(1, '#8d6a1e');
  ctx.fillStyle = pinGrad;
  ctx.beginPath();
  ctx.arc(X(0.40), Y(0.79), 12, 0, Math.PI * 2);
  ctx.fill();

  // Neck — slightly darker skin gradient.
  const neckGrad = ctx.createLinearGradient(X(0.5), Y(0.58), X(0.5), Y(0.78));
  neckGrad.addColorStop(0, '#d9b08b');
  neckGrad.addColorStop(1, '#a37e57');
  ctx.fillStyle = neckGrad;
  ctx.beginPath();
  ctx.moveTo(X(0.43), Y(0.58));
  ctx.lineTo(X(0.43), Y(0.72));
  ctx.lineTo(X(0.57), Y(0.72));
  ctx.lineTo(X(0.57), Y(0.58));
  ctx.closePath();
  ctx.fill();
  // Soft shadow under jawline.
  ctx.fillStyle = 'rgba(80,40,20,0.35)';
  ctx.beginPath();
  ctx.ellipse(X(0.50), Y(0.62), W * 0.13, H * 0.025, 0, 0, Math.PI * 2);
  ctx.fill();

  // Face — radial gradient (light upper-left, fades to deeper tone).
  const cx = X(0.5), cy = Y(0.42);
  const faceGrad = ctx.createRadialGradient(cx - W*0.04, cy - H*0.04, W*0.04, cx, cy, W*0.22);
  faceGrad.addColorStop(0, '#fce5cc');
  faceGrad.addColorStop(0.6, '#e8c6a3');
  faceGrad.addColorStop(1, '#b48863');
  ctx.fillStyle = faceGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cy, W * 0.17, H * 0.20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Subtle cheek warmth (not the manga blush dots).
  ctx.fillStyle = 'rgba(180,90,80,0.18)';
  ctx.beginPath();
  ctx.ellipse(X(0.38), Y(0.50), 22, 12, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(X(0.62), Y(0.50), 22, 12, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Hair front — bangs with diagonal gradient highlight.
  const hairFront = ctx.createLinearGradient(X(0.30), Y(0.22), X(0.70), Y(0.36));
  hairFront.addColorStop(0, '#2a1810');
  hairFront.addColorStop(0.5, '#4a2c1c');
  hairFront.addColorStop(1, '#2e1810');
  ctx.fillStyle = hairFront;
  ctx.beginPath();
  ctx.moveTo(X(0.30), Y(0.32));
  ctx.bezierCurveTo(X(0.40), Y(0.18), X(0.62), Y(0.18), X(0.70), Y(0.32));
  ctx.bezierCurveTo(X(0.62), Y(0.36), X(0.50), Y(0.30), X(0.42), Y(0.36));
  ctx.bezierCurveTo(X(0.36), Y(0.34), X(0.32), Y(0.34), X(0.30), Y(0.32));
  ctx.closePath();
  ctx.fill();
  // Highlight strand
  ctx.strokeStyle = 'rgba(140,90,55,0.6)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(X(0.44), Y(0.27));
  ctx.quadraticCurveTo(X(0.55), Y(0.22), X(0.62), Y(0.30));
  ctx.stroke();

  // Eyes — refined, less cartoony (drawCeoEye is also slimmed down).
  drawCeoEye(ctx, X(0.42), Y(0.43));
  drawCeoEye(ctx, X(0.58), Y(0.43));

  // Eyebrows — softer, thinner.
  ctx.strokeStyle = '#2e1d0f';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(X(0.36), Y(0.37));
  ctx.quadraticCurveTo(X(0.42), Y(0.34), X(0.47), Y(0.37));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(X(0.53), Y(0.37));
  ctx.quadraticCurveTo(X(0.58), Y(0.34), X(0.64), Y(0.37));
  ctx.stroke();

  // Nose — side shadow + bright tip + nostril hints.
  ctx.strokeStyle = 'rgba(140,90,60,0.6)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(X(0.485), Y(0.45));
  ctx.lineTo(X(0.485), Y(0.51));
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,240,220,0.4)';
  ctx.beginPath();
  ctx.ellipse(X(0.503), Y(0.51), 3, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(60,30,15,0.55)';
  ctx.beginPath();
  ctx.ellipse(X(0.492), Y(0.525), 2.5, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(X(0.515), Y(0.525), 2.5, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Lips — defined upper/lower with subtle gloss highlight.
  ctx.fillStyle = '#9c344b';
  ctx.beginPath();
  ctx.moveTo(X(0.44), Y(0.56));
  ctx.quadraticCurveTo(X(0.47), Y(0.545), X(0.50), Y(0.555));
  ctx.quadraticCurveTo(X(0.53), Y(0.545), X(0.56), Y(0.56));
  ctx.quadraticCurveTo(X(0.50), Y(0.59), X(0.44), Y(0.56));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(X(0.50), Y(0.563), 6, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Earrings — small gold studs with metallic radial highlight.
  for (const [ex, ey] of [[X(0.33), Y(0.46)], [X(0.67), Y(0.46)]]) {
    const g = ctx.createRadialGradient(ex, ey, 1, ex, ey, 6);
    g.addColorStop(0, '#fff5b8');
    g.addColorStop(1, '#b8881c');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(ex, ey, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Vignette darkening at edges for studio depth.
  const vig = ctx.createRadialGradient(W/2, H/2, W*0.4, W/2, H/2, W*0.7);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

// Refined almond eye — narrower than the old round manga shape, warm
// brown iris, soft eyelid line instead of harsh anime lashes.
function drawCeoEye(ctx, cx, cy) {
  // Sclera — almond shape, slightly squashed vertically.
  ctx.fillStyle = '#fafaf6';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 16, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Iris — warm brown radial gradient.
  const irisGrad = ctx.createRadialGradient(cx, cy, 1, cx, cy, 9);
  irisGrad.addColorStop(0, '#6b4a2b');
  irisGrad.addColorStop(1, '#3a2412');
  ctx.fillStyle = irisGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, 8, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Pupil
  ctx.fillStyle = '#0a0604';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, 3.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Single catchlight (no second sparkle — that read as anime).
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(cx - 3, cy - 2, 2, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Upper eyelid line — defined but soft.
  ctx.strokeStyle = '#1a0b06';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 16, cy - 1);
  ctx.quadraticCurveTo(cx, cy - 12, cx + 16, cy - 1);
  ctx.stroke();
  // Lower lash hint.
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy + 6);
  ctx.quadraticCurveTo(cx, cy + 9, cx + 14, cy + 6);
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

// ─── Room builder registry (Phase 1 data-driven scene assembly) ─────────────
// Maps the `fn` strings in data/rooms.js to existing builders. Wrappers
// translate the loader's (pos, rotY, args, ctx) signature into the
// individual builder's parameter shape. Compound builders (atrium,
// elevator, ceiling, decorate_*, centerpiece, windows) accept ctx and
// piggy-back on scene.add / decoTickers internally — they return null
// so the loader doesn't double-add anything.
let _roomBuildersRegistered = false;
function registerRoomBuilders() {
  if (_roomBuildersRegistered) return;
  _roomBuildersRegistered = true;

  // Shared helpers — drawers / texture builders the loader needs for
  // 'poster', 'wall_sign', 'ceo_portrait' entry types.
  registerSharedHelpers({
    makeLabelSprite,
    makeWallSign,
    buildPosterTexture,
    buildCeoPortrait,
  });

  // ── Furniture / decor builders (return THREE.Object3D) ────────────
  registerRoomBuilder('chair', (pos, rotY, args) =>
    buildChair(pos[0], pos[2], rotY || 0, args.color));
  registerRoomBuilder('desk', (pos, rotY, args) =>
    buildDesk(pos[0], pos[2], rotY || 0, args.w, args.d, args.color));
  registerRoomBuilder('monitor', (pos, rotY, args) =>
    buildMonitor(pos[0], pos[2], rotY || 0, args.screenColor));
  registerRoomBuilder('plant', (pos) => buildPlant(pos[0], pos[2]));
  registerRoomBuilder('water_cooler', (pos) => buildWaterCooler(pos[0], pos[2]));
  registerRoomBuilder('couch', (pos, rotY) => buildCouch(pos[0], pos[2], rotY || 0));
  registerRoomBuilder('filing_cabinet', (pos, rotY) =>
    buildFilingCabinet(pos[0], pos[2], rotY || 0));
  registerRoomBuilder('bookshelf', (pos, rotY, args) =>
    buildBookshelf(pos[0], pos[2], rotY || 0, args.w));
  registerRoomBuilder('table', (pos, rotY, args) =>
    buildTable(pos[0], pos[2], rotY || 0, args.w));
  registerRoomBuilder('lamp', (pos) => buildLamp(pos[0], pos[2]));

  // ── Compound builders (each owns its own multi-mesh placement) ───
  // Each returns null because the underlying builder already calls
  // scene.add internally; we forward any per-frame tickers to ctx.
  registerRoomBuilder('reception_windows', (pos, rotY, args, ctx) => {
    try { receptionWindows = buildReceptionWindows(ctx.scene); }
    catch (e) { console.warn('reception windows failed', e); }
    return null;
  });
  registerRoomBuilder('library_arched_window', (pos, rotY, args, ctx) => {
    try { libraryWindow = buildLibraryArchedWindow(ctx.scene); }
    catch (e) { console.warn('library window failed', e); }
    return null;
  });
  registerRoomBuilder('library_ceiling', (pos, rotY, args, ctx) => {
    try { buildLibraryCeiling(ctx.scene); }
    catch (e) { console.warn('library ceiling failed', e); }
    return null;
  });
  registerRoomBuilder('decorate_reception', (pos, rotY, args, ctx) => {
    try { decorateReception(ctx.scene, ctx.decoTickers); }
    catch (e) { console.warn('reception deco failed', e); }
    return null;
  });
  registerRoomBuilder('decorate_library', (pos, rotY, args, ctx) => {
    try { decorateLibrary(ctx.scene, ctx.decoTickers); }
    catch (e) { console.warn('library deco failed', e); }
    return null;
  });
  registerRoomBuilder('reception_centerpiece', (pos, rotY, args, ctx) => {
    try { buildReceptionCenterpiece(ctx.scene, ctx.decoTickers); }
    catch (e) { console.warn('centerpiece failed', e); }
    return null;
  });
  registerRoomBuilder('atrium', (pos, rotY, args, ctx) => {
    try {
      const atrium = buildAtrium(ctx.scene, { mobile: isMobile() });
      if (atrium?.tickers) for (const t of atrium.tickers) ctx.decoTickers.push(t);
    } catch (e) { console.warn('atrium failed', e); }
    return null;
  });
  registerRoomBuilder('elevator', (pos, rotY, args, ctx) => {
    try {
      const elev = buildElevator(ctx.scene, { mobile: isMobile() });
      if (elev?.tick) ctx.decoTickers.push((dt, now) => elev.tick(dt, now));
      elevatorRef = elev;
    } catch (e) { console.warn('elevator failed', e); }
    return null;
  });
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

  // ─── Phase 1 data-driven assembly ─────────────────────────────────
  // Floor-1 room contents live in data/rooms.js. The loader walks each
  // room's `objects` array and dispatches by entry type:
  //   wall, floor_plate, wall_sign, ceo_portrait      → raw geometry
  //   decoration                                       → makeDecoration()
  //   builder | clutter | poster                       → registered fn
  // Everything that was previously imperative (floor plates, wall
  // segments, the reception desk, plants, desks, chairs, monitors,
  // filing cabinets, bookshelves, tables, lamps, library wall sign,
  // reception/library ceilings, parallax windows, decorate_* passes,
  // reception centerpiece, atrium, elevator) is now declared in
  // data/rooms.js under either the `reception` or `library` room.
  registerRoomBuilders();
  decoTickers = [];
  const ctx = { scene, decoTickers };

  loadRoom(scene, window.ROOM_BY_ID('reception'), ctx);

  // Door from zone 1 (reception) → zone 2 (library), gated by ch01
  // test. registerDoor is interactable-system glue (gating, animation,
  // colour state, label refresh) — kept as code, not data.
  registerDoor(scene, 11, 'ch01', 'Knowledge Library');

  loadRoom(scene, window.ROOM_BY_ID('library'), ctx);

  // Door from zone 2 (library) → zone 3 — labelled by whichever
  // chapter is at the next CURRICULUM position after the reshuffle.
  {
    const gateChapter = (window.CURRICULUM || [])[1];
    const nextChapter = (window.CURRICULUM || [])[2];
    const gateId    = gateChapter?.id || 'ch02';
    const nextTitle = ZONE_THEMES[2]?.title || nextChapter?.title || 'Next Zone';
    registerDoor(scene, 33, gateId, nextTitle);
  }

  // West-wing rooms — shell (floor / walls / sign / accent strip) is
  // theme-derived per ZONE_THEMES[idx] and stays in code. Each call
  // also loads its room's furniture from window.ROOM_BY_ID(...).
  buildFloor1WestRoom(2, -22, 0);    // Files       (CURRICULUM[2])
  buildFloor1WestRoom(3, -22, 22);   // Plan Mode   (CURRICULUM[3])

  // ─── Interactable objects (Pillar 2) — driven by lessonRegistry ──────────
  // Each chapter's delivery config either spawns an object or stays
  // NPC-delivered. NPC-delivered chapters need no object here.
  clearInteractables();
  interactObjects = [];
  const buildersByKind = {
    computer:    buildComputer,
    book:        buildBook,
    whiteboard:  buildWhiteboardObject,
    server:      buildServerRack,
    display:     buildDemoScreenObject,
    phone:       buildPhone,
  };
  const onObjectInteract = (info) => {
    if (window.LessonOverlay?.open) {
      window.LessonOverlay.open(info);
    } else {
      window.App?.navigate?.('lesson', {
        chapterId: info.chapterId, lessonId: info.lessonId, fromPlay: true,
      });
    }
  };
  for (const [chapterId, cfg] of Object.entries(LESSON_DELIVERY)) {
    if (!cfg.delivery || cfg.delivery === 'npc') continue;
    const builder = buildersByKind[cfg.delivery];
    if (!builder) continue;
    const loc = cfg.objectLocation;
    if (!loc?.position) continue;
    try {
      const obj = builder({
        scene,
        position: loc.position,
        lookAt: 0,
        chapterId: cfg.chapterId || chapterId,
        lessonId: cfg.lessonId,
        onInteract: onObjectInteract,
      });
      interactObjects.push(obj);
    } catch (e) {
      console.warn(`object build failed for ${chapterId} (${cfg.delivery})`, e);
    }
  }

  // Atrium + elevator now load via the reception room's `atrium` and
  // `elevator` builder entries in data/rooms.js (run by loadRoom above).

  registerStaticColliders();

  // Tag everything built up to here as floor 1. The elevator shaft is
  // an exception — it spans all floors and stays visible.
  tagSceneFloor1();

  // Floors 2-4 are NOT built here anymore. They're built lazily by
  // loadFloor(f) the first time the player rides the elevator to that
  // floor (see requestFloorChange). Initial page load only pays the
  // cost of floor 1.

  // Surface-attachment rule — DISABLED. The settler caused buildWorld
  // to throw mid-build (symptom: empty canvas / "all white" screen).
  // Tagging infrastructure on builders stays in place for future use;
  // the call is parked behind a try/catch until the failure mode is
  // diagnosed.
  try { settleStaticObjects(); }
  catch (e) { console.warn('[play] settleStaticObjects skipped due to error:', e); }

  // Initial visibility — show floor 1 only.
  applyFloorVisibility();

  // Collect wall meshes for camera occlusion. Heuristic: a wall is a
  // mesh whose BoxGeometry has one horizontal dimension ≤ 0.5m (thin
  // panel) and a vertical extent ≥ 2.5m (full-room height). This catches
  // every outer-perimeter wall, internal divider, and tall-wall extension
  // added by buildWorld / buildFloorOffice / buildAtrium / buildFloor1WestRoom
  // without each one having to opt-in. Skinned characters and small
  // furniture are filtered out.
  cameraWalls.length = 0;
  scene.traverse(obj => {
    if (!obj.isMesh || obj.isSkinnedMesh) return;
    const g = obj.geometry;
    if (!g || !g.isBufferGeometry) return;
    if (!g.boundingBox) g.computeBoundingBox();
    const bb = g.boundingBox; if (!bb) return;
    const sx = bb.max.x - bb.min.x;
    const sy = bb.max.y - bb.min.y;
    const sz = bb.max.z - bb.min.z;
    const thinHoriz = (sx <= 0.5 || sz <= 0.5);
    const tall = sy >= 2.5;
    if (thinHoriz && tall) cameraWalls.push(obj);
  });
  _cameraWallsCacheFloor = -1;
}

// ─── Surface-attachment rule ────────────────────────────────────────────────
// Static objects must "touch" a surface. Each builder declares the
// object's intended surface via userData.surface:
//
//   'floor'    — rests on the floor plate. Snap bbox.min.y to
//                floorBaseY(obj.userData.floor || 1).
//   'top'      — rests on top of another object below. Raycast down,
//                snap bbox.min.y to the hit surface (falls back to
//                floor Y if nothing's directly underneath).
//   'wall'     — mounted on a wall (poster, sign, monitor on a desk
//                back). Builder owns position; settler leaves alone.
//   'ceiling'  — hangs from the ceiling (chandelier, hanging plant).
//                Builder owns position; settler leaves alone.
//   'mounted'  — child of a parent that already has a known position.
//   undefined  — untagged; settler leaves alone (safe default).
//
// Run after buildWorld + buildFloorOffice. Anything added later (live
// agents, ceremony effects) is responsible for its own positioning.
function settleStaticObjects() {
  if (!scene) return;
  const raycaster = new THREE.Raycaster();
  const down = new THREE.Vector3(0, -1, 0);
  // Snapshot children list so re-positioning doesn't affect iteration.
  const candidates = [];
  for (const obj of scene.children) {
    const s = obj.userData?.surface;
    if (s === 'floor' || s === 'top') candidates.push(obj);
  }
  for (const obj of candidates) {
    const bbox = new THREE.Box3().setFromObject(obj);
    if (bbox.isEmpty()) continue;
    const objFloor = obj.userData.floor || 1;
    let targetY;
    if (obj.userData.surface === 'floor') {
      targetY = floorBaseY(objFloor);
    } else {
      // 'top' — find the surface directly beneath. Start the ray a bit
      // ABOVE the object's bottom to avoid the raycaster starting inside
      // a thin overlapping surface.
      raycaster.set(
        new THREE.Vector3(obj.position.x, bbox.min.y + 0.1, obj.position.z),
        down,
      );
      const hits = raycaster.intersectObjects(scene.children, true)
        .filter(h => !isAncestorOrSelf(obj, h.object) && h.point.y < bbox.min.y + 0.05);
      targetY = hits.length ? hits[0].point.y : floorBaseY(objFloor);
    }
    const gap = bbox.min.y - targetY;
    if (Math.abs(gap) > 0.05) {
      obj.position.y -= gap;
    }
  }
}

function isAncestorOrSelf(ancestor, node) {
  let p = node;
  while (p) { if (p === ancestor) return true; p = p.parent; }
  return false;
}

let elevatorRef = null;

// Walk up the parent chain; return true if any ancestor (or self) has
// userData.crossFloor === true. Used to opt-out of floor tagging /
// visibility toggling — the elevator's shaft and signage span floors.
function isCrossFloor(obj) {
  let p = obj;
  while (p && p !== scene) {
    if (p.userData && p.userData.crossFloor === true) return true;
    p = p.parent;
  }
  return false;
}

// Mark every floor-untagged mesh as belonging to floor 1, so the
// visibility toggle knows what to hide when the player rides up.
// Cross-floor objects (elevator, sky, lights) are skipped along with
// their descendants.
function tagSceneFloor1() {
  scene.traverse((obj) => {
    if (obj === scene) return;
    if (isCrossFloor(obj)) return;
    // Lights illuminate every floor — never hide them per-floor.
    if (obj.isLight) { obj.userData.crossFloor = true; return; }
    if (obj.userData.floor === undefined) {
      obj.userData.floor = 1;
    }
  });
  // Sky dome + sun pivot stay visible across floors.
  if (skyDome?.mesh) skyDome.mesh.userData.crossFloor = true;
  if (skyDome?.sunPivot) skyDome.sunPivot.userData.crossFloor = true;
}

// Build a 22×22 floor for floors 2-4 partitioned into a 2×2 grid of
// quadrants — one per chapter. The elevator door (now on the east wall
// at z=-7.6, matching world/elevator.js after the move outside the
// atrium) opens into the NE quadrant. Internal cross-walls at x=0 and
// z=0 divide the room into 4; each cross-wall has a 2m doorway at the
// origin so the player can walk between quadrants.
function buildFloorOffice(floorIdx) {
  const y0 = floorBaseY(floorIdx);
  const wallH = 3.8;
  const themeIdx = (floorIdx - 1) * CHAPTERS_PER_FLOOR;
  const theme = ZONE_THEMES[themeIdx] || { floor: 0xa1887f, wall: 0xefebe9, accent: '#5d4037', metal: 0.1, title: floorThemeName(floorIdx) };

  // Floor plate
  const floorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 22),
    new THREE.MeshStandardMaterial({
      color: theme.floor, metalness: theme.metal, roughness: Math.max(0.15, 0.85 - theme.metal),
    }),
  );
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.set(0, y0, 0);
  floorMesh.receiveShadow = true;
  floorMesh.userData.floor = floorIdx;
  scene.add(floorMesh);

  // Ceiling
  const ceilingMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 22),
    new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.85 }),
  );
  ceilingMesh.rotation.x = Math.PI / 2;
  ceilingMesh.position.set(0, y0 + wallH + 0.2, 0);
  ceilingMesh.userData.floor = floorIdx;
  scene.add(ceilingMesh);

  const wallMat = new THREE.MeshStandardMaterial({
    color: theme.wall, metalness: theme.metal * 0.4, roughness: 0.7,
  });
  // Slightly different tint for internal partitions so they read as a
  // step away from the outer envelope.
  const innerWallMat = new THREE.MeshStandardMaterial({
    color: 0xf4ecd8, metalness: 0.03, roughness: 0.7,
  });
  function addWall(w, h, d, x, z, mat = wallMat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y0 + h / 2, z);
    m.castShadow = true; m.receiveShadow = true;
    m.userData.floor = floorIdx;
    scene.add(m);
  }

  // ── Outer perimeter ────────────────────────────────────────────────
  // North, south, west walls — solid 22m.
  addWall(22, wallH, 0.3, 0, -11);
  addWall(22, wallH, 0.3, 0,  11);
  addWall(0.3, wallH, 22, -11, 0);
  // East wall — split around the elevator door at z=-7.6 (matches
  // elevator.js's shaft door which faces west into this floor). Door
  // opening is 2.4m wide and 2.6m tall.
  addWall(0.3, wallH, 2.2, 11, -9.9);    // north stub (z=-11..-8.8)
  addWall(0.3, wallH, 17.4, 11, 2.3);    // south of elevator (z=-6.4..+11)
  // Lintel above the elevator door — 1.2m tall closing y∈[2.6, 3.8].
  const elevLintel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 2.4), wallMat);
  elevLintel.position.set(11, y0 + wallH - 0.6, -7.6);
  elevLintel.castShadow = true; elevLintel.receiveShadow = true;
  elevLintel.userData.floor = floorIdx;
  scene.add(elevLintel);

  // ── Internal cross-walls — 2×2 quadrant layout ──────────────────────
  // Horizontal divider at z=0: two 5m segments leaving a 2m doorway at
  // x=0 (player can walk between north and south quadrants).
  addWall(10, wallH, 0.3, -6, 0, innerWallMat);   // west half (x=-11..-1)
  addWall(10, wallH, 0.3,  6, 0, innerWallMat);   // east half (x=+1..+11)
  // Vertical divider at x=0: two 5m segments leaving a 2m doorway at z=0.
  addWall(0.3, wallH, 10, 0, -6, innerWallMat);   // north half (z=-11..-1)
  addWall(0.3, wallH, 10, 0,  6, innerWallMat);   // south half (z=+1..+11)

  // Floor title sign on north wall
  const sign = makeWallSign(`FLOOR ${floorIdx} — ${(theme.title || '').toUpperCase()}`, 9, 1.4, '#1a2744', theme.accent || '#ffd54f');
  sign.position.set(0, y0 + 2.6, 11 - 0.16);
  sign.rotation.y = Math.PI;
  sign.userData.floor = floorIdx;
  scene.add(sign);

  // ── Chapter-cluster desks from data (data/rooms.js → office_floor<N>) ──
  // Each desk lives at the same {±5.5, 0, ±5.5} slot per floor; the
  // loader translates Y by floorBaseY(floorIdx) so the data can stay
  // floor-relative.
  const room = window.ROOM_BY_ID && window.ROOM_BY_ID(`office_floor${floorIdx}`);
  if (room) {
    loadRoom(scene, room, { scene, decoTickers, yOffset: y0 });
  }

  // Chapter label signs above each desk — theme-coupled (per chapter
  // accent colour + title pulled from ZONE_THEMES and CURRICULUM), so
  // these stay in code rather than data.
  const slots = [
    { x: -5.5, z: -5.5, face: 0 },
    { x:  5.5, z: -5.5, face: 0 },
    { x: -5.5, z:  5.5, face: Math.PI },
    { x:  5.5, z:  5.5, face: Math.PI },
  ];
  for (let s = 0; s < CHAPTERS_PER_FLOOR; s++) {
    const slot = slots[s];
    const chapterNum = (floorIdx - 1) * CHAPTERS_PER_FLOOR + s + 1;
    const chTheme = ZONE_THEMES[chapterNum - 1];
    const chTitle = chTheme?.title || (window.CURRICULUM?.[chapterNum - 1]?.title) || `Chapter ${chapterNum}`;
    const chSign = makeWallSign(`CH${String(chapterNum).padStart(2, '0')} — ${chTitle.toUpperCase()}`, 4.5, 0.55, '#1a2744', chTheme?.accent || '#ffd54f');
    chSign.position.set(slot.x, y0 + 2.4, slot.z);
    chSign.rotation.y = slot.face;
    chSign.userData.floor = floorIdx;
    scene.add(chSign);
  }
}

// Compute the override XZ position for a chapter-5+ NPC, placing it in
// the appropriate floor's office layout near its chapter's desk slot.
// Lesson NPCs cluster around the desk; the test NPC stands behind it.
// Compute the override XZ position for a procedural floor-1 west-wing
// NPC (ch03 Files or ch04 Plan Mode in the new 2×2 layout). Their
// original generated positions assumed the legacy 1×4 corridor at z=44
// and z=66; this snaps them to the new room centers.
function floor1WestWingPositionForNPC(npcDef) {
  const idx = indexForChapterId(npcDef.chapterId);
  if (idx !== 2 && idx !== 3) return null; // only ch03/ch04 (new positions 3/4)
  const centerX = -22;
  const centerZ = idx === 2 ? 0 : 22; // Files at z=0, Plan Mode at z=22
  // Use the same slot offsets the original generateChapterNPCs uses,
  // but recentered on the new room.
  const ch = window.CURRICULUM?.[idx];
  if (!ch) return null;
  if (npcDef.kind === 'test') {
    return { pos: [centerX, centerZ + 8.5], face: Math.PI };
  }
  // Lesson NPCs — generateChapterNPCs slot pattern: x = ±6 alternating,
  // z = centerZ - 4, 0, +4 cycling. We replicate by lesson index.
  const m = (npcDef.lessonId || '').match(/-l(\d+)$/);
  const li = m ? Math.max(0, parseInt(m[1], 10) - 1) : 0;
  const xSign = (li % 2 === 0) ? -1 : 1;
  const zOff = [-4, 0, 4][(li >> 1) % 3];
  return {
    pos: [centerX + xSign * 6, centerZ + zOff],
    face: xSign < 0 ? Math.PI / 2 : -Math.PI / 2,
  };
}

function floorOfficePositionForNPC(npcDef) {
  const chId = npcDef.chapterId;
  const idx = indexForChapterId(chId);
  if (idx < 0) return null;
  const f = floorForChapterIdx(idx);
  if (f <= 1) return null; // floor 1 keeps original positions
  const slotIdx = idx % CHAPTERS_PER_FLOOR; // 0..3 within floor
  const slots = [
    { cx: -5.5, cz: -5.5, face: 0,        rearZ: -7.0 },
    { cx:  5.5, cz: -5.5, face: 0,        rearZ: -7.0 },
    { cx: -5.5, cz:  5.5, face: Math.PI,  rearZ:  7.0 },
    { cx:  5.5, cz:  5.5, face: Math.PI,  rearZ:  7.0 },
  ];
  const slot = slots[slotIdx];
  // Spread lesson NPCs in a small arc in front of the desk; test NPC
  // stands behind the desk (closer to the wall).
  if (npcDef.kind === 'test') {
    return { pos: [slot.cx, slot.rearZ], face: slot.face + Math.PI, y: floorBaseY(f) };
  }
  // Lesson NPCs — distribute along x within ±2m of cluster center
  // based on lesson index (extract from lessonId like 'ch05-l02').
  const lm = (npcDef.lessonId || '').match(/-l(\d+)$/);
  const lessonIdx = lm ? Math.max(0, parseInt(lm[1], 10) - 1) : 0;
  const dx = (lessonIdx - 1) * 1.4; // -1.4, 0, +1.4, +2.8 (rare 5th)
  const dz = (slot.cz > 0) ? -1.6 : 1.6; // step IN from cluster center toward the room center
  return { pos: [slot.cx + dx, slot.cz + dz], face: slot.face, y: floorBaseY(f) };
}

// Iterate scene and toggle visibility based on userData.floor.
// Skip cross-floor objects (and their descendants).
function applyFloorVisibility() {
  scene.traverse((obj) => {
    if (obj === scene) return;
    if (isCrossFloor(obj)) return;
    const f = obj.userData.floor;
    if (f === undefined) return;
    obj.visible = (f === currentFloor);
  });
}

// Register AABBs for the chest-height+ static furniture so the player
// can't walk through it. Positions mirror the placements just above
// (reception desks, IT/staff desks, couches, filing cabinets,
// bookshelves) plus the atrium's replacement reception desk added by
// buildAtrium. Padding of ~0.05m on each side keeps the player visually
// off the surface; the global PLAYER_RADIUS handles the player's
// half-width.
function registerStaticColliders() {
  colliders.length = 0;

  // Floor-1 internal walls — the 2×2 layout adds shared walls between
  // atrium ↔ Files (at x=-11) and library ↔ Plan Mode (at x=-11), plus
  // a Files ↔ Plan Mode wall at z=11 in the west wing. Each has a
  // 3.5m doorway centered at the shared mid-line; the segments below
  // are the SOLID parts the player can't pass through.
  // Atrium / Files boundary (x=-11), doorway at z=0:
  addColliderAABB(-11.15, -10.85, -11, -1.75, 1);   // south of doorway
  addColliderAABB(-11.15, -10.85,  1.75, 11, 1);    // north of doorway
  // Library / Plan Mode boundary (x=-11), doorway at z=22:
  addColliderAABB(-11.15, -10.85, 11, 20.25, 1);    // south of doorway
  addColliderAABB(-11.15, -10.85, 23.75, 33, 1);    // north of doorway
  // Files / Plan Mode boundary (z=11 in west wing), doorway at x=-22:
  addColliderAABB(-33, -23.75, 10.85, 11.15, 1);   // west of doorway
  addColliderAABB(-20.25, -11, 10.85, 11.15, 1);   // east of doorway

  // Zone 1 — reception/onboarding.
  // Original brown reception desk (play.js:1173): 3.0 × 1.2 centered at (0,-8).
  addColliderAABB(-1.55, 1.55, -8.65, -7.35);
  // Atrium replacement reception desk (atrium.js:265): 3.5 × 1.05 at (0,-7.6).
  addColliderAABB(-1.80, 1.80, -8.18, -7.02);
  // Marcus IT bench at (-7.5,-3), rotated π/2 — buildDesk 1.6×0.8 → footprint 0.8×1.6 after rotation.
  addColliderAABB(-7.95, -7.05, -3.85, -2.15);
  // Aisha desk at (7.5,-3), rotated -π/2 — same shape mirrored.
  addColliderAABB(7.05, 7.95, -3.85, -2.15);
  // Kenji desk at (-7.5,3), rotated π/2 — 2.2×0.8 → 0.8×2.2 after rotation.
  addColliderAABB(-7.95, -7.05, 1.85, 4.15);
  // Diana filing cabinets at x=7.6, z={2,3,4} — small chest-high boxes.
  addColliderAABB(7.25, 7.95, 1.65, 4.35);
  // Couches at (-8.5,5) and (8.5,5), rotated to face inward.
  // buildCouch default footprint ≈ 1.8×0.8; rotation puts long axis along Z.
  addColliderAABB(-9.10, -7.90, 4.30, 5.70);
  addColliderAABB(7.90, 9.10, 4.30, 5.70);

  // Zone 2 — library bookshelves and reading tables.
  // Bookshelves at (-10.5, {14,18,26}) rotated π/2 — back is 2.2 wide × 0.4 deep,
  // rotated so 2.2 axis aligns with Z. Sit flush against the wall.
  for (const z of [14, 18, 26]) {
    addColliderAABB(-10.50, -10.10, z - 1.15, z + 1.15);
    addColliderAABB( 10.10,  10.50, z - 1.15, z + 1.15);
  }
  // Reading tables at z=16, z=22 — modest height boxes.
  for (const z of [16, 22]) {
    addColliderAABB(-1.15, 1.15, z - 0.55, z + 0.55);
  }
  // Grandfather clock at (-9.5,31), library cart at (8,14).
  addColliderAABB(-9.85, -9.15, 30.70, 31.30);
  addColliderAABB( 7.55,  8.45, 13.65, 14.35);

  // Floors 2-4: four chapter-desks per floor at the cluster centers,
  // plus the internal 2×2-divider walls so the player can only pass
  // through the central doorways.
  for (let f = 2; f <= FLOORS_TOTAL; f++) {
    const slots = [
      [-5.5, -5.5], [5.5, -5.5], [-5.5, 5.5], [5.5, 5.5],
    ];
    for (const [cx, cz] of slots) {
      addColliderAABB(cx - 0.85, cx + 0.85, cz - 0.45, cz + 0.45, f);
    }
    // Horizontal divider at z=0 — two 10m segments leaving a 2m gap at x=0.
    addColliderAABB(-11, -1, -0.15, 0.15, f);
    addColliderAABB(  1, 11, -0.15, 0.15, f);
    // Vertical divider at x=0 — two 10m segments leaving a 2m gap at z=0.
    addColliderAABB(-0.15, 0.15, -11, -1, f);
    addColliderAABB(-0.15, 0.15,   1, 11, f);
  }
}

// ─── Generic zone builder (used for chapters 3-16) ───────────────────────────
function registerDoor(targetScene, atZ, gateChId, nextTitle) {
  const passed = isTestDone(`${gateChId}-test`);
  const doorMat = new THREE.MeshStandardMaterial({
    color: passed ? 0x4caf50 : 0x5d4037,
    metalness: 0.3, roughness: 0.6,
  });
  // Hinge group at the door's LEFT edge so a Y-axis rotation swings the
  // door open like a real door. The door mesh is offset +1.75 in pivot-local
  // X so its left edge lines up with the hinge.
  const DOOR_W = 3.5;
  const pivot = new THREE.Group();
  pivot.position.set(-DOOR_W / 2, 1.3, atZ - 0.01);
  const door = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W, 2.6, 0.2), doorMat);
  door.position.set(DOOR_W / 2, 0, 0);
  pivot.add(door);
  // -π/2 swings the door INTO the destination zone (away from the player
  // who approaches from the south). 0 = closed.
  const OPEN_ROT = -Math.PI / 2;
  pivot.rotation.y = passed ? OPEN_ROT : 0;
  targetScene.add(pivot);

  const label = makeLabelSprite(
    passed ? `${nextTitle} — Open` : `${nextTitle} — Locked`,
    '#fff', passed ? 'rgba(38,140,90,0.95)' : 'rgba(60,72,110,0.95)',
  );
  label.scale.set(3.0, 0.7, 1);
  label.position.set(0, 3.4, atZ + 0.05);
  targetScene.add(label);

  zoneDoors.push({
    mesh: door, pivot, label,
    gateChapter: gateChId, nextTitle,
    lastOpen: passed,
    openRot: OPEN_ROT,
  });
}

// Build a single floor-1 room at the given center position. Used for
// the WEST WING rooms (Files at (-22, 0), Plan Mode at (-22, 22)).
// Same shape as buildGenericZone but positioned arbitrarily; doorway
// openings in the east + (for Files) north walls connect to the
// atrium / library / sibling west-wing room.
function buildFloor1WestRoom(idx, centerX, centerZ) {
  const theme = ZONE_THEMES[idx];
  if (!theme) return;
  const wallH = 3.8;

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 22),
    new THREE.MeshStandardMaterial({
      color: theme.floor, metalness: theme.metal, roughness: Math.max(0.15, 0.85 - theme.metal),
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(centerX, 0, centerZ);
  floor.receiveShadow = true;
  scene.add(floor);

  // Walls — west / north / south are SOLID. East wall has the doorway
  // that connects to atrium (idx=2) or library (idx=3). For idx=2 the
  // north wall also has a doorway to the Plan Mode room above it.
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
  // West wall — always outer
  w(0.3, wallH, 22, centerX - 11, wallH / 2, centerZ);
  // East wall is SHARED with the atrium (idx=2) or library (idx=3) —
  // they built the wall (with its doorway) on their side; skip it here.
  // For Files (idx=2): north is outer, south is the shared boundary
  // with Plan Mode and carries the inter-room doorway.
  if (idx === 2) {
    w(22, wallH, 0.3, centerX, wallH / 2, centerZ - 11);   // north outer
    // South wall split (boundary with Plan Mode), 3.5m doorway at room center
    w(9.25, wallH, 0.3, centerX - 6.375, wallH / 2, centerZ + 11);
    w(9.25, wallH, 0.3, centerX + 6.375, wallH / 2, centerZ + 11);
    w(3.5, 1.2, 0.3, centerX, wallH - 0.6, centerZ + 11);
  } else {
    // Plan Mode (idx=3): north wall is shared with Files (already built);
    // south wall is outer.
    w(22, wallH, 0.3, centerX, wallH / 2, centerZ + 11);
  }

  // Title sign on the inside of the west wall, facing east.
  const sign = makeWallSign(theme.title.toUpperCase(), 7, 1.4, '#1a2744', theme.accent);
  sign.position.set(centerX - 10.83, 2.6, centerZ);
  sign.rotation.y = Math.PI / 2;
  scene.add(sign);

  // Generic decor — central table + lamp + 4 corner plants. Loaded
  // from data/rooms.js (id 'west_files' or 'west_planmode' depending
  // on idx); the shell above stays in code because the theme drives
  // every colour/metalness value.
  const roomId = idx === 2 ? 'west_files' : (idx === 3 ? 'west_planmode' : null);
  if (roomId && window.ROOM_BY_ID) {
    const room = window.ROOM_BY_ID(roomId);
    if (room) loadRoom(scene, room, { scene, decoTickers });
  }

  // Themed accent strip
  const accentColor = parseInt(theme.accent.replace('#',''), 16);
  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 18),
    new THREE.MeshStandardMaterial({
      color: accentColor, metalness: 0.6, roughness: 0.2,
      emissive: accentColor, emissiveIntensity: theme.metal * 0.6,
    }),
  );
  strip.rotation.x = -Math.PI / 2;
  strip.position.set(centerX, 0.002, centerZ);
  scene.add(strip);
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

  // Front wall (split with doorway), or solid back wall if it's the last
  // zone on its floor. Chapters 5+ live on upper floors, so zone 3
  // (chapter 4) is now floor-1's terminus — solid wall, take the
  // elevator to continue.
  const isLast = idx === ZONE_COUNT - 1;
  const isFloor1End = idx === CHAPTERS_PER_FLOOR - 1;
  if (!isLast && !isFloor1End) {
    w(8.5, wallH, 0.3, -6.75, wallH/2, endZ);
    w(8.5, wallH, 0.3,  6.75, wallH/2, endZ);
    w(4, 1.2, 0.3, 0, wallH - 0.6, endZ);
    const nextTheme = ZONE_THEMES[idx + 1];
    const nextTitle = nextTheme?.title || `Chapter ${idx + 2}`;
    registerDoor(scene, endZ, ZONE_BOUNDS[idx].chapterId, nextTitle);
  } else {
    // Solid back wall — capstone (zone 15) OR end of floor 1 (zone 3).
    w(22, wallH, 0.3, 0, wallH/2, endZ);
    if (isLast) {
      // Capstone trophy plaque (only for actual chapter-16 zone, but
      // chapters 5-16 now live on upper floors so this branch only
      // runs if buildGenericZone is ever called for the capstone zone
      // again — kept defensively).
      const trophy = makeWallSign('🏆 CAPSTONE COMPLETE 🏆', 8, 1.6, '#1a2744', '#ffd700');
      trophy.position.set(0, 2.8, endZ - 0.16);
      scene.add(trophy);
    } else {
      // End of floor 1 — point the player at the elevator.
      const sign = makeWallSign('TAKE THE ELEVATOR ↗', 7, 1.4, '#1a2744', '#ffd54f');
      sign.position.set(0, 2.6, endZ - 0.16);
      scene.add(sign);
    }
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
  // GLTF route — when the player is a rigged Quaternius character,
  // attach accessories to bones via gltfChar.attachAt instead of
  // adding them at hard-coded absolute Y positions (which are tuned
  // for the procedural body and would float/clip on a real rig).
  if (group.userData.gltfChar) {
    addGltfPlayerAccessories(group, tier);
    return;
  }
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

// Bone-attached accessories for the GLTF player. Local offsets are
// expressed RELATIVE TO THE BONE — the bone's world transform supplies
// the absolute position. Quaternius/Mixamo bone convention assumed:
//   • Head bone +Z is forward (face direction); +Y is up.
//   • Chest (Spine2) +Y is up the body.
//   • LeftHand/RightHand bone is at the wrist; +Y is down the palm.
// If a bone doesn't exist on the rig, attachAt falls back to attaching
// to the group root and logs a warning — better than crashing.
function addGltfPlayerAccessories(group, tier) {
  const c = group.userData.gltfChar;
  if (!c) return;

  // Tier 1: lanyard + name badge on chest.
  if (tier >= 1) {
    const lan = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.30, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x1a237e }),
    );
    lan.position.set(0, -0.05, 0.08);
    c.attachAt('chest', lan);
    const badge = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.18, 0.012),
      new THREE.MeshStandardMaterial({ color: 0xffffff }),
    );
    badge.position.set(0, -0.20, 0.09);
    c.attachAt('chest', badge);
  }
  // Tier 2: tie hanging from chest.
  if (tier >= 2) {
    const tie = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.42, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xb71c1c, metalness: 0.1, roughness: 0.6 }),
    );
    tie.position.set(0, -0.25, 0.10);
    c.attachAt('chest', tie);
    const knot = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.08, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x7f1313 }),
    );
    knot.position.set(0, 0.02, 0.10);
    c.attachAt('chest', knot);
  }
  // Tier 3: watch on left wrist (the bone's frame, not the body's).
  if (tier >= 3) {
    const watch = new THREE.Mesh(
      new THREE.BoxGeometry(0.10, 0.06, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x424242, metalness: 0.7, roughness: 0.3 }),
    );
    watch.position.set(0, 0, 0.05);
    c.attachAt('leftHand', watch);
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.06, 0.04),
      new THREE.MeshBasicMaterial({ color: 0xfff59d }),
    );
    face.position.set(0, 0, 0.072);
    c.attachAt('leftHand', face);
  }
  // Tier 4: vest material override on the body's torso material —
  // safer than overlaying a vest box (would clip the rig).
  // We swap the first material on the SkinnedMesh whose material's
  // current colour looks like a shirt (highest brightness).
  if (tier >= 4) {
    let bodyMesh = null;
    group.traverse(o => {
      if (!bodyMesh && o.isSkinnedMesh && o.material?.color) bodyMesh = o;
    });
    if (bodyMesh && bodyMesh.material) {
      const mat = bodyMesh.material.clone();
      mat.color.set(0x263238);
      mat.metalness = 0.3;
      mat.roughness = 0.5;
      bodyMesh.material = mat;
      group.userData._vestMaterial = mat;
    }
    // Three small gold buttons down the chest (still primitives).
    for (let i = 0; i < 3; i++) {
      const btn = new THREE.Mesh(
        new THREE.SphereGeometry(0.022, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0xc9a44c, metalness: 0.8, roughness: 0.2 }),
      );
      btn.position.set(0, -0.05 - i * 0.10, 0.10);
      c.attachAt('chest', btn);
    }
  }
  // Tier 5: glasses on the head bone.
  if (tier >= 5) {
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x111111, metalness: 0.6, roughness: 0.3,
    });
    const lensL = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 16), frameMat);
    lensL.rotation.y = Math.PI / 2;
    lensL.position.set(-0.07, 0.03, 0.10);
    c.attachAt('head', lensL);
    const lensR = lensL.clone(); lensR.position.x = 0.07;
    c.attachAt('head', lensR);
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.01), frameMat);
    bridge.position.set(0, 0.03, 0.11);
    c.attachAt('head', bridge);
  }
  // Tier 6: gold necklace on the chest/neck.
  if (tier >= 6) {
    const chain = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.012, 8, 32),
      new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.1 }),
    );
    chain.rotation.x = Math.PI / 2;
    chain.position.set(0, 0.05, 0);
    chain.scale.set(1, 0.65, 1);
    c.attachAt('neck', chain);
    const pendant = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.1 }),
    );
    pendant.position.set(0, -0.06, 0.10);
    c.attachAt('neck', pendant);
  }
  // Tier 7: lapel pin + halo crown.
  if (tier >= 7) {
    const pin = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 12, 10),
      new THREE.MeshStandardMaterial({
        color: 0xff4081, metalness: 0.5, roughness: 0.2, emissive: 0x331122,
      }),
    );
    pin.position.set(-0.14, -0.05, 0.10);
    c.attachAt('chest', pin);
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.022, 12, 32),
      new THREE.MeshStandardMaterial({
        color: 0xffeb3b, metalness: 0.8, roughness: 0.2, emissive: 0x222200,
      }),
    );
    halo.position.set(0, 0.30, 0);
    halo.rotation.x = Math.PI / 2;
    c.attachAt('head', halo);
    group.userData.halo = halo;
  }
}

function buildPlayer() {
  // Defensive cleanup of any previous player mesh — fixes "duplicate
  // tier tag" where customization rebuilds left an old player in the
  // graph because the reference path missed something.
  if (player && scene) {
    scene.remove(player);
    player.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose?.();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(m => { if (m && m.map) m.map.dispose?.(); m && m.dispose?.(); });
      }
    });
  }
  const o = getOutfit();
  const tier = getCompletedChapterCount();
  // Player look is owned by playerLook.js — keeps the player face
  // pipeline explicit so it can never be silently skipped.
  // _id='player' means flatFace.js will look up FACE_CONFIGS.player
  // (we ensure that entry exists below) or fall back to the deterministic
  // generator. Either way, the player gets a face.
  const playerLook = { ...buildPlayerLook(o), _id: 'player' };
  player = makeCharacter(playerLook);
  addPlayerAccessories(player, tier);

  // GUARD — the brief is explicit that the player has been faceless for
  // 6 runs. This verifies, in code, that the player.userData.face is
  // set immediately after build. If not, the player will have to walk
  // around faceless again. We log loudly so a regression is impossible
  // to miss.
  if (!player.userData?.face) {
    console.error('[buildPlayer] FACE MISSING — userData.face is null/undefined. Check makeCharacter / attachFlatFace.');
  } else if (player.userData.faceKind !== 'flat') {
    console.warn(`[buildPlayer] face attached but kind=${player.userData.faceKind} (expected 'flat')`);
  } else {
    console.log('[buildPlayer] flat-face attached:', player.userData.faceConfig);
  }

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

  // The player's rank label is already shown in the top-right HUD
  // ("Tier: Director" etc.) — having a duplicate gold pill floating
  // above the avatar was redundant and visually noisy. Removed.
}

// Ines: kid waiting in the office, cycles through child-like activities.
// All animations come from her Meshy clip pack — no procedural hacks.
//
// Activity state machine. Random pickable activities are idle/dance/jump/
// sitDown/walk. sitDown is the entry to a 3-step compound: sitDown →
// sitIdle → standUp → pick again. Durations are clip-length for one-shots,
// random ranges for loops.
const INES_STANCE_FACTOR = 1.0; // bind pose width left as-is
// Toe-out angle for idle + walk: rotates each foot around the world Y
// axis so the toes splay outward. Visually separates the two shoes
// without changing leg spacing.
const INES_TOE_OUT_RAD = 0; // v5 mesh has properly separated feet — toe-out no longer needed
const _INES_Y_AXIS = new THREE.Vector3(0, 1, 0);
const _INES_TMP_Q_A = new THREE.Quaternion();
const _INES_TMP_Q_B = new THREE.Quaternion();
const _INES_TMP_Q_C = new THREE.Quaternion();
function applyInesToeOut(skeleton, angleRad) {
  if (!skeleton) return;
  for (const side of ['Left', 'Right']) {
    const foot = skeleton.getBoneByName(side + 'Foot');
    if (!foot || !foot.parent) continue;
    const signedAngle = side === 'Left' ? angleRad : -angleRad;
    _INES_TMP_Q_A.setFromAxisAngle(_INES_Y_AXIS, signedAngle);
    foot.parent.updateMatrixWorld(true);
    foot.parent.getWorldQuaternion(_INES_TMP_Q_B);
    // adjust (local) = parentW^-1 * worldYRot * parentW
    _INES_TMP_Q_C.copy(_INES_TMP_Q_B).invert()
      .multiply(_INES_TMP_Q_A)
      .multiply(_INES_TMP_Q_B);
    // new_local = adjust * current_local
    foot.quaternion.premultiply(_INES_TMP_Q_C);
  }
}
const INES_ACTIVITIES = {
  idle:    { motion: 'idle',     minMs: 3500, maxMs: 6000, oneShot: false, next: 'pick' },
  dance:   { motion: 'dance',    minMs: 6000, maxMs: 9000, oneShot: false, next: 'pick' },
  jump:    { motion: 'jump',     minMs: 9800, maxMs: 9800, oneShot: true,  next: 'pick' },
  sitDown: { motion: 'sit_down', minMs: 4700, maxMs: 4700, oneShot: true,  next: 'sitIdle' },
  sitIdle: { motion: 'sit_idle', minMs: 6000, maxMs: 12000, oneShot: false, next: 'standUp' },
  standUp: { motion: 'stand_up', minMs: 4700, maxMs: 4700, oneShot: true,  next: 'pick' },
  walk:    { motion: 'walk',     minMs: 0,    maxMs: 0,    oneShot: false, next: 'pick' }, // ends on target reached
};
// sitDown removed from random picker because the Meshy sit-down anim
// lowers her onto an invisible chair (no seat geometry in the office —
// looks like she's sitting mid-air). The clip files are still on disk
// in case we add a chair NPC anchor later.
const INES_PICKABLE = [
  { name: 'idle',  weight: 4 },
  { name: 'dance', weight: 2 },
  { name: 'jump',  weight: 1 },
  { name: 'walk',  weight: 2 },
];
function pickInesActivity() {
  const total = INES_PICKABLE.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const a of INES_PICKABLE) {
    r -= a.weight;
    if (r <= 0) return a.name;
  }
  return 'idle';
}
function pickInesWalkTarget(spawn, current) {
  for (let i = 0; i < 5; i++) {
    const ang = Math.random() * Math.PI * 2;
    const r = 0.5 + Math.random() * 0.9;
    const tx = spawn.x + Math.cos(ang) * r;
    const tz = spawn.z + Math.sin(ang) * r;
    if (Math.hypot(tx - current.x, tz - current.z) >= 0.5) return { x: tx, z: tz };
  }
  return { x: spawn.x, z: spawn.z };
}
function enterInesActivity(mesh, gc, nowMs, name) {
  const def = INES_ACTIVITIES[name];
  mesh.userData._activity = name;
  mesh.userData._activityStart = nowMs;
  mesh.userData._activityEnd = nowMs + def.minMs + Math.random() * (def.maxMs - def.minMs);
  if (name === 'walk') {
    mesh.userData._walkTarget = pickInesWalkTarget(
      mesh.userData._spawnPos,
      { x: mesh.position.x, z: mesh.position.z },
    );
  }
  if (def.oneShot && gc?.actions?.[def.motion]) gc.actions[def.motion].reset();
  if (gc?.setMotion) gc.setMotion(def.motion);
}
function applyInesBehavior(mesh, nowMs, dt) {
  const npcDef = mesh.userData.npc;
  const gc = mesh.userData.gltfChar;
  const skeleton = gc?.skeleton;

  // Lazy init: snapshot bind-pose UpLeg X (for hip widening) and start
  // in idle.
  if (!mesh.userData._spawnPos) {
    mesh.userData._spawnPos = { x: npcDef.pos[0], z: npcDef.pos[1] };
    if (skeleton) {
      mesh.userData._bindLegX = {
        left:  skeleton.getBoneByName('LeftUpLeg')?.position.x  ?? 0,
        right: skeleton.getBoneByName('RightUpLeg')?.position.x ?? 0,
      };
    }
    enterInesActivity(mesh, gc, nowMs, 'idle');
  }

  const baseY = floorBaseY(mesh.userData.floor || 1);
  mesh.position.y = baseY;

  // Walk: drive position toward target, end when reached.
  if (mesh.userData._activity === 'walk') {
    const tgt = mesh.userData._walkTarget;
    const dx = tgt.x - mesh.position.x;
    const dz = tgt.z - mesh.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.08) {
      const speed = 1.4;
      const move = Math.min(dist, speed * dt);
      mesh.position.x += (dx / dist) * move;
      mesh.position.z += (dz / dist) * move;
      const tgtYaw = Math.atan2(dx, dz);
      let dYaw = ((tgtYaw - mesh.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (dYaw < -Math.PI) dYaw += Math.PI * 2;
      mesh.rotation.y += dYaw * (1 - Math.exp(-dt * 5));
    } else {
      enterInesActivity(mesh, gc, nowMs, 'idle');
    }
  } else if (nowMs >= mesh.userData._activityEnd) {
    // Other activities end on timeout — pick next state.
    const cur = INES_ACTIVITIES[mesh.userData._activity];
    const nextName = cur.next === 'pick' ? pickInesActivity() : cur.next;
    enterInesActivity(mesh, gc, nowMs, nextName);
  }

  // Stance narrowing + toe-out are now handled by gltfCharacter.js via
  // manifest's stanceFactor field. Per-character bone overrides happen
  // automatically inside gc.update() after mixer.update.
}

function spawnNPC(npcDef) {
  // Merge per-NPC face config (npcLooks.js) into the roster's look.
  // The roster's `look` defines the body/outfit; npcLooks adds face
  // identity (eye color, brow/mouth shape, hairStyle, beard, etc.).
  const id = npcDef.id || (npcDef.npcId ?? '');
  const faceLook = getLookForNpc(id, 0);
  // The new flat-face system reads its config from faceConfigs.js by id.
  // Pass _id through the look so makeCharacter can look it up.
  const mergedLook = { ...npcDef.look, ...faceLook, _id: id };
  // Roster's `look.shirt`/`look.pants`/`look.skin` win over npcLooks
  // when the roster explicitly set them — restore them.
  if (npcDef.look) {
    if (typeof npcDef.look.skin === 'number')   mergedLook.skin = npcDef.look.skin;
    if (typeof npcDef.look.shirt === 'number')  mergedLook.shirt = npcDef.look.shirt;
    if (typeof npcDef.look.pants === 'number')  mergedLook.pants = npcDef.look.pants;
    if (typeof npcDef.look.accent === 'number') mergedLook.accent = npcDef.look.accent;
    if (npcDef.look.gesture) mergedLook.gesture = npcDef.look.gesture;
  }
  const mesh = makeCharacter(mergedLook);
  // Relocate ch05+ NPCs to their floor's office layout (floor 2-4).
  // Also relocate floor-1 ch03 (Files) and ch04 (Plan Mode) NPCs to
  // the new west wing (their generated positions assumed a 1×4 corridor
  // northward; the 2×2 layout puts those rooms WEST of the atrium /
  // library instead).
  const npcFloor = floorForChapterId(npcDef.chapterId) || 1;
  if (npcFloor > 1) {
    const override = floorOfficePositionForNPC(npcDef);
    if (override) {
      npcDef = { ...npcDef, pos: override.pos, face: override.face };
    }
  } else if (npcFloor === 1) {
    const override = floor1WestWingPositionForNPC(npcDef);
    if (override) {
      npcDef = { ...npcDef, pos: override.pos, face: override.face };
    }
  }
  mesh.position.set(npcDef.pos[0], floorBaseY(npcFloor), npcDef.pos[1]);
  mesh.rotation.y = npcDef.face;
  mesh.userData.npc = npcDef;
  mesh.userData.floor = npcFloor;
  // Hide NPCs that don't belong to the player's current floor — they
  // were previously visible on top of the (correctly hidden) upper-floor
  // floor plates, looking like floating people on no floor.
  mesh.visible = (npcFloor === currentFloor);
  scene.add(mesh);

  // Name-only tag (no pill background). Smaller than the old pill tag
  // because there's no fill to compete with; the dark stroke around
  // the white text keeps it legible without a backdrop.
  const tag = makeNpcNameTag(`${npcDef.portrait} ${npcDef.name}`);
  tag.position.set(0, 2.30, 0);
  mesh.userData._isNameTag = true;
  mesh.add(tag);

  npcMeshes.push(mesh);
}

// Chapters whose NPCs are hand-coded above in the NPCS roster.
// Procedural generation skips these (by chapter ID, not position) so
// they don't get duplicate NPCs after a curriculum reshuffle.
const HAND_BUILT_CHAPTER_IDS = new Set(['ch01', 'ch02']);

function buildNPCs() {
  // Backwards-compat entry point used by the initial start() path. We
  // only spawn floor-1 NPCs now; upper-floor NPCs are spawned when the
  // player rides the elevator there for the first time (loadFloor).
  npcMeshes = [];
  spawnNPCsForFloor(1);
}

// Spawn (or re-spawn) every NPC that belongs to floor `f`. Filters
// both hand-built (NPCS literal) and procedural (generateChapterNPCs)
// rosters by floorForChapterId. Idempotent per floor — caller is
// expected to guard against double-calling via the loadedFloors set.
function spawnNPCsForFloor(f) {
  const onThisFloor = (npcDef) => (floorForChapterId(npcDef.chapterId) || 1) === f;
  for (const n of NPCS) {
    if (onThisFloor(n)) spawnNPC(n);
  }
  const curriculum = window.CURRICULUM || [];
  for (let i = 0; i < curriculum.length; i++) {
    const ch = curriculum[i];
    if (!ch || HAND_BUILT_CHAPTER_IDS.has(ch.id)) continue;
    if (floorForChapterIdx(i) !== f) continue;
    generateChapterNPCs(i).forEach(spawnNPC);
  }
}

// Build the geometry + NPCs for one of the upper floors (2-4) on
// first visit. No-op if already built. Returns the set of currently
// loaded floors so callers can introspect if needed.
const loadedFloors = new Set([1]);
async function loadFloor(f) {
  if (loadedFloors.has(f)) return loadedFloors;
  const overlay = createLoadingOverlay();
  overlay.show(`Building floor ${f}...`);
  try {
    buildFloorOffice(f);
    spawnNPCsForFloor(f);
    // Rebuild the cameraWalls list — the new floor added wall meshes
    // that the camera-occlusion path needs to know about.
    refreshCameraWalls();
    loadedFloors.add(f);
  } catch (err) {
    console.warn(`[play] loadFloor(${f}) failed:`, err);
  } finally {
    overlay.hide();
  }
  return loadedFloors;
}

// Re-scan the scene for wall-like meshes. Same heuristic as the
// original sweep in buildWorld — extracted so loadFloor() can rerun
// it incrementally after adding a floor.
function refreshCameraWalls() {
  cameraWalls.length = 0;
  scene.traverse((obj) => {
    if (!obj.isMesh || obj.isSkinnedMesh) return;
    const g = obj.geometry;
    if (!g || !g.isBufferGeometry) return;
    if (!g.boundingBox) g.computeBoundingBox();
    const bb = g.boundingBox; if (!bb) return;
    const sx = bb.max.x - bb.min.x;
    const sy = bb.max.y - bb.min.y;
    const sz = bb.max.z - bb.min.z;
    const thinHoriz = (sx <= 0.5 || sz <= 0.5);
    const tall = sy >= 2.5;
    if (thinHoriz && tall) cameraWalls.push(obj);
  });
  // Invalidate the floor-filtered cache so the next frame rebuilds it.
  _cameraWallsCacheFloor = -1;
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

  // Mouse wheel → zoom camera in/out. deltaY > 0 is scroll-down → zoom out.
  wheelListener = (e) => {
    if (inputLocked) return;
    cameraDist += e.deltaY * 0.005;
    if (cameraDist < CAM_DIST_MIN) cameraDist = CAM_DIST_MIN;
    if (cameraDist > CAM_DIST_MAX) cameraDist = CAM_DIST_MAX;
    e.preventDefault();
  };
  window.addEventListener('wheel', wheelListener, { passive: false });

  // Middle-mouse drag → look around freely (yaw + pitch). Hold the
  // scroll-wheel button anywhere on the canvas, drag, and release.
  // The auto-follow lerp is suppressed while held so manual aim sticks.
  const MOUSE_LOOK_YAW_RATE   = 0.005;  // rad per pixel
  const MOUSE_LOOK_PITCH_RATE = 0.005;
  let mouseLookLastX = 0, mouseLookLastY = 0;
  mouseDownListener = (e) => {
    if (e.button !== 1) return;   // 1 = middle (scroll-wheel) button
    if (inputLocked) return;
    mouseLook = true;
    mouseLookLastX = e.clientX;
    mouseLookLastY = e.clientY;
    e.preventDefault();           // suppress browser auto-scroll cursor
  };
  mouseMoveListener = (e) => {
    if (!mouseLook) return;
    const dx = e.clientX - mouseLookLastX;
    const dy = e.clientY - mouseLookLastY;
    mouseLookLastX = e.clientX;
    mouseLookLastY = e.clientY;
    cameraYaw   -= dx * MOUSE_LOOK_YAW_RATE;
    cameraPitch += dy * MOUSE_LOOK_PITCH_RATE;
    if (cameraPitch < PITCH_MIN) cameraPitch = PITCH_MIN;
    if (cameraPitch > PITCH_MAX) cameraPitch = PITCH_MAX;
  };
  mouseUpListener = (e) => {
    if (e.button !== 1) return;
    mouseLook = false;
  };
  // Listen on window so a drag that leaves the canvas still releases
  // properly. preventDefault on mousedown blocks the autoscroll cursor.
  window.addEventListener('mousedown', mouseDownListener);
  window.addEventListener('mousemove', mouseMoveListener);
  window.addEventListener('mouseup', mouseUpListener);
  // Also release if pointer leaves the document (some browsers
  // suppress mouseup over chrome).
  window.addEventListener('blur', () => { mouseLook = false; cameraTouches.clear(); });

  // Touch swipe → look around (mobile analog of middle-mouse drag).
  // Listeners attached to the WebGL canvas only, so touches on the
  // joystick / action buttons / modals (separate DOM elements over
  // the canvas) don't trigger camera-look. Multi-touch supported:
  // each touch identifier tracked independently so the joystick
  // touch on the left half doesn't block a swipe on the right half.
  const TOUCH_YAW_RATE   = 0.005;
  const TOUCH_PITCH_RATE = 0.005;
  cameraTouchStartListener = (e) => {
    if (inputLocked) return;
    for (const t of e.changedTouches) {
      cameraTouches.set(t.identifier, { x: t.clientX, y: t.clientY });
    }
  };
  cameraTouchMoveListener = (e) => {
    if (inputLocked) return;
    for (const t of e.changedTouches) {
      const prev = cameraTouches.get(t.identifier);
      if (!prev) continue;
      const dx = t.clientX - prev.x;
      const dy = t.clientY - prev.y;
      cameraYaw   -= dx * TOUCH_YAW_RATE;
      cameraPitch += dy * TOUCH_PITCH_RATE;
      if (cameraPitch < PITCH_MIN) cameraPitch = PITCH_MIN;
      if (cameraPitch > PITCH_MAX) cameraPitch = PITCH_MAX;
      cameraTouches.set(t.identifier, { x: t.clientX, y: t.clientY });
    }
    e.preventDefault();    // prevent the browser's pull-to-refresh / swipe gestures
  };
  cameraTouchEndListener = (e) => {
    for (const t of e.changedTouches) cameraTouches.delete(t.identifier);
  };
  renderer.domElement.addEventListener('touchstart', cameraTouchStartListener, { passive: true });
  renderer.domElement.addEventListener('touchmove', cameraTouchMoveListener, { passive: false });
  renderer.domElement.addEventListener('touchend', cameraTouchEndListener);
  renderer.domElement.addEventListener('touchcancel', cameraTouchEndListener);

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

  wireElevatorModal();
  updateBadgeHud();
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

// Pop the "next stop" overlay when the player returns to the play view
// after completing a lesson/test. Trigger is a sessionStorage entry
// written by ui/lesson.js or ui/test.js. The overlay is the same visual
// style as the Day 1 intro so the player notices it.
function showPendingNextStop() {
  let pending;
  try { pending = JSON.parse(sessionStorage.getItem('ccq_next_stop') || 'null'); }
  catch { pending = null; }
  if (!pending || !pending.hint) return;
  sessionStorage.removeItem('ccq_next_stop');

  const overlay = document.getElementById('play-next-overlay');
  if (!overlay) return;
  const eyebrow = document.getElementById('play-next-eyebrow');
  const title   = document.getElementById('play-next-title');
  const body    = document.getElementById('play-next-body');
  const btn     = document.getElementById('play-next-btn');
  if (eyebrow) eyebrow.textContent = pending.type === 'test' ? '✓ ASSESSMENT PASSED' : '✓ LESSON COMPLETE';
  if (title)   title.textContent   = pending.type === 'test' ? 'Onward.' : 'Where to next?';
  if (body)    body.textContent    = pending.hint;
  overlay.classList.add('visible');
  inputLocked = true;
  if (btn) btn.onclick = () => {
    overlay.classList.remove('visible');
    inputLocked = false;
  };
}

const ELEVATOR_TARGET = { __elevator: true };

function tryInteract() {
  if (!interactionTarget || inputLocked) return;
  if (interactionTarget === ELEVATOR_TARGET) {
    openElevatorModal();
    return;
  }
  // Object interactable takes precedence (it's set explicitly when the
  // proximity loop picks an interactable as nearer than any NPC).
  const inter = interactionTarget.userData?._interactable;
  if (inter) {
    try { inter.onInteract?.(); } catch (e) { console.warn('interactable onInteract failed', e); }
    return;
  }
  const npc = interactionTarget.userData.npc;
  openDialogue(npc);
}

function openDialogue(npc) {
  inputLocked = true;
  const d = dialogueEl;
  const isFlavor = npc.kind === 'flavor';
  const done = isFlavor ? false : (npc.kind === 'lesson' ? isLessonDone(npc.lessonId) : isTestDone(npc.testId));

  // Determine status & next-step pointer
  let statusLine = '';
  if (done) {
    statusLine = `<div class="dlg-status dlg-done">✓ You've already completed this with ${npc.name.split(' ')[0]}.</div>`;
  }
  let nextHint = done ? `<div class="dlg-next">${npc.nextHint}</div>` : '';

  const actionsHtml = isFlavor
    ? `<div class="dlg-actions"><button class="btn-primary dlg-cancel">Bye!</button></div>`
    : `<div class="dlg-actions">
        <button class="btn-primary dlg-go">${
          npc.kind === 'test'
            ? (done ? 'Retake practical →' : 'Take the practical →')
            : (done ? 'Revisit lesson →' : `Start lesson — ${getLessonTitle(npc) || 'Begin'} →`)
        }</button>
        <button class="btn-secondary dlg-cancel">Maybe later</button>
      </div>`;

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
      ${actionsHtml}
    </div>
  `;
  d.classList.add('visible');
  // Open chime
  playUi('confirm');
  // Typewriter the intro line — plays a blip per character (rate-limited).
  startTypewriter(d.querySelector('[data-typewriter]'), npc.intro, blipPitchForNpc(npc.id));
  // Pulse the speaking NPC's mouth while the intro reveals.
  const speakingMesh = npcMeshes.find(m => m.userData?.npc?.id === npc.id);
  if (speakingMesh?.userData?.face && speakingMesh.userData.faceKind === 'flat') {
    const charCount = npc.intro?.length || 60;
    const talkMs = Math.min(8000, charCount * 22);
    talkPulse(speakingMesh.userData.face, true, talkMs);
  }

  d.querySelector('.dlg-cancel').onclick = () => { playUi('cancel'); closeDialogue(); };
  d.querySelector('.dlg-close').onclick  = () => { playUi('cancel'); closeDialogue(); };
  const goBtn = d.querySelector('.dlg-go');
  if (goBtn) {
    goBtn.onclick = () => {
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
    // Only procedural (non-GLTF) players have limb parts on userData.parts.
    // GLTF characters carry only `head` here; their pose is driven by the
    // AnimationMixer (gltfChar.update), which we still need to tick so the
    // idle clip plays during input-lock cinematics.
    const p = player.userData.parts;
    const isGltf = player.userData.faceKind === 'gltf';
    if (!isGltf && p && p.leftLeg) {
      p.leftLeg.rotation.x *= 0.85;
      p.rightLeg.rotation.x *= 0.85;
      p.leftArm.rotation.x *= 0.85;
      p.rightArm.rotation.x *= 0.85;
      p.leftArm.rotation.z = 0;
      p.rightArm.rotation.z = 0;
    }
    if (isGltf && player.userData.gltfChar) {
      player.userData.gltfChar.update(Math.min(0.05, 1 / 60));
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

  // Gravity + Y position. The atrium is flat (no staircase/mezzanine
  // since they were removed), so the ground is simply the player's
  // current floor's baseline Y.
  const wasAirborne = !player.userData.grounded;
  const groundY = floorBaseY(currentFloor);
  if (!player.userData.grounded || player.position.y > groundY) {
    player.userData.velocityY -= 18 * dt;
    player.position.y += player.userData.velocityY * dt;
    if (player.position.y <= groundY) {
      player.position.y = groundY;
      player.userData.velocityY = 0;
      player.userData.grounded = true;
      if (wasAirborne) playLandThud();
    }
  } else {
    player.position.y = groundY;
  }

  // Camera yaw — Q / E rotate freely without cap. The auto-follow drift
  // toward the character's heading only runs while the player is walking
  // (see the moving block below); when idle, cameraYaw stays where the
  // user left it.
  const yawRate = 1.6; // rad/sec for manual Q/E rotation
  if (keys['q']) cameraYaw += yawRate * dt;
  if (keys['e']) cameraYaw -= yawRate * dt;

  // WASD input → camera-relative direction (using cameraYaw, not the
  // camera's matrix — independent of camera lerp state).
  let inputForward = 0, inputRight = 0;
  if (keys['w'] || keys['arrowup'])    inputForward += 1;
  if (keys['s'] || keys['arrowdown'])  inputForward -= 1;
  if (keys['a'] || keys['arrowleft'])  inputRight   -= 1;
  if (keys['d'] || keys['arrowright']) inputRight   += 1;
  inputRight   += touchVec.x;
  inputForward -= touchVec.y; // joystick up (touchVec.y < 0) → forward

  // Build camera-relative basis from cameraYaw using the SAME convention
  // as player.rotation.y (= atan2(mx, mz)):
  //   yaw=0  → forward = (0, 0, 1) = +Z (south)
  //   yaw=π  → forward = (0, 0, -1) = -Z (north)  ← initial state
  //   yaw=π/2 → forward = (1, 0, 0) = +X (east)
  // camRight is 90° clockwise of camFwd in XZ plane (player's right).
  const camFwdX = Math.sin(cameraYaw);
  const camFwdZ = Math.cos(cameraYaw);
  const camRightX = -Math.cos(cameraYaw);
  const camRightZ =  Math.sin(cameraYaw);

  let mx = camRightX * inputRight + camFwdX * inputForward;
  let mz = camRightZ * inputRight + camFwdZ * inputForward;

  const len = Math.hypot(mx, mz);
  if (len > 0.05) {
    mx /= len; mz /= len;
    // Hold Shift to sprint (2x speed). Touch joystick has no Shift; user
    // can hold their phone joystick further from centre for more speed
    // (existing magnitude already feeds in via inputForward/inputRight).
    const sprint = (keys['shift']) ? 2.0 : 1.0;
    const speed = 4.4 * sprint;
    let nx = player.position.x + mx * speed * dt;
    let nz = player.position.z + mz * speed * dt;

    // Generic movement bounds across all zones with doorways
    const clamped = clampMove(player.position.x, player.position.z, nx, nz);
    nx = clamped.x; nz = clamped.z;

    // Footstep SFX. For a rigged GLTF player we sync each step to the
    // walk/run clip's footfall keyframes (t crossing 0 and dur/2) so the
    // sound matches the visible foot strike. For procedural bodies we
    // fall back to a distance-accumulator with a ~1.8m threshold.
    if (player.userData.grounded) {
      const stepDx = nx - player.position.x;
      const stepDz = nz - player.position.z;
      const moving = Math.hypot(stepDx, stepDz) > 0.001;
      const gc = player.userData.gltfChar;
      let animDriven = false;
      if (gc && moving) {
        const w = gc.actions?.walk;
        const r = gc.actions?.run;
        const active = (r && r.isRunning() && r.getEffectiveWeight() > 0.5) ? r
                    : (w && w.isRunning() && w.getEffectiveWeight() > 0.5) ? w
                    : null;
        if (active) {
          animDriven = true;
          const dur = active.getClip().duration;
          const t = active.time % dur;
          const lastT = player.userData._lastStepT;
          const half = dur / 2;
          let stepped = false;
          if (lastT != null) {
            // Crossing the half-cycle mark forward → second footfall.
            if (lastT < half && t >= half) stepped = true;
            // t wrapped back to 0 → first footfall of next cycle.
            if (t < lastT && lastT > half) stepped = true;
          }
          if (stepped) {
            const idx = zoneIndexAt(nz);
            playFootstep(surfaceForZone(idx));
          }
          player.userData._lastStepT = t;
        }
      } else {
        player.userData._lastStepT = null;
      }
      if (!animDriven) {
        footstepAccum += Math.hypot(stepDx, stepDz);
        if (footstepAccum > 1.8) {
          footstepAccum = 0;
          const idx = zoneIndexAt(nz);
          playFootstep(surfaceForZone(idx));
        }
      } else {
        footstepAccum = 0;
      }
    }

    player.position.x = nx;
    player.position.z = nz;
    // Rotation: keep the body facing forward when the player is walking
    // PURELY backward (S only) — no spin / no camera flip. Otherwise lerp
    // toward the input heading at a relaxed rate so casual A/D taps don't
    // whip the camera.
    const isPureBack = (inputForward < -0.3) && (Math.abs(inputRight) < 0.3);
    if (!isPureBack) {
      const targetRot = Math.atan2(mx, mz);
      let dRot = ((targetRot - player.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (dRot < -Math.PI) dRot += Math.PI * 2;
      // Reduced from dt*7 → dt*4 per user feedback (turning was too quick).
      const rotLerp = 1 - Math.exp(-dt * 4);
      player.rotation.y += dRot * rotLerp;
    }

    // Procedural arm/leg swing — only when the body has primitive limbs
    // (procedural builder). GLTF characters use an AnimationMixer
    // walk clip instead, set below.
    const p = player.userData.parts;
    const isGltf = player.userData.faceKind === 'gltf';
    if (!isGltf && player.userData.grounded && p && p.leftLeg) {
      const t = performance.now() * 0.012;
      p.leftLeg.rotation.x = Math.sin(t) * 0.5;
      p.rightLeg.rotation.x = -Math.sin(t) * 0.5;
      p.leftArm.rotation.x = -Math.sin(t) * 0.4;
      p.rightArm.rotation.x = Math.sin(t) * 0.4;
    } else if (!isGltf && p && p.leftLeg) {
      // Airborne pose: arms forward slightly, legs tucked
      p.leftLeg.rotation.x = -0.3;
      p.rightLeg.rotation.x = -0.3;
      p.leftArm.rotation.x = -0.6;
      p.rightArm.rotation.x = -0.6;
    }
    // GLTF: switch to walk/run/jump clip.
    if (isGltf && player.userData.gltfChar) {
      if (!player.userData.grounded) {
        player.userData.gltfChar.setMotion('jump');
      } else {
        const sprintNow = (keys['shift']) ? 'run' : 'walk';
        player.userData.gltfChar.setMotion(sprintNow);
      }
    }

    // Auto-follow: while walking, drift cameraYaw toward the player's
    // heading so the camera trails behind. Stiffness 1.2 → noticeably
    // slower than the body's rotation lerp (dt*4 above). When idle, this
    // block doesn't run, so manual Q/E rotation is preserved. Skipped
    // entirely while the user is mid-mouse-look so the drag isn't
    // fought.
    if (!mouseLook && cameraTouches.size === 0) {
      const targetYaw = player.rotation.y;
      let dYaw = ((targetYaw - cameraYaw + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (dYaw < -Math.PI) dYaw += Math.PI * 2;
      cameraYaw += dYaw * (1 - Math.exp(-dt * 1.2));
    }
  } else {
    const p = player.userData.parts;
    const isGltf = player.userData.faceKind === 'gltf';
    if (!isGltf && p && p.leftLeg) {
      p.leftLeg.rotation.x *= 0.85;
      p.rightLeg.rotation.x *= 0.85;
      p.leftArm.rotation.x *= 0.85;
      p.rightArm.rotation.x *= 0.85;
    }
    if (isGltf && player.userData.gltfChar) {
      if (!player.userData.grounded) {
        player.userData.gltfChar.setMotion('jump');
      } else {
        player.userData.gltfChar.setMotion('idle');
      }
    }
  }

  // Camera sits behind the cameraYaw direction relative to player. Using
  // the same convention as player.rotation.y so the auto-follow lerp
  // (above) pulls the camera to the correct side of the player.
  // Camera position = player.pos − camFwd * camDist
  //   camFwd = (sin(yaw), 0, cos(yaw))
  const camH = 4.2;
  // Wall-occlusion clamp: cast a ray from the player toward where the
  // camera wants to sit. If a wall is closer than cameraDist, pull the
  // camera in to keep it inside the room (otherwise it punches through
  // and exposes the exterior).
  let effDist = cameraDist;
  if (cameraWalls.length) {
    const floorYRay = floorBaseY(currentFloor);
    _camRayOrigin.set(player.position.x, floorYRay + camH, player.position.z);
    _camRayDir.set(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
    _camRay.set(_camRayOrigin, _camRayDir);
    _camRay.near = 0;
    _camRay.far = cameraDist;
    // Floor-filter cached per (cameraWalls list × currentFloor). The
    // `.visible` predicate was previously inside the filter — moved
    // into the raycast loop below since visibility can flip per frame
    // (during fade transitions) but floor membership doesn't.
    const candidates = _filteredCameraWalls().filter(w => w.visible);
    const hits = _camRay.intersectObjects(candidates, false);
    if (hits.length) {
      effDist = Math.max(CAM_DIST_MIN, hits[0].distance - 0.35);
    }
  }
  // Orbit: horizontal distance shrinks with pitch (the camera arcs over
  // the target instead of just sliding up). cos(pitch) only — sin(pitch)
  // alone would let the camera "fall" inside the target at high pitch.
  const pitchCos = Math.cos(cameraPitch);
  const pitchSin = Math.sin(cameraPitch);
  const horizDist = effDist * pitchCos;
  const targetCamX = player.position.x - Math.sin(cameraYaw) * horizDist;
  const targetCamZ = player.position.z - Math.cos(cameraYaw) * horizDist;
  const camLerp = 1 - Math.exp(-dt * 6);
  camera.position.x += (targetCamX - camera.position.x) * camLerp;
  camera.position.z += (targetCamZ - camera.position.z) * camLerp;
  // Camera height = floor baseline + camH (constant ride height when
  // pitch=0) + pitched vertical offset + a small jump bob. Held at the
  // current floor's baseline so it doesn't leak across floors.
  const floorY = floorBaseY(currentFloor);
  camera.position.y = floorY + camH + effDist * pitchSin
    + Math.max(0, player.position.y - floorY) * 0.3;
  camera.lookAt(player.position.x, player.position.y + 1.0, player.position.z);

  // Animate doors live: color tint, label, AND the hinge swing toward
  // its target rotation (0 = closed, openRot = swung open).
  for (const d of zoneDoors) {
    const open = isTestDone(`${d.gateChapter}-test`);
    d.mesh.material.color.set(open ? 0x4caf50 : 0x5d4037);
    const targetRot = open ? d.openRot : 0;
    // Lerp toward target — ~0.5-1s swing depending on framerate.
    d.pivot.rotation.y += (targetRot - d.pivot.rotation.y) * 0.08;
    if (open !== d.lastOpen) {
      // Refresh the label texture
      const newSprite = makeLabelSprite(
        open ? `${d.nextTitle} — Open` : `${d.nextTitle} — Locked`,
        '#fff', open ? 'rgba(38,140,90,0.95)' : 'rgba(60,72,110,0.95)',
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

  // Ceremony tick (cinematic camera + spotlight + reactions).
  if (ceremony) ceremony.update(dt, performance.now());

  // Drift dust motes around the player (desktop-only; mobile is a no-op).
  if (dust && player) dust.update(dt, player.position);
  // Animated decorations (clock hands, server LEDs, demo screens, globe spin)
  if (decoTickers.length) {
    const _now = performance.now();
    for (let i = 0; i < decoTickers.length; i++) decoTickers[i](dt, _now);
  }
  // Update audio listener position so PannerNode sources track the camera.
  if (camera) audio.listenerPosition(camera.position.x, camera.position.y, camera.position.z);

  // Drive face animations (blink + pupil-track-player) on every character.
  // Routes to the cartoonFace updater for new-style faces and the legacy
  // updater for any old plane-only faces still around.
  const nowMs = performance.now();
  const _playerHeadPos = new THREE.Vector3();
  if (player?.userData?.face) {
    if (player.userData.faceKind === 'flat') {
      updateFlatFace(player.userData.face, nowMs, camera);
    } else if (player.userData.faceKind === 'cartoon') {
      updateCartoonFace(player.userData.face, nowMs);
    } else {
      updateFace(player.userData.face, nowMs);
    }
  }
  // GLTF AnimationMixer tick. Skipped cleanly when faceKind !== 'gltf'.
  if (player?.userData?.gltfChar) player.userData.gltfChar.update(dt, nowMs);
  // Procedural idle (breathing/head-bob/signature gestures) only fires
  // for non-GLTF chars — for GLTF the AnimationMixer drives idle.
  if (player && player.userData.faceKind !== 'gltf') applyIdle(player, dt, nowMs);
  // Pre-compute the player's head world position for NPC pupil-track.
  if (player?.userData?.parts?.head) {
    player.userData.parts.head.getWorldPosition(_playerHeadPos);
  } else if (player) {
    _playerHeadPos.set(player.position.x, 1.66, player.position.z);
  }
  const _npcHeadPos = new THREE.Vector3();
  for (const m of npcMeshes) {
    if (m.userData?.face) {
      if (m.userData.faceKind === 'flat') {
        updateFlatFace(m.userData.face, nowMs, camera);
      } else if (m.userData.faceKind === 'cartoon') {
        const npcHead = m.userData?.parts?.head;
        if (npcHead) {
          npcHead.getWorldPosition(_npcHeadPos);
          updateCartoonFace(m.userData.face, nowMs, _playerHeadPos, _npcHeadPos);
        } else {
          updateCartoonFace(m.userData.face, nowMs);
        }
      } else {
        updateFace(m.userData.face, nowMs);
      }
    }
    // GLTF mixer tick (no-op for procedural NPCs).
    if (m.userData.gltfChar) {
      // Ines manages her walk action directly via applyInesBehavior
      // (freezes walk clip at arms-passing frame during idle pause).
      // For other GLTF NPCs, drive walk vs idle from frame-to-frame
      // position deltas.
      if (m.userData.npc?.id !== 'ines') {
        const lp = m.userData._lastPos || { x: m.position.x, z: m.position.z };
        const moved = Math.hypot(m.position.x - lp.x, m.position.z - lp.z);
        m.userData._lastPos = { x: m.position.x, z: m.position.z };
        m.userData.gltfChar.setMotion(moved > 0.005 ? 'walk' : 'idle');
      }
      m.userData.gltfChar.update(dt, nowMs);
    }
    // Wander behavior for the child visitor (skeletal walk anim is
    // driven by the auto motion-detector above based on position deltas).
    if (m.userData.npc?.id === 'ines') {
      applyInesBehavior(m, nowMs, dt);
    }
    // Idle breathing + signature gesture only for non-GLTF NPCs.
    if (m.userData.faceKind !== 'gltf') applyIdle(m, dt, nowMs);
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

  // Interaction proximity — checks NPCs, interactable objects, and the
  // elevator call button. NPCs on other floors are skipped.
  let nearest = null, nearestDist = Infinity, nearestKind = null;
  for (const m of npcMeshes) {
    if ((m.userData.floor || 1) !== currentFloor) continue;
    const dx = player.position.x - m.position.x;
    const dz = player.position.z - m.position.z;
    const d = Math.hypot(dx, dz);
    if (d < 2.4 && d < nearestDist) { nearest = m; nearestDist = d; nearestKind = 'npc'; }
  }
  if (elevatorRef && elevatorRef.callButtonPos) {
    const cp = elevatorRef.callButtonPos;
    const dx = player.position.x - cp.x;
    const dz = player.position.z - cp.z;
    const d = Math.hypot(dx, dz);
    if (d < 2.4 && d < nearestDist) {
      nearest = ELEVATOR_TARGET; nearestDist = d; nearestKind = 'elevator';
    }
  }
  // Interactables (computers, books, whiteboards, etc.)
  const hoveredObj = updateInteractables(dt, performance.now(), player.position);
  if (hoveredObj) {
    const dx = player.position.x - hoveredObj.position[0];
    const dz = player.position.z - hoveredObj.position[1];
    const d = Math.hypot(dx, dz);
    if (d < nearestDist) {
      nearest = hoveredObj.mesh;
      nearestDist = d;
      nearestKind = 'object';
      nearest.userData._interactable = hoveredObj;
    }
  }
  // Per-frame screen wake on interactable objects.
  for (const obj of (interactObjects || [])) {
    if (obj?.update) obj.update(dt, hoveredObj === obj.interactable);
  }

  if (nearest) {
    if (interactionTarget !== nearest) {
      interactionTarget = nearest;
      promptEl.classList.add('visible');
      if (nearestKind === 'npc') {
        const npc = nearest.userData.npc;
        promptEl.textContent = `Talk to ${npc.name.split(' ')[0]} — press E or tap`;
      } else if (nearestKind === 'object') {
        const it = nearest.userData._interactable;
        promptEl.textContent = it.getPromptText();
      } else if (nearestKind === 'elevator') {
        promptEl.textContent = 'Press E to call the elevator';
      }
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

// ─── Cross-view hints ────────────────────────────────────────────────────────
// Each NPC owns a `nextHint` line telling the player where to go next.
// The lesson + test UIs (loaded as classic scripts, not this module) read
// hints from here so the completion screen can point at the next NPC.
// Lazy lookup: NPCS roster first, then procedurally-generated chapter NPCs.
window.PlayHints = {
  getNextHintForLesson(lessonId) {
    for (const n of NPCS) {
      if (n.lessonId === lessonId) return n.nextHint;
    }
    const curriculum = window.CURRICULUM || [];
    for (let i = 0; i < curriculum.length; i++) {
      const ch = curriculum[i];
      if (!ch || HAND_BUILT_CHAPTER_IDS.has(ch.id)) continue;
      if (!ch.lessons?.some(l => l.id === lessonId)) continue;
      const npc = generateChapterNPCs(i).find(n => n.lessonId === lessonId);
      if (npc) return npc.nextHint;
    }
    return null;
  },
  getNextHintForTest(testId) {
    for (const n of NPCS) {
      if (n.testId === testId) return n.nextHint;
    }
    const curriculum = window.CURRICULUM || [];
    for (let i = 0; i < curriculum.length; i++) {
      const ch = curriculum[i];
      if (!ch || HAND_BUILT_CHAPTER_IDS.has(ch.id)) continue;
      if (ch.practicalTest?.id !== testId) continue;
      const npc = generateChapterNPCs(i).find(n => n.testId === testId);
      if (npc) return npc.nextHint;
    }
    return null;
  },
};

// ─── Lifecycle ───────────────────────────────────────────────────────────────
// Preload GLTF assets if the opt-in flag is set. Resolves once the
// resolved-cache is warm (or immediately, if the flag is off).
//   • Manifest fetch failures are logged and swallowed — game still
//     boots with procedural characters.
//   • Per-asset 404s are logged and that character falls back.
async function _preloadGltfAssets() {
  const loader = getAssetLoader();
  await loader.loadManifest();
  if (!loader.hasAnyAssets) {
    console.info('[play] no GLTF assets available in manifest; running procedural.');
    return;
  }
  // Show progress overlay while loading.
  const overlay = createLoadingOverlay();
  overlay.show('Loading characters...');
  // Warm just the named NPCs + player up front. Auto chapter NPCs and
  // ambient agents pick up the cache as they're constructed.
  const ids = [
    'hero', 'ines',
    'casual_male_01', 'casual_male_02', 'casual_male_03',
    'casual_female_01', 'casual_female_02', 'casual_female_03',
    'business_female_01', 'business_female_02', 'business_female_03',
    'glasses_female_01', 'beard_male_01', 'hijab_female_01',
    'hoodie_male_01',
    'executive_male_01',
  ];
  await loader.warmCache(ids, (loaded, total) => overlay.setProgress(loaded, total));
  await loader.loadAnimations();   // optional shared anim pack
  gltfAssetLoader = loader;
  overlay.hide();
}

// Preload Meshy decoration GLBs. Runs BEFORE buildWorld so the
// procedural builders inside buildWorld (buildDesk, buildChair, …) find
// them cached when they call makeDecoration(). Failures are non-fatal —
// each builder falls back to its original procedural geometry if the
// asset isn't in cache by the time it's called.
async function _preloadDecorationAssets() {
  const overlay = createLoadingOverlay();
  overlay.show('Loading decorations...');
  try {
    await preloadDecorations((loaded, total) => overlay.setProgress(loaded, total));
  } catch (err) {
    console.warn('[play] decoration preload failed:', err?.message || err);
  }
  overlay.hide();
}

export async function start(host) {
  container = host;
  promptEl = document.getElementById('play-prompt');
  dialogueEl = document.getElementById('play-dialogue');
  clock = new THREE.Clock();
  danceUntil = 0;
  jumpRequested = false;
  setupRenderer();
  // Preload Meshy decoration GLBs FIRST. buildWorld() calls every
  // procedural builder (buildDesk, buildChair, buildPlant, …) which now
  // try makeDecoration() first; if the cache isn't populated yet they
  // silently fall back to procedural — which is exactly the bug this
  // ordering avoids.
  await _preloadDecorationAssets();
  buildWorld();
  // Preload character GLTF assets BEFORE buildPlayer so the player +
  // NPCs can use them synchronously. Decorations are already cached at
  // this point.
  await _preloadGltfAssets();
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
  // Re-apply floor visibility now that NPCs (incl. liveAgents extras)
  // have been added to the scene — buildWorld's initial pass ran before
  // these meshes existed.
  applyFloorVisibility();
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
  // ─── In-world lesson overlay (Pillar 3) ────────────────────────────
  mountLessonOverlay({
    setInputLocked: (b) => { inputLocked = !!b; },
    duckMusic:      () => { try { audio.duckMusic?.(0.5); } catch {} },
    restoreMusic:   () => { try { audio.duckMusic?.(1.0); } catch {} },
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
  // Show the "next stop" overlay if the player just finished a lesson
  // or test in another view. Small delay so the play scene settles in
  // before the modal appears.
  setTimeout(showPendingNextStop, 400);
  // ── Ceremony manager — replaces the simple dance trigger ───────────
  ceremony = new CeremonyManager({
    getPlayer: () => player,
    getCamera: () => camera,
    getScene:  () => scene,
    getNpcMeshes: () => npcMeshes,
    setInputLocked: (b) => { inputLocked = !!b; },
    setDanceUntil: (ms) => { danceUntil = ms; },
    audio: {
      playFanfare: () => playLevelUpFanfare(),
      playCheer:   (sec) => playCrowdCheer(sec),
      playPpPing:  () => playPpPing(),
    },
  });

  // Trigger ceremony if the player just passed a test (`ccq_promotion_for`).
  // Falls through to a plain dance if only `ccq_dance_for` is set
  // (compatibility with older flag).
  try {
    const promotionFor = sessionStorage.getItem('ccq_promotion_for');
    if (promotionFor) {
      // Pause briefly so the scene is on screen before the spotlight.
      setTimeout(() => ceremony.maybeStartFromFlag(), 400);
      // Side-effect: also kicks off audio (cheer/fanfare/celebration music)
      // and the dance via setDanceUntil internally.
      try {
        audio.startMusic('celebration', 'play/assets/audio/music/celebration.mp3', 600);
      } catch {}
    } else {
      const danceFlag = sessionStorage.getItem('ccq_dance_for');
      if (danceFlag) {
        sessionStorage.removeItem('ccq_dance_for');
        setTimeout(() => {
          danceUntil = performance.now() + 4500;
          showCelebrationToast();
          try {
            playCrowdCheer(4.0);
            playLevelUpFanfare();
            audio.startMusic('celebration', 'play/assets/audio/music/celebration.mp3', 600);
          } catch {}
        }, 400);
      }
    }
  } catch {}

  // ── Admin-gated room editor (Phase 2) ──────────────────────────────
  // Toolbar mounts hidden by default; it auto-shows when
  // sessionStorage.ccq_admin === '1' (set by app.js after the
  // passcode prompt). Toggling Edit Rooms swaps gameplay for the
  // selection / TransformControls flow in play/editor/roomsEditor.js.
  mountEditorToolbar({
    container,
    onEnter: () => {
      enterRoomEdit({
        scene, camera, renderer, container,
        suspendGameInput: () => {
          inputLocked = true;
          return () => { inputLocked = false; };
        },
      });
    },
    onExit: () => {
      exitRoomEdit();
      // Belt-and-suspenders reset: regardless of what the editor's
      // own cleanup did, force every input-related module-scope flag
      // back to its idle state. The previous reliance on the
      // suspendGameInput closure release alone produced "can't move
      // or rotate camera after Resume Play" reports.
      inputLocked = false;
      mouseLook = false;
      if (cameraTouches?.clear) cameraTouches.clear();
      for (const k in keys) keys[k] = false;
      jumpRequested = false;
    },
    onExport: () => exportRoomLayout(),
  });

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

// ─── Elevator modal + floor transitions ──────────────────────────────────────
// Wired from setupInput() so the listeners are attached after the DOM
// renders. openElevatorModal builds the floor buttons each time using
// the player's current badgeFloor (from Progress) for gating.

function wireElevatorModal() {
  const modal = document.getElementById('play-elevator-modal');
  if (!modal) return;
  const cancelBtn = document.getElementById('elev-cancel');
  if (cancelBtn) cancelBtn.addEventListener('click', closeElevatorModal);
}

function openElevatorModal() {
  const modal = document.getElementById('play-elevator-modal');
  if (!modal) return;
  const progress = window.App?.progress || (window.Progress?.load?.() || { badgeFloor: 1 });
  const badge = Math.max(1, Math.min(FLOORS_TOTAL, progress.badgeFloor || 1));
  const cap = document.getElementById('elev-badge-cap');
  if (cap) cap.textContent = String(badge);
  const list = document.getElementById('elev-floors');
  if (list) {
    list.innerHTML = '';
    // List floors top-down so F4 is at the top.
    for (let f = FLOORS_TOTAL; f >= 1; f--) {
      const locked = f > badge;
      const isCurrent = f === currentFloor;
      const btn = document.createElement('button');
      btn.className = 'elev-floor-btn' + (locked ? ' locked' : '') + (isCurrent ? ' current' : '');
      const themeIdx = (f - 1) * CHAPTERS_PER_FLOOR + 2;
      const themeTitle = ZONE_THEMES[themeIdx]?.title || floorThemeName(f);
      btn.textContent = `F${f} — ${themeTitle}${locked ? ' 🔒' : ''}${isCurrent ? '  (here)' : ''}`;
      if (!locked && !isCurrent) {
        btn.addEventListener('click', () => requestFloorChange(f));
      } else {
        btn.disabled = true;
      }
      list.appendChild(btn);
    }
  }
  modal.classList.add('visible');
  inputLocked = true;
}

function closeElevatorModal() {
  const modal = document.getElementById('play-elevator-modal');
  if (modal) modal.classList.remove('visible');
  inputLocked = false;
}

function floorThemeName(f) {
  return ({ 1: 'Onboarding', 2: 'Operations', 3: 'Architect', 4: 'Executive' })[f] || `Floor ${f}`;
}

async function requestFloorChange(targetFloor) {
  if (targetFloor === currentFloor) { closeElevatorModal(); return; }
  closeElevatorModal();
  inputLocked = true;
  const fade = document.getElementById('play-fade');
  if (fade) fade.classList.add('opaque');
  // Snap the cab to the target floor so the camera reveal lands on it.
  if (elevatorRef?.snapCabToFloor) elevatorRef.snapCabToFloor(targetFloor);
  // Lazy-build the target floor on its first visit. Awaiting here is
  // safe because input is locked and the fade is opaque — the user
  // sees the loading overlay (createLoadingOverlay inside loadFloor)
  // on top of the black fade.
  if (!loadedFloors.has(targetFloor)) {
    await loadFloor(targetFloor);
  }
  setTimeout(() => {
    currentFloor = targetFloor;
    try { window.__playCurrentFloor = currentFloor; } catch {}
    applyFloorVisibility();
    spawnPlayerOnFloor(targetFloor);
    updateBadgeHud();
    if (fade) fade.classList.remove('opaque');
    setTimeout(() => { inputLocked = false; }, 450);
  }, 450);
}

// Move the player to a sensible spawn point on a given floor. The
// elevator door is at x=11, z=-7.6 on every floor; the player exits
// stepping west into the office. Also snaps the camera.
function spawnPlayerOnFloor(f) {
  if (!player) return;
  player.position.set(10.0, floorBaseY(f), -7.6);
  player.userData.velocityY = 0;
  player.userData.grounded = true;
  player.rotation.y = -Math.PI / 2; // face west (into the floor)
  cameraYaw = -Math.PI / 2;
  if (camera) {
    const camDist = cameraDist;
    camera.position.x = player.position.x - Math.sin(cameraYaw) * camDist;
    camera.position.z = player.position.z - Math.cos(cameraYaw) * camDist;
    camera.position.y = floorBaseY(f) + 4.2;
  }
}

function updateBadgeHud() {
  const progress = window.App?.progress || (window.Progress?.load?.() || { badgeFloor: 1 });
  const el = document.getElementById('play-badge-level');
  if (el) el.textContent = String(progress.badgeFloor || 1);
}

export function stop() {
  if (raf) cancelAnimationFrame(raf);
  raf = null;
  if (resizeListener) window.removeEventListener('resize', resizeListener);
  if (keyDownListener) window.removeEventListener('keydown', keyDownListener);
  if (keyUpListener) window.removeEventListener('keyup', keyUpListener);
  if (wheelListener) window.removeEventListener('wheel', wheelListener);
  if (mouseDownListener) window.removeEventListener('mousedown', mouseDownListener);
  if (mouseMoveListener) window.removeEventListener('mousemove', mouseMoveListener);
  if (mouseUpListener) window.removeEventListener('mouseup', mouseUpListener);
  if (renderer?.domElement && cameraTouchStartListener) {
    renderer.domElement.removeEventListener('touchstart', cameraTouchStartListener);
    renderer.domElement.removeEventListener('touchmove', cameraTouchMoveListener);
    renderer.domElement.removeEventListener('touchend', cameraTouchEndListener);
    renderer.domElement.removeEventListener('touchcancel', cameraTouchEndListener);
  }
  cameraTouches.clear();
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
  if (ceremony) { ceremony.dispose(); ceremony = null; }
  if (liveAgents) { liveAgents.dispose(); liveAgents = null; }
  if (dust) { dust.dispose(); dust = null; }
  if (postfx) { postfx.dispose(); postfx = null; }
  if (lighting) { lighting.dispose(); lighting = null; }
  try { audio.stopMusic(800); } catch {}
  try { unmountAudioSettings(); } catch {}
  try { unmountLessonOverlay(); } catch {}
  try { unmountCustomization(); } catch {}
  lastZoneIdx = -1;
  footstepAccum = 0;
  decoTickers = [];
  renderer = null; scene = null; camera = null;
  clearInteractables();
  interactObjects = [];
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
