// loadingOverlay.js — minimal "Loading characters..." overlay for the
// GLTF asset preload phase.
//
// Public API:
//   const overlay = createLoadingOverlay();
//   overlay.show('Loading characters...');
//   overlay.setProgress(loaded, total);
//   overlay.setMessage('Almost done...');
//   overlay.hide();      // fades out and removes itself
//
// Renders absolutely-positioned over the play canvas. CSS is inline so
// it works without touching style.css.

export function createLoadingOverlay() {
  const root = document.createElement('div');
  root.id = 'ccq-loading-overlay';
  Object.assign(root.style, {
    position: 'fixed', inset: '0', zIndex: '9999',
    display: 'none',
    alignItems: 'center', justifyContent: 'center',
    background: 'rgba(15, 23, 42, 0.94)',
    color: '#e9eef3',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    transition: 'opacity 0.3s ease',
    opacity: '0',
  });

  const card = document.createElement('div');
  Object.assign(card.style, {
    textAlign: 'center', maxWidth: '320px', padding: '24px',
  });

  const title = document.createElement('div');
  title.textContent = 'Loading characters...';
  Object.assign(title.style, {
    fontSize: '18px', marginBottom: '14px', color: '#f3e7d2',
  });
  card.appendChild(title);

  const barBg = document.createElement('div');
  Object.assign(barBg.style, {
    width: '260px', height: '6px', background: 'rgba(255,255,255,0.12)',
    borderRadius: '3px', overflow: 'hidden', margin: '0 auto',
  });
  const barFill = document.createElement('div');
  Object.assign(barFill.style, {
    width: '0%', height: '100%', background: '#c9a44c',
    transition: 'width 0.2s ease',
  });
  barBg.appendChild(barFill);
  card.appendChild(barBg);

  const counter = document.createElement('div');
  counter.textContent = '';
  Object.assign(counter.style, {
    fontSize: '13px', marginTop: '10px', opacity: '0.7',
  });
  card.appendChild(counter);

  root.appendChild(card);
  document.body.appendChild(root);

  return {
    show(message = 'Loading characters...') {
      title.textContent = message;
      root.style.display = 'flex';
      // double-RAF so display change registers before opacity transition
      requestAnimationFrame(() => requestAnimationFrame(() => {
        root.style.opacity = '1';
      }));
    },
    setProgress(loaded, total) {
      const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
      barFill.style.width = pct + '%';
      counter.textContent = `${loaded} / ${total}`;
    },
    setMessage(message) {
      title.textContent = message;
    },
    hide() {
      root.style.opacity = '0';
      setTimeout(() => {
        root.style.display = 'none';
        if (root.parentNode) root.parentNode.removeChild(root);
      }, 320);
    },
  };
}
