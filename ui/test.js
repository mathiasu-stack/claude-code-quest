// ── Dual-track test view ─────────────────────────────────────────────────
// Each chapter exposes two evaluation paths:
//   • Practical  — the original hands-on scenario with a KDQ nonce that
//                  proves a live session ran.
//   • Theoretical — a 6-question MCQ drawn from a 10-12 question pool.
//                   Identical XP, no penalty for picking this track.
// Either passing path counts as "chapter passed" for unlock + badge logic
// (see Progress.isChapterTestPassed). The mode preference persists per
// chapter in localStorage so the player's choice sticks across reloads.

const TEST_MODE_KEY_PREFIX = 'ccq_test_mode_';
const TEST_MODE_PRACTICAL = 'practical';
const TEST_MODE_THEORETICAL = 'theoretical';

// ── Capstone "Your Own Playbook" ─────────────────────────────────────────────
// Each chapter's practical test also adds one REAL piece to the player's
// portable .claude/ Playbook. Threaded here (not by editing 16 curriculum
// blocks): a per-chapter framing banner + an `artifact` criterion appended at
// grade time, so passing means producing a well-formed Claude Code artifact.
// `kind` matches engine/evaluator.js checkArtifact; `file` is what to paste.
const CAPSTONE = {
  ch01: { kind: 'claude-md', piece: 'a starter CLAUDE.md', file: '`CLAUDE.md` (start it with a `# My Playbook` header)' },
  ch02: { kind: 'claude-md', piece: 'your "About my work" context', file: 'the `## About my work` section of your `CLAUDE.md`' },
  ch03: { kind: 'claude-md', piece: 'your conventions', file: 'your lean `CLAUDE.md` (headers + bullet conventions)' },
  ch04: { kind: 'claude-md', piece: 'your memory map', file: 'a `## Memory` section in `CLAUDE.md` mapping the layers' },
  ch05: { kind: 'command', piece: 'a reusable command', file: 'a `.claude/commands/<name>.md` (frontmatter with a `description:` + the prompt body)' },
  ch06: { kind: 'claude-md', piece: 'a safe-edit convention', file: 'a `## Editing` convention block in `CLAUDE.md`' },
  ch07: { kind: 'claude-md', piece: 'your lean context doc', file: 'your trimmed `CLAUDE.md`' },
  ch08: { kind: 'skill', piece: 'a SKILL', file: 'a `SKILL.md` (`---` frontmatter with a `description:` + a body)' },
  ch09: { kind: 'learnings', piece: 'your learnings loop', file: 'a `learnings.md` (a `##` header + a real bullet you learned)' },
  ch10: { kind: 'claude-md', piece: 'your model preferences', file: 'a `## Models` block in `CLAUDE.md` (which model for which task)' },
  ch11: { kind: 'command', piece: 'a custom slash command', file: 'a `.claude/commands/<name>.md` (frontmatter `description:` + body)' },
  ch12: { kind: 'claude-md', piece: 'a plan-first rule', file: 'a `## Plan first` convention in `CLAUDE.md`' },
  ch13: { kind: 'mcp', piece: 'an MCP connection', file: 'your `.mcp.json` (a `mcpServers` object with one server)' },
  ch14: { kind: 'agent', piece: 'a subagent', file: 'a `.claude/agents/<name>.md` (frontmatter `name:` + `description:` + a body)' },
  ch15: { kind: 'settings', piece: 'your guardrails', file: 'a `settings.json` block (a `permissions` allow/ask/deny and/or a `hooks` object)' },
  ch16: { kind: 'cron', piece: 'a scheduled job', file: 'a scheduled `claude -p "…"` command (or a cron line that runs it)' },
};
function capstoneCriteria(chapterId) {
  const c = CAPSTONE[chapterId];
  return c ? [{
    type: 'artifact', value: { kind: c.kind }, weight: 3,
    description: `Real artifact for your Playbook (${c.piece})`,
    improvement: `Include ${c.file} in your answer — paste the real file, not a description of it.`,
  }] : [];
}

function getStoredTestMode(chapterId) {
  try {
    const v = localStorage.getItem(TEST_MODE_KEY_PREFIX + chapterId);
    if (v === TEST_MODE_THEORETICAL || v === TEST_MODE_PRACTICAL) return v;
  } catch {}
  return TEST_MODE_PRACTICAL;
}

function setStoredTestMode(chapterId, mode) {
  try { localStorage.setItem(TEST_MODE_KEY_PREFIX + chapterId, mode); } catch {}
}

// Fisher-Yates over an integer index range — mirrors the just-landed KC
// shuffle pattern in ui/lesson.js so the visual feel matches across the
// app. Used for both pool-sampling and per-question option-order shuffles.
function _mcqShuffleIndexes(n) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Per-attempt MCQ state, keyed by chapter id. Holds the drawn questions and
// the displayed→original option-index mapping per question so the click
// handler can grade against ORIGINAL correctIndexes without re-shuffling.
const _mcqAttempts = new Map();

function buildMcqAttempt(theoreticalTest) {
  const pool = Array.isArray(theoreticalTest?.questionPool) ? theoreticalTest.questionPool : [];
  const drawCount = Math.min(Number(theoreticalTest?.drawCount || 6), pool.length);
  const order = _mcqShuffleIndexes(pool.length).slice(0, drawCount);
  const drawn = order.map(i => pool[i]);
  // Per-question display order — array of original option indexes in the
  // position they're rendered. options[origIdx] is what the player sees,
  // they click → handler reads dataset.origIdx (already the original idx),
  // grading compares directly against q.correctIndexes.
  const displayOrders = drawn.map(q => _mcqShuffleIndexes((q.options || []).length));
  return { drawn, displayOrders };
}

function renderTest(chapterId, targetEl = null) {
  const ch = CURRICULUM.find(c => c.id === chapterId);
  if (!ch) return;
  const test = ch.practicalTest;
  const theoreticalTest = ch.theoreticalTest || null;
  let progress = window.App.progress;
  // Allow the test to render into a custom container (e.g. the in-world
  // lesson/test overlay). Falls back to the dashboard's #main-content for
  // the legacy 2D route. Only one test renders at a time, so the inner
  // global IDs (test-submission / submit-test / etc.) still resolve.
  const main = targetEl || document.getElementById('main-content');
  const prevPracticalResult = progress.testResults[test.id];
  const prevTheoryResult = theoreticalTest ? progress.testResults[theoreticalTest.id] : null;

  // Compliance verification code: tests carrying a `nonce` criterion get a
  // per-attempt code minted when the view opens. Persisted via the normal
  // save path so a reload mid-attempt keeps the same code. Practical track
  // ONLY — the MCQ track has no notion of a live session.
  let nonce = null;
  if (test.criteria.some(c => c.type === 'nonce')) {
    const minted = Progress.ensureTestNonce(progress, test.id);
    if (minted.progress !== progress) {
      progress = minted.progress;
      Progress.save(progress);
      window.App.progress = progress;
    }
    nonce = minted.nonce;
  }

  // Resolve initial mode — stored preference, falling back to practical.
  // If the chapter has no theoretical test, force practical (defensive,
  // shouldn't happen once all 16 pools land).
  let mode = getStoredTestMode(chapterId);
  if (mode === TEST_MODE_THEORETICAL && !theoreticalTest) mode = TEST_MODE_PRACTICAL;

  const fromPlay = !!window.App._currentParams?.fromPlay;

  // Leaving the test: when the in-world overlay is open, CLOSE it (the play
  // scene is alive behind it) instead of navigating away. Otherwise fall
  // back to the dashboard route — to play if we came from play, else to the
  // chapter view.
  const exitToWorld = () => {
    if (window.LessonOverlay?.isOpen?.()) window.LessonOverlay.close();
    else if (fromPlay) window.App.navigate('play');
    else window.App.navigate('chapter', { chapterId });
  };

  function header(eyebrowSuffix, prevResult) {
    return `
      <div class="test-header">
        <div class="test-eyebrow">${ch.icon} ${ch.title} — ${eyebrowSuffix}</div>
        <h1 class="test-title">Final Task</h1>
        ${prevResult ? `<div class="prev-result ${prevResult.passed ? 'pass' : 'fail'}">
          Previous attempt: ${prevResult.score}% — ${prevResult.passed ? 'Passed ✓' : 'Not yet passed'}
        </div>` : ''}
      </div>
    `;
  }

  function toggle() {
    if (!theoreticalTest) return '';
    return `
      <div class="test-mode-toggle" role="tablist" aria-label="Test format">
        <button class="test-mode-btn ${mode === TEST_MODE_PRACTICAL ? 'active' : ''}" data-mode="${TEST_MODE_PRACTICAL}" role="tab" aria-selected="${mode === TEST_MODE_PRACTICAL}">
          🛠 Practical <span class="test-mode-sub">(hands-on)</span>
        </button>
        <button class="test-mode-btn ${mode === TEST_MODE_THEORETICAL ? 'active' : ''}" data-mode="${TEST_MODE_THEORETICAL}" role="tab" aria-selected="${mode === TEST_MODE_THEORETICAL}">
          📝 Theoretical <span class="test-mode-sub">(MCQ)</span>
        </button>
      </div>
      <p class="test-mode-help">Either path awards the full ${test.xpReward} PP. Pick whichever fits how you want to prove the chapter — the chapter unlocks either way.</p>
    `;
  }

  function renderShell(innerHtml, eyebrowSuffix, prevResult) {
    main.innerHTML = `
      <div class="test-view">
        <button class="back-btn" id="back-to-chapter">← ${fromPlay ? 'Back to the office' : ch.title}</button>
        ${header(eyebrowSuffix, prevResult)}
        ${toggle()}
        ${innerHtml}
        <div id="test-feedback" class="test-feedback hidden"></div>
      </div>
    `;

    document.getElementById('back-to-chapter').addEventListener('click', exitToWorld);

    document.querySelectorAll('.test-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const newMode = btn.dataset.mode;
        if (newMode === mode) return;
        mode = newMode;
        setStoredTestMode(chapterId, mode);
        // Drop any held MCQ attempt when leaving theoretical so we re-draw
        // on the next visit; practical state is server-side (textarea only).
        _mcqAttempts.delete(chapterId);
        if (mode === TEST_MODE_PRACTICAL) renderPractical();
        else                              renderTheoretical();
      });
    });
  }

  function renderPractical() {
    const innerHtml = `
      ${buildScenarioCard(test, nonce)}

      <div class="test-task-box">
        <div class="task-label">Your Task</div>
        <p class="task-description">${test.task}</p>
        <div class="task-hint">💡 ${test.hint}</div>
        ${CAPSTONE[ch.id] ? `<div class="task-capstone">📦 <strong>Your Playbook</strong> — this adds ${CAPSTONE[ch.id].piece}. Include ${CAPSTONE[ch.id].file} in your answer (paste the real file, not a description).</div>` : ''}
      </div>

      <div class="test-input-area">
        <label class="input-label" for="test-submission">Your Response</label>
        <div class="test-paste-tip">
          📋 <strong>Pasting from your terminal?</strong> Highlight the text, copy with <kbd>Ctrl</kbd>+<kbd>C</kbd> (<kbd>⌘</kbd>+<kbd>C</kbd> on Mac), then paste below. When the task asks for multiple parts (e.g. a prompt AND Claude's reply), use markdown section markers like <code>## Setup</code> and <code>## First session</code> so it's clear which block is which.
        </div>
        <textarea
          id="test-submission"
          class="test-textarea"
          placeholder="Type your response here..."
          rows="10"
        ></textarea>
        <div class="char-counter"><span id="char-count">0</span> characters</div>
      </div>

      <button class="btn-primary submit-btn" id="submit-test">Submit for Review →</button>
    `;
    renderShell(innerHtml, 'Practical Assessment', prevPracticalResult);

    const textarea = document.getElementById('test-submission');
    const charCount = document.getElementById('char-count');
    textarea.addEventListener('input', () => {
      charCount.textContent = textarea.value.length;
    });

    document.getElementById('submit-test').addEventListener('click', () => {
      handleTestSubmit(ch, test);
    });
  }

  function renderTheoretical() {
    if (!theoreticalTest) { renderPractical(); return; }

    // Fresh draw per render (each toggle to theoretical starts a new
    // attempt). The drawn set persists for THIS render only — clicks on
    // option buttons mutate the local selection state below.
    let attempt = _mcqAttempts.get(chapterId);
    if (!attempt) {
      attempt = buildMcqAttempt(theoreticalTest);
      // Per-question selected ORIGINAL option indexes. single → length 0/1,
      // multi → length 0..n.
      attempt.selections = attempt.drawn.map(() => []);
      _mcqAttempts.set(chapterId, attempt);
    }

    const { drawn, displayOrders, selections } = attempt;
    const drawCount = drawn.length;
    const threshold = theoreticalTest.passThreshold || 80;

    const questionsHtml = drawn.map((q, qi) => {
      const order = displayOrders[qi];
      const isMulti = q.type === 'multi';
      const inputType = isMulti ? 'checkbox' : 'radio';
      const optionsHtml = order.map((origIdx, displayIdx) => {
        const opt = q.options[origIdx];
        const letter = String.fromCharCode(65 + displayIdx);
        return `
          <label class="mcq-option" data-qi="${qi}" data-orig="${origIdx}">
            <input type="${inputType}" name="mcq-q${qi}" data-qi="${qi}" data-orig="${origIdx}" />
            <span class="mcq-option-letter">${letter}</span>
            <span class="mcq-option-text">${opt}</span>
          </label>
        `;
      }).join('');
      return `
        <div class="mcq-question" data-qi="${qi}">
          <div class="mcq-question-header">
            <span class="mcq-question-num">Question ${qi + 1} of ${drawCount}</span>
            ${isMulti ? '<span class="mcq-multi-badge">Select all that apply</span>' : ''}
          </div>
          <div class="mcq-question-prompt">${q.prompt}</div>
          <div class="mcq-options">${optionsHtml}</div>
        </div>
      `;
    }).join('');

    const innerHtml = `
      <div class="mcq-intro">
        <p><strong>Theoretical Assessment.</strong> ${drawCount} questions drawn at random from a chapter pool. You need ${threshold}% (${Math.ceil((threshold / 100) * drawCount)} of ${drawCount} fully correct) to pass. Mixed single-answer and select-all-that-apply. No nonce required — this track tests recall, not session evidence.</p>
      </div>
      ${questionsHtml}
      <button class="btn-primary submit-btn" id="submit-mcq">Submit Answers →</button>
    `;
    renderShell(innerHtml, 'Theoretical Assessment', prevTheoryResult);

    // Wire option clicks. The whole row is clickable; the inner input is
    // the source of truth (and gets toggled by the label's native behavior).
    document.querySelectorAll('.mcq-option input').forEach(input => {
      input.addEventListener('change', () => {
        const qi = Number(input.dataset.qi);
        const orig = Number(input.dataset.orig);
        const q = drawn[qi];
        if (q.type === 'multi') {
          if (input.checked) {
            if (!selections[qi].includes(orig)) selections[qi] = [...selections[qi], orig];
          } else {
            selections[qi] = selections[qi].filter(x => x !== orig);
          }
        } else {
          // single — replace
          selections[qi] = input.checked ? [orig] : [];
        }
      });
    });

    document.getElementById('submit-mcq').addEventListener('click', () => {
      handleMcqSubmit(ch, theoreticalTest, attempt);
    });
  }

  if (mode === TEST_MODE_THEORETICAL && theoreticalTest) renderTheoretical();
  else                                                   renderPractical();
}

function buildScenarioCard(test, nonce = null) {
  const typeConfig = {
    slack: { label: 'Slack', icon: '💬', style: 'scenario-slack' },
    jira: { label: 'Jira Ticket', icon: '🎫', style: 'scenario-jira' },
    email: { label: 'Email', icon: '✉️', style: 'scenario-email' },
  };
  const cfg = typeConfig[test.scenarioType] || typeConfig.slack;

  return `
    <div class="scenario-card ${cfg.style}">
      <div class="scenario-header">
        <span class="scenario-type-badge">${cfg.icon} ${cfg.label}</span>
      </div>
      <div class="scenario-body">
        <div class="scenario-sender">
          <span class="sender-avatar">${test.scenarioAvatar}</span>
          <div>
            <span class="sender-name">${test.scenarioFrom}</span>
            <span class="sender-role">${test.scenarioRole}</span>
          </div>
        </div>
        <div class="scenario-text">${test.scenario.replace(/\n/g, '<br>')}</div>
        ${nonce ? `
        <div class="scenario-nonce" style="margin-top:12px;padding:10px 12px;border:1px dashed currentColor;border-radius:6px;font-size:0.92em;">
          🛡️ <strong>Kedash InfoSec — Compliance verification code: <code>${nonce}</code></strong><br>
          Include this code in your real session: ask Claude to echo <code>${nonce}</code> in its reply, and paste the session output containing it below. Submissions without a live-session code won't clear compliance review.${(test.id === 'ch01-test' && window.Story?.getFlag?.('lobby_badge_printed')) ? ' <span style="opacity:0.75;font-style:italic;">(also printed at the lobby badge printer.)</span>' : ''}
        </div>` : ''}
      </div>
    </div>
  `;
}

function handleTestSubmit(ch, test) {
  const textarea = document.getElementById('test-submission');
  const submission = textarea.value;
  let progress = window.App.progress;
  // Capstone: append the chapter's artifact criterion so passing requires a
  // real Playbook piece (threaded here, not in the 16 curriculum blocks).
  const gradedCriteria = test.criteria.concat(capstoneCriteria(ch.id));
  const result = Evaluator.evaluate(submission, gradedCriteria, test.minLength, test.passThreshold, {
    nonce: Progress.getTestNonce(progress, test.id),
  });

  const levelBefore = window.Scoring ? Scoring.getLevel(progress.totalXP).label : null;
  const wasAlreadyPassed = Progress.isTestPassed(progress, test.id);
  const attemptsBefore = progress.testResults[test.id]?.attempts || 0;
  progress = Progress.recordTestResult(progress, test.id, result, test.xpReward);

  if (result.passed) {
    // Rotate the compliance code: a passed submission can't be replayed.
    progress = Progress.clearTestNonce(progress, test.id);
  }

  progress = applyChapterPassSideEffects(progress, ch, result, wasAlreadyPassed);

  const streakBefore = progress.currentStreak || 0;
  progress = Progress.recordActivity(progress);
  const streakAfter = progress.currentStreak || 0;

  if (window.Achievements) {
    progress = Achievements.checkAfterTest(progress, ch, test, result, attemptsBefore, wasAlreadyPassed);
    progress = Achievements.checkAfterActivity(progress, streakBefore, streakAfter);
  }

  Progress.save(progress);
  window.App.progress = progress;
  window.App.refreshSidebar();

  renderFeedback(result, test, wasAlreadyPassed, ch, levelBefore);
}

// MCQ submit mirrors handleTestSubmit closely, but reads selections from
// the in-memory attempt and grades via Evaluator.evaluateMcq.
function handleMcqSubmit(ch, theoreticalTest, attempt) {
  let progress = window.App.progress;
  const selections = attempt.selections || attempt.drawn.map(() => []);
  const result = Evaluator.evaluateMcq(selections, theoreticalTest, attempt.drawn);

  const levelBefore = window.Scoring ? Scoring.getLevel(progress.totalXP).label : null;
  const wasAlreadyPassed = Progress.isTestPassed(progress, theoreticalTest.id);
  const attemptsBefore = progress.testResults[theoreticalTest.id]?.attempts || 0;
  progress = Progress.recordTestResult(progress, theoreticalTest.id, result, theoreticalTest.xpReward);

  progress = applyChapterPassSideEffects(progress, ch, result, wasAlreadyPassed);

  const streakBefore = progress.currentStreak || 0;
  progress = Progress.recordActivity(progress);
  const streakAfter = progress.currentStreak || 0;

  if (window.Achievements) {
    // Re-use the same achievement hook — it doesn't care which track passed.
    progress = Achievements.checkAfterTest(progress, ch, theoreticalTest, result, attemptsBefore, wasAlreadyPassed);
    progress = Achievements.checkAfterActivity(progress, streakBefore, streakAfter);
  }

  Progress.save(progress);
  window.App.progress = progress;
  window.App.refreshSidebar();

  renderMcqFeedback(result, theoreticalTest, attempt, wasAlreadyPassed, ch, levelBefore);
}

// Shared side-effects after a passing test on either track — chapter unlock,
// chapter-bonus XP, badge floor recompute, promotion ceremony flag.
function applyChapterPassSideEffects(progress, ch, result, wasAlreadyPassed) {
  if (!result.passed) return progress;
  // Was the CHAPTER already cleared (via the OTHER track)? If so, no
  // unlock/bonus side-effects fire — same idempotency the practical path had.
  const chapterAlreadyDone = Progress.isChapterTestPassed(progress, ch) && (
    // Either-side passed BEFORE this attempt counts as already done. We
    // can't introspect pre-attempt state here, so we recompute from
    // testResults: if any OTHER track was already passed, the chapter
    // bonus was already awarded.
    (ch.theoreticalTest?.id && Progress.isTestPassed(progress, ch.theoreticalTest.id) && Progress.isTestPassed(progress, ch.practicalTest.id) && wasAlreadyPassed) ||
    (Progress.isTestPassed(progress, ch.practicalTest.id) && wasAlreadyPassed)
  );
  // Simpler rule: the chapter bonus is keyed by `${ch.id}_chapter_bonus`,
  // and recordTestResult is idempotent on XP (no double-credit). So we can
  // just call it unconditionally on first pass.
  if (!wasAlreadyPassed) {
    const chIdx = CURRICULUM.findIndex(c => c.id === ch.id);
    const nextCh = CURRICULUM[chIdx + 1];
    if (nextCh) {
      progress = Progress.unlockChapter(progress, nextCh.id);
    }
    progress = Progress.recordTestResult(progress, ch.id + '_chapter_bonus', { passed: true, score: 100 }, ch.xpReward);
    // Recompute badge floor — if this test was the last chapter of its
    // floor, the player gains elevator access to the next floor.
    progress = Progress.applyBadgeBumpsIfDue(progress);
  }
  return progress;
}

function renderFeedback(result, test, wasAlreadyPassed, ch, levelBefore) {
  const feedbackEl = document.getElementById('test-feedback');
  feedbackEl.classList.remove('hidden');

  // tooShort branch retained as a safety net for any legacy test entry
  // that still carries a non-zero minLength — current curriculum has
  // them all zeroed (the criteria + nonce do the integrity work now).
  if (result.tooShort) {
    feedbackEl.innerHTML = `
      <div class="feedback-banner fail">
        <strong>Response too short.</strong> You submitted ${document.getElementById('test-submission').value.length} characters.
      </div>
    `;
    feedbackEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  const passClass = result.passed ? 'pass' : 'fail';
  const passText = result.passed ? '✓ Assessment Passed!' : '✗ Not Yet Passing';
  const xpText = result.passed && !wasAlreadyPassed ? `+${test.xpReward} PP awarded!` : (wasAlreadyPassed ? 'Already passed — no additional PP' : 'No PP awarded this attempt');

  const nextHint = result.passed ? window.PlayHints?.getNextHintForTest?.(test.id) : null;
  // Stash for the play view to pop a Day-1-style modal when we return.
  if (nextHint) {
    try { sessionStorage.setItem('ccq_next_stop', JSON.stringify({ hint: nextHint, type: 'test' })); } catch {}
  }

  feedbackEl.innerHTML = `
    <div class="feedback-banner ${passClass}">
      <div class="feedback-title">${passText}</div>
      <div class="feedback-score">Score: ${result.score}% (pass threshold: ${test.passThreshold}%)</div>
      <div class="feedback-xp">${xpText}</div>
    </div>
    ${nextHint ? `<div class="next-hint-banner">📍 <strong>Next stop:</strong> ${nextHint}</div>` : ''}

    <div class="score-bar-container">
      <div class="score-bar">
        <div class="score-fill ${passClass}" style="width:${result.score}%"></div>
        <div class="score-threshold" style="left:${test.passThreshold}%"></div>
      </div>
      <div class="score-bar-labels">
        <span>0%</span>
        <span style="margin-left:${test.passThreshold - 3}%">${test.passThreshold}% needed</span>
        <span>100%</span>
      </div>
    </div>

    <div class="criteria-feedback">
      <h3>Evaluation Breakdown</h3>
      ${result.criteriaResults.map(c => `
        <div class="criterion-row ${c.passed ? 'pass' : 'fail'}">
          <span class="criterion-icon">${c.passed ? '✓' : '✗'}</span>
          <div class="criterion-body">
            <div class="criterion-desc">${c.description}</div>
            ${!c.passed && c.improvement ? `<div class="criterion-improvement">→ ${c.improvement}</div>` : ''}
          </div>
          <span class="criterion-weight">${c.weight} pt${c.weight !== 1 ? 's' : ''}</span>
        </div>
      `).join('')}
    </div>

    ${!result.passed && test.exemplar ? `
      <details class="exemplar-reveal">
        <summary>💡 Show what a strong answer includes</summary>
        <div class="exemplar-body">${test.exemplar}</div>
      </details>
    ` : ''}

    ${result.passed && !wasAlreadyPassed ? '<div class="unlock-notice">🎉 Next chapter unlocked!</div>' : ''}

    <button class="btn-primary continue-cta" id="back-to-play-from-test" style="margin-top:16px">🎮 ${window.App._currentParams?.fromPlay ? 'Return to the office' : 'Back to the 3D world'}</button>
  `;

  feedbackEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

  applyPassSideEffectsUi(result.passed, wasAlreadyPassed, test, ch, levelBefore);
  bindBackToPlay(result.passed);
}

// MCQ feedback: per-question correct/incorrect + chosen/expected + lesson
// explanation, then the same pass banner + level-up audio + ceremony path
// as the practical track. No criteria breakdown, no exemplar — those don't
// apply to MCQ; the per-question explanations carry the teaching weight.
function renderMcqFeedback(result, theoreticalTest, attempt, wasAlreadyPassed, ch, levelBefore) {
  const feedbackEl = document.getElementById('test-feedback');
  feedbackEl.classList.remove('hidden');

  const passClass = result.passed ? 'pass' : 'fail';
  const passText = result.passed ? '✓ Assessment Passed!' : '✗ Not Yet Passing';
  const xpText = result.passed && !wasAlreadyPassed ? `+${theoreticalTest.xpReward} PP awarded!` : (wasAlreadyPassed ? 'Already passed — no additional PP' : 'No PP awarded this attempt');

  const nextHint = result.passed ? window.PlayHints?.getNextHintForTest?.(theoreticalTest.id) || window.PlayHints?.getNextHintForTest?.(ch.practicalTest.id) : null;
  if (nextHint) {
    try { sessionStorage.setItem('ccq_next_stop', JSON.stringify({ hint: nextHint, type: 'test' })); } catch {}
  }

  const perQuestionHtml = result.perQuestion.map((pq, qi) => {
    const q = attempt.drawn[qi];
    const order = attempt.displayOrders[qi];
    const letterFor = (origIdx) => {
      const di = order.indexOf(origIdx);
      return di >= 0 ? String.fromCharCode(65 + di) : '?';
    };
    const chosenStr = pq.selected.length
      ? pq.selected.map(letterFor).join(', ')
      : '(no answer)';
    const expectedStr = pq.expected.map(letterFor).join(', ');
    return `
      <div class="mcq-result ${pq.correct ? 'correct' : 'wrong'}">
        <div class="mcq-result-header">
          <span class="mcq-result-icon">${pq.correct ? '✓' : '✗'}</span>
          <span class="mcq-result-num">Question ${qi + 1}</span>
          <span class="mcq-result-tag">${pq.correct ? 'Correct' : 'Incorrect'}</span>
        </div>
        <div class="mcq-result-prompt">${q.prompt}</div>
        <div class="mcq-result-row"><strong>Your answer:</strong> ${chosenStr}</div>
        ${!pq.correct ? `<div class="mcq-result-row"><strong>Correct:</strong> ${expectedStr}</div>` : ''}
        ${pq.explanation ? `<div class="mcq-explanation">💡 ${pq.explanation}</div>` : ''}
      </div>
    `;
  }).join('');

  feedbackEl.innerHTML = `
    <div class="feedback-banner ${passClass}">
      <div class="feedback-title">${passText}</div>
      <div class="feedback-score">Score: ${result.score}% — ${result.correctCount}/${result.total} correct (pass threshold: ${theoreticalTest.passThreshold}%)</div>
      <div class="feedback-xp">${xpText}</div>
    </div>
    ${nextHint ? `<div class="next-hint-banner">📍 <strong>Next stop:</strong> ${nextHint}</div>` : ''}

    <div class="score-bar-container">
      <div class="score-bar">
        <div class="score-fill ${passClass}" style="width:${result.score}%"></div>
        <div class="score-threshold" style="left:${theoreticalTest.passThreshold}%"></div>
      </div>
      <div class="score-bar-labels">
        <span>0%</span>
        <span style="margin-left:${theoreticalTest.passThreshold - 3}%">${theoreticalTest.passThreshold}% needed</span>
        <span>100%</span>
      </div>
    </div>

    <div class="mcq-results-list">
      <h3>Question-by-Question Breakdown</h3>
      ${perQuestionHtml}
    </div>

    ${!result.passed ? '<div class="mcq-retry-note">A new set of 6 questions will be drawn on your next attempt — switch back to this view to retry.</div>' : ''}

    ${result.passed && !wasAlreadyPassed ? '<div class="unlock-notice">🎉 Next chapter unlocked!</div>' : ''}

    <button class="btn-primary continue-cta" id="back-to-play-from-test" style="margin-top:16px">🎮 ${window.App._currentParams?.fromPlay ? 'Return to the office' : 'Back to the 3D world'}</button>
  `;

  feedbackEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

  applyPassSideEffectsUi(result.passed, wasAlreadyPassed, theoreticalTest, ch, levelBefore);
  bindBackToPlay(result.passed);

  // After a passing MCQ submission, drop the attempt so the next visit re-draws.
  if (result.passed) _mcqAttempts.delete(ch.id);
}

// Audio + ceremony flag + xp toast — shared between practical and MCQ pass
// paths so passing either track triggers the SAME promotion flow.
function applyPassSideEffectsUi(passed, wasAlreadyPassed, test, ch, levelBefore) {
  if (passed) {
    Lesson.showXpToast(wasAlreadyPassed ? 0 : test.xpReward);
    if (!wasAlreadyPassed) {
      try {
        sessionStorage.setItem('ccq_dance_for', test.id);
        // Promotion flag — read once on entry to play, kicks off the
        // full ceremony. ch.id is the chapter ID like 'ch01'.
        sessionStorage.setItem('ccq_promotion_for', ch.id);
      } catch {}
      // Fanfare + PP ping; level-up fanfare overrides if level changed.
      try {
        const levelAfter = window.Scoring ? Scoring.getLevel(window.App.progress.totalXP).label : null;
        if (levelAfter && levelBefore && levelAfter !== levelBefore) {
          window.PlayAudio?.levelUp?.();
        } else {
          window.PlayAudio?.ppPing?.();
        }
      } catch {}
    }
  } else {
    try { window.PlayAudio?.kcIncorrect?.(); } catch {}
  }
}

function bindBackToPlay(passed) {
  // When the in-world overlay is open, "return to the office" closes the
  // overlay (the play scene is alive behind it); otherwise navigate to play.
  const exitToWorld = () => {
    if (window.LessonOverlay?.isOpen?.()) window.LessonOverlay.close();
    else window.App.navigate('play');
  };
  const backToPlay = document.getElementById('back-to-play-from-test');
  if (backToPlay) {
    backToPlay.addEventListener('click', exitToWorld);
    // Auto-return on PASSED tests so the player isn't stuck on the feedback
    // page. Failed tests do NOT auto-return — they stay so the player can
    // read the feedback and retry.
    if (passed) {
      setTimeout(() => {
        if (window.LessonOverlay?.isOpen?.()) window.LessonOverlay.close();
        else if (window.App._currentView === 'test') window.App.navigate('play');
      }, 2600);
    }
  }
}

window.TestView = { renderTest };
