const App = {
  progress: null,

  init() {
    this.progress = Progress.load();
    if (!this.progress.playerName) {
      this.showNameModal();
    } else {
      this.boot();
    }
  },

  boot() {
    this.renderSidebar();
    this.navigate('dashboard');
  },

  showNameModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-logo">🏢</div>
        <h2>Welcome to Acme Corp</h2>
        <p>You've been enrolled in the <strong>Claude Code Quest</strong> training programme. Before we begin, what should we call you?</p>
        <input type="text" id="name-input" class="modal-input" placeholder="Your first name" maxlength="40" autofocus>
        <button class="btn-primary modal-btn" id="start-btn">Start Training →</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('#name-input');
    const btn = overlay.querySelector('#start-btn');

    const submit = () => {
      const name = input.value.trim();
      if (!name) { input.focus(); return; }
      this.progress.playerName = name;
      Progress.save(this.progress);
      overlay.remove();
      this.boot();
    };

    btn.addEventListener('click', submit);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    setTimeout(() => input.focus(), 100);
  },

  navigate(view, params = {}) {
    switch (view) {
      case 'dashboard':
        Dashboard.renderDashboard();
        break;
      case 'chapter':
        Dashboard.renderChapterView(params.chapterId);
        break;
      case 'lesson':
        Lesson.renderLesson(params.chapterId, params.lessonId);
        break;
      case 'test':
        TestView.renderTest(params.chapterId);
        break;
      default:
        Dashboard.renderDashboard();
    }
    this.updateSidebarActive(view, params);
  },

  renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    const progress = this.progress;
    const level = Scoring.getLevel(progress.totalXP);

    sidebar.innerHTML = `
      <div class="sidebar-brand">
        <div class="brand-logo">🏢</div>
        <div>
          <div class="brand-name">Acme Corp</div>
          <div class="brand-sub">Claude Code Quest</div>
        </div>
      </div>

      <div class="sidebar-player" id="sidebar-player-info">
        <div class="player-name">${escHtml(progress.playerName)}</div>
        <div class="player-level">${level.label}</div>
        <div class="player-xp">${Scoring.formatXP(progress.totalXP)}</div>
        <div class="level-bar">
          <div class="level-fill" style="width:${level.progressToNext}%"></div>
        </div>
        ${level.next ? `<div class="level-next">Next: ${level.next.label}</div>` : '<div class="level-next">Max Level!</div>'}
      </div>

      <nav class="sidebar-nav" id="sidebar-nav">
        <div class="nav-item ${isActive('dashboard')}" data-nav="dashboard">
          <span class="nav-icon">🏠</span><span>Dashboard</span>
        </div>
        ${CURRICULUM.map(ch => {
          const unlocked = Progress.isChapterUnlocked(progress, ch.id);
          const passed = Progress.isTestPassed(progress, ch.practicalTest.id);
          return `
            <div class="nav-item chapter-nav ${unlocked ? '' : 'nav-locked'} ${passed ? 'nav-complete' : ''}"
                 data-nav="chapter" data-chapter="${ch.id}">
              <span class="nav-icon">${unlocked ? ch.icon : '🔒'}</span>
              <span class="nav-chapter-title">${ch.title}</span>
              ${passed ? '<span class="nav-tick">✓</span>' : ''}
            </div>
          `;
        }).join('')}
      </nav>

      <div class="sidebar-reset">
        <button class="reset-btn" id="reset-progress-btn">Reset Progress</button>
      </div>
    `;

    function isActive(view) { return ''; }

    sidebar.querySelectorAll('.nav-item[data-nav="dashboard"]').forEach(el => {
      el.addEventListener('click', () => App.navigate('dashboard'));
    });

    sidebar.querySelectorAll('.nav-item.chapter-nav:not(.nav-locked)').forEach(el => {
      el.addEventListener('click', () => App.navigate('chapter', { chapterId: el.dataset.chapter }));
    });

    document.getElementById('reset-progress-btn').addEventListener('click', () => {
      if (confirm('Reset all progress? This cannot be undone.')) {
        Progress.reset();
        window.location.reload();
      }
    });
  },

  refreshSidebar() {
    this.renderSidebar();
  },

  updateSidebarActive(view, params) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (view === 'dashboard') {
      document.querySelector('[data-nav="dashboard"]')?.classList.add('active');
    } else if (params.chapterId) {
      document.querySelector(`[data-chapter="${params.chapterId}"]`)?.classList.add('active');
    }
  },
};

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
