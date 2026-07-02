const App = {
  progress: null,
  _currentView: 'dashboard',
  _currentParams: {},

  init() {
    maybeApplyFinaleDryRun();
    this.progress = Progress.load();
    this.boot();
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
    this._applyAdminBodyClass();
    this.navigate('landing');
  },

  // Stamps body.is-admin when the admin passcode was previously entered
  // this session. Used by CSS to reveal author-facing scaffolding (the
  // .lesson-todo-shot screenshot placeholders) without leaking it to
  // regular players.
  _applyAdminBodyClass() {
    try {
      const isAdmin = sessionStorage.getItem('ccq_admin') === '1';
      document.body.classList.toggle('is-admin', isAdmin);
    } catch {}
  },

  // Name capture happens lazily — the landing page renders first (cold
  // open), and the modal only appears when the player tries to leave it.
  // Dismissing the modal (backdrop click / Escape) cancels the exit
  // without calling onDone, keeping the player on the landing page.
  showNameModal(onDone) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-logo">🏢</div>
        <h2>Welcome to Kedash Corp</h2>
        <p>You've been enrolled in the <strong>Claude Code Quest</strong> training programme. Before we begin, what should we call you?</p>
        <input type="text" id="name-input" class="modal-input" placeholder="Your first name" maxlength="40" autofocus>
        <button class="btn-primary modal-btn" id="start-btn">Continue →</button>
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
      document.removeEventListener('keydown', onKeydown);
      this.refreshSidebar();
      onDone();
    };
    const dismiss = () => {
      overlay.remove();
      document.removeEventListener('keydown', onKeydown);
    };
    const onKeydown = e => { if (e.key === 'Escape') dismiss(); };

    btn.addEventListener('click', submit);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    // Backdrop click (not clicks inside the modal card) dismisses.
    overlay.addEventListener('click', e => { if (e.target === overlay) dismiss(); });
    document.addEventListener('keydown', onKeydown);
    setTimeout(() => input.focus(), 100);
  },

  // Runs `then` immediately when the player already has a name; otherwise
  // asks for one first and only proceeds on submit (dismissal = stay put).
  _ensureName(then) {
    if (this.progress.playerName) { then(); return; }
    this.showNameModal(then);
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
    const hasName = !!this.progress?.playerName;
    const playerName = escHtml(this.progress?.playerName || 'New Hire');
    const isReturning = (this.progress?.totalXP || 0) > 0
      || (this.progress?.completedLessons?.length || 0) > 0;
    const ctaLabel = isReturning ? 'CONTINUE' : 'BEGIN TRAINING';
    const subline = isReturning
      ? `Welcome back, <strong>${playerName}</strong>. Kedash Corp will see you now.`
      : (hasName
        ? `Welcome, <strong>${playerName}</strong>. Your first day at Kedash Corp begins now.`
        : 'Welcome. Your first day at Kedash Corp begins now.');

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
              <span>Level: <strong>${escHtml(this.getCurrentTierLabel())}</strong></span>
              <span>·</span>
              <span><strong>${this.progress?.totalXP || 0}</strong> PP</span>
              <span>·</span>
              <span>Day-<strong>${this.progress?.currentStreak || 1}</strong> streak</span>
            </div>` : ''}
        </div>
      </div>
    `;

    document.getElementById('landing-play-btn').addEventListener('click', () => {
      this._ensureName(() => {
        if (sidebar) sidebar.classList.remove('hidden-on-landing');
        this.navigate('play');
      });
    });
    document.getElementById('landing-dashboard-btn').addEventListener('click', () => {
      this._ensureName(() => {
        if (sidebar) sidebar.classList.remove('hidden-on-landing');
        this.navigate('dashboard');
      });
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
        <div class="play-tier-badge" id="play-tier-badge">Level: ${this.getCurrentTierLabel()}</div>
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
      const host = document.getElementById('play-canvas-host');
      if (!host) return; // player navigated away mid-poll
      if (window.Play && window.Play.start) {
        window.Play.start(host);
      } else if (attempts < 50) {
        setTimeout(() => tryStart(attempts + 1), 100);
      } else {
        host.innerHTML = `
          <div class="play-load-fail">
            <p>The 3D engine hasn't loaded yet — this usually means a slow connection still fetching the play module.</p>
            <button class="btn-primary" id="play-retry-btn">Try again</button>
            <button class="btn-secondary" id="play-reload-btn">Reload page</button>
          </div>
        `;
        host.querySelector('#play-retry-btn').addEventListener('click', () => {
          host.innerHTML = '';
          tryStart(0);
        });
        host.querySelector('#play-reload-btn').addEventListener('click', () => {
          window.location.reload();
        });
      }
    };
    tryStart();
  },

  // Single progression ladder: the level label always comes from the PP
  // (totalXP) ladder in engine/scoring.js — no parallel "tier" names.
  getCurrentTierLabel() {
    return window.Scoring ? Scoring.getLevelLabel(this.progress?.totalXP || 0) : 'New Hire';
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
        <div class="player-name">${escHtml(progress.playerName || 'New Hire')}</div>
        <div class="player-level">${level.label}</div>
        <div class="player-xp">${Scoring.formatXP(progress.totalXP)}</div>
        <div class="player-pp-hint">PP = Performance Points, earned from lessons &amp; tests — your PP total sets your level.</div>
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
          const passed = Progress.isChapterTestPassed(progress, ch);
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
            const passed = Progress.isChapterTestPassed(progress, ch);
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
        <button class="reset-btn backup-btn" id="export-progress-btn">Export progress</button>
        <button class="reset-btn backup-btn" id="import-progress-btn">Import progress</button>
        <input type="file" id="import-progress-file" accept=".json,application/json" style="display:none">
        <button class="reset-btn" id="reset-progress-btn">Reset Progress</button>
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

    document.getElementById('export-progress-btn').addEventListener('click', () => {
      const json = JSON.stringify(Progress.exportAllData(), null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const d = new Date();
      const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      a.href = url;
      a.download = `ccq-backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });

    const importInput = document.getElementById('import-progress-file');
    document.getElementById('import-progress-btn').addEventListener('click', () => {
      importInput.click();
    });
    importInput.addEventListener('change', () => {
      const file = importInput.files && importInput.files[0];
      importInput.value = '';
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          if (!confirm('Replace current progress with this backup?')) return;
          if (Progress.importAllData(parsed)) {
            window.location.reload();
          } else {
            window.alert('That file isn\'t a Claude Code Quest backup.');
          }
        } catch {
          window.alert('Couldn\'t read that file — it isn\'t valid backup JSON.');
        }
      };
      reader.onerror = () => window.alert('Couldn\'t read that file.');
      reader.readAsText(file);
    });

    document.getElementById('reset-progress-btn').addEventListener('click', () => {
      App.showResetModal();
    });

    // Hidden admin trigger: 5 clicks on the brand logo within a rolling
    // 2-second window. Deliberately undiscoverable (no cursor affordance)
    // — the visible "🔓 Admin" button used to leak the existence of admin
    // mode to every player.
    let logoClicks = 0, logoTimer = null;
    sidebar.querySelector('.brand-logo')?.addEventListener('click', () => {
      logoClicks += 1;
      if (logoTimer) clearTimeout(logoTimer);
      logoTimer = setTimeout(() => { logoClicks = 0; }, 2000);
      if (logoClicks >= 5) {
        logoClicks = 0;
        clearTimeout(logoTimer);
        App.promptAdmin();
      }
    });
  },

  // Confirmation modal for the destructive reset — requires typing RESET
  // so a stray click can't wipe a save; points at Export as the backup.
  showResetModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-logo">⚠️</div>
        <h2>Reset all progress?</h2>
        <p>This wipes <strong>everything</strong> — PP, completed lessons, test results, story progress, purchases. It cannot be undone.</p>
        <p>Want a safety net? Use <strong>Export progress</strong> first to download a backup you can import later.</p>
        <input type="text" id="reset-confirm-input" class="modal-input" placeholder="Type RESET to confirm" autocomplete="off">
        <button class="modal-danger-btn" id="reset-confirm-btn" disabled>Reset everything</button>
        <button class="btn-secondary modal-cancel-btn" id="reset-cancel-btn">Cancel</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('#reset-confirm-input');
    const confirmBtn = overlay.querySelector('#reset-confirm-btn');
    input.addEventListener('input', () => {
      confirmBtn.disabled = input.value.trim().toUpperCase() !== 'RESET';
    });
    confirmBtn.addEventListener('click', () => {
      if (confirmBtn.disabled) return;
      Progress.reset();
      window.location.reload();
    });
    overlay.querySelector('#reset-cancel-btn').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    setTimeout(() => input.focus(), 100);
  },

  // Admin unlock, reached only via the hidden brand-logo trigger. The
  // passcode is checked against a SHA-256 hash so the plaintext never
  // appears in shipped source; the entered plaintext is still stored in
  // sessionStorage because the room editor's "Save Permanently" needs it
  // to authenticate to the save server.
  promptAdmin() {
    const entered = window.prompt('Enter admin passcode:');
    if (entered === null) return; // user cancelled
    if (sha256Hex(entered) === ADMIN_PASS_HASH) {
      try {
        sessionStorage.setItem('ccq_admin', '1');
        sessionStorage.setItem('ccq_admin_pass', entered);
      } catch {}
      this._applyAdminBodyClass();
      this.unlockEverything();
    } else {
      window.alert('Incorrect passcode.');
    }
  },

  // Admin-only "unlock everything" — gated by the hidden admin passcode
  // prompt. Marks every chapter unlocked, every lesson complete, every
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
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// SHA-256 of the admin passcode. The plaintext deliberately does not
// appear in source — enter it once and it's kept for the session only.
const ADMIN_PASS_HASH = '3708b32150ea6392c974c65fef2f0b236d0edc25ca09a8aad31ac27bfa027f7d';

// Compact synchronous SHA-256 (FIPS 180-4, public-domain K constants),
// UTF-8 encoding the input. crypto.subtle is unavailable on this
// plain-HTTP origin, hence the pure-JS implementation. Verified against
// the standard test vectors ('' / 'abc') and node:crypto.
function sha256Hex(str) {
  const bytes = (typeof TextEncoder !== 'undefined')
    ? Array.from(new TextEncoder().encode(String(str)))
    : (() => { // manual UTF-8 for very old engines
        const s = String(str), out = [];
        for (let i = 0; i < s.length; i++) {
          let c = s.codePointAt(i);
          if (c > 0xffff) i++;
          if (c < 0x80) out.push(c);
          else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
          else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
          else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
        }
        return out;
      })();
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const byteLen = bytes.length;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  const hi = Math.floor(byteLen / 0x20000000); // upper 32 bits of bit length
  const lo = (byteLen << 3) >>> 0;             // lower 32 bits of bit length
  bytes.push((hi >>> 24) & 255, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255);
  bytes.push((lo >>> 24) & 255, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  const w = new Array(64);
  for (let i = 0; i < bytes.length; i += 64) {
    for (let t = 0; t < 16; t++) {
      w[t] = (bytes[i + t * 4] << 24) | (bytes[i + t * 4 + 1] << 16) | (bytes[i + t * 4 + 2] << 8) | bytes[i + t * 4 + 3];
    }
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
    }
    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[t] + w[t]) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  return H.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
}

// ── Finale dry-run boot hook ──────────────────────────────────────────────
// `?finaledry=1` (admin-gated) replaces the current save with an organic-
// shaped "everything passed, finale not yet seen" save so the finale chain
// can be play-tested end-to-end without 17 chapters of manual grinding.
// Unlike the room editor's chapter skip, the save has varied scores,
// failed attempts, streaks, knowledge checks — the shape a real player's
// save would have.
function maybeApplyFinaleDryRun() {
  let q; try { q = new URLSearchParams(location.search); } catch { return; }
  if (q.get('finaledry') !== '1') return;
  if (sessionStorage.getItem('ccq_admin') !== '1') {
    alert('finaledry: unlock admin first, then reload with ?finaledry=1'); return;
  }
  buildFinaleDrySave();
  history.replaceState(null, '', location.pathname);
}

function buildFinaleDrySave() {
  // Start from the same clean slate a reset produces (without the reload).
  Progress.reset();
  let p = Progress.load();

  const curriculum = window.CURRICULUM || [];
  curriculum.forEach((ch, i) => {
    p = Progress.unlockChapter(p, ch.id);
    for (const l of ch.lessons || []) {
      p = Progress.markLessonComplete(p, l.id, l.xpReward || 0);
    }
    if (ch.practicalTest) {
      // Some chapters get a recorded failed first attempt — organic saves
      // aren't a wall of first-try passes.
      if ((i * 5) % 3 > 0) {
        p = Progress.recordTestResult(p, ch.practicalTest.id,
          { passed: false, score: 40 + ((i * 13) % 25) },
          ch.practicalTest.xpReward || 0);
      }
      p = Progress.recordTestResult(p, ch.practicalTest.id,
        { passed: true, score: 70 + ((i * 7 + 3) % 26) },
        ch.practicalTest.xpReward || 0);
      // Chapter completion bonus — mirrors ui/test.js
      // applyChapterPassSideEffects (`${ch.id}_chapter_bonus`, score 100).
      p = Progress.recordTestResult(p, ch.id + '_chapter_bonus',
        { passed: true, score: 100 }, ch.xpReward || 0);
    }
  });

  // One live nonce, as if a test view had been opened and not yet re-passed.
  p = Progress.ensureTestNonce(p, 'ch16-test').progress;

  // A handful of in-lesson knowledge checks (first lesson of the first 6
  // chapters), mixed first-try/retry.
  curriculum.slice(0, 6).forEach((ch, idx) => {
    const lessonId = ch.lessons && ch.lessons[0] && ch.lessons[0].id;
    if (lessonId) p = Progress.recordKnowledgeCheck(p, lessonId, true, idx % 2 === 0);
  });

  // Two optional Product Lab builds (+75 PP each, idempotent).
  const templates = window.PRODUCT_TEMPLATES || [];
  for (const tpl of templates.slice(0, 2)) {
    p = Progress.recordProductBuilt(p, tpl.id, 75);
  }

  // Streaks — lastActiveDate in the exact local YYYY-MM-DD format that
  // engine/progress.js todayStr() writes.
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  p = { ...p, currentStreak: 3, longestStreak: 6, lastActiveDate: today };

  p = Progress.applyBadgeBumpsIfDue(p);
  Progress.save(p);

  // Story flags: pre-finale state — twists seen, marcusDoor/mayaScene/
  // finale NOT seen. Shape matches play/story/storyState.js schema v1.
  const story = {
    schemaVersion: 1,
    scenesSeen: ['inesAnticipates', 'twist1', 'curtain1', 'twist2', 'seventh'],
    collectiblesRead: ['client_profiles'],
    epilogue: false,
    flags: { 'postpass:auto-ch04-test:T2': true, 'floor4_chime': true },
  };
  if (window.Story) {
    // storyState.js is a module that caches its state in memory at eval
    // time (it loads before DOMContentLoaded) — writing localStorage
    // directly would be shadowed by that stale cache on the next save().
    // Route through the public API instead; it produces the identical
    // stored shape AND keeps the in-memory state in sync.
    window.Story.reset();
    story.scenesSeen.forEach(id => window.Story.markSceneSeen(id));
    story.collectiblesRead.forEach(id => window.Story.markCollectibleRead(id));
    Object.keys(story.flags).forEach(k => window.Story.setFlag(k));
  } else {
    localStorage.setItem('ccq_story', JSON.stringify(story));
  }
}

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
