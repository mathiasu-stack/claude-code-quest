// productLab.js — the Chapter 17 "Product Lab" catalog overlay.
//
// Opens from the Product Lab bench in reception once ch17-test is passed.
// Shows the 18 product templates (window.PRODUCT_TEMPLATES) grouped by
// complexity; each can be built (optionally, post-unlock) by pasting a real
// "build kit", graded by the SAME composite `product` artifact kind used by
// the ch17 chapter test. A first build awards bonus PP (idempotent) and lights
// the card's trophy.
//
// Decoupled from play.js input handling: the caller (play.js) locks movement
// and passes onClose to unlock — mirrors openPlanModeExercise().
//
// API: openProductLab({ getProgress, onBuilt, onClose })
//   getProgress() → the current progress object (read fresh each render so
//                   trophies reflect builds made this session).
//   onBuilt(id)   → record the build + award PP + save (returns nothing; the
//                   overlay re-reads via getProgress()).
//   onClose()     → fired when the overlay is dismissed.

const BADGE = { easy: '🟢 Easy', medium: '🟡 Medium', hard: '🔴 Hard' };
const GROUPS = [
  { key: 'easy',   title: '🟢 Easy — just a laptop, no accounts or host' },
  { key: 'medium', title: '🟡 Medium — one external piece, no sensitive data' },
  { key: 'hard',   title: '🔴 Hard — full orchestration, real guardrails' },
];

// The composite criterion — identical to what ch17's test appends.
const PRODUCT_CRITERION = [{
  type: 'artifact', value: { kind: 'product' }, weight: 3,
  description: 'A real multi-part build kit (several real shapes)',
  improvement: 'Paste several real shapes: a `---` frontmatter skill/subagent, an `.mcp.json`/`settings.json`, the scheduled `claude -p` line, and a numbered flow — not prose.',
}];

let _overlay = null;
let _open = false;

export function isProductLabOpen() { return _open; }

export function openProductLab({ getProgress, onBuilt, onClose } = {}) {
  if (_open) return;
  _open = true;
  const templates = Array.isArray(window.PRODUCT_TEMPLATES) ? window.PRODUCT_TEMPLATES : [];
  const host = document.getElementById('play-canvas-host')?.parentElement || document.body;

  _overlay = document.createElement('div');
  _overlay.className = 'product-lab-overlay';
  _overlay.id = 'play-product-lab';
  host.appendChild(_overlay);
  requestAnimationFrame(() => _overlay.classList.add('visible'));

  // view state: null = catalog, or a template object = its build panel.
  let active = null;

  const progress = () => { try { return getProgress?.() || {}; } catch { return {}; } };
  const isBuilt = (id) => !!window.Progress?.isProductBuilt?.(progress(), id);
  const builtCount = () => templates.filter(t => isBuilt(t.id)).length;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  function renderCatalog() {
    const sections = GROUPS.map(g => {
      const cards = templates.filter(t => t.complexity === g.key).map(t => {
        const built = isBuilt(t.id);
        const chips = (t.pieces || []).map(p => `<span class="plab-chip">${esc(p)}</span>`).join('');
        return `
          <div class="plab-card ${built ? 'built' : ''}" data-id="${esc(t.id)}">
            <div class="plab-card-top">
              <span class="plab-badge plab-${esc(t.complexity)}">${BADGE[t.complexity] || esc(t.complexity)}</span>
              <span class="plab-name">${esc(t.name)}</span>
              ${built ? '<span class="plab-trophy" title="Built">🏆</span>' : ''}
            </div>
            <div class="plab-aud">${esc(t.audience)} · ${esc(t.form)}</div>
            <div class="plab-blurb">${esc(t.blurb)}</div>
            <div class="plab-chips">${chips}</div>
            <button class="plab-build-btn" data-build="${esc(t.id)}">${built ? 'Build again' : 'Build this →'}</button>
          </div>`;
      }).join('');
      return `<div class="plab-group"><h3 class="plab-group-title">${g.title}</h3><div class="plab-grid">${cards}</div></div>`;
    }).join('');

    _overlay.innerHTML = `
      <div class="product-lab-card" role="dialog" aria-label="Product Lab">
        <button class="plab-close" aria-label="Close">×</button>
        <div class="plab-eyebrow">Product Lab</div>
        <h2 class="plab-title">Build a real product</h2>
        <p class="plab-intro">Your Playbook, pointed at one real thing. Pick a template, paste its <strong>build kit</strong> (a numbered flow + the real pieces it orchestrates), and ship it. <span class="plab-count">${builtCount()} / ${templates.length} shipped</span></p>
        <div class="plab-honest">You're building the blueprint + wiring kit — adapt the delivery channel to what you have. WhatsApp is an optional stretch; Telegram / email-to-self / a local file are fine.</div>
        ${sections}
      </div>`;

    _overlay.querySelector('.plab-close').addEventListener('click', () => close());
    _overlay.querySelectorAll('[data-build]').forEach(btn => {
      btn.addEventListener('click', () => {
        active = templates.find(t => t.id === btn.dataset.build) || null;
        if (active) renderBuild();
      });
    });
  }

  function renderBuild() {
    const t = active;
    const built = isBuilt(t.id);
    _overlay.innerHTML = `
      <div class="product-lab-card" role="dialog" aria-label="Build ${esc(t.name)}">
        <button class="plab-close" aria-label="Close">×</button>
        <button class="plab-back" data-back>← All products</button>
        <div class="plab-eyebrow">${BADGE[t.complexity] || esc(t.complexity)} · ${esc(t.form)}</div>
        <h2 class="plab-title">${esc(t.name)} ${built ? '🏆' : ''}</h2>
        <p class="plab-blurb">${esc(t.blurb)}</p>
        <div class="plab-kit">📦 Paste ${esc(t.kit)}.</div>
        <div class="plab-hint">The grader looks for at least <strong>three real shapes</strong> assembled into one kit — a <code>---</code> frontmatter skill/subagent, an <code>.mcp.json</code> or <code>settings.json</code>, the scheduled <code>claude -p</code> line, a numbered flow — not a description.</div>
        <textarea class="plab-textarea" rows="12" placeholder="Paste your build kit here…"></textarea>
        <div class="plab-warning" data-warning></div>
        <div class="plab-actions">
          <button class="btn-secondary plab-cancel" data-back>Back</button>
          <button class="btn-primary plab-submit" data-submit>Submit build →</button>
        </div>
      </div>`;

    const ta = _overlay.querySelector('.plab-textarea');
    const warn = _overlay.querySelector('[data-warning]');
    _overlay.querySelector('.plab-close').addEventListener('click', () => close());
    _overlay.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => { active = null; renderCatalog(); }));
    _overlay.querySelector('[data-submit]').addEventListener('click', () => {
      const text = ta.value || '';
      const result = window.Evaluator?.evaluate?.(text, PRODUCT_CRITERION, 150, 70) || { passed: false };
      if (!result.passed) {
        warn.textContent = result.tooShort
          ? 'That\'s too short to be a real build kit — paste the flow plus the real pieces.'
          : 'Not enough real shapes yet. Assemble at least three: a frontmatter skill/subagent, an .mcp.json or settings.json, a scheduled claude -p line, a numbered flow.';
        warn.classList.add('visible');
        try { window.PlayAudio?.kcIncorrect?.(); } catch {}
        return;
      }
      const wasBuilt = isBuilt(t.id);
      try { onBuilt?.(t.id); } catch (e) { console.warn('productLab onBuilt failed', e); }
      try { window.PlayAudio?.ppPing?.(); } catch {}
      // Success view (then back to catalog).
      _overlay.querySelector('.product-lab-card').innerHTML = `
        <div class="plab-success">
          <div class="plab-success-trophy">🏆</div>
          <h2 class="plab-title">${esc(t.name)} — shipped</h2>
          <p class="plab-blurb">${wasBuilt ? 'Rebuilt — nicely done. (No additional PP for a product you\'ve already shipped.)' : 'Built for the first time. <strong>+75 PP.</strong> It runs without you in the room.'}</p>
          <button class="btn-primary plab-done" data-back>← Build another</button>
        </div>`;
      _overlay.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => { active = null; renderCatalog(); }));
    });
    setTimeout(() => ta.focus(), 60);
  }

  function close() {
    if (!_open) return;
    _open = false;
    _overlay?.classList.remove('visible');
    setTimeout(() => { _overlay?.remove(); _overlay = null; }, 140);
    try { onClose?.(); } catch {}
  }

  // Click outside the card closes (catalog view only — avoid losing a draft).
  _overlay.addEventListener('click', (e) => { if (e.target === _overlay && !active) close(); });
  // Esc closes.
  const onKey = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); if (active) { active = null; renderCatalog(); } else close(); }
  };
  _overlay.addEventListener('keydown', onKey);
  _overlay.setAttribute('tabindex', '-1');

  renderCatalog();
  _overlay.focus();
}

export function closeProductLab() {
  if (!_open) return;
  _open = false;
  _overlay?.classList.remove('visible');
  setTimeout(() => { _overlay?.remove(); _overlay = null; }, 140);
}
