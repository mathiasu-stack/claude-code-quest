// sceneRunner.js — Kedash Protocol scripted scenes (SYS-03).
//
// Plays an ordered list of dialogue beats inside the SAME dialogue-card
// chrome openDialogue() uses (play.js owns the DOM element + typewriter;
// they're injected via initSceneRunner so this module stays DOM-thin and
// play.js stays narrative-agnostic).
//
// Scope is deliberately small (production plan risk R-2):
//   - linear beat list, no branching trees
//   - a beat's `choices` array renders buttons; clicking ANY of them
//     advances to the same next beat (single-choice = flavor response)
//   - `action` is a STRING naming a handler registered by play.js via
//     registerSceneActions({ name: fn }) — the runner never touches the
//     scene graph or camera itself
//   - input stays locked for the duration; Esc (or the × button) aborts
//     WITHOUT marking the scene seen, so it re-offers later
//   - the completion callback fires only when the FINAL beat is advanced
//     past — closing early never burns the scene
//
// Beat shape: { speaker?: {name, role, portrait}, text, choices?: [..],
//               action?: 'handlerName' }
// Scene shape: { id, promptLabel?, speaker: {..}, beats: [..], endLabel? }

let ctx = null;          // injected by play.js (initSceneRunner)
const actions = {};      // name → fn, registered by play.js
let active = null;       // { def, idx, pitch, onComplete, onAbort }

export function initSceneRunner(c) {
  ctx = c;
}

export function registerSceneActions(map) {
  Object.assign(actions, map || {});
}

export function isSceneActive() {
  return !!active;
}

export function runScene(def, { pitch = 1.0, onComplete, onAbort } = {}) {
  if (!ctx || !def || !Array.isArray(def.beats) || !def.beats.length) return false;
  if (active) return false;        // one scene at a time
  active = { def, idx: 0, pitch, onComplete, onAbort };
  ctx.setInputLocked(true);
  ctx.playUi('confirm');
  _renderBeat();
  return true;
}

// Advance to the next beat (E / Enter / Continue button). When the
// typewriter is still revealing, the first press just skips to the full
// text — the second press advances. Multi-choice beats require a click
// (keyboard advance is a no-op) so the player actually picks a line.
export function advanceScene() {
  if (!active) return;
  if (ctx.skipTypewriter()) return;              // reveal first
  const beat = active.def.beats[active.idx];
  if (beat.choices && beat.choices.length > 1) return;  // must click
  _next();
}

// Abort: close without marking seen. The trigger condition stays true,
// so the scene re-offers on the next approach.
export function abortScene() {
  if (!active) return;
  const onAbort = active.onAbort;
  _teardown();
  ctx.playUi('cancel');
  if (onAbort) { try { onAbort(); } catch (e) { console.warn('[scene] onAbort failed', e); } }
}

function _next() {
  if (!active) return;
  if (active.idx >= active.def.beats.length - 1) {
    // Final beat completed — THIS is the only path that resolves the scene.
    const onComplete = active.onComplete;
    _teardown();
    ctx.playUi('confirm');
    if (onComplete) { try { onComplete(); } catch (e) { console.warn('[scene] onComplete failed', e); } }
    return;
  }
  active.idx++;
  _renderBeat();
}

function _teardown() {
  ctx.skipTypewriter();
  const d = ctx.getDialogueEl();
  if (d) { d.classList.remove('visible'); d.innerHTML = ''; }
  active = null;
  ctx.setInputLocked(false);
}

function _esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _renderBeat() {
  const { def, idx, pitch } = active;
  const beat = def.beats[idx];
  const sp = beat.speaker || def.speaker || { name: '???', role: '', portrait: '💬' };
  const isLast = idx >= def.beats.length - 1;

  let buttonsHtml;
  if (beat.choices && beat.choices.length) {
    buttonsHtml = beat.choices
      .map((c, i) => `<button class="btn-primary dlg-choice" data-choice="${i}">${_esc(c)}</button>`)
      .join('');
  } else {
    buttonsHtml = `<button class="btn-primary dlg-choice" data-choice="0">${
      _esc(isLast ? (def.endLabel || '…') : 'Continue →')
    }</button>`;
  }

  const d = ctx.getDialogueEl();
  ctx.skipTypewriter();          // cancel any prior beat's typewriter
  d.innerHTML = `
    <div class="dlg-card">
      <button class="dlg-close" aria-label="Close">×</button>
      <div class="dlg-header">
        <div class="dlg-portrait">${sp.portrait || '💬'}</div>
        <div class="dlg-who">
          <div class="dlg-name">${_esc(sp.name || '')}</div>
          <div class="dlg-role">${_esc(sp.role || '')}</div>
        </div>
      </div>
      <div class="dlg-body" data-typewriter></div>
      <div class="dlg-actions">${buttonsHtml}</div>
    </div>
  `;
  d.classList.add('visible');
  // PORT-01: swap the emoji for the speaker's rendered face when play.js
  // can resolve a mesh for it (injected resolver; emoji stays as fallback).
  if (ctx.portraitFor) {
    try {
      const purl = ctx.portraitFor(sp);
      if (purl) {
        const pEl = d.querySelector('.dlg-portrait');
        if (pEl) {
          pEl.classList.add('has-img');
          pEl.innerHTML = `<img class="dlg-portrait-img" src="${purl}" alt="">`;
        }
      }
    } catch (e) { console.warn('[scene] portrait failed', e); }
  }
  ctx.startTypewriter(d.querySelector('[data-typewriter]'), beat.text || '', pitch);

  d.querySelector('.dlg-close').onclick = () => abortScene();
  for (const btn of d.querySelectorAll('.dlg-choice')) {
    btn.onclick = () => {
      ctx.playUi('click');
      ctx.skipTypewriter();
      _next();
    };
  }

  // Mid-scene staging hook — fire and forget; a missing or throwing
  // handler must never block the dialogue.
  if (beat.action) {
    const fn = actions[beat.action];
    if (fn) { try { fn(); } catch (e) { console.warn(`[scene] action "${beat.action}" failed`, e); } }
  }
}
