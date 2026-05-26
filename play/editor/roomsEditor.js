// roomsEditor.js — in-game room layout editor.
//
// Activation
//   Gated by sessionStorage.ccq_admin set by app.js's admin button.
//   When set, the play view shows an "Edit Rooms" toggle (top-right).
//   Toggling enters edit mode: gameplay input is suspended, a click
//   raycaster + TransformControls are attached, and a hand-rolled
//   panel exposes position / rotation / size of the selected object.
//
// What it edits
//   Every node tagged with userData._roomId + ._roomEntryIndex by
//   roomsLoader is selectable. That covers:
//     - decoration / wall / floor_plate / wall_sign / poster nodes
//     - builder fn nodes that return THREE.Object3D (chair, desk,
//       plant, table, lamp, monitor, water_cooler, couch, bookshelf,
//       filing_cabinet)
//   Compound builders (atrium, elevator, decorate_*) add sub-meshes
//   internally via scene.add — those are NOT tagged and are not
//   directly draggable. The editor never modifies the data entries for
//   compound builders.
//
// Export
//   "Export Layout" serializes window.ROOMS back into the data/rooms.js
//   source format. Output goes to clipboard AND offered as a .js
//   download. Paste/save manually into data/rooms.js to commit.
//
// Cancel / close
//   "Cancel" reloads the page. The page reload re-fetches data/rooms.js
//   from disk, so any unsaved edits are discarded. Nothing is written
//   to localStorage by the editor.

import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

// ── Public API ───────────────────────────────────────────────────────

let isActive = false;
let _ctx = null;        // { scene, camera, renderer, container }
let _transformControls = null;
let _selected = null;   // tagged Object3D currently in TransformControls
let _selectedEntry = null;  // the data entry the selected node maps to
let _panelEl = null;
let _toolbarEl = null;
let _onWindowKeyDown = null;
let _onCanvasPointerDown = null;
let _onTransformChange = null;
let _onObjectChange = null;
let _onGameInputSuspendListeners = [];  // unsuspend fns

export function isEditorActive() { return isActive; }

// Returns true if admin mode is enabled for this browser session.
export function isAdminEnabled() {
  try { return sessionStorage.getItem('ccq_admin') === '1'; }
  catch { return false; }
}

// Build the toolbar (Edit Rooms toggle + Export + Cancel buttons).
// Returns the toolbar DOM element. Caller appends it inside the play
// view container. Hidden via display:none when admin isn't on.
export function mountToolbar({ container, onEnter, onExit, onExport }) {
  if (_toolbarEl) return _toolbarEl;
  const el = document.createElement('div');
  el.className = 'ccq-editor-toolbar';
  el.style.cssText = `
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    display: ${isAdminEnabled() ? 'flex' : 'none'};
    gap: 8px;
    pointer-events: auto;
    font-family: system-ui, sans-serif;
  `;
  el.innerHTML = `
    <button class="ccq-ed-btn ccq-ed-toggle">✏️ Edit Rooms</button>
    <button class="ccq-ed-btn ccq-ed-export" style="display:none;">📋 Export Layout</button>
    <button class="ccq-ed-btn ccq-ed-cancel" style="display:none;">✕ Cancel (reload)</button>
  `;
  injectStylesOnce();
  container.appendChild(el);
  _toolbarEl = el;

  const toggleBtn = el.querySelector('.ccq-ed-toggle');
  const exportBtn = el.querySelector('.ccq-ed-export');
  const cancelBtn = el.querySelector('.ccq-ed-cancel');

  toggleBtn.addEventListener('click', () => {
    if (isActive) onExit?.();
    else onEnter?.();
  });
  exportBtn.addEventListener('click', () => onExport?.());
  cancelBtn.addEventListener('click', () => {
    if (confirm('Discard unsaved edits and reload?')) {
      window.location.reload();
    }
  });
  return el;
}

function setToolbarMode(editing) {
  if (!_toolbarEl) return;
  const toggleBtn = _toolbarEl.querySelector('.ccq-ed-toggle');
  const exportBtn = _toolbarEl.querySelector('.ccq-ed-export');
  const cancelBtn = _toolbarEl.querySelector('.ccq-ed-cancel');
  toggleBtn.textContent = editing ? '🎮 Resume Play' : '✏️ Edit Rooms';
  exportBtn.style.display = editing ? 'inline-block' : 'none';
  cancelBtn.style.display = editing ? 'inline-block' : 'none';
}

// ── Enter / exit edit mode ───────────────────────────────────────────

export function enterEditMode({ scene, camera, renderer, container, suspendGameInput }) {
  if (isActive) return;
  if (!isAdminEnabled()) {
    console.warn('[editor] not admin; refusing to enter edit mode');
    return;
  }
  isActive = true;
  _ctx = { scene, camera, renderer, container };

  setToolbarMode(true);

  // Suspend gameplay input (caller passes a fn that disables WASD,
  // joystick, jump, talk, etc.).
  if (typeof suspendGameInput === 'function') {
    const release = suspendGameInput();
    if (typeof release === 'function') _onGameInputSuspendListeners.push(release);
  }

  // Show every floor (so the user can edit rooms across floors). We
  // tag the current visibility state so the exit path can restore it.
  _saveAndShowAllFloors(scene);

  // TransformControls — drag-to-move / rotate / scale gizmo.
  _transformControls = new TransformControls(camera, renderer.domElement);
  _transformControls.setSize(1.2);
  _transformControls.setSpace('world');
  scene.add(_transformControls);

  // While dragging the gizmo, OrbitControls/touch-look fight us. The
  // 'dragging-changed' event lets us tell game input to stand down
  // for the drag duration.
  _onTransformChange = (e) => {
    // No-op for now — gameplay input is already suspended by edit mode.
    // Reserved hook for future "click outside to deselect".
  };
  _transformControls.addEventListener('dragging-changed', _onTransformChange);

  _onObjectChange = () => {
    syncPanelFromSelection();
    syncDataEntryFromSelection();
  };
  _transformControls.addEventListener('objectChange', _onObjectChange);

  // Click handler on the WebGL canvas: raycast to select an object.
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  _onCanvasPointerDown = (e) => {
    // Ignore clicks on the TransformControls handles themselves.
    if (_transformControls?.dragging) return;
    // Only LMB (or single-touch).
    if (e.button !== undefined && e.button !== 0) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObjects(scene.children, true);
    for (const hit of hits) {
      // Ignore TransformControls helper meshes.
      if (isTransformHelper(hit.object)) continue;
      const tagged = findTaggedAncestor(hit.object);
      if (tagged) { select(tagged); return; }
    }
    // Empty click — deselect.
    select(null);
  };
  renderer.domElement.addEventListener('pointerdown', _onCanvasPointerDown);

  // Esc closes the panel / deselects.
  _onWindowKeyDown = (e) => {
    if (e.key === 'Escape') select(null);
    if (e.key === 'g') _transformControls?.setMode('translate');
    if (e.key === 'r') _transformControls?.setMode('rotate');
  };
  window.addEventListener('keydown', _onWindowKeyDown);

  // Side panel.
  ensurePanel(container);
  refreshPanel();
}

export function exitEditMode() {
  if (!isActive) return;
  isActive = false;
  setToolbarMode(false);

  if (_transformControls) {
    _transformControls.detach();
    _transformControls.removeEventListener('dragging-changed', _onTransformChange);
    _transformControls.removeEventListener('objectChange', _onObjectChange);
    _ctx.scene.remove(_transformControls);
    _transformControls.dispose?.();
    _transformControls = null;
  }
  if (_ctx?.renderer?.domElement && _onCanvasPointerDown) {
    _ctx.renderer.domElement.removeEventListener('pointerdown', _onCanvasPointerDown);
  }
  if (_onWindowKeyDown) window.removeEventListener('keydown', _onWindowKeyDown);

  // Release any suspended game input listeners.
  for (const release of _onGameInputSuspendListeners) {
    try { release(); } catch {}
  }
  _onGameInputSuspendListeners.length = 0;

  if (_ctx?.scene) _restoreFloorVisibility(_ctx.scene);

  if (_panelEl) _panelEl.style.display = 'none';
  _selected = null;
  _selectedEntry = null;
  _ctx = null;
}

// ── Selection ────────────────────────────────────────────────────────

function isTransformHelper(obj) {
  let p = obj;
  while (p) {
    if (p === _transformControls) return true;
    if (p.type && p.type.startsWith('Transform')) return true;
    p = p.parent;
  }
  return false;
}

function findTaggedAncestor(obj) {
  let p = obj;
  while (p) {
    if (p.userData && p.userData._roomId != null && p.userData._roomEntryIndex != null) {
      return p;
    }
    p = p.parent;
  }
  return null;
}

function select(node) {
  _selected = node;
  if (!node) {
    _transformControls?.detach();
    _selectedEntry = null;
    refreshPanel();
    return;
  }
  _selectedEntry = lookupEntry(node);
  _transformControls?.attach(node);
  refreshPanel();
}

function lookupEntry(node) {
  const roomId = node.userData._roomId;
  const idx = node.userData._roomEntryIndex;
  const room = window.ROOM_BY_ID?.(roomId);
  if (!room) return null;
  const entry = room.objects[idx];
  return { room, entry, index: idx };
}

// ── Panel (hand-rolled — zero deps) ──────────────────────────────────

function ensurePanel(container) {
  if (_panelEl) { _panelEl.style.display = 'block'; return; }
  const el = document.createElement('div');
  el.className = 'ccq-editor-panel';
  el.style.cssText = `
    position: absolute;
    top: 60px;
    right: 12px;
    z-index: 20;
    width: 280px;
    max-height: calc(100vh - 90px);
    overflow-y: auto;
    background: rgba(20,28,48,0.94);
    color: #e6edf7;
    border: 1px solid rgba(201,164,76,0.45);
    border-radius: 8px;
    padding: 12px 12px 14px;
    font: 13px/1.35 system-ui, sans-serif;
    pointer-events: auto;
    user-select: none;
  `;
  container.appendChild(el);
  _panelEl = el;
}

function refreshPanel() {
  if (!_panelEl) return;
  if (!_selected || !_selectedEntry) {
    _panelEl.innerHTML = `
      <div class="ccq-ed-h">Edit Rooms</div>
      <div class="ccq-ed-hint">
        Click an object to select it.<br>
        <kbd>G</kbd> translate · <kbd>R</kbd> rotate · <kbd>Esc</kbd> deselect.<br>
        Compound builders (atrium, elevator, decorate_*) aren't directly editable —
        only their top-level data entries.
      </div>
    `;
    return;
  }
  const { entry, room, index } = _selectedEntry;
  const node = _selected;
  const yOffset = node.userData._yOffset || 0;
  const dataPosY = (node.position.y - yOffset).toFixed(3);

  const typeLabel = entry.type === 'builder'
    ? `builder · ${entry.fn || '?'}`
    : entry.type === 'decoration'
      ? `decoration · ${entry.id || '?'}`
      : entry.type;

  const sizeEditable = ['decoration', 'wall', 'floor_plate'].includes(entry.type);

  _panelEl.innerHTML = `
    <div class="ccq-ed-h">${room.id} #${index}</div>
    <div class="ccq-ed-sub">${typeLabel}</div>

    <div class="ccq-ed-row">
      <label>x</label>
      <input class="ccq-ed-num" id="ccq-pos-x" type="number" step="0.05" value="${node.position.x.toFixed(3)}">
    </div>
    <div class="ccq-ed-row">
      <label>y</label>
      <input class="ccq-ed-num" id="ccq-pos-y" type="number" step="0.05" value="${dataPosY}">
    </div>
    <div class="ccq-ed-row">
      <label>z</label>
      <input class="ccq-ed-num" id="ccq-pos-z" type="number" step="0.05" value="${node.position.z.toFixed(3)}">
    </div>
    <div class="ccq-ed-row">
      <label>rotY</label>
      <input class="ccq-ed-num" id="ccq-rot-y" type="number" step="0.087266" value="${node.rotation.y.toFixed(4)}">
    </div>

    ${sizeEditable ? `
      <div class="ccq-ed-divider"></div>
      <div class="ccq-ed-sub" style="margin-bottom:6px;">size</div>
      <div class="ccq-ed-row">
        <label>width</label>
        <input class="ccq-ed-num" id="ccq-size-w" type="number" step="0.05" value="${(entry.size?.width || entry.size?.w || '').toString()}">
      </div>
      <div class="ccq-ed-row">
        <label>height</label>
        <input class="ccq-ed-num" id="ccq-size-h" type="number" step="0.05" value="${(entry.size?.height || entry.size?.h || '').toString()}">
      </div>
      <div class="ccq-ed-row">
        <label>depth</label>
        <input class="ccq-ed-num" id="ccq-size-d" type="number" step="0.05" value="${(entry.size?.depth || entry.size?.d || '').toString()}">
      </div>
      ${entry.type === 'decoration' ? `
      <div class="ccq-ed-row">
        <label>stretch</label>
        <input id="ccq-stretch" type="checkbox" ${entry.size?.stretch ? 'checked' : ''}>
      </div>
      ` : ''}
      <div class="ccq-ed-hint" style="margin-top:6px;">
        Changing size rebuilds the mesh in place.
      </div>
    ` : `<div class="ccq-ed-hint">Size for "${entry.type}" entries is not editable — adjust args in data/rooms.js directly.</div>`}

    <div class="ccq-ed-divider"></div>
    <button class="ccq-ed-btn ccq-ed-btn-sm" id="ccq-deselect">Deselect</button>
  `;

  _panelEl.querySelector('#ccq-pos-x').addEventListener('input', onPosInput);
  _panelEl.querySelector('#ccq-pos-y').addEventListener('input', onPosInput);
  _panelEl.querySelector('#ccq-pos-z').addEventListener('input', onPosInput);
  _panelEl.querySelector('#ccq-rot-y').addEventListener('input', onRotInput);
  if (sizeEditable) {
    _panelEl.querySelector('#ccq-size-w').addEventListener('input', onSizeInput);
    _panelEl.querySelector('#ccq-size-h').addEventListener('input', onSizeInput);
    _panelEl.querySelector('#ccq-size-d').addEventListener('input', onSizeInput);
    if (entry.type === 'decoration') {
      _panelEl.querySelector('#ccq-stretch').addEventListener('change', onStretchToggle);
    }
  }
  _panelEl.querySelector('#ccq-deselect').addEventListener('click', () => select(null));
}

function onPosInput(e) {
  if (!_selected || !_selectedEntry) return;
  const yOffset = _selected.userData._yOffset || 0;
  const x = parseFloat(document.getElementById('ccq-pos-x').value) || 0;
  const yData = parseFloat(document.getElementById('ccq-pos-y').value) || 0;
  const z = parseFloat(document.getElementById('ccq-pos-z').value) || 0;
  _selected.position.set(x, yData + yOffset, z);
  syncDataEntryFromSelection();
}

function onRotInput() {
  if (!_selected) return;
  const ry = parseFloat(document.getElementById('ccq-rot-y').value) || 0;
  _selected.rotation.y = ry;
  syncDataEntryFromSelection();
}

function onSizeInput() {
  if (!_selectedEntry) return;
  const { entry } = _selectedEntry;
  const w = parseFloat(document.getElementById('ccq-size-w').value);
  const h = parseFloat(document.getElementById('ccq-size-h').value);
  const d = parseFloat(document.getElementById('ccq-size-d').value);

  if (entry.type === 'decoration') {
    if (!entry.size) entry.size = {};
    if (isFinite(w)) entry.size.width = w;
    if (isFinite(h)) entry.size.height = h;
    if (isFinite(d)) entry.size.depth = d;
    rebuildSelectedMesh();
  } else if (entry.type === 'wall') {
    if (!entry.size) entry.size = {};
    if (isFinite(w)) entry.size.w = w;
    if (isFinite(h)) entry.size.h = h;
    if (isFinite(d)) entry.size.d = d;
    rebuildSelectedMesh();
  } else if (entry.type === 'floor_plate') {
    if (!entry.size) entry.size = {};
    if (isFinite(w)) entry.size.w = w;
    if (isFinite(d)) entry.size.d = d;
    rebuildSelectedMesh();
  }
}

function onStretchToggle(e) {
  if (!_selectedEntry) return;
  const { entry } = _selectedEntry;
  if (!entry.size) entry.size = {};
  entry.size.stretch = e.target.checked;
  rebuildSelectedMesh();
}

// Rebuild only the size-affected geometry of the currently-selected
// node in place. Walls + floor plates: swap the geometry. Decorations:
// re-call makeDecoration and replace the wrapper.
function rebuildSelectedMesh() {
  if (!_selected || !_selectedEntry) return;
  const { entry } = _selectedEntry;
  const node = _selected;

  if (entry.type === 'wall') {
    // Replace BoxGeometry on the first mesh child (or self).
    const mesh = node.isMesh ? node : node.children.find(c => c.isMesh);
    if (mesh) {
      mesh.geometry.dispose();
      mesh.geometry = new THREE.BoxGeometry(entry.size.w || 1, entry.size.h || 1, entry.size.d || 1);
    }
  } else if (entry.type === 'floor_plate') {
    const mesh = node.isMesh ? node : node.children.find(c => c.isMesh);
    if (mesh) {
      mesh.geometry.dispose();
      mesh.geometry = new THREE.PlaneGeometry(entry.size.w || 22, entry.size.d || 22);
    }
  } else if (entry.type === 'decoration') {
    // Rebuild via makeDecoration. The wrapper group's identity changes;
    // we attach TransformControls to the new node.
    import('../decorations/decorationAssets.js?v=20260526l').then(({ makeDecoration }) => {
      const next = makeDecoration(entry.id, entry.size || {});
      if (!next) return;
      next.position.copy(node.position);
      next.rotation.copy(node.rotation);
      next.userData._roomId = node.userData._roomId;
      next.userData._roomEntryIndex = node.userData._roomEntryIndex;
      next.userData._yOffset = node.userData._yOffset;
      if (node.userData.floor != null) next.userData.floor = node.userData.floor;
      _ctx.scene.add(next);
      _ctx.scene.remove(node);
      _selected = next;
      _transformControls?.attach(next);
    });
  }
}

// Mirror the selected node's transform into the data entry it
// represents. Called both when TransformControls drags the gizmo and
// when the panel's number inputs change.
function syncDataEntryFromSelection() {
  if (!_selected || !_selectedEntry) return;
  const { entry } = _selectedEntry;
  const yOffset = _selected.userData._yOffset || 0;
  entry.pos = [
    +_selected.position.x.toFixed(4),
    +(_selected.position.y - yOffset).toFixed(4),
    +_selected.position.z.toFixed(4),
  ];
  entry.rotY = +_selected.rotation.y.toFixed(5);
}

// Mirror node → panel input fields. Called when TransformControls
// drags so the numeric fields stay in sync with the gizmo.
function syncPanelFromSelection() {
  if (!_panelEl || !_selected) return;
  const yOffset = _selected.userData._yOffset || 0;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  set('ccq-pos-x', _selected.position.x.toFixed(3));
  set('ccq-pos-y', (_selected.position.y - yOffset).toFixed(3));
  set('ccq-pos-z', _selected.position.z.toFixed(3));
  set('ccq-rot-y', _selected.rotation.y.toFixed(4));
}

// ── Floor visibility — temporarily show all floors while editing ─────

let _savedVisibility = null;
function _saveAndShowAllFloors(scene) {
  _savedVisibility = new Map();
  scene.traverse((o) => {
    if (o.userData?.floor !== undefined) {
      _savedVisibility.set(o, o.visible);
      o.visible = true;
    }
  });
}
function _restoreFloorVisibility(scene) {
  if (!_savedVisibility) return;
  for (const [o, v] of _savedVisibility) {
    if (o && typeof v === 'boolean') o.visible = v;
  }
  _savedVisibility = null;
}

// ── Export ───────────────────────────────────────────────────────────

export function exportLayout() {
  const text = serializeRooms(window.ROOMS || []);
  // Clipboard copy.
  let copied = false;
  try {
    navigator.clipboard.writeText(text).then(() => {}, () => {});
    copied = true;
  } catch {}
  // Download as file.
  const blob = new Blob([text], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rooms.js';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
  alert(copied
    ? 'Layout copied to clipboard AND downloaded as rooms.js.\nPaste into data/rooms.js or replace the file.'
    : 'Layout downloaded as rooms.js.\nReplace data/rooms.js with the new file.'
  );
}

function serializeRooms(rooms) {
  // Preserve the original file's preamble + the `const wallH = 3.8;`
  // helper. The body is reconstructed from in-memory window.ROOMS.
  const header = `// rooms.js — declarative scene-layout data.
// EXPORTED FROM IN-GAME EDITOR — generated ${new Date().toISOString()}
//
// See play/world/roomsLoader.js for the entry-type spec.

const wallH = 3.8;

window.ROOMS = `;
  const footer = `;

// Lookup helpers used by play.js and the in-game editor.
window.ROOM_BY_ZONE = (floor, zoneIdx) =>
  window.ROOMS.find(r => r.floor === floor && r.zoneIdx === zoneIdx) || null;
window.ROOM_BY_ID = (id) => window.ROOMS.find(r => r.id === id) || null;
`;
  const body = stringifyRooms(rooms);
  return header + body + footer;
}

// Pretty-print the rooms array in a format close to the original
// hand-written file (one entry per line; numbers fixed to 4 decimals
// where useful; preserves entry-key order).
function stringifyRooms(rooms) {
  return '[\n' + rooms.map((r, i) => '  ' + stringifyRoom(r) + (i < rooms.length - 1 ? ',' : '')).join('\n') + '\n]';
}

function stringifyRoom(room) {
  const lines = ['{'];
  lines.push(`    id: ${q(room.id)},`);
  if (room.floor != null) lines.push(`    floor: ${room.floor},`);
  if (room.zoneIdx != null) lines.push(`    zoneIdx: ${room.zoneIdx},`);
  if (room.template != null) lines.push(`    template: ${q(room.template)},`);
  if (room.center) lines.push(`    center: [${room.center.join(', ')}],`);
  if (room.description) lines.push(`    description: ${q(room.description)},`);
  lines.push('    objects: [');
  for (let i = 0; i < (room.objects || []).length; i++) {
    const e = room.objects[i];
    lines.push('      ' + stringifyEntry(e) + (i < room.objects.length - 1 ? ',' : ''));
  }
  lines.push('    ],');
  lines.push('  }');
  return lines.join('\n');
}

function stringifyEntry(e) {
  const parts = [`type: ${q(e.type)}`];
  if (e.id) parts.push(`id: ${q(e.id)}`);
  if (e.fn) parts.push(`fn: ${q(e.fn)}`);
  if (e.text) parts.push(`text: ${q(e.text)}`);
  if (e.title) parts.push(`title: ${q(e.title)}`);
  if (e.sub) parts.push(`sub: ${q(e.sub)}`);
  if (e.pos) parts.push(`pos: [${e.pos.map(n => fmtNum(n)).join(', ')}]`);
  if (e.rotY != null) parts.push(`rotY: ${fmtNum(e.rotY)}`);
  if (e.size) parts.push(`size: ${stringifySize(e.size)}`);
  if (e.color != null) parts.push(`color: 0x${e.color.toString(16).padStart(6, '0')}`);
  if (e.metalness != null) parts.push(`metalness: ${fmtNum(e.metalness)}`);
  if (e.roughness != null) parts.push(`roughness: ${fmtNum(e.roughness)}`);
  if (e.bg) parts.push(`bg: ${q(e.bg)}`);
  if (e.fg) parts.push(`fg: ${q(e.fg)}`);
  if (e.args) parts.push(`args: ${stringifyArgs(e.args)}`);
  return `{ ${parts.join(', ')} }`;
}

function stringifySize(s) {
  const parts = [];
  for (const k of ['width', 'height', 'depth', 'w', 'h', 'd']) {
    if (s[k] != null) parts.push(`${k}: ${fmtNum(s[k])}`);
  }
  if (s.stretch) parts.push(`stretch: true`);
  return `{ ${parts.join(', ')} }`;
}

function stringifyArgs(a) {
  const parts = [];
  for (const k in a) {
    const v = a[k];
    if (typeof v === 'number') parts.push(`${k}: ${fmtNum(v)}`);
    else if (typeof v === 'string') parts.push(`${k}: ${q(v)}`);
    else if (typeof v === 'boolean') parts.push(`${k}: ${v}`);
    else if (v != null) parts.push(`${k}: ${JSON.stringify(v)}`);
  }
  return `{ ${parts.join(', ')} }`;
}

function q(s) { return `'${String(s).replace(/'/g, "\\'")}'`; }
function fmtNum(n) {
  const s = (+n).toFixed(4);
  // Trim trailing zeros after the decimal point.
  return s.replace(/\.?0+$/, '');
}

// ── Styles ───────────────────────────────────────────────────────────

let _stylesInjected = false;
function injectStylesOnce() {
  if (_stylesInjected) return;
  _stylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    .ccq-ed-btn {
      background: rgba(20,28,48,0.94);
      color: #ffd166;
      border: 1px solid rgba(201,164,76,0.55);
      border-radius: 6px;
      padding: 6px 12px;
      font: 13px/1.2 system-ui, sans-serif;
      cursor: pointer;
    }
    .ccq-ed-btn:hover { background: rgba(40,52,84,0.94); }
    .ccq-ed-btn-sm { padding: 4px 10px; font-size: 12px; }
    .ccq-ed-h { font-weight: 600; font-size: 13px; margin-bottom: 2px; color: #ffd166; }
    .ccq-ed-sub { font-size: 11px; opacity: 0.7; margin-bottom: 8px; font-family: ui-monospace, monospace; }
    .ccq-ed-row { display: flex; align-items: center; gap: 6px; margin: 4px 0; }
    .ccq-ed-row label { width: 56px; opacity: 0.85; font-size: 12px; }
    .ccq-ed-num {
      flex: 1; background: rgba(0,0,0,0.35); color: #e6edf7;
      border: 1px solid rgba(255,255,255,0.15); border-radius: 4px;
      padding: 4px 6px; font: 12px ui-monospace, monospace;
    }
    .ccq-ed-num:focus { outline: 1px solid rgba(201,164,76,0.8); }
    .ccq-ed-divider { height: 1px; background: rgba(255,255,255,0.12); margin: 10px 0; }
    .ccq-ed-hint { font-size: 11px; opacity: 0.65; line-height: 1.4; margin-top: 8px; }
    .ccq-ed-hint kbd {
      background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.18);
      border-radius: 3px; padding: 1px 4px; font-size: 10px;
    }
  `;
  document.head.appendChild(style);
}
