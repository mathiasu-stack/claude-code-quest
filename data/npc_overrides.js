// npc_overrides.js — per-NPC position/face overrides applied at spawn.
//
// Keyed by NPC id. Both hand-built NPCs (NPCS in play.js) and
// procedurally-generated chapter NPCs (`auto-${lessonId}` /
// `auto-${chapterId}-test`) are eligible — apply step lives in
// spawnNPC() and runs after the floor-relocation overrides.
//
// Format: { [npcId]: { pos: [x, z], face: number } }
//
// Updated by the in-game editor's Export Layout. Hand-edit here only
// if you want to lock in a placement permanently — otherwise prefer
// the editor.
window.NPC_OVERRIDES = {};
