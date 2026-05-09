// customization.js — light-touch player customization (face style, hair
// color, skin tone). Persists to localStorage under `ccq_customization`.
// Defaults are sensible; if the user never opens the panel, the existing
// player look is unchanged.

const KEY = 'ccq_customization';

export const FACE_STYLES = ['round', 'dot', 'sleepy', 'sharp'];
export const HAIR_COLORS = [
  { label: 'Brown',  hex: 0x3e2723 },
  { label: 'Black',  hex: 0x1a1a1a },
  { label: 'Blonde', hex: 0xc8a572 },
  { label: 'Red',    hex: 0xb87333 },
];
export const SKIN_TONES = [
  { label: 'Light',  hex: 0xfdd9b5 },
  { label: 'Tan',    hex: 0xc68642 },
  { label: 'Deep',   hex: 0x8d5524 },
];

export const DEFAULT_CUSTOMIZATION = {
  face: 'round',
  hairColor: 0x3e2723,
  skin: 0xfdd9b5,
};

export function loadCustomization() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_CUSTOMIZATION };
    const parsed = JSON.parse(raw);
    return {
      face: FACE_STYLES.includes(parsed.face) ? parsed.face : DEFAULT_CUSTOMIZATION.face,
      hairColor: typeof parsed.hairColor === 'number' ? parsed.hairColor : DEFAULT_CUSTOMIZATION.hairColor,
      skin: typeof parsed.skin === 'number' ? parsed.skin : DEFAULT_CUSTOMIZATION.skin,
    };
  } catch {
    return { ...DEFAULT_CUSTOMIZATION };
  }
}

export function saveCustomization(c) {
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch {}
}

// Mount the customization panel inside a parent (the play view container).
// Idempotent. Returns the panel element.
const PANEL_ID = 'play-custom-panel';
const BUTTON_ID = 'play-custom-btn';

function el(tag, attrs = {}, kids = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else e.setAttribute(k, v);
  }
  for (const c of kids) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  return e;
}

export function mountCustomization(parent, onChange) {
  if (document.getElementById(PANEL_ID) || document.getElementById(BUTTON_ID)) return;
  const btn = el('button', { id: BUTTON_ID, class: 'play-custom-btn', type: 'button', 'aria-label': 'Customize' });
  btn.textContent = '👤';
  parent.appendChild(btn);

  const panel = el('div', { id: PANEL_ID, class: 'play-custom-panel hidden' });
  parent.appendChild(panel);

  function rebuild() {
    panel.innerHTML = '';
    const cur = loadCustomization();

    panel.appendChild(el('div', { class: 'aud-title' }, ['Customize']));

    panel.appendChild(el('div', { class: 'cust-label' }, ['Face']));
    panel.appendChild(buildPicker(FACE_STYLES.map(s => ({ label: s, value: s, swatch: false })),
      cur.face, v => { saveCustomization({ ...cur, face: v }); onChange?.(loadCustomization()); rebuild(); }));

    panel.appendChild(el('div', { class: 'cust-label' }, ['Hair']));
    panel.appendChild(buildPicker(HAIR_COLORS.map(h => ({ label: h.label, value: h.hex, swatch: '#' + h.hex.toString(16).padStart(6, '0') })),
      cur.hairColor, v => { saveCustomization({ ...cur, hairColor: v }); onChange?.(loadCustomization()); rebuild(); }));

    panel.appendChild(el('div', { class: 'cust-label' }, ['Skin']));
    panel.appendChild(buildPicker(SKIN_TONES.map(s => ({ label: s.label, value: s.hex, swatch: '#' + s.hex.toString(16).padStart(6, '0') })),
      cur.skin, v => { saveCustomization({ ...cur, skin: v }); onChange?.(loadCustomization()); rebuild(); }));

    const close = el('button', { class: 'aud-close', type: 'button' }, ['Close']);
    close.addEventListener('click', () => panel.classList.add('hidden'));
    panel.appendChild(close);
  }

  function buildPicker(options, current, onPick) {
    const row = el('div', { class: 'cust-row' });
    options.forEach(opt => {
      const b = el('button', { class: `cust-chip ${opt.value === current ? 'active' : ''}`, type: 'button' });
      if (opt.swatch) {
        b.style.backgroundColor = opt.swatch;
        b.style.color = '#fff';
      }
      b.textContent = opt.label;
      b.addEventListener('click', () => onPick(opt.value));
      row.appendChild(b);
    });
    return row;
  }

  rebuild();
  btn.addEventListener('click', () => {
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) rebuild();
  });

  // Click outside closes.
  document.addEventListener('pointerdown', (e) => {
    if (panel.classList.contains('hidden')) return;
    if (panel.contains(e.target) || btn.contains(e.target)) return;
    panel.classList.add('hidden');
  });
}

export function unmountCustomization() {
  document.getElementById(BUTTON_ID)?.remove();
  document.getElementById(PANEL_ID)?.remove();
}
