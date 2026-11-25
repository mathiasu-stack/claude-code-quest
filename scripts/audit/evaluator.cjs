#!/usr/bin/env node
// evaluator.cjs — grading-strength audit for the practical tests.
//
// The Nov 2026 review found that all 17 practicals passed with a 38–159
// character "keyword salad" (the first keyword of each criterion + the
// nonce). Owner decision: a pass must rest on real Claude Code evidence.
// This audit keeps it that way.
//
//   ✓ 5.1  Every practical test declares `evidence` (headless run / SKILL.md)
//   ✓ 5.2  Keyword salad FAILS every test
//   ✓ 5.3  Salad + well-formed evidence PASSES every test (still passable)
//
// Grades exactly like ui/test.js: test.criteria + the required evidence
// criterion built from test.evidence. (Capstone artifact criteria appended
// by ui/test.js are not modelled here; they only add requirements.)

const fs = require('fs');
const path = require('path');
const { REPO, loadCurriculum } = require('./lib/extract.cjs');

const findings = [];
const pass = (id, s) => findings.push({ id, status: 'PASS', summary: s });
const fail = (id, s, d) => findings.push({ id, status: 'FAIL', summary: s, details: d });

function loadEvaluator() {
  const w = {};
  new Function('window', fs.readFileSync(path.join(REPO, 'engine/evaluator.js'), 'utf8'))(w);
  return w.Evaluator;
}

const NONCE = 'KDQ-AUD1T';

function salad(test) {
  const parts = [];
  for (const c of test.criteria) {
    if (c.type === 'keyword') parts.push(Array.isArray(c.value) ? c.value[0] : c.value);
    else if (c.type === 'structure') parts.push('\n1. a\n2. b\n3. c ? `x`\n');
    else if (c.type === 'nonce') parts.push(NONCE);
    else if (c.type === 'length') parts.push('x'.repeat(Number(c.value) || 0));
  }
  let s = parts.join(' ');
  while (s.length < (test.minLength || 0)) s += ' filler';
  return s;
}

function evidenceFor(test) {
  const ev = test.evidence || {};
  const kinds = ev.accept || ['headless-run'];
  const words = (ev.mustMention || []).join(' ');
  if (kinds.includes('headless-run')) {
    const model = ev.modelIncludes ? `claude-${ev.modelIncludes}-5-5` : 'claude-opus-5-5';
    return '\n' + JSON.stringify({
      type: 'result', subtype: 'success', is_error: false,
      result: `Done. ${words} ${NONCE}`,
      session_id: '00000000-0000-4000-8000-000000000000', total_cost_usd: 0.01, num_turns: 1,
      modelUsage: { [model]: { inputTokens: 1 } },
      subagent_stats: { spawned: ev.minSubagents || 0 },
    });
  }
  return `\n---\nname: audit-skill\ndescription: Audit fixture skill ${words}\n---\n\nStep one: do the thing carefully.\nStep two: report what changed and why.\n`;
}

function graded(test) {
  const ev = test.evidence ? [{ type: 'evidence', value: test.evidence, weight: 3, required: true, description: 'evidence' }] : [];
  return test.criteria.concat(ev);
}

function main() {
  const E = loadEvaluator();
  const tests = loadCurriculum().map(c => c.practicalTest).filter(Boolean);
  const missing = tests.filter(t => !t.evidence).map(t => t.id);
  if (missing.length) fail('5.1', `${missing.length} practical test(s) without an evidence block`, missing);
  else pass('5.1', `Every practical test declares evidence (${tests.length})`);

  const saladPasses = [], unpassable = [];
  for (const t of tests) {
    const s = salad(t);
    if (E.evaluate(s, graded(t), t.minLength || 0, t.passThreshold, { nonce: NONCE }).passed) saladPasses.push(`${t.id} (${s.length} chars)`);
    const honest = s + evidenceFor(t);
    const r = E.evaluate(honest, graded(t), t.minLength || 0, t.passThreshold, { nonce: NONCE });
    if (!r.passed) unpassable.push(`${t.id} scored ${r.score}${r.missingRequired ? ', evidence rejected' : ''}`);
  }
  if (saladPasses.length) fail('5.2', `${saladPasses.length} test(s) pass on keyword salad`, saladPasses);
  else pass('5.2', `Keyword salad fails every practical test (${tests.length})`);
  if (unpassable.length) fail('5.3', `${unpassable.length} test(s) not passable even with valid evidence`, unpassable);
  else pass('5.3', `Every practical test passes with well-formed evidence (${tests.length})`);

  console.log('\n=== EVALUATOR ===');
  for (const f of findings) {
    const marker = f.status === 'PASS' ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
    console.log(`${marker} evaluator::${f.id.padEnd(5)}  ${f.summary}`);
    for (const d of (f.details || []).slice(0, 20)) console.log(`         · ${d}`);
  }
  const fails = findings.filter(f => f.status === 'FAIL').length;
  console.log(`\n${fails === 0 ? '\x1b[32mAll passed\x1b[0m' : `\x1b[31m${fails} audit(s) failed\x1b[0m`}.\n`);
  process.exit(Math.min(254, fails));
}

main();
