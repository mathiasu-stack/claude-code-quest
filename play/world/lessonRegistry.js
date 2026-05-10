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

  // Chapter 6 — File Workshop. Book in the Library.
  ch06: {
    delivery: 'book',
    objectLocation: { floor: 1, position: [-3, 0, 14] },
    uiStyle: 'book',
    chapterId: 'ch06', lessonId: 'ch06-l01',
  },

  // Chapter 16 — NAS Capstone. Server rack in the Library back area.
  ch16: {
    delivery: 'server',
    objectLocation: { floor: 1, position: [3, 0, 30] },
    uiStyle: 'terminal',
    chapterId: 'ch16', lessonId: 'ch16-l01',
  },

  // Chapters 7-15 fall through to NPC delivery (default — see
  // generateChapterNPCs in play.js).
};

export function getDeliveryForChapter(chapterId) {
  return LESSON_DELIVERY[chapterId] || { delivery: 'npc' };
}
