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
import { dispatchEntry } from '../world/roomsLoader.js?v=20260527b';
import { setAllGlowsVisible, syncGlowToMesh } from '../world/interactables.js?v=20260527i';

// ── Public API ───────────────────────────────────────────────────────

let isActive = false;
let _ctx = null;        // { scene, camera, renderer, container }
let _transformControls = null;
let _selected = null;   // tagged Object3D currently in TransformControls
let _selectedEntry = null;  // the data entry the selected node maps to
let _panelEl = null;
let _toolbarEl = null;
let _libraryModalEl = null;
let _onWindowKeyDown = null;
let _onCanvasPointerDown = null;
let _onCanvasPointerMove = null;
let _onCanvasPointerUp = null;
let _onTransformChange = null;
let _onObjectChange = null;
let _onGameInputSuspendListeners = [];  // unsuspend fns

// Free-drag state. Populated on pointerdown atop a tagged mesh, cleared
// on pointerup. While set, pointermove projects the cursor onto a
// horizontal plane at planeY and updates the node's XZ position so the
// node tracks the cursor with a stable grab-point offset.
let _dragMode = null;
const _raycaster = new THREE.Raycaster();
const _ndc = new THREE.Vector2();
const _dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _dragHit = new THREE.Vector3();
// Per-selection axis locks. When an axis is locked, free-drag skips
// it AND the TransformControls gizmo hides that axis's handle. Reset
// to all-unlocked when selection changes.
let _axisLocks = { x: false, y: false, z: false };
function applyAxisLocksToGizmo() {
  if (!_transformControls) return;
  _transformControls.showX = !_axisLocks.x;
  _transformControls.showY = !_axisLocks.y;
  _transformControls.showZ = !_axisLocks.z;
}

export function isEditorActive() { return isActive; }

// True while the editor is mid-drag (free-drag OR gizmo). play.js
// checks this from its camera-touch handler to suppress yaw/pitch
// updates so dragging an object doesn't also spin the camera.
export function isEditorDragging() {
  return !!_dragMode || !!_transformControls?.dragging;
}

// Returns true if admin mode is enabled for this browser session.
export function isAdminEnabled() {
  try { return sessionStorage.getItem('ccq_admin') === '1'; }
  catch { return false; }
}

// Build the toolbar (Edit Rooms toggle + Export + Cancel buttons).
// Returns the toolbar DOM element. Caller appends it inside the play
// view container. Hidden via display:none when admin isn't on.
export function mountToolbar({ container, onEnter, onExit, onExport, onSavePermanently }) {
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
    <button class="ccq-ed-btn ccq-ed-add"      style="display:none;">➕ Add Item</button>
    <button class="ccq-ed-btn ccq-ed-savefs"   style="display:none;" title="Write all edits straight to disk (Chrome/Edge desktop) and reload">💾 Save Permanently</button>
    <button class="ccq-ed-btn ccq-ed-export"   style="display:none;" title="Download files for manual replacement">📋 Export Layout</button>
    <button class="ccq-ed-btn ccq-ed-cancel"   style="display:none;">✕ Cancel (reload)</button>
  `;
  injectStylesOnce();
  container.appendChild(el);
  _toolbarEl = el;

  const toggleBtn = el.querySelector('.ccq-ed-toggle');
  const addBtn    = el.querySelector('.ccq-ed-add');
  const saveFsBtn = el.querySelector('.ccq-ed-savefs');
  const exportBtn = el.querySelector('.ccq-ed-export');
  const cancelBtn = el.querySelector('.ccq-ed-cancel');

  toggleBtn.addEventListener('click', () => {
    if (isActive) onExit?.();
    else onEnter?.();
  });
  addBtn.addEventListener('click', () => showLibraryModal());
  saveFsBtn.addEventListener('click', () => onSavePermanently?.());
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
  const addBtn    = _toolbarEl.querySelector('.ccq-ed-add');
  const saveFsBtn = _toolbarEl.querySelector('.ccq-ed-savefs');
  const exportBtn = _toolbarEl.querySelector('.ccq-ed-export');
  const cancelBtn = _toolbarEl.querySelector('.ccq-ed-cancel');
  toggleBtn.textContent = editing ? '🎮 Resume Play' : '✏️ Edit Rooms';
  addBtn.style.display    = editing ? 'inline-block' : 'none';
  saveFsBtn.style.display = editing ? 'inline-block' : 'none';
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

  // Hide interactable hover glow rings — they're player-only UX, and
  // in edit mode they visually compete with the underlying object and
  // would otherwise sit on top of the floor blocking picks.
  try { setAllGlowsVisible(false); } catch {}

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

  // Pointerdown: tap routing.
  //   * Double-tap (within DOUBLE_TAP_MS and DOUBLE_TAP_PX of the
  //     previous tap) commits selection — the click selects the
  //     tagged object under the cursor (or deselects if no target).
  //     This intentionally does NOT start a drag, so the second tap
  //     can't accidentally fling the object the moment it's picked.
  //   * Single tap on the currently-selected object starts free-drag.
  //   * Single tap anywhere else is a no-op (it just records the tap
  //     so the next tap can complete a double-tap pair).
  // The double-tap gate stops the editor from grabbing whatever's
  // under the cursor every time the player taps to look around.
  let _lastTapMs = 0;
  let _lastTapX = 0;
  let _lastTapY = 0;
  const DOUBLE_TAP_MS = 400;
  const DOUBLE_TAP_PX = 30;
  _onCanvasPointerDown = (e) => {
    if (_transformControls?.dragging) return;
    if (e.button !== undefined && e.button !== 0) return;

    _ndcFromEvent(e);
    _raycaster.setFromCamera(_ndc, camera);
    const hits = _raycaster.intersectObjects(scene.children, true);
    let target = null;
    for (const hit of hits) {
      if (isTransformHelper(hit.object)) continue;
      const tagged = findTaggedAncestor(hit.object);
      if (tagged) { target = tagged; break; }
    }

    const now = performance.now();
    const dt = now - _lastTapMs;
    const dx = e.clientX - _lastTapX;
    const dy = e.clientY - _lastTapY;
    const isDoubleTap = dt < DOUBLE_TAP_MS && Math.hypot(dx, dy) < DOUBLE_TAP_PX;
    _lastTapMs = now;
    _lastTapX  = e.clientX;
    _lastTapY  = e.clientY;

    if (isDoubleTap) {
      // Reset the timer so a third tap doesn't pair with the second.
      _lastTapMs = 0;
      select(target);  // null deselects
      return;          // do NOT start drag from the second tap
    }

    // Single tap. Only start a drag if the user already had this
    // object selected — that makes "select → move" a single fluid
    // gesture without requiring a second deliberate double-tap.
    if (target && target === _selected) {
      beginFreeDrag(target, e);
    }
  };
  _onCanvasPointerMove = (e) => {
    if (!_dragMode) return;
    const hit = raycastDragPlane(e);
    if (!hit) return;
    // Honor per-axis locks: a locked axis just doesn't update.
    if (!_axisLocks.x) _dragMode.node.position.x = hit.x + _dragMode.offsetX;
    if (!_axisLocks.z) _dragMode.node.position.z = hit.z + _dragMode.offsetZ;
    syncDataEntryFromSelection();
    syncPanelFromSelection();
  };
  _onCanvasPointerUp = () => { _dragMode = null; };
  renderer.domElement.addEventListener('pointerdown', _onCanvasPointerDown);
  renderer.domElement.addEventListener('pointermove', _onCanvasPointerMove);
  renderer.domElement.addEventListener('pointerup',   _onCanvasPointerUp);
  renderer.domElement.addEventListener('pointercancel', _onCanvasPointerUp);

  // Esc closes the panel / deselects. Del / Backspace deletes the
  // selected entry. G/R toggle TransformControls mode. Ctrl/Cmd+C
  // copies the current selection; Ctrl/Cmd+V pastes a duplicate ~1 m
  // offset from the original so it's immediately visible & selectable.
  _onWindowKeyDown = (e) => {
    // Don't intercept while focus is in an <input> (so panel typing
    // doesn't trigger delete / mode switches).
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.key === 'Escape') select(null);
    if (e.key === 'g') _transformControls?.setMode('translate');
    if (e.key === 'r') _transformControls?.setMode('rotate');
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (_selected) { deleteSelected(); e.preventDefault(); }
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
      if (copySelection()) e.preventDefault();
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
      if (pasteClipboard()) e.preventDefault();
    }
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
  _dragMode = null;

  if (_transformControls) {
    // Defensive cleanup — disable BEFORE detach so internal raycasts
    // stop processing, then remove the gizmo's children manually in
    // case dispose() leaves them behind in this Three.js version.
    try { _transformControls.enabled = false; } catch {}
    try { _transformControls.detach(); } catch {}
    try { _transformControls.removeEventListener('dragging-changed', _onTransformChange); } catch {}
    try { _transformControls.removeEventListener('objectChange', _onObjectChange); } catch {}
    try { _ctx.scene.remove(_transformControls); } catch {}
    // Also remove the gizmo's helper Object3D — in r166+ TransformControls
    // is itself an Object3D wrapper but its internal _root sometimes
    // stays parented even after scene.remove.
    try {
      if (_transformControls.children?.length) {
        for (const child of [..._transformControls.children]) {
          _transformControls.remove(child);
        }
      }
    } catch {}
    try { _transformControls.dispose?.(); } catch {}
    _transformControls = null;
  }
  if (_ctx?.renderer?.domElement) {
    const el = _ctx.renderer.domElement;
    if (_onCanvasPointerDown) el.removeEventListener('pointerdown', _onCanvasPointerDown);
    if (_onCanvasPointerMove) el.removeEventListener('pointermove', _onCanvasPointerMove);
    if (_onCanvasPointerUp)   el.removeEventListener('pointerup',   _onCanvasPointerUp);
    if (_onCanvasPointerUp)   el.removeEventListener('pointercancel', _onCanvasPointerUp);
    // Best-effort: release any lingering pointer capture the gizmo
    // may have grabbed during a drag.
    try { el.releasePointerCapture?.(1); } catch {}
  }
  if (_onWindowKeyDown) window.removeEventListener('keydown', _onWindowKeyDown);

  // Release any suspended game input listeners.
  for (const release of _onGameInputSuspendListeners) {
    try { release(); } catch {}
  }
  _onGameInputSuspendListeners.length = 0;

  if (_ctx?.scene) _restoreFloorVisibility(_ctx.scene);
  try { setAllGlowsVisible(true); } catch {}

  if (_panelEl) _panelEl.style.display = 'none';
  if (_libraryModalEl) _libraryModalEl.style.display = 'none';
  _selected = null;
  _selectedEntry = null;
  _clipboard = null;
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
  // Special case: clicking on an interactable's hover glow ring routes
  // selection back to the owner mesh (clicks land on the ring AT the
  // floor, the actual object sits above). _isInteractableGlow is set
  // by registerInteractable; ring is hidden in edit mode anyway, but
  // kept here for robustness if a future call leaves it visible.
  if (obj?.userData?._isInteractableGlow && obj.userData._ownerMesh) {
    obj = obj.userData._ownerMesh;
  }
  let p = obj;
  while (p) {
    if (p.userData) {
      if (p.userData._roomId != null && p.userData._roomEntryIndex != null) return p;
      if (p.userData._isNpc) return p;
      if (p.userData._isInteractable) return p;
      if (p.userData._isCompoundChild) return p;
    }
    p = p.parent;
  }
  return null;
}

// Returns 'room' for room-entry placements, 'npc' for NPC characters,
// 'interactable' for chapter-delivery objects, 'compound_child' for
// items spawned by compound builders (decorate_reception / atrium /
// elevator / etc.), or null. Determines which mutation path to use
// downstream.
function tagKind(node) {
  if (!node || !node.userData) return null;
  if (node.userData._isNpc) return 'npc';
  if (node.userData._isInteractable) return 'interactable';
  if (node.userData._isCompoundChild) return 'compound_child';
  if (node.userData._roomId != null) return 'room';
  return null;
}

function select(node) {
  _selected = node;
  if (!node) {
    _transformControls?.detach();
    _selectedEntry = null;
    _axisLocks = { x: false, y: false, z: false };
    refreshPanel();
    return;
  }
  _selectedEntry = lookupEntry(node);
  _axisLocks = { x: false, y: false, z: false };
  _transformControls?.attach(node);
  applyAxisLocksToGizmo();
  refreshPanel();
}

function lookupEntry(node) {
  const kind = tagKind(node);
  if (kind === 'room') {
    const roomId = node.userData._roomId;
    const idx = node.userData._roomEntryIndex;
    const room = window.ROOM_BY_ID?.(roomId);
    if (!room) return null;
    const entry = room.objects[idx];
    return { kind: 'room', room, entry, index: idx };
  }
  if (kind === 'npc') {
    const npcDef = node.userData.npc;
    if (!npcDef) return null;
    return { kind: 'npc', npcDef };
  }
  if (kind === 'interactable') {
    return {
      kind: 'interactable',
      lessonDeliveryRef: node.userData._lessonDeliveryRef,
      chapterId: node.userData._interactableChapterId,
      interactableKind: node.userData._interactableKind,
    };
  }
  if (kind === 'compound_child') {
    return {
      kind: 'compound_child',
      ownerId: node.userData._compoundOwner,
      childId: node.userData._compoundChildId,
    };
  }
  return null;
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
        <b>Double-tap</b> to select. Then drag with a single press.<br>
        Camera-look is suppressed while you're dragging.<br>
        Use <kbd>Space</kbd> to fly up, <kbd>C</kbd> to fly down.<br>
        Gizmo handles work for fine moves + rotates.<br>
        <kbd>G</kbd> translate · <kbd>R</kbd> rotate · <kbd>Esc</kbd> deselect · <kbd>Del</kbd> delete.<br>
        <kbd>Ctrl/Cmd+C</kbd> copy · <kbd>Ctrl/Cmd+V</kbd> paste (room items + NPCs).<br>
        <b>➕ Add Item</b> opens the library; spawn lands ~3 m in front of the camera.
      </div>
    `;
    return;
  }
  const node = _selected;
  const yOffset = node.userData._yOffset || 0;
  const dataPosY = (node.position.y - yOffset).toFixed(3);
  const sel = _selectedEntry;

  let headerLabel = '';
  let typeLabel = '';
  let sizeEditable = false;

  // Per-room-entry collision toggle. Only meaningful for builder/
  // decoration entries (walls/floors always block; signs/posters never
  // block — their collide state is fixed). Default state mirrors the
  // play.js default lookup (BUILDER_FOOTPRINTS / DECORATION_BLOCKERS).
  let collideRow = '';
  if (sel.kind === 'room') {
    const { entry, room, index } = sel;
    headerLabel = `${room.id} #${index}`;
    typeLabel = entry.type === 'builder'
      ? `builder · ${entry.fn || '?'}`
      : entry.type === 'decoration'
        ? `decoration · ${entry.id || '?'}`
        : entry.type;
    sizeEditable = ['decoration', 'wall', 'floor_plate'].includes(entry.type);
    if (entry.type === 'builder' || entry.type === 'decoration') {
      const isDefault = _defaultBlocksByEntry(entry);
      const effective = (entry.collide === true) ? true
                      : (entry.collide === false) ? false
                      : isDefault;
      const overridden = (entry.collide === true || entry.collide === false);
      collideRow = `
      <div class="ccq-ed-row" style="margin-top:4px;">
        <label>collide</label>
        <input type="checkbox" id="ccq-collide" ${effective ? 'checked' : ''}>
        <span style="font-size:11px; opacity:0.65; margin-left:4px;">
          ${overridden ? '(override)' : `(default: ${isDefault ? 'on' : 'off'})`}
        </span>
      </div>`;
    }
  } else if (sel.kind === 'npc') {
    const { npcDef } = sel;
    headerLabel = npcDef.name || npcDef.id;
    typeLabel = `npc · ${npcDef.role || npcDef.kind || '?'}`;
  } else if (sel.kind === 'interactable') {
    headerLabel = `${sel.chapterId || '?'} · ${sel.interactableKind || '?'}`;
    typeLabel = `interactable · LESSON_DELIVERY`;
  } else if (sel.kind === 'compound_child') {
    headerLabel = `${sel.ownerId || '?'} · ${sel.childId || '?'}`;
    typeLabel = `compound child`;
  }

  const lockRow = (axis) => `
    <span class="ccq-ed-lock">
      <input type="checkbox" id="ccq-lock-${axis}" ${_axisLocks[axis] ? 'checked' : ''}>
      <label for="ccq-lock-${axis}" title="Lock this axis — drag skips it, gizmo hides the handle">🔒</label>
    </span>
  `;

  _panelEl.innerHTML = `
    <div class="ccq-ed-h">${headerLabel}</div>
    <div class="ccq-ed-sub">${typeLabel}</div>

    <div class="ccq-ed-row">
      <label>x</label>
      <input class="ccq-ed-num" id="ccq-pos-x" type="number" step="0.05" value="${node.position.x.toFixed(3)}">
      ${lockRow('x')}
    </div>
    <div class="ccq-ed-row">
      <label>y</label>
      <input class="ccq-ed-num" id="ccq-pos-y" type="number" step="0.05" value="${dataPosY}">
      ${lockRow('y')}
    </div>
    <div class="ccq-ed-row">
      <label>z</label>
      <input class="ccq-ed-num" id="ccq-pos-z" type="number" step="0.05" value="${node.position.z.toFixed(3)}">
      ${lockRow('z')}
    </div>
    <div class="ccq-ed-row">
      <label>rotY</label>
      <input class="ccq-ed-num" id="ccq-rot-y" type="number" step="0.087266" value="${node.rotation.y.toFixed(4)}">
    </div>
    <div class="ccq-ed-row">
      <label>scale</label>
      <input class="ccq-ed-num" id="ccq-scale-u" type="number" step="0.05" value="${node.scale.x.toFixed(3)}" style="flex:1;" title="Uniform — sets all three axes together">
      <span style="font-size:11px; opacity:0.6;">uniform</span>
    </div>
    <div class="ccq-ed-row">
      <label style="opacity:0.7;">  x/y/z</label>
      <input class="ccq-ed-num" id="ccq-scale-x" type="number" step="0.05" value="${node.scale.x.toFixed(3)}" style="flex:1;" title="Per-axis X scale (non-uniform)">
      <input class="ccq-ed-num" id="ccq-scale-y" type="number" step="0.05" value="${node.scale.y.toFixed(3)}" style="flex:1;" title="Per-axis Y scale (non-uniform)">
      <input class="ccq-ed-num" id="ccq-scale-z" type="number" step="0.05" value="${node.scale.z.toFixed(3)}" style="flex:1;" title="Per-axis Z scale (non-uniform)">
    </div>${collideRow}${sel.kind === 'npc' ? `
    <div class="ccq-ed-hint" style="margin-top:6px;">NPC position is stored as [x, z] + face (rotY). Mirrored into <code>data/npc_overrides.js</code> on every drag — exports via "Export Layout".</div>` : ''}${sel.kind === 'interactable' ? `
    <div class="ccq-ed-hint" style="margin-top:6px;">Position layered as an override over <code>LESSON_DELIVERY.${sel.chapterId}.objectLocation.position</code>. Mirrored into <code>data/lesson_delivery_overrides.js</code> on every drag — exports via "Export Layout".</div>` : ''}${sel.kind === 'compound_child' ? `
    <div class="ccq-ed-hint" style="margin-top:6px;">Position layered as an override over the compound builder's default. Mirrored into <code>data/compound_overrides.js</code> on every drag — exports via "Export Layout".</div>` : ''}

    ${sizeEditable ? `
      <div class="ccq-ed-divider"></div>
      <div class="ccq-ed-sub" style="margin-bottom:6px;">size</div>
      <div class="ccq-ed-row">
        <label>width</label>
        <input class="ccq-ed-num" id="ccq-size-w" type="number" step="0.05" value="${(sel.entry.size?.width || sel.entry.size?.w || '').toString()}">
      </div>
      <div class="ccq-ed-row">
        <label>height</label>
        <input class="ccq-ed-num" id="ccq-size-h" type="number" step="0.05" value="${(sel.entry.size?.height || sel.entry.size?.h || '').toString()}">
      </div>
      <div class="ccq-ed-row">
        <label>depth</label>
        <input class="ccq-ed-num" id="ccq-size-d" type="number" step="0.05" value="${(sel.entry.size?.depth || sel.entry.size?.d || '').toString()}">
      </div>
      ${sel.entry.type === 'decoration' ? `
      <div class="ccq-ed-row">
        <label>stretch</label>
        <input id="ccq-stretch" type="checkbox" ${sel.entry.size?.stretch ? 'checked' : ''}>
      </div>
      ` : ''}
      <div class="ccq-ed-hint" style="margin-top:6px;">
        Changing size rebuilds the mesh in place.
      </div>
    ` : (sel.kind === 'room'
        ? `<div class="ccq-ed-hint">No native size field for "${sel.entry.type}" entries. Use the <b>scale</b> row above to resize — works for every kind. For builder-specific args (desk w/d, etc.) edit data/rooms.js.</div>`
        : '')}

    <div class="ccq-ed-divider"></div>
    <div style="display:flex; gap:6px;">
      <button class="ccq-ed-btn ccq-ed-btn-sm" id="ccq-deselect" style="flex:1;">Deselect</button>
      <button class="ccq-ed-btn ccq-ed-btn-sm ccq-ed-danger" id="ccq-delete" style="flex:1;">🗑 Delete</button>
    </div>
  `;

  _panelEl.querySelector('#ccq-pos-x').addEventListener('input', onPosInput);
  _panelEl.querySelector('#ccq-pos-y').addEventListener('input', onPosInput);
  _panelEl.querySelector('#ccq-pos-z').addEventListener('input', onPosInput);
  _panelEl.querySelector('#ccq-rot-y').addEventListener('input', onRotInput);
  _panelEl.querySelector('#ccq-scale-u').addEventListener('input', onScaleUniformInput);
  _panelEl.querySelector('#ccq-scale-x').addEventListener('input', onScaleInput);
  _panelEl.querySelector('#ccq-scale-y').addEventListener('input', onScaleInput);
  _panelEl.querySelector('#ccq-scale-z').addEventListener('input', onScaleInput);
  for (const axis of ['x', 'y', 'z']) {
    const cb = _panelEl.querySelector(`#ccq-lock-${axis}`);
    if (cb) cb.addEventListener('change', (e) => {
      _axisLocks[axis] = !!e.target.checked;
      applyAxisLocksToGizmo();
    });
  }
  if (sizeEditable) {
    _panelEl.querySelector('#ccq-size-w').addEventListener('input', onSizeInput);
    _panelEl.querySelector('#ccq-size-h').addEventListener('input', onSizeInput);
    _panelEl.querySelector('#ccq-size-d').addEventListener('input', onSizeInput);
    if (sel.entry?.type === 'decoration') {
      _panelEl.querySelector('#ccq-stretch').addEventListener('change', onStretchToggle);
    }
  }
  _panelEl.querySelector('#ccq-deselect').addEventListener('click', () => select(null));
  _panelEl.querySelector('#ccq-delete').addEventListener('click', deleteSelected);
  const collideCb = _panelEl.querySelector('#ccq-collide');
  if (collideCb) collideCb.addEventListener('change', (e) => {
    if (!_selectedEntry || _selectedEntry.kind !== 'room') return;
    const entry = _selectedEntry.entry;
    const wantsOn = !!e.target.checked;
    const isDefault = _defaultBlocksByEntry(entry);
    // If toggling back to default state, drop the explicit override so
    // the entry stays clean on export.
    if (wantsOn === isDefault) delete entry.collide;
    else entry.collide = wantsOn;
    try { window.__playApi?.rebuildColliders?.(); } catch {}
    refreshPanel();
  });
}

// Mirrors play.js BUILDER_FOOTPRINTS / DECORATION_BLOCKERS — used by
// the panel to show whether a checkbox state is the default or an
// override. Keep in sync with play.js if either list changes.
const _DEFAULT_BLOCKING_BUILDERS = new Set([
  'desk', 'table', 'couch', 'filing_cabinet', 'bookshelf', 'water_cooler',
]);
const _DEFAULT_BLOCKING_DECOS = new Set([
  'reception_desk', 'desk', 'table', 'bookshelf', 'couch',
  'filing_cabinet', 'cabinet',
]);
function _defaultBlocksByEntry(entry) {
  if (!entry) return false;
  if (entry.type === 'builder')    return _DEFAULT_BLOCKING_BUILDERS.has(entry.fn);
  if (entry.type === 'decoration') return _DEFAULT_BLOCKING_DECOS.has(entry.id);
  return false;
}

function onPosInput(e) {
  if (!_selected || !_selectedEntry) return;
  const yOffset = _selected.userData._yOffset || 0;
  const x = parseFloat(document.getElementById('ccq-pos-x').value) || 0;
  const yData = parseFloat(document.getElementById('ccq-pos-y').value) || 0;
  const z = parseFloat(document.getElementById('ccq-pos-z').value) || 0;
  _selected.position.set(
    _axisLocks.x ? _selected.position.x : x,
    _axisLocks.y ? _selected.position.y : (yData + yOffset),
    _axisLocks.z ? _selected.position.z : z,
  );
  syncDataEntryFromSelection();
}

function onRotInput() {
  if (!_selected) return;
  const ry = parseFloat(document.getElementById('ccq-rot-y').value) || 0;
  _selected.rotation.y = ry;
  syncDataEntryFromSelection();
}

function onScaleInput() {
  if (!_selected) return;
  // Reject zero / negative — they flip or implode the mesh.
  const sx = Math.max(0.001, parseFloat(document.getElementById('ccq-scale-x').value) || 1);
  const sy = Math.max(0.001, parseFloat(document.getElementById('ccq-scale-y').value) || 1);
  const sz = Math.max(0.001, parseFloat(document.getElementById('ccq-scale-z').value) || 1);
  _selected.scale.set(sx, sy, sz);
  syncDataEntryFromSelection();
  // Keep the "uniform" input in sync — show the largest axis so the
  // user can read "how big it currently is" at a glance.
  const u = document.getElementById('ccq-scale-u');
  if (u && document.activeElement !== u) u.value = Math.max(sx, sy, sz).toFixed(3);
}

// Uniform scale — sets all three axes to the same value. Used for
// "make this thing 2x bigger" without worrying about which axis is which.
function onScaleUniformInput() {
  if (!_selected) return;
  const u = Math.max(0.001, parseFloat(document.getElementById('ccq-scale-u').value) || 1);
  _selected.scale.set(u, u, u);
  syncDataEntryFromSelection();
  // Push the new uniform value into the per-axis inputs so they don't
  // show stale values when the user switches to fine control.
  const fmt = u.toFixed(3);
  document.getElementById('ccq-scale-x').value = fmt;
  document.getElementById('ccq-scale-y').value = fmt;
  document.getElementById('ccq-scale-z').value = fmt;
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
  // Footprint just changed — refresh collider AABBs.
  try { window.__playApi?.rebuildColliders?.(); } catch {}

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
    import('../decorations/decorationAssets.js?v=20260528j').then(({ makeDecoration }) => {
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
// when the panel's number inputs change. Handles both 'room' entries
// (pos: [x, y, z], rotY) and 'npc' entries (pos: [x, z], face).
function syncDataEntryFromSelection() {
  if (!_selected || !_selectedEntry) return;
  const yOffset = _selected.userData._yOffset || 0;
  const sx = +_selected.scale.x.toFixed(4);
  const sy = +_selected.scale.y.toFixed(4);
  const sz = +_selected.scale.z.toFixed(4);
  const scaleIsDefault = (sx === 1 && sy === 1 && sz === 1);
  if (_selectedEntry.kind === 'room') {
    const { entry } = _selectedEntry;
    entry.pos = [
      +_selected.position.x.toFixed(4),
      +(_selected.position.y - yOffset).toFixed(4),
      +_selected.position.z.toFixed(4),
    ];
    entry.rotY = +_selected.rotation.y.toFixed(5);
    if (scaleIsDefault) delete entry.scale;
    else entry.scale = [sx, sy, sz];
    // The player can't walk through a moved desk's old position
    // unless we re-derive the AABB collider list. Cheap to redo on
    // every edit (linear over window.ROOMS).
    try { window.__playApi?.rebuildColliders?.(); } catch {}
  } else if (_selectedEntry.kind === 'npc') {
    const { npcDef } = _selectedEntry;
    npcDef.pos = [
      +_selected.position.x.toFixed(4),
      +_selected.position.z.toFixed(4),
    ];
    npcDef.face = +_selected.rotation.y.toFixed(5);
    // Mirror into the editor-overrides map so Export Layout can write
    // a data/npc_overrides.js that survives reload. Without this,
    // mutating npcDef alone is session-only (hand-built NPCS stays in
    // memory until reload; generated chapter NPCs are re-built fresh).
    if (!window.NPC_OVERRIDES) window.NPC_OVERRIDES = {};
    if (npcDef.id) {
      const ov = { pos: npcDef.pos, face: npcDef.face };
      if (!scaleIsDefault) ov.scale = [sx, sy, sz];
      window.NPC_OVERRIDES[npcDef.id] = ov;
    }
  } else if (_selectedEntry.kind === 'interactable') {
    const chapterId = _selectedEntry.chapterId;
    if (!window.LESSON_DELIVERY_OVERRIDES) window.LESSON_DELIVERY_OVERRIDES = {};
    if (chapterId) {
      // Preserve any existing flags (e.g. hidden) when writing the
      // position so dragging back after a delete doesn't accidentally
      // un-hide an entry. Position always written from current node.
      const existing = window.LESSON_DELIVERY_OVERRIDES[chapterId] || {};
      const ov = {
        ...existing,
        position: [
          +_selected.position.x.toFixed(4),
          +_selected.position.y.toFixed(4),
          +_selected.position.z.toFixed(4),
        ],
      };
      if (scaleIsDefault) delete ov.scale;
      else ov.scale = [sx, sy, sz];
      window.LESSON_DELIVERY_OVERRIDES[chapterId] = ov;
    }
    // Keep the floor glow ring in sync with the new XZ so when the
    // user exits edit mode the hover halo still sits under the object.
    try { syncGlowToMesh(_selected); } catch {}
  } else if (_selectedEntry.kind === 'compound_child') {
    const { ownerId, childId } = _selectedEntry;
    if (!window.COMPOUND_OVERRIDES) window.COMPOUND_OVERRIDES = {};
    if (ownerId && childId) {
      if (!window.COMPOUND_OVERRIDES[ownerId]) window.COMPOUND_OVERRIDES[ownerId] = {};
      const existing = window.COMPOUND_OVERRIDES[ownerId][childId] || {};
      const ov = {
        ...existing,
        pos: [
          +_selected.position.x.toFixed(4),
          +_selected.position.y.toFixed(4),
          +_selected.position.z.toFixed(4),
        ],
        rotY: +_selected.rotation.y.toFixed(5),
      };
      if (scaleIsDefault) delete ov.scale;
      else ov.scale = [sx, sy, sz];
      window.COMPOUND_OVERRIDES[ownerId][childId] = ov;
    }
  }
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
  set('ccq-scale-x', _selected.scale.x.toFixed(3));
  set('ccq-scale-y', _selected.scale.y.toFixed(3));
  set('ccq-scale-z', _selected.scale.z.toFixed(3));
  set('ccq-scale-u', Math.max(_selected.scale.x, _selected.scale.y, _selected.scale.z).toFixed(3));
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

// Build the full set of files the export pipeline produces. Returns
// [{ path, name, content }] — only includes overrides files when there
// are edits. rooms.js is always included.
function _collectExportFiles() {
  const out = [
    { path: 'data', name: 'rooms.js', content: serializeRooms(window.ROOMS || []) },
  ];
  if (Object.keys(window.NPC_OVERRIDES || {}).length) {
    out.push({ path: 'data', name: 'npc_overrides.js',
      content: serializeNpcOverrides(window.NPC_OVERRIDES) });
  }
  if (Object.keys(window.LESSON_DELIVERY_OVERRIDES || {}).length) {
    out.push({ path: 'data', name: 'lesson_delivery_overrides.js',
      content: serializeDeliveryOverrides(window.LESSON_DELIVERY_OVERRIDES) });
  }
  if (_countCompoundOverrides(window.COMPOUND_OVERRIDES || {})) {
    out.push({ path: 'data', name: 'compound_overrides.js',
      content: serializeCompoundOverrides(window.COMPOUND_OVERRIDES) });
  }
  return out;
}

// "📋 Export Layout" — manual-flow button: downloads files, shows
// instructions for replacing them on disk. Cache-bust is now per-load
// (see index.html), so the workflow is short: replace files → reload.
export function exportLayout() {
  const files = _collectExportFiles();
  // Clipboard copy (rooms.js content only — overrides go via download).
  let copied = false;
  try {
    navigator.clipboard.writeText(files[0].content).then(() => {}, () => {});
    copied = true;
  } catch {}
  for (const f of files) _downloadAs(f.name, f.content);
  const parts = [];
  parts.push(copied
    ? 'rooms.js copied to clipboard AND downloaded.'
    : 'rooms.js downloaded.');
  for (const f of files.slice(1)) parts.push(`${f.name} downloaded.`);
  parts.push('');
  parts.push('To make these stick after reload:');
  files.forEach((f, i) => parts.push(`  ${i + 1}. Replace ${f.path}/${f.name} with the downloaded file.`));
  parts.push(`  ${files.length + 1}. Reload the page.`);
  parts.push('');
  parts.push('Tip: on a Chrome/Edge desktop browser, use "💾 Save Permanently" instead — it writes the files directly and reloads automatically.');
  alert(parts.join('\n'));
}

// "💾 Save Permanently" — tries four save mechanisms in order:
//   1. POST to the Python sidecar on port 8889 (preferred — no DSM
//      Web Station / PHP fiddling required);
//   2. POST to save.php on the same host (works if PHP-FPM is wired);
//   3. File System Access API (Chrome/Edge desktop on HTTPS/localhost);
//   4. Download-and-replace via exportLayout() (universal fallback).
// Whichever succeeds first wins; on success the editor confirms and
// reloads so the changes take effect immediately.
let _projectDirHandle = null;
let _sidecarAvailable = null;      // null=unknown, true/false=probed
let _saveEndpointAvailable = null; // null=unknown, true/false=probed
export async function savePermanently() {
  const files = _collectExportFiles();

  // ── Path 1: Python sidecar on port 8889 ───────────────────────────
  // Same protocol as save.php; runs as a background process so it
  // works regardless of Web Station's PHP state. Probed once per
  // session; failure caches.
  if (_sidecarAvailable !== false) {
    const result = await _trySaveViaSidecar(files);
    if (result === 'ok') {
      _confirmAndReload(files);
      return;
    }
    if (result === 'unavailable') {
      _sidecarAvailable = false;
      // fall through
    }
    if (result === 'auth') {
      alert('Sidecar rejected the admin passcode.\n\nRe-enter via the sidebar admin-unlock button, then try again.');
      return;
    }
    if (result === 'error') {
      return; // sidecar surfaced its own alert + fell back to download
    }
  }

  // ── Path 2: save.php on the host ──────────────────────────────────
  if (_saveEndpointAvailable !== false) {
    const result = await _trySaveViaEndpoint(files);
    if (result === 'ok') {
      _confirmAndReload(files);
      return;
    }
    if (result === 'unavailable') {
      _saveEndpointAvailable = false;
    }
    if (result === 'auth') {
      alert('save.php rejected the admin passcode.\n\nRe-enter via the sidebar admin-unlock button, then try again.');
      return;
    }
    if (result === 'error') {
      return;
    }
  }

  // ── Path 3: File System Access API ────────────────────────────────
  if (_fsaSupported()) {
    try {
      if (!_projectDirHandle) {
        _projectDirHandle = await window.showDirectoryPicker({
          mode: 'readwrite',
          startIn: 'documents',
        });
      } else {
        const perm = await _projectDirHandle.queryPermission({ mode: 'readwrite' });
        if (perm !== 'granted') {
          const req = await _projectDirHandle.requestPermission({ mode: 'readwrite' });
          if (req !== 'granted') {
            _projectDirHandle = null;
            alert('Write permission denied. Pick the folder again to save.');
            return;
          }
        }
      }
      let dataDir;
      try {
        dataDir = await _projectDirHandle.getDirectoryHandle('data', { create: false });
      } catch {
        _projectDirHandle = null;
        alert('Picked folder doesn\'t contain a "data/" subdirectory. Pick the claude-code-quest project root.');
        return;
      }
      for (const f of files) {
        const fileHandle = await dataDir.getFileHandle(f.name, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(f.content);
        await writable.close();
      }
      _confirmAndReload(files);
      return;
    } catch (e) {
      if (e?.name !== 'AbortError') {
        console.error('[editor] FSA save failed:', e);
        alert(`FSA save failed: ${e?.message || e}\n\nFalling back to download.`);
        return exportLayout();
      }
      return;
    }
  }

  // ── Path 4: fallback ──────────────────────────────────────────────
  // Sidecar down, no PHP, no FSA. User gets manual download-and-replace.
  return exportLayout();
}

// Same payload shape as save.php; sidecar now serves the project AND
// /save from the same origin (port 8888), so a plain relative URL
// works and no preflight is needed.
async function _trySaveViaSidecar(files) {
  let pass = '';
  try { pass = sessionStorage.getItem('ccq_admin_pass') || ''; } catch {}
  if (!pass) {
    pass = window.prompt('Enter admin passcode to save:') || '';
    if (!pass) return 'unavailable';
    try { sessionStorage.setItem('ccq_admin_pass', pass); } catch {}
  }
  const url = './save';
  let resp;
  try {
    // 2 s timeout — if the sidecar isn't up we want to fall through
    // to the next path quickly instead of hanging the click.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2000);
    resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl.signal,
      body: JSON.stringify({
        passcode: pass,
        files: files.map(f => ({ name: f.name, content: f.content })),
      }),
    });
    clearTimeout(timer);
  } catch {
    return 'unavailable';
  }
  let body = null;
  try { body = await resp.json(); } catch {}
  if (resp.status === 403) {
    try { sessionStorage.removeItem('ccq_admin_pass'); } catch {}
    return 'auth';
  }
  if (!resp.ok || !body?.ok) {
    const msg = body?.error || `HTTP ${resp.status}`;
    alert(`Sidecar save failed: ${msg}\n\nFalling back to download.`);
    exportLayout();
    return 'error';
  }
  return 'ok';
}

async function _trySaveViaEndpoint(files) {
  let pass = '';
  try { pass = sessionStorage.getItem('ccq_admin_pass') || ''; } catch {}
  if (!pass) {
    // Older admin sessions might not have stored the passcode. Prompt
    // once and persist for the session.
    pass = window.prompt('Enter admin passcode to save:') || '';
    if (!pass) return 'unavailable';
    try { sessionStorage.setItem('ccq_admin_pass', pass); } catch {}
  }
  let resp;
  try {
    resp = await fetch('./save.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passcode: pass,
        files: files.map(f => ({ name: f.name, content: f.content })),
      }),
    });
  } catch {
    return 'unavailable';   // network error / endpoint not reachable
  }
  // PHP not deployed → Web Station typically serves the raw source or
  // returns 404. Either way, not an auth error.
  if (resp.status === 404) return 'unavailable';
  if (resp.status === 405) return 'unavailable';
  let body = null;
  try { body = await resp.json(); } catch {}
  if (resp.status === 403) {
    // Clear the cached passcode so the next attempt re-prompts.
    try { sessionStorage.removeItem('ccq_admin_pass'); } catch {}
    return 'auth';
  }
  if (!resp.ok || !body?.ok) {
    const msg = body?.error || `HTTP ${resp.status}`;
    alert(`save.php failed: ${msg}\n\nFalling back to download.`);
    exportLayout();
    return 'error';
  }
  return 'ok';
}

function _confirmAndReload(files) {
  const fileList = files.map(f => `  • ${f.path}/${f.name}`).join('\n');
  const yes = confirm(`Saved ${files.length} file(s):\n${fileList}\n\nReload now to see the changes?`);
  if (yes) window.location.reload();
}

function _fsaSupported() {
  return typeof window !== 'undefined'
    && typeof window.showDirectoryPicker === 'function';
}

function _countCompoundOverrides(co) {
  let n = 0;
  for (const owner of Object.values(co)) n += Object.keys(owner || {}).length;
  return n;
}

function _downloadAs(filename, text) {
  const blob = new Blob([text], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
}

function serializeNpcOverrides(overrides) {
  const header = `// npc_overrides.js — per-NPC position/face overrides applied at spawn.
// EXPORTED FROM IN-GAME EDITOR — generated ${new Date().toISOString()}
//
// Keyed by NPC id (hand-built or auto-\${lessonId}). Applied in
// spawnNPC() after floor-relocation overrides.
window.NPC_OVERRIDES = {
`;
  const lines = [];
  for (const [id, ov] of Object.entries(overrides)) {
    if (!ov?.pos) continue;
    const fields = [`pos: [${fmtNum(ov.pos[0])}, ${fmtNum(ov.pos[1])}]`];
    if (typeof ov.face === 'number') fields.push(`face: ${fmtNum(ov.face)}`);
    if (Array.isArray(ov.scale) && ov.scale.length === 3) {
      fields.push(`scale: [${ov.scale.map(n => fmtNum(n)).join(', ')}]`);
    }
    lines.push(`  ${q(id)}: { ${fields.join(', ')} },`);
  }
  return header + lines.join('\n') + (lines.length ? '\n' : '') + '};\n';
}

function serializeDeliveryOverrides(overrides) {
  const header = `// lesson_delivery_overrides.js — per-chapter interactable position overrides.
// EXPORTED FROM IN-GAME EDITOR — generated ${new Date().toISOString()}
//
// Keyed by chapterId. Applied at build time in play.js's interactable
// spawn loop, layered over LESSON_DELIVERY[chapterId].objectLocation.
//
// Supported per-chapter fields:
//   position: [x, y, z]   — move the spawn point
//   scale:    [sx, sy, sz] — resize at spawn
//   hidden:   true        — skip spawn entirely (editor delete)
window.LESSON_DELIVERY_OVERRIDES = {
`;
  const lines = [];
  for (const [chapterId, ov] of Object.entries(overrides)) {
    const fields = [];
    if (Array.isArray(ov?.position) && ov.position.length === 3) {
      fields.push(`position: [${ov.position.map(n => fmtNum(n)).join(', ')}]`);
    }
    if (Array.isArray(ov?.scale) && ov.scale.length === 3) {
      fields.push(`scale: [${ov.scale.map(n => fmtNum(n)).join(', ')}]`);
    }
    if (ov?.hidden === true) fields.push(`hidden: true`);
    if (!fields.length) continue;
    lines.push(`  ${q(chapterId)}: { ${fields.join(', ')} },`);
  }
  return header + lines.join('\n') + (lines.length ? '\n' : '') + '};\n';
}

function serializeCompoundOverrides(overrides) {
  const header = `// compound_overrides.js — per-child position/rotation/scale/hidden overrides
// for compound builders.
// EXPORTED FROM IN-GAME EDITOR — generated ${new Date().toISOString()}
//
// Keyed by [ownerId][childId]. Applied by play/world/compoundChildren.js
// at build time.
//
// Supported per-child fields:
//   pos:    [x, y, z]      — move spawn position
//   rotY:   number         — set Y rotation
//   scale:  [sx, sy, sz]   — resize at spawn
//   hidden: true           — skip spawn entirely (editor delete)
window.COMPOUND_OVERRIDES = {
`;
  const ownerLines = [];
  for (const [ownerId, ownerMap] of Object.entries(overrides)) {
    const childLines = [];
    for (const [childId, ov] of Object.entries(ownerMap || {})) {
      const fields = [];
      if (Array.isArray(ov?.pos) && ov.pos.length === 3) {
        fields.push(`pos: [${ov.pos.map(n => fmtNum(n)).join(', ')}]`);
      }
      if (typeof ov?.rotY === 'number') fields.push(`rotY: ${fmtNum(ov.rotY)}`);
      if (Array.isArray(ov?.scale) && ov.scale.length === 3) {
        fields.push(`scale: [${ov.scale.map(n => fmtNum(n)).join(', ')}]`);
      }
      if (ov?.hidden === true) fields.push(`hidden: true`);
      if (!fields.length) continue;
      childLines.push(`    ${q(childId)}: { ${fields.join(', ')} },`);
    }
    if (childLines.length) {
      ownerLines.push(`  ${q(ownerId)}: {\n${childLines.join('\n')}\n  },`);
    }
  }
  return header + ownerLines.join('\n') + (ownerLines.length ? '\n' : '') + '};\n';
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
  if (e.collide === true || e.collide === false) parts.push(`collide: ${e.collide}`);
  if (Array.isArray(e.scale) && e.scale.length === 3) {
    parts.push(`scale: [${e.scale.map(n => fmtNum(n)).join(', ')}]`);
  }
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

// ── Free-drag (click-and-hold a mesh body, drag on ground plane) ─────

function _ndcFromEvent(e) {
  const rect = _ctx.renderer.domElement.getBoundingClientRect();
  _ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  _ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
}

// Project a pointer event onto a horizontal plane at the selected
// node's current Y. Returns null if the ray is parallel-ish.
function raycastDragPlane(e) {
  if (!_ctx || !_dragMode) return null;
  _ndcFromEvent(e);
  _raycaster.setFromCamera(_ndc, _ctx.camera);
  _dragPlane.constant = -_dragMode.planeY;
  _dragHit.set(0, 0, 0);
  return _raycaster.ray.intersectPlane(_dragPlane, _dragHit) ? _dragHit : null;
}

function beginFreeDrag(node, e) {
  if (!_ctx) return;
  const planeY = node.position.y;
  _ndcFromEvent(e);
  _raycaster.setFromCamera(_ndc, _ctx.camera);
  _dragPlane.constant = -planeY;
  _dragHit.set(0, 0, 0);
  if (!_raycaster.ray.intersectPlane(_dragPlane, _dragHit)) return;
  _dragMode = {
    node,
    planeY,
    offsetX: node.position.x - _dragHit.x,
    offsetZ: node.position.z - _dragHit.z,
  };
}

// ── Delete selected entry ────────────────────────────────────────────

function deleteSelected() {
  if (!_selected || !_selectedEntry || !_ctx) return;
  const node = _selected;

  // Detach gizmo for both kinds.
  try { _transformControls?.detach(); } catch {}

  if (_selectedEntry.kind === 'room') {
    const { room, index } = _selectedEntry;
    try { _ctx.scene.remove(node); } catch {}
    room.objects.splice(index, 1);
    // Re-index every node still tagged with this room — anything that
    // was at a higher index now shifts down by 1.
    _ctx.scene.traverse((o) => {
      if (o.userData?._roomId !== room.id) return;
      if (typeof o.userData._roomEntryIndex !== 'number') return;
      if (o.userData._roomEntryIndex > index) o.userData._roomEntryIndex -= 1;
    });
    try { window.__playApi?.rebuildColliders?.(); } catch {}
  } else if (_selectedEntry.kind === 'npc') {
    // NPC removal routes through the play.js API so npcMeshes stays
    // consistent (collision / repulsion code iterates that array).
    try { window.__playApi?.removeNpcMesh?.(node); } catch (e) {
      console.warn('[editor] NPC remove failed, falling back to scene.remove', e);
      try { _ctx.scene.remove(node); } catch {}
    }
  } else if (_selectedEntry.kind === 'interactable') {
    // Interactables come from LESSON_DELIVERY. We can't remove the
    // config entry, but we can mark it hidden so the spawn loop skips
    // it on next load. The mesh is yanked from the scene immediately
    // so the editor reflects the change without a reload.
    const chapterId = _selectedEntry.chapterId;
    if (chapterId) {
      if (!window.LESSON_DELIVERY_OVERRIDES) window.LESSON_DELIVERY_OVERRIDES = {};
      const existing = window.LESSON_DELIVERY_OVERRIDES[chapterId] || {};
      window.LESSON_DELIVERY_OVERRIDES[chapterId] = { ...existing, hidden: true };
    }
    try { _ctx.scene.remove(node); } catch {}
    // Also yank the hover glow ring (it sits on the scene at floor level
    // separately from the mesh; otherwise it lingers after deletion).
    try {
      const glow = node.userData?._interactable?.glow;
      if (glow?.parent) glow.parent.remove(glow);
    } catch {}
  } else if (_selectedEntry.kind === 'compound_child') {
    // Compound-builder children are baked into their compound's source
    // function — we can't remove the source call, but we can set a
    // hidden flag in COMPOUND_OVERRIDES so placeCompoundChild() skips
    // it on next load. Yank from the scene now so the editor responds.
    const { ownerId, childId } = _selectedEntry;
    if (ownerId && childId) {
      if (!window.COMPOUND_OVERRIDES) window.COMPOUND_OVERRIDES = {};
      if (!window.COMPOUND_OVERRIDES[ownerId]) window.COMPOUND_OVERRIDES[ownerId] = {};
      const existing = window.COMPOUND_OVERRIDES[ownerId][childId] || {};
      window.COMPOUND_OVERRIDES[ownerId][childId] = { ...existing, hidden: true };
    }
    try { _ctx.scene.remove(node); } catch {}
  }

  _selected = null;
  _selectedEntry = null;
  _dragMode = null;
  refreshPanel();
}

// ── Clipboard (Ctrl+C / Ctrl+V) ──────────────────────────────────────

// Clipboard for Ctrl+C/V. Supports every selection kind:
//   • room: deep-clones the data entry and re-dispatches.
//   • npc: deep-clones the NPC def with a fresh id.
//   • interactable: deep-clones the live mesh; persists across reload
//     via a synthetic LESSON_DELIVERY_OVERRIDES entry that play.js
//     re-spawns from on next load.
//   • compound_child: deep-clones the live mesh; persists via a
//     synthetic COMPOUND_OVERRIDES entry that a post-build pass in
//     play.js re-creates from the source mesh on next load.
// Cleared on exit edit mode.
let _clipboard = null;

function _shortTs() { return Date.now().toString(36).slice(-5); }

function copySelection() {
  if (!_selected || !_selectedEntry) return false;
  if (_selectedEntry.kind === 'room') {
    _clipboard = {
      kind: 'room',
      roomId: _selectedEntry.room.id,
      entry: JSON.parse(JSON.stringify(_selectedEntry.entry)),
    };
    return true;
  }
  if (_selectedEntry.kind === 'npc') {
    _clipboard = {
      kind: 'npc',
      npcDef: JSON.parse(JSON.stringify(_selectedEntry.npcDef)),
    };
    return true;
  }
  if (_selectedEntry.kind === 'interactable') {
    _clipboard = {
      kind: 'interactable',
      chapterId: _selectedEntry.chapterId,
      interactableKind: _selectedEntry.interactableKind,
      pos: [_selected.position.x, _selected.position.y, _selected.position.z],
      scale: [_selected.scale.x, _selected.scale.y, _selected.scale.z],
    };
    return true;
  }
  if (_selectedEntry.kind === 'compound_child') {
    _clipboard = {
      kind: 'compound_child',
      ownerId: _selectedEntry.ownerId,
      childId: _selectedEntry.childId,
      pos: [_selected.position.x, _selected.position.y, _selected.position.z],
      rotY: _selected.rotation.y,
      scale: [_selected.scale.x, _selected.scale.y, _selected.scale.z],
    };
    return true;
  }
  return false;
}

function pasteClipboard() {
  if (!_clipboard || !_ctx) return false;

  if (_clipboard.kind === 'room') {
    const room = window.ROOM_BY_ID?.(_clipboard.roomId);
    if (!room) {
      alert(`Paste failed — original room "${_clipboard.roomId}" not loaded.`);
      return false;
    }
    // Deep-clone again so further pastes don't share array references
    // with the previous one.
    const entry = JSON.parse(JSON.stringify(_clipboard.entry));
    // Offset ~1 m so the duplicate doesn't z-fight with the original.
    if (Array.isArray(entry.pos) && entry.pos.length >= 3) {
      entry.pos = [entry.pos[0] + 1, entry.pos[1], entry.pos[2] + 1];
    } else if (Array.isArray(entry.pos)) {
      entry.pos = entry.pos.map((v, i) => i === 0 ? v + 1 : v);
    }
    room.objects.push(entry);
    const yOffsetForFloor = room.floor != null && room.floor > 1
      ? (room.floor - 1) * 4.5
      : 0;
    const result = dispatchEntry(entry, _ctx.scene, { scene: _ctx.scene, decoTickers: [] });
    if (!result) {
      alert(`Paste failed — dispatcher returned no node for entry type "${entry.type}".`);
      return false;
    }
    const node = result.isObject3D ? result : result.root;
    if (!node) return false;
    if (yOffsetForFloor) node.position.y += yOffsetForFloor;
    if (room.floor != null && node.userData.floor === undefined) {
      node.userData.floor = room.floor;
    }
    node.userData._roomId = room.id;
    node.userData._roomEntryIndex = room.objects.length - 1;
    node.userData._yOffset = yOffsetForFloor;
    if (!node.parent) _ctx.scene.add(node);
    select(node);
    try { window.__playApi?.rebuildColliders?.(); } catch {}
    return true;
  }

  if (_clipboard.kind === 'npc') {
    if (!window.__playApi?.spawnNpcFromDef) return false;
    const def = JSON.parse(JSON.stringify(_clipboard.npcDef));
    if (def.id) def.id = `${def.id}-copy${_shortTs()}`;
    if (Array.isArray(def.pos) && def.pos.length >= 2) {
      def.pos = [def.pos[0] + 1, def.pos[1] + 1];
    }
    const mesh = window.__playApi.spawnNpcFromDef(def);
    if (mesh) select(mesh);
    return true;
  }

  if (_clipboard.kind === 'interactable') {
    return _pasteInteractable(_clipboard);
  }

  if (_clipboard.kind === 'compound_child') {
    return _pasteCompoundChild(_clipboard);
  }

  return false;
}

// Find the live source mesh for a (sourceOwner, sourceChildId) pair,
// deep-clone its geometry/materials, tag with new ids, drop into the
// scene at the requested position. Used by paste flows for both
// interactables and compound children. Returns the new node or null.
function _cloneTaggedMesh(predicate) {
  if (!_ctx?.scene) return null;
  let source = null;
  _ctx.scene.traverse((o) => {
    if (source) return;
    if (predicate(o)) source = o;
  });
  if (!source) return null;
  const clone = source.clone(true);
  // Clone materials so per-instance tweaks don't leak.
  clone.traverse((o) => {
    if (o.isMesh && o.material) {
      o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone();
    }
  });
  return clone;
}

function _pasteInteractable(cb) {
  const sourceChapterId = cb.chapterId;
  const newChapterId = `${sourceChapterId}-copy${_shortTs()}`;
  const clone = _cloneTaggedMesh(
    (o) => o.userData?._isInteractable && o.userData._interactableChapterId === sourceChapterId
  );
  if (!clone) {
    alert(`Paste failed — couldn't find live source mesh for ${sourceChapterId}.`);
    return false;
  }
  // Offset on XZ.
  clone.position.set(cb.pos[0] + 1, cb.pos[1], cb.pos[2] + 1);
  if (cb.scale) clone.scale.set(cb.scale[0], cb.scale[1], cb.scale[2]);
  // Re-tag the clone with the new chapter id. _isInteractable stays
  // so the editor recognizes it on the next selection.
  clone.userData._isInteractable = true;
  clone.userData._interactableChapterId = newChapterId;
  // We DON'T set _lessonDeliveryRef — clones aren't part of LESSON_DELIVERY,
  // so the editor's sync writes to LESSON_DELIVERY_OVERRIDES directly.
  // Glow ring: the cloned mesh's _interactable backref still points at
  // the source's interactable entry. We don't register a new
  // interactable (no E-key behaviour for clones — they're decorative).
  // Clear the backref so the editor doesn't try to follow it.
  clone.userData._interactable = null;
  _ctx.scene.add(clone);

  // Persistence: record as a synthetic LESSON_DELIVERY override.
  // play.js's interactable spawn loop sees `clonedFrom` and re-creates
  // by cloning the source on next load.
  if (!window.LESSON_DELIVERY_OVERRIDES) window.LESSON_DELIVERY_OVERRIDES = {};
  window.LESSON_DELIVERY_OVERRIDES[newChapterId] = {
    clonedFrom: sourceChapterId,
    position: [
      +(cb.pos[0] + 1).toFixed(4),
      +cb.pos[1].toFixed(4),
      +(cb.pos[2] + 1).toFixed(4),
    ],
    scale: cb.scale && (cb.scale[0] !== 1 || cb.scale[1] !== 1 || cb.scale[2] !== 1)
      ? [+cb.scale[0].toFixed(4), +cb.scale[1].toFixed(4), +cb.scale[2].toFixed(4)]
      : undefined,
  };
  if (!window.LESSON_DELIVERY_OVERRIDES[newChapterId].scale) {
    delete window.LESSON_DELIVERY_OVERRIDES[newChapterId].scale;
  }
  select(clone);
  return true;
}

function _pasteCompoundChild(cb) {
  const { ownerId, childId } = cb;
  const newChildId = `${childId}-copy${_shortTs()}`;
  const clone = _cloneTaggedMesh(
    (o) => o.userData?._isCompoundChild
        && o.userData._compoundOwner === ownerId
        && o.userData._compoundChildId === childId
  );
  if (!clone) {
    alert(`Paste failed — couldn't find live source mesh for ${ownerId}/${childId}.`);
    return false;
  }
  clone.position.set(cb.pos[0] + 1, cb.pos[1], cb.pos[2] + 1);
  if (typeof cb.rotY === 'number') clone.rotation.y = cb.rotY;
  if (cb.scale) clone.scale.set(cb.scale[0], cb.scale[1], cb.scale[2]);
  clone.userData._isCompoundChild = true;
  clone.userData._compoundOwner = ownerId;
  clone.userData._compoundChildId = newChildId;
  _ctx.scene.add(clone);

  // Persistence: record as a synthetic COMPOUND_OVERRIDES entry.
  // The post-build pass in play.js sees `clonedFrom` and re-creates
  // the clone after the source compound builder runs.
  if (!window.COMPOUND_OVERRIDES) window.COMPOUND_OVERRIDES = {};
  if (!window.COMPOUND_OVERRIDES[ownerId]) window.COMPOUND_OVERRIDES[ownerId] = {};
  const ov = {
    clonedFrom: childId,
    pos: [
      +(cb.pos[0] + 1).toFixed(4),
      +cb.pos[1].toFixed(4),
      +(cb.pos[2] + 1).toFixed(4),
    ],
  };
  if (typeof cb.rotY === 'number') ov.rotY = +cb.rotY.toFixed(5);
  if (cb.scale && (cb.scale[0] !== 1 || cb.scale[1] !== 1 || cb.scale[2] !== 1)) {
    ov.scale = [+cb.scale[0].toFixed(4), +cb.scale[1].toFixed(4), +cb.scale[2].toFixed(4)];
  }
  window.COMPOUND_OVERRIDES[ownerId][newChildId] = ov;
  select(clone);
  return true;
}

// ── Add Item library modal ───────────────────────────────────────────

const LIBRARY_CATALOG = {
  Walls: [
    { label: 'Wall — 1 m × 3.8 m', template: { type: 'wall', size: { w: 1, h: 3.8, d: 0.3 } } },
    { label: 'Wall — 3 m × 3.8 m', template: { type: 'wall', size: { w: 3, h: 3.8, d: 0.3 } } },
    { label: 'Wall — 5 m × 3.8 m', template: { type: 'wall', size: { w: 5, h: 3.8, d: 0.3 } } },
    { label: 'Wall — 10 m × 3.8 m', template: { type: 'wall', size: { w: 10, h: 3.8, d: 0.3 } } },
    { label: 'Wall — lintel (3.5 × 1.2)', template: { type: 'wall', size: { w: 3.5, h: 1.2, d: 0.3 } } },
  ],
  Floors: [
    { label: 'Floor plate — 5 × 5 m', template: { type: 'floor_plate', size: { w: 5, d: 5 }, color: 0xa1887f } },
    { label: 'Floor plate — 10 × 10 m', template: { type: 'floor_plate', size: { w: 10, d: 10 }, color: 0xa1887f } },
    { label: 'Floor plate — 22 × 22 m (room)', template: { type: 'floor_plate', size: { w: 22, d: 22 }, color: 0x9aa9bc } },
    { label: 'Carpet runner', template: { type: 'floor_plate', size: { w: 2.4, d: 18 }, color: 0xc9a44c, metalness: 0.85, roughness: 0.18 } },
  ],
  Signs: [
    { label: 'Wall sign — short',  template: { type: 'wall_sign', text: 'NEW SIGN', size: { width: 4, height: 0.9 } } },
    { label: 'Wall sign — large',  template: { type: 'wall_sign', text: 'BIG SIGN', size: { width: 8, height: 1.6 }, bg: '#3e2723', fg: '#d4af37' } },
    { label: 'Poster — corporate', template: { type: 'poster', title: 'NEW POSTER', sub: 'subtitle', size: { width: 1.6, height: 2.4 } } },
  ],
  Furniture: [
    { label: 'Chair',          template: { type: 'builder', fn: 'chair' } },
    { label: 'Desk',           template: { type: 'builder', fn: 'desk', args: { w: 1.6, d: 0.8 } } },
    { label: 'Desk — wide',    template: { type: 'builder', fn: 'desk', args: { w: 2.2, d: 0.8 } } },
    { label: 'Monitor',        template: { type: 'builder', fn: 'monitor' } },
    { label: 'Table',          template: { type: 'builder', fn: 'table', args: { w: 2.2 } } },
    { label: 'Lamp',           template: { type: 'builder', fn: 'lamp' } },
    { label: 'Plant',          template: { type: 'builder', fn: 'plant' } },
    { label: 'Couch',          template: { type: 'builder', fn: 'couch' } },
    { label: 'Water cooler',   template: { type: 'builder', fn: 'water_cooler' } },
    { label: 'Filing cabinet', template: { type: 'builder', fn: 'filing_cabinet' } },
    { label: 'Bookshelf',      template: { type: 'builder', fn: 'bookshelf' } },
  ],
  Decorations: [
    { label: 'Desk (Meshy)',         template: { type: 'decoration', id: 'desk',           size: { width: 1.6, depth: 0.8, height: 0.78 } } },
    { label: 'Chair (Meshy)',        template: { type: 'decoration', id: 'chair',          size: { width: 0.6, depth: 0.6, height: 1.1 } } },
    { label: 'Monitor (Meshy)',      template: { type: 'decoration', id: 'monitor',        size: { width: 0.6, height: 0.55, depth: 0.2 } } },
    { label: 'Reception desk (Meshy)', template: { type: 'decoration', id: 'reception_desk', size: { width: 3.0, depth: 1.2, height: 1.05 } } },
    { label: 'Door (Meshy)',         template: { type: 'decoration', id: 'door',           size: { width: 1.1, height: 2.3, depth: 0.1 } } },
    { label: 'Window (Meshy)',       template: { type: 'decoration', id: 'window',         size: { width: 2.4, height: 1.8, depth: 0.15 } } },
    { label: 'Cabinet (Meshy)',      template: { type: 'decoration', id: 'cabinet',        size: { width: 0.6, height: 1.4, depth: 0.5 } } },
    { label: 'Plant (Meshy)',        template: { type: 'decoration', id: 'plant',          size: { width: 0.7, depth: 0.7, height: 1.4 } } },
    { label: 'Table (Meshy)',        template: { type: 'decoration', id: 'table',          size: { width: 2.2, depth: 1.2, height: 0.78 } } },
    { label: 'Floor mat (Meshy)',    template: { type: 'decoration', id: 'floor_mat',      size: { width: 1.6, depth: 1.0 } } },
    { label: 'Ceiling lamp (Meshy)', template: { type: 'decoration', id: 'ceiling_lamp',   size: { width: 0.4, height: 0.7 } } },
    { label: 'Couch (Meshy)',        template: { type: 'decoration', id: 'couch',          size: { width: 2.2, depth: 0.9, height: 0.95 } } },
    { label: 'Bookshelf (Meshy)',    template: { type: 'decoration', id: 'bookshelf',      size: { width: 2.2, height: 2.6, depth: 0.45 } } },
    { label: 'Water cooler (Meshy)', template: { type: 'decoration', id: 'water_cooler',   size: { width: 0.45, height: 1.4, depth: 0.45 } } },
    { label: 'Laptop (Meshy)',       template: { type: 'decoration', id: 'laptop',         size: { width: 0.36, height: 0.26, depth: 0.26 } } },
    { label: 'Table lamp (Meshy)',   template: { type: 'decoration', id: 'table_lamp',     size: { width: 0.35, height: 0.55, depth: 0.35 } } },
    { label: 'Hanging plant (Meshy)',template: { type: 'decoration', id: 'hanging_plant',  size: { width: 0.5,  height: 0.8, depth: 0.5 } } },
    { label: 'Succulent (Meshy)',    template: { type: 'decoration', id: 'succulent',      size: { width: 0.18, height: 0.18, depth: 0.18 } } },
    { label: 'Mug (Meshy)',          template: { type: 'decoration', id: 'mug',            size: { width: 0.1,  height: 0.12, depth: 0.1 } } },
    { label: 'Pen cup (Meshy)',      template: { type: 'decoration', id: 'pen_cup',        size: { width: 0.1,  height: 0.2, depth: 0.1 } } },
    { label: 'Stapler (Meshy)',      template: { type: 'decoration', id: 'stapler',        size: { width: 0.18, height: 0.07, depth: 0.08 } } },
    { label: 'Paper stack (Meshy)',  template: { type: 'decoration', id: 'paper_stack',    size: { width: 0.2,  height: 0.04, depth: 0.26 } } },
    { label: 'Elevator (Meshy)',     template: { type: 'decoration', id: 'elevator',       size: { width: 1.8, height: 2.6, depth: 0.2 } } },
  ],
};

function showLibraryModal() {
  if (!_ctx) return;
  // Rebuild every time so the Characters list reflects which NPCs
  // are currently present vs deleted in this session.
  if (_libraryModalEl) {
    _libraryModalEl.remove();
    _libraryModalEl = null;
  }
  buildLibraryModal();
  _libraryModalEl.style.display = 'flex';
}

function hideLibraryModal() {
  if (_libraryModalEl) _libraryModalEl.style.display = 'none';
}

function buildLibraryModal() {
  const el = document.createElement('div');
  el.className = 'ccq-library-modal';
  el.style.cssText = `
    position: absolute; inset: 0; z-index: 40;
    display: flex; align-items: flex-start; justify-content: center;
    background: rgba(0,0,0,0.55);
    pointer-events: auto;
    font: 13px system-ui, sans-serif;
  `;
  // Backdrop click closes.
  el.addEventListener('click', (e) => { if (e.target === el) hideLibraryModal(); });

  const card = document.createElement('div');
  card.style.cssText = `
    margin-top: 60px; width: min(720px, 90vw); max-height: 80vh;
    background: rgba(20,28,48,0.97); color: #e6edf7;
    border: 1px solid rgba(201,164,76,0.6); border-radius: 10px;
    padding: 16px; overflow-y: auto;
  `;
  card.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
      <div style="font-weight:600; color:#ffd166; font-size:14px;">➕ Add Item</div>
      <button class="ccq-ed-btn ccq-ed-btn-sm" data-close>✕ Close</button>
    </div>
    <div class="ccq-ed-hint" style="margin-bottom:10px;">
      Pick a template. The item spawns ~3m in front of the camera, on the current floor.
      The target room is inferred from the spawn XZ (Reception / Library / West-wing).
    </div>
    <div class="ccq-library-grid"></div>
  `;
  el.appendChild(card);

  const grid = card.querySelector('.ccq-library-grid');
  for (const [cat, items] of Object.entries(LIBRARY_CATALOG)) {
    const h = document.createElement('div');
    h.textContent = cat;
    h.style.cssText = `
      grid-column: 1/-1; margin: 10px 0 4px;
      font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
      opacity: 0.65; color: #ffd166;
    `;
    grid.appendChild(h);
    for (const item of items) {
      const btn = document.createElement('button');
      btn.className = 'ccq-lib-btn';
      btn.textContent = item.label;
      btn.addEventListener('click', () => {
        hideLibraryModal();
        addEntryFromTemplate(item.template);
      });
      grid.appendChild(btn);
    }
  }

  // ── Characters — hand-built NPC roster from play.js ────────────────
  // Lets the user respawn an NPC that was deleted this session, OR
  // add a duplicate copy of one for visual mock-ups. Auto-generated
  // NPCs (ch03..ch16) aren't listed here — they regenerate from the
  // curriculum on reload.
  const npcRoster = (() => {
    try { return window.__playApi?.getHandBuiltNpcs?.() || []; }
    catch { return []; }
  })();
  if (npcRoster.length) {
    const h = document.createElement('div');
    h.textContent = 'Characters';
    h.style.cssText = `
      grid-column: 1/-1; margin: 10px 0 4px;
      font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
      opacity: 0.65; color: #ffd166;
    `;
    grid.appendChild(h);
    // Track which NPC ids are currently alive so we can dim entries
    // that are still in the scene (vs deleted earlier and now
    // re-spawnable).
    const aliveIds = new Set();
    _ctx.scene.traverse((o) => {
      if (o.userData?._isNpc) aliveIds.add(o.userData._npcId);
    });
    for (const npc of npcRoster) {
      const btn = document.createElement('button');
      btn.className = 'ccq-lib-btn';
      const isAlive = aliveIds.has(npc.id);
      btn.textContent = `${npc.portrait || '👤'} ${npc.name}${isAlive ? ' (live)' : ''}`;
      btn.title = `${npc.role || ''}\nchapter: ${npc.chapterId || '—'}`;
      if (isAlive) btn.style.opacity = '0.55';
      btn.addEventListener('click', () => {
        hideLibraryModal();
        spawnNpcAtCamera(npc);
      });
      grid.appendChild(btn);
    }
  }

  card.querySelector('[data-close]').addEventListener('click', hideLibraryModal);
  _ctx.container.appendChild(el);
  _libraryModalEl = el;
}

// Spawn a fresh NPC instance from a roster def. Pos is overridden to
// land in front of the camera. The play.js API handles the actual
// THREE mesh build via spawnNPC() and pushes it to npcMeshes; we
// then select the new mesh for immediate drag-to-place.
function spawnNpcAtCamera(npcTemplate) {
  if (!_ctx || !window.__playApi?.spawnNpcFromDef) return;
  const spawn = pickSpawnPoint();
  const x = spawn ? +spawn.x.toFixed(2) : (npcTemplate.pos?.[0] ?? 0);
  const z = spawn ? +spawn.z.toFixed(2) : (npcTemplate.pos?.[1] ?? 0);
  // Deep-clone the template so editing this instance doesn't mutate
  // the original NPCS entry.
  const def = JSON.parse(JSON.stringify(npcTemplate));
  def.pos = [x, z];
  // Same face direction; user can rotate after.
  const mesh = window.__playApi.spawnNpcFromDef(def);
  if (mesh) select(mesh);
}

// Spawn a new entry from a library template. The entry is appended to
// whichever room contains the spawn point (heuristic based on
// camera-target XZ + currentFloor). The new node is auto-selected so
// the user can immediately drag it into place.
function addEntryFromTemplate(template) {
  if (!_ctx) return;
  const spawn = pickSpawnPoint();
  if (!spawn) {
    alert('Could not determine a target room — try moving the camera into a known room first.');
    return;
  }
  // Clone the template so future spawns of the same template aren't
  // accidentally mutated by the user's tweaks.
  const entry = JSON.parse(JSON.stringify(template));
  entry.pos = [+spawn.x.toFixed(3), 0, +spawn.z.toFixed(3)];
  spawn.room.objects.push(entry);

  // Place the new entry via the loader's single-entry dispatcher.
  const result = dispatchEntry(entry, _ctx.scene, { scene: _ctx.scene, decoTickers: [] });
  if (!result) {
    console.warn('[editor] dispatchEntry returned null for', entry);
    return;
  }
  let node = result.isObject3D ? result : result.root;
  if (!node) {
    console.warn('[editor] dispatch returned no root node for', entry);
    return;
  }
  if (spawn.yOffset) node.position.y += spawn.yOffset;
  if (spawn.room.floor != null && node.userData.floor === undefined) {
    node.userData.floor = spawn.room.floor;
  }
  node.userData._roomId = spawn.room.id;
  node.userData._roomEntryIndex = spawn.room.objects.length - 1;
  node.userData._yOffset = spawn.yOffset;
  if (!node.parent) _ctx.scene.add(node);
  select(node);
  try { window.__playApi?.rebuildColliders?.(); } catch {}
}

// Pick a spawn point ~3m in front of the camera, snapped to the
// containing room (so the entry gets appended to the right ROOMS[]).
function pickSpawnPoint() {
  if (!_ctx) return null;
  const cam = _ctx.camera;
  const camPos = cam.position;
  const camDir = new THREE.Vector3();
  cam.getWorldDirection(camDir);
  camDir.y = 0; camDir.normalize();
  const spawn = new THREE.Vector3()
    .copy(camPos)
    .addScaledVector(camDir, 3);
  // Snap to a sensible Y — current floor base in world space.
  const floor = window.__playCurrentFloor || 1;
  const yOffset = floor === 1 ? 0 : (floor - 1) * 4.5;
  spawn.y = yOffset;

  // Heuristic room picker. For floor 1 we have reception (z<11),
  // library (11≤z<33), west_files (x<-11, z<11), west_planmode
  // (x<-11, z≥11). For floors 2-4 the only data-driven room is
  // office_floorN.
  let roomId = null;
  if (floor === 1) {
    if (spawn.x < -11) roomId = (spawn.z < 11) ? 'west_files' : 'west_planmode';
    else if (spawn.z < 11) roomId = 'reception';
    else roomId = 'library';
  } else {
    roomId = `office_floor${floor}`;
  }
  const room = window.ROOM_BY_ID?.(roomId);
  if (!room) return null;
  return { x: spawn.x, y: 0, z: spawn.z, room, yOffset };
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
    .ccq-ed-danger {
      border-color: rgba(220,80,80,0.6); color: #ffb0b0;
    }
    .ccq-ed-danger:hover { background: rgba(80,30,30,0.7); }
    .ccq-library-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 6px;
    }
    .ccq-lib-btn {
      background: rgba(0,0,0,0.3); color: #e6edf7;
      border: 1px solid rgba(255,255,255,0.12); border-radius: 5px;
      padding: 7px 9px; text-align: left; cursor: pointer; font: 12px system-ui, sans-serif;
    }
    .ccq-lib-btn:hover {
      background: rgba(50,70,110,0.5);
      border-color: rgba(201,164,76,0.6);
    }
    .ccq-ed-lock {
      display: inline-flex; align-items: center; gap: 2px;
      margin-left: 4px;
    }
    .ccq-ed-lock label { width: auto; opacity: 0.7; cursor: pointer; font-size: 12px; }
    .ccq-ed-lock input[type=checkbox]:checked + label { opacity: 1; color: #ffd166; }
  `;
  document.head.appendChild(style);
}
