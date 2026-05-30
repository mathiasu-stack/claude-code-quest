// lessonRegistry.js — per-chapter delivery configuration.
//
// Each entry says HOW the chapter's lesson is delivered: by an NPC
// (existing dialogue) or by an interactable object placed in the
// world. Onboarding chapters (1-2) stay NPC-delivered for warmth.
//
// Object positions are absolute world coordinates. Currently chapters
// 3-5 use object delivery placed in the existing Reception/Library
// zones; chapters 6+ stay NPC-delivered until those zones get rebuilt
// in a later run.

export const LESSON_DELIVERY = {
  ch01: { delivery: 'npc',        npcId: 'linda'  },
  ch02: { delivery: 'npc',        npcId: 'noor'   },

  // Chapter 3 — CLAUDE.md Atrium. Computer on Aisha's desk in Reception.
  ch03: {
    delivery: 'computer',
    objectLocation: { floor: 1, position: [7.5, 1.0, -3] },
    uiStyle: 'terminal',
    chapterId: 'ch03', lessonId: 'ch03-l01',
  },

  // Chapter 4 — Memory Vault. Whiteboard on the Reception east wall.
  ch04: {
    delivery: 'whiteboard',
    objectLocation: { floor: 1, position: [-9.5, 0, 0] },
    uiStyle: 'whiteboard',
    chapterId: 'ch04', lessonId: 'ch04-l01',
  },

  // Chapter 5 — Communications Hub. Phone on the reception desk.
  ch05: {
    delivery: 'phone',
    objectLocation: { floor: 1, position: [-1.4, 1.0, -7.5] },
    uiStyle: 'video',
    chapterId: 'ch05', lessonId: 'ch05-l01',
  },

  // Chapter 6 — File Workshop. Book on the south reading table in the
  // new west-wing library (relocated when the library moved off the
  // south-of-reception slot).
  ch06: {
    delivery: 'book',
    objectLocation: { floor: 1, position: [-22, 0.78, -26] },
    uiStyle: 'book',
    chapterId: 'ch06', lessonId: 'ch06-l01',
  },

  // Chapter 16 — NAS Capstone. Server rack in the new library back
  // (north end). Was at [3, 0, 30] in the old library — that area is
  // now exterior, so the server got relocated.
  ch16: {
    delivery: 'server',
    objectLocation: { floor: 1, position: [-12, 0, -31] },
    uiStyle: 'terminal',
    chapterId: 'ch16', lessonId: 'ch16-l01',
  },

  // Chapter 10 — Model Engine Bay (floor 3, NE quadrant — slot index 3
  // in the floor-3 office grid: cx=13, cz=13, face=π). The console sits
  // behind/beside the lesson NPC arc so it reads as the chapter's
  // anchor without colliding with character pathing. Position y is
  // floor-relative; the spawn loop adds floorBaseY(3) = 9.0.
  // lookAt = π so the console faces south (toward the player who
  // approaches it from the room interior).
  ch10: {
    delivery: 'modelConsole',
    objectLocation: { floor: 3, position: [13, 0, 15] },
    lookAt: Math.PI,
    uiStyle: 'terminal',
    chapterId: 'ch10', lessonId: 'ch10-l01',
  },

  // Chapter 14 — Subagent Dispatch Floor (floor 4, NW quadrant — slot
  // index 1 in the floor-4 office grid: cx=13, cz=-13, face=0). Board
  // mounted at the rear wall behind the NPC arc.
  ch14: {
    delivery: 'dispatchBoard',
    objectLocation: { floor: 4, position: [13, 0, -15] },
    lookAt: 0,
    uiStyle: 'whiteboard',
    chapterId: 'ch14', lessonId: 'ch14-l01',
  },

  // Chapter 15 — Guardrail Lab (floor 4, SE quadrant — slot index 2 in
  // the floor-4 office grid: cx=-13, cz=13, face=π). Panel on a stand
  // beside the NPCs.
  ch15: {
    delivery: 'permissionsPanel',
    objectLocation: { floor: 4, position: [-13, 0, 15] },
    lookAt: Math.PI,
    uiStyle: 'terminal',
    chapterId: 'ch15', lessonId: 'ch15-l01',
  },

  // Chapters 7-9, 11-13 fall through to NPC delivery (default — see
  // generateChapterNPCs in play.js).
};

export function getDeliveryForChapter(chapterId) {
  return LESSON_DELIVERY[chapterId] || { delivery: 'npc' };
}
