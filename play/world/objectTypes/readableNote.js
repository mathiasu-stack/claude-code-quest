// readableNote.js — Kedash Protocol collectible readable props (SYS-06).
//
// One reusable builder for the small "there's a document here" props:
//   variant 'paper'  — folded sheet lying flat (desk or floor)
//   variant 'folder' — manila folder with sheets peeking out
//   variant 'framed' — small framed memo (wall-hung; data sets pos[1])
//
// Returns an unpositioned THREE.Group; the caller (play.js's
// 'readable_note' rooms-builder wrapper) places + rotates it and wires
// interaction/gating. No interactable registration happens here.

import * as THREE from 'three';

function labelTexture(text, { width = 256, height = 64, font = '700 26px monospace' } = {}) {
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const x = c.getContext('2d');
  x.fillStyle = '#efe6cf';
  x.fillRect(0, 0, width, height);
  x.fillStyle = '#5a4a2f';
  x.font = font;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(String(text || '').slice(0, 18), width / 2, height / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildReadableNote({ label = '', variant = 'paper' } = {}) {
  const group = new THREE.Group();

  if (variant === 'folder') {
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.03, 0.27),
      new THREE.MeshStandardMaterial({ color: 0xd7b377, roughness: 0.8 }),
    );
    base.position.y = 0.015;
    group.add(base);

    const tab = new THREE.Mesh(
      new THREE.BoxGeometry(0.10, 0.012, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xcaa45f, roughness: 0.8 }),
    );
    tab.position.set(0.11, 0.034, -0.135);
    group.add(tab);

    const sheets = new THREE.Mesh(
      new THREE.BoxGeometry(0.31, 0.012, 0.22),
      new THREE.MeshStandardMaterial({ color: 0xf5f0e0, roughness: 0.9 }),
    );
    sheets.position.set(0.012, 0.036, 0.012);
    sheets.rotation.y = 0.05;
    group.add(sheets);

    if (label) {
      const tag = new THREE.Mesh(
        new THREE.PlaneGeometry(0.24, 0.06),
        new THREE.MeshBasicMaterial({ map: labelTexture(label) }),
      );
      tag.rotation.x = -Math.PI / 2;
      tag.position.set(0, 0.044, 0.02);
      group.add(tag);
    }
  } else if (variant === 'framed') {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.70, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x3e2f23, roughness: 0.65 }),
    );
    group.add(frame);

    const c = document.createElement('canvas');
    c.width = 192; c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#efe6cf';
    x.fillRect(0, 0, 192, 256);
    x.fillStyle = '#5a4a2f';
    x.textAlign = 'center';
    x.font = '700 18px monospace';
    x.fillText(String(label || 'MEMO').slice(0, 12), 96, 44);
    x.fillStyle = 'rgba(90, 74, 47, 0.55)';
    for (let i = 0; i < 8; i++) {
      x.fillRect(24, 76 + i * 20, 144 - (i % 3) * 26, 4);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const paper = new THREE.Mesh(
      new THREE.PlaneGeometry(0.46, 0.60),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }),
    );
    paper.position.z = 0.022;
    group.add(paper);
  } else {
    // 'paper' — folded sheet, slightly lifted crease.
    const sheet = new THREE.Mesh(
      new THREE.BoxGeometry(0.30, 0.012, 0.22),
      new THREE.MeshStandardMaterial({ color: 0xf2ead2, roughness: 0.9 }),
    );
    sheet.position.y = 0.006;
    group.add(sheet);

    const fold = new THREE.Mesh(
      new THREE.BoxGeometry(0.30, 0.010, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xe9e0c4, roughness: 0.9 }),
    );
    fold.position.set(0, 0.022, -0.045);
    fold.rotation.x = 0.22;
    group.add(fold);

    if (label) {
      const tag = new THREE.Mesh(
        new THREE.PlaneGeometry(0.22, 0.055),
        new THREE.MeshBasicMaterial({ map: labelTexture(label) }),
      );
      tag.rotation.x = -Math.PI / 2;
      tag.position.set(0, 0.014, 0.055);
      group.add(tag);
    }
  }

  return group;
}
