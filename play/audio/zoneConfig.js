// zoneConfig.js — per-zone audio settings (footstep surface, music URL,
// ambience bed). Indexed by zone idx (0 = Reception, 1 = Library, …).
//
// Adding music: drop a file at the indicated path. If the file isn't
// present, AudioManager.startMusic logs once and falls back to silence.
//
// `bed` picks the procedural roomtone (see ambience.js):
//   'office'  — lowpassed brown noise + slow HVAC LFO (default)
//   'library' — sparser/darker noise + occasional soft high shimmer
//   'atrium'  — office bed with a higher lowpass (more air)

const ZONE_AUDIO = [
  // 0 — Reception
  { surface: 'carpet', musicUrl: 'play/assets/audio/music/reception.mp3', name: 'Reception', bed: 'atrium' },
  // 1 — Library
  { surface: 'wood',   musicUrl: 'play/assets/audio/music/library.mp3',   name: 'Library', bed: 'library' },
  // 2 — Atrium (CLAUDE.md)
  { surface: 'tile',   musicUrl: 'play/assets/audio/music/atrium.mp3',    name: 'Atrium', bed: 'atrium' },
  // 3 — Memory Vault (sparse + dark, like the library)
  { surface: 'metal',  musicUrl: 'play/assets/audio/music/memory-vault.mp3', name: 'Memory Vault', bed: 'library' },
  // 4 — Communications Hub
  { surface: 'tile',   musicUrl: 'play/assets/audio/music/communications.mp3', name: 'Communications' },
  // 5 — File Workshop
  { surface: 'wood',   musicUrl: 'play/assets/audio/music/workshop.mp3',  name: 'Workshop' },
  // 6 — Token Lounge
  { surface: 'carpet', musicUrl: 'play/assets/audio/music/lounge.mp3',    name: 'Lounge' },
  // 7 — Skill Forge
  { surface: 'metal',  musicUrl: 'play/assets/audio/music/forge.mp3',     name: 'Forge' },
  // 8 — Methodology Lab
  { surface: 'tile',   musicUrl: 'play/assets/audio/music/lab.mp3',       name: 'Lab' },
  // 9 — Refinement Loop
  { surface: 'wood',   musicUrl: 'play/assets/audio/music/refinement.mp3', name: 'Refinement' },
  // 10 — Slash Command Center
  { surface: 'metal',  musicUrl: 'play/assets/audio/music/command.mp3',   name: 'Command' },
  // 11 — Plan War Room
  { surface: 'wood',   musicUrl: 'play/assets/audio/music/warroom.mp3',   name: 'War Room' },
  // 12 — Integration Bay
  { surface: 'metal',  musicUrl: 'play/assets/audio/music/integration.mp3', name: 'Integration' },
  // 13 — Mission Control
  { surface: 'tile',   musicUrl: 'play/assets/audio/music/mission.mp3',   name: 'Mission Control' },
  // 14 — Architect Studio
  { surface: 'wood',   musicUrl: 'play/assets/audio/music/studio.mp3',    name: 'Studio' },
  // 15 — NAS Server Room (capstone)
  { surface: 'metal',  musicUrl: 'play/assets/audio/music/server-room.mp3', name: 'Server Room' },
];

const FALLBACK = { surface: 'carpet', musicUrl: null, name: 'Unknown', bed: 'office' };

export function audioConfigForZone(idx) {
  if (idx < 0 || idx >= ZONE_AUDIO.length) return FALLBACK;
  return ZONE_AUDIO[idx];
}

export function surfaceForZone(idx) {
  return audioConfigForZone(idx).surface;
}

export function musicForZone(idx) {
  return audioConfigForZone(idx).musicUrl;
}

// Ambience bed name for a zone. Zones without an explicit bed (5+, the
// generic office floors — incl. the server room, whose rack hum layers
// on top via updateServerHum) fall back to the default office roomtone.
export function ambienceBedForZone(idx) {
  return audioConfigForZone(idx).bed || 'office';
}

export const CELEBRATION_MUSIC_URL = 'play/assets/audio/music/celebration.mp3';
export const MENU_MUSIC_URL        = 'play/assets/audio/music/menu.mp3';
