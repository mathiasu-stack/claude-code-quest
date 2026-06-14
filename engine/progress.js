const STORAGE_KEY = 'ccq_progress';

// Bump when the save shape changes, and add a migration step in
// loadProgress — existing players' saves must never be silently
// reinterpreted under a new shape.
const SCHEMA_VERSION = 1;

const DEFAULT_PROGRESS = {
  schemaVersion: SCHEMA_VERSION,
  playerName: '',
  totalXP: 0,
  completedLessons: [],
  testResults: {},
  unlockedChapters: ['ch01'],
  unlockedAchievements: [],
  lastActiveDate: null,
  currentStreak: 0,
  longestStreak: 0,
  knowledgeChecks: {},
  // Per-test compliance verification codes (nonces). Keyed by practical-test
  // id, e.g. { 'ch01-test': 'KDQ-7F3A' }. Generated when the test view opens,
  // checked by the `nonce` criteria type, rotated (cleared) on pass.
  testNonces: {},
  // Corporate badge: the highest floor the player has access to. Each
  // floor holds 4 chapters; passing all 4 chapters' practical tests on a
  // floor bumps badgeFloor to the next one. Floor 1 is always accessible.
  badgeFloor: 1,
  // Desk Shop pilot: list of { id, cost } records for cosmetics the
  // player has purchased. Stored as objects (not just ids) so the
  // "spendable PP" math is independent of any future shop catalog
  // edits — once you've spent the PP, the spend sticks at the price
  // you paid. Guarded against double-purchase in purchaseItem.
  ownedItems: [],
};

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const p = JSON.parse(raw);
    const v = p.schemaVersion || 0;
    // Save written by a NEWER build than this code (e.g. stale cached
    // JS) — don't guess at the shape, start defaults without clobbering
    // the stored save; the fresh code will read it fine after reload.
    if (v > SCHEMA_VERSION) return { ...DEFAULT_PROGRESS };
    // v0 → v1: pre-versioning saves have the identical shape; stamp.
    p.schemaVersion = SCHEMA_VERSION;
    return { ...DEFAULT_PROGRESS, ...p };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function resetProgress() {
  localStorage.removeItem(STORAGE_KEY);
  // Story flags (Kedash Protocol) derive from progress — a fresh start
  // must also clear scene-seen / collectible / post-pass state.
  localStorage.removeItem('ccq_story');
  if (window.Story) window.Story.reset();
}

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysBetween(a, b) {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

function recordActivity(progress) {
  const today = todayStr();
  if (progress.lastActiveDate === today) return progress;

  let streak = progress.currentStreak || 0;
  if (!progress.lastActiveDate) {
    streak = 1;
  } else {
    const gap = daysBetween(progress.lastActiveDate, today);
    streak = gap === 1 ? streak + 1 : 1;
  }

  return {
    ...progress,
    lastActiveDate: today,
    currentStreak: streak,
    longestStreak: Math.max(progress.longestStreak || 0, streak),
  };
}

function getCurrentStreak(progress) {
  if (!progress.lastActiveDate) return 0;
  const gap = daysBetween(progress.lastActiveDate, todayStr());
  if (gap > 1) return 0;
  return progress.currentStreak || 0;
}

function unlockAchievement(progress, achievementId) {
  if (progress.unlockedAchievements.includes(achievementId)) return progress;
  return {
    ...progress,
    unlockedAchievements: [...progress.unlockedAchievements, achievementId],
  };
}

function hasAchievement(progress, achievementId) {
  return progress.unlockedAchievements.includes(achievementId);
}

function recordKnowledgeCheck(progress, lessonId, correct, firstTry) {
  const existing = progress.knowledgeChecks[lessonId];
  if (existing) {
    return {
      ...progress,
      knowledgeChecks: {
        ...progress.knowledgeChecks,
        [lessonId]: {
          ...existing,
          attempts: existing.attempts + 1,
          correct: existing.correct || correct,
        },
      },
    };
  }
  return {
    ...progress,
    knowledgeChecks: {
      ...progress.knowledgeChecks,
      [lessonId]: { correct, firstTry: !!firstTry, attempts: 1 },
    },
  };
}

function isKnowledgeCheckPassed(progress, lessonId) {
  return !!progress.knowledgeChecks[lessonId]?.correct;
}

function markLessonComplete(progress, lessonId, xpReward) {
  if (progress.completedLessons.includes(lessonId)) return progress;
  return {
    ...progress,
    completedLessons: [...progress.completedLessons, lessonId],
    totalXP: progress.totalXP + xpReward,
  };
}

function recordTestResult(progress, testId, result, xpReward) {
  const alreadyPassed = progress.testResults[testId]?.passed;
  const xpGain = alreadyPassed ? 0 : (result.passed ? xpReward : 0);
  return {
    ...progress,
    totalXP: progress.totalXP + xpGain,
    testResults: {
      ...progress.testResults,
      [testId]: {
        passed: result.passed,
        score: result.score,
        attempts: (progress.testResults[testId]?.attempts || 0) + 1,
      },
    },
  };
}

function unlockChapter(progress, chapterId) {
  if (progress.unlockedChapters.includes(chapterId)) return progress;
  return {
    ...progress,
    unlockedChapters: [...progress.unlockedChapters, chapterId],
  };
}

function isChapterUnlocked(progress, chapterId) {
  return progress.unlockedChapters.includes(chapterId);
}

function isLessonComplete(progress, lessonId) {
  return progress.completedLessons.includes(lessonId);
}

function isTestPassed(progress, testId) {
  return progress.testResults[testId]?.passed === true;
}

// ── Dual-track test gating ───────────────────────────────────────────────
// Every chapter has both a Practical (hands-on) test and a Theoretical
// (MCQ) test. Either passing path counts as "chapter passed" for the
// purposes of unlocking the next chapter and bumping the badge floor.
// XP is mirrored on both tracks, so the player isn't economically pushed
// toward one or the other — the choice is just about format. The KDQ
// compliance nonce stays scoped to the practical track (it proves a live
// terminal session ran), but neither track is required to advance.
function chapterTestIds(chapter) {
  if (!chapter) return [];
  const practicalId = chapter.practicalTest?.id || `${chapter.id}-test`;
  const theoreticalId = chapter.theoreticalTest?.id || null;
  return theoreticalId ? [practicalId, theoreticalId] : [practicalId];
}

function isChapterTestPassed(progress, chapter) {
  return chapterTestIds(chapter).some(id => isTestPassed(progress, id));
}

function addBonusXP(progress, amount) {
  return { ...progress, totalXP: progress.totalXP + amount };
}

// ── Test nonces (compliance verification codes) ───────────────────────────
// A short per-attempt code (e.g. KDQ-7F3A) the player must have Claude echo
// inside a real session, proving the submission came from live terminal
// output rather than pasted keywords.

function generateTestNonce() {
  let n;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint16Array(1);
    crypto.getRandomValues(buf);
    n = buf[0];
  } else {
    n = Math.floor(Math.random() * 0x10000);
  }
  return 'KDQ-' + n.toString(16).toUpperCase().padStart(4, '0');
}

// Returns { progress, nonce }. Reuses the stored nonce if one exists (so a
// page reload mid-attempt keeps the same code); otherwise mints a new one.
// Caller is responsible for saving the returned progress.
function ensureTestNonce(progress, testId) {
  const existing = progress.testNonces?.[testId];
  if (existing) return { progress, nonce: existing };
  const nonce = generateTestNonce();
  return {
    progress: {
      ...progress,
      testNonces: { ...(progress.testNonces || {}), [testId]: nonce },
    },
    nonce,
  };
}

function getTestNonce(progress, testId) {
  return progress.testNonces?.[testId] || null;
}

// Rotation on pass: clearing the code means the next visit to the test view
// mints a fresh one, so a passed submission can't be replayed.
function clearTestNonce(progress, testId) {
  if (!progress.testNonces?.[testId]) return progress;
  const next = { ...progress.testNonces };
  delete next[testId];
  return { ...progress, testNonces: next };
}

// Recompute the player's badgeFloor from the testResults map. Idempotent
// — call after recording any test result. Floor N is "complete" when
// all 4 chapters on it (the 4 chapters at the corresponding positions
// in window.CURRICULUM) have their tests passed. Each complete floor
// grants access to the next, capped at floor 4.
//
// Note: lookups are by CURRICULUM array POSITION (display order), not
// by the chapter-ID numeric suffix. Curriculum reshuffles keep stable
// IDs in save data but rearrange display order, and this function
// must follow the display order so the player's "floor 2" matches the
// dashboard's positions 5–8.
const CHAPTERS_PER_FLOOR = 4;
const FLOORS_TOTAL = 4;
function isSideQuestChapter(ch) {
  return !!(ch && ch.sideQuest);
}

function applyBadgeBumpsIfDue(progress) {
  const curriculum = (typeof window !== 'undefined' && window.CURRICULUM) || [];
  if (!curriculum.length) return progress;
  let badge = progress.badgeFloor || 1;
  for (let floor = 1; floor <= FLOORS_TOTAL; floor++) {
    let allPassed = true;
    for (let i = (floor - 1) * CHAPTERS_PER_FLOOR; i < floor * CHAPTERS_PER_FLOOR; i++) {
      const ch = curriculum[i];
      // Side-quest chapters don't gate floor progression — a player can
      // earn the next badge by clearing every MAIN-path chapter on the
      // floor and leave the optional content for later (or never).
      if (isSideQuestChapter(ch)) continue;
      // Either the practical or the theoretical test counts as passing
      // the chapter — keep the dual track parity that ui/test.js exposes.
      if (!ch || !isChapterTestPassed(progress, ch)) { allPassed = false; break; }
    }
    if (allPassed) badge = Math.max(badge, Math.min(FLOORS_TOTAL, floor + 1));
  }
  return badge === progress.badgeFloor ? progress : { ...progress, badgeFloor: badge };
}

function floorForChapter(chapterId) {
  const curriculum = (typeof window !== 'undefined' && window.CURRICULUM) || [];
  const idx = curriculum.findIndex(c => c.id === chapterId);
  if (idx < 0) return 1;
  return Math.min(FLOORS_TOTAL, Math.ceil((idx + 1) / CHAPTERS_PER_FLOOR));
}

// ── Desk Shop (PP cosmetics) ─────────────────────────────────────────────
// Spendable PP is totalXP minus the sum of every recorded purchase price.
// totalXP itself is NEVER mutated by a purchase — the player's level
// (derived from totalXP in engine/scoring.js) must not regress when they
// buy a mug. This keeps educational progress and economy progress on
// separate ledgers while still giving PP an in-world use.

function ownedItemIds(progress) {
  return (progress.ownedItems || []).map(o => o.id);
}

function ownsItem(progress, itemId) {
  return ownedItemIds(progress).includes(itemId);
}

function totalSpent(progress) {
  return (progress.ownedItems || []).reduce((sum, o) => sum + (o.cost || 0), 0);
}

function getSpendablePP(progress) {
  return Math.max(0, (progress.totalXP || 0) - totalSpent(progress));
}

// Returns the updated progress, or the same progress object if the
// purchase is rejected (already owned, insufficient PP, invalid cost).
// Caller checks identity (returned === progress) to detect rejection.
function purchaseItem(progress, itemId, cost) {
  if (!itemId || typeof cost !== 'number' || cost < 0) return progress;
  if (ownsItem(progress, itemId)) return progress;          // double-spend guard
  if (getSpendablePP(progress) < cost) return progress;     // can't afford
  return {
    ...progress,
    ownedItems: [...(progress.ownedItems || []), { id: itemId, cost }],
  };
}

window.Progress = {
  load: loadProgress,
  save: saveProgress,
  reset: resetProgress,
  markLessonComplete,
  recordTestResult,
  unlockChapter,
  isChapterUnlocked,
  isLessonComplete,
  isTestPassed,
  isChapterTestPassed,
  chapterTestIds,
  recordActivity,
  getCurrentStreak,
  unlockAchievement,
  hasAchievement,
  recordKnowledgeCheck,
  isKnowledgeCheckPassed,
  addBonusXP,
  purchaseItem,
  ownsItem,
  ownedItemIds,
  getSpendablePP,
  ensureTestNonce,
  getTestNonce,
  clearTestNonce,
  applyBadgeBumpsIfDue,
  isSideQuestChapter,
  floorForChapter,
  CHAPTERS_PER_FLOOR,
  FLOORS_TOTAL,
};
