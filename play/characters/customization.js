// customization.js — light-touch player customization (face style, hair
// color, skin tone). Persists to localStorage under `ccq_customization`.
// Defaults are sensible; if the user never opens the panel, the existing
// player look is unchanged.

const KEY = 'ccq_customization';

// The player is a GLTF-rigged character, so the old face-style / hair-color
// / skin-tone options had no effect (those only apply to the procedural
// fallback body — the rig has a single baked mesh + texture). The
// meaningful customization for a GLTF avatar is choosing the MODEL itself.
// `avatar` is a manifest rig id; buildPlayer sets it as the player look's
// _gltfAsset so makeCharacter uses the chosen rig.
export const AVATARS = [
  { id: 'hero',           label: 'Default' },
  { id: 'western_male',   label: 'Western · M' },
  { id: 'western_female', label: 'Western · F' },
  { id: 'african_male',   label: 'African · M' },
  { id: 'african_female', label: 'African · F' },
  { id: 'easian_male',    label: 'E. Asian · M' },
  { id: 'easian_female',  label: 'E. Asian · F' },
  { id: 'sasian_male',    label: 'S. Asian · M' },
  { id: 'sasian_female',  label: 'S. Asian · F' },
  { id: 'arab_male',      label: 'Arab · M' },
  { id: 'hijab_female',   label: 'Hijabi · F' },
];
const AVATAR_IDS = AVATARS.map(a => a.id);

// Kept for the procedural-fallback body (when a chosen rig fails to load).
export const FACE_STYLES = ['round', 'dot', 'sleepy', 'sharp'];

export const DEFAULT_CUSTOMIZATION = {
  avatar: 'hero',
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
      avatar: AVATAR_IDS.includes(parsed.avatar) ? parsed.avatar : DEFAULT_CUSTOMIZATION.avatar,
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

    panel.appendChild(el('div', { class: 'aud-title' }, ['Choose your avatar']));

    panel.appendChild(buildPicker(AVATARS.map(a => ({ label: a.label, value: a.id, swatch: false })),
      cur.avatar, v => { saveCustomization({ ...cur, avatar: v }); onChange?.(loadCustomization()); rebuild(); }));

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
