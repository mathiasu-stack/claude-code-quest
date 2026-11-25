// engine/layout.js — the ONE place that maps curriculum → building.
//
// Classic script (window.Layout), loaded before engine/progress.js, so the
// dashboard's badge math, play.js's floor/NPC placement and the audit suite
// (scripts/audit/*.cjs, which load this file into a vm sandbox) all compute
// the same answer. Pure functions of window.CURRICULUM: no THREE, no DOM.
//
// Before this file existed the floor math lived twice (play.js and
// progress.js), and lesson NPC slots were derived from the lesson id's
// numeric suffix, so a chapter's 6th/7th lesson walked through the wall
// (ch16-l07 was unreachable). Slots now come from the lesson's POSITION in
// chapter.lessons, and each room has a fixed capacity, which the audit
// enforces (see LESSON_CAPACITY).
(function () {
  const FLOORS_TOTAL = 4;
  const CHAPTERS_PER_FLOOR = 4;
  // Max lesson NPCs a chapter room can hold without crowding furniture.
  // Floors 2–4: two rows of four at the chapter desk. Floor-1 west wing:
  // four rows of two along the room's long walls.
  const LESSON_CAPACITY = 8;
  // Walkable half-extent of a 36×36 upper floor (clampMove's ±17.5) and the
  // NPC interaction radius (play.js proximity loop). An NPC is reachable iff
  // the walkable area comes within INTERACT_RADIUS of it.
  const OFFICE_WALK_HALF = 17.5;
  const INTERACT_RADIUS = 2.4;

  function curriculum() {
    return (typeof window !== 'undefined' && window.CURRICULUM) || [];
  }

  function indexForChapterId(chId) {
    return curriculum().findIndex(c => c.id === chId);
  }

  // Floor is determined by the chapter's position in CURRICULUM (display
  // order), not its id — ids stay stable across reshuffles.
  function floorForChapterIdx(idx) {
    if (idx < 0) return 1;
    return Math.min(FLOORS_TOTAL, Math.ceil((idx + 1) / CHAPTERS_PER_FLOOR));
  }

  function floorForChapterId(chId) {
    return floorForChapterIdx(indexForChapterId(chId));
  }

  // Index of a lesson within its chapter (0-based), or -1.
  function lessonIndex(chapterIdx, lessonId) {
    const ch = curriculum()[chapterIdx];
    if (!ch || !lessonId) return -1;
    return ch.lessons.findIndex(l => l.id === lessonId);
  }

  // ── Floors 2–4: the four quadrant rooms ────────────────────────────────
  // Slot centres sit ~5 m inside each outer wall. rearZ is behind the
  // chapter desk, where the assessor stands.
  const OFFICE_SLOTS = [
    { cx: -13, cz: -13, face: 0,       rearZ: -15 },
    { cx:  13, cz: -13, face: 0,       rearZ: -15 },
    { cx: -13, cz:  13, face: Math.PI, rearZ:  15 },
    { cx:  13, cz:  13, face: Math.PI, rearZ:  15 },
  ];
  // Lesson rows step in from the desk toward the room centre. Row 0 is
  // exactly where lessons 1–4 always stood; row 1 (lessons 5–8) is a
  // second rank 2.6 m further in, clear of the couches/tables on floors 2–4.
  const ROW_X = [-1.4, 0, 1.4, 2.8];
  const ROW_DZ = [1.6, 4.2];

  function officePosition(npc) {
    const idx = indexForChapterId(npc.chapterId);
    if (idx < 0) return null;
    const floor = floorForChapterIdx(idx);
    if (floor <= 1) return null;
    const slot = OFFICE_SLOTS[idx % CHAPTERS_PER_FLOOR];
    if (npc.kind === 'test') {
      return { floor, pos: [slot.cx, slot.rearZ], face: slot.face + Math.PI };
    }
    let li = lessonIndex(idx, npc.lessonId);
    if (li < 0) li = 0;
    const row = Math.min(ROW_DZ.length - 1, Math.floor(li / ROW_X.length));
    const dx = ROW_X[li % ROW_X.length];
    const dz = (slot.cz > 0 ? -1 : 1) * ROW_DZ[row];
    return { floor, pos: [slot.cx + dx, slot.cz + dz], face: slot.face };
  }

  // ── Floor 1 west wing (chapter indices 1–3) ────────────────────────────
  // Room centres at x=-22; idx 1 = library (z -22), 2 = z 0, 3 = z +22.
  function westWingPosition(npc) {
    const idx = indexForChapterId(npc.chapterId);
    if (idx !== 1 && idx !== 2 && idx !== 3) return null;
    const centerX = -22;
    const centerZ = idx === 1 ? -22 : (idx === 2 ? 0 : 22);
    if (npc.kind === 'test') {
      // Library: pulled in from -8.5 to clear the lounge couch at z -31.
      const tz = idx === 3 ? centerZ + 8.5 : (idx === 1 ? centerZ - 7 : centerZ - 8.5);
      return { floor: 1, pos: [centerX, tz], face: idx === 3 ? Math.PI : 0 };
    }
    let li = lessonIndex(idx, npc.lessonId);
    if (li < 0) li = 0;
    // Library lesson 1 is the librarian, behind the checkout counter.
    if (idx === 1 && li === 0) return { floor: 1, pos: [-18.8, -14.9], face: 0 };
    const xSign = (li % 2 === 0) ? -1 : 1;
    // Rows 0–2 are the original slots; row 3 (lessons 7–8) sits at the end
    // of the room away from the assessor (library: toward its couch end,
    // which is clear at x ±3).
    const zOffs = [-4, 0, 4, idx === 1 ? -7 : 7];
    const zOff = zOffs[Math.min(zOffs.length - 1, li >> 1)];
    // Library aisles are at ±3 (±6 would sit inside the shelf columns).
    const xOff = idx === 1 ? 3 : 6;
    return {
      floor: 1,
      pos: [centerX + xSign * xOff, centerZ + zOff],
      face: xSign < 0 ? Math.PI / 2 : -Math.PI / 2,
    };
  }

  window.Layout = {
    FLOORS_TOTAL,
    CHAPTERS_PER_FLOOR,
    LESSON_CAPACITY,
    OFFICE_WALK_HALF,
    INTERACT_RADIUS,
    indexForChapterId,
    floorForChapterIdx,
    floorForChapterId,
    lessonIndex,
    officePosition,
    westWingPosition,
  };
})();
