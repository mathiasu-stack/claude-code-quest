const STORAGE_KEY = 'ccq_progress';

const DEFAULT_PROGRESS = {
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
};

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function resetProgress() {
  localStorage.removeItem(STORAGE_KEY);
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

function addBonusXP(progress, amount) {
  return { ...progress, totalXP: progress.totalXP + amount };
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
  recordActivity,
  getCurrentStreak,
  unlockAchievement,
  hasAchievement,
  recordKnowledgeCheck,
  isKnowledgeCheckPassed,
  addBonusXP,
};
