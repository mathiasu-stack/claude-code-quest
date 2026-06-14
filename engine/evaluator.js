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
    default:
      return false;
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
