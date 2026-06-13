// planModeExercise.js — Phase 4 pilot, ch04 whiteboard.
//
// Pre-lesson interactive Plan-Mode exercise. The player is shown a
// target file-reorganization task and a pool of candidate steps; they
// build an ordered plan by tapping (or clicking) chips into the plan
// column. Two correct orderings are accepted; both end with an
// "await approval" step. Picking the rm -rf trap (or any execution
// step before the await-approval step) rejects the plan.
//
// API: openPlanModeExercise({ onSuccess, onClose })
//   onSuccess() fires once when a valid plan is submitted — caller
//     should award the bonus + open the lesson. The exercise closes
//     itself before invoking the callback.
//   onClose() fires when the player dismisses without submitting.

// Step pool — id is stable for grading; label is what the player sees.
// Two valid orderings: SAFE_PLAN_A (recon → create dirs → moves → wait),
// SAFE_PLAN_B (echo plan → create dirs → moves → wait). Either works.
const STEP_POOL = [
  { id: 'list',       label: 'List files in current dir (ls -la kedash-support/)' },
  { id: 'echo_plan',  label: 'Echo the plan as a numbered list (no execution yet)' },
  { id: 'mkdir_faqs', label: 'Create faqs/' },
  { id: 'mkdir_tpl',  label: 'Create templates/' },
  { id: 'mkdir_esc',  label: 'Create escalations/' },
  { id: 'mkdir_int',  label: 'Create internal-notes/' },
  { id: 'mv_auth',    label: 'Plan: mv auth-faq.md → faqs/auth.md' },
  { id: 'mv_tpl',     label: 'Plan: mv reply-template.md → templates/reply.md' },
  { id: 'await',      label: 'Wait for approval / Await confirmation', terminal: true },
  // Traps — picking any of these fails the plan.
  { id: 'rm_rf',      label: 'rm -rf kedash-support/  (clean slate first)',
    danger: true, dangerReason: 'Destructive — never execute before approval. Plan Mode never runs irreversible commands.' },
  { id: 'execute',    label: 'Execute the moves now (skip approval)',
    danger: true, dangerReason: 'You are in Plan Mode. Execution waits for approval — that is the whole point.' },
];

// Two accepted orderings. Each is a Set of REQUIRED step ids — the
// player's plan passes when (a) every required id is present, (b) the
// final step is the `await` step, and (c) no danger step was picked.
// Two variants keep it forgiving: either start with a recon step
// (list) or start by echoing the plan.
const VALID_PLANS = [
  { required: new Set(['list', 'mkdir_faqs', 'mkdir_tpl', 'mkdir_esc', 'mkdir_int', 'await']) },
  { required: new Set(['echo_plan', 'mkdir_faqs', 'mkdir_tpl', 'mkdir_esc', 'mkdir_int', 'await']) },
];

function evaluatePlan(orderedIds) {
  if (!orderedIds.length) return { ok: false, reason: 'Add at least one step.' };
  // Danger check.
  for (const id of orderedIds) {
    const def = STEP_POOL.find(s => s.id === id);
    if (def?.danger) return { ok: false, reason: def.dangerReason };
  }
  // Terminal check — `await` must be last.
  if (orderedIds[orderedIds.length - 1] !== 'await') {
    return { ok: false, reason: 'Plan Mode plans END with an explicit "wait for approval" step. Move that step to the bottom.' };
  }
  // Required-set check across the two accepted variants.
  for (const plan of VALID_PLANS) {
    let ok = true;
    for (const need of plan.required) {
      if (!orderedIds.includes(need)) { ok = false; break; }
    }
    if (ok) return { ok: true };
  }
  return { ok: false, reason: 'Plan is incomplete — you need recon (list or echo), the four mkdirs, and the await-approval terminator.' };
}

let _overlay = null;
let _open = false;

export function isPlanModeOpen() { return _open; }

export function openPlanModeExercise({ onSuccess, onClose } = {}) {
  if (_open) return;
  _open = true;
  // Mount overlay inside the play view (sibling of #play-dialogue) so it
  // sits above the canvas but below the dialogue z-order isn't needed
  // here — the lesson opens AFTER this overlay is torn down.
  const host = document.getElementById('play-canvas-host')?.parentElement
    || document.body;
  _overlay = document.createElement('div');
  _overlay.className = 'plan-mode-overlay';
  _overlay.id = 'play-plan-mode';
  _overlay.innerHTML = `
    <div class="plan-mode-card" role="dialog" aria-label="Plan Mode exercise">
      <button class="plan-mode-close" aria-label="Close">×</button>
      <div class="plan-mode-eyebrow">Plan Mode — Practice</div>
      <h2 class="plan-mode-title">Draft a plan before you do</h2>
      <div class="plan-mode-target">
        <b>Target:</b> Reorganize <code>kedash-support/</code> into
        <code>faqs/</code>, <code>templates/</code>,
        <code>escalations/</code>, <code>internal-notes/</code>.
        Pick the steps in order. <b>Don't execute</b> — Plan Mode is the plan, not the run.
      </div>
      <div class="plan-mode-columns">
        <div class="plan-mode-col" data-col="pool">
          <h3>Candidate steps</h3>
          <div data-pool></div>
        </div>
        <div class="plan-mode-col" data-col="plan">
          <h3>Your plan (top → bottom = order)</h3>
          <div data-plan>
            <div class="plan-mode-empty" data-empty>Tap a step on the left to add it here.</div>
          </div>
        </div>
      </div>
      <div class="plan-mode-warning" data-warning></div>
      <div class="plan-mode-actions">
        <button class="btn-secondary plan-mode-reset" data-reset>Reset</button>
        <button class="btn-primary plan-mode-submit" data-submit>Submit plan</button>
      </div>
    </div>
  `;
  host.appendChild(_overlay);
  requestAnimationFrame(() => _overlay.classList.add('visible'));

  // State — ordered plan ids.
  let plan = [];
  // Each pool step can only be picked once (except the destructive ones
  // — but those fail submission anyway, so the constraint is uniform).
  const used = new Set();

  const poolEl    = _overlay.querySelector('[data-pool]');
  const planEl    = _overlay.querySelector('[data-plan]');
  const emptyEl   = _overlay.querySelector('[data-empty]');
  const warningEl = _overlay.querySelector('[data-warning]');

  function render() {
    // Pool chips.
    poolEl.innerHTML = '';
    for (const step of STEP_POOL) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'plan-mode-chip' + (step.danger ? ' danger' : '');
      btn.textContent = step.label;
      btn.dataset.stepId = step.id;
      if (used.has(step.id)) btn.disabled = true;
      btn.addEventListener('click', () => addStep(step.id));
      poolEl.appendChild(btn);
    }
    // Plan column.
    planEl.innerHTML = '';
    if (!plan.length) {
      planEl.appendChild(emptyEl);
      emptyEl.style.display = '';
    } else {
      let n = 1;
      for (const id of plan) {
        const def = STEP_POOL.find(s => s.id === id);
        const row = document.createElement('div');
        row.className = 'plan-mode-step';
        row.innerHTML = `
          <span class="step-num">${n}</span>
          <span class="step-text"></span>
          <button class="step-remove" aria-label="Remove step">×</button>
        `;
        row.querySelector('.step-text').textContent = def?.label || id;
        row.querySelector('.step-remove').addEventListener('click', () => removeStep(id));
        planEl.appendChild(row);
        n++;
      }
    }
    warningEl.classList.remove('visible');
  }

  function addStep(id) {
    if (used.has(id)) return;
    used.add(id);
    plan.push(id);
    render();
  }

  function removeStep(id) {
    const idx = plan.indexOf(id);
    if (idx < 0) return;
    plan.splice(idx, 1);
    used.delete(id);
    render();
  }

  function resetPlan() {
    plan = [];
    used.clear();
    render();
  }

  function showWarning(text) {
    warningEl.textContent = text;
    warningEl.classList.add('visible');
  }

  function close({ silent } = {}) {
    if (!_open) return;
    _open = false;
    _overlay?.classList.remove('visible');
    setTimeout(() => {
      _overlay?.remove();
      _overlay = null;
    }, 120);
    if (!silent) try { onClose?.(); } catch {}
  }

  function submit() {
    const result = evaluatePlan(plan);
    if (!result.ok) {
      showWarning(result.reason);
      try { window.PlayAudio?.kcIncorrect?.(); } catch {}
      return;
    }
    try { window.PlayAudio?.ppPing?.(); } catch {}
    close({ silent: true });
    try { onSuccess?.(); } catch (e) { console.warn('plan-mode onSuccess failed', e); }
  }

  _overlay.querySelector('.plan-mode-close').addEventListener('click', () => close());
  _overlay.querySelector('[data-reset]').addEventListener('click', resetPlan);
  _overlay.querySelector('[data-submit]').addEventListener('click', submit);
  // Click outside the card → close.
  _overlay.addEventListener('click', (e) => { if (e.target === _overlay) close(); });

  render();
}

export function closePlanModeExercise() {
  if (!_open) return;
  _open = false;
  _overlay?.classList.remove('visible');
  setTimeout(() => { _overlay?.remove(); _overlay = null; }, 120);
}
