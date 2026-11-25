#!/usr/bin/env node
// layout.cjs — audits the FINAL in-game NPC positions and module identity.
//
// spatial.cjs::1.8 checks the generator's pre-relocation corridor coords;
// the game then relocates every floor-1-west-wing and floor-2–4 NPC via
// engine/layout.js. This script runs that same engine/layout.js (plus the
// editor's data/npc_overrides.js) so it checks what the player actually
// walks up to. Born from ch16-l07 shipping outside the floor-4 wall.
//
//   ✓ 4.1  Every relocated NPC stands inside the walkable floor (reachable)
//   ✓ 4.2  No two NPCs within 0.6 m on the same floor
//   ✓ 4.3  No NPC inside a desk/table/couch footprint (data/rooms.js)
//   ✓ 4.4  Every chapter fits its room (lessons ≤ Layout.LESSON_CAPACITY)
//   ✓ 4.5  No ES module imported under two different URLs (?v= mismatch
//          forks module state — quality.js / AudioManager / interactables)

const fs = require('fs');
const path = require('path');
const { REPO, readFile, loadCurriculum, loadNpcsHandBuilt, generateAutoNpcs } = require('./lib/extract.cjs');

const findings = [];
const pass = (id, s) => findings.push({ id, status: 'PASS', summary: s });
const fail = (id, s, d) => findings.push({ id, status: 'FAIL', summary: s, details: d });

function loadLayout(curriculum) {
  const window = { CURRICULUM: curriculum };
  new Function('window', readFile('engine/layout.js'))(window);
  new Function('window', readFile('data/npc_overrides.js'))(window);
  new Function('window', readFile('data/rooms.js'))(window);
  return window;
}

// Mirror spawnNPC(): floor relocation, then the editor override wins.
function finalPlacements(w, npcs) {
  const L = w.Layout;
  const out = [];
  for (const n of npcs) {
    if (!n.chapterId) continue;
    const ch = w.CURRICULUM.find(c => c.id === n.chapterId);
    if (!ch || ch.capstone) continue;
    const p = L.officePosition(n) || L.westWingPosition(n);
    if (!p) continue;
    const ov = w.NPC_OVERRIDES && w.NPC_OVERRIDES[n.id];
    out.push({ ...n, floor: p.floor, pos: (ov && ov.pos) || p.pos, overridden: !!(ov && ov.pos) });
  }
  return out;
}

function audit_4_1_bounds(w, placed) {
  const H = w.Layout.OFFICE_WALK_HALF;
  const bad = placed.filter(n => n.floor > 1 && (Math.abs(n.pos[0]) > H || Math.abs(n.pos[1]) > H))
    .map(n => `${n.id} (${n.chapterId}) at (${n.pos[0].toFixed(1)}, ${n.pos[1].toFixed(1)}) on floor ${n.floor} — walkable is ±${H}`);
  const n = placed.filter(p => p.floor > 1).length;
  if (bad.length) fail('4.1', `${bad.length} NPC(s) outside the walkable floor (unreachable)`, bad);
  else pass('4.1', `All relocated upper-floor NPCs inside the walkable floor (${n} checked)`);
}

function audit_4_2_overlap(placed) {
  const TOL = 0.6, bad = [];
  for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) {
    const a = placed[i], b = placed[j];
    if (a.floor !== b.floor) continue;
    if (Math.hypot(a.pos[0] - b.pos[0], a.pos[1] - b.pos[1]) < TOL) bad.push(`${a.id} ↔ ${b.id} on floor ${a.floor}`);
  }
  if (bad.length) fail('4.2', `${bad.length} NPC pair(s) closer than ${TOL} m`, bad);
  else pass('4.2', `No relocated NPCs closer than ${TOL} m (${placed.length} checked)`);
}

// Rough footprints (half-extents, metres) for the furniture NPCs could be
// dropped into. Conservative on purpose: a hit here means "look at it".
function footprint(o) {
  const s = (o.scale && o.scale[0]) || 1;
  const a = o.args || {};
  const rot = Math.abs(Math.sin(o.rotY || 0)) > 0.5;
  let hx, hz;
  switch (o.fn) {
    case 'desk': hx = (a.w || 1.6) / 2 * s; hz = (a.d || 0.8) / 2 * s; break;
    case 'table': hx = (a.w || 2.2) / 2; hz = 0.5; break;
    case 'couch': hx = 1.0; hz = 0.45; break;
    case 'bookshelf': hx = 1.1; hz = 0.2; break;
    default: return null;
  }
  return rot ? { hx: hz, hz: hx } : { hx, hz };
}

function audit_4_3_furniture(w, placed) {
  const BODY = 0.25, bad = [];
  for (const room of (w.ROOMS || [])) {
    const m = /^office_floor(\d)$/.exec(room.id);
    if (!m) continue;
    const floor = Number(m[1]);
    for (const o of room.objects || []) {
      if (o.type !== 'builder' || !o.pos) continue;
      const fp = footprint(o);
      if (!fp) continue;
      for (const n of placed) {
        if (n.floor !== floor) continue;
        if (Math.abs(n.pos[0] - o.pos[0]) < fp.hx + BODY && Math.abs(n.pos[1] - o.pos[2]) < fp.hz + BODY) {
          bad.push(`${n.id} at (${n.pos[0].toFixed(1)}, ${n.pos[1].toFixed(1)}) inside ${o.fn} at (${o.pos[0]}, ${o.pos[2]}) on floor ${floor}`);
        }
      }
    }
  }
  if (bad.length) fail('4.3', `${bad.length} NPC(s) standing inside furniture`, bad);
  else pass('4.3', `No upper-floor NPC inside a desk/table/couch/bookshelf footprint`);
}

function audit_4_4_capacity(w) {
  const cap = w.Layout.LESSON_CAPACITY;
  const bad = w.CURRICULUM.filter(c => !c.capstone && c.lessons.length > cap)
    .map(c => `${c.id} has ${c.lessons.length} lessons (room capacity ${cap})`);
  if (bad.length) fail('4.4', `${bad.length} chapter(s) exceed room capacity`, bad);
  else pass('4.4', `Every chapter fits its room (max ${Math.max(...w.CURRICULUM.filter(c => !c.capstone).map(c => c.lessons.length))} of ${cap} lesson slots used)`);
}

function audit_4_5_module_forks() {
  const byModule = new Map();
  (function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      if (f === 'vendor') continue;
      if (fs.statSync(p).isDirectory()) { walk(p); continue; }
      if (!p.endsWith('.js')) continue;
      const src = fs.readFileSync(p, 'utf8');
      for (const m of src.matchAll(/(?:\bfrom|\bimport\()\s*['"](\.[^'"]+)['"]/g)) {
        const [rel, q] = m[1].split('?');
        const target = path.relative(REPO, path.normalize(path.join(path.dirname(p), rel)));
        if (!byModule.has(target)) byModule.set(target, new Map());
        const v = q || '(none)';
        const users = byModule.get(target);
        if (!users.has(v)) users.set(v, []);
        users.get(v).push(path.relative(REPO, p));
      }
    }
  })(path.join(REPO, 'play'));
  const bad = [];
  for (const [mod, versions] of byModule) {
    if (versions.size > 1) bad.push(`${mod}: ` + [...versions].map(([v, u]) => `${v} ← ${u.join(', ')}`).join(' | '));
  }
  if (bad.length) fail('4.5', `${bad.length} module(s) imported under different URLs (forked module state)`, bad);
  else pass('4.5', `Every ES module imported under a single URL (${byModule.size} modules)`);
}

function main() {
  const curriculum = loadCurriculum();
  const w = loadLayout(curriculum);
  const npcs = [...loadNpcsHandBuilt(), ...generateAutoNpcs(curriculum)];
  const placed = finalPlacements(w, npcs);
  audit_4_1_bounds(w, placed);
  audit_4_2_overlap(placed);
  audit_4_3_furniture(w, placed);
  audit_4_4_capacity(w);
  audit_4_5_module_forks();

  console.log('\n=== LAYOUT ===');
  for (const f of findings) {
    const marker = f.status === 'PASS' ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
    console.log(`${marker} layout::${f.id.padEnd(5)}  ${f.summary}`);
    for (const d of (f.details || []).slice(0, 12)) console.log(`         · ${d}`);
  }
  const fails = findings.filter(f => f.status === 'FAIL').length;
  console.log(`\n${fails === 0 ? '\x1b[32mAll passed\x1b[0m' : `\x1b[31m${fails} audit(s) failed\x1b[0m`}.\n`);
  process.exit(Math.min(254, fails));
}

main();
