// overlay.js — in-world lesson overlay.
//
// This is the Pillar 3 centrepiece: lessons render in an HTML panel
// LAYERED OVER the canvas. The 3D world keeps rendering behind (canvas
// is not removed; the overlay just sits above it with backdrop blur).
//
// Public API (exposed as window.LessonOverlay):
//   .open({ chapterId, lessonId, kind })    — open with a skin
//   .close({ animateOut = true } = {})       — close + cleanup
//   .toggleMinimize()                        — minimize / restore
//   .isOpen()
//
// Skins (terminal / book / whiteboard / video / dialogue) are CSS
// classes applied to the overlay shell. The lesson content itself
// renders the same way (Lesson.renderLesson into the overlay's content
// div), but the surrounding chrome changes per kind.

const OVERLAY_ID = 'lesson-overlay';
const CONTENT_ID = 'lesson-overlay-content';
const KIND_TO_SKIN = {
  computer:   'skin-terminal',
  book:       'skin-book',
  whiteboard: 'skin-whiteboard',
  display:    'skin-video',
  phone:      'skin-video',
  dialogue:   'skin-dialogue',
  npc:        'skin-dialogue',
};

const _state = {
  el: null,
  contentEl: null,
  minimized: false,
  open: false,
  currentKind: null,
  // Hooks supplied by play.js so we can lock input + duck audio
  hooks: {
    setInputLocked: () => {},
    duckMusic:      () => {},
    restoreMusic:   () => {},
  },
};

function el(tag, attrs = {}, kids = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else e.setAttribute(k, v);
  }
  for (const c of kids) {
    if (c == null) continue;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return e;
}

function ensureBuilt(host) {
  if (_state.el) return _state.el;
  const overlay = el('div', { id: OVERLAY_ID, class: 'lesson-overlay hidden' });
  // Header strip (chapter, minimize, close)
  const header = el('div', { class: 'lo-header' }, [
    el('div', { class: 'lo-eyebrow', id: 'lo-eyebrow' }, ['Chapter']),
    el('div', { class: 'lo-title', id: 'lo-title' }, ['Lesson']),
    el('div', { class: 'lo-actions' }, [
      (() => {
        const b = el('button', { class: 'lo-min-btn', type: 'button', 'aria-label': 'Minimize' }, ['—']);
        b.addEventListener('click', () => _api.toggleMinimize());
        return b;
      })(),
      (() => {
        const b = el('button', { class: 'lo-close-btn', type: 'button', 'aria-label': 'Close' }, ['×']);
        b.addEventListener('click', () => _api.close());
        return b;
      })(),
    ]),
  ]);
  overlay.appendChild(header);
  // Body — lesson content goes here
  const content = el('div', { id: CONTENT_ID, class: 'lo-content' });
  overlay.appendChild(content);
  // The overlay mounts INSIDE the play view container so it sits above
  // the canvas but below any other top-level dialogues.
  (host || document.body).appendChild(overlay);
  _state.el = overlay;
  _state.contentEl = content;
  return overlay;
}

const _api = {
  open(info) {
    const host = document.getElementById('play-canvas-host')?.parentElement || document.body;
    ensureBuilt(host);
    const skin = KIND_TO_SKIN[info.kind] || 'skin-dialogue';
    _state.currentKind = info.kind || 'npc';
    _state.el.className = `lesson-overlay ${skin}`;
    _state.minimized = false;

    // Lock movement input on play.js (set by mountLessonOverlay).
    try { _state.hooks.setInputLocked(true); } catch {}
    try { _state.hooks.duckMusic(); } catch {}

    // Set the dynamic skin metadata.
    const ch = window.CURRICULUM?.find(c => c.id === info.chapterId);
    const lesson = ch?.lessons.find(l => l.id === info.lessonId);
    document.getElementById('lo-eyebrow').textContent =
      ch ? `${ch.icon} ${ch.title}` : 'Chapter';
    document.getElementById('lo-title').textContent =
      lesson ? lesson.title : 'Lesson';

    // Render lesson content into our content div via the existing
    // Lesson module (modified to accept a target).
    if (window.Lesson?.renderLesson) {
      // Stash params on App so the existing fromPlay flag inside
      // renderLesson works without a real route change.
      try {
        if (window.App) {
          window.App._currentParams = {
            chapterId: info.chapterId, lessonId: info.lessonId, fromPlay: true,
          };
        }
      } catch {}
      window.Lesson.renderLesson(info.chapterId, info.lessonId, _state.contentEl);
    } else {
      _state.contentEl.innerHTML = `<div style="padding:24px;color:#1a2744">
        Lesson runtime not loaded. (chapter ${info.chapterId})
      </div>`;
    }

    // Show with animation
    _state.el.classList.remove('hidden');
    requestAnimationFrame(() => _state.el.classList.add('visible'));
    _state.open = true;
  },

  close({ animateOut = true } = {}) {
    if (!_state.open) return;
    _state.open = false;
    try { _state.hooks.setInputLocked(false); } catch {}
    try { _state.hooks.restoreMusic(); } catch {}
    if (_state.el) {
      _state.el.classList.remove('visible');
      _state.el.classList.remove('minimized');
      const t = animateOut ? 280 : 0;
      setTimeout(() => {
        _state.el?.classList.add('hidden');
        if (_state.contentEl) _state.contentEl.innerHTML = '';
      }, t);
    }
  },

  toggleMinimize() {
    if (!_state.open || !_state.el) return;
    _state.minimized = !_state.minimized;
    _state.el.classList.toggle('minimized', _state.minimized);
    // While minimized, unlock movement so the player can walk around.
    try { _state.hooks.setInputLocked(_state.minimized ? false : true); } catch {}
  },

  isOpen() { return !!_state.open; },
};

export function mountLessonOverlay({ setInputLocked, duckMusic, restoreMusic } = {}) {
  _state.hooks.setInputLocked = setInputLocked || (() => {});
  _state.hooks.duckMusic       = duckMusic       || (() => {});
  _state.hooks.restoreMusic    = restoreMusic    || (() => {});
  // Keyboard: Esc minimizes / restores. Ctrl+Esc closes.
  document.addEventListener('keydown', (e) => {
    if (!_state.open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) _api.close();
      else _api.toggleMinimize();
    }
  });
  window.LessonOverlay = _api;
  return _api;
}

export function unmountLessonOverlay() {
  if (_state.el?.parentElement) _state.el.parentElement.removeChild(_state.el);
  _state.el = null;
  _state.contentEl = null;
  _state.open = false;
  _state.minimized = false;
}
