function renderLesson(chapterId, lessonId) {
  const ch = CURRICULUM.find(c => c.id === chapterId);
  if (!ch) return;
  const lesson = ch.lessons.find(l => l.id === lessonId);
  if (!lesson) return;

  const progress = window.App.progress;
  const alreadyDone = Progress.isLessonComplete(progress, lessonId);
  const main = document.getElementById('main-content');

  main.innerHTML = `
    <div class="lesson-view">
      <button class="back-btn" id="back-to-chapter">← ${ch.title}</button>

      <div class="lesson-header">
        <div class="lesson-meta-top">
          <span class="chapter-tag">${ch.icon} ${ch.title}</span>
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

      ${lesson.lastVerified ? `
      <div class="verify-stamp">
        <span class="verify-icon">✓</span>
        Verified against Claude Code ${lesson.verifiedAgainstVersion} · ${formatVerifyDate(lesson.lastVerified)}
      </div>` : ''}

      <div class="lesson-footer">
        ${alreadyDone
          ? `<div class="already-done">✓ You've completed this lesson</div>
             ${buildContinueCta(ch, lessonId)}`
          : `<button class="btn-primary complete-btn" id="mark-complete">Mark as Complete — Earn ${lesson.xpReward} PP →</button>`
        }
        ${buildLessonNav(ch, lessonId)}
      </div>
    </div>
  `;

  document.getElementById('back-to-chapter').addEventListener('click', () => {
    window.App.navigate('chapter', { chapterId });
  });

  if (!alreadyDone) {
    document.getElementById('mark-complete').addEventListener('click', () => {
      completeLesson(ch, lesson);
    });
  }

  buildNavListeners(ch, lessonId);
  bindContinueCta();
}

function completeLesson(ch, lesson) {
  let progress = window.App.progress;
  progress = Progress.markLessonComplete(progress, lesson.id, lesson.xpReward);
  Progress.save(progress);
  window.App.progress = progress;

  const allDone = ch.lessons.every(l => Progress.isLessonComplete(progress, l.id));
  if (allDone) {
    progress = Progress.recordTestResult(progress, ch.practicalTest.id + '_unlock_signal', { passed: false, score: 0 }, 0);
  }

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
