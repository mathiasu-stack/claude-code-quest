function renderTest(chapterId) {
  const ch = CURRICULUM.find(c => c.id === chapterId);
  if (!ch) return;
  const test = ch.practicalTest;
  let progress = window.App.progress;
  const main = document.getElementById('main-content');
  const prevResult = progress.testResults[test.id];

  // Compliance verification code: tests carrying a `nonce` criterion get a
  // per-attempt code minted when the view opens. Persisted via the normal
  // save path so a reload mid-attempt keeps the same code.
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

  const fromPlay = !!window.App._currentParams?.fromPlay;
  main.innerHTML = `
    <div class="test-view">
      <button class="back-btn" id="back-to-chapter">← ${fromPlay ? 'Back to the office' : ch.title}</button>

      <div class="test-header">
        <div class="test-eyebrow">${ch.icon} ${ch.title} — Practical Assessment</div>
        <h1 class="test-title">Final Task</h1>
        ${prevResult ? `<div class="prev-result ${prevResult.passed ? 'pass' : 'fail'}">
          Previous attempt: ${prevResult.score}% — ${prevResult.passed ? 'Passed ✓' : 'Not yet passed'}
        </div>` : ''}
      </div>

      ${buildScenarioCard(test, nonce)}

      <div class="test-task-box">
        <div class="task-label">Your Task</div>
        <p class="task-description">${test.task}</p>
        <div class="task-hint">💡 ${test.hint}</div>
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
        >${prevResult ? '' : ''}</textarea>
        <div class="char-counter"><span id="char-count">0</span> characters (minimum ${test.minLength})</div>
      </div>

      <button class="btn-primary submit-btn" id="submit-test">Submit for Review →</button>

      <div id="test-feedback" class="test-feedback hidden"></div>
    </div>
  `;

  document.getElementById('back-to-chapter').addEventListener('click', () => {
    if (fromPlay) window.App.navigate('play');
    else window.App.navigate('chapter', { chapterId });
  });

  const textarea = document.getElementById('test-submission');
  const charCount = document.getElementById('char-count');
  textarea.addEventListener('input', () => {
    charCount.textContent = textarea.value.length;
  });

  document.getElementById('submit-test').addEventListener('click', () => {
    handleTestSubmit(ch, test);
  });
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
          Include this code in your real session: ask Claude to echo <code>${nonce}</code> in its reply, and paste the session output containing it below. Submissions without a live-session code won't clear compliance review.
        </div>` : ''}
      </div>
    </div>
  `;
}

function handleTestSubmit(ch, test) {
  const textarea = document.getElementById('test-submission');
  const submission = textarea.value;
  let progress = window.App.progress;
  const result = Evaluator.evaluate(submission, test.criteria, test.minLength, test.passThreshold, {
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

  if (result.passed && !wasAlreadyPassed) {
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

  renderFeedback(result, test, wasAlreadyPassed);
}

function renderFeedback(result, test, wasAlreadyPassed) {
  const feedbackEl = document.getElementById('test-feedback');
  feedbackEl.classList.remove('hidden');

  if (result.tooShort) {
    feedbackEl.innerHTML = `
      <div class="feedback-banner fail">
        <strong>Response too short.</strong> Minimum ${test.minLength} characters required. You submitted ${document.getElementById('test-submission').value.length} characters.
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

  if (result.passed) {
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

  const backToPlay = document.getElementById('back-to-play-from-test');
  if (backToPlay) {
    backToPlay.addEventListener('click', () => window.App.navigate('play'));
    // Auto-return on PASSED tests so the player isn't stuck on the feedback
    // page. Failed tests do NOT auto-return — they stay so the player can
    // read the feedback and retry.
    if (result.passed) {
      setTimeout(() => {
        if (window.App._currentView === 'test') window.App.navigate('play');
      }, 2600);
    }
  }
}

window.TestView = { renderTest };
