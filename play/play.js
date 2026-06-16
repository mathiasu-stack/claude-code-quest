import * as THREE from 'three';
import { LightingManager } from './lighting/manager.js?v=20260615a';
import { isMobile, effectivePixelRatio } from './lighting/mobile.js';
import { PostFxPipeline } from './postfx/composer.js';
import { DustMotes } from './lighting/dust-motes.js';
import { buildSkyEnvTexture, disposeEnv } from './lighting/envProbe.js?v=20260616a';
import { audio } from './audio/AudioManager.js?v=20260615b';
import {
  playFootstep, playJumpGrunt, playLandThud,
  playUi, playDialogueBlip, blipPitchForNpc,
  playAchievementChime, playLevelUpFanfare, playPpPing,
  playKcCorrectTone, playKcIncorrectTone, playCrowdCheer,
  playClearanceChime, playAnomalySting, playFloorMChime, updateServerHum,
  playElevatorRide,
} from './audio/procedural.js?v=20260615b';
import { surfaceForZone, musicForZone, procForZone } from './audio/zoneConfig.js?v=20260615b';
import { mountAudioSettings, unmountAudioSettings } from './audio/settings.js?v=20260615h';
import { startAmbience, stopAmbience, tickAmbience, applyStoryTierAudio } from './audio/ambience.js?v=20260615b';
import { speakLine, setVoiceEnabled, isVoiceEnabled } from './audio/voice.js?v=20260615h';
import { attachFace, updateFace, setExpression } from './characters/face.js';
import { attachCartoonFace, updateCartoonFace, setCartoonExpression } from './characters/cartoonFace.js';
import { attachFlatFace, updateFlatFace, setFlatExpression, talkPulse } from './characters/flatFace.js';
import { getFaceConfig, FACE_CONFIGS } from './characters/faceConfigs.js';
import { getLookForNpc } from './characters/npcLooks.js';
import { buildPlayerLook } from './characters/playerLook.js';
import { applyIdle } from './characters/idleAnimations.js';
import { loadCustomization, mountCustomization, unmountCustomization } from './characters/customization.js';
import { getAssetLoader } from './characters/assetLoader.js?v=20260612b';
import { makeGltfCharacter } from './characters/gltfCharacter.js?v=20260615b';
import { resolveAssetForCharacter } from './characters/npcCasting.js?v=20260610e';
import { createLoadingOverlay } from './characters/loadingOverlay.js';
import { decorateReception } from './decorations/reception.js?v=20260611c';
import { decorateLibrary, decorateLibraryAnomalies } from './decorations/library.js?v=20260610i';
import { buildReceptionCenterpiece } from './decorations/receptionCenterpiece.js?v=20260528n';
import { buildPosterTexture } from './decorations/shared.js?v=20260526d';
import { preloadDecorations, makeDecoration, hasDecoration } from './decorations/decorationAssets.js?v=20260528j';
import { loadRoom, registerRoomBuilder, registerSharedHelpers } from './world/roomsLoader.js?v=20260528g';
import { mountToolbar as mountEditorToolbar, enterEditMode as enterRoomEdit,
         exitEditMode as exitRoomEdit, isEditorActive as isRoomEditorActive,
         isEditorDragging as isRoomEditorDragging,
         exportLayout as exportRoomLayout,
         savePermanently as savePermanentlyEdits } from './editor/roomsEditor.js?v=20260610c';
import { SkyDome, getSkyPresetForZone } from './world/sky.js?v=20260615a';
import { buildReceptionCeiling, buildLibraryCeiling, floorPatternTexture } from './world/ceilings.js?v=20260612c';
import { buildAtrium } from './world/atrium.js?v=20260528g';
import { buildElevator } from './world/elevator.js';
import { buildFloorM, buildCableTrays } from './world/floorM.js?v=20260611c';
import { showTitleCard } from './ui/titleCard.js?v=20260610e';
import { CeremonyManager } from './ceremony/ceremonyManager.js?v=20260610g';
import {
  registerInteractable, clearInteractables,
  updateInteractables, listInteractables,
} from './world/interactables.js';
import { buildComputer } from './world/objectTypes/computer.js';
import { buildBook } from './world/objectTypes/book.js';
import { buildWhiteboardObject } from './world/objectTypes/whiteboard.js';
import { buildServerRack } from './world/objectTypes/serverRack.js?v=20260610a';
import { buildDemoScreenObject } from './world/objectTypes/demoScreen.js';
import { buildPhone } from './world/objectTypes/phone.js';
import { buildModelConsole } from './world/objectTypes/modelConsole.js';
import { buildDispatchBoard } from './world/objectTypes/dispatchBoard.js?v=20260610d';
import { buildPermissionsPanel } from './world/objectTypes/permissionsPanel.js?v=20260610d';
import { buildReadableNote } from './world/objectTypes/readableNote.js?v=20260610d';
import { buildTeamPhotosWall, buildEotmCorkboard } from './world/objectTypes/wallDocument.js?v=20260610h';
import { buildSeatsDashboard } from './world/objectTypes/seatsDashboard.js?v=20260610g';
import { buildTokenCounter, resetTokenCounter } from './world/objectTypes/tokenCounter.js?v=20260610g';
import { buildRecMirror } from './world/objectTypes/recMirror.js?v=20260610g';
import { LESSON_DELIVERY } from './world/lessonRegistry.js?v=20260610a';
import { mountLessonOverlay, unmountLessonOverlay } from './lessons/overlay.js';
import { buildReceptionWindows, buildLibraryArchedWindow, buildReceptionHallway } from './world/depth.js?v=20260612c';
import { TimeOfDay } from './world/timeOfDay.js?v=20260615a';
import { LiveAgents } from './world/liveAgents.js?v=20260612b';
import { NameTagSystem, showSpeechBubble } from './ui/nameTags.js?v=20260610b';
import { openPlanModeExercise, isPlanModeOpen } from './ui/planModeExercise.js?v=20260613a';
import { getPortrait, renderToCanvas as renderPortraitToCanvas } from './ui/portraitStudio.js?v=20260613b';
import Story from './story/storyState.js?v=20260612c';
import {
  initSceneRunner, registerSceneActions, runScene,
  isSceneActive, advanceScene, abortScene,
} from './story/sceneRunner.js?v=20260612b';
import { initDocViewer, openDocument, isDocumentOpen } from './story/docViewer.js?v=20260610d';

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
    id: 'marcus', zone: 1, pos: [-15, -8], face: 0,
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

  // ── Kedash Protocol lobby actors (TWIST1-02) ────
  // Guaranteed carriers of the six-line ambient set (data/story_ambient.js,
  // intro resolved at spawn via ambientSlot) AND the staging cast for the
  // TWIST 1 scene. Folderman walks a slow lobby loop (liveAgents ROUTINES);
  // Tania + partner hold the reception water cooler at [-9.5, -2.8].
  {
    id: 'folderman', zone: 1, pos: [7, -1], face: Math.PI, kind: 'flavor',
    name: 'Stan Vesely', role: 'Kedash Staff', portrait: '🧑‍💼',
    ambientSlot: 0, folderProp: true,
    look: { skin: 0xfdd9b5, hair: 0x2c1810, hairStyle: 'side-part', shirt: 0x90a4ae, pants: 0x37474f, glasses: false, prop: null, face: 'round', expression: 'neutral' },
    intro: "Busy week. They say the new cohort starts soon.",
    nextHint: "",
  },
  {
    id: 'tania', zone: 1, pos: [-8.6, -2.1], face: -2.2, kind: 'flavor',
    name: 'Tania', role: 'Kedash Staff', portrait: '👩‍🦰',
    ambientSlot: 2,
    look: { skin: 0xf1c27d, hair: 0xb87333, hairStyle: 'ponytail', shirt: 0xffcc80, pants: 0x37474f, glasses: false, prop: 'mug', face: 'round', expression: 'happy' },
    intro: "Coffee on three is better. Don't ask me why.",
    nextHint: "",
  },
  {
    id: 'partner', zone: 1, pos: [-8.8, -3.8], face: -0.6, kind: 'flavor',
    name: 'Arno Beck', role: 'Kedash Staff', portrait: '👨‍💼',
    ambientSlot: 1,
    look: { skin: 0x8d5524, hair: 0x1a1a1a, hairStyle: 'short', shirt: 0x80cbc4, pants: 0x263238, glasses: true, prop: null, face: 'sharp', expression: 'neutral' },
    intro: "Did you see the Q3 numbers? …Me neither, ha.",
    nextHint: "",
  },

  // ── Kedash Protocol finale cast (FIN-03 / FIN-07) ────
  // Maya lives on Floor M until the finale ceremony has been seen, then
  // permanently near reception (floorForNpcDef resolves this). Rig is
  // western_female for now — a bespoke maya.glb swaps in later by
  // changing ONLY the manifest entry's `file` field.
  {
    id: 'maya', zone: 1, pos: [4.0, -7.6], face: Math.PI / 2, kind: 'flavor',
    name: 'Maya Kedash', role: 'CEO', portrait: '👩‍💼',
    look: { skin: 0xfdd9b5, hair: 0x3a2a1a, hairStyle: 'bun', shirt: 0x8d6e63, pants: 0x263238, glasses: false, prop: 'mug', face: 'sharp', expression: 'kind', accent: 0xc9a44c },
    intro: "Downstairs. They're waiting — I'm right behind you.",
    nextHint: "",
  },
  // The §5.5 NEW ARRIVAL at the lobby doors — epilogue only
  // (spawnNPCsForFloor skips this def until the finale is seen).
  {
    id: 'newhire', zone: 1, pos: [9.2, 3.5], face: Math.PI, kind: 'flavor',
    epilogueOnly: true,
    name: 'New Arrival', role: 'Visitor', portrait: '🧑‍💼',
    look: { skin: 0xc68642, hair: 0x1a1a1a, hairStyle: 'short', shirt: 0x37474f, pants: 0x263238, glasses: false, prop: null, face: 'round', expression: 'neutral' },
    intro: "Sorry — is this the Kedash Corp orientation? I'm supposed to—",
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
// Floor M (FIN-01/02) — Maya's hidden loft above F4. Story-gated, never
// part of badge/curriculum math: chapter→floor mapping still caps at
// FLOORS_TOTAL; only the Y/clamp helpers know about index 5.
const FLOOR_M_INDEX = 5;
const CHAPTERS_PER_FLOOR = 4;
const FLOOR_HEIGHT_Y = 4.5;          // matches elevator.js FLOOR_HEIGHT
function floorBaseY(n) {
  return (Math.max(1, Math.min(FLOOR_M_INDEX, n)) - 1) * FLOOR_HEIGHT_Y;
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

// Room-aware zone lookup. Floor-1 rooms in data/rooms.js carry a
// `zoneIdx` plus a footprint (floor_plate entry, a library_floor
// builder entry, or a template `center`). Those AABBs win over the
// legacy Z-band scan so rooms laid out along the X axis (the west
// wing: library / Files / Plan Mode at x≈-22) resolve to their own
// lighting zone instead of falling through to whatever Z-band they
// happen to overlap. Precomputed once on first call — cheap per frame.
let _roomZoneBoxes = null;
function roomZoneBoxes() {
  if (_roomZoneBoxes) return _roomZoneBoxes;
  _roomZoneBoxes = [];
  for (const room of (window.ROOMS || [])) {
    if (room.floor !== 1 || typeof room.zoneIdx !== 'number') continue;
    let cx = null, cz = null, w = 22, d = 22;
    const plate = (room.objects || []).find((o) =>
      o.type === 'floor_plate' || (o.type === 'builder' && o.fn === 'library_floor'));
    if (plate && Array.isArray(plate.pos)) {
      cx = plate.pos[0]; cz = plate.pos[2];
      w = plate.size?.w ?? plate.args?.w ?? 22;
      d = plate.size?.d ?? plate.args?.d ?? 22;
    } else if (Array.isArray(room.center)) {
      cx = room.center[0]; cz = room.center[2];
    }
    if (cx === null || cz === null) continue;
    _roomZoneBoxes.push({
      idx: room.zoneIdx,
      minX: cx - w / 2 - 0.01, maxX: cx + w / 2 + 0.01,
      minZ: cz - d / 2 - 0.01, maxZ: cz + d / 2 + 0.01,
    });
  }
  return _roomZoneBoxes;
}

function zoneIndexAt(z, x) {
  // Callers historically pass only z — default x to the player's
  // current x so the room check works everywhere without touching
  // every call site. (The footstep callers pass a *candidate* z one
  // frame ahead; player.x is at most a step behind, which is fine.)
  if (x === undefined && player) x = player.position.x;
  if (x !== undefined && currentFloor === 1) {
    for (const b of roomZoneBoxes()) {
      if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) return b.idx;
    }
  }
  for (let i = 0; i < ZONE_BOUNDS.length; i++) {
    if (z >= ZONE_BOUNDS[i].startZ - 0.01 && z <= ZONE_BOUNDS[i].endZ + 0.01) {
      // Z-bands 1-3 no longer host interior rooms — the library and
      // west wing moved onto the X axis and are claimed by the room
      // AABBs above. Anything still landing in these bands is the
      // outdoor space south of reception: keep it on the bright
      // reception zone instead of resurrecting old interior moods.
      return (i >= 1 && i <= 3) ? 0 : i;
    }
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
  ch10: { floor: 0xffd54f, wall: 0xfff9c4, accent: '#f57c00', title: 'Model Engine Bay',            metal: 0.35 },
  ch11: { floor: 0x9fa8da, wall: 0xeceff1, accent: '#283593', title: 'Slash Command Center',       metal: 0.40 },
  ch12: { floor: 0xb39ddb, wall: 0xede7f6, accent: '#311b92', title: 'Plan War Room',               metal: 0.45 },
  ch13: { floor: 0x4dd0e1, wall: 0xe0f7fa, accent: '#006064', title: 'Integration Bay',             metal: 0.50 },
  ch14: { floor: 0xff7043, wall: 0xfbe9e7, accent: '#d84315', title: 'Subagent Dispatch Floor',     metal: 0.55 },
  ch15: { floor: 0xb2dfdb, wall: 0xfff8e1, accent: '#00897b', title: 'Guardrail Lab',               metal: 0.60 },
  ch16: { floor: 0xffd700, wall: 0xfffde7, accent: '#ff6f00', title: 'NAS Server Room — Capstone',  metal: 0.75 },
};
const ZONE_THEMES = (window.CURRICULUM || []).map(c => ZONE_THEMES_BY_ID[c.id] || null);

// ─── NPC generator (chapters 3-16) ───────────────────────────────────────────
// Culturally-coherent (first, last, rig) triples. Picking the trio as a
// UNIT (one hash, one pick) replaces the previous independent picks of
// name vs rig, which produced nonsense like a south-asian-female rig
// named "Karim" (Arab male). Last names are aligned to the region too
// so a Karim is Karim Hassan, never Karim Tanaka. The rig field is
// propagated onto npc.look._gltfAsset so npcCasting's id-hash skips.
const PEOPLE_POOL = [
  // Arab male
  { first: 'Karim',  last: 'Hassan',    rig: 'arab_male' },
  { first: 'Bilal',  last: 'Khan',      rig: 'arab_male' },
  { first: 'Omar',   last: 'Mahmoud',   rig: 'arab_male' },
  { first: 'Farid',  last: 'Al-Rashid', rig: 'arab_male' },
  { first: 'Hassan', last: 'Saleh',     rig: 'arab_male' },
  // Hijabi (Arab/Muslim female)
  { first: 'Yara',   last: 'Hassan',    rig: 'hijab_female' },
  { first: 'Aisha',  last: 'Khan',      rig: 'hijab_female' },
  { first: 'Noor',   last: 'Mahmoud',   rig: 'hijab_female' },
  { first: 'Layla',  last: 'Al-Rashid', rig: 'hijab_female' },
  // South Asian male
  { first: 'Raj',    last: 'Mehta',     rig: 'sasian_male' },
  { first: 'Nikhil', last: 'Singh',     rig: 'sasian_male' },
  { first: 'Vikram', last: 'Patel',     rig: 'sasian_male' },
  { first: 'Arjun',  last: 'Rao',       rig: 'sasian_male' },
  // South Asian female
  { first: 'Priya',  last: 'Mehta',     rig: 'sasian_female' },
  { first: 'Uma',    last: 'Singh',     rig: 'sasian_female' },
  { first: 'Anjali', last: 'Patel',     rig: 'sasian_female' },
  { first: 'Diya',   last: 'Rao',       rig: 'sasian_female' },
  // East Asian male
  { first: 'Jin',     last: 'Chen',     rig: 'easian_male' },
  { first: 'Hiroshi', last: 'Tanaka',   rig: 'easian_male' },
  { first: 'Kenji',   last: 'Nakamura', rig: 'easian_male' },
  { first: 'Wei',     last: 'Wong',     rig: 'easian_male' },
  { first: 'Liang',   last: 'Liu',      rig: 'easian_male' },
  // East Asian female
  { first: 'Aiko',  last: 'Nakamura', rig: 'easian_female' },
  { first: 'Mei',   last: 'Liu',      rig: 'easian_female' },
  { first: 'Yuki',  last: 'Tanaka',   rig: 'easian_female' },
  { first: 'Lin',   last: 'Chen',     rig: 'easian_female' },
  { first: 'Nari',  last: 'Park',     rig: 'easian_female' },
  // African male
  { first: 'Kojo',  last: 'Mensah',   rig: 'african_male' },
  { first: 'Femi',  last: 'Adeyemi',  rig: 'african_male' },
  { first: 'Ade',   last: 'Okoye',    rig: 'african_male' },
  { first: 'Tunde', last: 'Asante',   rig: 'african_male' },
  { first: 'Kwame', last: 'Diallo',   rig: 'african_male' },
  // African female
  { first: 'Zara',    last: 'Mensah',  rig: 'african_female' },
  { first: 'Ayo',     last: 'Adeyemi', rig: 'african_female' },
  { first: 'Imani',   last: 'Okoye',   rig: 'african_female' },
  { first: 'Adaeze',  last: 'Asante',  rig: 'african_female' },
  { first: 'Aminata', last: 'Diallo',  rig: 'african_female' },
  // Western male
  { first: 'Ben',    last: 'Andersson', rig: 'western_male' },
  { first: 'Lars',   last: 'Olsen',     rig: 'western_male' },
  { first: 'Sven',   last: 'Schmidt',   rig: 'western_male' },
  { first: 'Hugo',   last: 'Volkov',    rig: 'western_male' },
  { first: 'Felix',  last: 'Dubois',    rig: 'western_male' },
  { first: 'Xander', last: 'Rossi',     rig: 'western_male' },
  { first: 'Vince',  last: 'Garcia',    rig: 'western_male' },
  // Western female
  { first: 'Elena',   last: 'Rossi',     rig: 'western_female' },
  { first: 'Carmen',  last: 'Diaz',      rig: 'western_female' },
  { first: 'Greta',   last: 'Schmidt',   rig: 'western_female' },
  { first: 'Iris',    last: 'Andersson', rig: 'western_female' },
  { first: 'Anna',    last: 'Volkov',    rig: 'western_female' },
  { first: 'Camille', last: 'Dubois',    rig: 'western_female' },
  { first: 'Esme',    last: 'Lopez',     rig: 'western_female' },
  { first: 'Rita',    last: 'Olsen',     rig: 'western_female' },
];
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
    const person = pick(PEOPLE_POOL, seed);
    const tmpl = pick(INTRO_TEMPLATES, seed + 2);
    npcs.push({
      id: `auto-${l.id}`,
      zone: chapterIdx + 1,
      pos: [slot.x, slot.z],
      face: slot.face,
      name: `${person.first} ${person.last}`,
      role: pick(ROLES_LESSON, seed + 3),
      portrait: pick(PORTRAITS, seed + 4),
      chapterId: ch.id,
      lessonId: l.id,
      kind: 'lesson',
      look: { ...npcLook(seed), _gltfAsset: person.rig },
      intro: tmpl.replace('{name}', person.first).replace('{title}', l.title),
      nextHint: i < ch.lessons.length - 1
        ? pick(NEXT_HINTS, seed + 5)
        : `Now find the assessor by the back door — they run the practical for ${ch.title}.`,
    });
  });
  // Test NPC at south end (near door to next zone)
  const seed = chapterIdx * 11 + 99;
  const person = pick(PEOPLE_POOL, seed);
  npcs.push({
    id: `auto-${ch.id}-test`,
    zone: chapterIdx + 1,
    pos: [0, cZ + 8.5],
    face: Math.PI,
    name: `${person.first} ${person.last}`,
    role: 'Assessor',
    portrait: pick(PORTRAITS, seed + 2),
    chapterId: ch.id,
    testId: ch.practicalTest.id,
    kind: 'test',
    look: { ...npcLook(seed), _gltfAsset: person.rig },
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
// Pitch range is generous (~-70° to ~+83°) so the player can crane up
// at the atrium ceiling or look almost straight down. The camera Y is
// clamped below to keep it from punching through the floor at large
// effDist + extreme negative pitch, so we don't have to make the limits
// conservative here.
const PITCH_MIN = -1.20;    // ~-69° (camera looks up at player from below)
const PITCH_MAX =  1.45;    // ~+83° (camera looks down from nearly overhead)
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
// Smoothed camera distance after wall-occlusion clamping. Snaps IN
// instantly when a wall appears (so the camera never shows through it)
// and eases OUT when the wall clears.
let _camSmoothDist = 6.5;
let decoTickers = [];   // per-frame callbacks for animated decorations
let skyDome = null;
let receptionWindows = null;
let libraryWindow = null;
let receptionHallway = null;
let _envTexture = null;   // IBL environment map (scene.environment)
let timeOfDay = null;
let liveAgents = null;
// CURTAIN-01: while performance.now() < curtainUntil, visible floor-1
// NPCs turn to face the elevator (first F1→F2 ride only).
let curtainUntil = 0;
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
const _camCeilProbe = new THREE.Vector3();
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
    window.Progress.isChapterTestPassed(getProgress(), ch)
  ).length;
}
function getOutfit() {
  return OUTFITS[Math.min(getCompletedChapterCount(), OUTFITS.length - 1)];
}
function isZone2Open() {
  // Either ch01 track unlocks zone 2 — practical and theoretical both count.
  const ch = (window.CURRICULUM || []).find(c => c.id === 'ch01');
  return ch ? !!window.Progress?.isChapterTestPassed?.(getProgress(), ch) : isTestDone('ch01-test');
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
  // Floors 2-4 are now a 36×36 open floor centered at origin
  // (z∈[-17.5, 17.5], x∈[-17.5, 17.5]) — 2.7× larger than the old 22×22.
  if (currentFloor === 1) {
    // Walk-around bounds: a ~85×85 m fenced yard around the building.
    // West fence at x=-42 (9 m west of library outer wall at x=-33).
    // East fence at x=+42 (well past the elevator at x=+12.3).
    // North fence at z=-42 (9 m north of library back at z=-33).
    // South fence at z=+42 (well south of the old Plan Mode back wall).
    // Walls inside the building still block via colliders.
    newX = Math.max(-42, Math.min(42, newX));
    newZ = Math.max(-42, Math.min(42, newZ));
  } else {
    newX = Math.max(-17.5, Math.min(17.5, newX));
    newZ = Math.max(-17.5, Math.min(17.5, newZ));
  }

  // (Floor-1 zone-corridor gating was removed in the building
  // restructure. The legacy logic assumed z=+11 was the locked
  // entrance to the library zone, but the library moved into the
  // west wing — z=+11 is now just the building's exterior front
  // facade. Chapter gating lives on its own physical doors now
  // (e.g. the Files↔Library registerDoor at z=-11, x=-22).)

  // Static furniture AABBs — push out along the shortest axis.
  // Only consider colliders for the player's current floor.
  const R = PLAYER_RADIUS;
  // Build a transient list of door colliders for any door that's still
  // locked. Door visual swings shut but the door mesh has no AABB on
  // its own, so without this loop the player walks straight through a
  // visibly-closed door. Box dimensions match registerDoor's DOOR_W
  // (3.5m) at the door's z position (0.2m deep wall).
  const DOOR_W = 3.5;
  for (const d of zoneDoors) {
    if ((d.floor || 1) !== currentFloor) continue;
    if (isTestDone(`${d.gateChapter}-test`)) continue;
    // d.atZ + d.centerX cached on the door at registration time.
    colliders.push({
      minX: d.centerX - DOOR_W / 2,
      maxX: d.centerX + DOOR_W / 2,
      minZ: d.atZ - 0.15,
      maxZ: d.atZ + 0.15,
      floor: d.floor || 1,
      _transient: true,
    });
  }
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
  // Drop the per-frame transient door colliders we pushed at the top
  // so the array doesn't grow each frame.
  while (colliders.length && colliders[colliders.length - 1]._transient) {
    colliders.pop();
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
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  // Auto-fit font like makeWallSign — longer door labels such as
  // "Knowledge Library — Locked" were running off both edges of the
  // 512px canvas at fixed 50px bold sans-serif. Shrinks in 4px steps
  // down to 20px so even "— Locked" suffixed titles fit cleanly.
  const maxWidth = c.width * 0.90;
  let fontPx = 50;
  while (fontPx > 20) {
    ctx.font = `bold ${fontPx}px sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    fontPx -= 4;
  }
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
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  // Auto-fit font so longer mentor names ("Dr. Priya Engelhardt") fit
  // alongside their emoji prefix without overflowing the canvas.
  const maxWidth = c.width * 0.92;
  let fontPx = 36;
  while (fontPx > 16) {
    ctx.font = `600 ${fontPx}px sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    fontPx -= 2;
  }
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
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  // Auto-fit the font size so long titles ("SUBAGENT DISPATCH FLOOR",
  // "MODEL ENGINE BAY", "FLOOR 4 — GUARDRAIL LAB") don't get clipped
  // by the fixed-width canvas. Starts at 130px and shrinks in 6px
  // steps until the rendered width fits 92% of the canvas, with a
  // 36px floor so very long signs are tiny but readable rather than
  // truncated mid-word.
  const maxWidth = c.width * 0.92;
  let fontPx = 130;
  while (fontPx > 36) {
    ctx.font = `bold ${fontPx}px serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    fontPx -= 6;
  }
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

// ── Contact shadows ──────────────────────────────────────────────────
// One shared 64px radial-gradient canvas texture; each furniture
// builder drops a small transparent plane under itself so big props
// feel grounded even where the directional shadow map doesn't reach
// (and on mobile, where shadows are reduced). Cost: 1 texture total +
// 1 tiny transparent quad per prop.
let _contactShadowTex = null;
function contactShadowTexture() {
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
function addContactShadow(node, w = 1.6, d = 1.0, opacity = 0.3) {
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

function buildDesk(x, z, ry = 0, w = 1.6, d = 0.8, color = 0x6b4f3a) {
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
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), mat);
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
    return addContactShadow(glb, 2.8, 1.4);
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
  return addContactShadow(g, 2.8, 1.4);
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
function buildLibraryCounter(x, z, ry = 0) {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 });
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.85 });
  const topMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.55 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.35 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.95, 0.65), wood);
  base.position.y = 0.475; base.castShadow = true; g.add(base);
  const top = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.06, 0.85), topMat);
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

function buildTable(x, z, ry = 0, w = 2.2) {
  const glb = makeDecoration('table', { width: w, depth: 1.2, height: 0.78 });
  if (glb) {
    glb.position.set(x, 0, z); glb.rotation.y = ry;
    glb.userData.surface = 'floor';
    return addContactShadow(glb, w + 0.5, 1.7);
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
  return addContactShadow(g, w + 0.5, 1.7);
}

function buildLamp(x, z, opts = {}, y = null) {
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
  // MOBILE: skip the PointLight entirely (point lights are the single
  // biggest per-fragment cost on weak GPUs) and compensate by boosting
  // emissive on the shade so the lamp still reads as "on".
  const baseY = hasY ? y : 0.78;
  const mob = isMobile();
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

// ─── CEO portrait ────────────────────────────────────────────────────────────
let ceoHearts = null;
// Story-inspectable prop groups (Kedash Protocol). Built during loadRoom()
// but registered as interactables AFTER clearInteractables() in buildWorld.
let ceoPortraitGroup = null;
let ceoPlaque = null;          // live-swappable plaque (setPortraitCelebration)
let badgePrinterGroup = null;
let houseRulesGroup = null;
let cxFolderGroup = null;      // PROP-08: CX-13–18 drawer in the File Workshop
// Floor M module handle (FIN-02): { group, colliders, fragmentSpot,
// update } from buildFloorM. Kept so registerStaticColliders can re-push
// the loft AABBs on every editor-triggered rebuild.
let floorMState = null;
// Readable collectible notes (SYS-06): { group, docId } pushed by the
// 'readable_note' room builder; registered by registerReadableNotes()
// after buildWorld's clearInteractables() / at the end of loadFloor().
let readableNotes = [];

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

// Build a temporary offscreen Maya mesh whose only job is to feed the
// CEO wall portrait's high-fidelity render. Kept hidden (not added to
// the scene) and freed after the render lands. Returns null when the
// 'maya' asset isn't cached yet — the hand-drawn fallback then sticks.
function _spawnMayaPortraitMesh() {
  try {
    const look = { _id: 'ceo-wall-portrait', _gltfAsset: 'maya' };
    const mesh = makeGltfCharacter(look, gltfAssetLoader);
    if (!mesh) return null;
    // Park at origin; offscreen — we never add this to the live scene.
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(0, 0, 0);
    return mesh;
  } catch (e) {
    console.warn('[ceo-portrait] maya mesh build failed', e);
    return null;
  }
}

// Track pending CEO portrait upgrades so the asset-resolved hook can
// retry whenever any phase-2 GLB lands (Maya may take a few seconds).
const _pendingCeoPortraitUpgrades = [];

function _upgradeCeoPortrait(targetCanvas, texture) {
  // Try once at the next tick (Maya may already be in cache on a hot
  // reload). If not, queue for the asset-resolved hook to retry.
  const job = { canvas: targetCanvas, texture, done: false };
  _pendingCeoPortraitUpgrades.push(job);
  setTimeout(() => _tryUpgradeCeoPortraits(), 50);
}

function _tryUpgradeCeoPortraits() {
  if (!gltfAssetLoader || !gltfAssetLoader.getResolved?.('maya')) return;
  for (const job of _pendingCeoPortraitUpgrades) {
    if (job.done) continue;
    const mesh = _spawnMayaPortraitMesh();
    if (!mesh) continue;
    job.done = true;
    try {
      renderPortraitToCanvas(mesh, job.canvas, () => {
        job.texture.needsUpdate = true;
      });
    } catch (e) { console.warn('[ceo-portrait] render failed', e); }
  }
}

function buildCeoPortrait(targetScene) {
  // R-7: hearts + plaque flip are gated on the FINALE being seen (not on
  // raw all-tests-passed) so the reveal lands inside the ceremony via
  // setPortraitCelebration(true).
  const allDone = Story.sceneSeen('finale');

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

  // Portrait canvas — initially the hand-drawn fallback (so something
  // shows immediately), then upgraded to a high-fidelity render of the
  // actual 3D Maya rig once the maya_skin.jpg overlay has decoded.
  const portraitCanvas = document.createElement('canvas');
  portraitCanvas.width = 768; portraitCanvas.height = 1024;
  drawCeoPortrait(portraitCanvas);
  const portraitTex = new THREE.CanvasTexture(portraitCanvas);
  portraitTex.colorSpace = THREE.SRGBColorSpace;
  portraitTex.anisotropy = 8;
  _upgradeCeoPortrait(portraitCanvas, portraitTex);
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
  ceoPlaque = plaque;

  // Warm accent light so the portrait reads as "lit with care" — a small
  // story beat (PROP-04): someone keeps this corner of reception warm.
  const warmLight = new THREE.PointLight(0xffd9a0, 0.6, 4);
  warmLight.position.set(0, 0.4, 0.9);
  group.add(warmLight);

  // Floating hearts once the finale has been seen (the building's owner
  // finally at ease — relief, welcome, family).
  if (allDone) {
    group.add(_buildCeoHearts());
  }

  // Position + scene.add deliberately handled by the caller (the
  // rooms loader does this so the group gets tagged with _roomId /
  // _roomEntryIndex and the editor can select / drag the portrait
  // like any other room object). The default back-wall slot is set
  // via the data entry in data/rooms.js → pos: [0, 2.0, -10.86].
  ceoPortraitGroup = group;
  return group;
}

function _buildCeoHearts() {
  ceoHearts = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const h = makeLabelSprite('♥', '#ff3366', 'rgba(255,255,255,0)');
    h.scale.set(0.5, 0.5, 1);
    h.userData.phase = i / 8;
    ceoHearts.add(h);
  }
  return ceoHearts;
}

// Live hearts + plaque flip (FIN-06 / R-7): the §5.4 ceremony beat where
// the portrait "sprouts its floating hearts ON CEREMONY TRIGGER". Safe to
// call any time after the reception room is built; idempotent.
function setPortraitCelebration(on) {
  if (!ceoPortraitGroup) return;
  if (ceoPlaque) {
    ceoPortraitGroup.remove(ceoPlaque);
    ceoPlaque.material?.map?.dispose?.();
    ceoPlaque.material?.dispose?.();
  }
  ceoPlaque = makeLabelSprite(
    on ? '♥  Maya Kedash · CEO  ♥' : 'Maya Kedash — CEO',
    '#fff',
    on ? 'rgba(180,30,80,0.95)' : 'rgba(26,39,68,0.95)'
  );
  ceoPlaque.scale.set(2.6, 0.55, 1);
  ceoPlaque.position.set(0, -1.55, 0.12);
  ceoPortraitGroup.add(ceoPlaque);
  if (on && !ceoHearts) {
    ceoPortraitGroup.add(_buildCeoHearts());
  } else if (!on && ceoHearts) {
    ceoPortraitGroup.remove(ceoHearts);
    ceoHearts = null;
  }
}

// AUDIO-04 / A24 — a single ~150ms glint at the portrait's eyes when a
// promotion lands while it's on the current floor and roughly in view.
// Blink and you miss it; that's the point.
function flashPortraitEyeGlint() {
  if (!ceoPortraitGroup?.parent || currentFloor !== 1 || !camera) return;
  const wp = new THREE.Vector3();
  ceoPortraitGroup.getWorldPosition(wp);
  const fwd = new THREE.Vector3();
  camera.getWorldDirection(fwd);
  if (fwd.dot(wp.clone().sub(camera.position).normalize()) < 0.35) return;
  const sprites = [];
  for (const ex of [-0.148, 0.148]) {
    // Eye positions mirror drawCeoPortrait's normalized X(0.42)/X(0.58),
    // Y(0.43) mapped onto the 1.85×2.25 photo plane.
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      color: 0xffffff, blending: THREE.AdditiveBlending,
      depthWrite: false, transparent: true, opacity: 0.95,
    }));
    s.scale.set(0.07, 0.07, 1);
    s.position.set(ex, 0.1575, 0.1);
    ceoPortraitGroup.add(s);
    sprites.push(s);
  }
  setTimeout(() => {
    for (const s of sprites) {
      ceoPortraitGroup?.remove(s);
      s.material.dispose();
    }
  }, 150);
}

// ─── Badge printer (PROP-06) ─────────────────────────────────────────────────
// Small desk prop behind Linda's reception spot. Inspect registration is
// deferred to registerStoryInspectables() — clearInteractables() runs after
// the reception room loads and would wipe anything registered here.
function buildBadgePrinter(x, z, rotY) {
  const group = new THREE.Group();

  const pedestal = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.85, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.7 })
  );
  pedestal.position.y = 0.425;
  group.add(pedestal);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.28, 0.42),
    new THREE.MeshStandardMaterial({ color: 0xb0bec5, metalness: 0.3, roughness: 0.45 })
  );
  body.position.y = 0.99;
  group.add(body);

  // Badge output slot
  const slot = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.025, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
  );
  slot.position.set(0, 0.95, 0.215);
  group.add(slot);

  // Status screen — one idle line, drawn once (no ticker needed).
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const cctx = c.getContext('2d');
  cctx.fillStyle = '#0a1622';
  cctx.fillRect(0, 0, 256, 64);
  cctx.fillStyle = '#7fd4a0';
  cctx.font = '600 17px monospace';
  cctx.textAlign = 'center';
  cctx.fillText('LAST JOB: 1 BADGE', 128, 27);
  cctx.fillText('— 6 DAYS AGO', 128, 50);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.4, 0.1),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  screen.position.set(0, 1.06, 0.212);
  group.add(screen);

  group.position.set(x, 0, z);
  group.rotation.y = rotY || 0;
  badgePrinterGroup = group;
  return group;
}

// ─── House rules frame (Kedash Protocol, PROP-01) ────────────────────────────
// A framed, yellowing printout — "HOUSE RULES — M.K., year 1" — hung on
// the reception back wall near the ch03 kiosk. Its three faded rules
// mirror the ch03-test conventions word-for-word: the player's first
// physical Maya artifact. Inspect registration happens in
// registerStoryInspectables() (same deferral as the badge printer).
function buildHouseRulesFrame(x, z, rotY) {
  const group = new THREE.Group();

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 1.3, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.65 })
  );
  group.add(frame);

  // Yellowed paper with faded typewritten rules.
  const c = document.createElement('canvas');
  c.width = 256; c.height = 340;
  const cctx = c.getContext('2d');
  cctx.fillStyle = '#e8dcb4';
  cctx.fillRect(0, 0, 256, 340);
  // Aging blotches.
  cctx.fillStyle = 'rgba(160, 130, 70, 0.12)';
  cctx.beginPath(); cctx.arc(40, 60, 36, 0, Math.PI * 2); cctx.fill();
  cctx.beginPath(); cctx.arc(210, 280, 48, 0, Math.PI * 2); cctx.fill();
  cctx.fillStyle = '#4a3c24';
  cctx.textAlign = 'center';
  cctx.font = '700 22px Georgia, serif';
  cctx.fillText('HOUSE RULES', 128, 48);
  cctx.font = 'italic 600 15px Georgia, serif';
  cctx.fillText('— M.K., year 1', 128, 76);
  // Faded ink for the rules themselves.
  cctx.fillStyle = 'rgba(74, 60, 36, 0.72)';
  cctx.font = '500 14px Georgia, serif';
  cctx.textAlign = 'left';
  const rules = [
    ['1. Replies follow', '    templates/.'],
    ['2. Cancellations escalate', '    to #cx-escalations.'],
    ['3. Never mention', '    internal-notes/ in', '    customer text.'],
  ];
  let yy = 122;
  for (const rule of rules) {
    for (const line of rule) { cctx.fillText(line, 26, yy); yy += 22; }
    yy += 12;
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const paper = new THREE.Mesh(
    new THREE.PlaneGeometry(0.86, 1.16),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 })
  );
  paper.position.z = 0.028;
  group.add(paper);

  group.position.set(x, 1.65, z);
  group.rotation.y = rotY || 0;
  houseRulesGroup = group;
  return group;
}

// PROP-08 / ASK-A9 — filing cabinet with its top drawer left open, a single
// manila folder propped inside. The inspect card (story_docs cx_folder) is
// the folder tab and nothing else. Inspect registration deferred to
// registerStoryInspectables(), same as the badge printer.
function buildCxFolder() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x90a4ae, metalness: 0.6, roughness: 0.45 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x37474f });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 0.5), mat);
  body.position.y = 0.7; body.castShadow = true; group.add(body);
  // Closed lower drawers (fronts + handles), open slot where the top was.
  for (let i = 0; i < 2; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.01), dark);
    line.position.set(0, 0.3 + i * 0.4, 0.255); group.add(line);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.04), dark);
    handle.position.set(0, 0.25 + i * 0.4, 0.27); group.add(handle);
  }
  // The open top drawer — a shallow tray protruding from the body.
  const tray = new THREE.Group();
  const trayMat = new THREE.MeshStandardMaterial({ color: 0x78909c, metalness: 0.5, roughness: 0.5 });
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.02, 0.4), trayMat);
  bottom.position.set(0, -0.1, 0); tray.add(bottom);
  const front = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.24, 0.03), mat);
  front.position.set(0, 0, 0.2); tray.add(front);
  const fHandle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.04), dark);
  fHandle.position.set(0, 0, 0.23); tray.add(fHandle);
  for (const sx of [-0.26, 0.26]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2, 0.4), trayMat);
    side.position.set(sx, -0.02, 0); tray.add(side);
  }
  tray.position.set(0, 1.22, 0.42);
  group.add(tray);
  // The folder, standing in the tray, leaning back against the body.
  const folder = buildReadableNote({ variant: 'folder', label: 'CX-13 — CX-18' });
  folder.rotation.x = -Math.PI / 2 + 0.22;
  folder.position.set(0, 1.16, 0.36);
  group.add(folder);
  cxFolderGroup = group;
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
// ── Procedural plaster/painted-wall surface ───────────────────────────
// Replaces the flat single-colour MeshStandardMaterial that made walls
// read as "Roblox". One shared 256px CanvasTexture (near-white mottle so
// per-room colour still tints through via material.color) plus a matching
// bump map for subtle painted-drywall relief. Mobile-cheap: textures are
// generated once and reused across every wall; only the tint differs.
let _wallMapTex = null;
let _wallBumpTex = null;
function _buildWallTextures() {
  // Diffuse: white base with faint low-frequency mottle + fine grain.
  // Kept near-white so material.color is preserved (map multiplies colour).
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 256, 256);
  // Soft blotches of slightly-off-white for uneven paint/plaster.
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * 256, y = Math.random() * 256;
    const r = 30 + Math.random() * 70;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    const tone = 224 + Math.floor(Math.random() * 22); // 224..245
    grad.addColorStop(0, `rgba(${tone},${tone},${tone},0.16)`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // Fine speckle for a tooth/paper grain.
  const img = g.getImageData(0, 0, 256, 256);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 12;
    d[i] = Math.min(255, Math.max(0, d[i] + n));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n));
  }
  g.putImageData(img, 0, 0);
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;

  // Bump: mid-grey base + the same speckle so light catches the grain.
  const cb = document.createElement('canvas');
  cb.width = cb.height = 256;
  const gb = cb.getContext('2d');
  gb.fillStyle = '#808080';
  gb.fillRect(0, 0, 256, 256);
  const bimg = gb.getImageData(0, 0, 256, 256);
  const bd = bimg.data;
  for (let i = 0; i < bd.length; i += 4) {
    const n = 128 + (Math.random() - 0.5) * 46;
    bd[i] = bd[i + 1] = bd[i + 2] = n;
  }
  gb.putImageData(bimg, 0, 0);
  const bump = new THREE.CanvasTexture(cb);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;

  _wallMapTex = map;
  _wallBumpTex = bump;
}
function makeWallMaterial(color = 0xf4ecd8, metal = 0) {
  if (!_wallMapTex) _buildWallTextures();
  return new THREE.MeshStandardMaterial({
    color,
    map: _wallMapTex,
    bumpMap: _wallBumpTex,
    bumpScale: 0.04,
    metalness: (metal || 0) * 0.2,
    roughness: 0.92,
  });
}

// Shared tinted glass for the office curtain-wall windows. Low opacity so
// the skyline reads through; high envMapIntensity so it picks up the IBL
// reflection once scene.environment is set.
let _officeGlassMat = null;
function officeGlassMaterial() {
  if (!_officeGlassMat) {
    _officeGlassMat = new THREE.MeshStandardMaterial({
      color: 0xbcd6ee, transparent: true, opacity: 0.16,
      metalness: 0.3, roughness: 0.04, envMapIntensity: 1.0,
      depthWrite: false, side: THREE.DoubleSide,
    });
  }
  return _officeGlassMat;
}

// Procedural suspended-ceiling acoustic tile: a near-white 2×2 tile cell with
// recessed grout lines + faint per-tile speckle. Tiled across the office
// ceiling it reads as a real dropped grid instead of a blank white slab — the
// single biggest "this is an office" cue overhead. Generated once, shared.
let _ceilingTileTex = null;
function ceilingTileTexture() {
  if (_ceilingTileTex) return _ceilingTileTex;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#eef0f1';
  g.fillRect(0, 0, 256, 256);
  // Faint acoustic speckle.
  for (let i = 0; i < 1400; i++) {
    const v = Math.random();
    g.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.5)' : 'rgba(150,155,160,0.18)';
    g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  // 2×2 grid grout (so tex.repeat gives an even tile count).
  g.strokeStyle = 'rgba(120,126,132,0.85)';
  g.lineWidth = 4;
  for (const p of [0, 128, 256]) {
    g.beginPath(); g.moveTo(p, 0); g.lineTo(p, 256); g.stroke();
    g.beginPath(); g.moveTo(0, p); g.lineTo(256, p); g.stroke();
  }
  // Soft inner shadow at each tile edge for depth.
  g.strokeStyle = 'rgba(90,95,100,0.25)';
  g.lineWidth = 10;
  for (const p of [0, 128]) {
    g.strokeRect(p + 6, p + 6, 116, 116);
    g.strokeRect(p + 6, (p + 128) % 256 + 6, 116, 116);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  _ceilingTileTex = tex;
  return tex;
}

// Distant city ring + ground far below, so the office windows look onto a
// skyline instead of empty skydome. Tagged with the floor so single-floor
// culling hides it on other floors. Buildings sit on absolute world ground
// (y≈0); the office plate is several metres up, so the view reads as "high
// in a tower".
let _officeSkylineMats = null;
function buildOfficeSkyline(floorIdx) {
  if (!_officeSkylineMats) {
    _officeSkylineMats = [0x2c3e50, 0x34495e, 0x29333f, 0x3d4d5d].map((c) =>
      new THREE.MeshStandardMaterial({
        color: c, roughness: 0.7, metalness: 0.25,
        emissive: c, emissiveIntensity: 0.14,
      }));
  }
  const group = new THREE.Group();
  group.userData.floor = floorIdx;
  // Hazy ground far below the tower.
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(120, 40),
    new THREE.MeshStandardMaterial({ color: 0x4a5a52, roughness: 0.96 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  group.add(ground);
  const N = isMobile() ? 22 : 34;
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2 + (Math.random() - 0.5) * 0.18;
    const rad = 44 + Math.random() * 26;          // 44..70 m out
    const w = 3 + Math.random() * 6;
    const d = 3 + Math.random() * 6;
    const h = 12 + Math.random() * 40;            // 12..52 m tall
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      _officeSkylineMats[i % _officeSkylineMats.length],
    );
    m.position.set(Math.cos(ang) * rad, h / 2, Math.sin(ang) * rad);
    m.rotation.y = ang;
    group.add(m);
  }
  scene.add(group);
}

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
    wallMaterialFactory: (material) => makeWallMaterial(
      (material && material.color) || 0xf4ecd8,
      (material && material.metal) || 0,
    ),
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
  registerRoomBuilder('library_counter', (pos, rotY) =>
    buildLibraryCounter(pos[0], pos[2], rotY || 0));
  registerRoomBuilder('table', (pos, rotY, args) =>
    buildTable(pos[0], pos[2], rotY || 0, args.w));
  registerRoomBuilder('lamp', (pos, rotY, args) => buildLamp(pos[0], pos[2], args || {}, pos[1]));
  registerRoomBuilder('badge_printer', (pos, rotY) =>
    buildBadgePrinter(pos[0], pos[2], rotY || 0));
  registerRoomBuilder('house_rules', (pos, rotY) =>
    buildHouseRulesFrame(pos[0], pos[2], rotY || 0));
  registerRoomBuilder('readable_note', (pos, rotY, args) => {
    const group = buildReadableNote({ label: args.label, variant: args.variant });
    group.position.set(pos[0], pos[1] || 0, pos[2]);
    group.rotation.y = rotY || 0;
    if (args.doc) readableNotes.push({ group, docId: args.doc });
    return group;
  });
  // PROP-05 — floor-4 ceiling cable trays converging on the elevator
  // shaft (the physical hint that everything routes up to floor M).
  registerRoomBuilder('cable_trays', () => buildCableTrays());

  // ── Kedash Protocol ambient props (Phase 5b) ──────────────────────
  // PROP-07 — six identical team photos, library wall.
  registerRoomBuilder('team_photos', (pos, rotY) => {
    const group = buildTeamPhotosWall();
    group.position.set(pos[0], pos[1] || 0, pos[2]);
    group.rotation.y = rotY || 0;
    return group;
  });
  // PROP-09 / PROP-11 / PROP-13 — animated wall screens; their update(dt)
  // rides the existing decoTickers path.
  for (const [kind, build] of [
    ['seats_dashboard', buildSeatsDashboard],
    ['token_counter', buildTokenCounter],
    ['rec_mirror', buildRecMirror],
  ]) {
    registerRoomBuilder(kind, (pos, rotY, args, ctx) => {
      const h = build();
      h.group.position.set(pos[0], pos[1] || 0, pos[2]);
      h.group.rotation.y = rotY || 0;
      if (h.update) ctx.decoTickers.push((dt) => h.update(dt));
      return h.group;
    });
  }
  // PROP-12 — Employee-of-the-Month corkboard, every month the same face.
  // drawCeoPortrait paints a whole canvas; the corkboard wants a
  // (ctx2d, pw, ph) painter — render once offscreen, blit per card.
  registerRoomBuilder('eotm_corkboard', (pos, rotY) => {
    const off = document.createElement('canvas');
    off.width = 192; off.height = 224;
    drawCeoPortrait(off);
    const group = buildEotmCorkboard({
      drawPortrait: (x, pw, ph) => x.drawImage(off, 0, 0, pw, ph),
    });
    group.position.set(pos[0], pos[1] || 0, pos[2]);
    group.rotation.y = rotY || 0;
    return group;
  });
  // PROP-08 — open filing-cabinet drawer, CX-13 — CX-18.
  registerRoomBuilder('cx_folder', (pos, rotY) => {
    const group = buildCxFolder();
    group.position.set(pos[0], pos[1] || 0, pos[2]);
    group.rotation.y = rotY || 0;
    return group;
  });

  // ── Compound builders (each owns its own multi-mesh placement) ───
  // Each returns null because the underlying builder already calls
  // scene.add internally; we forward any per-frame tickers to ctx.
  registerRoomBuilder('reception_windows', (pos, rotY, args, ctx) => {
    try { receptionWindows = buildReceptionWindows(ctx.scene); }
    catch (e) { console.warn('reception windows failed', e); }
    return null;
  });
  // Window center rides the data entry's pos ([wallX, 0, z]) so the
  // editor-exported library layout stays the source of truth.
  registerRoomBuilder('library_arched_window', (pos, rotY, args, ctx) => {
    try {
      libraryWindow = buildLibraryArchedWindow(ctx.scene, {
        wallX: Array.isArray(pos) ? pos[0] : -33,
        z: Array.isArray(pos) ? pos[2] : -28,
      });
    } catch (e) { console.warn('library window failed', e); }
    return null;
  });
  // Ceiling kit centers itself on the entry's pos (the room center).
  registerRoomBuilder('library_ceiling', (pos, rotY, args, ctx) => {
    try {
      buildLibraryCeiling(ctx.scene, {
        cx: Array.isArray(pos) ? pos[0] : -22,
        cz: Array.isArray(pos) ? pos[2] : -22,
      });
    } catch (e) { console.warn('library ceiling failed', e); }
    return null;
  });
  // Library floor — a floor_plate with a wood-plank canvas texture.
  // Kept as a dedicated builder (instead of teaching roomsLoader about
  // patterns) so roomsLoader.js keeps its pinned ?v= module identity
  // with the in-game editor.
  registerRoomBuilder('library_floor', (pos, rotY, args) => {
    const w = args.w ?? 22, d = args.d ?? 22;
    const tex = floorPatternTexture('wood');
    if (tex) tex.repeat.set(w / 4, d / 4);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshStandardMaterial({
        color: args.color ?? 0x8d6e63, map: tex || null, roughness: 0.85,
      }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(pos[0], pos[1] || 0, pos[2]);
    mesh.receiveShadow = true;
    return mesh;
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
  // PROP-10 — blank spines + 9:41 clock for the live west-wing library.
  registerRoomBuilder('library_dressing', (pos, rotY, args, ctx) => {
    try { decorateLibraryAnomalies(ctx.scene, ctx.decoTickers); }
    catch (e) { console.warn('library dressing failed', e); }
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

// ─── Story-inspectable props (PROP-04 / PROP-06) ─────────────────────────────
// Runs in buildWorld AFTER clearInteractables() — the prop groups are created
// by room builders during loadRoom(), which executes before the wipe, so they
// can't self-register at build time.
function registerStoryInspectables() {
  const entries = [
    // Portrait hangs on the back wall behind the reception desk — the
    // desk keeps the player ~3m away, so its radius is more generous.
    { group: ceoPortraitGroup,  docId: 'portrait',      radius: 3.4,
      prompt: 'Inspect portrait — press E',      glowColor: 0xc9a44c },
    { group: badgePrinterGroup, docId: 'badge_printer', radius: 2.4,
      prompt: 'Inspect badge printer — press E', glowColor: 0x7fd4a0 },
    // PROP-01: framed yellowed house rules near the ch03 kiosk.
    { group: houseRulesGroup,   docId: 'house_rules',   radius: 2.6,
      prompt: 'Read the framed page — press E', glowColor: 0xc9a44c },
    // PROP-08: the open CX-13–18 drawer in the File Workshop.
    { group: cxFolderGroup,     docId: 'cx_folder',     radius: 2.4,
      prompt: 'Inspect folder — press E',        glowColor: 0xc9a44c },
  ];
  for (const { group, docId, prompt, glowColor, radius } of entries) {
    if (!group || !group.parent) continue;
    const wp = new THREE.Vector3();
    group.getWorldPosition(wp);
    // Pilot interaction: the badge printer in the lobby actually prints
    // the player's ch01-test KDQ nonce in-world (see openBadgePrinter).
    // The first interaction shows the PRINTING animation + slip; later
    // visits show an "already printed" variant. Other inspectables
    // (portrait, house rules, cx_folder) keep the read-only inspect card.
    const onInteract = (docId === 'badge_printer')
      ? () => openBadgePrinter()
      : () => openInspectCard(docId);
    const getPromptText = (docId === 'badge_printer')
      ? () => (Story.getFlag?.('lobby_badge_printed')
          ? 'Re-check badge printer — press E'
          : 'Operate badge printer — press E')
      : () => prompt;
    registerInteractable({
      mesh: group,
      kind: 'story-inspect',
      position: [wp.x, wp.z],
      radius,
      glowSize: 0.9,
      glowColor,
      parent: scene,
      onInteract,
      getPromptText,
    });
    // These props are ROOM entries (data/rooms.js) — the editor must keep
    // treating them as such. registerInteractable's _isInteractable tag
    // would win in the editor's tagKind() and route drags to the (absent)
    // LESSON_DELIVERY override path, so drop it. Interaction still works:
    // the proximity loop re-attaches _interactable on hover.
    delete group.userData._isInteractable;
  }
}

// ─── Readable collectible notes (SYS-06) ─────────────────────────────────────
// Registers any built-but-unregistered note as an interactable. Called
// from buildWorld (floor-1 notes are built by loadRoom BEFORE the
// clearInteractables() wipe) and from loadFloor (floor-3/4 notes are
// lazy-built AFTER the wipe, so they register immediately). Tier gating
// is evaluated at prompt/interact time so a mid-session tier change
// (e.g. TWIST 2 completing two metres from the client-profiles folder)
// unlocks without a rebuild.
function registerReadableNotes() {
  for (const note of readableNotes) {
    const { group, docId } = note;
    if (!group || !group.parent || group.userData._noteRegistered) continue;
    group.userData._noteRegistered = true;
    const doc = window.STORY_DOCS?.[docId] || {};
    const noteFloor = group.userData.floor || 1;
    const unlocked = () => Story.getTier() >= (doc.unlockTier || 0);
    const wp = new THREE.Vector3();
    group.getWorldPosition(wp);
    const it = registerInteractable({
      mesh: group,
      kind: 'readable-note',
      position: [wp.x, wp.z],
      radius: 1.8,
      glowSize: 0.7,
      glowColor: 0xc9a44c,
      parent: scene,
      getPromptText: () => {
        if (currentFloor !== noteFloor) return '';
        if (!unlocked()) return 'Locked — internal';
        const read = Story.collectibleRead?.(docId);
        return `${read ? 'Re-read' : 'Read'} — ${doc.title || 'document'} — press E`;
      },
      onInteract: () => {
        if (currentFloor !== noteFloor) return;
        if (!unlocked()) { playUi('cancel'); return; }
        openDocument({ title: doc.title || 'Document', body: doc.body || '' });
        Story.markCollectibleRead?.(docId);
      },
    });
    if (it?.glow) {
      // The ring is parented to the scene at y=0.02 — lift it onto the
      // note's floor plate and tag it so floor culling hides it.
      it.glow.userData.floor = noteFloor;
      it.glow.position.y = floorBaseY(noteFloor) + 0.02;
    }
    // Same editor-compat trick as registerStoryInspectables: these are
    // ROOM entries; keep the editor routing drags to rooms.js.
    delete group.userData._isInteractable;
  }
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
  readableNotes = [];
  const ctx = { scene, decoTickers };

  loadRoom(scene, window.ROOM_BY_ID('reception'), ctx);

  // Library moved to the west wing (north of Files). Its gated door
  // is now at the Files-Library boundary (z=-11, centered at x=-22).
  // openRot = +π/2 because the player approaches from the SOUTH side
  // (from Files) and the door swings into the library to the NORTH.
  // The old door at z=11 (south of reception) was repurposed — that
  // doorway is now the building's outside entrance (no gating, the
  // door decoration in data/rooms.js fills the gap).
  registerDoor(scene, -11, 'ch01', 'Knowledge Library', -22, Math.PI / 2);

  // (The old zone-2 → zone-3 door at z=33 was removed when the
  // library moved out of the south-of-reception slot. Files / Plan
  // Mode are now accessed via reception's west doorway, not a
  // z-axis corridor.)

  // West-wing rooms — shell (floor / walls / sign / accent strip) is
  // theme-derived per ZONE_THEMES[idx] and stays in code. Each call
  // also loads its room's furniture from window.ROOM_BY_ID(...).
  buildFloor1WestRoom(2, -22, 0);    // Files       (CURRICULUM[2])
  buildFloor1WestRoom(3, -22, 22);   // Plan Mode   (CURRICULUM[3])
  // Library now lives north of Files in the west wing (it used to sit
  // directly south of reception, but the south side is now the
  // building's outdoor front facade). Walls + furniture + the ceiling
  // kit + arched window all come from data/rooms.js's 'library' entry
  // (the old bare stopgap ceiling plane was replaced by the
  // 'library_ceiling' builder kit from world/ceilings.js).
  try {
    const libRoom = window.ROOM_BY_ID && window.ROOM_BY_ID('library');
    if (libRoom) loadRoom(scene, libRoom, { scene, decoTickers });
  } catch (e) { console.warn('library load failed', e); }

  // ─── Interactable objects (Pillar 2) — driven by lessonRegistry ──────────
  // Each chapter's delivery config either spawns an object or stays
  // NPC-delivered. NPC-delivered chapters need no object here.
  clearInteractables();
  interactObjects = [];
  const buildersByKind = {
    computer:         buildComputer,
    book:             buildBook,
    whiteboard:       buildWhiteboardObject,
    server:           buildServerRack,
    display:          buildDemoScreenObject,
    phone:            buildPhone,
    modelConsole:     buildModelConsole,
    dispatchBoard:    buildDispatchBoard,
    permissionsPanel: buildPermissionsPanel,
  };
  const openLessonNow = (info) => {
    if (window.LessonOverlay?.open) {
      window.LessonOverlay.open(info);
    } else {
      window.App?.navigate?.('lesson', {
        chapterId: info.chapterId, lessonId: info.lessonId, fromPlay: true,
      });
    }
  };
  const onObjectInteract = (info) => {
    // Phase 4 pilot — ch04 whiteboard: first interaction runs the
    // Plan-Mode exercise. Passing it stores a knowledge-check flag
    // (`ch04-planmode`) + adds a +25 PP bonus through addBonusXP, then
    // opens the lesson. Once the flag is set, future presses skip
    // straight to the lesson (the existing already-done state).
    if (info?.chapterId === 'ch04') {
      const progress = window.App?.progress || window.Progress?.load?.();
      const planDone = !!progress?.knowledgeChecks?.['ch04-planmode']?.correct;
      if (!planDone && !isPlanModeOpen()) {
        inputLocked = true;
        openPlanModeExercise({
          onSuccess: () => {
            let p = window.App?.progress;
            if (!p && window.Progress?.load) p = window.Progress.load();
            if (p && window.Progress) {
              p = window.Progress.recordKnowledgeCheck(p, 'ch04-planmode', true, true);
              p = window.Progress.addBonusXP(p, 25);
              window.Progress.save(p);
              window.App.progress = p;
              try { window.App.refreshSidebar?.(); } catch {}
              try { window.Lesson?.showXpToast?.(25); } catch {}
            }
            // Hero reply — typed inside the dialogue card chrome so it
            // reads as the player character thinking out loud before
            // the lesson opens. Plays once per plan-pass.
            inputLocked = true;
            const d = dialogueEl;
            d.innerHTML = `
              <div class="dlg-card">
                <div class="dlg-header">
                  <div class="dlg-portrait">🧠</div>
                  <div class="dlg-who">
                    <div class="dlg-name">You</div>
                    <div class="dlg-role">at the whiteboard</div>
                  </div>
                </div>
                <div class="dlg-body" data-typewriter></div>
                <div class="dlg-actions">
                  <button class="btn-primary dlg-cancel">Open the lesson →</button>
                </div>
              </div>
            `;
            d.classList.add('visible');
            playUi('confirm');
            const line = 'Plan looks right. I won\'t execute until they say go.';
            startTypewriter(d.querySelector('[data-typewriter]'), line, 1.0);
            const proceed = () => {
              closeDialogue();
              openLessonNow(info);
            };
            d.querySelector('.dlg-cancel').onclick = () => { playUi('confirm'); proceed(); };
          },
          onClose: () => { inputLocked = false; },
        });
        return;
      }
    }
    openLessonNow(info);
  };
  for (const [chapterId, cfg] of Object.entries(LESSON_DELIVERY)) {
    if (!cfg.delivery || cfg.delivery === 'npc') continue;
    const builder = buildersByKind[cfg.delivery];
    if (!builder) continue;
    const loc = cfg.objectLocation;
    if (!loc?.position) continue;
    const cid = cfg.chapterId || chapterId;
    const ov = window.LESSON_DELIVERY_OVERRIDES?.[cid];
    // Editor-set deletion: skip the build entirely on this load.
    if (ov?.hidden === true) continue;
    try {
      // Editor-written per-chapter override (data/lesson_delivery_overrides.js).
      // If present, use it for the spawn position; the original loc
      // stays the unedited default that the override layers on top of.
      const rawPosition = (ov?.position && ov.position.length === 3) ? ov.position : loc.position;
      // Floor-base Y offset: data positions are floor-relative (y is
      // height above this chapter's floor plate). The spawn loop adds
      // floorBaseY so a floor-3 ch10 entry at y=0 lands on the floor-3
      // plate at world Y=9, not at world Y=0 (which would be floor 1).
      const floorY = floorBaseY(loc.floor || 1);
      const position = [rawPosition[0], (rawPosition[1] || 0) + floorY, rawPosition[2]];
      const obj = builder({
        scene,
        position,
        lookAt: cfg.lookAt || 0,
        chapterId: cid,
        lessonId: cfg.lessonId,
        onInteract: onObjectInteract,
        // PROP-03: the permissions panel settles all-green once the
        // guardrails test is passed. Evaluated at build time — the play
        // view fully restarts on return from the test view.
        locked: cfg.delivery === 'permissionsPanel'
          ? !!window.Progress?.isTestPassed?.(getProgress(), 'ch15-test')
          : undefined,
      });
      interactObjects.push(obj);
      // Tag the returned group so the in-game editor can resolve a
      // raycast hit back to the LESSON_DELIVERY entry and mirror
      // edits into LESSON_DELIVERY_OVERRIDES. registerInteractable()
      // already set _isInteractable + _interactable on the mesh;
      // here we add the back-references the editor needs to (a)
      // display chapter info, (b) write x/y/z into the overrides map.
      const root = obj?.group;
      if (root && root.userData) {
        root.userData._lessonDeliveryRef = loc;
        root.userData._interactableChapterId = cid;
        root.userData._interactableKind = cfg.delivery;
        root.userData.floor = loc.floor || 1;
        if (Array.isArray(ov?.scale) && ov.scale.length === 3) {
          root.scale.set(ov.scale[0], ov.scale[1], ov.scale[2]);
        }
        // Tag the glow ring with the same floor so floor visibility
        // hides it on other floors (the ring is parented directly to
        // the scene, not to the interactable group, so it wouldn't
        // inherit the group's floor tag automatically).
        // NOTE: `_interactable` lives on the inner interactable MESH, not
        // on the group `root` — the old `root.userData._interactable`
        // lookup always missed, so floor-3/4 glow rings were never tagged
        // and leaked as glowing rings floating in the sky on every floor.
        // Traverse to find the real interactable mesh + tag its ring.
        root.traverse((o) => {
          const glow = o.userData?._interactable?.glow;
          if (glow?.userData) glow.userData.floor = loc.floor || 1;
        });
      }
    } catch (e) {
      console.warn(`object build failed for ${chapterId} (${cfg.delivery})`, e);
    }
  }

  // Story-inspectable props (Kedash Protocol). Their groups were built
  // during loadRoom() above, but clearInteractables() just wiped the
  // registry — so registration is deferred to here.
  registerStoryInspectables();
  registerReadableNotes();

  // Atrium + elevator now load via the reception room's `atrium` and
  // `elevator` builder entries in data/rooms.js (run by loadRoom above).

  // Editor-created clones — pasted via Ctrl+V. These don't come from
  // any builder; they're synthetic entries in the overrides files.
  // Run AFTER all compound builders + interactable spawn loop so the
  // source meshes already exist in the scene to clone from.
  try { _spawnSyntheticCompoundClones(scene); } catch (e) { console.warn('synthetic compound clones failed', e); }
  try { _spawnSyntheticInteractableClones(scene); } catch (e) { console.warn('synthetic interactable clones failed', e); }

  // ── Outdoor yard: grass plane + perimeter fence ─────────────────
  // depth.js's buildExterior covers only the east side (road, trees);
  // here we add a big grass plane underneath everything so the player
  // can walk around the building's west, north, and south sides
  // without rendering on void. The fence reads as the property
  // boundary so the walkable area feels intentional.
  try { _buildOutdoorYard(scene); } catch (e) { console.warn('yard build failed', e); }

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
    if (thinHoriz && tall) { cameraWalls.push(obj); return; }
    // Ceiling planes: wide, flat, and well above the floor. Included so
    // the camera's upward ceiling-probe (in update()) can keep the camera
    // from rising through a single-sided ceiling into the open sky. A
    // rotated PlaneGeometry reports its plane dims as sx/sy with sz≈0, so
    // check the two largest dims are wide and the smallest thin, then
    // confirm it sits above head height in world space.
    const dims = [sx, sy, sz].sort((a, b) => a - b);
    if (dims[2] >= 4 && dims[1] >= 4 && dims[0] <= 0.6) {
      obj.updateWorldMatrix(true, false);
      if (obj.getWorldPosition(_camCeilProbe).y >= 2.5) cameraWalls.push(obj);
    }
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
    // Skip items the data declared an explicit non-zero Y for — the
    // editor's saved Y wins over the auto-settle raycast. (Default-Y
    // items still get snapped: a couch at y=0 still goes to floorBaseY,
    // a fresh mug placed via 'add item' at y=0 still settles onto the
    // table.)
    if (obj.userData._explicitY) continue;
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
// Floor 2-4 outer envelope is now twice as big as the ground floor —
// 36×36 m, centered at origin, with the elevator shaft (at x≈12.3,
// existing geometry) sitting as an INTERIOR column rather than an
// east-wall fixture. clampMove + floorOfficePositionForNPC are
// adjusted accordingly. Floor area: 1296 m² each (was 484, +168%).
const FLOOR_OFFICE_HALF = 18;   // half-extent of the 36×36 floor
const FLOOR_OFFICE_WALL_H = 3.8;

function buildFloorOffice(floorIdx) {
  const y0 = floorBaseY(floorIdx);
  const wallH = FLOOR_OFFICE_WALL_H;
  const H = FLOOR_OFFICE_HALF;     // shorthand
  const FULL = H * 2;              // 36 m
  const themeIdx = (floorIdx - 1) * CHAPTERS_PER_FLOOR;
  const theme = ZONE_THEMES[themeIdx] || { floor: 0xa1887f, wall: 0xefebe9, accent: '#5d4037', metal: 0.1, title: floorThemeName(floorIdx) };

  // Floor plate — 36×36
  const floorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(FULL, FULL),
    new THREE.MeshStandardMaterial({
      color: theme.floor, metalness: theme.metal, roughness: Math.max(0.15, 0.85 - theme.metal),
    }),
  );
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.set(0, y0, 0);
  floorMesh.receiveShadow = true;
  floorMesh.userData.floor = floorIdx;
  scene.add(floorMesh);

  // Ceiling — a suspended acoustic-tile grid (36 m → 0.6 m tiles) instead of
  // a blank white slab. The dropped grid + recessed light panels below read
  // as a real office overhead.
  const ceilTileTex = ceilingTileTexture().clone();
  ceilTileTex.needsUpdate = true;
  ceilTileTex.wrapS = ceilTileTex.wrapT = THREE.RepeatWrapping;
  ceilTileTex.repeat.set(FULL / 1.2, FULL / 1.2);   // 2 tiles/cell → 0.6 m tiles
  const ceilingMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(FULL, FULL),
    new THREE.MeshStandardMaterial({ color: 0xf2f4f5, map: ceilTileTex, roughness: 0.92 }),
  );
  ceilingMesh.rotation.x = Math.PI / 2;
  ceilingMesh.position.set(0, y0 + wallH - 0.01, 0);
  ceilingMesh.userData.floor = floorIdx;
  scene.add(ceilingMesh);

  // Recessed light panels — a 4×4 grid of slightly-dropped emissive troffers.
  // Emissive so the post-fx bloom gives them a soft glow; cheap flat quads.
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xfff4e0, emissiveIntensity: 0.9, roughness: 0.6,
  });
  const panelGeo = new THREE.PlaneGeometry(1.6, 1.6);
  for (let gx = -1.5; gx <= 1.5; gx++) {
    for (let gz = -1.5; gz <= 1.5; gz++) {
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.rotation.x = Math.PI / 2;
      panel.position.set(gx * 8.4, y0 + wallH - 0.06, gz * 8.4);
      panel.userData.floor = floorIdx;
      scene.add(panel);
    }
  }

  const wallMat = makeWallMaterial(theme.wall, theme.metal);
  function addWall(w, h, d, x, z, mat = wallMat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y0 + h / 2, z);
    m.castShadow = true; m.receiveShadow = true;
    m.userData.floor = floorIdx;
    scene.add(m);
  }
  // Box helper with an explicit y-CENTER (relative to the floor base), used
  // by the curtain-wall builder below where pieces don't sit on the floor.
  function addBox(w, h, d, x, yCenter, z, mat = wallMat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y0 + yCenter, z);
    m.castShadow = true; m.receiveShadow = true;
    m.userData.floor = floorIdx;
    scene.add(m);
    return m;
  }

  // ── Outer perimeter — 36 m per side ────────────────────────────────
  // North, south, west walls are CURTAIN WALLS: a solid sill + header band
  // with 5 transparent window openings each, so upper floors look out onto
  // the skyline (built below) instead of a flat opaque wall. The old opaque
  // GLB `window` decorations in data/rooms.js are removed in favour of this.
  // Player containment is the ±17.5 clamp in clampMove, so the openings
  // carry NO collision risk.
  const WIN_OFFSETS = [-15, -7.5, 0, 7.5, 15];
  const WIN_W = 2.4, WIN_H = 2.0, WIN_CY = 1.4;   // matches the former decorations
  const SILL_TOP = WIN_CY - WIN_H / 2;            // 0.4
  const HEAD_BOT = WIN_CY + WIN_H / 2;            // 2.4
  const WALL_T = 0.3;
  function addCurtainWall(axis, fixed) {
    // axis 'x' → wall runs along X at z=fixed (north/south);
    // axis 'z' → wall runs along Z at x=fixed (west).
    const horiz = axis === 'x';
    // Sill (floor→0.4) and header (2.4→top) run the full length.
    const band = (h, yc, w, c) => horiz
      ? addBox(w, h, WALL_T, c, yc, fixed)
      : addBox(WALL_T, h, w, fixed, yc, c);
    band(SILL_TOP, SILL_TOP / 2, FULL, 0);
    band(wallH - HEAD_BOT, HEAD_BOT + (wallH - HEAD_BOT) / 2, FULL, 0);
    // Solid pillars in the gaps between window openings.
    let prev = -H;
    for (const o of WIN_OFFSETS) {
      const left = o - WIN_W / 2;
      if (left > prev + 0.01) band(WIN_H, WIN_CY, left - prev, (prev + left) / 2);
      prev = o + WIN_W / 2;
    }
    if (H > prev + 0.01) band(WIN_H, WIN_CY, H - prev, (prev + H) / 2);
    // Transparent glass + a thin centre mullion per opening.
    for (const o of WIN_OFFSETS) {
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(WIN_W, WIN_H), officeGlassMaterial());
      const gx = horiz ? o : fixed, gz = horiz ? fixed : o;
      glass.position.set(gx, y0 + WIN_CY, gz);
      if (!horiz) glass.rotation.y = Math.PI / 2;
      glass.renderOrder = 2;            // after the skyline (renderOrder 0)
      glass.userData.floor = floorIdx;
      scene.add(glass);
      band(WIN_H, WIN_CY, 0.06, o);     // slim mullion through the glass
    }
  }
  addCurtainWall('x', -H);   // south
  addCurtainWall('x',  H);   // north
  addCurtainWall('z', -H);   // west
  // East wall — solid (elevator shaft sits as an interior column near it).
  addWall(0.3, wallH, FULL,  H, 0);

  // Baseboard — a thin dark band hugging the floor along every wall. Grounds
  // the walls (a top "Roblox" tell is walls meeting the floor with no trim).
  // Sits just inside the wall plane; overhead/wall-hug only, no collision.
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x3a3f44, roughness: 0.7, metalness: 0.1 });
  const baseInset = H - 0.12, baseH = 0.16;
  addBox(FULL, baseH, 0.08, 0, baseH / 2, -baseInset, baseMat);
  addBox(FULL, baseH, 0.08, 0, baseH / 2,  baseInset, baseMat);
  addBox(0.08, baseH, FULL, -baseInset, baseH / 2, 0, baseMat);
  addBox(0.08, baseH, FULL,  baseInset, baseH / 2, 0, baseMat);

  // Perimeter cove lighting — a recessed soffit lip near the top of each wall
  // with a warm emissive strip tucked above it, uplighting the ceiling edge.
  // Reads as modern office indirect lighting and catches the post-fx bloom.
  // Overhead/wall-hug only, so no collision. Shared materials.
  const coveLipMat = new THREE.MeshStandardMaterial({ color: 0xd9d2c4, roughness: 0.85 });
  const coveGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfff2d8, emissive: 0xffdca6, emissiveIntensity: 1.2, roughness: 0.5,
  });
  const coveInset = H - 0.45, coveY = wallH - 0.5, glowY = wallH - 0.34, span = FULL - 1.2;
  // lip (solid shelf) + glow strip (above, emissive) per wall
  addBox(span, 0.16, 0.34, 0, coveY, -coveInset, coveLipMat);
  addBox(span, 0.06, 0.12, 0, glowY, -coveInset + 0.02, coveGlowMat);
  addBox(span, 0.16, 0.34, 0, coveY,  coveInset, coveLipMat);
  addBox(span, 0.06, 0.12, 0, glowY,  coveInset - 0.02, coveGlowMat);
  addBox(0.34, 0.16, span, -coveInset, coveY, 0, coveLipMat);
  addBox(0.12, 0.06, span, -coveInset + 0.02, glowY, 0, coveGlowMat);
  addBox(0.34, 0.16, span,  coveInset, coveY, 0, coveLipMat);
  addBox(0.12, 0.06, span,  coveInset - 0.02, glowY, 0, coveGlowMat);

  // Distant skyline so the new windows look onto a city, not the void.
  buildOfficeSkyline(floorIdx);

  // Internal walls are now per-floor and live in data/rooms.js as
  // `wall` entries under each office_floor{N} room. That lets each
  // floor have a different layout (coworking vs pods vs corridor)
  // while sharing this builder's outer envelope.

  // Floor title sign on north wall
  const sign = makeWallSign(`FLOOR ${floorIdx} — ${(theme.title || '').toUpperCase()}`, 9, 1.4, '#1a2744', theme.accent || '#ffd54f');
  sign.position.set(0, y0 + 2.6, H - 0.16);
  sign.rotation.y = Math.PI;
  sign.userData.floor = floorIdx;
  scene.add(sign);

  // ── Chapter-cluster desks from data (data/rooms.js → office_floor<N>) ──
  // Each desk lives at the same {±13, 0, ±13} slot per floor; the
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
    { x: -13, z: -13, face: 0 },
    { x:  13, z: -13, face: 0 },
    { x: -13, z:  13, face: Math.PI },
    { x:  13, z:  13, face: Math.PI },
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
  // ch02 = library (idx 1), ch03 = Files (idx 2), ch04 = Plan Mode (idx 3).
  // Library used to live south of reception (z=+22) but now sits in
  // the west wing north of Files at center (-22, -22).
  if (idx !== 1 && idx !== 2 && idx !== 3) return null;
  const centerX = -22;
  // Files = z=0, Plan Mode = z=+22, Library = z=-22.
  const centerZ = idx === 1 ? -22 : (idx === 2 ? 0 : 22);
  const ch = window.CURRICULUM?.[idx];
  if (!ch) return null;
  if (npcDef.kind === 'test') {
    // Test NPC stands at the south end of the room (toward the doorway
    // for library/Files; toward the back for Plan Mode).
    // Library (idx 1): -8.5 would put the test NPC at z -30.5, flush
    // against the lounge couch front (couch at -31, depth 0.9) — pull
    // in to -29 for clearance.
    const tz = idx === 3 ? centerZ + 8.5 : (idx === 1 ? centerZ - 7 : centerZ - 8.5);
    const face = idx === 3 ? Math.PI : 0;
    return { pos: [centerX, tz], face };
  }
  // Lesson NPCs — same alternating slot pattern as the other west-wing rooms.
  const m = (npcDef.lessonId || '').match(/-l(\d+)$/);
  const li = m ? Math.max(0, parseInt(m[1], 10) - 1) : 0;
  // Library's lesson-1 NPC (Elena) is the librarian — stand her behind
  // the checkout counter (library_counter at [-18.8, -13.8], placed
  // east of the door swing: the 3.5 m leaf hinged at x=-23.75 sweeps
  // z -11..-14.5 when open), facing the entrance.
  if (idx === 1 && li === 0) {
    return { pos: [-18.8, -14.9], face: 0 };
  }
  const xSign = (li % 2 === 0) ? -1 : 1;
  const zOff = [-4, 0, 4][(li >> 1) % 3];
  // Library: ±6 would land exactly on the bookshelf grid columns
  // (x -28/-16, z -26/-22/-18) and embed NPCs inside the shelves.
  // ±3 puts them in the 3.8 m clear aisles between shelf columns
  // (x -25/-19), reading as "browsing the stacks".
  const xOff = idx === 1 ? 3 : 6;
  return {
    pos: [centerX + xSign * xOff, centerZ + zOff],
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
  // Slots spread to the four quadrants of the 36×36 floor (±13 from
  // origin so they sit ~5 m inside each outer wall). rearZ is the
  // "back of the desk" position for the test NPC.
  const slots = [
    { cx: -13, cz: -13, face: 0,        rearZ: -15 },
    { cx:  13, cz: -13, face: 0,        rearZ: -15 },
    { cx: -13, cz:  13, face: Math.PI,  rearZ:  15 },
    { cx:  13, cz:  13, face: Math.PI,  rearZ:  15 },
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
// Per-builder default footprint (width × depth before rotY). Items
// not listed here are treated as non-blocking (chair / plant / lamp /
// monitor / small clutter). Each entry derives a collider AABB
// centered on the entry's pos.
const BUILDER_FOOTPRINTS = {
  desk:           (args) => ({ w: args?.w ?? 1.6, d: args?.d ?? 0.8 }),
  table:          (args) => ({ w: args?.w ?? 2.2, d: 1.2 }),
  couch:                () => ({ w: 1.8, d: 0.8 }),
  filing_cabinet:       () => ({ w: 0.6, d: 0.6 }),
  bookshelf:            () => ({ w: 2.2, d: 0.4 }),
  water_cooler:         () => ({ w: 0.5, d: 0.5 }),
};
const DECORATION_BLOCKERS = new Set([
  'reception_desk', 'desk', 'table', 'bookshelf', 'couch',
  'filing_cabinet', 'cabinet',
]);

// Derive an AABB collider for one room entry. Returns null for
// non-blocking entries (chair, plant, wall, floor_plate, posters,
// compound builders, …).
//
// entry.collide is an editor-set tri-state:
//   undefined  → use the default rule (BUILDER_FOOTPRINTS /
//                DECORATION_BLOCKERS membership decides).
//   true       → force a collider even if the type isn't in the
//                default list (uses size or a 1×1 fallback).
//   false      → force no collider even if the type is normally a
//                blocker (lets the editor make a desk walk-through).
function aabbForRoomEntry(entry, floor) {
  if (!entry || !Array.isArray(entry.pos)) return null;
  if (entry.collide === false) return null;
  let w = 0, d = 0;
  if (entry.type === 'builder') {
    const f = BUILDER_FOOTPRINTS[entry.fn];
    if (f) {
      const dims = f(entry.args || {});
      w = dims.w; d = dims.d;
    } else if (entry.collide === true) {
      w = entry.args?.w ?? 1.0;
      d = entry.args?.d ?? 1.0;
    } else {
      return null;
    }
  } else if (entry.type === 'decoration') {
    const isDefaultBlocker = DECORATION_BLOCKERS.has(entry.id);
    if (!isDefaultBlocker && entry.collide !== true) return null;
    w = entry.size?.width ?? entry.size?.w ?? 1.0;
    d = entry.size?.depth ?? entry.size?.d ?? 1.0;
  } else if (entry.type === 'wall') {
    // Walls block by default. Skip lintels / transom strips that sit
    // entirely above the player's head — bottom Y >= 1.6 m means the
    // player walks under freely.
    const wallY = entry.pos[1] || 0;
    const wh = entry.size?.h ?? 1.0;
    if (wallY - wh / 2 >= 1.6) return null;
    w = entry.size?.w ?? 1.0;
    d = entry.size?.d ?? 0.3;
  } else {
    return null;
  }
  // Editor-set scale multiplies the footprint. Without this a desk
  // scaled to 2× would visually grow but its collider would stay the
  // original size — the player could walk through the visible mesh.
  // scale[1] (Y) doesn't affect XZ collision.
  if (Array.isArray(entry.scale) && entry.scale.length === 3) {
    w *= Math.max(0.01, Math.abs(entry.scale[0] || 1));
    d *= Math.max(0.01, Math.abs(entry.scale[2] || 1));
  }
  // rotY ±π/2 swaps the footprint axes. For arbitrary angles use the
  // axis-aligned bbox of the rotated rectangle.
  const rotY = entry.rotY || 0;
  const c = Math.abs(Math.cos(rotY));
  const s = Math.abs(Math.sin(rotY));
  const eX = (w * c + d * s) / 2;
  const eZ = (w * s + d * c) / 2;
  const x = entry.pos[0] || 0;
  const z = entry.pos[2] || 0;
  return {
    minX: x - eX, maxX: x + eX,
    minZ: z - eZ, maxZ: z + eZ,
    floor: floor || 1,
  };
}

// ─── Synthetic clones from editor Ctrl+C/V ──────────────────────────────────
// When the user pastes a compound child or an interactable, the editor
// writes a synthetic entry into the matching *_OVERRIDES file. Source
// builders don't reproduce these on load; we walk the overrides here,
// find each clone's live source mesh in the scene, deep-clone it, tag
// the clone with the new id, and add to scene. Position / rotY / scale
// from the override are applied. Idempotent — if a clone tag already
// exists in the scene, we skip.

function _findTaggedMesh(scene, predicate) {
  let found = null;
  scene.traverse((o) => { if (!found && predicate(o)) found = o; });
  return found;
}

function _deepCloneWithMaterials(source) {
  const clone = source.clone(true);
  clone.traverse((o) => {
    if (o.isMesh && o.material) {
      o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone();
    }
  });
  return clone;
}

function _spawnSyntheticCompoundClones(scene) {
  const overrides = window.COMPOUND_OVERRIDES || {};
  for (const [ownerId, childMap] of Object.entries(overrides)) {
    for (const [newChildId, ov] of Object.entries(childMap || {})) {
      if (!ov?.clonedFrom) continue;
      // Idempotency: skip if already present.
      const exists = _findTaggedMesh(scene, (o) =>
        o.userData?._isCompoundChild
        && o.userData._compoundOwner === ownerId
        && o.userData._compoundChildId === newChildId
      );
      if (exists) continue;
      const source = _findTaggedMesh(scene, (o) =>
        o.userData?._isCompoundChild
        && o.userData._compoundOwner === ownerId
        && o.userData._compoundChildId === ov.clonedFrom
      );
      if (!source) {
        console.warn(`[clones] compound source not found: ${ownerId}/${ov.clonedFrom}`);
        continue;
      }
      const clone = _deepCloneWithMaterials(source);
      if (Array.isArray(ov.pos) && ov.pos.length === 3) clone.position.set(ov.pos[0], ov.pos[1], ov.pos[2]);
      if (typeof ov.rotY === 'number') clone.rotation.y = ov.rotY;
      if (Array.isArray(ov.scale) && ov.scale.length === 3) clone.scale.set(ov.scale[0], ov.scale[1], ov.scale[2]);
      clone.userData._isCompoundChild = true;
      clone.userData._compoundOwner = ownerId;
      clone.userData._compoundChildId = newChildId;
      scene.add(clone);
    }
  }
}

function _spawnSyntheticInteractableClones(scene) {
  const overrides = window.LESSON_DELIVERY_OVERRIDES || {};
  for (const [newChapterId, ov] of Object.entries(overrides)) {
    if (!ov?.clonedFrom) continue;
    const exists = _findTaggedMesh(scene, (o) =>
      o.userData?._isInteractable && o.userData._interactableChapterId === newChapterId
    );
    if (exists) continue;
    const source = _findTaggedMesh(scene, (o) =>
      o.userData?._isInteractable && o.userData._interactableChapterId === ov.clonedFrom
    );
    if (!source) {
      console.warn(`[clones] interactable source not found: ${ov.clonedFrom}`);
      continue;
    }
    const clone = _deepCloneWithMaterials(source);
    if (Array.isArray(ov.position) && ov.position.length === 3) {
      clone.position.set(ov.position[0], ov.position[1], ov.position[2]);
    }
    if (Array.isArray(ov.scale) && ov.scale.length === 3) {
      clone.scale.set(ov.scale[0], ov.scale[1], ov.scale[2]);
    }
    clone.userData._isInteractable = true;
    clone.userData._interactableChapterId = newChapterId;
    clone.userData._interactable = null; // decorative clone — no E-key behaviour
    scene.add(clone);
  }
}

// Build the outdoor "yard" — a grass plane + 4-sided wood fence
// around the property at the clampMove bounds (±42). Placed slightly
// below the building's floor (y=-0.01) so the indoor floor plates
// stay on top. Fence segments register as walls for visual + the
// clamp already keeps the player inside, so no colliders needed.
function _buildOutdoorYard(scene) {
  const YARD = 42;      // half-extent of the fenced area
  const FENCE_H = 1.2;  // wooden fence height
  // Grass — single big plane, well below the building floor so it's
  // hidden by floor_plates inside but visible outside.
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x6aa05a, roughness: 0.95 });
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(YARD * 2 + 4, YARD * 2 + 4), grassMat);
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(0, -0.01, 0);
  grass.receiveShadow = true;
  grass.userData.floor = 1;
  scene.add(grass);

  // Wooden fence — picket-style slats along each side. We approximate
  // with one continuous low BoxGeometry per side for cheapness, with
  // a 4 m gap on the south side aligned to the building's entrance
  // (door at x=0, z=+11; gap at x=-2..+2 on the south fence so the
  // player can walk out to the front of the property and the path
  // reads as a real "front gate" approach).
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0x5d3a1a, roughness: 0.82 });
  const addFence = (w, x, z, rotY = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, FENCE_H, 0.12), fenceMat);
    m.position.set(x, FENCE_H / 2, z);
    m.rotation.y = rotY;
    m.castShadow = true; m.receiveShadow = true;
    m.userData.floor = 1;
    scene.add(m);
    return m;
  };
  // North fence — solid 84 m at z=-42.
  addFence(YARD * 2, 0, -YARD);
  // South fence — two segments leaving a 4 m gap centered at x=0.
  const southHalfW = (YARD * 2 - 4) / 2;  // 40 m each
  addFence(southHalfW, -(YARD + 2) / 2, YARD);   // x ≈ -22
  addFence(southHalfW,  (YARD + 2) / 2, YARD);   // x ≈ +22
  // East fence at x=+42, vertical.
  addFence(YARD * 2, YARD, 0, Math.PI / 2);
  // West fence at x=-42, vertical.
  addFence(YARD * 2, -YARD, 0, Math.PI / 2);

  // Fence posts every 4 m so the fence reads as picket-style not just
  // a flat slab. Each side gets posts at its bottom rail height,
  // slightly taller than the rail to break the silhouette.
  const POST_H = FENCE_H + 0.15;
  const postMat = new THREE.MeshStandardMaterial({ color: 0x4a2e15, roughness: 0.8 });
  const addPost = (x, z) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.18, POST_H, 0.18), postMat);
    p.position.set(x, POST_H / 2, z);
    p.castShadow = true; p.receiveShadow = true;
    p.userData.floor = 1;
    scene.add(p);
  };
  for (let i = -YARD; i <= YARD; i += 4) {
    addPost(i, -YARD); // north
    // skip posts where the south gap is.
    if (i < -2 || i > 2) addPost(i, YARD); // south
    addPost(-YARD, i); // west
    addPost(YARD, i); // east
  }
}

function registerStaticColliders() {
  colliders.length = 0;

  // ─── Walls built in code (not in window.ROOMS) ──────────────────
  // Atrium ↔ Files boundary at x=-11, doorway gap at z=0 (reception
  // west wall in rooms.js draws the visible wall; clampMove needs
  // colliders here too for the segments above the doorway lintel).
  addColliderAABB(-11.15, -10.85, -11, -1.75, 1);
  addColliderAABB(-11.15, -10.85,  1.75, 11, 1);
  // Files ↔ Plan Mode boundary (z=+11, west wing), doorway at x=-22.
  addColliderAABB(-33, -23.75, 10.85, 11.15, 1);
  addColliderAABB(-20.25, -11, 10.85, 11.15, 1);
  // Files ↔ Library boundary (z=-11, west wing), doorway at x=-22.
  // (Library moved here from south-of-reception.)
  addColliderAABB(-33, -23.75, -11.15, -10.85, 1);
  addColliderAABB(-20.25, -11, -11.15, -10.85, 1);

  // West wing OUTER walls — built procedurally by buildFloor1WestRoom
  // and buildAtrium-adjacent code (visible meshes added via scene.add()
  // without going through window.ROOMS), so the auto-collider loop
  // below never sees them. Register them here so the player can't walk
  // through the visible west / south walls of Files + Plan Mode.
  // West outer (Files):     x=-33, z=[-11, +11]
  addColliderAABB(-33.15, -32.85, -11, 11, 1);
  // West outer (Plan Mode): x=-33, z=[+11, +33]
  addColliderAABB(-33.15, -32.85,  11, 33, 1);
  // South outer (Plan Mode): z=+33, x=[-33, -11]  (the "PLAN WAR ROOM" wall)
  addColliderAABB(-33, -11, 32.85, 33.15, 1);

  // Elevator shaft walls — built by buildElevator() inside a single
  // compound shaftGroup added via placeCompoundChild(). Shaft footprint
  // in world coords: x=[11.1, 13.5], z=[-8.8, -6.4]. The west face
  // (x=11.1) is the lobby entrance and stays open on floor 1; on
  // floors 2-4 it's closed (cab is the only way in). The other three
  // faces are solid glass on every floor. Register colliders for all
  // four floors the shaft passes through.
  for (let f = 1; f <= FLOOR_M_INDEX; f++) {
    // East face (outside the building)
    addColliderAABB(13.40, 13.60, -8.80, -6.40, f);
    // North face
    addColliderAABB(11.10, 13.50, -8.90, -8.70, f);
    // South face
    addColliderAABB(11.10, 13.50, -6.50, -6.30, f);
    // West face (lobby entrance) — block only on floors 2-4 where the
    // shaft is closed. Floor 1 keeps this gap so the player can walk
    // from the atrium into the cab through the south-facing opening;
    // floor M keeps it open so the cab spills into the loft vestibule.
    if (f >= 2 && f !== FLOOR_M_INDEX) addColliderAABB(11.00, 11.20, -8.80, -6.40, f);
  }

  // Reception centerpiece (the "K" awards sculpture) — a compound
  // builder (receptionCenterpiece.js), so it has NO window.ROOMS entry
  // with a pos for the auto-collider loop to read, and clicking it in
  // the editor selects a compound child (no collide checkbox). Result:
  // the player walked straight through it. Hardcode a collider on its
  // base footprint (cylinder r≈0.95 at the group's world pos 0,0,1),
  // honouring an editor compound-override move if one exists.
  {
    const ov = window.COMPOUND_OVERRIDES?.reception_centerpiece?.k_sculpture;
    const cx = (ov?.pos && ov.pos.length >= 1) ? ov.pos[0] : 0;
    const cz = (ov?.pos && ov.pos.length >= 3) ? ov.pos[2] : 1;
    const r = 1.0; // base radius ~0.95 + a little pad
    addColliderAABB(cx - r, cx + r, cz - r, cz + r, 1);
  }

  // Floor M (mezzanine loft) — bespoke geometry, colliders supplied by
  // buildFloorM and re-pushed on every rebuild once the floor exists.
  if (floorMState) colliders.push(...floorMState.colliders);

  // Floors 2-4 internal walls now come from window.ROOMS too — each
  // office_floor{N} room declares its own unique partitioning (so
  // floor 2 / 3 / 4 don't all look identical). The wall auto-collide
  // branch in aabbForRoomEntry produces colliders for those walls.

  // ─── Furniture derived from window.ROOMS ─────────────────────────
  // Re-derived from current pos + size, so editor edits (move /
  // resize / paste) take effect immediately when rebuildColliders()
  // is called. See aabbForRoomEntry for blocking-type rules.
  for (const room of (window.ROOMS || [])) {
    const f = room.floor || 1;
    for (const e of (room.objects || [])) {
      const c = aabbForRoomEntry(e, f);
      if (c) colliders.push(c);
    }
  }
}

// Public alias for the editor — same code path, fresh re-derivation
// of the rooms-data colliders so moves/resizes/pastes are reflected
// in collision immediately.
function rebuildColliders() {
  registerStaticColliders();
}

// ─── Generic zone builder (used for chapters 3-16) ───────────────────────────
function registerDoor(targetScene, atZ, gateChId, nextTitle, centerX = 0, openRot = -Math.PI / 2) {
  const passed = isTestDone(`${gateChId}-test`);
  const doorMat = new THREE.MeshStandardMaterial({
    color: passed ? 0x4caf50 : 0x5d4037,
    metalness: 0.3, roughness: 0.6,
  });
  // Hinge group at the door's LEFT edge (relative to centerX) so a
  // Y-axis rotation swings the door open like a real door.
  // openRot < 0 = swings clockwise (looking down) — right for south-facing
  // walls (door opens into destination at +z). openRot > 0 swings the
  // other way — right for north-facing walls (door opens at -z).
  const DOOR_W = 3.5;
  const pivot = new THREE.Group();
  // Z offset puts the door on the source-room side of the wall (a
  // 0.01 m bias on the side the player approaches from).
  const zBias = openRot < 0 ? -0.01 : 0.01;
  pivot.position.set(centerX - DOOR_W / 2, 1.3, atZ + zBias);
  const door = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W, 2.6, 0.2), doorMat);
  door.position.set(DOOR_W / 2, 0, 0);
  pivot.add(door);
  pivot.rotation.y = passed ? openRot : 0;
  targetScene.add(pivot);

  const label = makeLabelSprite(
    passed ? `${nextTitle} — Open` : `${nextTitle} — Locked`,
    '#fff', passed ? 'rgba(38,140,90,0.95)' : 'rgba(60,72,110,0.95)',
  );
  label.scale.set(3.0, 0.7, 1);
  label.position.set(centerX, 3.4, atZ + zBias * 5);  // sign further off the wall
  targetScene.add(label);

  zoneDoors.push({
    mesh: door, pivot, label,
    gateChapter: gateChId, nextTitle,
    lastOpen: passed,
    openRot,
    // Stashed for clampMove's transient door-collider: when the door is
    // locked, a 3.5m-wide × 0.3m-deep AABB centred on (centerX, atZ)
    // is pushed into colliders for this frame so the player can't walk
    // through the closed door.
    centerX, atZ, floor: 1,
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

  // Floor — carpet-ish canvas texture (shared across both west rooms;
  // the theme color does the tinting since the map is drawn neutral).
  const carpetTex = floorPatternTexture('carpet');
  if (carpetTex) carpetTex.repeat.set(22 / 4, 22 / 4);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 22),
    new THREE.MeshStandardMaterial({
      color: theme.floor, map: carpetTex || null,
      metalness: theme.metal, roughness: Math.min(0.95, Math.max(0.15, 0.85 - theme.metal) + 0.1),
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(centerX, 0, centerZ);
  floor.receiveShadow = true;
  scene.add(floor);

  // Ceiling — same dimensions as the floor, capping the room. Without
  // this, looking down from outside the building (via fly mode or just
  // a high camera) the west-wing rooms look like open boxes. Material
  // matches the theme wall so the underside reads as a finished
  // surface from inside.
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 22),
    new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.85 }),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(centerX, wallH - 0.01, centerZ);
  ceiling.receiveShadow = true;
  scene.add(ceiling);

  // Walls — west / north / south are SOLID. East wall has the doorway
  // that connects to atrium (idx=2) or library (idx=3). For idx=2 the
  // north wall also has a doorway to the Plan Mode room above it.
  const wallMat = makeWallMaterial(theme.wall, theme.metal);
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
    // North wall split (boundary with the new Library room at center
    // [-22, -22]); 3.5 m doorway centered at room center (x=-22, z=-11).
    w(9.25, wallH, 0.3, centerX - 6.375, wallH / 2, centerZ - 11);
    w(9.25, wallH, 0.3, centerX + 6.375, wallH / 2, centerZ - 11);
    w(3.5, 1.2, 0.3, centerX, wallH - 0.6, centerZ - 11);
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
  const wallMat = makeWallMaterial(theme.wall, theme.metal);
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
  // Player-chosen avatar (customization.js): a manifest rig id. 'hero' is
  // the default casting (leave _gltfAsset unset → resolveAssetForCharacter
  // maps 'player' → hero); any other choice overrides the rig directly.
  try {
    const avatar = loadCustomization()?.avatar;
    if (avatar && avatar !== 'hero') playerLook._gltfAsset = avatar;
  } catch {}
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
  // Saved floor restored AFTER buildPlayer returns — see init() chain
  // which calls _restoreSavedFloor() once buildNPCs / setupInput are
  // done. Here we just read the XZ and Y-from-current-floor.
  try {
    const saved = JSON.parse(sessionStorage.getItem('ccq_play_pos') || 'null');
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.z)) {
      startX = saved.x; startZ = saved.z;
    }
  } catch {}
  player.position.set(startX, floorBaseY(currentFloor), startZ);
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

// Resolve which floor an NPC def belongs to. Explicit `floor` wins
// (ceremony cast / editor), then the Maya special case (Floor M until
// the finale, reception after — FIN-03/FIN-07), then the chapter map.
function floorForNpcDef(d) {
  if (Number.isFinite(d.floor)) return d.floor;
  if (d.id === 'maya') return Story.sceneSeen('finale') ? 1 : FLOOR_M_INDEX;
  return floorForChapterId(d.chapterId) || 1;
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
  const npcFloor = floorForNpcDef(npcDef);
  // Post-finale Maya idles near reception (FIN-07) — her roster pos is
  // her Floor M spot, so relocate when the epilogue state is live.
  if (npcDef.id === 'maya' && npcFloor === 1) {
    npcDef = { ...npcDef, pos: [-2.2, -6.6], face: 0.8 };
  }
  if (npcFloor > 1 && npcFloor <= FLOORS_TOTAL) {
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
  // Editor-written per-NPC override (data/npc_overrides.js). Applied
  // LAST so it wins over the floor-relocation overrides above. Keyed
  // by NPC id; works for both hand-built (NPCS) and auto-generated
  // chapter NPCs since both use stable ids.
  const editorOverride = window.NPC_OVERRIDES && window.NPC_OVERRIDES[npcDef.id];
  if (editorOverride) {
    npcDef = {
      ...npcDef,
      pos: editorOverride.pos || npcDef.pos,
      face: (typeof editorOverride.face === 'number') ? editorOverride.face : npcDef.face,
      // Optional identity overrides — let chapter-mentor NPCs adopt a
      // named persona instead of the procedurally-generated identity.
      // Used to introduce Dr. Priya Engelhardt (ch10), Sam Okoye (ch14),
      // and Rena Vasquez (ch15) at their chapters' lesson-1 slot.
      name: editorOverride.name || npcDef.name,
      role: editorOverride.role || npcDef.role,
      portrait: editorOverride.portrait || npcDef.portrait,
    };
  }
  // Kedash Protocol ambient-line carriers (SYS-04): resolve the intro
  // from the act-gated six-line set at spawn time. Slot 0 is the loop
  // anchor (line 1); other slots cycle lines 2-6. Lines refresh on
  // floor reload only — never mid-session.
  if (typeof npcDef.ambientSlot === 'number' && window.STORY_AMBIENT) {
    npcDef = { ...npcDef, intro: ambientLineForSlot(npcDef.ambientSlot) };
  }
  // Blue-folder man's signature prop (TWIST1-02) — a small folder held
  // at hip height. Attached to the group root so it works for both
  // procedural and GLTF character bodies.
  if (npcDef.folderProp) {
    const folder = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.22, 0.035),
      new THREE.MeshStandardMaterial({ color: 0x1565c0, roughness: 0.6 })
    );
    folder.position.set(0.3, 0.95, 0.14);
    folder.rotation.z = -0.18;
    mesh.add(folder);
  }
  mesh.position.set(npcDef.pos[0], floorBaseY(npcFloor), npcDef.pos[1]);
  mesh.rotation.y = npcDef.face;
  // Editor-set per-NPC scale override (NPC_OVERRIDES[id].scale).
  if (editorOverride && Array.isArray(editorOverride.scale) && editorOverride.scale.length === 3) {
    mesh.scale.set(editorOverride.scale[0], editorOverride.scale[1], editorOverride.scale[2]);
  }
  mesh.userData.npc = npcDef;
  // Editor-affordance tags: the room editor's findTaggedAncestor uses
  // either _roomId (room placement) OR _isNpc (NPC) to map a click
  // back to its data. NPC pos is 2D ([x, z]) so we also tag the
  // floor-base Y the spawn was rendered at — the editor subtracts
  // this when writing pos back, just like the room loader's _yOffset.
  mesh.userData._isNpc = true;
  mesh.userData._npcId = npcDef.id;
  mesh.userData._yOffset = floorBaseY(npcFloor);
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

// Swap procedural stand-in NPCs to their GLTF rigs once the rig
// resolves. makeCharacter is synchronous, so any NPC built before its
// rig finished downloading (phase-2 background rigs, recovered
// timeouts, retried failures) gets the blocky procedural body — and
// without this pass it would stay blocky for the whole session.
// Respawns through the canonical spawnNPC path (name tag, overrides,
// props re-applied) and preserves the live transform so wanderers
// don't snap back to their roster spot. Triggered per-asset via
// assetLoader.onAssetResolved.
function upgradeProceduralNpcs() {
  if (!scene || !gltfAssetLoader) return;
  let swapped = 0;
  for (let i = npcMeshes.length - 1; i >= 0; i--) {
    const mesh = npcMeshes[i];
    const ud = mesh.userData || {};
    // Ambient liveAgents bodies aren't spawnNPC products (no _isNpc);
    // liveAgents.upgradeAmbients() below handles them.
    if (ud.gltfChar || !ud._isNpc || !ud.npc) continue;
    const assetId = resolveAssetForCharacter(ud.npc.id, gltfAssetLoader);
    if (!assetId || !gltfAssetLoader.getResolved(assetId)) continue;
    const pos = mesh.position.clone();
    const rotY = mesh.rotation.y;
    const visible = mesh.visible;
    scene.remove(mesh);
    npcMeshes.splice(i, 1);
    if (interactionTarget === mesh) interactionTarget = null;
    try {
      spawnNPC(ud.npc);
    } catch (err) {
      // Respawn failed — put the procedural body back rather than
      // losing the NPC entirely.
      console.warn(`[play] NPC upgrade respawn failed for ${ud.npc.id}:`, err);
      scene.add(mesh);
      npcMeshes.push(mesh);
      continue;
    }
    const fresh = npcMeshes[npcMeshes.length - 1];
    fresh.position.copy(pos);
    fresh.rotation.y = rotY;
    fresh.visible = visible;
    swapped += 1;
  }
  if (liveAgents) {
    swapped += liveAgents.upgradeAmbients();
    // Routine driver holds mesh refs by id — refresh them after any swap.
    if (swapped) liveAgents.reindex();
  }
  if (swapped) console.info(`[play] upgraded ${swapped} NPC(s) from procedural to GLTF`);
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
  const onThisFloor = (npcDef) => floorForNpcDef(npcDef) === f;
  for (const n of NPCS) {
    if (n.epilogueOnly && !Story.sceneSeen('finale')) continue;
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
// Read sessionStorage.ccq_play_pos.floor and, if set, teleport the
// player there. Lazy-builds floors 2-4 if needed (same path the
// elevator uses). Floor 1 is built at startup so this is a fast path.
async function _restoreSavedFloor() {
  let savedFloor = 1;
  try {
    const saved = JSON.parse(sessionStorage.getItem('ccq_play_pos') || 'null');
    if (saved && Number.isFinite(saved.floor)) savedFloor = saved.floor;
  } catch {}
  savedFloor = Math.max(1, Math.min(FLOOR_M_INDEX, savedFloor | 0));
  if (savedFloor === currentFloor) return;
  if (savedFloor > 1) await loadFloor(savedFloor);
  currentFloor = savedFloor;
  if (player) player.position.y = floorBaseY(currentFloor);
  applyFloorVisibility();
}

async function loadFloor(f) {
  if (loadedFloors.has(f)) return loadedFloors;
  const overlay = createLoadingOverlay();
  overlay.show(`Building floor ${f}...`);
  try {
    if (f === FLOOR_M_INDEX) {
      // FIN-02 — the mezzanine loft is a bespoke prebuilt module, not a
      // templated office floor. Its colliders live on floorMState and
      // get re-pushed by registerStaticColliders on every rebuild.
      const fm = buildFloorM({ baseY: floorBaseY(FLOOR_M_INDEX), floorIndex: FLOOR_M_INDEX });
      scene.add(fm.group);
      floorMState = fm;
      if (fm.update) decoTickers.push((dt) => fm.update(dt));
      // learnings.md fragment 2 — readable at the loft desk.
      const frag = buildReadableNote({ label: 'learnings.md', variant: 'paper' });
      frag.position.copy(fm.fragmentSpot);
      frag.userData.floor = FLOOR_M_INDEX;
      scene.add(frag);
      readableNotes.push({ group: frag, docId: 'learnings_fragment_2' });
      rebuildColliders();
    } else {
      buildFloorOffice(f);
    }
    spawnNPCsForFloor(f);
    // Collectible notes on this floor were just built by loadRoom —
    // the interactable wipe already happened (buildWorld), so they
    // can register immediately.
    registerReadableNotes();
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
    if (thinHoriz && tall) { cameraWalls.push(obj); return; }
    // Ceiling planes: wide, flat, and well above the floor. Included so
    // the camera's upward ceiling-probe (in update()) can keep the camera
    // from rising through a single-sided ceiling into the open sky. A
    // rotated PlaneGeometry reports its plane dims as sx/sy with sz≈0, so
    // check the two largest dims are wide and the smallest thin, then
    // confirm it sits above head height in world space.
    const dims = [sx, sy, sz].sort((a, b) => a - b);
    if (dims[2] >= 4 && dims[1] >= 4 && dims[0] <= 0.6) {
      obj.updateWorldMatrix(true, false);
      if (obj.getWorldPosition(_camCeilProbe).y >= 2.5) cameraWalls.push(obj);
    }
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
    // Scripted scene (SYS-03): E/Enter advances (skip-then-advance),
    // Esc aborts without marking the scene seen. This branch MUST come
    // before the generic dialogue-close branch below — a scene uses the
    // same dialogue element and would otherwise be closed by it.
    if (!e.repeat && isSceneActive()) {
      if (e.key === 'Escape') {
        abortScene();
      } else if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') {
        advanceScene();
      }
      return;
    }
    // Esc / E closes an open dialogue or inspect card (key repeat ignored
    // so holding E to open doesn't immediately close it again). When a
    // hero reply/thought is pending (HERO-01), E advances to it first;
    // Esc always closes outright.
    if (inputLocked && !e.repeat && dialogueEl?.classList.contains('visible') &&
        (e.key === 'Escape' || e.key === 'e' || e.key === 'E')) {
      if (e.key !== 'Escape' && dialogueHeroBeat && !dialogueHeroBeat.shown) {
        if (skipTypewriter()) return;   // reveal the NPC line first
        if (showHeroBeat()) return;
      }
      playUi('cancel');
      closeDialogue();
      return;
    }
    if (inputLocked) return;
    keys[e.key.toLowerCase()] = true;
    // Editor mode lets the user move + rotate camera (so `keys[...]`
    // are still recorded above), but actions that change game state
    // are suppressed at their fire sites.
    const editing = isRoomEditorActive();
    if (!editing && (e.key === 'e' || e.key === 'E')) tryInteract();
    if (!editing && (e.key === ' ' || e.code === 'Space')) {
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
    // Track position even when suppressed so deltas don't snap on resume.
    const dx = e.clientX - mouseLookLastX;
    const dy = e.clientY - mouseLookLastY;
    mouseLookLastX = e.clientX;
    mouseLookLastY = e.clientY;
    if (isRoomEditorDragging()) return;  // suppress while dragging an object
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
  window.addEventListener('blur', () => {
    mouseLook = false;
    cameraTouches.clear();
    isPinching = false;
  });

  // Touch swipe → look around (mobile analog of middle-mouse drag).
  // Listeners attached to the WebGL canvas only, so touches on the
  // joystick / action buttons / modals (separate DOM elements over
  // the canvas) don't trigger camera-look. Multi-touch supported:
  // each touch identifier tracked independently so the joystick
  // touch on the left half doesn't block a swipe on the right half.
  //
  // Two-finger pinch on the canvas → zoom (cameraDist). While
  // pinching, the per-touch yaw/pitch deltas are suppressed so the
  // camera doesn't spin from the fingers' arcing motion.
  const TOUCH_YAW_RATE   = 0.005;
  const TOUCH_PITCH_RATE = 0.005;
  let isPinching = false;
  let pinchInitialDist = 0;
  let pinchInitialCamDist = 0;
  const _twoTouchDistance = () => {
    if (cameraTouches.size < 2) return 0;
    const it = cameraTouches.values();
    const a = it.next().value, b = it.next().value;
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  cameraTouchStartListener = (e) => {
    if (inputLocked) return;
    for (const t of e.changedTouches) {
      cameraTouches.set(t.identifier, { x: t.clientX, y: t.clientY });
    }
    if (cameraTouches.size >= 2 && !isPinching) {
      isPinching = true;
      pinchInitialDist = _twoTouchDistance();
      pinchInitialCamDist = cameraDist;
    }
  };
  cameraTouchMoveListener = (e) => {
    if (inputLocked) return;
    // While the in-game editor is mid-drag, suppress camera-look /
    // pinch-zoom — the same finger that's dragging an object would
    // otherwise also spin the camera, making fine placement impossible.
    // We still update the stored positions so the camera doesn't snap
    // when the drag ends.
    const editorDragging = isRoomEditorDragging();
    for (const t of e.changedTouches) {
      const prev = cameraTouches.get(t.identifier);
      if (!prev) continue;
      // Refresh stored position regardless of mode so that when the
      // user lifts back to a single finger the swipe doesn't snap.
      if (!isPinching && !editorDragging) {
        const dx = t.clientX - prev.x;
        const dy = t.clientY - prev.y;
        cameraYaw   -= dx * TOUCH_YAW_RATE;
        cameraPitch += dy * TOUCH_PITCH_RATE;
        if (cameraPitch < PITCH_MIN) cameraPitch = PITCH_MIN;
        if (cameraPitch > PITCH_MAX) cameraPitch = PITCH_MAX;
      }
      cameraTouches.set(t.identifier, { x: t.clientX, y: t.clientY });
    }
    if (isPinching && !editorDragging && cameraTouches.size >= 2 && pinchInitialDist > 0) {
      const cur = _twoTouchDistance();
      if (cur > 0) {
        // Spread fingers → cur > initial → scale < 1 → zoom in (smaller dist).
        // Pinch fingers in → cur < initial → scale > 1 → zoom out.
        const scale = pinchInitialDist / cur;
        let next = pinchInitialCamDist * scale;
        if (next < CAM_DIST_MIN) next = CAM_DIST_MIN;
        if (next > CAM_DIST_MAX) next = CAM_DIST_MAX;
        cameraDist = next;
      }
    }
    e.preventDefault();    // prevent the browser's pull-to-refresh / swipe gestures
  };
  cameraTouchEndListener = (e) => {
    for (const t of e.changedTouches) cameraTouches.delete(t.identifier);
    if (cameraTouches.size < 2 && isPinching) {
      isPinching = false;
    }
  };
  renderer.domElement.addEventListener('touchstart', cameraTouchStartListener, { passive: true });
  renderer.domElement.addEventListener('touchmove', cameraTouchMoveListener, { passive: false });
  renderer.domElement.addEventListener('touchend', cameraTouchEndListener);
  renderer.domElement.addEventListener('touchcancel', cameraTouchEndListener);
  // Suppress the browser's native drag-image preview when the user
  // press-and-drags on the canvas. Without this Chrome/Firefox capture
  // the canvas pixels as a translucent ghost and follow the mouse —
  // looks like the "whole picture" is being dragged. Especially
  // visible while using the in-game editor's free-drag.
  renderer.domElement.addEventListener('dragstart', (e) => e.preventDefault());
  renderer.domElement.draggable = false;
  renderer.domElement.style.userSelect = 'none';
  renderer.domElement.style.webkitUserSelect = 'none';
  renderer.domElement.style.webkitUserDrag = 'none';

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
  // Editor mode allows movement + camera control but should never
  // open NPC dialogues or door / elevator UIs — they'd interrupt
  // the editing flow and leak state changes into the saved layout.
  if (isRoomEditorActive()) return;
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

// ─── "You're ahead of yourself" gating ───────────────────────────────────────
// When the player approaches an NPC/assessor whose lesson or test sits AFTER
// their current objective in the lesson order (and they haven't done it yet),
// the NPC defers and points them back to the right instructor first — keeping
// the curriculum order intact narratively, in sync with the objective compass.
function _stepIndexOf(kind, lessonId, testId) {
  const curriculum = window.CURRICULUM || [];
  let idx = 0;
  for (const ch of curriculum) {
    for (const l of (ch.lessons || [])) {
      if (kind === 'lesson' && lessonId === l.id) return idx;
      idx++;
    }
    if (ch.practicalTest) {
      if (kind === 'test' && testId === ch.practicalTest.id) return idx;
      idx++;
    }
  }
  return -1;
}

function _stepTitle(ref) {
  const ch = window.CURRICULUM?.find(c => c.id === ref.chapterId);
  if (!ch) return '';
  if (ref.kind === 'test') return ch.practicalTest?.title || `${ch.title} practical`;
  return (ch.lessons?.find(x => x.id === ref.lessonId)?.title) || '';
}

// Friendly name of whoever delivers the objective step. Prefers the spawned
// mesh (carries editor name overrides), falls back to the roster / generated
// def so it resolves even when that NPC's floor isn't loaded, finally the
// delivery-device label. Returns { name, isDevice } or null.
function _stepDeliverer(ref) {
  for (const m of npcMeshes) {
    const n = m.userData?.npc;
    if (!n) continue;
    if ((ref.kind === 'lesson' && n.lessonId === ref.lessonId)
     || (ref.kind === 'test'   && n.testId   === ref.testId)) {
      return { name: n.name.split(' ')[0], isDevice: false };
    }
  }
  const matchDef = (n) =>
    (ref.kind === 'lesson' && n.lessonId === ref.lessonId)
 || (ref.kind === 'test'   && n.testId   === ref.testId);
  for (const n of NPCS) {
    if (matchDef(n)) {
      const ov = window.NPC_OVERRIDES?.[n.id];
      return { name: (ov?.name || n.name).split(' ')[0], isDevice: false };
    }
  }
  const curriculum = window.CURRICULUM || [];
  for (let i = 0; i < curriculum.length; i++) {
    const ch = curriculum[i];
    if (!ch || ch.id !== ref.chapterId || HAND_BUILT_CHAPTER_IDS.has(ch.id)) continue;
    const n = generateChapterNPCs(i).find(matchDef);
    if (n) {
      const ov = window.NPC_OVERRIDES?.[n.id];
      return { name: (ov?.name || n.name).split(' ')[0], isDevice: false };
    }
  }
  if (ref.kind === 'lesson') {
    const cfg = LESSON_DELIVERY[ref.chapterId];
    if (cfg && cfg.delivery && cfg.delivery !== 'npc' && cfg.lessonId === ref.lessonId) {
      const labels = {
        computer: 'the lobby computer', book: 'the handbook',
        whiteboard: 'the whiteboard', server: 'the server rack',
        display: 'the demo screen', phone: 'the desk phone',
        modelConsole: 'the model console', dispatchBoard: 'the dispatch board',
        permissionsPanel: 'the permissions panel',
      };
      return { name: labels[cfg.delivery] || ('the ' + cfg.delivery), isDevice: true };
    }
  }
  return null;
}

// If `npc` is ahead of the current objective, returns redirect copy; else null.
function computeAheadGate(npc) {
  if (!npc || npc.kind === 'flavor') return null;
  const ref = getObjectiveRef();
  if (!ref) return null; // everything done
  const myIdx  = _stepIndexOf(npc.kind, npc.lessonId, npc.testId);
  const objIdx = _stepIndexOf(ref.kind, ref.lessonId, ref.testId);
  if (myIdx < 0 || objIdx < 0 || myIdx <= objIdx) return null; // objective or behind

  const who = _stepDeliverer(ref);
  const whoName = who?.name || 'the right instructor';
  const goVerb = who?.isDevice ? 'check out' : 'go talk to';
  const goVerbCap = goVerb[0].toUpperCase() + goVerb.slice(1);
  const prereqTitle = _stepTitle(ref);
  const thisTitle = (npc.kind === 'test')
    ? (_stepTitle({ chapterId: npc.chapterId, kind: 'test', testId: npc.testId }) || 'the practical')
    : (getLessonTitle(npc) || 'that');
  const askVerb = ref.kind === 'test' ? 'cleared' : 'up to speed on';
  const teach = npc.kind === 'test' ? 'run you through' : 'teach you';

  const variants = [
    `Whoa, slow down — are you ${askVerb} ${prereqTitle}? No?! I suggest you ${goVerb} ${whoName} first. I'll ${teach} ${thisTitle} later.`,
    `Hold on a sec — have you got ${prereqTitle} down yet? Not quite, right? ${goVerbCap} ${whoName} first, then come back and I'll ${teach} ${thisTitle}.`,
    `Eager — I like that! But ${thisTitle} builds on ${prereqTitle}. Catch up with ${whoName} first, then I'll ${teach} ${thisTitle}.`,
  ];
  let h = 0;
  const s = npc.id || '';
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return { text: variants[Math.abs(h) % variants.length], whoName };
}

// ─── Story dialogue overrides (Kedash Protocol, SYS-02) ──────────────────────
// data/story_lines.js declares tier-keyed override maps per NPC id. For each
// map, the highest tier key (T0, T1, …) <= the current story tier wins.
// Gate text (computeAheadGate) always beats story overrides — curriculum
// ordering stays authoritative.
function resolveByTier(map, tier) {
  if (!map) return null;
  let bestN = -1, bestVal = null;
  for (const key of Object.keys(map)) {
    const n = parseInt(String(key).slice(1), 10);
    if (Number.isFinite(n) && n <= tier && n > bestN) { bestN = n; bestVal = map[key]; }
  }
  return bestN >= 0 ? { key: `T${bestN}`, value: bestVal } : null;
}

function storyLinesFor(npcId) {
  return (window.STORY_LINES && window.STORY_LINES[npcId]) || null;
}

// ─── Story ambient lines (SYS-04 / COPY-05) ──────────────────────────────────
// Resolve one line from the act-gated six-line set (data/story_ambient.js)
// for an ambient-carrier slot. Slot 0 ALWAYS gets line 1 — the loop
// anchor Ines predicts in TWIST 1; other slots cycle lines 2-6.
function ambientLineForSlot(slot) {
  const SA = window.STORY_AMBIENT;
  if (!SA?.setForTier) return 'Busy week.';
  const set = SA.setForTier(Story.getTier());
  if (slot === 0) return set[0];
  return set[1 + ((slot - 1) % (set.length - 1))];
}

// ─── Story scenes (SYS-03 / TWIST1-01) ───────────────────────────────────────
// State-based trigger check: returns a scene id when talking to this NPC
// should play a scripted scene INSTEAD of the regular dialogue. Aborting
// the scene leaves the trigger true, so it re-offers on the next talk.
function pendingSceneFor(npc) {
  if (!npc || !window.STORY_SCENES) return null;
  if (npc.id === 'ines' && !Story.sceneSeen('twist1')) {
    const progress = getProgress();
    if (window.Progress?.isTestPassed?.(progress, 'ch04-test')) return 'twist1';
    // Pre-twist1 micro-cutscene — plays once on the first early-tier talk
    // (i.e. ch04-test still ahead). After it, regular T0-T2 intros run.
    if (!Story.sceneSeen('inesAnticipates')) return 'inesAnticipates';
  }
  // TWIST 2 plays at Engelhardt (the ch10 lesson mentor, not the
  // assessor) once the model-spend audit is passed.
  if (npc.id === 'auto-ch10-l01' && !Story.sceneSeen('twist2')) {
    const progress = getProgress();
    if (window.Progress?.isTestPassed?.(progress, 'ch10-test')) return 'twist2';
  }
  // FINALE chain (§5): Marcus at the elevator once the capstone is
  // passed → lights the M button; Maya on floor M; the new arrival in
  // the post-finale lobby closes the loop.
  if (npc.id === 'marcus' && !Story.sceneSeen('marcusDoor')) {
    const progress = getProgress();
    if (window.Progress?.isTestPassed?.(progress, 'ch16-test')) return 'marcusDoor';
  }
  if (npc.id === 'maya' && !Story.sceneSeen('mayaScene') && !Story.sceneSeen('finale')) {
    return 'mayaScene';
  }
  if (npc.id === 'newhire' && Story.sceneSeen('finale') && !Story.sceneSeen('epilogueArrival')) {
    return 'epilogueArrival';
  }
  return null;
}

function startStoryScene(sceneId, npc) {
  const def = window.STORY_SCENES?.[sceneId];
  if (!def) return false;
  return runScene(def, {
    pitch: blipPitchForNpc(npc?.id || sceneId),
    onComplete: () => {
      // sceneSeen flips the derived tier (twist1 → T3) — ambient lines
      // pick the new act set on the next floor reload (SYS-04 rule).
      Story.markSceneSeen(sceneId);
      // FIN-05 → FIN-06: Maya's "let's go downstairs" rides the player
      // to floor 1 and chains straight into the finale ceremony.
      if (sceneId === 'mayaScene') _startFinaleChain();
      // FIN-08: the closing exchange ends in the title card.
      if (sceneId === 'epilogueArrival') _playEpilogueTitleCard();
    },
  });
}

// ─── Finale chain (FIN-05 → FIN-08) ──────────────────────────────────────────
function _findNpcMesh(id) {
  return npcMeshes.find(m => m.userData?.npc?.id === id);
}

// STORY_FINALE npc keys → spawned NPC ids. Elena's real spot is the
// library (too far for the lobby crowd shot) and Rena/Maya live on
// other floors, so temp 'fin-' stand-ins join the ceremony and the
// alias prefers them; the real meshes are fallbacks.
const FINALE_BUBBLE_ALIAS = {
  elena: ['fin-elena', 'elena'],
  rena:  ['fin-rena', 'auto-ch15-l01'],
  maya:  ['fin-maya', 'maya'],
};
function showBubbleFor(npcId, text) {
  const candidates = FINALE_BUBBLE_ALIAS[npcId] || [npcId];
  for (const id of candidates) {
    const m = _findNpcMesh(id);
    if (m && m.visible) { showSpeechBubble(m, text, { holdMs: 3400 }); return; }
  }
}

function _spawnFinaleCast() {
  if (_findNpcMesh('fin-maya')) return;
  const temps = [
    { id: 'fin-elena', floor: 1, pos: [-3.4, -4.6], face: 1.0, kind: 'flavor',
      name: 'Dr. Elena Vasquez', role: 'Chief Strategist', portrait: '👩‍🏫',
      look: { skin: 0xfdd9b5, hair: 0xc0c0c0, hairStyle: 'long', shirt: 0xdba9e0, pants: 0x1a237e, glasses: true, prop: 'book', face: 'sharp', expression: 'smug', accent: 0x6a1b9a },
      intro: 'Came down for this. Obviously.', nextHint: '' },
    { id: 'fin-rena', floor: 1, pos: [-1.6, -2.4], face: 1.5, kind: 'flavor',
      name: 'Rena Vasquez', role: 'Platform Engineer, InfoSec', portrait: '👩‍🔧',
      look: { skin: 0xf1c27d, hair: 0x1a1a1a, hairStyle: 'ponytail', shirt: 0x455a64, pants: 0x263238, glasses: true, prop: 'tablet', face: 'sharp', expression: 'focused', accent: 0x00897b },
      intro: 'I left the dashboards unattended for this. Enjoy it.', nextHint: '' },
    { id: 'fin-maya', floor: 1, pos: [6.6, -7.2], face: Math.PI / 2, kind: 'flavor',
      name: 'Maya Kedash', role: 'CEO', portrait: '👩‍💼',
      look: { skin: 0xfdd9b5, hair: 0x3a2a1a, hairStyle: 'bun', shirt: 0x8d6e63, pants: 0x263238, glasses: false, prop: 'mug', face: 'sharp', expression: 'kind', accent: 0xc9a44c },
      intro: 'Told you I was right behind you.', nextHint: '' },
  ];
  for (const t of temps) spawnNPC(t);
}

function _removeFinaleCast() {
  for (const id of ['fin-elena', 'fin-rena', 'fin-maya']) {
    const m = _findNpcMesh(id);
    if (!m) continue;
    scene.remove(m);
    const idx = npcMeshes.indexOf(m);
    if (idx >= 0) npcMeshes.splice(idx, 1);
  }
}

// Maya's scene ends on Floor M; ride the player down under the fade and
// chain straight into the scripted ceremony (FIN-06) in the lobby.
// requestFloorChange resolves before its inner ride timeout (1600ms for
// M-rides) flips the floor, so the ceremony is staged on a padded delay.
async function _startFinaleChain() {
  await requestFloorChange(1);
  setTimeout(() => {
    _spawnFinaleCast();
    if (!ceremony) return;
    ceremony.startFinale({
      showBubbleFor,
      setPortraitCelebration,
      script: window.STORY_FINALE,
      onDone: () => {
        Story.markSceneSeen('finale');   // → tier T7
        applyEpilogueState();
      },
    });
    try { audio.startMusic('celebration', 'play/assets/audio/music/celebration.mp3', 600); } catch {}
  }, 2800);
}

// FIN-07 — the permanent post-finale world. Idempotent; also called at
// startup (buildNPCs path handles maya/newhire via floorForNpcDef +
// epilogueOnly, so this only does the live in-place transition).
let epilogueChairAdded = false;
function applyEpilogueState() {
  _removeFinaleCast();
  // Maya resolves to floor 1 now (finale seen) — respawn near reception.
  const oldMaya = _findNpcMesh('maya');
  if (oldMaya) {
    scene.remove(oldMaya);
    const idx = npcMeshes.indexOf(oldMaya);
    if (idx >= 0) npcMeshes.splice(idx, 1);
  }
  const mayaDef = NPCS.find(n => n.id === 'maya');
  if (mayaDef) spawnNPC(mayaDef);
  if (!_findNpcMesh('newhire')) {
    const nhDef = NPCS.find(n => n.id === 'newhire');
    if (nhDef) spawnNPC(nhDef);
  }
  // Second child chair beside Ines's — Maya's, now that the big meeting
  // is done. Cosmetic only (no collider; matches the spinny chair scale).
  if (!epilogueChairAdded) {
    epilogueChairAdded = true;
    const chair = buildChair(3.1, -4.6, -0.6, 0x8d6e63);
    chair.scale.setScalar(0.85);
    chair.position.y = floorBaseY(1);
    chair.userData.floor = 1;
    scene.add(chair);
  }
}

// FIN-08 — closing exchange ends in a fade to the title card.
function _playEpilogueTitleCard() {
  const fade = document.getElementById('play-fade');
  inputLocked = true;
  if (fade) fade.classList.add('opaque');
  setTimeout(() => {
    showTitleCard({
      text: 'THE KEDASH PROTOCOL',
      onDone: () => {
        if (fade) fade.classList.remove('opaque');
        inputLocked = false;
      },
    });
  }, 650);
}

// Cancel a running typewriter (revealing its full text). Returns true
// if one was running — the scene runner uses this for skip-then-advance.
function skipTypewriter() {
  if (currentTypewriter) {
    currentTypewriter.cancel();
    currentTypewriter = null;
    return true;
  }
  return false;
}

function openDialogue(npc) {
  // Scripted scene takes over the talk action when its trigger is armed
  // (e.g. TWIST 1: ch04-test passed, scene not yet seen).
  const sceneId = pendingSceneFor(npc);
  if (sceneId && startStoryScene(sceneId, npc)) return;
  inputLocked = true;
  // PROP-11: any floor-3 conversation visibly spikes the token counter.
  if (currentFloor === 3) resetTokenCounter();
  const d = dialogueEl;
  const isFlavor = npc.kind === 'flavor';
  const done = isFlavor ? false : (npc.kind === 'lesson' ? isLessonDone(npc.lessonId) : isTestDone(npc.testId));
  // Soft-gate: this NPC teaches a lesson the player isn't ready for yet.
  const gate = done ? null : computeAheadGate(npc);
  const story = storyLinesFor(npc.id);
  const tier = Story.getTier();
  let introText = gate ? gate.text : npc.intro;
  let speaker = npc;   // postPass relays may borrow this NPC's card
  let postPassActive = false;
  // AUDIO-01: story lines may be { text, sting: true } — the sting flags
  // the line for a one-shot anomaly swell when it renders.
  let stingArmed = false;
  // HERO-01: story lines may also carry heroReply (spoken) / heroThought
  // (internal, italic) — the player character's beat, shown when the
  // player advances (E / button) instead of closing the card outright.
  let heroBeat = null;   // { text, thought }
  const normLine = (v) => {
    if (v && typeof v === 'object') {
      if (v.sting) stingArmed = true;
      if (v.heroReply) heroBeat = { text: v.heroReply, thought: false };
      else if (v.heroThought) heroBeat = { text: v.heroThought, thought: true };
      return v.text;
    }
    return v;
  };
  if (!gate) {
    const introOv = resolveByTier(story?.introByTier, tier);
    if (introOv) introText = normLine(introOv.value);
    const append = resolveByTier(story?.introAppendByTier, tier);
    if (append) {
      const appendText = normLine(append.value);
      introText = introText ? `${introText} ${appendText}` : appendText;
    }
    // One-shot post-pass beat: shown the first time the player talks to a
    // test NPC after newly passing its test (shown-state lives in ccq_story).
    if (done && npc.kind === 'test') {
      const pp = resolveByTier(story?.postPassOnceByTier, tier);
      if (pp) {
        const flagKey = `postpass:${npc.id}:${pp.key}`;
        if (!Story.getFlag(flagKey)) {
          Story.setFlag(flagKey);
          postPassActive = true;
          const v = pp.value;
          if (typeof v === 'string') {
            introText = v;
          } else {
            introText = normLine(v);   // captures sting + hero beat too
            speaker = {
              ...npc,
              name: v.speakerName || npc.name,
              role: v.speakerRole || npc.role,
              portrait: v.speakerPortrait || npc.portrait,
            };
          }
        }
      }
    }
    // Post-completion: when this lesson/test is already done, the stock
    // intro is the LESSON RE-PITCH (re-teaching content the player
    // already finished). Swap it for a shorter acknowledgment so revisits
    // feel like catching up, not redoing. Copy authors may override per
    // tier via doneIntroByTier; otherwise we fall back to a one-liner
    // derived from the NPC's first name + their stock nextHint, which
    // already varies per character.
    if (done && !postPassActive) {
      const doneOv = resolveByTier(story?.doneIntroByTier, tier);
      if (doneOv) {
        introText = normLine(doneOv.value);
      } else if (introText === npc.intro) {
        const first = (npc.name || '').split(' ')[0] || 'Hey';
        introText = `"Good to see you again, friend. You've already got the ${npc.kind === 'test' ? 'assessment' : 'lesson'} behind you — what's next?" — ${first}`;
      }
    }
    // HERO-01 fallback: entry-level tier-keyed hero fields answer whatever
    // intro rendered at this tier; line-attached beats (normLine) win.
    if (!heroBeat && !postPassActive) {
      const hr = resolveByTier(story?.heroReplyByTier, tier);
      const ht = resolveByTier(story?.heroThoughtByTier, tier);
      if (hr) heroBeat = { text: hr.value, thought: false };
      else if (ht) heroBeat = { text: ht.value, thought: true };
    }
  }

  // Determine status & next-step pointer
  let statusLine = '';
  if (done && !postPassActive) {
    statusLine = `<div class="dlg-status dlg-done">✓ You've already completed this with ${npc.name.split(' ')[0]}.</div>`;
  } else if (gate) {
    statusLine = `<div class="dlg-status dlg-gate">↪ One step at a time — let's keep the lessons in order.</div>`;
  }
  let nextHint = '';
  if (gate) {
    nextHint = `<div class="dlg-next">Follow the gold marker — it'll lead you to ${gate.whoName}.</div>`;
  } else if (done && !postPassActive) {
    const hintOv = resolveByTier(story?.nextHintByTier, tier);
    nextHint = `<div class="dlg-next">${hintOv ? hintOv.value : npc.nextHint}</div>`;
  }

  const actionsHtml = isFlavor
    ? `<div class="dlg-actions"><button class="btn-primary dlg-cancel">Bye!</button></div>`
    : gate
    ? `<div class="dlg-actions"><button class="btn-primary dlg-cancel">Got it →</button></div>`
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
        <div class="dlg-portrait">${speaker.portrait}</div>
        <div class="dlg-who">
          <div class="dlg-name">${speaker.name}</div>
          <div class="dlg-role">${speaker.role}</div>
        </div>
      </div>
      ${statusLine}
      <div class="dlg-body" data-typewriter></div>
      ${nextHint}
      ${actionsHtml}
    </div>
  `;
  d.classList.add('visible');
  // PORT-01: rendered face portrait replaces the emoji when the speaking
  // character's mesh is available; the emoji stays as fallback. PostPass
  // relays (borrowed speaker) try a name match before falling back.
  const speakingMesh = npcMeshes.find(m => m.userData?.npc?.id === npc.id);
  const portraitMesh = (speaker === npc)
    ? speakingMesh
    : npcMeshes.find(m => m.userData?.npc?.name === speaker.name) || null;
  applyPortraitImage(
    d.querySelector('.dlg-portrait'), portraitMesh,
    speaker === npc ? npc.id : `name:${speaker.name}`,
  );
  // HERO-01: arm the hero beat — E / advance shows it before the card closes.
  dialogueHeroBeat = heroBeat ? { ...heroBeat, shown: false } : null;
  // Open chime
  playUi('confirm');
  // Typewriter the intro line — plays a blip per character (rate-limited).
  _currentVoiceProfile = voiceProfileFor(speaker || npc);
  startTypewriter(d.querySelector('[data-typewriter]'), introText, blipPitchForNpc(npc.id));
  if (stingArmed) playAnomalySting();
  // Pulse the speaking NPC's mouth while the intro reveals.
  if (speakingMesh?.userData?.face && speakingMesh.userData.faceKind === 'flat') {
    const charCount = introText?.length || 60;
    const talkMs = Math.min(8000, charCount * 22);
    talkPulse(speakingMesh.userData.face, true, talkMs);
  }

  // The neutral dismiss button ("Maybe later" / "Bye!") advances through a
  // pending hero beat first; the × corner button (like Esc) always closes.
  d.querySelector('.dlg-cancel').onclick = () => {
    if (showHeroBeat()) return;
    playUi('cancel'); closeDialogue();
  };
  d.querySelector('.dlg-close').onclick  = () => { playUi('cancel'); closeDialogue(); };
  const goBtn = d.querySelector('.dlg-go');
  if (goBtn) {
    goBtn.onclick = () => {
      playUi('confirm');
      if (player) {
        sessionStorage.setItem('ccq_play_pos', JSON.stringify({
          x: player.position.x, z: player.position.z, floor: currentFloor,
        }));
      }
      // Dismiss the NPC dialogue card first so it doesn't linger behind
      // the overlay (mirrors the dlg-close / dlg-cancel teardown).
      closeDialogue();
      if (npc.kind === 'test') {
        window.LessonOverlay?.open
          ? window.LessonOverlay.open({ chapterId: npc.chapterId, kind: 'test', isTest: true })
          : window.App.navigate('test', { chapterId: npc.chapterId, fromPlay: true });
      } else {
        window.LessonOverlay?.open
          ? window.LessonOverlay.open({ chapterId: npc.chapterId, lessonId: npc.lessonId, kind: 'npc' })
          : window.App.navigate('lesson', { chapterId: npc.chapterId, lessonId: npc.lessonId, fromPlay: true });
      }
    };
  }
}

function getLessonTitle(npc) {
  const ch = window.CURRICULUM?.find(c => c.id === npc.chapterId);
  const l = ch?.lessons.find(x => x.id === npc.lessonId);
  return l?.title || '';
}

// PORT-01 — swap a dlg-portrait's emoji for the rendered face. No-op (emoji
// fallback stays) when the mesh is missing or the studio render fails.
// If the portrait is deferred because a texture (e.g. Maya's overlay JPG)
// hasn't decoded yet, the onReady callback swaps the still-open card the
// moment it arrives.
function applyPortraitImage(el, mesh, cacheKey) {
  if (!el || !mesh) return;
  const swap = (url) => {
    if (!url) return;
    el.classList.add('has-img');
    el.innerHTML = `<img class="dlg-portrait-img" src="${url}" alt="">`;
  };
  const url = getPortrait(mesh, cacheKey, (lateUrl) => {
    if (dialogueEl?.classList.contains('visible')) swap(lateUrl);
  });
  swap(url);
}

// HERO-01 — the player character's beat in a conversation. Armed by
// openDialogue; pressing E (or the dismiss button) swaps the open card to
// the hero as speaker — rendered portrait, name "You", reply via the same
// typewriter. Thoughts render italic + dimmer (CSS .dlg-thought). Returns
// false when nothing is pending so callers fall through to closing.
let dialogueHeroBeat = null;   // { text, thought, shown }
function showHeroBeat() {
  const beat = dialogueHeroBeat;
  if (!beat || beat.shown || !dialogueEl?.classList.contains('visible')) return false;
  const card = dialogueEl.querySelector('.dlg-card');
  const body = card?.querySelector('.dlg-body');
  if (!card || !body) return false;
  beat.shown = true;
  skipTypewriter();
  // Header → the hero.
  const nameEl = card.querySelector('.dlg-name');
  const roleEl = card.querySelector('.dlg-role');
  const portEl = card.querySelector('.dlg-portrait');
  if (nameEl) nameEl.textContent = 'You';
  if (roleEl) roleEl.textContent = beat.thought ? 'thinking' : 'New hire';
  if (portEl) {
    portEl.classList.remove('has-img');
    portEl.textContent = '🧑‍💻';
    if (player) applyPortraitImage(portEl, player, 'hero');
  }
  // NPC furniture (done-status, next-step pointer) isn't the hero's.
  card.querySelector('.dlg-status')?.remove();
  card.querySelector('.dlg-next')?.remove();
  body.classList.toggle('dlg-thought', !!beat.thought);
  playUi('click');
  _currentVoiceProfile = { gender: 'male', id: 'player' };
  startTypewriter(body, beat.text, blipPitchForNpc('player'));
  return true;
}

function closeDialogue() {
  if (currentTypewriter) { currentTypewriter.cancel(); currentTypewriter = null; }
  dialogueHeroBeat = null;
  dialogueEl.classList.remove('visible');
  dialogueEl.innerHTML = '';
  inputLocked = false;
}

// Re-checkable promotion-ceremony trigger. Called once on play start(), and
// again by the in-world overlay's close() — because a test taken in the
// overlay leaves the play scene alive, so start() never re-runs. Flag-gated
// on sessionStorage 'ccq_promotion_for' (set by a passing test), so it's a
// safe no-op when nothing is pending. Falls through to a plain dance if only
// the older 'ccq_dance_for' flag is set.
function maybeRunPromotionCeremony() {
  try {
    const promotionFor = sessionStorage.getItem('ccq_promotion_for');
    // R-6: the ch16 capstone does NOT get the generic auto-ceremony —
    // FIN-06 (the scripted finale after Maya's scene) IS the VP-of-AI
    // moment. Consume the flag silently so it can't fire later either.
    if (promotionFor === 'ch16' && !Story.sceneSeen('finale')) {
      sessionStorage.removeItem('ccq_promotion_for');
    } else if (promotionFor) {
      // Pause briefly so the scene is on screen before the spotlight.
      setTimeout(() => ceremony.maybeStartFromFlag(), 400);
      // AUDIO-04 / A24: if the portrait is in view, her eyes glint once.
      setTimeout(() => { try { flashPortraitEyeGlint(); } catch {} }, 700);
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
}

let currentTypewriter = null;
// onDone fires when the text is fully visible — after the natural last
// character AND on cancel (cancel reveals everything). Callers must keep
// it DOM-safe: the card may already be tearing down when it fires.
// One-shot voice profile (gender / accent / id) for the NEXT
// startTypewriter call — set by the dialogue/scene callers that know who
// is speaking, consumed + cleared here. Lets the TTS pick a voice that
// matches the character's actual gender and ethnicity instead of always
// defaulting to a female en-US voice (every un-pitched NPC used to).
let _currentVoiceProfile = null;

// Derive { gender, lang, id } for a speaker (NPC object or id string) from
// its rig — the rig name reliably encodes gender (…_male / …_female /
// hijab) and ethnicity (western/african/easian/sasian/arab); bespoke rigs
// (hero/ines/maya) and named mentors are handled explicitly.
function voiceProfileFor(npc) {
  const id = (typeof npc === 'string') ? npc : (npc?.id || '');
  let rig = (typeof npc === 'object' && npc?.look?._gltfAsset) || '';
  if (!rig) { try { rig = resolveAssetForCharacter(id, gltfAssetLoader) || ''; } catch {} }
  const r = rig.toLowerCase();
  const s = (rig + ' ' + id).toLowerCase();
  let gender = null;
  if (/female|hijab/.test(r)) gender = 'female';
  else if (/male/.test(r)) gender = 'male';   // _male, executive_male_01
  if (!gender) {
    if (/\b(hero|player|marcus|kenji|folderman|partner|okoye|\bsam\b)\b/.test(s)) gender = 'male';
    else if (/\b(ines|maya|linda|elena|diana|aisha|sarah|noor|priya|engelhardt|rena|vasquez|mei|tania|rita)\b/.test(s)) gender = 'female';
  }
  let lang = null;
  if (/sasian/.test(r)) lang = 'en-IN';
  else if (/african/.test(r)) lang = 'en-NG';
  else if (/easian/.test(r)) lang = 'en-HK';
  else if (/arab|hijab/.test(r)) lang = 'en-GB';
  // Ines is a 9-year-old — she gets a child voice (cloud child-neural, or a
  // raised-pitch on-device fallback) instead of an adult woman's.
  const child = /\bines\b/.test(s);
  return { gender, lang, id, child };
}

function startTypewriter(el, text, pitch = 1.0, onDone = null) {
  if (!el) return;
  // Speak the FULL line aloud (not per-char fragments) via Web Speech API.
  // Guarded so any SpeechSynthesis failure never breaks the dialogue.
  const vp = _currentVoiceProfile || {};
  _currentVoiceProfile = null;   // one-shot
  try { speakLine(text, { pitch, gender: vp.gender, lang: vp.lang, id: vp.id, child: vp.child }); } catch {}
  el.textContent = '';
  let i = 0;
  let blipCounter = 0;
  let cancelled = false;
  const charDelay = 22; // ms per character

  function tick() {
    if (cancelled) return;
    if (i >= text.length) {
      currentTypewriter = null;
      if (onDone) { try { onDone(); } catch {} }
      return;
    }
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
      if (onDone) { try { onDone(); } catch {} }
    },
  };
  tick();
}

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Story inspect card (PROP-04 / PROP-06) ──────────────────────────────────
// Read-only reuse of the dialogue card for inspectable props. Text comes from
// data/story_docs.js, resolved by the current story tier. Shares closeDialogue
// for input unlock so it can never desync the NPC dialogue state.
function openInspectCard(docId) {
  const doc = window.STORY_DOCS?.[docId];
  const resolved = resolveByTier(doc?.byTier, Story.getTier());
  if (!resolved) return;
  inputLocked = true;
  // HERO-01 (docs): tier-keyed heroThoughtByTier on the doc renders as an
  // italic trailing line that fades in once the doc text finishes typing.
  const thought = resolveByTier(doc?.heroThoughtByTier, Story.getTier());
  const d = dialogueEl;
  d.innerHTML = `
    <div class="dlg-card">
      <button class="dlg-close" aria-label="Close">×</button>
      <div class="dlg-header">
        <div class="dlg-portrait">🔍</div>
        <div class="dlg-who">
          <div class="dlg-name">${escapeHtml(doc.title || 'Inspect')}</div>
          <div class="dlg-role">You take a closer look.</div>
        </div>
      </div>
      <div class="dlg-body" data-typewriter></div>
      ${thought ? '<div class="dlg-doc-thought"></div>' : ''}
      <div class="dlg-actions"><button class="btn-primary dlg-cancel">Close</button></div>
    </div>
  `;
  d.classList.add('visible');
  playUi('confirm');
  startTypewriter(d.querySelector('[data-typewriter]'), resolved.value, 1.15, () => {
    const t = d.querySelector('.dlg-doc-thought');
    if (!t || !thought) return;
    t.textContent = thought.value;
    requestAnimationFrame(() => t.classList.add('visible'));
  });
  d.querySelector('.dlg-cancel').onclick = () => { playUi('cancel'); closeDialogue(); };
  d.querySelector('.dlg-close').onclick  = () => { playUi('cancel'); closeDialogue(); };
}

// ─── Pilot interaction: badge printer (ch01 KDQ nonce in-world) ──────────────
// Mints the player's ch01-test KDQ-XXXX compliance code (same call the
// test view uses — Progress.ensureTestNonce) and prints it as an animated
// paper slip. First press shows PRINTING… for 1.2s then the slip drops;
// re-presses go to the "already printed" variant + re-show the slip.
// On success: persists the nonce via Progress.save, sets the
// `lobby_badge_printed` story flag so the test view can mention the
// lobby printer, and refreshes the persistent KDQ HUD pill.
function openBadgePrinter() {
  let progress = window.App?.progress;
  if (!progress && window.Progress?.load) {
    progress = window.Progress.load();
    if (window.App) window.App.progress = progress;
  }
  if (!progress) return;
  // Idempotent — same code as the test view sees.
  const minted = window.Progress.ensureTestNonce(progress, 'ch01-test');
  if (minted.progress !== progress) {
    progress = minted.progress;
    window.Progress.save(progress);
    window.App.progress = progress;
  }
  const nonce = minted.nonce;
  const reprint = !!Story.getFlag?.('lobby_badge_printed');

  inputLocked = true;
  const d = dialogueEl;
  const doc = window.STORY_DOCS?.badge_printer || {};
  const heroByTier = doc.heroThoughtByTier || {};
  const thought = (heroByTier.T0 || '');
  const headerLine = reprint
    ? 'You already filed this. The printer remembers.'
    : 'The machine wakes up. A slip starts feeding.';

  d.innerHTML = `
    <div class="dlg-card badge-printer-card">
      <button class="dlg-close" aria-label="Close">×</button>
      <div class="dlg-header">
        <div class="dlg-portrait">🖨️</div>
        <div class="dlg-who">
          <div class="dlg-name">Badge Printer</div>
          <div class="dlg-role">${escapeHtml(headerLine)}</div>
        </div>
      </div>
      <div class="badge-printer-stage">
        <div class="badge-printer-machine">
          <div class="badge-printer-slot"></div>
          <div class="badge-printer-progress"><span></span></div>
          <div class="badge-printer-status" data-printer-status>${reprint ? 'REPRINT…' : 'PRINTING…'}</div>
        </div>
        <div class="badge-printer-slip" data-printer-slip aria-hidden="true">
          <div class="slip-eyebrow">KEDASH INFOSEC</div>
          <div class="slip-label">Compliance verification code</div>
          <div class="slip-code">${escapeHtml(nonce)}</div>
          <div class="slip-meta">Issued · ch01 practical · keep with you</div>
        </div>
      </div>
      ${thought ? `<div class="dlg-doc-thought" data-printer-thought></div>` : ''}
      <div class="dlg-actions">
        <button class="btn-primary dlg-cancel" data-printer-dismiss disabled>Take the slip</button>
      </div>
    </div>
  `;
  d.classList.add('visible');
  playUi('confirm');

  const slipEl    = d.querySelector('[data-printer-slip]');
  const statusEl  = d.querySelector('[data-printer-status]');
  const dismissEl = d.querySelector('[data-printer-dismiss]');
  const thoughtEl = d.querySelector('[data-printer-thought]');

  const printDur = reprint ? 700 : 1200;
  setTimeout(() => {
    if (!d.classList.contains('visible')) return;
    if (statusEl) statusEl.textContent = reprint ? 'REISSUED' : 'PRINTED';
    if (slipEl) {
      slipEl.classList.add('visible');
      slipEl.setAttribute('aria-hidden', 'false');
    }
    if (dismissEl) {
      dismissEl.disabled = false;
      dismissEl.textContent = reprint
        ? 'Filed already (close)'
        : 'Slip filed (compliance verification code stored)';
    }
    if (!reprint) {
      try { Story.setFlag?.('lobby_badge_printed'); } catch {}
    }
    try { updateBadgeHud(); } catch {}
    if (thoughtEl && thought) {
      thoughtEl.textContent = thought;
      requestAnimationFrame(() => thoughtEl.classList.add('visible'));
    }
  }, printDur);

  d.querySelector('.dlg-cancel').onclick = () => { playUi('cancel'); closeDialogue(); };
  d.querySelector('.dlg-close').onclick  = () => { playUi('cancel'); closeDialogue(); };
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

// ─── Objective guidance: compass arrow + ground beacon ───────────────────────
// A persistent HUD arrow that always points (compass-style) toward the NPC or
// device that delivers the *next* lesson to do — or the chapter test once all
// its lessons are done — plus a vibrant pulsing ring/beam on the ground under
// that target. Both update live as lessons are completed and as NPCs wander.
let _objRing = null;                 // THREE.Group (ring + disc + beam)
const _OBJ_COLOR = 0xffd24a;

function _ensureObjectiveRing() {
  if (_objRing || !scene) return;
  const grp = new THREE.Group();
  const mat = (opacity) => new THREE.MeshBasicMaterial({
    color: _OBJ_COLOR, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.46, 0.64, 48), mat(0.9));
  ring.rotation.x = -Math.PI / 2;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.46, 48), mat(0.18));
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.002;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.0, 10, 1, true), mat(0.12));
  beam.position.y = 1.5;
  grp.add(ring); grp.add(disc); grp.add(beam);
  grp.userData = { _ring: ring, _disc: disc, _beam: beam };
  grp.renderOrder = 999;
  grp.visible = false;
  scene.add(grp);
  _objRing = grp;
}

// The earliest incomplete lesson across all chapters in order, or the chapter
// test if a chapter's lessons are all done but its test isn't passed yet.
function getObjectiveRef() {
  const curriculum = window.CURRICULUM || [];
  if (!getProgress()) return null;
  for (const ch of curriculum) {
    if (!ch) continue;
    for (const l of (ch.lessons || [])) {
      if (!isLessonDone(l.id)) return { chapterId: ch.id, lessonId: l.id, kind: 'lesson' };
    }
    if (ch.practicalTest && !window.Progress.isChapterTestPassed(getProgress(), ch)) {
      // Either track will clear this objective; the test panel offers both.
      return { chapterId: ch.id, testId: ch.practicalTest.id, kind: 'test' };
    }
  }
  return null; // all done
}

// Resolve the ref to a live scene position. found=false means the entity isn't
// spawned yet (its floor hasn't been loaded) — caller routes to the elevator.
function resolveObjectiveTarget(ref) {
  if (!ref) return null;
  const floor = floorForChapterId(ref.chapterId) || 1;
  for (const m of npcMeshes) {
    const npc = m.userData?.npc;
    if (!npc) continue;
    const hit = (ref.kind === 'lesson' && npc.lessonId === ref.lessonId)
             || (ref.kind === 'test'   && npc.testId   === ref.testId);
    if (hit) {
      return { x: m.position.x, z: m.position.z, floor: m.userData.floor || floor, found: true };
    }
  }
  if (ref.kind === 'lesson') {
    const cfg = LESSON_DELIVERY[ref.chapterId];
    if (cfg && cfg.delivery && cfg.delivery !== 'npc' && cfg.lessonId === ref.lessonId) {
      for (const obj of (interactObjects || [])) {
        if (obj?.group?.userData?._interactableChapterId === ref.chapterId) {
          const p = obj.interactable?.position || [0, 0];
          return { x: p[0], z: p[1], floor: obj.group.userData.floor || floor, found: true };
        }
      }
    }
  }
  return { x: 0, z: 0, floor, found: false };
}

function updateObjective(dt) {
  const wrap = document.getElementById('play-compass');
  if (!wrap || !player || !camera) return;
  _ensureObjectiveRing();

  const ref = getObjectiveRef();
  if (!ref) {
    wrap.classList.remove('visible');
    if (_objRing) _objRing.visible = false;
    return;
  }
  const tgt = resolveObjectiveTarget(ref);

  let aimX, aimZ, label;
  let ringX, ringZ, ringFloor, showRing = false;
  if (tgt.floor !== currentFloor) {
    // Target lives on another floor — steer the player to the elevator.
    const cb = elevatorRef?.callButtonPos;
    if (cb) { aimX = cb.x; aimZ = cb.z; ringX = cb.x; ringZ = cb.z; ringFloor = currentFloor; showRing = true; }
    else { aimX = player.position.x; aimZ = player.position.z; }
    label = (tgt.floor > currentFloor ? '↑' : '↓') + ' Floor ' + tgt.floor;
  } else if (tgt.found) {
    aimX = tgt.x; aimZ = tgt.z; ringX = tgt.x; ringZ = tgt.z; ringFloor = tgt.floor; showRing = true;
    const dist = Math.round(Math.hypot(player.position.x - tgt.x, player.position.z - tgt.z));
    label = (ref.kind === 'test' ? 'Final test' : 'Next lesson') + ' · ' + dist + 'm';
  } else {
    wrap.classList.remove('visible');
    if (_objRing) _objRing.visible = false;
    return;
  }

  // Compass arrow rotation: 0° = target straight ahead (arrow up). Positive
  // (clockwise) when the target is to the camera's right.
  const cf = new THREE.Vector3();
  camera.getWorldDirection(cf);
  const camBearing = Math.atan2(cf.x, cf.z);
  const tgtBearing = Math.atan2(aimX - player.position.x, aimZ - player.position.z);
  let a = camBearing - tgtBearing;
  a = Math.atan2(Math.sin(a), Math.cos(a)); // normalize to [-π, π]
  wrap.classList.add('visible');
  const arrow = document.getElementById('play-compass-arrow');
  if (arrow) arrow.style.transform = `rotate(${a * 180 / Math.PI}deg)`;
  const lab = document.getElementById('play-compass-label');
  if (lab) lab.textContent = label;

  if (_objRing) {
    _objRing.visible = showRing;
    if (showRing) {
      _objRing.position.set(ringX, floorBaseY(ringFloor) + 0.02, ringZ);
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.003);
      const s = 1 + 0.14 * pulse;
      _objRing.scale.set(s, 1, s);
      _objRing.rotation.y += dt * 0.5;
      const { _ring, _disc, _beam } = _objRing.userData;
      _ring.material.opacity = 0.55 + 0.45 * pulse;
      _disc.material.opacity = 0.10 + 0.14 * pulse;
      _beam.material.opacity = 0.06 + 0.10 * pulse;
    }
  }
}

// ─── KEDASH NORMALCY INDEX — story-tension HUD meter ─────────────────────────
// A small corporate-dashboard widget (play mode only) whose 4-segment bar
// DRAINS as the story tier rises: T0-1 full, T2-3 three, T4-5 two, T6 one,
// T7 restored full with a gold tint (resolution). Created lazily inside
// the play view DOM (same container as the compass) so app.js's view swap
// destroys it with the rest of the HUD. Driven by the 1 Hz tier poll in
// update().
let _lastTierPollMs = 0;
let _normalcyLastTier = -1;

function _normalcySegments(t) {
  if (t >= 7) return 4; // resolution — restored
  if (t >= 6) return 1;
  if (t >= 4) return 2;
  if (t >= 2) return 3;
  return 4;
}

function updateNormalcyMeter(tier) {
  const host = document.getElementById('play-compass')?.parentElement;
  if (!host) return;
  let el = document.getElementById('play-normalcy');
  if (!el) {
    el = document.createElement('div');
    el.id = 'play-normalcy';
    el.className = 'play-normalcy';
    el.innerHTML = '<div class="normalcy-label">KEDASH NORMALCY INDEX</div>'
      + '<div class="normalcy-bar">'
      + '<span class="normalcy-seg"></span>'.repeat(4)
      + '</div>';
    host.appendChild(el);
    _normalcyLastTier = -1; // force a paint on (re)mount
  }
  if (tier === _normalcyLastTier) return;
  _normalcyLastTier = tier;
  const segs = _normalcySegments(tier);
  el.classList.toggle('restored', tier >= 7);
  el.title = segs === 4 ? 'All metrics nominal.' : 'Recalibrating…';
  el.querySelectorAll('.normalcy-seg').forEach((s, i) => {
    s.classList.toggle('on', i < segs);
  });
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

  // Edit-mode fly: Space ascends, C descends. Gravity + ground-snap
  // are suppressed so the hero can hover at any Y to reach ceiling
  // items / look around without the camera arc-limit fighting the
  // floor. Vertical range is clamped to [floor − 0.2, floor + 12].
  if (isRoomEditorActive()) {
    const FLY_SPEED = 5.0; // m/s
    if (keys[' ']) player.position.y += FLY_SPEED * dt;
    if (keys['c']) player.position.y -= FLY_SPEED * dt;
    const groundY = floorBaseY(currentFloor);
    if (player.position.y < groundY - 0.2) player.position.y = groundY - 0.2;
    if (player.position.y > groundY + 12)  player.position.y = groundY + 12;
    player.userData.velocityY = 0;
    player.userData.grounded = false;
    jumpRequested = false;
  } else {
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
  const pitchCos = Math.cos(cameraPitch);
  const pitchSin = Math.sin(cameraPitch);
  const floorY = floorBaseY(currentFloor);

  // The look target — the point the camera frames (the character's upper
  // body). The occlusion ray starts HERE, not at camera height.
  const lookX = player.position.x;
  const lookY = player.position.y + 1.2;
  const lookZ = player.position.z;

  // Where the camera WANTS to sit at the full requested distance (the
  // complete 3D orbit position, accounting for pitch). The previous
  // occlusion ray was horizontal at a fixed 4.2 m height — but the walls
  // are only 3.8 m tall, so that ray sailed clean over every wall top and
  // never registered a hit, letting the camera punch straight through.
  // Casting from the look target toward this true camera position hits
  // walls at the correct height at any pitch.
  const horizFull = cameraDist * pitchCos;
  const desiredX = lookX - Math.sin(cameraYaw) * horizFull;
  const desiredZ = lookZ - Math.cos(cameraYaw) * horizFull;
  const desiredY = floorY + camH + cameraDist * pitchSin
    + Math.max(0, player.position.y - floorY) * 0.3;

  // Wall-occlusion clamp.
  let effDist = cameraDist;
  if (cameraWalls.length) {
    _camRayOrigin.set(lookX, lookY, lookZ);
    _camRayDir.set(desiredX - lookX, desiredY - lookY, desiredZ - lookZ);
    const fullLen = _camRayDir.length() || 1e-3;
    _camRayDir.multiplyScalar(1 / fullLen);
    _camRay.set(_camRayOrigin, _camRayDir);
    _camRay.near = 0.2;
    _camRay.far = fullLen;
    const candidates = _filteredCameraWalls().filter(w => w.visible);
    const hits = _camRay.intersectObjects(candidates, false);
    if (hits.length) {
      // Pull the camera to just inside the nearest wall. Convert the hit
      // distance along the ray back into an orbit distance (the ray's
      // full length corresponds to the full cameraDist).
      const hitDist = Math.max(0, hits[0].distance - 0.35);
      effDist = Math.max(CAM_DIST_MIN, cameraDist * (hitDist / fullLen));
    }
  }

  // Snap IN instantly (so we never render a frame with the camera behind
  // a wall), ease OUT smoothly when the wall clears.
  if (effDist < _camSmoothDist) _camSmoothDist = effDist;
  else _camSmoothDist += (effDist - _camSmoothDist) * (1 - Math.exp(-dt * 5));

  // Orbit: horizontal distance shrinks with pitch (the camera arcs over
  // the target instead of just sliding up). cos(pitch) only — sin(pitch)
  // alone would let the camera "fall" inside the target at high pitch.
  const horizDist = _camSmoothDist * pitchCos;
  const targetCamX = lookX - Math.sin(cameraYaw) * horizDist;
  const targetCamZ = lookZ - Math.cos(cameraYaw) * horizDist;
  // Light position lerp for smooth following; the distance smoothing
  // above already handles the snap-in, so this can stay gentle.
  const camLerp = 1 - Math.exp(-dt * 10);
  camera.position.x += (targetCamX - camera.position.x) * camLerp;
  camera.position.z += (targetCamZ - camera.position.z) * camLerp;
  // Camera height = floor baseline + camH (constant ride height when
  // pitch=0) + pitched vertical offset + a small jump bob. Held at the
  // current floor's baseline so it doesn't leak across floors.
  const rawCamY = floorY + camH + _camSmoothDist * pitchSin
    + Math.max(0, player.position.y - floorY) * 0.3;
  // Ceiling clamp: the room ceilings are single-sided planes (normal
  // points DOWN into the room), so the moment the camera rises above one
  // it sees the invisible backface and the sky shows through. camH alone
  // (4.2) already exceeds the 3.8 m interior ceilings, and the wall
  // occlusion only shrinks the orbit distance, never this vertical
  // offset — so probe straight up from the player and cap the camera
  // just below whatever ceiling is overhead. Open exterior (no hit) and
  // the 12 m atrium are handled automatically (their ceiling, if any,
  // is far above), so this only bites in the low-ceilinged rooms.
  let ceilCap = floorY + 14;
  if (cameraWalls.length) {
    _camRayOrigin.set(player.position.x, player.position.y + 1.0, player.position.z);
    _camRayDir.set(0, 1, 0);
    _camRay.set(_camRayOrigin, _camRayDir);
    _camRay.near = 0.2;
    _camRay.far = 30;
    const upCandidates = _filteredCameraWalls().filter(w => w.visible);
    const upHits = _camRay.intersectObjects(upCandidates, false);
    if (upHits.length) ceilCap = Math.min(ceilCap, upHits[0].point.y - 0.4);
  }
  // Clamp so extreme pitches don't push the camera below the floor or
  // above the local ceiling.
  camera.position.y = Math.max(floorY + 0.4, Math.min(ceilCap, rawCamY));
  camera.lookAt(lookX, player.position.y + 1.0, lookZ);

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
      lighting.applyPreset(idx);              // starts a ~1.2 s lerp
      if (skyDome) {
        const skyP = getSkyPresetForZone(idx);
        skyDome.applyPreset(skyP.sky);
        // Note: lighting.tick() controls fog during the transition.
        // The pre-existing sky-driven scene.fog override applied INSTANTLY,
        // making it look like the zone snapped despite the lerp. We let
        // the lighting manager own fog now (sky still drives its own dome
        // shader for the visible horizon band).
      }
      // Crossfade zone music + ambience bed. fail-silent inside
      // AudioManager. Floor M stays music-free AND bed-free (AUDIO-02) —
      // only the arrival chime plays there; the silence is the point.
      if (currentFloor !== FLOOR_M_INDEX) {
        // Procedural piano per zone (no audio files). 4 moods spread
        // across the zones — see zoneConfig.procForZone + proceduralMusic.js.
        try { audio.startProceduralMusic(`zone-${procForZone(idx)}`, procForZone(idx), 2500); } catch {}
        try { startAmbience(idx); } catch {}
      } else {
        try { stopAmbience(1200); } catch {}
      }
    }
    // Advance the in-progress preset transition every frame (interpolates
    // hemi/dir colors+intensities, accents up/down, fog, background); the
    // postfx composer reads getPostFx() so retuning on the lerp keeps it
    // in sync without strobing.
    lighting.tick(dt);
    if (postfx) postfx.applyPreset(lighting.getPostFx());
    // Time-of-day baseline scales the preset values, so re-apply once the
    // lerp is settled — calling every frame would overwrite the lerp.
    if (timeOfDay && !lighting._fromState && lighting.currentIdx >= 0
        && timeOfDay._lastSettledIdx !== lighting.currentIdx) {
      timeOfDay._lastSettledIdx = lighting.currentIdx;
      timeOfDay.reapply();
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
  // CURTAIN-01: during the first F1→F2 elevator beat, routines pause
  // and every visible floor-1 NPC turns to face the elevator door
  // (11, -7.6). Purely timeout-based — when curtainUntil passes, the
  // routines resume and walk everyone back to normal.
  if (performance.now() < curtainUntil) {
    for (const m of npcMeshes) {
      if ((m.userData.floor || 1) !== 1 || !m.visible) continue;
      const target = Math.atan2(11 - m.position.x, -7.6 - m.position.z);
      let d = ((target - m.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (d < -Math.PI) d += Math.PI * 2;
      m.rotation.y += d * (1 - Math.exp(-dt * 5));
    }
  } else if (liveAgents && player) {
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
  // AUDIO-03: sustained hum near the ch16 server rack (floor 4). The hum
  // sits a semitone lower once the capstone is passed — the rack relaxes.
  // Spatialized: the hum is HRTF-panned AT the rack (16.2, 16.2) and
  // attenuates with distance; the proximity boolean (widened to 9 m,
  // beyond which the inverse model is inaudible anyway) only bounds CPU.
  if (player) {
    updateServerHum(
      currentFloor === 4 && Math.hypot(player.position.x - 16.2, player.position.z - 16.2) < 9,
      isTestDone('ch16-test'),
      [16.2, floorBaseY(4) + 1.3, 16.2],
    );
  }
  // Story-tier audio + normalcy HUD — throttled 1 Hz poll. Drives the
  // ambience detune/lowpass/beat layer, the music-bus highshelf, the
  // KEDASH NORMALCY INDEX meter, and retries a bed start that raced the
  // mobile audio unlock.
  if (performance.now() - _lastTierPollMs > 1000) {
    _lastTierPollMs = performance.now();
    try {
      const _tier = Story.getTier();
      applyStoryTierAudio(_tier);
      tickAmbience();
      updateNormalcyMeter(_tier);
    } catch { /* story/progress not ready yet — retried next second */ }
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
        // A pending scripted scene's label wins (TWIST1-01: "Talk — Ines
        // has been counting"), then the story override channel
        // (data/story_lines.js), then the default talk prompt.
        const pendingScene = pendingSceneFor(npc);
        const scenePrompt = pendingScene ? window.STORY_SCENES?.[pendingScene]?.promptLabel : null;
        const storyPrompt = storyLinesFor(npc.id)?.promptLabel;
        promptEl.textContent = (typeof scenePrompt === 'string' && scenePrompt)
          ? scenePrompt
          : (typeof storyPrompt === 'string' && storyPrompt)
          ? storyPrompt
          : `Talk to ${npc.name.split(' ')[0]} — press E or tap`;
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

  // Objective guidance — compass arrow + ground beacon to the next lesson.
  updateObjective(dt);
}

// A thrown error inside update() used to kill the entire RAF loop — the
// canvas froze on its last (often blank) frame, producing a white screen
// with no recovery (this is exactly how a stale cached module that lost a
// method, e.g. lighting.tick, white-screened desktop on 2026-06-15). Now
// the per-frame work is guarded: one bad frame is logged once and skipped,
// the loop keeps running, and rendering still happens so the world stays
// visible even if a subsystem update is failing.
let _loopErrLogged = false;
function loop() {
  raf = requestAnimationFrame(loop);
  const dt = Math.min(0.05, clock.getDelta());
  try {
    update(dt);
  } catch (e) {
    if (!_loopErrLogged) {
      _loopErrLogged = true;
      console.error('[play] update() threw — continuing render loop:', e);
    }
  }
  try {
    if (postfx) postfx.render();
    else renderer.render(scene, camera);
  } catch (e) {
    if (renderer && scene && camera) renderer.render(scene, camera);
  }
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
  // Phase 1 — blocking: the player's rig + the always-visible floor-1
  // named cast. These are meshopt-compressed (~5 MB total), so gating
  // startup on them is cheap even on mobile over Tailscale.
  const critical = ['hero', 'ines', 'business_female_01', 'executive_male_01'];
  await loader.warmCache(critical,
    (loaded, total) => overlay.setProgress(loaded, total),
    { concurrency: 3 });
  await loader.loadAnimations();   // optional shared anim pack (~0.5 MB)
  gltfAssetLoader = loader;
  overlay.hide();
  // Any rig resolving AFTER its NPCs spawned (phase-2 stream below, a
  // recovered timeout, a retried failure) upgrades its procedural
  // stand-ins in place.
  loader.onAssetResolved = () => {
    try { upgradeProceduralNpcs(); }
    catch (e) { console.warn('[play] NPC upgrade pass failed:', e); }
    // Maya specifically may resolve well after the wall portrait is
    // built — re-check the pending CEO portrait queue on every asset
    // resolution (cheap, returns early until 'maya' is cached).
    try { _tryUpgradeCeoPortraits(); }
    catch (e) { console.warn('[play] CEO portrait upgrade failed:', e); }
  };
  // Phase 2 — background: the 10 ethnicity rigs + maya (~165 MB
  // uncompressed — see the audit in the 2026-06-12 session notes).
  // Deliberately NOT awaited: the world becomes interactive now; NPCs
  // on these rigs spawn procedural and pop to GLTF per rig via the
  // hook above. Concurrency-capped so a mobile link isn't saturated by
  // eleven parallel 15 MB streams — which is what made the old 60s
  // per-asset timeouts fire and strand NPCs procedural forever.
  // 'maya' reuses western_female.glb but is her own manifest id (with
  // textureOverride) — the sync builder needs HER id in the cache.
  const background = [
    'maya',
    'western_male', 'western_female',
    'african_male', 'african_female',
    'easian_male', 'easian_female',
    'sasian_male', 'sasian_female',
    'arab_male', 'hijab_female',
  ];
  loader.warmCache(background, null, { concurrency: 3 })
    .catch((err) => console.warn('[play] background rig warm failed:', err?.message || err));
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
  // FIN-07: post-finale sessions get the epilogue lobby (Maya's chair
  // beside Ines's). Maya + the new arrival already spawned correctly via
  // floorForNpcDef / epilogueOnly; this only adds the cosmetic chair.
  if (Story.sceneSeen('finale')) applyEpilogueState();
  // Expose a tiny NPC mutation API for the in-game editor (Phase 2).
  // Editor uses these to spawn / despawn / list characters without a
  // circular import.
  try {
    window.__playApi = {
      spawnNpcFromDef: (def) => {
        spawnNPC(def);
        return npcMeshes[npcMeshes.length - 1];
      },
      removeNpcMesh: (mesh) => {
        const idx = npcMeshes.indexOf(mesh);
        if (idx >= 0) npcMeshes.splice(idx, 1);
        scene.remove(mesh);
      },
      getHandBuiltNpcs: () => NPCS,
      // Re-derive collider AABBs from the live window.ROOMS data.
      // Editor calls this after every drag / resize / paste so the
      // player can't walk through a moved desk's old footprint.
      rebuildColliders: () => rebuildColliders(),
      // Lets the in-world overlay re-fire the promotion ceremony after a
      // test taken in the overlay (the play scene stayed alive, so start()'s
      // one-shot check never re-ran). Flag-gated → safe no-op otherwise.
      maybeRunPromotionCeremony: () => maybeRunPromotionCeremony(),
    };
  } catch {}
  setupInput();
  // Restore the player's saved floor (sessionStorage.ccq_play_pos.floor)
  // so reloads keep them on the same floor they left. Lazy-builds the
  // floor first if it hasn't been built this session.
  await _restoreSavedFloor();
  // Apply the initial zone preset so the first frame renders with proper
  // lighting; subsequent transitions are picked up by update().
  if (lighting) {
    const idx = zoneIndexAt(player.position.z);
    lighting.applyPreset(idx >= 0 ? idx : 0);
    lastZoneIdx = idx >= 0 ? idx : 0;
    // Initial zone music — procedural piano (no audio file dependency).
    try { audio.startProceduralMusic(`zone-${procForZone(lastZoneIdx)}`, procForZone(lastZoneIdx), 2500); } catch {}
    // Initial ambience bed. If the audio context is still locked (no
    // gesture yet) this records the pending zone; the 1 Hz tickAmbience
    // poll in update() starts the bed after the unlock.
    if (currentFloor !== FLOOR_M_INDEX) {
      try { startAmbience(lastZoneIdx); } catch {}
    }
  }
  // Time-of-day modulates the current preset (intensity, sun, sky, exposure).
  timeOfDay = new TimeOfDay({ lighting, skyDome, renderer, receptionWindows });
  timeOfDay.tick(performance.now());
  // Image-based lighting (Phase 1): a prefiltered sky env map so every
  // MeshStandardMaterial gains real reflections (marble, glass, brass, metal).
  // Baked once at a moderate brightness — see envProbe.js for why no light
  // rebalance is needed. Guarded so a PMREM failure never breaks world entry.
  try {
    if (!_envTexture && renderer) _envTexture = buildSkyEnvTexture(renderer);
    if (_envTexture) scene.environment = _envTexture;
  } catch (e) { console.warn('IBL env build failed', e); }
  // Live world: routines for Marcus/Aisha/Linda + a few ambient workers.
  // The ambient workers double as E-to-talk flavor NPCs (SYS-04) — they
  // get name tags + act-gated lines and register into npcMeshes.
  liveAgents = new LiveAgents({
    scene, npcMeshes, makeCharacter, isMobile: isMobile(),
    makeNameTag: makeNpcNameTag,
    ambientLineForSlot,
  });
  // Scripted scene runner (SYS-03) — shares the dialogue card chrome.
  initSceneRunner({
    getDialogueEl: () => dialogueEl,
    startTypewriter,
    skipTypewriter,
    playUi,
    setInputLocked: (v) => { inputLocked = !!v; },
    // PORT-01: rendered face for a beat's speaker — matched by NPC name
    // ('You' → the player). Null keeps the beat's emoji fallback.
    portraitFor: (sp) => {
      if (!sp?.name) return null;
      if (sp.name === 'You') return player ? getPortrait(player, 'hero') : null;
      const m = npcMeshes.find(mm => mm.userData?.npc?.name === sp.name);
      return m ? getPortrait(m, `name:${sp.name}`) : null;
    },
  });
  // Document viewer (SYS-05) — overlays ABOVE the dialogue card. While
  // a scene is active it must not release the scene's input lock on
  // close, hence isSceneActive is injected.
  initDocViewer({
    playUi,
    setInputLocked: (v) => { inputLocked = !!v; },
    isSceneActive,
  });
  registerSceneActions({
    // Pre-twist1 micro-cutscene: Ines predicts Tania's laugh.
    inesAnticipates_predict: () => {
      const ines = npcMeshes.find(m => m.userData?.npc?.id === 'ines');
      if (ines) {
        // Subtly orient her toward the water cooler so the visual cue
        // matches her "watch" line.
        ines.rotation.y = Math.atan2(-9.5 - ines.position.x, -2.8 - ines.position.z);
      }
      // The laugh lands ~4.3 s after the beat starts, comfortably after
      // the typewriter on the prediction line finishes.
      setTimeout(() => {
        const tn = npcMeshes.find(m => m.userData?.npc?.id === 'tania');
        if (tn) showSpeechBubble(tn, 'Ha! Ha ha. Haaaa.');
      }, 4300);
    },
    // TWIST 1 staging — every actor lookup is guarded: the scene plays
    // fine (dialogue only) if any stage actor is missing.
    twist1_point: () => {
      const ines = npcMeshes.find(m => m.userData?.npc?.id === 'ines');
      if (ines) {
        // Face the water cooler she's pointing at.
        ines.rotation.y = Math.atan2(-9.5 - ines.position.x, -2.8 - ines.position.z);
      }
      // Route blue-folder guy toward the cooler pair; he holds there
      // facing the pair long past the scene, then resumes his loop.
      try {
        liveAgents?.sendTo?.('folderman', [-8.2, -3.0], Math.atan2(-9.5 - (-8.2), -2.8 - (-3.0)), 75);
      } catch {}
    },
    twist1_exchange: () => {
      const find = (id) => npcMeshes.find(m => m.userData?.npc?.id === id);
      const fm = find('folderman'), tn = find('tania'), pr = find('partner');
      // Delays let Ines's prediction line finish typing first; the
      // exchange then lands while the player watches ("Waaaatch.").
      setTimeout(() => { if (fm) showSpeechBubble(fm, 'Busy week. They say the new cohort starts soon.'); }, 3800);
      setTimeout(() => { if (pr) showSpeechBubble(pr, 'Did you see the Q3 numbers?'); }, 6400);
      setTimeout(() => { if (tn) showSpeechBubble(tn, 'Ha! Ha ha. Haaaa.'); }, 8600);
    },
    // TWIST 2 (TWIST2-01): "Mm. Open the file." — the annotated
    // client-profiles.md slides over the dialogue card. The delay lets
    // the line land first; the doc viewer never touches scene state.
    twist2_ledger: () => {
      setTimeout(() => {
        const doc = window.STORY_DOCS?.client_profiles;
        if (doc) {
          openDocument({ title: doc.title, body: doc.body || '' });
          Story.markCollectibleRead?.('client_profiles');
        }
      }, 1100);
    },
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
  maybeRunPromotionCeremony();

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
        // suspendGameInput intentionally omitted — gameplay movement
        // (WASD / joystick / Q/E camera yaw / middle-mouse + touch
        // look / scroll zoom) stays live during edit mode so the
        // user can drive the camera around to inspect placements.
        // The actions that DO get blocked (E-interact NPC dialogue,
        // Space-jump, door-tests) check isRoomEditorActive() at
        // their fire sites instead.
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
    onSavePermanently: () => savePermanentlyEdits(),
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
    // FIN-01 — the blank slot below F1. Present (unlabeled, disabled)
    // from day one; lights up as 'M' once the capstone is passed AND
    // Marcus has had his word at the door. Story-gated, not badge-gated.
    const mUnlocked = isTestDone('ch16-test') && Story.sceneSeen('marcusDoor');
    const mBtn = document.createElement('button');
    if (mUnlocked) {
      const here = currentFloor === FLOOR_M_INDEX;
      mBtn.className = 'elev-floor-btn elev-floor-m' + (here ? ' current' : '');
      mBtn.textContent = `M${here ? '  (here)' : ''}`;
      if (here) mBtn.disabled = true;
      else mBtn.addEventListener('click', () => requestFloorChange(FLOOR_M_INDEX));
    } else {
      mBtn.className = 'elev-floor-btn elev-floor-blank';
      mBtn.textContent = '·';
      mBtn.disabled = true;
    }
    list.appendChild(mBtn);
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
  // TWIST2-01: the first Floor-4 ride after the truth (T5+) gets a
  // clearance chime — the building acknowledging the new tier. One-shot
  // via a persisted Story flag, marked up front like CURTAIN-01.
  if (targetFloor === 4 && Story.getTier() >= 5 && !Story.getFlag('floor4_chime')) {
    Story.setFlag('floor4_chime');
    playClearanceChime();
  }
  // AUDIO-02: the ride down to Floor M is silent — fade the zone music
  // AND the ambience bed out for the descent and mark arrival with a
  // lower, slower chime. Leaving M re-arms the zone-music detector so
  // both restart on arrival.
  if (targetFloor === FLOOR_M_INDEX) {
    try { audio.stopMusic(600); } catch {}
    try { stopAmbience(600); } catch {}
    playFloorMChime();
  }
  const leavingFloorM = currentFloor === FLOOR_M_INDEX;
  // CURTAIN-01: on the very first ride up to Floor 2, the lobby breaks
  // character for two seconds — every visible NPC turns to watch the
  // player board. Marked seen up front so a mid-beat exit can't replay
  // it; timeout-based so there's no stuck state.
  if (targetFloor === 2 && currentFloor === 1 && !Story.sceneSeen('curtain1')) {
    Story.markSceneSeen('curtain1');
    curtainUntil = performance.now() + 2000;
    await new Promise(res => setTimeout(res, 2100));
  }
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
  // Rides to/from the mezzanine hold the black a beat longer — the slot
  // below '1' going somewhere should feel like leaving the map.
  const rideMs = (targetFloor === FLOOR_M_INDEX || currentFloor === FLOOR_M_INDEX) ? 1600 : 450;
  // Elevator travel SFX — motor ramp + cable shoosh sized to the ride.
  // Fires at the actual ride start (after any first-visit floor load) and
  // ends as the doors open, so Floor-M arrival silence stays intact.
  try { playElevatorRide(rideMs / 1000 + 0.25); } catch {}
  setTimeout(() => {
    currentFloor = targetFloor;
    try { window.__playCurrentFloor = currentFloor; } catch {}
    // Re-arm the zone-music detector after a silent Floor-M stay — the
    // update() block restarts the music once currentFloor is normal again.
    if (leavingFloorM) lastZoneIdx = -1;
    applyFloorVisibility();
    spawnPlayerOnFloor(targetFloor);
    updateBadgeHud();
    if (fade) fade.classList.remove('opaque');
    setTimeout(() => { inputLocked = false; }, 450);
  }, rideMs);
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
  // KDQ-XXXX persistent reminder of the ch01-test code, set in
  // openBadgePrinter once the lobby printer has been used. Mounted
  // lazily under the compass so the HUD layout doesn't need every
  // play.start() path to wire it.
  try {
    const kdqVisible = !!Story.getFlag?.('lobby_badge_printed');
    let kdq = document.getElementById('play-kdq-badge');
    if (kdqVisible) {
      if (!kdq) {
        const host = document.getElementById('play-compass')?.parentElement
          || document.getElementById('play-canvas-host')?.parentElement;
        if (host) {
          kdq = document.createElement('div');
          kdq.id = 'play-kdq-badge';
          kdq.className = 'play-kdq-badge';
          kdq.title = 'Compliance verification code — present at the ch01 practical';
          host.appendChild(kdq);
        }
      }
      const nonce = window.Progress?.getTestNonce?.(progress, 'ch01-test');
      if (kdq) kdq.innerHTML = `<span class="kdq-icon">🪪</span><span class="kdq-code">${nonce || 'KDQ-—'}</span>`;
    } else if (kdq) {
      kdq.remove();
    }
  } catch {}
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
  // The asset loader is a singleton that outlives this play session —
  // detach the upgrade hook so a straggler rig resolving after stop()
  // can't run the pass against the torn-down scene.
  try { getAssetLoader().onAssetResolved = null; } catch {}
  if (dust) { dust.dispose(); dust = null; }
  if (postfx) { postfx.dispose(); postfx = null; }
  if (lighting) { lighting.dispose(); lighting = null; }
  try { audio.stopMusic(800); } catch {}
  try { updateServerHum(false); } catch {}
  try { unmountAudioSettings(); } catch {}
  try { unmountLessonOverlay(); } catch {}
  try { unmountCustomization(); } catch {}
  lastZoneIdx = -1;
  footstepAccum = 0;
  decoTickers = [];
  try { disposeEnv(_envTexture); } catch {}
  _envTexture = null;
  renderer = null; scene = null; camera = null;
  _objRing = null; // disposed with the scene above; rebuilt on next start()
  clearInteractables();
  interactObjects = [];
  player = null; npcMeshes = []; interactionTarget = null;
  zoneDoors = [];
  ceoHearts = null;
  ceoPortraitGroup = null;
  ceoPlaque = null;
  floorMState = null;
  epilogueChairAdded = false;
  // Floors are rebuilt from scratch on the next start() — without this,
  // loadFloor() would no-op for previously-visited floors against the
  // fresh (empty) scene. Floor 1 is always built by buildWorld().
  loadedFloors.clear();
  loadedFloors.add(1);
  currentFloor = 1;
  badgePrinterGroup = null;
  houseRulesGroup = null;
  cxFolderGroup = null;
  readableNotes = [];
  curtainUntil = 0;
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
