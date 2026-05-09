function renderLesson(chapterId, lessonId) {
  const ch = CURRICULUM.find(c => c.id === chapterId);
  if (!ch) return;
  const lesson = ch.lessons.find(l => l.id === lessonId);
  if (!lesson) return;

  const progress = window.App.progress;
  const alreadyDone = Progress.isLessonComplete(progress, lessonId);
  const checkResolved = !lesson.check || Progress.isKnowledgeCheckPassed(progress, lessonId) || (progress.knowledgeChecks?.[lessonId]?.attempts > 0);
  const lessonIdx = ch.lessons.findIndex(l => l.id === lessonId);
  const main = document.getElementById('main-content');

  main.innerHTML = `
    <div class="lesson-view">
      <button class="back-btn" id="back-to-chapter">← ${ch.title}</button>

      <div class="lesson-header">
        <div class="lesson-meta-top">
          <span class="chapter-tag">${ch.icon} ${ch.title}</span>
          <span class="lesson-position">Lesson ${lessonIdx + 1} of ${ch.lessons.length}</span>
          <span class="xp-badge">+${lesson.xpReward} PP</span>
        </div>
        <h1 class="lesson-title">${lesson.title}</h1>
      </div>

      ${lesson.videos && lesson.videos.length > 0
        ? lesson.videos.map(v => `<div class="video-embed">${v}</div>`).join('')
        : '<div class="video-placeholder"><span class="video-icon">▶</span><span>Video lesson coming soon</span></div>'
      }

      <div class="lesson-content">
        ${lesson.content}
      </div>

      ${buildKnowledgeCheck(lesson, progress, alreadyDone)}

      ${lesson.lastVerified ? `
      <div class="verify-stamp">
        <span class="verify-icon">✓</span>
        Verified against Claude Code ${lesson.verifiedAgainstVersion} · ${formatVerifyDate(lesson.lastVerified)}
      </div>` : ''}

      <div class="lesson-footer">
        ${alreadyDone
          ? `<div class="already-done">✓ You've completed this lesson</div>
             ${buildContinueCta(ch, lessonId)}`
          : `<button class="btn-primary complete-btn ${checkResolved ? '' : 'is-locked'}" id="mark-complete" ${checkResolved ? '' : 'disabled'}>
               ${checkResolved ? `Mark as Complete — Earn ${lesson.xpReward} PP →` : 'Answer the knowledge check above to continue'}
             </button>`
        }
        ${buildLessonNav(ch, lessonId)}
      </div>
    </div>
  `;

  document.getElementById('back-to-chapter').addEventListener('click', () => {
    window.App.navigate('chapter', { chapterId });
  });

  if (!alreadyDone) {
    const completeBtn = document.getElementById('mark-complete');
    completeBtn.addEventListener('click', () => {
      if (completeBtn.disabled) return;
      completeLesson(ch, lesson);
    });
  }

  buildNavListeners(ch, lessonId);
  bindContinueCta();
  bindKnowledgeCheck(ch, lesson);
}

function completeLesson(ch, lesson) {
  let progress = window.App.progress;
  progress = Progress.markLessonComplete(progress, lesson.id, lesson.xpReward);

  const streakBefore = progress.currentStreak || 0;
  progress = Progress.recordActivity(progress);
  const streakAfter = progress.currentStreak || 0;

  const allDone = ch.lessons.every(l => Progress.isLessonComplete(progress, l.id));
  if (allDone) {
    progress = Progress.recordTestResult(progress, ch.practicalTest.id + '_unlock_signal', { passed: false, score: 0 }, 0);
  }

  if (window.Achievements) {
    progress = Achievements.checkAfterLesson(progress, ch, lesson);
    progress = Achievements.checkAfterActivity(progress, streakBefore, streakAfter);
  }

  Progress.save(progress);
  window.App.progress = progress;

  window.App.refreshSidebar();
  showXpToast(lesson.xpReward);

  const btn = document.getElementById('mark-complete');
  if (btn) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="already-done">✓ Lesson complete!</div>
      ${buildContinueCta(ch, lesson.id)}
    `;
    btn.replaceWith(...Array.from(wrapper.childNodes));
    bindContinueCta();
  }
}

function buildKnowledgeCheck(lesson, progress, lessonAlreadyDone) {
  if (!lesson.check) return '';
  const c = lesson.check;
  const record = progress.knowledgeChecks?.[lesson.id];
  const passed = !!record?.correct;
  const attempted = !!record;
  const locked = lessonAlreadyDone || attempted;

  return `
    <div class="knowledge-check ${locked ? 'kc-locked' : ''}" id="kc-block">
      <div class="kc-header">
        <span class="kc-icon">🎯</span>
        <span class="kc-label">Knowledge Check</span>
        ${passed ? '<span class="kc-badge correct">✓ Correct</span>' : (attempted ? '<span class="kc-badge resolved">Answered</span>' : '')}
      </div>
      <div class="kc-question">${c.question}</div>
      <div class="kc-options">
        ${c.options.map((opt, i) => {
          const isAnswer = i === c.correctIndex;
          let cls = '';
          if (locked) {
            if (isAnswer) cls = 'kc-correct';
          }
          return `
            <button class="kc-option ${cls}" data-idx="${i}" ${locked ? 'disabled' : ''}>
              <span class="kc-option-letter">${String.fromCharCode(65 + i)}</span>
              <span class="kc-option-text">${opt}</span>
              ${locked && isAnswer ? '<span class="kc-tick">✓</span>' : ''}
            </button>
          `;
        }).join('')}
      </div>
      <div class="kc-feedback" id="kc-feedback">${locked ? `<div class="kc-result ${passed ? 'correct' : 'wrong'}">${c.explanation}</div>` : ''}</div>
    </div>
  `;
}

function bindKnowledgeCheck(ch, lesson) {
  if (!lesson.check) return;
  const block = document.getElementById('kc-block');
  if (!block || block.classList.contains('kc-locked')) return;

  const buttons = block.querySelectorAll('.kc-option');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      handleCheckAnswer(ch, lesson, idx);
    });
  });
}

function handleCheckAnswer(ch, lesson, chosenIdx) {
  const c = lesson.check;
  const correct = chosenIdx === c.correctIndex;
  let progress = window.App.progress;
  const wasFirstAttempt = !progress.knowledgeChecks?.[lesson.id];
  const alreadyPassed = Progress.isKnowledgeCheckPassed(progress, lesson.id);

  let bonus = 0;
  if (correct && wasFirstAttempt && !alreadyPassed) {
    bonus = 5;
    progress = Progress.addBonusXP(progress, bonus);
  }
  progress = Progress.recordKnowledgeCheck(progress, lesson.id, correct, wasFirstAttempt);
  if (window.Achievements && correct) {
    progress = Achievements.checkAfterKnowledgeCheck(progress);
  }
  Progress.save(progress);
  window.App.progress = progress;
  window.App.refreshSidebar();

  const block = document.getElementById('kc-block');
  block.classList.add('kc-locked');
  block.querySelectorAll('.kc-option').forEach(btn => {
    btn.disabled = true;
    const i = Number(btn.dataset.idx);
    if (i === c.correctIndex) btn.classList.add('kc-correct');
    if (i === chosenIdx && !correct) btn.classList.add('kc-wrong');
  });

  const header = block.querySelector('.kc-header');
  if (!header.querySelector('.kc-badge')) {
    const badge = document.createElement('span');
    badge.className = `kc-badge ${correct ? 'correct' : 'resolved'}`;
    badge.textContent = correct ? '✓ Correct' : 'Answered';
    header.appendChild(badge);
  }

  const fb = document.getElementById('kc-feedback');
  fb.innerHTML = `
    <div class="kc-result ${correct ? 'correct' : 'wrong'}">
      <strong>${correct ? '✓ Correct!' : '✗ Not quite.'}</strong> ${c.explanation}
      ${bonus ? `<div class="kc-bonus">+${bonus} PP bonus for getting it on the first try</div>` : ''}
    </div>
  `;

  if (bonus) showXpToast(bonus);

  const completeBtn = document.getElementById('mark-complete');
  if (completeBtn && !completeBtn.dataset.unlocked) {
    completeBtn.disabled = false;
    completeBtn.classList.remove('is-locked');
    completeBtn.textContent = `Mark as Complete — Earn ${lesson.xpReward} PP →`;
    completeBtn.dataset.unlocked = '1';
  }
}

function buildContinueCta(ch, currentLessonId) {
  const idx = ch.lessons.findIndex(l => l.id === currentLessonId);
  const next = ch.lessons[idx + 1];
  if (next) {
    return `<button class="btn-primary continue-cta" id="continue-next" data-chapter="${ch.id}" data-lesson="${next.id}">Continue: ${next.title} →</button>`;
  }
  return `<button class="btn-primary continue-cta" id="continue-test" data-chapter="${ch.id}">Take the Practical Test →</button>`;
}

function bindContinueCta() {
  const nextBtn = document.getElementById('continue-next');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      window.App.navigate('lesson', { chapterId: nextBtn.dataset.chapter, lessonId: nextBtn.dataset.lesson });
    });
  }
  const testBtn = document.getElementById('continue-test');
  if (testBtn) {
    testBtn.addEventListener('click', () => {
      window.App.navigate('test', { chapterId: testBtn.dataset.chapter });
    });
  }
}

function buildLessonNav(ch, currentLessonId) {
  const idx = ch.lessons.findIndex(l => l.id === currentLessonId);
  const prev = ch.lessons[idx - 1];
  const next = ch.lessons[idx + 1];

  return `
    <div class="lesson-nav">
      ${prev ? `<button class="btn-secondary nav-prev" data-lesson="${prev.id}" data-chapter="${ch.id}">← ${prev.title}</button>` : '<span></span>'}
      ${next ? `<button class="btn-secondary nav-next" data-lesson="${next.id}" data-chapter="${ch.id}">${next.title} →</button>` : '<span></span>'}
    </div>
  `;
}

function buildNavListeners(ch, currentLessonId) {
  document.querySelectorAll('.nav-prev, .nav-next').forEach(btn => {
    btn.addEventListener('click', () => {
      window.App.navigate('lesson', { chapterId: btn.dataset.chapter, lessonId: btn.dataset.lesson });
    });
  });
}

function showXpToast(amount) {
  if (!amount) return;
  const toast = document.createElement('div');
  toast.className = 'xp-toast';
  toast.textContent = `+${amount} PP earned!`;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('visible'), 50);
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

function formatVerifyDate(dateStr) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${day} ${months[month - 1]} ${year}`;
}

window.Lesson = { renderLesson, showXpToast };
