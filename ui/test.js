function renderTest(chapterId) {
  const ch = CURRICULUM.find(c => c.id === chapterId);
  if (!ch) return;
  const test = ch.practicalTest;
  const progress = window.App.progress;
  const main = document.getElementById('main-content');
  const prevResult = progress.testResults[test.id];

  main.innerHTML = `
    <div class="test-view">
      <button class="back-btn" id="back-to-chapter">← ${ch.title}</button>

      <div class="test-header">
        <div class="test-eyebrow">${ch.icon} ${ch.title} — Practical Assessment</div>
        <h1 class="test-title">Final Task</h1>
        ${prevResult ? `<div class="prev-result ${prevResult.passed ? 'pass' : 'fail'}">
          Previous attempt: ${prevResult.score}% — ${prevResult.passed ? 'Passed ✓' : 'Not yet passed'}
        </div>` : ''}
      </div>

      ${buildScenarioCard(test)}

      <div class="test-task-box">
        <div class="task-label">Your Task</div>
        <p class="task-description">${test.task}</p>
        <div class="task-hint">💡 ${test.hint}</div>
      </div>

      <div class="test-input-area">
        <label class="input-label" for="test-submission">Your Response</label>
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
    window.App.navigate('chapter', { chapterId });
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

function buildScenarioCard(test) {
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
      </div>
    </div>
  `;
}

function handleTestSubmit(ch, test) {
  const textarea = document.getElementById('test-submission');
  const submission = textarea.value;
  const result = Evaluator.evaluate(submission, test.criteria, test.minLength, test.passThreshold);

  let progress = window.App.progress;
  const wasAlreadyPassed = Progress.isTestPassed(progress, test.id);
  progress = Progress.recordTestResult(progress, test.id, result, test.xpReward);

  if (result.passed && !wasAlreadyPassed) {
    const chIdx = CURRICULUM.findIndex(c => c.id === ch.id);
    const nextCh = CURRICULUM[chIdx + 1];
    if (nextCh) {
      progress = Progress.unlockChapter(progress, nextCh.id);
    }
    progress = Progress.recordTestResult(progress, ch.id + '_chapter_bonus', { passed: true, score: 100 }, ch.xpReward);
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

  feedbackEl.innerHTML = `
    <div class="feedback-banner ${passClass}">
      <div class="feedback-title">${passText}</div>
      <div class="feedback-score">Score: ${result.score}% (pass threshold: ${test.passThreshold}%)</div>
      <div class="feedback-xp">${xpText}</div>
    </div>

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
          <span class="criterion-desc">${c.description}</span>
          <span class="criterion-weight">${c.weight} pt${c.weight !== 1 ? 's' : ''}</span>
        </div>
      `).join('')}
    </div>

    ${result.passed && !wasAlreadyPassed ? '<div class="unlock-notice">🎉 Next chapter unlocked!</div>' : ''}
  `;

  feedbackEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (result.passed) {
    Lesson.showXpToast(wasAlreadyPassed ? 0 : test.xpReward);
  }
}

window.TestView = { renderTest };
