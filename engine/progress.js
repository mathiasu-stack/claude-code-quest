const STORAGE_KEY = 'ccq_progress';

const DEFAULT_PROGRESS = {
  playerName: '',
  totalXP: 0,
  completedLessons: [],
  testResults: {},
  unlockedChapters: ['ch01'],
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
};
