// titleCard.js — cinematic fade-in/hold/fade-out title overlay (FIN-07).
//
// Used for the epilogue's closing shot: fade to black, "THE KEDASH PROTOCOL"
// in gold, fade away. Non-blocking chrome: pointer-events none, sits above
// the three.js canvas, swallows no input. Styles are self-injected so
// style.css stays untouched (same pattern as roomsEditor.js injectStylesOnce).
//
// ── API ─────────────────────────────────────────────────────────────────────
//   import { showTitleCard } from './ui/titleCard.js';
//   showTitleCard({
//     text:   'THE KEDASH PROTOCOL',   // main line (default)
//     subtext,                          // optional smaller line beneath
//     holdMs: 2200,                     // full-opacity hold duration
//     onDone,                           // called after fade-out completes
//   });
//
// Timeline: 1200ms fade-in → holdMs hold → 1400ms fade-out (~4.8s default).
// Calling again while a card is visible replaces it (previous onDone is NOT
// fired — the new card owns the screen).

let _stylesInjected = false;
function injectStylesOnce() {
  if (_stylesInjected) return;
  _stylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    .ccq-titlecard {
      position: fixed;
      inset: 0;
      z-index: 99990;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: radial-gradient(ellipse at center,
        rgba(10, 14, 26, 0.96) 0%, rgba(4, 6, 12, 0.99) 100%);
      opacity: 0;
      transition: opacity 1200ms ease-in;
    }
    .ccq-titlecard.ccq-tc-visible { opacity: 1; }
    .ccq-titlecard.ccq-tc-leaving {
      opacity: 0;
      transition: opacity 1400ms ease-out;
    }
    .ccq-titlecard-text {
      color: #c9a44c;
      font-family: Georgia, 'Times New Roman', ui-serif, serif;
      font-size: clamp(26px, 5.5vw, 64px);
      font-weight: 600;
      letter-spacing: 0.32em;
      /* re-center: letter-spacing pads the right edge of the last glyph */
      padding-left: 0.32em;
      text-align: center;
      text-shadow: 0 0 28px rgba(201, 164, 76, 0.35);
      animation: ccq-tc-tracking 5s ease-out forwards;
    }
    .ccq-titlecard-sub {
      margin-top: 1.2em;
      color: rgba(143, 163, 200, 0.85);
      font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace;
      font-size: clamp(11px, 1.6vw, 16px);
      letter-spacing: 0.22em;
      padding-left: 0.22em;
      text-align: center;
    }
    .ccq-titlecard-rule {
      width: clamp(120px, 22vw, 280px);
      height: 1px;
      margin-top: 1.6em;
      background: linear-gradient(90deg,
        rgba(201,164,76,0) 0%, rgba(201,164,76,0.7) 50%, rgba(201,164,76,0) 100%);
    }
    @keyframes ccq-tc-tracking {
      from { letter-spacing: 0.18em; padding-left: 0.18em; }
      to   { letter-spacing: 0.34em; padding-left: 0.34em; }
    }
  `;
  document.head.appendChild(style);
}

let _active = null;   // { el, timers[] } — only one card at a time

function _teardown(card) {
  if (!card) return;
  card.timers.forEach(clearTimeout);
  card.el.remove();
  if (_active === card) _active = null;
}

export function showTitleCard({
  text = 'THE KEDASH PROTOCOL',
  subtext,
  holdMs = 2200,
  onDone,
} = {}) {
  injectStylesOnce();
  _teardown(_active);

  const el = document.createElement('div');
  el.className = 'ccq-titlecard';
  el.setAttribute('aria-hidden', 'true');

  const title = document.createElement('div');
  title.className = 'ccq-titlecard-text';
  title.textContent = text;
  el.appendChild(title);

  const rule = document.createElement('div');
  rule.className = 'ccq-titlecard-rule';
  el.appendChild(rule);

  if (subtext) {
    const sub = document.createElement('div');
    sub.className = 'ccq-titlecard-sub';
    sub.textContent = subtext;
    el.appendChild(sub);
  }

  document.body.appendChild(el);

  const card = { el, timers: [] };
  _active = card;

  const FADE_IN = 1200, FADE_OUT = 1400;
  // Double-rAF so the initial opacity:0 is committed before the
  // transition class lands — otherwise the fade-in is skipped.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.classList.add('ccq-tc-visible');
  }));
  card.timers.push(setTimeout(() => {
    el.classList.remove('ccq-tc-visible');
    el.classList.add('ccq-tc-leaving');
  }, FADE_IN + holdMs));
  card.timers.push(setTimeout(() => {
    _teardown(card);
    onDone?.();
  }, FADE_IN + holdMs + FADE_OUT + 80));
}
