// extract.cjs — pulls inspectable scene data out of the source tree.
//
// What it extracts:
//   - NPCs: window.CURRICULUM-aware NPC roster from play.js (the hand-built
//     ones in the NPCS array, plus the auto-generated ones produced by
//     generateChapterNPCs() simulated here).
//   - Curriculum: chapters/lessons/tests after both curriculum.js and
//     curriculum2.js execute.
//   - Placements: every literal position.set(x, y, z) and array-literal
//     pos:[x, y[, z]] in the listed files, paired with the nearest
//     BoxGeometry/PlaneGeometry size and a best-guess identifier
//     (the variable name or comment label preceding it).
//
// This is intentionally regex-based — we don't pull in a JS parser to
// keep the audit suite dependency-free. The trade-off is that
// procedurally-derived positions (Math.random(), loop variables not
// constant-folded) are skipped; we capture only literal coordinates,
// which is exactly the class of placement the audits care about.
//
// All extracted records carry { file, line } so failures point at the
// exact location.

const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..', '..');

// ── Loaders ──────────────────────────────────────────────────────────

function readFile(rel) {
  return fs.readFileSync(path.join(REPO, rel), 'utf8');
}

// Load curriculum.js + curriculum2.js into a fake `window` and return
// the resulting CURRICULUM array. Both files are plain JS that push to
// window.CURRICULUM.
function loadCurriculum() {
  const sandbox = { window: {} };
  const c1 = readFile('data/curriculum.js');
  const c2 = readFile('data/curriculum2.js');
  // eslint-disable-next-line no-new-func
  new Function('window', c1)(sandbox.window);
  new Function('window', c2)(sandbox.window);
  return sandbox.window.CURRICULUM || [];
}

// Load play.js NPC roster (just the hand-built NPCS array). We don't
// run the auto-generator here — we re-implement it below so each
// extracted NPC carries a { file, line } for blame reporting.
function loadNpcsHandBuilt() {
  const src = readFile('play/play.js');
  // Find `const NPCS = [` ... `];` (the literal at top level).
  const startMatch = src.match(/const NPCS = \[/);
  if (!startMatch) throw new Error('NPCS array not found in play.js');
  const startIdx = startMatch.index + startMatch[0].length;
  // Scan forward, balancing brackets, until the matching ];
  let depth = 1;
  let i = startIdx;
  while (i < src.length && depth > 0) {
    const c = src[i];
    if (c === '[') depth++;
    else if (c === ']') depth--;
    i++;
  }
  const body = src.slice(startIdx, i - 1);
  // Eval the array literal in isolation. The literal references
  // Math.PI which is globally available; no other free vars.
  // eslint-disable-next-line no-new-func
  const arr = new Function(`return [${body}];`)();
  // Re-scan the source to attach { file, line } per entry by tracking
  // the line numbers where each `id: '…'` appears.
  const lineByIdx = lineMap(src, startIdx);
  const out = [];
  let ai = 0;
  const idRe = /\bid:\s*'([^']+)'/g;
  let m;
  while ((m = idRe.exec(src.slice(startIdx, i - 1))) !== null) {
    const npc = arr[ai];
    if (npc) {
      out.push({ ...npc, _file: 'play/play.js', _line: lineByIdx(m.index + startIdx) });
    }
    ai++;
  }
  return out;
}

function lineMap(src, base) {
  // Returns a function `lineAt(absoluteIndex)` → 1-based line number.
  const lineStarts = [0];
  for (let i = 0; i < src.length; i++) {
    if (src[i] === '\n') lineStarts.push(i + 1);
  }
  return (idx) => {
    // Binary search
    let lo = 0, hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= idx) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
}

// ── Auto-generated NPCs ──────────────────────────────────────────────
//
// Mirror of play.js:generateChapterNPCs without the UI bits — just the
// fields the audits care about (id, zone, pos, role, chapterId,
// lessonId/testId, kind). Used to enumerate the NPCs created for
// chapters 3-16 by the procedural generator.

// Parse an array literal out of play.js at audit time so the audit can't
// drift from the live data. Matched by name then bracket-balanced; the
// content is eval'd, so it works for string OR object-literal arrays
// (comments inside the array are fine for the Function eval).
function parseArrayLiteral(src, name) {
  const re = new RegExp(`const ${name}\\s*=\\s*\\[`);
  const m = src.match(re);
  if (!m) throw new Error(`${name} not found in play.js`);
  let i = m.index + m[0].length, depth = 1;
  while (i < src.length && depth > 0) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') depth--;
    i++;
  }
  // eslint-disable-next-line no-new-func
  return new Function(`return [${src.slice(m.index + m[0].length, i - 1)}];`)();
}

const _playSrc = readFile('play/play.js');
// play.js:generateChapterNPCs names people from PEOPLE_POOL (objects with
// first/last/rig) and roles from ROLES_LESSON. Mirror both so ids/zones/
// positions/roles stay in lockstep with the live generator.
const PEOPLE_POOL = parseArrayLiteral(_playSrc, 'PEOPLE_POOL');
const ROLES_LESSON = parseArrayLiteral(_playSrc, 'ROLES_LESSON');
const pick = (arr, seed) => arr[(seed * 9301 + 49297) % arr.length];

// play.js:HAND_BUILT_CHAPTER_IDS — chapters whose NPCs are in the
// NPCS literal. Auto-gen skips these by ID, not by curriculum index.
const HAND_BUILT_CHAPTER_IDS = new Set(['ch01', 'ch02']);

function generateAutoNpcs(curriculum) {
  const out = [];
  for (let chapterIdx = 0; chapterIdx < curriculum.length; chapterIdx++) {
    const ch = curriculum[chapterIdx];
    if (!ch) continue;
    if (HAND_BUILT_CHAPTER_IDS.has(ch.id)) continue;
    const cZ = chapterIdx * 22;
    const slots = [
      { x: -6, z: cZ - 4 }, { x: 6, z: cZ - 4 },
      { x: -6, z: cZ },     { x: 6, z: cZ },
      { x: -6, z: cZ + 4 }, { x: 6, z: cZ + 4 },
    ];
    (ch.lessons || []).forEach((l, i) => {
      const slot = slots[i % slots.length];
      const seed = chapterIdx * 11 + i * 7;
      const person = pick(PEOPLE_POOL, seed);
      out.push({
        id: `auto-${l.id}`,
        zone: chapterIdx + 1,
        pos: [slot.x, slot.z],
        name: `${person.first} ${person.last}`,
        role: pick(ROLES_LESSON, seed + 3),
        chapterId: ch.id,
        lessonId: l.id,
        kind: 'lesson',
        _file: 'play/play.js',
        _line: 0,   // procedural; no source line to point at
      });
    });
    // Test NPC at south end (near door to next zone)
    const testSeed = chapterIdx * 11 + 99;
    const person = pick(PEOPLE_POOL, testSeed);
    out.push({
      id: `auto-${ch.id}-test`,
      zone: chapterIdx + 1,
      pos: [0, cZ + 8.5],
      name: `${person.first} ${person.last}`,
      role: 'Assessor',
      chapterId: ch.id,
      testId: ch.practicalTest?.id || `${ch.id}-test`,
      kind: 'test',
      _file: 'play/play.js',
      _line: 0,
    });
  }
  return out;
}

// ── Position extractor ───────────────────────────────────────────────

// File → { kind, position, dimensions?, comment? } entries.
//
// Patterns recognized per file:
//   - `position.set(x, y, z)` or `position.set(x, z)` where x/y/z are
//     numeric literals (allowing leading `-`)
//   - `pos: [x, z]` literal (NPC roster style)
//   - `new THREE.BoxGeometry(w, h, d)` or `BoxGeometry(w, h, d)`
//
// We pair the geometry size to the nearest following position by
// scanning a small window. Items without a numeric position are
// skipped — that's the "procedurally-derived" class we explicitly
// decline to audit statically.

const NUM = '-?\\d+(?:\\.\\d+)?';
const POS3_RE = new RegExp(`\\.position\\.set\\(\\s*(${NUM})\\s*,\\s*(${NUM})\\s*,\\s*(${NUM})\\s*\\)`, 'g');
const POS2_RE = new RegExp(`\\.position\\.set\\(\\s*(${NUM})\\s*,\\s*(${NUM})\\s*\\)`, 'g');
const BOX_RE  = new RegExp(`(?:new\\s+THREE\\.)?BoxGeometry\\(\\s*(${NUM})\\s*,\\s*(${NUM})\\s*,\\s*(${NUM})\\s*\\)`, 'g');
const PLANE_RE = new RegExp(`(?:new\\s+THREE\\.)?PlaneGeometry\\(\\s*(${NUM})\\s*,\\s*(${NUM})\\s*\\)`, 'g');

function extractPlacements(relFiles) {
  const records = [];
  for (const rel of relFiles) {
    const src = readFile(rel);
    const lineAt = lineMap(src, 0);
    // Sweep position.set(x, y, z)
    let m;
    POS3_RE.lastIndex = 0;
    while ((m = POS3_RE.exec(src)) !== null) {
      const x = parseFloat(m[1]), y = parseFloat(m[2]), z = parseFloat(m[3]);
      records.push({
        file: rel, line: lineAt(m.index),
        kind: 'position3',
        pos: { x, y, z },
        dims: nearestSizeBefore(src, m.index),
        label: labelFor(src, m.index),
      });
    }
    POS2_RE.lastIndex = 0;
    while ((m = POS2_RE.exec(src)) !== null) {
      // Skip if this same match was already a 3-arg call (POS3 starts with same prefix)
      const after = src[m.index + m[0].length];
      // 2-arg .position.set is uncommon; treat y=0.
      const x = parseFloat(m[1]), z = parseFloat(m[2]);
      records.push({
        file: rel, line: lineAt(m.index),
        kind: 'position2',
        pos: { x, y: 0, z },
        dims: nearestSizeBefore(src, m.index),
        label: labelFor(src, m.index),
      });
    }
  }
  return records;
}

function nearestSizeBefore(src, atIdx) {
  // Look back up to 400 chars for a BoxGeometry or PlaneGeometry call.
  const lo = Math.max(0, atIdx - 400);
  const slice = src.slice(lo, atIdx);
  let lastBox = null;
  let m;
  const boxRe = new RegExp(BOX_RE.source, 'g');
  while ((m = boxRe.exec(slice)) !== null) {
    lastBox = { w: parseFloat(m[1]), h: parseFloat(m[2]), d: parseFloat(m[3]), kind: 'box' };
  }
  if (lastBox) return lastBox;
  const planeRe = new RegExp(PLANE_RE.source, 'g');
  let lastPlane = null;
  while ((m = planeRe.exec(slice)) !== null) {
    lastPlane = { w: parseFloat(m[1]), h: parseFloat(m[2]), d: 0.05, kind: 'plane' };
  }
  return lastPlane;
}

function labelFor(src, atIdx) {
  // Look back up to 200 chars for `const NAME =` or a `//` comment on
  // the previous line — use whichever is closest.
  const lo = Math.max(0, atIdx - 200);
  const slice = src.slice(lo, atIdx);
  const constMatches = [...slice.matchAll(/\bconst\s+(\w+)\s*=/g)];
  if (constMatches.length) return constMatches[constMatches.length - 1][1];
  return null;
}

// ── Posters specifically (decorations/reception.js) ──────────────────
//
// reception.js has an array literal `posters = [...]` with `pos: [x, y, z]`
// entries. Pull those out directly with bracket-balanced parsing.

function extractPosters() {
  const src = readFile('play/decorations/reception.js');
  const startMatch = src.match(/const posters = \[/);
  if (!startMatch) return [];
  const startIdx = startMatch.index + startMatch[0].length;
  let depth = 1, i = startIdx;
  while (i < src.length && depth > 0) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') depth--;
    i++;
  }
  const body = src.slice(startIdx, i - 1);
  // eslint-disable-next-line no-new-func
  const arr = new Function(`return [${body}];`)();
  const lineAt = lineMap(src, 0);
  const idRe = /title:\s*'([^']+)'/g;
  let m, ai = 0;
  const out = [];
  while ((m = idRe.exec(src.slice(startIdx, i - 1))) !== null) {
    const p = arr[ai];
    if (p) {
      out.push({
        title: p.title, sub: p.sub, pos: p.pos, rot: p.rot,
        _file: 'play/decorations/reception.js',
        _line: lineAt(m.index + startIdx),
      });
    }
    ai++;
  }
  return out;
}

// ── Reception windows (depth.js) ─────────────────────────────────────

function extractReceptionWindows() {
  const src = readFile('play/world/depth.js');
  // Look for the positions array.
  const m = src.match(/const positions = \[([\s\S]*?)\];/);
  if (!m) return [];
  // eslint-disable-next-line no-new-func
  const arr = new Function(`return [${m[1]}];`)();
  const lineAt = lineMap(src, 0);
  return arr.map((p) => ({
    z: p.z, w: p.w, h: p.h,
    // East wall in reception is at x=10.83 (frame at 10.78).
    pos: { x: 10.78, y: 1.9, z: p.z },
    _file: 'play/world/depth.js',
    _line: lineAt(m.index),
  }));
}

module.exports = {
  REPO,
  readFile,
  loadCurriculum,
  loadNpcsHandBuilt,
  generateAutoNpcs,
  extractPlacements,
  extractPosters,
  extractReceptionWindows,
};
