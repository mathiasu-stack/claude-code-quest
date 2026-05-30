// npc_overrides.js — per-NPC position/face overrides applied at spawn.
//
// Keyed by NPC id (hand-built or auto-${lessonId}). Applied in
// spawnNPC() after floor-relocation overrides.
//
// Supports identity fields (name, role, portrait) in addition to
// pos/face/scale so chapter-mentor NPCs can adopt a named persona
// instead of the procedurally-generated identity. Used for the three
// new chapter mentors: Dr. Priya Engelhardt (ch10), Sam Okoye (ch14),
// Rena Vasquez (ch15).
window.NPC_OVERRIDES = {
  'linda': { pos: [-2.2859, -7.4794], face: 0.3491 },
  'ines': { pos: [2.9742, -4.4045], face: -14.0507 },

  // Chapter mentors — pin the lesson-1 NPC of each new chapter to a
  // named mentor that matches the in-lesson narrative and the practical
  // test's scenarioFrom field.
  'auto-ch10-l01': {
    name: 'Dr. Priya Engelhardt',
    role: 'Head of AI Operations',
    portrait: '👩‍🔬',
  },
  'auto-ch14-l01': {
    name: 'Sam Okoye',
    role: 'Engineering Team Lead',
    portrait: '🧑🏾‍💼',
  },
  'auto-ch15-l01': {
    name: 'Rena Vasquez',
    role: 'Platform Engineer · InfoSec',
    portrait: '🛡️',
  },
};
