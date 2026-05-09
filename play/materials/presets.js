// presets.js — opinionated material factories. Use these instead of
// raw `new THREE.MeshStandardMaterial({ color })` so monitors look like
// monitors and wood looks like wood.

import * as THREE from 'three';

const _cache = new Map();
function cached(key, ctor) {
  if (!_cache.has(key)) _cache.set(key, ctor());
  return _cache.get(key);
}

// Polished metal — strong reflectivity, low roughness.
export function metalShiny(color = 0xc9a44c) {
  return new THREE.MeshStandardMaterial({
    color, metalness: 0.85, roughness: 0.18,
  });
}

// Brushed metal — medium reflectivity.
export function metalBrushed(color = 0x90a4ae) {
  return new THREE.MeshStandardMaterial({
    color, metalness: 0.55, roughness: 0.45,
  });
}

// Wood — slight metalness reads as varnish.
export function wood(color = 0x6d4c41) {
  return new THREE.MeshStandardMaterial({
    color, metalness: 0.05, roughness: 0.7,
  });
}

// Fabric / upholstery — high roughness.
export function fabric(color = 0x5d4037) {
  return new THREE.MeshStandardMaterial({
    color, roughness: 0.95, metalness: 0,
  });
}

// Plastic — low metalness, mid roughness, sometimes shiny.
export function plastic(color = 0xeceff1, shiny = false) {
  return new THREE.MeshStandardMaterial({
    color, metalness: 0.12, roughness: shiny ? 0.3 : 0.6,
  });
}

// Glass — uses transmission so it actually looks glassy. Falls back to
// transparent on older devices.
export function glass(color = 0xffffff, opacity = 0.18) {
  return new THREE.MeshPhysicalMaterial({
    color,
    transmission: 0.95,
    thickness: 0.05,
    roughness: 0.05,
    metalness: 0,
    transparent: true,
    opacity,
  });
}

// Monitor screen — emissive so it always reads as "on" regardless of room.
export function monitorScreen(color = 0x4fc3f7) {
  return cached(`mon-${color}`, () => new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 0.85, roughness: 0.4, metalness: 0,
  }));
}

// Glow — bright disc material for ceiling lights, lamp shades, etc.
export function glow(color = 0xfff5d4, strength = 0.55) {
  return new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: strength, roughness: 0.4,
  });
}
