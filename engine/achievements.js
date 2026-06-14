const ACHIEVEMENTS = [
  { id: 'first-lesson', icon: '🌱', label: 'First Day on the Job', description: 'Complete your first lesson.' },
  { id: 'quiz-ace', icon: '🎯', label: 'Quick Study', description: 'Get a knowledge check right.' },
  { id: 'first-test-pass', icon: '🏅', label: 'Probation Cleared', description: 'Pass your first practical assessment.' },
  { id: 'first-try', icon: '⚡', label: 'Nailed It', description: 'Pass an assessment on your first attempt.' },
  { id: 'perfectionist', icon: '💎', label: 'Perfectionist', description: 'Score 100% on a practical assessment.' },
  { id: 'chapter-clear', icon: '📚', label: 'Module Complete', description: 'Finish every lesson and test in a chapter.' },
  { id: 'streak-3', icon: '🔥', label: 'Warming Up', description: '3-day learning streak.' },
  { id: 'streak-7', icon: '🔥', label: 'On a Roll', description: '7-day learning streak.' },
  { id: 'streak-30', icon: '🌋', label: 'Unstoppable', description: '30-day learning streak.' },
  { id: 'graduated', icon: '🎓', label: 'VP of AI', description: 'Pass every practical assessment in the curriculum.' },
];

const ACHIEVEMENT_BY_ID = ACHIEVEMENTS.reduce((m, a) => { m[a.id] = a; return m; }, {});

function unlock(progress, id) {
  if (Progress.hasAchievement(progress, id)) return progress;
  const next = Progress.unlockAchievement(progress, id);
  showAchievementToast(ACHIEVEMENT_BY_ID[id]);
  return next;
}

function checkAfterLesson(progress, ch, lesson) {
  if (progress.completedLessons.length >= 1) {
    progress = unlock(progress, 'first-lesson');
  }
  // chapter-clear: all lessons of this chapter complete AND its test passed
  const allLessonsDone = ch.lessons.every(l => Progress.isLessonComplete(progress, l.id));
  if (allLessonsDone && Progress.isChapterTestPassed(progress, ch)) {
    progress = unlock(progress, 'chapter-clear');
  }
  return progress;
}

function checkAfterTest(progress, ch, test, result, attemptsBefore, wasAlreadyPassed) {
  if (!result.passed) return progress;

  if (!wasAlreadyPassed) {
    progress = unlock(progress, 'first-test-pass');
  }
  if (attemptsBefore === 0 && !wasAlreadyPassed) {
    progress = unlock(progress, 'first-try');
  }
  if (result.score === 100) {
    progress = unlock(progress, 'perfectionist');
  }

  // chapter-clear: all lessons done AND this test now passed
  const allLessonsDone = ch.lessons.every(l => Progress.isLessonComplete(progress, l.id));
  if (allLessonsDone && Progress.isTestPassed(progress, test.id)) {
    progress = unlock(progress, 'chapter-clear');
  }

  // graduated: every chapter's test passed (either track counts)
  const allTestsPassed = (window.CURRICULUM || []).every(c => Progress.isChapterTestPassed(progress, c));
  if (allTestsPassed) {
    progress = unlock(progress, 'graduated');
  }

  return progress;
}

function checkAfterActivity(progress, streakBefore, streakAfter) {
  if (streakAfter <= streakBefore) return progress;
  if (streakAfter >= 3) progress = unlock(progress, 'streak-3');
  if (streakAfter >= 7) progress = unlock(progress, 'streak-7');
  if (streakAfter >= 30) progress = unlock(progress, 'streak-30');
  return progress;
}

function checkAfterKnowledgeCheck(progress) {
  return unlock(progress, 'quiz-ace');
}

function showAchievementToast(achievement) {
  if (!achievement) return;
  const toast = document.createElement('div');
  toast.className = 'achievement-toast';
  toast.innerHTML = `
    <div class="ach-toast-icon">${achievement.icon}</div>
    <div class="ach-toast-body">
      <div class="ach-toast-eyebrow">Achievement unlocked</div>
      <div class="ach-toast-label">${achievement.label}</div>
      <div class="ach-toast-desc">${achievement.description}</div>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('visible'), 80);
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 400);
  }, 4200);
  // Audio chime — uses the Play module's SFX bridge if loaded.
  try { window.PlayAudio?.achievement?.(); } catch {}
}

window.Achievements = {
  ALL: ACHIEVEMENTS,
  byId: id => ACHIEVEMENT_BY_ID[id],
  checkAfterLesson,
  checkAfterTest,
  checkAfterActivity,
  checkAfterKnowledgeCheck,
};
