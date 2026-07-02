function renderDashboard() {
  const progress = window.App.progress;
  const main = document.getElementById('main-content');

  // Denominator = the CORE curriculum only — optional side quests would
  // otherwise make 100% unreachable for players who skip them.
  const totalXP = CURRICULUM.filter(ch => !Progress.isSideQuestChapter(ch)).reduce((sum, ch) => {
    const lessonXP = ch.lessons.reduce((s, l) => s + l.xpReward, 0);
    return sum + lessonXP + ch.xpReward + ch.practicalTest.xpReward;
  }, 0);

  const earned = progress.totalXP;
  const pct = Math.min(100, Math.round((earned / totalXP) * 100));
  const level = Scoring.getLevel(earned);

  // Story banner: once the Kedash Protocol has started (tier >= 1, i.e.
  // ch01's test passed), nudge 2D-first players toward the office where
  // the narrative actually plays out. window.Story is only present when
  // the 3D bundle has loaded; fall back to the tier-1 derivation.
  const storyTier = window.Story?.getTier?.() ?? (Progress.isTestPassed(progress, 'ch01-test') ? 1 : 0);

  main.innerHTML = `
    <div class="dashboard">
      <div class="dashboard-header">
        <div class="welcome-block">
          <span class="welcome-eyebrow">Welcome back,</span>
          <h1 class="welcome-name">${escapeHtml(progress.playerName || 'New Hire')}</h1>
          <span class="welcome-title">${level.label} · ${level.rank}</span>
        </div>
        <div class="xp-summary">
          <div class="xp-big">${Scoring.formatXP(earned)}</div>
          <div class="xp-label">Performance Points</div>
          <div class="xp-progress-bar">
            <div class="xp-progress-fill" style="width:${pct}%"></div>
          </div>
          <div class="xp-sub">${pct}% of core curriculum</div>
        </div>
      </div>

      <div class="play-cta-row">
        <button class="btn-primary play-cta-btn" id="play-cta-btn">🎮 Play in 3D</button>
        <span class="play-cta-sub">Walk around the office, meet your colleagues, learn lessons in person.</span>
      </div>

      ${storyTier >= 1 ? `
      <div class="story-banner">
        <span class="story-banner-text">🏢 Something is off at Kedash Corp. Your colleagues are choosing their words carefully…</span>
        <button class="story-banner-btn" id="story-banner-btn">Continue in the office ▸</button>
      </div>` : ''}

      ${renderTrophyCabinet(progress)}

      <h2 class="section-title">Training Curriculum</h2>
      <div class="chapter-grid">
        ${CURRICULUM.filter(ch => !Progress.isSideQuestChapter(ch))
          .map(ch => renderChapterCard(ch, progress)).join('')}
      </div>

      ${CURRICULUM.some(ch => Progress.isSideQuestChapter(ch)) ? `
        <h2 class="section-title side-quest-title">
          <span class="side-quest-icon">★</span> Side Quests
          <span class="side-quest-tag">Optional · Specialist tracks</span>
        </h2>
        <div class="chapter-grid side-quest-grid">
          ${CURRICULUM.filter(ch => Progress.isSideQuestChapter(ch))
            .map(ch => renderChapterCard(ch, progress)).join('')}
        </div>` : ''}
    </div>
    <!-- Fallback FAB: fixed-position so it's reachable even if any
         layout/cascade issue (Firefox Android) hides the inline CTA. -->
    <button class="play-fab" id="play-fab-btn" aria-label="Play in 3D">
      <span class="play-fab-icon">🎮</span><span class="play-fab-text">Play 3D</span>
    </button>
  `;

  main.querySelectorAll('.chapter-card.unlocked').forEach(card => {
    card.addEventListener('click', () => {
      const chId = card.dataset.chapter;
      window.App.navigate('chapter', { chapterId: chId });
    });
  });

  const playBtn = document.getElementById('play-cta-btn');
  if (playBtn) playBtn.addEventListener('click', () => window.App.navigate('play'));
  const fabBtn = document.getElementById('play-fab-btn');
  if (fabBtn) fabBtn.addEventListener('click', () => window.App.navigate('play'));
  const trophyPlayBtn = document.getElementById('trophy-play-btn');
  if (trophyPlayBtn) trophyPlayBtn.addEventListener('click', () => window.App.navigate('play'));
  const storyBannerBtn = document.getElementById('story-banner-btn');
  if (storyBannerBtn) storyBannerBtn.addEventListener('click', () => window.App.navigate('play'));
}

function renderChapterCard(ch, progress) {
  const unlocked = Progress.isChapterUnlocked(progress, ch.id);
  // Either track passes the chapter — practical (hands-on) or theoretical (MCQ).
  const testPassed = Progress.isChapterTestPassed(progress, ch);
  const completedLessons = ch.lessons.filter(l => Progress.isLessonComplete(progress, l.id)).length;
  const totalLessons = ch.lessons.length;
  const lessonPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const totalXP = ch.lessons.reduce((s, l) => s + l.xpReward, 0) + ch.xpReward + ch.practicalTest.xpReward;

  let statusBadge = '';
  if (!unlocked) {
    statusBadge = '<span class="badge badge-locked">🔒 Locked</span>';
  } else if (testPassed) {
    statusBadge = '<span class="badge badge-complete">✓ Complete</span>';
  } else if (completedLessons > 0) {
    statusBadge = '<span class="badge badge-progress">In Progress</span>';
  } else {
    statusBadge = '<span class="badge badge-available">Available</span>';
  }

  const sideQuest = Progress.isSideQuestChapter(ch);
  return `
    <div class="chapter-card ${unlocked ? 'unlocked' : 'locked'} ${testPassed ? 'completed' : ''} ${sideQuest ? 'is-side-quest' : ''}" data-chapter="${ch.id}">
      ${sideQuest ? '<div class="card-side-quest-tag">★ Side Quest</div>' : ''}
      <div class="card-icon">${ch.icon}</div>
      <div class="card-body">
        <div class="card-eyebrow">${ch.subtitle}</div>
        <h3 class="card-title">${ch.title}</h3>
        <div class="card-meta">
          <span>${totalLessons} lessons</span>
          <span>${totalXP} PP available</span>
        </div>
        ${unlocked ? `
          <div class="card-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width:${lessonPct}%"></div>
            </div>
            <span class="progress-label">${completedLessons}/${totalLessons} lessons</span>
          </div>
        ` : ''}
        ${statusBadge}
      </div>
    </div>
  `;
}

function renderChapterView(chapterId) {
  const ch = CURRICULUM.find(c => c.id === chapterId);
  if (!ch) return;
  const progress = window.App.progress;
  const main = document.getElementById('main-content');
  const unlocked = Progress.isChapterUnlocked(progress, ch.id);
  if (!unlocked) { renderDashboard(); return; }

  const testPassed = Progress.isChapterTestPassed(progress, ch);
  const allLessonsDone = ch.lessons.every(l => Progress.isLessonComplete(progress, l.id));

  main.innerHTML = `
    <div class="chapter-view">
      <button class="back-btn" id="back-to-dashboard">← Back to Dashboard</button>
      <div class="chapter-header">
        <span class="chapter-icon">${ch.icon}</span>
        <div>
          <div class="chapter-eyebrow">${ch.subtitle}</div>
          <h1 class="chapter-title">${ch.title}</h1>
        </div>
      </div>

      <div class="lesson-list">
        ${ch.lessons.map((l, idx) => {
          const done = Progress.isLessonComplete(progress, l.id);
          return `
            <div class="lesson-item ${done ? 'done' : ''}" data-lesson="${l.id}" data-chapter="${ch.id}">
              <span class="lesson-num">${idx + 1}</span>
              <span class="lesson-title">${l.title}</span>
              <span class="lesson-xp">+${l.xpReward} PP</span>
              ${done ? '<span class="lesson-check">✓</span>' : ''}
            </div>
          `;
        }).join('')}
        <div class="lesson-item test-item ${!allLessonsDone && !testPassed ? 'disabled' : ''} ${testPassed ? 'done' : ''}" id="open-test">
          <span class="lesson-num">★</span>
          <span class="lesson-title">Practical Assessment</span>
          <span class="lesson-xp">+${ch.practicalTest.xpReward} PP</span>
          ${testPassed ? '<span class="lesson-check">✓ Passed</span>' : (!allLessonsDone ? '<span class="lesson-locked-note">Complete lessons first</span>' : '')}
        </div>
      </div>
    </div>
  `;

  document.getElementById('back-to-dashboard').addEventListener('click', () => {
    window.App.navigate('dashboard');
  });

  main.querySelectorAll('.lesson-item[data-lesson]').forEach(el => {
    el.addEventListener('click', () => {
      window.App.navigate('lesson', { chapterId: ch.id, lessonId: el.dataset.lesson });
    });
  });

  const testEl = document.getElementById('open-test');
  if (!testEl.classList.contains('disabled')) {
    testEl.addEventListener('click', () => {
      window.App.navigate('test', { chapterId: ch.id });
    });
  }
}

function renderTrophyCabinet(progress) {
  if (!window.Achievements) return '';
  const all = Achievements.ALL;
  const unlockedSet = new Set(progress.unlockedAchievements || []);
  const unlockedCount = all.filter(a => unlockedSet.has(a.id)).length;
  const streak = Progress.getCurrentStreak(progress);

  return `
    <section class="trophy-cabinet">
      <div class="trophy-header">
        <h2 class="trophy-title">Trophy Cabinet</h2>
        <div class="trophy-meta">
          <button class="btn-primary trophy-play-btn" id="trophy-play-btn">🎮 Play in 3D</button>
          <span class="trophy-count">${unlockedCount} / ${all.length} unlocked</span>
          ${streak > 0 ? `<span class="trophy-streak">🔥 ${streak}-day streak</span>` : ''}
        </div>
      </div>
      <div class="trophy-grid">
        ${all.map(a => {
          const got = unlockedSet.has(a.id);
          return `
            <div class="trophy ${got ? 'trophy-got' : 'trophy-locked'}" title="${escapeHtml(a.description)}">
              <div class="trophy-icon">${got ? a.icon : '🔒'}</div>
              <div class="trophy-label">${a.label}</div>
              <div class="trophy-desc">${a.description}</div>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

window.Dashboard = { renderDashboard, renderChapterView };
