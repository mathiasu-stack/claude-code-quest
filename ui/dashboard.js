function renderDashboard() {
  const progress = window.App.progress;
  const main = document.getElementById('main-content');

  const totalXP = CURRICULUM.reduce((sum, ch) => {
    const lessonXP = ch.lessons.reduce((s, l) => s + l.xpReward, 0);
    return sum + lessonXP + ch.xpReward + ch.practicalTest.xpReward;
  }, 0);

  const earned = progress.totalXP;
  const pct = Math.min(100, Math.round((earned / totalXP) * 100));
  const level = Scoring.getLevel(earned);

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
          <div class="xp-sub">${pct}% of total curriculum</div>
        </div>
      </div>

      <h2 class="section-title">Training Curriculum</h2>
      <div class="chapter-grid">
        ${CURRICULUM.map(ch => renderChapterCard(ch, progress)).join('')}
      </div>
    </div>
  `;

  main.querySelectorAll('.chapter-card.unlocked').forEach(card => {
    card.addEventListener('click', () => {
      const chId = card.dataset.chapter;
      window.App.navigate('chapter', { chapterId: chId });
    });
  });
}

function renderChapterCard(ch, progress) {
  const unlocked = Progress.isChapterUnlocked(progress, ch.id);
  const testPassed = Progress.isTestPassed(progress, ch.practicalTest.id);
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

  return `
    <div class="chapter-card ${unlocked ? 'unlocked' : 'locked'} ${testPassed ? 'completed' : ''}" data-chapter="${ch.id}">
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

  const testPassed = Progress.isTestPassed(progress, ch.practicalTest.id);
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

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

window.Dashboard = { renderDashboard, renderChapterView };
