function checkCriterion(type, value, submission) {
  const lower = submission.toLowerCase();
  switch (type) {
    case 'keyword': {
      const keywords = Array.isArray(value) ? value : [value];
      return keywords.some(k => lower.includes(k.toLowerCase()));
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

function evaluate(submission, criteria, minLength, passThreshold) {
  const trimmed = submission.trim();

  if (trimmed.length < minLength) {
    return {
      passed: false,
      score: 0,
      tooShort: true,
      criteriaResults: criteria.map(c => ({
        description: c.description,
        passed: false,
        weight: c.weight,
      })),
    };
  }

  let totalWeight = 0;
  let earnedWeight = 0;

  const criteriaResults = criteria.map(c => {
    const passed = checkCriterion(c.type, c.value, trimmed);
    totalWeight += c.weight;
    if (passed) earnedWeight += c.weight;
    return { description: c.description, passed, weight: c.weight };
  });

  const score = totalWeight === 0 ? 100 : Math.round((earnedWeight / totalWeight) * 100);
  const passed = score >= passThreshold;

  return { passed, score, tooShort: false, criteriaResults };
}

window.Evaluator = { evaluate };
