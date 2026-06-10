// docViewer.js — Kedash Protocol full-screen document reader (SYS-05).
//
// Monospace "internal memo / terminal cat" overlay for readable props
// (SYS-06 collectibles) and mid-scene payoffs (TWIST 2's client-profiles
// ledger). DOM-thin: play.js injects { playUi, setInputLocked,
// isSceneActive } via initDocViewer, mirroring sceneRunner's pattern.
//
// Layering contract: the overlay sits ABOVE the dialogue card
// (z-index in style.css) and never touches scene state. While a
// scripted scene is active, closing the document must NOT release the
// input lock — the scene owns it and releases it in its own teardown.

let ctx = null;
let overlayEl = null;
let current = null;       // { onClose } while a document is open
let keyListener = null;

export function initDocViewer(c) {
  ctx = c;
}

export function isDocumentOpen() {
  return !!current;
}

function ensureOverlay() {
  if (overlayEl && document.body.contains(overlayEl)) return overlayEl;
  overlayEl = document.createElement('div');
  overlayEl.className = 'doc-viewer';
  overlayEl.innerHTML = `
    <div class="doc-viewer-card">
      <div class="doc-viewer-head">
        <span class="doc-viewer-title"></span>
        <button class="doc-viewer-close" aria-label="Close">×</button>
      </div>
      <pre class="doc-viewer-body"></pre>
      <div class="doc-viewer-hint">Esc / E or click outside — close</div>
    </div>`;
  overlayEl.addEventListener('click', (e) => {
    if (e.target === overlayEl) closeDocument();
  });
  overlayEl.querySelector('.doc-viewer-close').onclick = () => closeDocument();
  document.body.appendChild(overlayEl);
  return overlayEl;
}

export function openDocument({ title = '', body = '', onClose } = {}) {
  if (current) closeDocument();
  const el = ensureOverlay();
  el.querySelector('.doc-viewer-title').textContent = title;
  const bodyEl = el.querySelector('.doc-viewer-body');
  bodyEl.textContent = body;
  bodyEl.scrollTop = 0;
  el.classList.add('visible');
  current = { onClose };
  ctx?.setInputLocked?.(true);
  ctx?.playUi?.('confirm');
  // Capture-phase listener swallows EVERY key while reading — a scene
  // running underneath must not advance/abort from keys aimed at the
  // viewer (E would otherwise skip the beat the document belongs to).
  keyListener = (e) => {
    e.stopPropagation();
    if (!e.repeat && (e.key === 'Escape' || e.key === 'e' || e.key === 'E')) {
      e.preventDefault();
      closeDocument();
    }
  };
  window.addEventListener('keydown', keyListener, true);
}

export function closeDocument() {
  if (!current) return;
  const { onClose } = current;
  current = null;
  if (keyListener) {
    window.removeEventListener('keydown', keyListener, true);
    keyListener = null;
  }
  overlayEl?.classList.remove('visible');
  ctx?.playUi?.('cancel');
  if (!ctx?.isSceneActive?.()) ctx?.setInputLocked?.(false);
  if (onClose) { try { onClose(); } catch (e) { console.warn('[doc] onClose failed', e); } }
}
