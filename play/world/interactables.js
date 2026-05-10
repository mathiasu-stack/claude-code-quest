// interactables.js — generic system for "things you can use with E".
//
// Each interactable is a registered { mesh, kind, position, radius,
// onInteract, getPromptText, glowMesh? } entry. The proximity loop in
// play.js extends to also iterate this array and prefer an interactable
// over an NPC when both are nearby.
//
// On enter range: a soft pulsing glow appears around the object.
// On interact: the registered onInteract callback runs, typically
// opening the lesson overlay configured for the chapter the object
// owns.

import * as THREE from 'three';

const _state = {
  list: [],
  hovered: null,
};

export function clearInteractables() {
  for (const it of _state.list) {
    if (it.glow?.parent) it.glow.parent.remove(it.glow);
    it.glow?.geometry?.dispose?.();
    it.glow?.material?.dispose?.();
  }
  _state.list = [];
  _state.hovered = null;
}

// Register an interactable. `mesh` is the visible 3D object (anchor
// for distance + glow). `radius` is the activation radius in metres.
//
// Optional `glowSize` — diameter of the pulsing ring around the mesh.
// Defaults to radius * 1.4 so the ring is slightly outside the object.
export function registerInteractable({
  mesh, kind, position, radius = 1.6,
  onInteract, getPromptText, glowSize, glowColor = 0xffe0a0,
  parent,
}) {
  const it = {
    mesh, kind, position, radius,
    onInteract, getPromptText: getPromptText || (() => `Press E to use ${kind}`),
    glow: null, glowColor,
    isHovered: false,
  };

  // Glow ring on the floor under the object (or directly under mesh).
  const ringGeom = new THREE.RingGeometry(
    (glowSize ?? radius * 1.2) * 0.5,
    (glowSize ?? radius * 1.2) * 0.5 + 0.10,
    36,
  );
  const ringMat = new THREE.MeshBasicMaterial({
    color: glowColor,
    transparent: true,
    opacity: 0,                // fades up only when in range
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.rotation.x = -Math.PI / 2;
  // The ring lives in world space at the mesh's footprint.
  ring.position.set(position[0], 0.02, position[1]);
  it.glow = ring;
  if (parent) parent.add(ring); else mesh.parent?.add?.(ring);

  _state.list.push(it);
  return it;
}

// Find the nearest interactable to the player within its activation
// radius. Returns null if none.
export function nearestInteractable(playerPos) {
  let best = null;
  let bestDist = Infinity;
  for (const it of _state.list) {
    const dx = playerPos.x - it.position[0];
    const dz = playerPos.z - it.position[1];
    const d = Math.hypot(dx, dz);
    if (d <= it.radius && d < bestDist) {
      best = it;
      bestDist = d;
    }
  }
  return best;
}

// Per-frame tick — pulses the hover ring + manages the hovered state
// transitions. Pass the current player position (Vector3-like).
export function updateInteractables(dt, now, playerPos) {
  const hover = nearestInteractable(playerPos);
  if (hover !== _state.hovered) {
    _state.hovered = hover;
  }
  for (const it of _state.list) {
    const isHover = it === hover;
    const target = isHover ? 1 : 0;
    const cur = it.glow.material.opacity;
    it.glow.material.opacity = cur + (target - cur) * (1 - Math.exp(-dt * 6));
    // Pulse a ring scale when hovered
    if (isHover) {
      const s = 1 + Math.sin(now * 0.005) * 0.08;
      it.glow.scale.set(s, s, 1);
    }
  }
  return hover;
}

export function listInteractables() { return _state.list; }
