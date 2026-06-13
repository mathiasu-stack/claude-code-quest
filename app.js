const App = {
  progress: null,
  _currentView: 'dashboard',
  _currentParams: {},

  init() {
    this.progress = Progress.load();
    if (!this.progress.playerName) {
      this.showNameModal();
    } else {
      this.boot();
    }
  },

  touchActivity() {
    const before = this.progress.currentStreak || 0;
    this.progress = Progress.recordActivity(this.progress);
    Progress.save(this.progress);
    if (window.Achievements) {
      this.progress = Achievements.checkAfterActivity(this.progress, before, this.progress.currentStreak);
      Progress.save(this.progress);
    }
  },

  boot() {
    this.touchActivity();
    this.renderSidebar();
    this.setupMobileNav();
    this.navigate('landing');
  },

  showNameModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-logo">🏢</div>
        <h2>Welcome to Kedash Corp</h2>
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
    if (this._currentView === 'play' && view !== 'play' && window.Play) {
      window.Play.stop();
    }
    document.body.classList.toggle('in-play', view === 'play');
    this._currentView = view;
    this._currentParams = params;
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
      case 'play':
        this.renderPlayView();
        break;
      case 'landing':
        this.renderLanding();
        break;
      case 'shop':
        if (window.Shop) window.Shop.render();
        else Dashboard.renderDashboard();
        break;
      default:
        Dashboard.renderDashboard();
    }
    this.updateSidebarActive(view, params);
  },

  renderLanding() {
    const main = document.getElementById('main-content');
    const sidebar = document.getElementById('sidebar');
    // The landing page is the front door — keep the sidebar tucked away
    // so the player sees the title screen, not the chapter list.
    if (sidebar) sidebar.classList.add('hidden-on-landing');
    const playerName = escHtml(this.progress?.playerName || 'New Hire');
    const isReturning = (this.progress?.totalXP || 0) > 0
      || (this.progress?.completedLessons?.length || 0) > 0;
    const ctaLabel = isReturning ? 'CONTINUE' : 'BEGIN TRAINING';
    const subline = isReturning
      ? `Welcome back, <strong>${playerName}</strong>. Kedash Corp will see you now.`
      : `Welcome, <strong>${playerName}</strong>. Your first day at Kedash Corp begins now.`;

    main.innerHTML = `
      <div class="landing-view">
        <div class="landing-skyline" aria-hidden="true">
          <!-- Stylized Kedash tower silhouette, pure SVG so it inherits
               the brand palette and scales without artifacts. -->
          <svg viewBox="0 0 800 540" preserveAspectRatio="xMidYMax slice">
            <defs>
              <linearGradient id="ldgSky" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="#162042"/>
                <stop offset="60%" stop-color="#0a1230"/>
                <stop offset="100%" stop-color="#05091e"/>
              </linearGradient>
              <linearGradient id="ldgTower" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="#3a4a78"/>
                <stop offset="100%" stop-color="#0e1830"/>
              </linearGradient>
              <radialGradient id="ldgMoon" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stop-color="#ffefb6" stop-opacity="0.9"/>
                <stop offset="60%" stop-color="#ffefb6" stop-opacity="0.25"/>
                <stop offset="100%" stop-color="#ffefb6" stop-opacity="0"/>
              </radialGradient>
            </defs>
            <rect width="800" height="540" fill="url(#ldgSky)"/>
            <!-- Moon / corporate sun -->
            <circle cx="640" cy="120" r="120" fill="url(#ldgMoon)"/>
            <circle cx="640" cy="120" r="38" fill="#fff5d0" opacity="0.75"/>
            <!-- Distant towers -->
            <g opacity="0.55">
              <rect x="60"  y="320" width="60"  height="220" fill="#1a2444"/>
              <rect x="130" y="280" width="46"  height="260" fill="#1a2444"/>
              <rect x="730" y="290" width="50"  height="250" fill="#1a2444"/>
            </g>
            <!-- Kedash tower (center, taller) -->
            <rect x="320" y="80" width="160" height="460" fill="url(#ldgTower)" stroke="#c9a44c" stroke-width="2"/>
            <rect x="320" y="80" width="160" height="20"  fill="#c9a44c"/>
            <rect x="386" y="60" width="28"  height="22"  fill="#c9a44c"/>
            <!-- Window grid (warm office lights) -->
            ${this._landingWindowGrid()}
            <!-- Ground band -->
            <rect x="0" y="500" width="800" height="40" fill="#05091e"/>
            <!-- Gold accent strip -->
            <rect x="320" y="498" width="160" height="3" fill="#c9a44c"/>
          </svg>
        </div>

        <div class="landing-content">
          <div class="landing-logo">🏢</div>
          <h1 class="landing-title">CLAUDE CODE<br>QUEST</h1>
          <div class="landing-subtitle">Kedash Corp · Training Programme</div>
          <p class="landing-flavor">${subline}</p>
          <button class="landing-play-btn" id="landing-play-btn">
            <span class="landing-play-icon">▶</span>
            <span class="landing-play-label">${ctaLabel}</span>
          </button>
          <button class="landing-secondary-btn" id="landing-dashboard-btn">
            View dashboard
          </button>
          ${isReturning ? `
            <div class="landing-stats">
              <span>Tier: <strong>${escHtml(this.getCurrentTierLabel())}</strong></span>
              <span>·</span>
              <span><strong>${this.progress?.totalXP || 0}</strong> PP</span>
              <span>·</span>
              <span>Day-<strong>${this.progress?.currentStreak || 1}</strong> streak</span>
            </div>` : ''}
        </div>
      </div>
    `;

    document.getElementById('landing-play-btn').addEventListener('click', () => {
      if (sidebar) sidebar.classList.remove('hidden-on-landing');
      this.navigate('play');
    });
    document.getElementById('landing-dashboard-btn').addEventListener('click', () => {
      if (sidebar) sidebar.classList.remove('hidden-on-landing');
      this.navigate('dashboard');
    });
  },

  _landingWindowGrid() {
    // 8 columns × 18 rows of small office windows, ~70 % lit warm.
    const cellW = 14, cellH = 18, ox = 332, oy = 110;
    const out = [];
    for (let r = 0; r < 18; r++) {
      for (let c = 0; c < 8; c++) {
        // Deterministic flicker pattern — seeded by r/c so the SVG is
        // identical on every render but feels alive.
        const lit = ((r * 7 + c * 11) % 13) > 4;
        const fill = lit ? '#ffe28a' : '#0b1530';
        const op = lit ? 0.85 : 1;
        out.push(`<rect x="${ox + c * cellW}" y="${oy + r * cellH + (c%2?2:0)}" width="9" height="11" fill="${fill}" opacity="${op}"/>`);
      }
    }
    return out.join('');
  },

  renderPlayView() {
    const main = document.getElementById('main-content');
    const playerName = escHtml(this.progress?.playerName || 'New Hire');
    main.innerHTML = `
      <div class="play-view">
        <div class="play-canvas-host" id="play-canvas-host"></div>
        <button class="play-back-btn" id="play-back-btn">← Dashboard</button>
        <div class="play-tier-badge" id="play-tier-badge">Tier: ${this.getCurrentTierLabel()}</div>
        <div class="play-help">WASD or arrows to walk · E to interact</div>
        <div class="play-badge-hud" id="play-badge-hud" title="Corporate badge — elevator access">
          <span class="badge-icon">🪪</span>
          <span class="badge-label">F<span id="play-badge-level">1</span></span>
        </div>
        <div class="play-compass" id="play-compass">
          <div class="play-compass-dial">
            <div class="play-compass-arrow" id="play-compass-arrow"></div>
          </div>
          <div class="play-compass-label" id="play-compass-label"></div>
        </div>
        <div class="play-elevator-modal" id="play-elevator-modal">
          <div class="elev-panel">
            <div class="elev-title">Elevator</div>
            <div class="elev-badge-line">Badge: floors 1–<span id="elev-badge-cap">1</span></div>
            <div class="elev-floors" id="elev-floors"></div>
            <button class="btn-secondary elev-cancel" id="elev-cancel">Cancel</button>
          </div>
        </div>
        <div class="play-fade" id="play-fade"></div>
        <div class="play-prompt" id="play-prompt"></div>
        <div class="play-joystick" id="play-joystick">
          <div class="play-joystick-thumb" id="play-joystick-thumb"></div>
        </div>
        <button class="play-interact-btn" id="play-interact-btn">Talk</button>
        <button class="play-jump-btn" id="play-jump-btn" aria-label="Jump">↑</button>

        <div class="play-intro-overlay" id="play-intro-overlay">
          <div class="intro-card">
            <div class="intro-eyebrow">DAY 1 — KEDASH CORP HQ</div>
            <h2>Welcome, <span class="intro-name">${playerName}</span>.</h2>
            <p>You've just been hired. The reception floor is buzzing — this is where every Kedash engineer learns the ropes of working with Claude Code.</p>
            <p>Walk around with <strong>WASD</strong> (or the on-screen joystick on mobile). Approach a colleague and press <strong>E</strong> (or tap <strong>Talk</strong>) to learn what they teach. Each colleague will point you to the next.</p>
            <p><strong>Start with Linda</strong> at the reception desk straight ahead of you.</p>
            <button class="btn-primary intro-btn">Got it — let's go →</button>
          </div>
        </div>

        <div class="play-intro-overlay" id="play-next-overlay">
          <div class="intro-card">
            <div class="intro-eyebrow" id="play-next-eyebrow">✓ LESSON COMPLETE</div>
            <h2 id="play-next-title">Where to next?</h2>
            <p id="play-next-body">—</p>
            <button class="btn-primary intro-btn" id="play-next-btn">Got it — let's go →</button>
          </div>
        </div>

        <div class="play-dialogue" id="play-dialogue"></div>
      </div>
    `;
    const tryStart = (attempts = 0) => {
      if (window.Play && window.Play.start) {
        window.Play.start(document.getElementById('play-canvas-host'));
      } else if (attempts < 50) {
        setTimeout(() => tryStart(attempts + 1), 100);
      } else {
        document.getElementById('play-canvas-host').innerHTML =
          '<div style="padding:40px;text-align:center;color:#1a2744;">Couldn\'t load 3D engine. Check your connection and try again.</div>';
      }
    };
    tryStart();
  },

  getCurrentTierLabel() {
    if (!window.CURRICULUM || !this.progress) return 'Intern';
    const tiers = ['Intern', 'Junior Hire', 'Associate', 'Engineer', 'Senior', 'Lead', 'Principal', 'Director'];
    const completed = window.CURRICULUM.filter(ch =>
      Progress.isTestPassed(this.progress, ch.practicalTest.id)
    ).length;
    return tiers[Math.min(completed, tiers.length - 1)];
  },

  renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    const progress = this.progress;
    const level = Scoring.getLevel(progress.totalXP);

    sidebar.innerHTML = `
      <div class="sidebar-brand">
        <div class="brand-logo">🏢</div>
        <div>
          <div class="brand-name">Kedash Corp</div>
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
        ${Progress.getCurrentStreak(progress) > 0 ? `<div class="player-streak" title="Current daily streak"><span class="streak-flame">🔥</span> ${Progress.getCurrentStreak(progress)}-day streak</div>` : ''}
      </div>

      <nav class="sidebar-nav" id="sidebar-nav">
        <div class="nav-item ${isActive('dashboard')}" data-nav="dashboard">
          <span class="nav-icon">🏠</span><span>Dashboard</span>
        </div>
        <div class="nav-item ${isActive('shop')}" data-nav="shop">
          <span class="nav-icon">🛍️</span><span>Desk Shop</span>
        </div>
        ${CURRICULUM.filter(ch => !Progress.isSideQuestChapter(ch)).map(ch => {
          const unlocked = Progress.isChapterUnlocked(progress, ch.id);
          const passed = Progress.isTestPassed(progress, ch.practicalTest.id);
          return `
            <div class="nav-item chapter-nav ${unlocked ? '' : 'nav-locked'} ${passed ? 'nav-complete' : ''} ${isActive('chapter', ch.id)}"
                 data-nav="chapter" data-chapter="${ch.id}">
              <span class="nav-icon">${unlocked ? ch.icon : '🔒'}</span>
              <span class="nav-chapter-title">${ch.title}</span>
              ${passed ? '<span class="nav-tick">✓</span>' : ''}
            </div>
          `;
        }).join('')}
        ${CURRICULUM.some(ch => Progress.isSideQuestChapter(ch)) ? `
          <div class="nav-side-quest-header">★ Side Quests</div>
          ${CURRICULUM.filter(ch => Progress.isSideQuestChapter(ch)).map(ch => {
            const unlocked = Progress.isChapterUnlocked(progress, ch.id);
            const passed = Progress.isTestPassed(progress, ch.practicalTest.id);
            return `
              <div class="nav-item chapter-nav nav-side-quest ${unlocked ? '' : 'nav-locked'} ${passed ? 'nav-complete' : ''} ${isActive('chapter', ch.id)}"
                   data-nav="chapter" data-chapter="${ch.id}">
                <span class="nav-icon">${unlocked ? ch.icon : '🔒'}</span>
                <span class="nav-chapter-title">${ch.title}</span>
                ${passed ? '<span class="nav-tick">✓</span>' : ''}
              </div>
            `;
          }).join('')}
        ` : ''}
      </nav>

      <div class="sidebar-reset">
        <button class="reset-btn" id="reset-progress-btn">Reset Progress</button>
        <button class="reset-btn admin-btn" id="admin-unlock-btn" title="Enter admin passcode">🔓 Admin</button>
      </div>
    `;

    function isActive(navType, chapterId = null) {
      const v = App._currentView;
      const p = App._currentParams;
      if (navType === 'dashboard') return v === 'dashboard' ? 'active' : '';
      if (navType === 'shop') return v === 'shop' ? 'active' : '';
      if (navType === 'chapter') return p.chapterId === chapterId ? 'active' : '';
      return '';
    }

    sidebar.querySelectorAll('.nav-item[data-nav="dashboard"]').forEach(el => {
      el.addEventListener('click', () => { App.navigate('dashboard'); App.closeSidebar(); });
    });

    sidebar.querySelectorAll('.nav-item[data-nav="shop"]').forEach(el => {
      el.addEventListener('click', () => { App.navigate('shop'); App.closeSidebar(); });
    });

    sidebar.querySelectorAll('.nav-item.chapter-nav:not(.nav-locked)').forEach(el => {
      el.addEventListener('click', () => { App.navigate('chapter', { chapterId: el.dataset.chapter }); App.closeSidebar(); });
    });

    document.getElementById('reset-progress-btn').addEventListener('click', () => {
      if (confirm('Reset all progress? This cannot be undone.')) {
        Progress.reset();
        window.location.reload();
      }
    });

    document.getElementById('admin-unlock-btn').addEventListener('click', () => {
      const entered = window.prompt('Enter admin passcode:');
      if (entered === null) return; // user cancelled
      if (entered === 'Kapprim') {
        // Flag admin mode for this browser session. The 3D play view
        // checks sessionStorage.ccq_admin to expose the "Edit Rooms"
        // toggle that opens the room editor. Cleared automatically
        // when the browser tab closes. Passcode is also stored so the
        // editor's "Save Permanently" can authenticate to save.php.
        try {
          sessionStorage.setItem('ccq_admin', '1');
          sessionStorage.setItem('ccq_admin_pass', entered);
        } catch {}
        App.unlockEverything();
      } else {
        window.alert('Incorrect passcode.');
      }
    });
  },

  // Admin-only "unlock everything" — gated by the Kapprim passcode in the
  // sidebar. Marks every chapter unlocked, every lesson complete, every
  // practical test passed, and lets applyBadgeBumpsIfDue push the badge
  // up to floor 4. Progress.* functions are idempotent and won't
  // double-award XP, so XP earned legitimately is preserved.
  unlockEverything() {
    if (!window.CURRICULUM) return;
    let progress = this.progress;
    for (const ch of window.CURRICULUM) {
      progress = Progress.unlockChapter(progress, ch.id);
      for (const l of ch.lessons || []) {
        progress = Progress.markLessonComplete(progress, l.id, l.xpReward || 0);
      }
      if (ch.practicalTest) {
        progress = Progress.recordTestResult(
          progress,
          ch.practicalTest.id,
          { passed: true, score: 100 },
          ch.practicalTest.xpReward || 0,
        );
        progress = Progress.recordTestResult(
          progress,
          ch.id + '_chapter_bonus',
          { passed: true, score: 100 },
          ch.xpReward || 0,
        );
      }
    }
    progress = Progress.applyBadgeBumpsIfDue(progress);
    Progress.save(progress);
    this.progress = progress;
    window.alert('Admin mode: all chapters, lessons, and tests unlocked. Reloading…');
    window.location.reload();
  },

  refreshSidebar() {
    this.renderSidebar();
  },

  openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebar-backdrop').classList.add('visible');
  },

  closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-backdrop').classList.remove('visible');
  },

  setupMobileNav() {
    document.getElementById('hamburger-btn')?.addEventListener('click', () => this.openSidebar());
    document.getElementById('sidebar-backdrop')?.addEventListener('click', () => this.closeSidebar());
  },

  updateSidebarActive(view, params) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (view === 'dashboard') {
      document.querySelector('[data-nav="dashboard"]')?.classList.add('active');
    } else if (view === 'shop') {
      document.querySelector('[data-nav="shop"]')?.classList.add('active');
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
