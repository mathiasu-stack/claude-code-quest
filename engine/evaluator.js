function checkCriterion(type, value, submission, context) {
  const lower = submission.toLowerCase();
  switch (type) {
    case 'keyword': {
      const keywords = Array.isArray(value) ? value : [value];
      return keywords.some(k => lower.includes(k.toLowerCase()));
    }
    case 'nonce': {
      // Compliance verification code: passes when the submission contains
      // the CURRENT per-test nonce (supplied by the caller via context),
      // case-insensitive. No stored nonce → cannot pass.
      const nonce = context?.nonce;
      return !!nonce && lower.includes(String(nonce).toLowerCase());
    }
    case 'regex': {
      try {
        return new RegExp(value, 'i').test(submission);
      } catch {
        return false;
      }
    }
    case 'length': {
      return submission.length >= Number(value);
    }
    case 'structure': {
      return checkStructure(value, submission);
    }
    case 'artifact': {
      // Capstone "Playbook" grading: the learner pastes a REAL Claude Code
      // artifact and we validate its SHAPE (frontmatter / parseable JSON /
      // invocation) — not keywords. Structural-only by design: it proves the
      // paste is a well-formed artifact of the right kind, not that a live
      // session produced it. value = { kind: 'skill'|'agent'|'command'|
      // 'claude-md'|'learnings'|'settings'|'hook'|'mcp'|'cron' }.
      return checkArtifact(value, submission);
    }
    default:
      return false;
  }
}

// Tolerant structural validation of a pasted Claude Code artifact. Verified
// against current Claude Code docs (v2.1.160+): SKILL.md/command need
// `---` frontmatter with a description; subagents need name+description;
// settings.json carries permissions(allow/ask/deny arrays) and/or a hooks
// object; .mcp.json has a top-level mcpServers object; headless = `claude -p`.
function _frontmatterBody(s) {
  const m = s.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/);
  return m ? { fm: m[1], body: (m[2] || '').trim() } : null;
}
function _fmHasKey(fm, key) {
  return new RegExp('^\\s*' + key + '\\s*:\\s*\\S', 'mi').test(fm);
}
function _parseJsonLoose(s) {
  try { return JSON.parse(s); } catch { return null; }
}
function checkArtifact(spec, submission) {
  const kind = (spec && spec.kind) || 'claude-md';
  const s = String(submission || '').trim();
  if (s.length < 15) return false;
  switch (kind) {
    case 'skill':
    case 'command': {
      const fb = _frontmatterBody(s);
      return !!fb && (_fmHasKey(fb.fm, 'description') || _fmHasKey(fb.fm, 'name')) && fb.body.length > 10;
    }
    case 'agent': {
      const fb = _frontmatterBody(s);
      return !!fb && _fmHasKey(fb.fm, 'name') && _fmHasKey(fb.fm, 'description') && fb.body.length > 10;
    }
    case 'settings': {
      const j = _parseJsonLoose(s);
      if (!j || typeof j !== 'object') return false;
      const permsOk = j.permissions && ['allow', 'ask', 'deny'].some(k => Array.isArray(j.permissions[k]));
      const hooksOk = j.hooks && typeof j.hooks === 'object' && Object.keys(j.hooks).length > 0;
      return !!(permsOk || hooksOk);
    }
    case 'hook': {
      const j = _parseJsonLoose(s);
      return !!(j && j.hooks && typeof j.hooks === 'object' && Object.keys(j.hooks).length > 0);
    }
    case 'mcp': {
      const j = _parseJsonLoose(s);
      return !!(j && j.mcpServers && typeof j.mcpServers === 'object' && Object.keys(j.mcpServers).length > 0);
    }
    case 'cron':
      // a `claude -p/--print` headless invocation OR a 5–6 field cron line.
      return /\bclaude\s+(-p|--print)\b/.test(s) || /(^|\n)\s*([0-9*/,\-]+\s+){4,5}\S/.test(s);
    case 'learnings':
      // a markdown doc with at least a header or a list, plus real content.
      return (/^#{1,6}\s/m.test(s) || /^\s*[-*]\s/m.test(s)) && s.length > 30;
    case 'claude-md':
    default:
      // CLAUDE.md piece: markdown structure (header / list / a key: convention
      // line) so it's a real doc fragment, not one loose sentence.
      return /^#{1,6}\s/m.test(s) || /^\s*[-*]\s/m.test(s) || /^\s*[\w .'-]+:\s*\S/m.test(s) || s.length > 60;
  }
}

function checkStructure(name, submission) {
  switch (name) {
    case 'numbered-steps':
      return /^\s*\d+[.)]/m.test(submission);
    case 'question-mark':
      return submission.includes('?');
    case 'code-block':
      return submission.includes('`') || submission.includes('```');
    default:
      return false;
  }
}

function evaluate(submission, criteria, minLength, passThreshold, context = {}) {
  const trimmed = submission.trim();

  if (trimmed.length < minLength) {
    return {
      passed: false,
      score: 0,
      tooShort: true,
      criteriaResults: criteria.map(c => ({
        description: c.description,
        improvement: c.improvement,
        passed: false,
        weight: c.weight,
      })),
    };
  }

  let totalWeight = 0;
  let earnedWeight = 0;

  const criteriaResults = criteria.map(c => {
    const passed = checkCriterion(c.type, c.value, trimmed, context);
    totalWeight += c.weight;
    if (passed) earnedWeight += c.weight;
    return { description: c.description, improvement: c.improvement, passed, weight: c.weight };
  });

  const score = totalWeight === 0 ? 100 : Math.round((earnedWeight / totalWeight) * 100);
  const passed = score >= passThreshold;

  return { passed, score, tooShort: false, criteriaResults };
}

// ── MCQ evaluation (theoretical test track) ─────────────────────────────
// Drawn-test inputs: caller passes the SAME `drawnQuestions` array that was
// used to render the form, plus `attempt` — a per-question array of the
// ORIGINAL option indexes the player selected (single-answer: length 1,
// multi: 0..n). Display-order shuffling happens in ui/test.js; this stays
// position-neutral so a question can be regraded later without re-shuffling.
//
// A question counts as "fully correct" only when the selected set EXACTLY
// matches correctIndexes (no extras, no misses). Partial credit is not
// awarded — the pool is short and the threshold (80%) already permits one
// miss out of six. Score = (questionsCorrect / questionsAsked) * 100, then
// passed = score >= (test.passThreshold ?? 80).
function evaluateMcq(attempt, theoreticalTest, drawnQuestions) {
  const questions = Array.isArray(drawnQuestions) ? drawnQuestions : [];
  const responses = Array.isArray(attempt) ? attempt : [];
  const threshold = Number(theoreticalTest?.passThreshold ?? 80);

  let correctCount = 0;
  const perQuestion = questions.map((q, i) => {
    const expected = Array.isArray(q.correctIndexes) ? q.correctIndexes.slice().sort((a, b) => a - b) : [];
    const raw = responses[i];
    const got = Array.isArray(raw) ? raw.slice().sort((a, b) => a - b) : [];
    const correct = expected.length === got.length && expected.every((v, k) => v === got[k]);
    if (correct) correctCount++;
    return {
      questionId: q.id,
      prompt: q.prompt,
      type: q.type,
      correct,
      selected: got,
      expected,
      explanation: q.explanation || '',
    };
  });

  const total = questions.length;
  const score = total === 0 ? 0 : Math.round((correctCount / total) * 100);
  const passed = total > 0 && score >= threshold;
  return { passed, score, correctCount, total, perQuestion };
}

window.Evaluator = { evaluate, evaluateMcq };
