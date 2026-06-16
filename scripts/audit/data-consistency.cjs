// data-consistency.cjs — NPC ↔ curriculum cross-checks.
//
// Each audit prints one PASS/FAIL line and contributes its failure
// count to the script's exit code (capped at 254).
//
// Audits implemented:
//   1.1  NPC role ≠ player-rank label
//   1.2  NPC.chapterId resolves to a real chapter
//   1.3  Lesson NPC.lessonId resolves inside its chapter
//   1.4  Test NPC.testId matches the chapter's practicalTest.id
//   1.5  Every chapter has ≥1 lesson NPC + a test NPC
//   1.6  No duplicate lessonId across the merged NPC roster
//   2.1  Unique chapter ids
//   2.2  Unique lesson ids globally
//   2.4  Every chapter has a practicalTest
//   2.8  Test criterion `type` values are valid evaluator types
//   2.9  Regex criteria compile
//   2.12 Knowledge-check correctIndex in range

const { loadCurriculum, loadNpcsHandBuilt, generateAutoNpcs } = require('./lib/extract.cjs');

const PLAYER_RANKS = [
  'Intern', 'Junior Hire', 'Associate', 'Engineer', 'Senior',
  'Lead', 'Principal', 'Director',
];

const EVALUATOR_TYPES = new Set(['keyword', 'regex', 'length', 'structure', 'nonce']);
const STRUCTURE_NAMES = new Set(['numbered-steps', 'question-mark', 'code-block']);

const findings = [];
function pass(id, summary)          { findings.push({ id, status: 'PASS', summary }); }
function fail(id, summary, details) { findings.push({ id, status: 'FAIL', summary, details }); }

function main() {
  const curriculum = loadCurriculum();
  const handBuiltNpcs = loadNpcsHandBuilt();
  const autoNpcs = generateAutoNpcs(curriculum);
  const allNpcs = [...handBuiltNpcs, ...autoNpcs];

  audit_1_1_role_vs_rank(allNpcs);
  audit_1_2_chapter_xref(allNpcs, curriculum);
  audit_1_3_lesson_xref(allNpcs, curriculum);
  audit_1_4_test_xref(allNpcs, curriculum);
  audit_1_5_chapter_has_npcs(allNpcs, curriculum);
  audit_1_6_no_duplicate_lessons(allNpcs);
  audit_2_1_unique_chapter_ids(curriculum);
  audit_2_2_unique_lesson_ids(curriculum);
  audit_2_4_chapter_has_test(curriculum);
  audit_2_8_evaluator_types(curriculum);
  audit_2_9_regex_compiles(curriculum);
  audit_2_12_knowledge_check_index(curriculum);

  report();
}

// ── Audits ───────────────────────────────────────────────────────────

function audit_1_1_role_vs_rank(npcs) {
  const collisions = [];
  for (const n of npcs) {
    if (PLAYER_RANKS.includes(n.role)) {
      collisions.push(`${n.name} (id=${n.id}, ${n._file}:${n._line || '?'}) → role="${n.role}"`);
    }
  }
  if (collisions.length === 0) {
    pass('1.1', `NPC role ≠ player-rank label (${npcs.length} NPCs checked, 0 collisions)`);
  } else {
    fail('1.1', `${collisions.length} NPC(s) have a role string that matches a player rank label`, collisions);
  }
}

function audit_1_2_chapter_xref(npcs, curriculum) {
  const valid = new Set(curriculum.map(c => c.id));
  const bad = [];
  for (const n of npcs) {
    if (!n.chapterId) continue;
    if (!valid.has(n.chapterId)) {
      bad.push(`${n.name} (id=${n.id}) → chapterId="${n.chapterId}" not in curriculum`);
    }
  }
  if (bad.length === 0) pass('1.2', `NPC.chapterId xrefs (${npcs.filter(n => n.chapterId).length} checked, 0 dangling)`);
  else fail('1.2', `${bad.length} NPC chapterId(s) don't resolve`, bad);
}

function audit_1_3_lesson_xref(npcs, curriculum) {
  const lessonsByChapter = new Map(curriculum.map(c => [c.id, new Set((c.lessons || []).map(l => l.id))]));
  const bad = [];
  let checked = 0;
  for (const n of npcs) {
    if (n.kind !== 'lesson' || !n.lessonId || !n.chapterId) continue;
    checked++;
    const set = lessonsByChapter.get(n.chapterId);
    if (!set || !set.has(n.lessonId)) {
      bad.push(`${n.name} (id=${n.id}) → ${n.chapterId}.${n.lessonId} not found`);
    }
  }
  if (bad.length === 0) pass('1.3', `Lesson NPC.lessonId xrefs (${checked} checked, 0 dangling)`);
  else fail('1.3', `${bad.length} lesson NPCs reference unknown lesson ids`, bad);
}

function audit_1_4_test_xref(npcs, curriculum) {
  const testIds = new Map(curriculum.map(c => [c.id, c.practicalTest?.id]));
  const bad = [];
  let checked = 0;
  for (const n of npcs) {
    if (n.kind !== 'test' || !n.testId || !n.chapterId) continue;
    checked++;
    const expected = testIds.get(n.chapterId);
    if (expected !== n.testId) {
      bad.push(`${n.name} (id=${n.id}) → testId="${n.testId}" but ${n.chapterId}.practicalTest.id="${expected}"`);
    }
  }
  if (bad.length === 0) pass('1.4', `Test NPC.testId xrefs (${checked} checked, 0 mismatches)`);
  else fail('1.4', `${bad.length} test NPCs disagree with their chapter's practicalTest.id`, bad);
}

function audit_1_5_chapter_has_npcs(npcs, curriculum) {
  const lessonNpcsByChapter = new Map();
  const testNpcsByChapter = new Map();
  for (const n of npcs) {
    if (!n.chapterId) continue;
    if (n.kind === 'lesson') lessonNpcsByChapter.set(n.chapterId, (lessonNpcsByChapter.get(n.chapterId) || 0) + 1);
    if (n.kind === 'test')   testNpcsByChapter.set(n.chapterId,   (testNpcsByChapter.get(n.chapterId)   || 0) + 1);
  }
  const orphans = [];
  for (const c of curriculum) {
    if (!(lessonNpcsByChapter.get(c.id) > 0)) orphans.push(`${c.id} (${c.title}) → no lesson NPCs`);
    if (!(testNpcsByChapter.get(c.id)   > 0)) orphans.push(`${c.id} (${c.title}) → no test NPC`);
  }
  if (orphans.length === 0) pass('1.5', `Every chapter has lesson NPCs + a test NPC (${curriculum.length} chapters)`);
  else fail('1.5', `${orphans.length} chapter(s) missing NPCs`, orphans);
}

function audit_1_6_no_duplicate_lessons(npcs) {
  const seen = new Map();
  const dupes = [];
  for (const n of npcs) {
    if (n.kind !== 'lesson' || !n.lessonId) continue;
    if (seen.has(n.lessonId)) {
      dupes.push(`lessonId="${n.lessonId}" taught by both ${seen.get(n.lessonId)} and ${n.name}`);
    } else {
      seen.set(n.lessonId, n.name);
    }
  }
  if (dupes.length === 0) pass('1.6', `No duplicate lesson assignments (${seen.size} unique lessons)`);
  else fail('1.6', `${dupes.length} duplicate lessonId assignment(s)`, dupes);
}

function audit_2_1_unique_chapter_ids(curriculum) {
  const seen = new Set();
  const dupes = [];
  for (const c of curriculum) {
    if (seen.has(c.id)) dupes.push(c.id);
    seen.add(c.id);
  }
  if (dupes.length === 0) pass('2.1', `Chapter ids unique (${seen.size})`);
  else fail('2.1', `${dupes.length} duplicate chapter id(s)`, dupes);
}

function audit_2_2_unique_lesson_ids(curriculum) {
  const seen = new Map();
  const dupes = [];
  for (const c of curriculum) {
    for (const l of (c.lessons || [])) {
      if (seen.has(l.id)) {
        dupes.push(`${l.id} appears in both ${seen.get(l.id)} and ${c.id}`);
      } else {
        seen.set(l.id, c.id);
      }
    }
  }
  if (dupes.length === 0) pass('2.2', `Lesson ids globally unique (${seen.size})`);
  else fail('2.2', `${dupes.length} duplicate lesson id(s)`, dupes);
}

function audit_2_4_chapter_has_test(curriculum) {
  const missing = curriculum.filter(c => !c.practicalTest || !c.practicalTest.id).map(c => c.id);
  if (missing.length === 0) pass('2.4', `Every chapter has a practicalTest (${curriculum.length})`);
  else fail('2.4', `${missing.length} chapter(s) missing practicalTest`, missing);
}

function audit_2_8_evaluator_types(curriculum) {
  const bad = [];
  let checked = 0;
  for (const c of curriculum) {
    for (const crit of (c.practicalTest?.criteria || [])) {
      checked++;
      if (!EVALUATOR_TYPES.has(crit.type)) {
        bad.push(`${c.id}.${c.practicalTest.id}: criterion type="${crit.type}" (valid: ${[...EVALUATOR_TYPES].join(',')})`);
      } else if (crit.type === 'structure' && !STRUCTURE_NAMES.has(crit.value)) {
        bad.push(`${c.id}.${c.practicalTest.id}: structure value="${crit.value}" (valid: ${[...STRUCTURE_NAMES].join(',')})`);
      }
    }
  }
  if (bad.length === 0) pass('2.8', `All test criteria use valid evaluator types (${checked} checked)`);
  else fail('2.8', `${bad.length} invalid criterion type(s)`, bad);
}

function audit_2_9_regex_compiles(curriculum) {
  const bad = [];
  let checked = 0;
  for (const c of curriculum) {
    for (const crit of (c.practicalTest?.criteria || [])) {
      if (crit.type !== 'regex') continue;
      checked++;
      try { new RegExp(crit.value, 'i'); }
      catch (e) {
        bad.push(`${c.id}.${c.practicalTest.id}: regex /${crit.value}/ — ${e.message}`);
      }
    }
  }
  if (bad.length === 0) pass('2.9', `Regex criteria compile (${checked} regexes checked)`);
  else fail('2.9', `${bad.length} regex criterion(s) don't compile`, bad);
}

function audit_2_12_knowledge_check_index(curriculum) {
  const bad = [];
  let checked = 0;
  for (const c of curriculum) {
    for (const l of (c.lessons || [])) {
      if (!l.check || !Array.isArray(l.check.options)) continue;
      checked++;
      const idx = l.check.correctIndex;
      if (typeof idx !== 'number' || idx < 0 || idx >= l.check.options.length) {
        bad.push(`${c.id}.${l.id}: correctIndex=${idx} not in [0..${l.check.options.length - 1}]`);
      }
    }
  }
  if (bad.length === 0) pass('2.12', `Knowledge-check correctIndex values valid (${checked} checked)`);
  else fail('2.12', `${bad.length} out-of-range correctIndex value(s)`, bad);
}

// ── Reporter ─────────────────────────────────────────────────────────

function report() {
  console.log('\n=== DATA CONSISTENCY ===');
  for (const f of findings) {
    const marker = f.status === 'PASS' ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
    console.log(`${marker} data::${f.id.padEnd(5)}  ${f.summary}`);
    if (f.details) {
      for (const d of f.details.slice(0, 6)) console.log(`         · ${d}`);
      if (f.details.length > 6) console.log(`         · … ${f.details.length - 6} more`);
    }
  }
  const fails = findings.filter(f => f.status === 'FAIL').length;
  console.log(`\n${fails === 0 ? '\x1b[32mAll passed\x1b[0m' : `\x1b[31m${fails} audit(s) failed\x1b[0m`}.\n`);
  process.exit(Math.min(254, fails));
}

main();
