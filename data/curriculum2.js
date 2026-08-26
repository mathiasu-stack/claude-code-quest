// Chapters 10–16 — appended after curriculum.js loads
window.CURRICULUM.push(

  // ── Chapter 10 ─────────────────────────────────────────────────────────────
  {
    id: 'ch08',
    title: 'Skills: Foundations',
    subtitle: 'Week 10 — Reusable Workflows',
    icon: '⚡',
    xpReward: 380,
    lessons: [
      {
        id: 'ch08-l01', title: 'What Are Skills?', xpReward: 95, videos: ['<iframe src="https://www.youtube.com/embed/09dggS8KwBc" title="Self-Improving Claude Code: Hooks, Skills, and Session Automation" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'],
        lastVerified: '2026-06-15',
        verifiedAgainstVersion: 'v2.1.176',
        content: `<h2>Reusable Prompt Templates</h2>
<p>Skills (custom slash commands) are reusable, parameterised prompt templates stored in <code>.claude/skills/</code>. They let you package complex workflows into a single command invocable from any session.</p>
<h3>Without skills</h3>
<p>Every time you want a PR description, a security review, or a changelog entry, you write the same multi-paragraph prompt from memory. Results vary based on how well you remember the prompt. Context is wasted typing it out.</p>
<h3>With skills</h3>
<p>You run <code>/pr-description</code> or <code>/security-review</code> and get consistent, high-quality output every time — without burning context on the prompt instructions themselves.</p>
<h3>Built-in commands vs bundled skills</h3>
<p>Some slash commands are <strong>built-in</strong> (coded behaviour, not prompt templates): <code>/init</code>, <code>/review</code>, <code>/security-review</code>, <code>/clear</code>, <code>/compact</code>, <code>/plan</code>. Others are <strong>bundled skills</strong> (prompt-based, same progressive disclosure rules): <code>/simplify</code>, <code>/batch</code>, <code>/debug</code>. Your custom skills work exactly like bundled skills — the difference is location.</p>
<h3>Update: commands and skills have converged</h3>
<p>Custom commands and skills are now the same concept — a file at <code>.claude/commands/deploy.md</code> and a skill at <code>.claude/skills/deploy/SKILL.md</code> both create <code>/deploy</code> and work the same way. Existing <code>.claude/commands/</code> files keep working; skills simply add optional features (a directory for supporting files, frontmatter for invocation control, and automatic loading when relevant).</p>`,
      },
      {
        id: 'ch08-l02', title: 'Progressive Disclosure: Why Skills Beat Static Config', xpReward: 95, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: `<h2>Only Pay for What You Use</h2>
<p>This is the most important and least-understood aspect of how skills work: <strong>only the skill's name and description live in context at all times</strong>. The full skill instructions are only loaded when the skill is actually invoked.</p>
<h3>The progressive disclosure principle</h3>
<p>When Claude Code starts a session, it loads a short index of available skills — just their names and one-line descriptions. This might cost 50 tokens for a library of 10 skills. When you invoke a specific skill with <code>/security-review</code>, only then is the full skill template (potentially 500 tokens) loaded into context.</p>
<h3>Why this beats a large CLAUDE.md</h3>
<p>Compare two approaches:</p>
<ul>
  <li><strong>CLAUDE.md approach</strong>: All workflow instructions in one file, loaded every session. A 10-skill CLAUDE.md might cost 3,000 tokens on every session regardless of which skills you need.</li>
  <li><strong>Skills approach</strong>: ~50-token index always loaded; full skill costs only when invoked. A 10-task session that uses 2 skills costs ~1,100 tokens total for the skill layer.</li>
</ul>
<h3>The practical rule</h3>
<p>If an instruction is "always active", it belongs in CLAUDE.md. If it's "sometimes needed", it belongs in a skill. This distinction alone can halve your average session context cost.</p>`,
      },
      {
        id: 'ch08-l03', title: 'Writing Your First Skill', xpReward: 95, videos: [],
        lastVerified: '2026-06-24',
        verifiedAgainstVersion: 'v2.1.176',
        content: `<h2>A Skill is Just a Markdown File</h2>
<p>Creating a skill: make a directory inside <code>.claude/skills/</code> named after the skill, and put a <code>SKILL.md</code> file inside it — a <code>---</code> frontmatter block (<code>name</code> + <code>description</code>) followed by the prompt template.</p>
<h3>Example: changelog skill</h3>
<p>File: <code>.claude/skills/changelog/SKILL.md</code></p>
<pre><code>---
name: changelog
description: Generate a Keep a Changelog entry for a version from the git log since the last tag.
---

Generate a changelog entry for version $ARGUMENTS.

Review the git log since the last tag and summarise:
1. New features (## Added)
2. Bug fixes (## Fixed)
3. Breaking changes (## Breaking) — flag prominently
4. Internal changes (## Changed)

Format as Keep a Changelog. Be concise — one line per item.</code></pre>
<p>Usage: <code>/changelog v2.5.0</code></p>
<h3>Best practices</h3>
<ul>
  <li>Start with a <code>---</code> frontmatter block — only the <code>name</code> and <code>description</code> load into context until the skill actually triggers (that's the progressive disclosure from the last lesson)</li>
  <li>Use <code>$ARGUMENTS</code> for dynamic input</li>
  <li>Be explicit about output format</li>
  <li>Include quality criteria ("flag breaking changes", "be concise")</li>
  <li>Skills in <code>.claude/skills/</code> are shared with the team via git</li>
  <li>Personal skills go in <code>~/.claude/skills/</code></li>
  <li>The legacy <code>.claude/commands/</code> path still works but is no longer canonical</li>
</ul>`,
      },
      {
        id: 'ch08-l04', title: 'Hook-based Skills', xpReward: 95, videos: ['<iframe src="https://www.youtube.com/embed/Q4gsvJvRjCU" title="How Claude Code Hooks Save Me HOURS Daily" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: `<h2>Skills That Trigger Automatically</h2>
<p>Some skills don't need manual invocation — they run automatically at specific lifecycle events. These are configured in <code>~/.claude/settings.json</code> (user-level) or <code>.claude/settings.json</code> (project-level) using hooks.</p>
<h3>Hook events (selected)</h3>
<ul>
  <li><strong>PreToolUse</strong> — runs before Claude Code uses any tool (can block)</li>
  <li><strong>PostToolUse</strong> — runs after a tool completes</li>
  <li><strong>Stop</strong> — runs when Claude Code finishes responding</li>
  <li><strong>SessionStart / SessionEnd</strong> — session lifecycle</li>
  <li><strong>UserPromptSubmit</strong> — before each user message is processed</li>
  <li><strong>PreCompact / PostCompact</strong> — around /compact operations</li>
  <li><strong>SubagentStart / SubagentStop</strong> — for multi-agent workflows</li>
</ul>
<p>There are more than 30 hook events in total, and the set grows with each release — see the official docs for the current complete list.</p>
<h3>Example: auto-lint on stop</h3>
<pre><code>{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "npm run lint" }]
      }
    ]
  }
}</code></pre>
<p>Every time Claude Code finishes a response, the linter runs automatically. The <code>matcher</code> field filters by tool name (empty string = match all).</p>
<h3>When hooks shine</h3>
<p>Hooks are best for guardrails — things that should always happen regardless of which skill or task is running. Linting, type checking, running the test suite on a changed file. They're your automated quality gate.</p>`,
      },
    ],
    practicalTest: {
      id: 'ch08-test',
      scenarioType: 'slack', scenarioFrom: 'Alex Rivera', scenarioRole: 'Senior Support Agent', scenarioAvatar: '🧑‍💻',
      scenario: 'OK we need a SKILL for this. Every agent writes replies differently — some forget the greeting, some skip the "next step", some over-explain. Write a Claude Code skill (`.claude/skills/support-reply.md`) that enforces our 4-part format every time:\n\n1. Greeting (their first name, warm but professional)\n2. Direct answer\n3. Next step (link, button, dashboard location)\n4. Sign-off (`— Kedash Support`)\n\nDrop it in Claude, then run a sample question through it ("How do I add a teammate?"). Paste BOTH the skill file content AND the reply Claude produced — `## Skill` and `## Sample reply` markers.\n\nAnd before you ask around the floor for me — I\'m remote. Very remote. Focus on the skill.',
      task: 'Paste your skill file content AND a sample reply Claude generated using it.',
      hint: 'Skill needs `name:` / `description:` frontmatter + body describing each part. Sample reply should hit the 4 sections explicitly.',
      minLength: 0, passThreshold: 75, xpReward: 525,
      criteria: [
        { type: 'keyword', value: ['## Skill', '## Sample reply'], description: 'Both sections present', weight: 1 },
        { type: 'keyword', value: ['name:', 'description:'], description: 'Skill has frontmatter', weight: 2 },
        { type: 'keyword', value: ['greeting'], description: 'Skill names the greeting step', weight: 2 },
        { type: 'keyword', value: ['answer', 'respond', 'response'], description: 'Skill names the answer step', weight: 2 },
        { type: 'keyword', value: ['next step', 'next-step', 'dashboard', 'link', 'button'], description: 'Skill names the next-step part', weight: 2 },
        { type: 'keyword', value: ['kedash support', '— Kedash', 'sign-off', 'signoff'], description: 'Sample reply has the sign-off', weight: 2 },
        { type: 'keyword', value: ['hi ', 'hello', 'hey '], description: 'Sample reply opens with a greeting', weight: 1 },
        { type: 'nonce', description: 'Compliance verification code echoed in the live session', improvement: 'Ask Claude to echo the KDQ verification code shown above, then paste the session output containing it.', weight: 5 },
      ],
      exemplar: '<p>Strong answer: skill file with frontmatter (name, description) and a body listing the 4 parts; sample reply visibly hits greeting → answer → next-step → sign-off.</p>',
    },
    theoreticalTest: {
      id: 'ch08-test-mcq', passThreshold: 80, xpReward: 525, drawCount: 6,
      questionPool: [
        {
          id: 'ch08-q01', type: 'single',
          prompt: 'In one sentence, what is a Skill in Claude Code?',
          options: [
            'A binary plugin compiled from Rust',
            'A reusable, parameterised prompt template stored in <code>.claude/skills/</code> that you invoke as a slash command',
            'A subagent definition under <code>.claude/agents/</code>',
            'A keyboard macro recorded in the editor',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "What Are Skills?" — skills are prompt templates exposed as slash commands.',
        },
        {
          id: 'ch08-q02', type: 'single',
          prompt: 'Which is the core "progressive disclosure" claim about skills?',
          options: [
            'Skills auto-improve as you use them',
            'Only the skill\'s name and one-line description live in context at all times; the full body loads only when the skill is invoked',
            'Skills only run when CLAUDE.md is empty',
            'Skills are loaded in parallel via subagents',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Progressive Disclosure" — the index is always-loaded, body is on-invocation.',
        },
        {
          id: 'ch08-q03', type: 'single',
          prompt: 'When is the "skills" approach a better choice than a big CLAUDE.md?',
          options: [
            'For "always active" instructions — every session needs them',
            'For "sometimes needed" instructions — only relevant on specific tasks',
            'Whenever your CLAUDE.md exceeds 100 lines',
            'Only on Opus tier',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Progressive Disclosure" — always-active belongs in CLAUDE.md; sometimes-needed belongs in skills.',
        },
        {
          id: 'ch08-q04', type: 'multi',
          prompt: 'Where do skills physically live? (pick all valid locations)',
          options: [
            '<code>.claude/skills/</code> in the project (shared via git)',
            '<code>~/.claude/skills/</code> for personal skills',
            '<code>.claude/commands/</code> — the legacy path still works but is no longer canonical',
            '<code>/usr/local/share/claude/skills/</code>',
          ],
          correctIndexes: [0, 1, 2],
          explanation: 'Lesson "Writing Your First Skill" — first three are documented; the /usr/local path is invented.',
        },
        {
          id: 'ch08-q05', type: 'single',
          prompt: 'Inside a SKILL.md, which token receives dynamic input passed on the command line?',
          options: [
            '<code>$INPUT</code>',
            '<code>$ARGUMENTS</code>',
            '<code>%1</code>',
            '<code>{{args}}</code>',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Writing Your First Skill" — <code>$ARGUMENTS</code> is the placeholder; e.g. <code>/changelog v2.5.0</code> passes "v2.5.0" via $ARGUMENTS.',
        },
        {
          id: 'ch08-q06', type: 'multi',
          prompt: 'Which of these are listed as "best practices" for writing a skill?',
          options: [
            'Use <code>$ARGUMENTS</code> for dynamic input',
            'Be explicit about output format',
            'Include quality criteria',
            'Avoid markdown',
          ],
          correctIndexes: [0, 1, 2],
          explanation: 'Lesson "Writing Your First Skill" — first three are explicit best practices; avoiding markdown is not.',
        },
        {
          id: 'ch08-q07', type: 'multi',
          prompt: 'Which of these are described as built-in commands (coded behavior, not prompt templates)?',
          options: [
            '<code>/init</code>',
            '<code>/review</code>',
            '<code>/security-review</code>',
            '<code>/clear</code>',
            '<code>/simplify</code>',
          ],
          correctIndexes: [0, 1, 2, 3],
          explanation: 'Lesson "What Are Skills?" — first four are built-ins; <code>/simplify</code> is named as a bundled prompt-based skill.',
        },
        {
          id: 'ch08-q08', type: 'multi',
          prompt: 'Which of the following are real hook events the lesson lists?',
          options: [
            'PreToolUse',
            'PostToolUse',
            'Stop',
            'SessionStart / SessionEnd',
            'UserPromptSubmit',
            'PreCompact / PostCompact',
            'SubagentStart / SubagentStop',
          ],
          correctIndexes: [0, 1, 2, 3, 4, 5, 6],
          explanation: 'Lesson "Hook-based Skills" — all seven appear in the selected-events list. (30+ events exist in total; these are the commonly-named ones.)',
        },
        {
          id: 'ch08-q09', type: 'single',
          prompt: 'In the lesson\'s settings.json example, what role does the <code>matcher</code> field play?',
          options: [
            'Identifies a regex applied to the user prompt',
            'Filters by tool name — empty string matches all tools',
            'Picks a model tier for the hook to run on',
            'Selects which CLAUDE.md the hook applies to',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Hook-based Skills" — matcher filters by tool name; empty means all.',
        },
        {
          id: 'ch08-q10', type: 'single',
          prompt: 'What are hooks "best for", according to the lesson?',
          options: [
            'Replacing CLAUDE.md entirely',
            'Guardrails — things that should always happen regardless of the task (lint, type-check, run tests on a changed file)',
            'Hiding output from the user',
            'Throttling Claude\'s token output',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Hook-based Skills" — hooks are your automated guardrail/quality gate.',
        },
        {
          id: 'ch08-q11', type: 'single',
          prompt: 'You have ten skills in <code>.claude/skills/</code>. A session uses two of them. Which BEST captures the token math vs. dumping all ten workflows into CLAUDE.md?',
          options: [
            'Skills cost more — every skill loads on session start',
            '~50-token index always loaded + only the invoked skills\' bodies, so the 2-skill session costs roughly 1,100 tokens for the skill layer rather than ~3,000 for "everything in CLAUDE.md"',
            'No difference — CLAUDE.md and skills both stream content lazily',
            'CLAUDE.md is always cheaper because of caching',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Progressive Disclosure" — those are the lesson\'s explicit numbers for the comparison.',
        },
      ],
    },
  },

  // ── Chapter 11 ─────────────────────────────────────────────────────────────
  {
    id: 'ch09',
    title: 'Skills: Methodology',
    subtitle: 'Week 11 — Build Skills That Actually Work',
    icon: '🔬',
    xpReward: 400,
    lessons: [
      {
        id: 'ch09-l01', title: 'Walk Before You Codify', xpReward: 100, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: `<h2>The Biggest Skill-Building Mistake</h2>
<p>Most people build skills the wrong way: they <em>imagine</em> what a good workflow looks like, write a skill file for it, then discover the skill produces inconsistent output and spend weeks debugging prompt templates instead of doing actual work.</p>
<p>The correct approach: <strong>walk through the workflow manually first</strong>. Run it in a live Claude Code session, step by step. Correct it in real time. Only after you've run it successfully multiple times — and you understand exactly what inputs, outputs, and corrections it needs — do you write the skill file.</p>
<h3>The methodology in three phases</h3>
<ol>
  <li><strong>Manual runs</strong> — execute the workflow as a conversation, making corrections as you go. Do this at least 3 times on real tasks.</li>
  <li><strong>Pattern extraction</strong> — what prompts worked? what corrections were needed? what inputs were required? write these down.</li>
  <li><strong>Codification</strong> — convert your proven prompt sequence into a skill file, including the corrections as guardrails.</li>
</ol>
<h3>Why this works</h3>
<p>A skill built from observed behaviour is empirically grounded. A skill built from imagination is a hypothesis. Given how much output quality depends on subtle prompt phrasing, the empirical approach produces significantly more reliable skills — and you discover edge cases before they become production failures.</p>`,
      },
      {
        id: 'ch09-l02', title: 'Documenting a Workflow Run', xpReward: 100, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: `<h2>Taking Notes During Manual Runs</h2>
<p>The goal of the manual phase is not just to complete the task — it's to learn enough about the workflow to encode it reliably. That requires deliberate note-taking during the run.</p>
<h3>What to capture</h3>
<ul>
  <li><strong>The exact opening prompt</strong> — what framing made Claude Code understand the task correctly?</li>
  <li><strong>Corrections you made</strong> — what did Claude Code get wrong on the first try, and how did you fix it?</li>
  <li><strong>Required inputs</strong> — what information does this workflow always need? (file path? version number? audience?)</li>
  <li><strong>Output criteria</strong> — what does "good output" look like? Can you articulate it concisely?</li>
  <li><strong>Failure modes</strong> — what went wrong and what prompt fixed it?</li>
</ul>
<h3>The documentation habit</h3>
<p>After each successful manual run, spend 5 minutes writing up what worked. Keep these notes in a simple file — <code>.business-brain/workflow-notes.md</code> or similar. After 3 successful runs, you'll have everything you need to write a reliable skill.</p>
<pre><code>## PR Description Workflow — Notes
Opening: "Write a PR description for the changes in this branch..."
Correction needed: always add "focus on the why, not the what"
Required input: target branch name, JIRA ticket number
Output must: include summary, test plan, and breaking changes section</code></pre>`,
      },
      {
        id: 'ch09-l03', title: 'Writing the Skill from Observation', xpReward: 100, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: `<h2>From Notes to skill.md</h2>
<p>With 3+ successful manual runs documented, writing the skill file is straightforward. You're not guessing — you're encoding what you've already observed to work.</p>
<h3>Skill structure template</h3>
<pre><code># [Skill Name]

## Context
[One sentence: what this skill does and when to use it]

## Inputs
$ARGUMENTS: [what the user passes — e.g., "target branch name"]

## Task
[The opening prompt that worked in your manual runs]

## Quality Criteria
- [Correction 1 you always had to make → encode as a rule]
- [Correction 2 → encode as a rule]

## Output Format
[Exactly what the output should look like — structure, length, format]</code></pre>
<h3>Encoding corrections as guardrails</h3>
<p>If you always had to say "focus on the why, not the what" during manual runs, that correction becomes a line in the Quality Criteria section. You're essentially automating the corrections you've already made manually. The skill learns from your experience.</p>
<h3>Test the skill before committing</h3>
<p>Run the skill 2–3 times on real tasks before committing it to the repo. If it needs corrections again, update the skill file. Repeat until it runs cleanly without manual intervention.</p>`,
      },
      {
        id: 'ch09-l04', title: 'Closing the Loop with learnings.md', xpReward: 100, videos: [],
        lastVerified: '2026-05-30',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>Skills That Get Smarter Over Time</h2>
<p>A skill shipped to the repo is not "done" — it's "ready to start learning". Every imperfect run is data. The team's job is to capture that data and feed it back into the skill file.</p>
<h3>Failure modes to listen for</h3>
<ul>
  <li><strong>Missing context</strong> — the skill didn't have information it needed; add an input or a reference.</li>
  <li><strong>Ambiguous instructions</strong> — a phrase got read two ways; rephrase or add an example.</li>
  <li><strong>Missing guardrails</strong> — an edge case wasn't anticipated; add a quality criterion.</li>
  <li><strong>Stale assumptions</strong> — the codebase changed; refresh the references.</li>
</ul>
<h3>The learnings.md pattern</h3>
<p>Keep a <code>learnings.md</code> next to your skills folder. One entry per meaningful change, dated, with Problem / Fix / Verified fields. Future you (and the rest of the team) reads it before editing the skill again.</p>
<pre><code># Skill Learnings

## pr-description
### v1 → v2 (2026-05-21)
**Problem**: Output too technical for non-engineering reviewers
**Fix**: Added "Assume the reader is a product manager, not an engineer"
**Verified**: Ran on 3 PRs; PM feedback improved significantly

### v2 → v3 (2026-05-29)
**Problem**: Section "Breaking changes" silently omitted when there were none
**Fix**: Require the section header even if the body is "None this release"
**Verified**: Next 5 PRs all rendered the header consistently</code></pre>
<h3>Building feedback INTO the skill</h3>
<p>The most self-improving skills ask for feedback at the end of every run:</p>
<pre><code>## Feedback Request
After delivering output, ask:
"Does this meet the brief? If not, what would you change?
Your answer becomes the next learnings.md entry."</code></pre>
<p>A skill that requests feedback after every use and gets updated from that feedback will be dramatically better after 20 uses than after 1. The compounding is real.</p>`,
      },
    ],
    practicalTest: {
      id: 'ch09-test',
      scenarioType: 'slack', scenarioFrom: 'Alex Rivera', scenarioRole: 'Senior Support Agent', scenarioAvatar: '🧑‍💻',
      scenario: 'Anthropic\'s methodology: observe yourself first, then write the skill from that real session. Pick a "billing question" ticket. Walk Claude Code through what YOU actually do — open the ticket, check the account, look up the billing FAQ, draft a reply using the template, escalate if amount > $500, log the resolution. Capture the real session.\n\nThen write the skill that automates the consistent parts. Paste both — `## Observation run` and `## Skill`.\n\nPS: whoever taught you to observe-then-codify — that methodology has a body count of one company. Use it better than she did.',
      task: 'Paste the manual observation run (real session transcript) AND the resulting skill.',
      hint: 'Observation = the step-by-step you actually walked through; Skill = the consistent parts factored into frontmatter + instructions.',
      minLength: 0, passThreshold: 80, xpReward: 550,
      criteria: [
        { type: 'keyword', value: ['## Observation', '## Skill'], description: 'Both sections marked', weight: 1 },
        { type: 'keyword', value: ['billing', 'ticket'], description: 'Right ticket type', weight: 2 },
        { type: 'keyword', value: ['dashboard', 'account', 'faq', 'template'], description: 'Real tools used in the session', weight: 2 },
        { type: 'keyword', value: ['$500', '500', 'threshold', 'escalat'], description: 'Captures escalation threshold', weight: 2 },
        { type: 'keyword', value: ['name:', 'description:'], description: 'Skill has frontmatter', weight: 2 },
        { type: 'structure', value: 'numbered-steps', description: 'Observation uses numbered steps', weight: 1 },
      ],
      exemplar: '<p>Strong answer: a numbered observation walking through a real billing ticket (account check → FAQ → template → escalation), then a skill file that names <code>name:</code> / <code>description:</code> and codifies those steps.</p>',
    },
    theoreticalTest: {
      id: 'ch09-test-mcq', passThreshold: 80, xpReward: 550, drawCount: 6,
      questionPool: [
        {
          id: 'ch09-q01', type: 'single',
          prompt: 'What is the "biggest skill-building mistake" the lesson identifies?',
          options: [
            'Writing the skill in YAML instead of markdown',
            'Imagining what a good workflow looks like and writing the skill file BEFORE running the workflow manually',
            'Putting skills in <code>~/.claude/skills/</code>',
            'Using <code>$ARGUMENTS</code> too liberally',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Walk Before You Codify" — the failure mode is writing from imagination instead of from observed behavior.',
        },
        {
          id: 'ch09-q02', type: 'multi',
          prompt: 'Which are the three phases of the recommended skill-building methodology?',
          options: [
            'Manual runs — execute the workflow as a conversation, correcting as you go (3+ real tasks)',
            'Pattern extraction — note which prompts worked, which corrections were needed, which inputs were required',
            'Codification — convert the proven sequence into a skill file with corrections as guardrails',
            'Marketing — announce the skill in #general',
          ],
          correctIndexes: [0, 1, 2],
          explanation: 'Lesson "Walk Before You Codify" — three phases: manual runs → pattern extraction → codification.',
        },
        {
          id: 'ch09-q03', type: 'multi',
          prompt: 'During the manual phase, what does the lesson tell you to deliberately capture?',
          options: [
            'The exact opening prompt that made Claude understand the task',
            'Corrections you had to make',
            'Required inputs the workflow always needs',
            'Output criteria — what "good output" looks like',
            'Failure modes — what went wrong and what fixed it',
          ],
          correctIndexes: [0, 1, 2, 3, 4],
          explanation: 'Lesson "Documenting a Workflow Run" — all five are explicit capture targets.',
        },
        {
          id: 'ch09-q04', type: 'single',
          prompt: 'How many manual runs does the lesson recommend before writing the skill file?',
          options: ['1', 'At least 3 successful runs on real tasks', '5', '10'],
          correctIndexes: [1],
          explanation: 'Lesson "Walk Before You Codify" + "Documenting a Workflow Run" — at least 3 successful real-task runs.',
        },
        {
          id: 'ch09-q05', type: 'multi',
          prompt: 'Which sections appear in the lesson\'s skill structure template?',
          options: [
            '## Context',
            '## Inputs (including $ARGUMENTS line)',
            '## Task',
            '## Quality Criteria',
            '## Output Format',
            '## Pricing',
          ],
          correctIndexes: [0, 1, 2, 3, 4],
          explanation: 'Lesson "Writing the Skill from Observation" — those five sections appear; pricing doesn\'t.',
        },
        {
          id: 'ch09-q06', type: 'single',
          prompt: 'A correction you ALWAYS had to make during manual runs — where does it live in the codified skill?',
          options: [
            'Skip it — Claude will figure it out',
            'It becomes a line in the Quality Criteria section, encoded as a rule (essentially automating the correction)',
            'Inside a code comment in the project source',
            'In a CLAUDE.md',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Writing the Skill from Observation" — encode corrections as guardrails under Quality Criteria.',
        },
        {
          id: 'ch09-q07', type: 'single',
          prompt: 'What is the lesson\'s position on "shipped to the repo" skills?',
          options: [
            'They are done — no further edits',
            'They are "ready to start learning" — every imperfect run is data fed back into the skill via learnings.md',
            'They should be rewritten quarterly from scratch',
            'They should be deleted after 30 days',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Closing the Loop with learnings.md" — shipping is the beginning; improvement compounds via learnings.md.',
        },
        {
          id: 'ch09-q08', type: 'multi',
          prompt: 'Which "failure modes to listen for" does the lesson name?',
          options: [
            'Missing context — the skill lacked information it needed',
            'Ambiguous instructions — a phrase got read two ways',
            'Missing guardrails — an edge case wasn\'t anticipated',
            'Stale assumptions — the codebase changed',
            'Insufficient emoji density',
          ],
          correctIndexes: [0, 1, 2, 3],
          explanation: 'Lesson "Closing the Loop with learnings.md" — first four are named; emoji density is not.',
        },
        {
          id: 'ch09-q09', type: 'multi',
          prompt: 'Which fields does a learnings.md entry use, per the lesson?',
          options: ['Problem', 'Fix', 'Verified', 'Owner'],
          correctIndexes: [0, 1, 2],
          explanation: 'Lesson "Closing the Loop with learnings.md" — Problem / Fix / Verified are the named fields; Owner is not.',
        },
        {
          id: 'ch09-q10', type: 'single',
          prompt: 'What is the "self-improving skill" pattern the lesson describes?',
          options: [
            'A skill that automatically rewrites itself with no human in the loop',
            'A skill that asks the user for feedback at the end of every run, with the answer becoming the next learnings.md entry',
            'A skill that calls another skill recursively',
            'A skill that runs nightly via cron',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Closing the Loop with learnings.md" — building feedback INTO the skill is the compounding pattern.',
        },
        {
          id: 'ch09-q11', type: 'single',
          prompt: 'Before committing a freshly-written skill to the repo, what does the lesson say to do?',
          options: [
            'Push directly to main',
            'Run the skill 2-3 times on real tasks and update the skill file if it still needs corrections',
            'Open a Jira ticket',
            'Add a pricing section',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Writing the Skill from Observation" — test 2-3 real runs and iterate until it runs cleanly.',
        },
      ],
    },
  },
  // ── Chapter 12 ────────────────────────────────────────────────────────────
  {
    id: 'ch10',
    title: 'Choosing Your Model',
    subtitle: 'Week 12 — Opus, Sonnet, Haiku — and When to Switch',
    icon: '🧠',
    xpReward: 460,
    lessons: [
      {
        id: 'ch10-l01', title: 'Meet the Engines', xpReward: 110, videos: [],
        lastVerified: '2026-08-26',
        verifiedAgainstVersion: 'v2.1.246',
        content: `<h2>Dr. Priya Engelhardt — AI Operations</h2>
<div class="term-shot" data-shot="ch10-l01"><div class="term-shot-bar"><span class="ts-dot ts-r"></span><span class="ts-dot ts-y"></span><span class="ts-dot ts-g"></span><span class="term-shot-title">Terminal — claude</span></div><div class="term-shot-body"><span class="ts-cy">&gt;</span> /model

<span class="ts-gold">Select model</span> <span class="ts-dim">current: sonnet</span>

  1. Default (Recommended)   <span class="ts-dim">Sonnet for daily work</span>
<span class="ts-sel">❯ 2. Opus                    claude-opus-5 · most capable · priciest</span>
  3. Sonnet <span class="ts-ok">✓</span>                <span class="ts-dim">claude-sonnet-5 · balanced default</span>
  4. Haiku                   <span class="ts-dim">claude-haiku-4-5 · fastest · cheapest</span>
  5. Fable                   <span class="ts-dim">claude-fable-5 · hardest, longest-running work</span>

<span class="ts-dim">↑/↓ move · enter select · esc cancel</span></div><div class="term-shot-cap">Simulated terminal — run it yourself and you'll see the live version.</div></div>
<p><em>You step out of the Library balancing a stack of refined skills. Dr. Priya Engelhardt — Head of AI Operations — is waiting at the AI Ops console with her arms folded.</em></p>
<p><em>"Most engineers here run Sonnet for everything and rack up surprise bills. The other half run Opus for everything and rack up bigger ones. I'm going to teach you to spend deliberately. Sit down."</em></p>
<h3>The Claude 5 family in Claude Code</h3>
<p>Three tiers cover almost everything, each with a different cost/intelligence trade-off:</p>
<ul>
  <li><strong>Claude Opus 5</strong> (<code>claude-opus-5</code>) — the smartest of the three. Multi-step reasoning, long refactors, ambiguous architectural calls, hard debugging. Highest cost per token; slowest output. 1M-token context.</li>
  <li><strong>Claude Sonnet 5</strong> (<code>claude-sonnet-5</code>) — the balanced default. Most coding work, day-to-day prompts, skill execution, code review. Strong intelligence at a fraction of Opus's cost, and also a 1M-token context.</li>
  <li><strong>Claude Haiku 4.5</strong> (<code>claude-haiku-4-5</code>) — the fast lane. Quick edits, log triage, short summaries, scripted hook actions. Sub-second time-to-first-token; cheapest tier. 200k context.</li>
</ul>
<p>Above all three sits <strong>Claude Fable 5</strong> (<code>claude-fable-5</code>) — Anthropic's most capable widely-released model, for the most demanding reasoning and long-horizon agentic work. It is <em>not</em> the default: you select it with <code>/model fable</code>, and in an interactive session Claude Code asks you to confirm before a Fable 5 request spends usage credits.</p>
<div class="callout"><strong>Version note.</strong> Opus 5 needs Claude Code <code>v2.1.219</code> or later; Sonnet 5 needs <code>v2.1.197</code>. Run <code>claude update</code> if <code>/model</code> doesn't offer them.</div>
<h3>Why this matters</h3>
<p>The wrong model for the job costs you either money (Opus on a one-line typo fix) or time and quality (Haiku on a multi-file architectural change). The first habit of a senior Claude Code user is matching the engine to the workload.</p>
<h3>What Claude Code picks by default</h3>
<p>On launch Claude Code runs the <strong>Default</strong> option, which resolves to Sonnet for daily work unless your organisation has set its own default. That's almost always correct. But the moment a task obviously falls outside Sonnet's sweet spot, you should switch — explicitly, every time, not as an afterthought.</p>`,
      },
      {
        id: 'ch10-l02', title: 'Switching Models, Fast Mode and Effort', xpReward: 110, videos: [],
        lastVerified: '2026-08-26',
        verifiedAgainstVersion: 'v2.1.246',
        content: `<h2>Three Levers, One Session</h2>
<p>Claude Code exposes three switches that change which model executes your next prompt — plus one thing that used to be a switch and isn't any more. Learning all of them keeps you in control instead of letting defaults silently drive your bill.</p>
<h3>1. /model — pick the tier</h3>
<pre><code>/model opus       # latest Opus  — Opus 5 on the Anthropic API
/model sonnet     # latest Sonnet — Sonnet 5 (the usual default)
/model haiku      # Haiku 4.5
/model fable      # Fable 5 — hardest, longest-running work
/model best       # Fable 5 where you have access, else latest Opus
/model opusplan   # Opus while planning, Sonnet to execute
/model default    # clear any override, back to your account default
/model            # opens an interactive picker</code></pre>
<p>The choice persists for the rest of the session (or until you switch again). You'll see the active model in the status line.</p>
<p><code>opusplan</code> is the one worth knowing about: it pairs directly with plan mode (Chapter 12) — you get Opus's judgement while the plan is being written, then Sonnet's speed and price for the mechanical work of carrying it out.</p>
<div class="callout"><strong>Aliases are not fixed mappings.</strong> They resolve to the recommended version <em>for your provider</em>, and that moves over time. On the Anthropic API <code>sonnet</code> is Sonnet 5; on Amazon Bedrock or Google Cloud it may still be Sonnet 4.5. To pin a version, use the full model name — <code>/model claude-opus-5</code>.</div>
<h3>2. /fast — Fast Mode for Opus</h3>
<p><code>/fast</code> toggles <strong>Fast Mode</strong> while on Opus (5 or 4.8). It does <em>not</em> downgrade you to Sonnet or Haiku — you stay on Opus, but output streams much faster. Worth it when you're paired with Opus on a long refactor and don't want to watch tokens drip out.</p>
<h3>3. Context size — the lever that retired</h3>
<p>Opus 5 and Sonnet 5 both carry a <strong>1,000,000-token context window natively</strong> — there is nothing to switch on. Very large repos, transcripts, or doc bundles fit in one session by default.</p>
<p>You may still see the <code>opus[1m]</code> and <code>sonnet[1m]</code> aliases. These are leftovers from when the big window was an opt-in tier on top of a 200k model, and they matter in only two places today: selecting the 1M window for Sonnet 5 from behind an LLM gateway, and pinning an older Opus that didn't have it natively. On a normal Anthropic API session, <code>sonnet[1m]</code> does nothing that <code>sonnet</code> doesn't already do.</p>
<p>Haiku 4.5 is the exception — it stays at 200k. If you send Haiku on a whole-codebase read, that is where you'll hit the wall.</p>
<h3>One-shot override per command</h3>
<p>For headless / scripted runs, pass the model explicitly:</p>
<pre><code>claude -p "summarise this PR" --model claude-haiku-4-5
claude -p "redesign the auth module" --model claude-opus-5</code></pre>
<p>This bypasses whatever the interactive default is — perfect for cron jobs and CI hooks that should always run on a specific tier.</p>
<h3>4. Effort — the other half of the dial</h3>
<p>Picking a model is only half the decision. <strong>Effort</strong> controls how much the model reasons before answering, and it moves cost and quality as much as the tier does. Every current model supports five levels:</p>
<pre><code>/effort            # opens the picker
/effort low        # short, scoped, latency-sensitive work
/effort medium     # cost-sensitive work that can trade a little intelligence
/effort high       # the default — balances spend and intelligence
/effort xhigh      # deeper reasoning, higher spend
/effort max        # deepest — prone to overthinking; test before adopting
claude --effort high      # set it at launch, for scripts and CI</code></pre>
<p><code>high</code> is the default on every model that supports effort. <code>low</code> through <code>xhigh</code> persist across sessions when you set them interactively; <code>max</code> applies to the current session only.</p>
<p>The practical consequence is that "Opus is too expensive for this" is often the wrong conclusion. <strong>Opus at <code>low</code> or <code>medium</code> effort</strong> is a genuinely different option from Sonnet at <code>high</code>, and on reasoning-shaped work it frequently wins on both counts. Reach for the effort dial before you downgrade the tier.</p>
<div class="callout"><strong>Also on the menu: <code>ultracode</code>.</strong> It is a Claude Code setting rather than a model effort level — it sends <code>xhigh</code> to the model <em>and</em> has Claude orchestrate a dynamic workflow for substantive tasks. Set it with <code>/effort ultracode</code> or <code>claude --effort ultracode</code>.</div>
<p>Effort isn't only a session-wide switch. Skills and subagents can each declare their own <code>effort:</code> in frontmatter (Chapters 8 and 14), which is how you give a cheap mechanical subagent <code>low</code> while the orchestrator that dispatches it runs at <code>high</code>.</p>`,
      },
      {
        id: 'ch10-l03', title: 'Cost Economics & Prompt Caching', xpReward: 110, videos: [],
        lastVerified: '2026-08-26',
        verifiedAgainstVersion: 'v2.1.246',
        content: `<h2>Where Your Money Actually Goes</h2>
<p>Priya pulls up last month's bill on a wall display. "This team spent £4,200 on Claude Code. Half of it was avoidable. Let me show you why."</p>
<h3>The order-of-magnitude rule</h3>
<p>As a rough mental model, per million tokens:</p>
<ul>
  <li><strong>Opus 5</strong>: ~5× the cost of Haiku ($5 / $25 per million tokens in / out)</li>
  <li><strong>Sonnet 5</strong>: ~2× the cost of Haiku ($2 / $10)</li>
  <li><strong>Haiku 4.5</strong>: the cheap reference point ($1 / $5)</li>
</ul>
<p>Running Opus on a task Haiku could handle is throwing 5× the money at the same answer.</p>
<div class="callout"><strong>This gap has narrowed.</strong> On the previous generation Opus cost roughly 15× Haiku, which made "always reach for the cheapest model that can do it" the dominant advice. At 5×, the calculation is genuinely different: a task Opus gets right first time can easily beat three Haiku attempts plus your time reviewing them. Spend deliberately still holds — but "deliberately" now means weighing the retry cost, not reflexively picking the cheap tier.</div>
<h3>Prompt caching — your biggest lever</h3>
<p>Claude has automatic <strong>prompt caching</strong>: stable prefixes of your context (CLAUDE.md, large file reads, system prompts) get cached server-side. Cached tokens cost roughly <strong>10% of the normal input rate</strong>.</p>
<h3>The 5-minute TTL</h3>
<p>The cache has a <strong>5-minute lifetime</strong> from last access. While you're actively working, every follow-up prompt reads the cached prefix cheaply. The moment a gap exceeds 5 minutes — a long lunch, an idle background process — the cache evicts and the next prompt pays full freight to repopulate it.</p>
<h3>Practical consequences</h3>
<ul>
  <li>Tight bursts of work are dramatically cheaper than the same work spread across the day.</li>
  <li>Idle sleeps in scheduled scripts should be either &lt;5 minutes (stay cached) or much longer (commit to the eviction). 300 seconds is the worst-of-both — you pay the cache miss without amortising it.</li>
  <li>A long-running tmux session that touches the same project repeatedly is cheaper than spawning a fresh <code>claude -p</code> each time.</li>
</ul>
<h3>Reading the cost panel</h3>
<p>Run <code>/cost</code> to see the running total for the current session, broken down by input / cached input / output. If cached input isn't a large chunk of your bill, you have idle time eating cache windows — or you're rotating projects faster than the TTL.</p>`,
      },
      {
        id: 'ch10-l04', title: 'Matching Model to Task', xpReward: 130, videos: [],
        lastVerified: '2026-05-30',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>The Decision Heuristic</h2>
<p>Priya hands you a laminated card. "Pin this to your monitor. Refer to it for two weeks. After that, it's instinct."</p>
<h3>Pick Haiku when…</h3>
<ul>
  <li>The task is mechanical: rename, regex replace, format a JSON, tally numbers.</li>
  <li>You need a sub-second answer for a hook or status-line script.</li>
  <li>You're triaging logs or summarising a single short file.</li>
  <li>You're running a high-volume batch (1000 PR titles to classify).</li>
</ul>
<h3>Pick Sonnet when…</h3>
<ul>
  <li>You're writing or refactoring code in a small scope (single file, well-defined function).</li>
  <li>You're executing a known skill or following a documented runbook.</li>
  <li>You're reviewing a PR of moderate size.</li>
  <li>You don't know — this is the safe default for ~80% of work.</li>
</ul>
<h3>Pick Opus when…</h3>
<ul>
  <li>The problem requires reasoning across many files or unfamiliar territory.</li>
  <li>You're debugging a subtle bug that doesn't reproduce reliably.</li>
  <li>You're designing an architecture, not just implementing one.</li>
  <li>You're running an audit, security review, or compliance check where missing something is expensive.</li>
  <li>You're orchestrating subagents (the orchestrator benefits most from intelligence).</li>
</ul>
<h3>Escalate mid-session</h3>
<p>Start on Sonnet. The moment you see Sonnet thrashing — repeated wrong guesses, missing the obvious connection, asking you to re-explain — <code>/model opus</code> and re-prompt. Don't burn an hour fighting the wrong tier.</p>
<h3>De-escalate too</h3>
<p>If you started on Opus for the architectural part and now you're just typing out boilerplate from the plan, drop back to Sonnet (or Haiku for pure mechanical tail-end edits). The cost difference compounds across a workday.</p>`,
      },
    ],
    practicalTest: {
      id: 'ch10-test',
      scenarioType: 'email', scenarioFrom: 'Dr. Priya Engelhardt', scenarioRole: 'Head of AI Operations', scenarioAvatar: '👩‍🔬',
      scenario: 'From: priya.engelhardt@kedashcorp.com\nSubject: Model-spend audit — three tasks on your desk\n\nThree tasks landed in your queue this morning:\n\n1. Classify 800 customer-support tickets by topic (one short sentence each).\n2. Refactor the `OrderProcessor` class across 14 files — keep behaviour identical, split into three smaller classes.\n3. Add a `formatCurrency()` helper to `src/utils/format.js`, update the two existing call sites.\n\nPick the right model for each. Justify it on cost + capability grounds (mention prompt caching where it applies). Then SHOW me you actually used `/model` to switch — paste the commands you ran and the status-line / model-banner output proving the switch took effect.\n\nFour sections: `## Task 1`, `## Task 2`, `## Task 3`, `## Proof of switch`.\n\nScore honestly. I have read six of these audits before yours, and I remember every one.',
      task: 'Pick a model per task with cost+capability reasoning, then show real /model switches with status-line evidence.',
      hint: 'Task 1 = high-volume short → Haiku. Task 2 = cross-file reasoning → Opus (mention 1M context if huge). Task 3 = local, well-defined → Sonnet. Proof = `/model <tier>` + status line / banner snippet.',
      minLength: 0, passThreshold: 80, xpReward: 650,
      criteria: [
        { type: 'keyword', value: ['## Task 1', '## Task 2', '## Task 3', '## Proof'], description: 'All four sections present', weight: 1 },
        { type: 'keyword', value: ['haiku'], description: 'Haiku chosen for the batch task', weight: 2 },
        { type: 'keyword', value: ['opus'], description: 'Opus chosen for the cross-file refactor', weight: 2 },
        { type: 'keyword', value: ['sonnet'], description: 'Sonnet chosen for the small helper', weight: 2 },
        { type: 'keyword', value: ['/model'], description: 'Shows the actual /model command', weight: 2 },
        { type: 'keyword', value: ['cache', 'caching', 'cached', 'prompt cache', '5 minute', '5-minute', 'ttl'], description: 'References prompt caching economics', weight: 2 },
        { type: 'keyword', value: ['cost', 'cheaper', 'expensive', 'per token', 'bill', '/cost'], description: 'Cost reasoning present', weight: 1 },
        { type: 'keyword', value: ['cross-file', 'multi-file', 'architectural', 'reasoning', '14 files'], description: 'Justifies Opus on scope grounds', weight: 1 },
      ],
      exemplar: '<p>Strong answer: Haiku for ticket classification (high volume, mechanical, sub-second per call), Opus for the 14-file refactor (cross-file reasoning, possibly 1M context if total is large), Sonnet for the helper + call sites (small scope, default tier). Proof section shows <code>/model haiku</code>, <code>/model opus</code>, <code>/model sonnet</code> with status-line snippets confirming each switch — and at least one mention of how prompt caching keeps a tight burst cheap.</p>',
    },
    theoreticalTest: {
      id: 'ch10-test-mcq', passThreshold: 80, xpReward: 650, drawCount: 6,
      questionPool: [
        {
          id: 'ch10-q01', type: 'single',
          prompt: 'Which model does Claude Code use by default on launch?',
          options: ['Opus 5', 'Sonnet 5', 'Haiku 4.5', 'Fable 5'],
          correctIndexes: [1],
          explanation: 'Lesson "Meet the Engines" — the Default option resolves to Sonnet (Sonnet 5 on the Anthropic API) unless your organisation sets its own default. It is the recommended ~80% choice.',
        },
        {
          id: 'ch10-q02', type: 'multi',
          prompt: 'Which of these are the three everyday model tiers in Claude Code?',
          options: ['Claude Opus 5', 'Claude Sonnet 5', 'Claude Haiku 4.5', 'Claude Lite 3.5'],
          correctIndexes: [0, 1, 2],
          explanation: 'Lesson "Meet the Engines" — three everyday tiers: Opus 5, Sonnet 5, Haiku 4.5. Fable 5 sits above them for the hardest work, and there is no "Lite" tier.',
        },
        {
          id: 'ch10-q03', type: 'single',
          prompt: 'What does <code>/fast</code> do?',
          options: [
            'Downgrades to Haiku',
            'Toggles Fast Mode while on Opus (5 or 4.8) — you stay on Opus, but output streams much faster',
            'Disables prompt caching',
            'Sends a single one-shot prompt',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Switching with /model and Fast Mode" — Fast Mode keeps you on Opus and speeds output; it is not a downgrade.',
        },
        {
          id: 'ch10-q04', type: 'single',
          prompt: 'You\'re about to ingest a huge codebase in a single session. What does the lesson tell you to do?',
          options: [
            'Enable the 1M-context tier with the <code>opus[1m]</code> alias — it is off by default',
            'Nothing special: Opus 5 and Sonnet 5 already have a 1,000,000-token context natively',
            'Switch to Haiku 4.5 — it has the largest context window',
            'There\'s no way; split the codebase manually',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Switching with /model and Fast Mode" — the big window is native on Opus 5 and Sonnet 5, so there is nothing to switch on. The <code>[1m]</code> aliases are leftovers from when it was opt-in. Haiku 4.5 is the one that stays at 200k.',
        },
        {
          id: 'ch10-q05', type: 'single',
          prompt: 'For headless / scripted runs, how do you pin a specific model per command?',
          options: [
            'Edit <code>~/.claude/CLAUDE.md</code>',
            'Pass <code>--model claude-opus-5</code> (or any model name/alias) to <code>claude -p "..."</code>',
            'Use an environment variable <code>CLAUDE_MODEL</code>',
            'It always uses Sonnet for headless runs',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Switching with /model and Fast Mode" — <code>--model</code> is the one-shot per-command override.',
        },
        {
          id: 'ch10-q06', type: 'single',
          prompt: 'The "order-of-magnitude rule" for cost per million tokens, with Haiku as the reference, is roughly…',
          options: [
            'Opus ≈ 5×, Sonnet ≈ 2× Haiku',
            'Opus ≈ 15×, Sonnet ≈ 3× Haiku',
            'Opus ≈ 100×, Sonnet ≈ 10× Haiku',
            'All tiers identical',
          ],
          correctIndexes: [0],
          explanation: 'Lesson "Cost Economics & Prompt Caching" — Opus 5 ≈ 5× Haiku 4.5, Sonnet 5 ≈ 2×. The 15× figure was the previous generation; the gap has narrowed a lot.',
        },
        {
          id: 'ch10-q07', type: 'multi',
          prompt: 'Which of these tasks are good Haiku fits, per the lesson?',
          options: [
            'Renames, regex replaces, formatting JSON, tallying numbers',
            'Sub-second answers for hooks or status-line scripts',
            'Triaging logs or summarising a single short file',
            'A high-volume batch (e.g. 1000 PR titles to classify)',
            'Designing a new architecture across services',
          ],
          correctIndexes: [0, 1, 2, 3],
          explanation: 'Lesson "Matching Model to Task" — the first four are explicit Haiku territory; architecture design is Opus territory.',
        },
        {
          id: 'ch10-q08', type: 'multi',
          prompt: 'When does the lesson say to pick Opus?',
          options: [
            'Reasoning across many files or unfamiliar territory',
            'Subtle non-deterministic bugs',
            'Designing an architecture (not just implementing one)',
            'Audits, security reviews, compliance checks where missing something is expensive',
            'Orchestrating subagents (the orchestrator benefits most from intelligence)',
            'A one-line typo fix',
          ],
          correctIndexes: [0, 1, 2, 3, 4],
          explanation: 'Lesson "Matching Model to Task" — first five are explicit Opus fits; the typo fix is the cautionary Opus over-use example.',
        },
        {
          id: 'ch10-q09', type: 'single',
          prompt: 'You started a session on Sonnet but it keeps making wrong guesses and asking you to re-explain. What does the lesson recommend?',
          options: [
            'Keep iterating — eventually Sonnet will get it',
            'Use <code>/model opus</code> and re-prompt — don\'t burn an hour fighting the wrong tier',
            'Restart your computer',
            'Switch to Haiku',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Matching Model to Task" — escalate mid-session is part of the decision heuristic.',
        },
        {
          id: 'ch10-q10', type: 'single',
          prompt: 'You were on Opus for the architectural design and now you\'re typing out mechanical boilerplate from the plan. Best move?',
          options: [
            'Stay on Opus to keep things consistent',
            'De-escalate — drop back to Sonnet (or Haiku for pure mechanical tail-end edits); cost compounds across a workday',
            'Switch to a new project to start over',
            'Restart Claude Code',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Matching Model to Task" — the de-escalate pattern is symmetric with escalate.',
        },
        {
          id: 'ch10-q11', type: 'single',
          prompt: 'The lesson calls out one polling interval as the "worst of both worlds" for caching. What is it, and why?',
          options: [
            'Under 60 seconds — too noisy',
            '300 seconds (5 minutes) — you pay the cache eviction without amortising it',
            'Exactly 4 minutes — the cache silently doubles cost',
            '24 hours — too long',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Cost Economics & Prompt Caching" — 300 seconds straddles the 5-minute TTL, paying the miss with no amortisation.',
        },
              {
          id: 'ch10-q12', type: 'single',
          prompt: 'A reasoning-heavy task is running slowly and expensively on Opus. What does the lesson say to try before downgrading to Sonnet?',
          options: [
            'Lower the effort level — Opus at low or medium is a different option from Sonnet at high',
            'Turn on Fast Mode, which makes Opus cheaper',
            'Switch to the 1M-context tier',
            'Nothing — model tier is the only cost dial',
          ],
          correctIndexes: [0],
          explanation: 'Lesson "Switching Models, Fast Mode and Effort" — effort moves cost and quality as much as the tier does. Reach for the effort dial before downgrading. (Fast Mode raises speed and price; it is not a saving.)',
        },
        {
          id: 'ch10-q13', type: 'single',
          prompt: 'What is the default effort level on a model that supports effort?',
          options: ['low', 'medium', 'high', 'max'],
          correctIndexes: [2],
          explanation: 'Lesson "Switching Models, Fast Mode and Effort" — high is the default, balancing token spend against intelligence.',
        },
],
    },
  },

  // ── Chapter 13 ────────────────────────────────────────────────────────────
  {
    id: 'ch13',
    title: 'MCP Servers & Integrations',
    subtitle: 'Week 13 — Connecting the World',
    icon: '🔌',
    xpReward: 440,
    lessons: [
      {
        id: 'ch13-l01', title: 'What is MCP?', xpReward: 110, videos: ['<iframe src="https://www.youtube.com/embed/DfWHX7kszQI" title="Claude Code MCP: How to Add MCP Servers (Complete Guide)" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'],
        lastVerified: '2026-06-24',
        verifiedAgainstVersion: 'v2.1.176',
        content: '<h2>Model Context Protocol</h2><p>MCP is an open standard that lets Claude Code connect to external services, databases, and tools. The community has built hundreds of MCP servers for common tools: GitHub, Postgres, Slack, Notion, Linear, Figma, and more — and Anthropic maintains a <strong>directory</strong> of hosted MCP servers you can browse. There is no bare-name install, though — you add a server by pointing the CLI at its URL or launch command: <code>claude mcp add --transport http &lt;name&gt; &lt;url&gt;</code> for a hosted (HTTP) server, or <code>claude mcp add &lt;name&gt; -- &lt;command&gt;</code> for a local one.</p><h3>How it works</h3><ol><li>An MCP server exposes tools over a standardised protocol</li><li>Claude Code connects to the server (local or remote)</li><li>Claude Code uses those tools as naturally as built-in ones</li></ol>',
      },
      {
        id: 'ch13-l02', title: 'Connecting MCP Servers', xpReward: 110, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: '<h2>Configuration</h2><p>MCP servers are configured in <code>~/.claude.json</code> (user-level, all projects) or <code>.mcp.json</code> at the repo root (project-level, commit to share with the team). Not in <code>settings.json</code>.</p><pre><code>// .mcp.json\n{\n  "mcpServers": {\n    "postgres": {\n      "command": "npx",\n      "args": ["-y", "@modelcontextprotocol/server-postgres"],\n      "env": { "DATABASE_URL": "postgres://localhost:5432/mydb" }\n    }\n  }\n}</code></pre><p>Alternatively, use the CLI: <code>claude mcp add postgres -- npx -y @modelcontextprotocol/server-postgres</code>. After adding, run <code>/mcp</code> to verify the server connected. Use read-only credentials for production databases.</p>',
      },
      {
        id: 'ch13-l03', title: 'Common MCP Use Cases', xpReward: 110, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: '<h2>What You Can Do with MCP</h2><p><strong>Database:</strong> "Show schema for orders table", "Write a migration to add deleted_at to products", "What indexes exist on users?"</p><p><strong>GitHub:</strong> "Summarise open PRs blocking this release", "Create a PR for the current branch with a description from the commits"</p><p><strong>Business Brain + MCP:</strong> An MCP server can serve your Business Brain folder as a searchable index — returning only the relevant sections rather than loading entire files into context. This scales the Business Brain pattern to large organisations without ballooning token usage.</p>',
      },
      {
        id: 'ch13-l04', title: 'Building a Simple MCP Server', xpReward: 110, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: '<h2>Writing Your Own MCP Server</h2><p>Anthropic provides official SDKs for TypeScript and Python. A basic server can be written in under 50 lines.</p><pre><code>import { Server } from \'@modelcontextprotocol/sdk/server/index.js\';\nimport { StdioServerTransport } from \'@modelcontextprotocol/sdk/server/stdio.js\';\n\nconst server = new Server({ name: \'acme-wiki\', version: \'1.0.0\' });\n\nserver.tool(\'search_wiki\', { query: { type: \'string\' } }, async ({ query }) => {\n  const results = await searchConfluence(query);\n  return { content: [{ type: \'text\', text: JSON.stringify(results) }] };\n});\n\nawait server.connect(new StdioServerTransport());</code></pre><p>For standard tools, use existing community MCP servers. Build your own only for internal systems without open-source alternatives.</p>',
      },
    ],
    practicalTest: {
      id: 'ch13-test',
      scenarioType: 'email', scenarioFrom: 'Marcus Webb', scenarioRole: 'IT Setup Lead', scenarioAvatar: '👨‍💻',
      scenario: 'From: marcus.webb@kedashcorp.com\nSubject: Wire up an MCP server\n\nTime to extend Claude Code with a real MCP server. You don\'t need Zendesk for this — pick the simplest one: the official filesystem MCP server. Install it, add it to your Claude config under `mcpServers`, restart Claude, then USE it — ask Claude to do something the MCP enables (e.g., list files in the allowed path, or read a specific file via the tool).\n\nPaste: the install command, the config snippet, AND a snippet from Claude showing the MCP tool actually being invoked.\n\nAllowed path note: scope it tight. The LAST person to configure an MCP in this building scoped it to \'/\'. We do not speak of it. (Rena speaks of it constantly.)',
      task: 'Paste `## Install`, `## Config`, `## Claude using the MCP` — full evidence the setup works end-to-end.',
      hint: 'Try `npx -y @modelcontextprotocol/server-filesystem <path>` as the server command. Config goes under `mcpServers` in your Claude config. **Restart Claude after editing config**, then ask Claude to use the filesystem tool.',
      minLength: 0, passThreshold: 85, xpReward: 600,
      criteria: [
        { type: 'keyword', value: ['## Install', '## Config', '## Claude using'], description: 'Three sections present', weight: 1 },
        { type: 'keyword', value: ['npm install', 'npx', '@modelcontextprotocol', 'mcp-server', 'pip install'], description: 'Install command shown', weight: 2 },
        { type: 'keyword', value: ['mcpServers', '.claude.json', 'settings.json', 'claude_desktop_config'], description: 'Config in the right place', weight: 2 },
        { type: 'keyword', value: ['command', 'args'], description: 'Server config has command / args', weight: 2 },
        { type: 'keyword', value: ['restart', 'reload', 'relaunch', 'reopen', 'new session'], description: 'Mentions restart after config edit', weight: 1 },
        { type: 'keyword', value: ['filesystem', 'list_directory', 'read_file', 'tool', 'tools', 'invoked', 'called', 'using'], description: 'Evidence Claude actually used the MCP', weight: 2 },
        { type: 'keyword', value: ['/', '\\'], description: 'Output shows filesystem-style paths', weight: 1 },
      ],
      exemplar: '<p>Strong answer: an install command (npm or npx), a JSON config block under <code>mcpServers</code> with <code>command</code>/<code>args</code>, a note about restarting Claude, and a snippet of Claude actually invoking the filesystem tool with paths visible.</p>',
    },
    theoreticalTest: {
      id: 'ch13-test-mcq', passThreshold: 80, xpReward: 600, drawCount: 6,
      questionPool: [
        {
          id: 'ch13-q01', type: 'single',
          prompt: 'What does MCP stand for, and what does it do?',
          options: [
            'Multi-Claude Protocol — splits work between models',
            'Model Context Protocol — an open standard that lets Claude Code connect to external services, databases, and tools',
            'Managed Cloud Proxy — Anthropic-hosted secrets management',
            'Memory Compaction Protocol — speeds up <code>/compact</code>',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "What is MCP?" — MCP = Model Context Protocol, the open standard for external-tool integration.',
        },
        {
          id: 'ch13-q02', type: 'multi',
          prompt: 'Which of these are described as common MCP-server integrations?',
          options: ['GitHub', 'Postgres', 'Slack', 'Notion', 'Linear', 'Figma'],
          correctIndexes: [0, 1, 2, 3, 4, 5],
          explanation: 'Lesson "What is MCP?" — all six are named as community-built MCP integrations.',
        },
        {
          id: 'ch13-q03', type: 'single',
          prompt: 'Which file holds the per-PROJECT MCP server configuration that you commit and share with the team?',
          options: [
            '<code>~/.claude.json</code>',
            '<code>.mcp.json</code> at the repo root',
            '<code>.claude/settings.json</code>',
            '<code>mcp.config.toml</code>',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Connecting MCP Servers" — <code>.mcp.json</code> is the project-level file; <code>~/.claude.json</code> is the user-level alternative.',
        },
        {
          id: 'ch13-q04', type: 'single',
          prompt: 'After adding an MCP server, how do you VERIFY it actually connected?',
          options: [
            'Run <code>/mcp</code> — it lists connected servers and their tools',
            'Run <code>/status</code>',
            'Check <code>.claude/mcp.log</code>',
            'No way to verify — assume it worked',
          ],
          correctIndexes: [0],
          explanation: 'Lesson "Connecting MCP Servers" — <code>/mcp</code> is the verification surface.',
        },
        {
          id: 'ch13-q05', type: 'single',
          prompt: 'You\'re wiring an MCP that touches a production database. The lesson\'s explicit safety advice?',
          options: [
            'Run with admin credentials so everything works',
            'Use read-only credentials for production databases',
            'Use the same creds as production cron jobs',
            'Disable <code>/mcp</code> after setup',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Connecting MCP Servers" — production DBs: read-only creds, no exceptions in the lesson.',
        },
        {
          id: 'ch13-q06', type: 'single',
          prompt: 'How do you add a hosted (HTTP) MCP server from the CLI?',
          options: [
            '<code>claude mcp add &lt;name&gt;</code> — a bare name installs it from the registry',
            '<code>claude mcp add --transport http &lt;name&gt; &lt;url&gt;</code>',
            '<code>claude install mcp &lt;name&gt;</code>',
            '<code>npm i -g claude-mcp-&lt;name&gt;</code>',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Connecting MCP Servers" — there is no bare-name registry install. You add a server by URL (<code>--transport http &lt;name&gt; &lt;url&gt;</code>) or by launch command (<code>&lt;name&gt; -- &lt;command&gt;</code>).',
        },
        {
          id: 'ch13-q07', type: 'multi',
          prompt: 'Per the use-cases lesson, which of these would naturally use a database MCP server?',
          options: [
            '"Show schema for orders table"',
            '"Write a migration to add deleted_at to products"',
            '"What indexes exist on users?"',
            '"Summarize the company\'s vision deck"',
          ],
          correctIndexes: [0, 1, 2],
          explanation: 'Lesson "Common MCP Use Cases" — first three are the listed database-MCP examples; vision-deck summarization is unrelated.',
        },
        {
          id: 'ch13-q08', type: 'single',
          prompt: 'What clever pattern does the lesson highlight for combining Business Brain + MCP?',
          options: [
            'Store CLAUDE.md inside the MCP server',
            'Expose your Business Brain as a searchable MCP server so only RELEVANT sections come back, instead of loading whole files into context',
            'Replace the Business Brain with a vector DB',
            'Cache the Business Brain to disk',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Common MCP Use Cases" — searchable BB index scales the pattern without ballooning tokens.',
        },
        {
          id: 'ch13-q09', type: 'multi',
          prompt: 'Which official SDKs does Anthropic provide for writing your own MCP server?',
          options: ['TypeScript', 'Python', 'Go', 'Rust'],
          correctIndexes: [0, 1],
          explanation: 'Lesson "Building a Simple MCP Server" — TypeScript and Python are the official SDKs named.',
        },
        {
          id: 'ch13-q10', type: 'single',
          prompt: 'When should you write your OWN MCP server vs. use a community one?',
          options: [
            'Always write your own — community ones are unsafe',
            'Use community servers for standard tools; only build your own for internal systems without an open-source alternative',
            'Always use the GitHub server',
            'Build your own only on weekends',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Building a Simple MCP Server" — community for standard, custom only for internal-without-alternatives.',
        },
        {
          id: 'ch13-q11', type: 'single',
          prompt: 'In an MCP server\'s <code>.mcp.json</code> entry, which fields appear under each server name?',
          options: [
            '<code>url</code>, <code>port</code>, <code>token</code>',
            '<code>command</code>, <code>args</code>, optional <code>env</code>',
            '<code>language</code>, <code>handler</code>',
            'Just <code>endpoint</code>',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Connecting MCP Servers" — <code>command</code> + <code>args</code> (and an optional <code>env</code>) are the standard fields.',
        },
      ],
    },
  },

  // ── Chapter 14 ────────────────────────────────────────────────────────────
  {
    id: 'ch14',
    title: 'Subagents & Delegation',
    subtitle: 'Week 14 — Many Hands, One Orchestrator',
    icon: '🧑‍🤝‍🧑',
    xpReward: 480,
    lessons: [
      {
        id: 'ch14-l01', title: 'Sam Okoye and the Dispatch Board', xpReward: 115, videos: [],
        lastVerified: '2026-06-14',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>"I Don't Type — I Dispatch"</h2>
<figure class="lesson-figure"><img src="https://mintcdn.com/claude-code/1B48Qz2Z9hac4SLG/images/agent-view-light.png?fit=max&auto=format&n=1B48Qz2Z9hac4SLG&q=85&s=7a186c96ed47d6700d084d77e786be65" alt="Claude Code agent view in a terminal showing many background subagent sessions grouped under 'Needs input', 'Working', and 'Completed', with a dispatch input at the bottom" loading="lazy"/><figcaption>Screenshot: Anthropic docs — Manage multiple agents with agent view.</figcaption></figure>
<p><em>Sam Okoye runs Engineering at Kedash. He waves you over to a wall-mounted board covered in coloured cards. "This is the Dispatch Board," he says. "Every card is a subagent. I don't type code anymore — I dispatch."</em></p>
<h3>What a subagent actually is</h3>
<p>A <strong>subagent</strong> is a separate Claude session that the main session spawns with the <code>Agent</code> (a.k.a. Task) tool. It has its own context window, its own tool set, and runs to completion before reporting back a single summary message.</p>
<p>That isolation is the point. The main session stays uncluttered; the subagent burns its own context on the messy details and only the result lands in your conversation.</p>
<h3>Where to use them</h3>
<ul>
  <li><strong>Open-ended search.</strong> "Find every call site of <code>OrderProcessor</code>" — would otherwise flood the parent context with file lists and excerpts.</li>
  <li><strong>Independent parallel work.</strong> Three doc files to refresh, none depending on the others — three subagents in one orchestrator message.</li>
  <li><strong>Specialist judgment.</strong> A code-review subagent, a security-review subagent — each with its own system prompt encoded in <code>.claude/agents/</code>.</li>
  <li><strong>Heavy reads.</strong> Anything that would otherwise burn 50k tokens just exploring before doing real work.</li>
</ul>
<h3>Where NOT to use them</h3>
<ul>
  <li>Single-file edits — just do them in the parent. Spawning a subagent costs latency and adds a hop.</li>
  <li>Tasks where you need to iterate. Subagents are one-shot: prompt → result. They don't sustain a conversation.</li>
  <li>Anything trivial. The parent can grep, read, and edit faster than a subagent can boot.</li>
</ul>`,
      },
      {
        id: 'ch14-l02', title: 'Custom Subagent Types in .claude/agents/', xpReward: 115, videos: [],
        lastVerified: '2026-06-24',
        verifiedAgainstVersion: 'v2.1.176',
        content: `<h2>Specialist Roles You Can Hire</h2>
<p>Beyond the built-in <em>general-purpose</em> and <em>Explore</em> subagents, you can define your own specialists in <code>.claude/agents/</code> (per project) or <code>~/.claude/agents/</code> (global).</p>
<h3>The agent file</h3>
<pre><code># .claude/agents/code-reviewer.md
---
name: code-reviewer
description: Reviews diffs for correctness, security, and style. Use when asked for a second opinion on a PR.
model: opus
tools: Read, Grep, Bash
---

You are a senior code reviewer at Kedash Corp. Read the diff in full,
then comment on:
  1. Correctness — does the change do what the PR says?
  2. Security — any input that reaches the DB or shell unvalidated?
  3. Style — does it match the surrounding code's conventions?

Be specific. Reference file:line. Don't hedge — give a verdict.</code></pre>
<h3>Three things to notice</h3>
<ul>
  <li><strong>name</strong> + <strong>description</strong> are how Claude Code (or you) picks this agent.</li>
  <li><strong>model</strong> pins the tier — code review gets Opus because correctness matters. A "doc-formatter" agent might pin Haiku.</li>
  <li><strong>tools</strong> restricts what this agent can do — a reviewer doesn't need <code>Write</code> or <code>Edit</code>. Write it as a <strong>comma-separated string</strong> (<code>tools: Read, Grep, Bash</code>), not a YAML list with brackets.</li>
</ul>
<h3>Listing and invoking</h3>
<pre><code>/agents                  # opens the picker — shows all available agent types
                          # (built-in + user + project)

# From the orchestrator, you ask for a specific subagent by name:
"Use the code-reviewer subagent to review the changes on this branch."</code></pre>
<h3>Hiring philosophy</h3>
<p>Sam taps the dispatch board. "I treat each subagent file like a job description. Two paragraphs explaining what the role does, what its working style is, and what it must not do. If you can't write the description, you're not ready to delegate the work."</p>`,
      },
      {
        id: 'ch14-l03', title: 'Parallel vs Sequential Dispatch', xpReward: 115, videos: [],
        lastVerified: '2026-05-30',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>The Dependency Question</h2>
<p>Before spawning anything, ask: <strong>does subagent B need subagent A's output?</strong></p>
<ul>
  <li><strong>No</strong> → fire both in <em>one</em> orchestrator message. They run concurrently. The parent receives both summaries when both finish.</li>
  <li><strong>Yes</strong> → run A first, read its result, then prompt B with what you learned. Don't batch dependents.</li>
</ul>
<h3>Parallel dispatch — one message, multiple Agent calls</h3>
<pre><code>Spawn three subagents in parallel:
  1. Audit translations under i18n/en/* for missing keys.
  2. Audit translations under i18n/fr/* for missing keys.
  3. Audit translations under i18n/de/* for missing keys.
Each is an independent file tree. Wait for all three reports.</code></pre>
<p>In tool terms, the orchestrator emits three <code>Agent</code> tool calls in a single response. The harness runs them concurrently and the summaries arrive together.</p>
<h3>Sequential dispatch — one waits on the other</h3>
<pre><code>1. Dispatch Explore subagent: "find every place we read DATABASE_URL".
2. [Wait for result list.]
3. Dispatch general-purpose subagent: "wrap each of those reads
   with the new SecretsClient.fetch() helper".</code></pre>
<p>You couldn't have started step 3 without step 1's findings — sequential is the only safe shape.</p>
<h3>Background vs foreground</h3>
<p>Subagents can also run in the background (<code>run_in_background: true</code>). Foreground when you need the result to proceed. Background when the work is genuinely independent and you want to keep moving — you'll be notified when it finishes, without having to poll.</p>
<h3>Diminishing returns</h3>
<p>More than ~5 parallel subagents on the same project tends to cause merge collisions, duplicated exploration, and a flood of summary text in the parent. Sam's rule: <em>"three on the board at once, max. If you need more, the task isn't decomposed cleanly yet."</em></p>`,
      },
      {
        id: 'ch14-l04', title: 'Multi-Session Command Center', xpReward: 135, videos: ['<iframe src="https://www.youtube.com/embed/t5dpuXto-AM" title="Claude Code Agent Teams: Install, Build &amp; Run Them in Parallel" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'],
        lastVerified: '2026-05-30',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>When Subagents Aren't Enough</h2>
<p>Subagents run inside a single parent session. For long-lived, human-supervised parallel streams — different repos, different goals, different review rhythms — you graduate to a multi-session <strong>Command Center</strong>: several Claude sessions in tmux panes, each independent.</p>
<pre><code>TODO          IN PROGRESS                AWAITING REVIEW
─────────     ──────────────────         ───────────────
Auth docs     API tests (pane 1)         DB migration
              Feature X docs (pane 2)    (pane 3)
              Translations (pane 3)</code></pre>
<h3>Subagents vs sessions — when to use which</h3>
<ul>
  <li><strong>Subagent</strong>: bounded task that returns one summary. Lives inside the parent. Cheap to spawn.</li>
  <li><strong>Session</strong>: long-running, multi-prompt work with its own history. Survives detach via tmux.</li>
</ul>
<h3>Human checkpoints across the board</h3>
<p>With three sessions active, you're not <em>in</em> any one of them — you're scanning the board, deciding where attention is needed. Place a checkpoint wherever:</p>
<ul>
  <li>The output feeds another stream.</li>
  <li>A judgement call is needed.</li>
  <li>The action is irreversible (a push, a migration, a delete).</li>
  <li>A wrong output could compound through later work.</li>
</ul>
<pre><code>## Checkpoint: Before pushing
Summarise what changed. Wait for explicit approval before running git push.</code></pre>
<h3>Review rhythm</h3>
<p>Sam's number: <em>check each pane every 15–30 minutes, or when it signals it's waiting</em>. Decisions are fast — unblock, redirect, move on. You're not reading every line of every diff; you're doing spot reviews and judgement calls.</p>`,
      },
      {
        id: 'ch14-l05', title: 'Agent Teams (Experimental)', xpReward: 120, videos: [],
        lastVerified: '2026-08-26',
        verifiedAgainstVersion: 'v2.1.246',
        content: `<h2>When Reporting Back Isn't Enough</h2>
<p>Everything in this chapter so far has been about <strong>subagents</strong>: you dispatch one, it works in its own context, it reports a result back to you. That shape fits most delegation. It has one limit — subagents can't really talk to each other, so any coordination has to route through the main session.</p>
<p><strong>Agent teams</strong> are the other shape. Teammates are full, independent Claude Code sessions that message each other directly and claim work from a shared task list. Your session becomes the team lead.</p>
<div class="callout"><strong>Experimental, and off by default.</strong> Agent teams ship disabled. Turn them on with <code>CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1</code> in your environment or the <code>env</code> block of <code>settings.json</code>. Expect rough edges — resumed sessions don't restore in-process teammates, and shutdown can be slow. Don't build a critical workflow on this yet.</div>
<h3>Subagents or a team?</h3>
<table><thead><tr><th></th><th>Subagents</th><th>Agent teams</th></tr></thead><tbody>
  <tr><td><strong>Communication</strong></td><td>Return a result to whoever called them</td><td>Teammates message each other directly</td></tr>
  <tr><td><strong>Coordination</strong></td><td>The main agent manages all the work</td><td>Self-coordinating, via a shared task list</td></tr>
  <tr><td><strong>Best for</strong></td><td>Focused tasks where only the result matters</td><td>Work that needs discussion and disagreement</td></tr>
  <tr><td><strong>Token cost</strong></td><td>Lower — results are summarised back</td><td>Much higher — each teammate is a whole session</td></tr>
</tbody></table>
<h3>Starting one</h3>
<p>There is no command. You ask, in plain language, and the lead spawns them:</p>
<pre><code>Spawn three teammates to review PR #142:
  - one focused on security implications
  - one checking performance impact
  - one validating test coverage
Have them each review and report findings.</code></pre>
<p>Teammates appear in the agent panel under your prompt. Arrow keys select one, <kbd>Enter</kbd> opens its transcript so you can message it directly, <kbd>Esc</kbd> interrupts it.</p>
<h3>The use case that actually justifies the cost</h3>
<p>A single agent investigating a bug tends to find one plausible explanation and stop — classic anchoring. A team can be pointed at each other instead:</p>
<pre><code>Spawn 5 teammates to investigate different hypotheses for this outage.
Have them talk to each other to try to disprove each other's theories,
like a scientific debate. Update the findings doc with the consensus.</code></pre>
<p>The theory that survives four teammates actively trying to kill it is far more likely to be the real root cause. That adversarial structure — not the parallelism — is what you're paying the extra tokens for.</p>
<h3>Practical limits</h3>
<ul>
  <li><strong>Start with 3–5.</strong> Coordination overhead grows faster than throughput; three focused teammates beat five scattered ones.</li>
  <li><strong>Give each one different files.</strong> Two teammates editing the same file overwrite each other.</li>
  <li><strong>They don't inherit your conversation.</strong> A teammate loads CLAUDE.md, skills and MCP servers like any session, but knows nothing of what you and the lead discussed — put the context in the spawn prompt.</li>
  <li><strong>Start with read-only work.</strong> Reviews and investigations show the value without the file-conflict problems of parallel implementation.</li>
</ul>
<p>Three hooks exist specifically to police a team: <code>TeammateIdle</code>, <code>TaskCreated</code> and <code>TaskCompleted</code> (Chapter 15). Exit code 2 from any of them sends feedback and blocks the transition — that's how you enforce "no task is complete until the tests pass".</p>`,
      },
    ],
    practicalTest: {
      id: 'ch14-test',
      scenarioType: 'slack', scenarioFrom: 'Sam Okoye', scenarioRole: 'Engineering Team Lead', scenarioAvatar: '🧑🏾‍💼',
      scenario: 'New dispatch from the board: I need a `code-reviewer` subagent defined in `.claude/agents/`, AND I need you to actually use it. Then show me a parallel run.\n\nThree sections:\n\n1. `## Agent file` — paste the contents of `.claude/agents/code-reviewer.md` you wrote (with frontmatter: name, description, model, tools).\n2. `## Single dispatch` — paste the orchestrator prompt that invokes that subagent, plus the summary it returned.\n3. `## Parallel dispatch` — show ONE orchestrator message spawning two or three independent subagents at once (audit different folders, summarise different files — pick anything truly independent), and the summaries that came back.\n\nIf you spawn parallel subagents that secretly depend on each other, I will know. Pick genuinely independent work.',
      task: 'Paste the agent file, a single dispatch, and a parallel dispatch with returned summaries.',
      hint: 'Agent file needs `name:`, `description:`, ideally `model:` and `tools:`. Single dispatch = one Task/Agent call. Parallel = ≥2 Agent calls in one orchestrator turn. Mention `/agents` if you used the picker.',
      minLength: 0, passThreshold: 85, xpReward: 675,
      criteria: [
        { type: 'keyword', value: ['## Agent file', '## Single dispatch', '## Parallel dispatch'], description: 'All three sections present', weight: 1 },
        { type: 'keyword', value: ['name:', 'description:'], description: 'Agent file has frontmatter', weight: 2 },
        { type: 'keyword', value: ['.claude/agents', 'agents/'], description: 'Stored in the correct directory', weight: 2 },
        { type: 'keyword', value: ['code-reviewer', 'reviewer'], description: 'Reviewer subagent named', weight: 2 },
        { type: 'keyword', value: ['parallel', 'concurrently', 'at the same time', 'in one message', 'one turn'], description: 'Shows parallel intent', weight: 2 },
        { type: 'keyword', value: ['task', 'agent', 'subagent', 'dispatch'], description: 'Names the dispatch mechanism', weight: 1 },
        { type: 'keyword', value: ['independent', 'no dependency', 'not depend', 'separate'], description: 'Justifies independence for parallel work', weight: 2 },
        { type: 'keyword', value: ['/agents', 'model:', 'tools:'], description: 'Uses picker or pins model/tools', weight: 1 },
      ],
      exemplar: '<p>Strong answer: a code-reviewer agent file in <code>.claude/agents/</code> with name/description/model:opus/tools restricted to read-only; a single dispatch invoking that reviewer and its terse verdict; and a parallel dispatch with 2–3 Agent calls in one orchestrator turn working on genuinely independent scopes (e.g., three locale folders, or three unrelated docs files) with each summary printed back.</p>',
    },
    theoreticalTest: {
      id: 'ch14-test-mcq', passThreshold: 80, xpReward: 675, drawCount: 6,
      questionPool: [
        {
          id: 'ch14-q01', type: 'single',
          prompt: 'In one sentence, what is a subagent?',
          options: [
            'A keyboard shortcut for /agents',
            'A separate Claude session the main session spawns with the Agent (Task) tool — its own context window, its own tools, runs to completion, reports back a single summary',
            'A built-in skill that always runs',
            'A model variant smaller than Haiku',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Sam Okoye and the Dispatch Board" — that\'s the precise definition.',
        },
        {
          id: 'ch14-q02', type: 'single',
          prompt: 'Why does the lesson emphasize that subagents have their OWN context window?',
          options: [
            'It makes the bill cheaper',
            'Isolation is the point — the parent stays uncluttered while the subagent burns its own context on messy details; only the summary lands upstream',
            'Subagents bypass <code>/clear</code>',
            'Subagents always run on Haiku',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Sam Okoye and the Dispatch Board" — isolation = uncluttered parent + clean summary.',
        },
        {
          id: 'ch14-q03', type: 'multi',
          prompt: 'Which of these are listed as GOOD subagent use cases?',
          options: [
            'Open-ended search (e.g. "find every call site of OrderProcessor")',
            'Independent parallel work (multiple unrelated tasks)',
            'Specialist judgment (code-review, security-review)',
            'Heavy reads that would otherwise burn 50k tokens just exploring',
            'A single-file edit you could do in 5 seconds in the parent',
          ],
          correctIndexes: [0, 1, 2, 3],
          explanation: 'Lesson "Sam Okoye and the Dispatch Board" — first four are listed; the single-file edit is in the "don\'t" column.',
        },
        {
          id: 'ch14-q04', type: 'multi',
          prompt: 'Which of these are described as situations to NOT use a subagent?',
          options: [
            'Single-file edits — just do them in the parent',
            'Tasks where you need to iterate — subagents are one-shot, no sustained conversation',
            'Trivial work where the parent can grep/read/edit faster than a subagent boots',
            'Architecture review across 30 files',
          ],
          correctIndexes: [0, 1, 2],
          explanation: 'Lesson "Sam Okoye and the Dispatch Board" — first three are explicit don\'ts; the cross-file review is exactly the use case.',
        },
        {
          id: 'ch14-q05', type: 'single',
          prompt: 'You\'re defining a code-reviewer subagent. Where does its definition file live for a per-project setup?',
          options: [
            '<code>~/.claude/skills/</code>',
            '<code>.claude/agents/</code> at the repo root',
            '<code>.claude/settings.json</code>',
            '<code>.mcp.json</code>',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Custom Subagent Types in .claude/agents/" — per-project agents live in <code>.claude/agents/</code>.',
        },
        {
          id: 'ch14-q06', type: 'multi',
          prompt: 'Which fields appear in a subagent\'s frontmatter, per the lesson example?',
          options: ['name', 'description', 'model', 'tools', 'price'],
          correctIndexes: [0, 1, 2, 3],
          explanation: 'Lesson "Custom Subagent Types in .claude/agents/" — name, description, model, tools; no "price".',
        },
        {
          id: 'ch14-q07', type: 'single',
          prompt: 'Three tasks: audit i18n/en/* keys, audit i18n/fr/* keys, audit i18n/de/* keys. They don\'t depend on each other. Best dispatch shape?',
          options: [
            'Three sequential subagent calls',
            'Three Agent calls in ONE orchestrator message — they run concurrently, summaries arrive together',
            'One subagent doing all three serially',
            'Three separate Claude sessions in different terminals',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Parallel vs Sequential Dispatch" — independent work → parallel in one message.',
        },
        {
          id: 'ch14-q08', type: 'single',
          prompt: 'Step 2 needs the output of step 1 (e.g. "find every DATABASE_URL read" → "wrap each with SecretsClient.fetch()"). What\'s the right dispatch?',
          options: [
            'Parallel — let the second subagent guess at step 1\'s answer',
            'Sequential — run A first, read its result, then prompt B with what you learned; never batch dependents',
            'Run them in two terminals at once',
            'Skip subagents and do it manually',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Parallel vs Sequential Dispatch" — dependent work is sequential, full stop.',
        },
        {
          id: 'ch14-q09', type: 'single',
          prompt: 'Sam\'s rule of thumb for parallelism — what\'s his upper bound?',
          options: [
            '~5 in parallel',
            'Three on the board at once, max — more means the task isn\'t decomposed cleanly yet',
            'As many as your CPU has cores',
            'Always one at a time',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Parallel vs Sequential Dispatch" — Sam\'s "three on the board" rule is the named heuristic.',
        },
        {
          id: 'ch14-q10', type: 'single',
          prompt: 'Subagents vs Sessions — when do you graduate to a multi-session Command Center?',
          options: [
            'Whenever Sonnet is too slow',
            'For long-lived, human-supervised parallel streams — different repos, different goals, different review rhythms',
            'When MCP isn\'t enough',
            'For anything taking more than 10 minutes',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Multi-Session Command Center" — sessions are for long-lived parallel streams that need their own histories.',
        },
        {
          id: 'ch14-q11', type: 'multi',
          prompt: 'Where does the lesson tell you to PLACE human checkpoints across a multi-session board?',
          options: [
            'Where one stream\'s output feeds another',
            'Where a judgement call is needed',
            'Before any irreversible action (push, migration, delete)',
            'Where a wrong output could compound through later work',
            'On every single tool call',
          ],
          correctIndexes: [0, 1, 2, 3],
          explanation: 'Lesson "Multi-Session Command Center" — those four are the explicit checkpoint triggers; "every tool call" is over-broad.',
        },
      ],
    },
  },

  // ── Chapter 15 ────────────────────────────────────────────────────────────
  {
    id: 'ch15',
    title: 'Settings, Permissions & Hooks',
    subtitle: 'Week 15 — Guardrails for the Platform Team',
    icon: '🛡️',
    xpReward: 520,
    lessons: [
      {
        id: 'ch15-l01', title: 'Rena Vasquez and the Three settings.json Files', xpReward: 130, videos: [],
        lastVerified: '2026-05-30',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>Where Claude Code Reads its Rules</h2>
<p><em>Rena Vasquez — Platform Engineering — slides a security badge across the table. "Welcome to the Guardrail Lab. Everything we build in here is about one question: what is Claude Code allowed to do, on which machine, on whose behalf?"</em></p>
<h3>Three locations, in precedence order</h3>
<p>Claude Code merges settings from three layers. Later layers <em>override</em> earlier ones on conflict.</p>
<ol>
  <li><strong>User</strong> — <code>~/.claude/settings.json</code> — your personal defaults across every project on this machine.</li>
  <li><strong>Project (shared)</strong> — <code>.claude/settings.json</code> at the repo root — committed to git, applies to everyone who clones.</li>
  <li><strong>Project (local)</strong> — <code>.claude/settings.local.json</code> at the repo root — gitignored, your personal overrides for this project.</li>
</ol>
<p>The local file always wins. The shared project file overrides your user defaults. Your user defaults are the baseline.</p>
<h3>What lives in settings.json</h3>
<ul>
  <li><strong>permissions</strong> — which tools / which commands are auto-allowed, asked, or denied.</li>
  <li><strong>hooks</strong> — shell commands wired to lifecycle events.</li>
  <li><strong>env</strong> — environment variables injected into every Bash call.</li>
  <li><strong>model</strong> — pin a default model for this project (e.g. <code>"claude-opus-5"</code>).</li>
  <li><strong>statusLine</strong> — a custom command that produces the prompt status string.</li>
  <li><strong>outputStyle</strong> — pick an output style (Concise / Explanatory / Learning / Proactive).</li>
</ul>
<h3>What does NOT live here</h3>
<p>MCP server configs go in <code>.mcp.json</code>, not <code>settings.json</code>. Skills go in <code>.claude/skills/</code>. Subagents go in <code>.claude/agents/</code>. Don't try to stuff them into settings — they're separate files for a reason.</p>`,
      },
      {
        id: 'ch15-l02', title: 'Permissions: Allow, Ask, Deny', xpReward: 130, videos: [],
        lastVerified: '2026-08-26',
        verifiedAgainstVersion: 'v2.1.246',
        content: `<h2>The Three Permission Verbs</h2>
<div class="term-shot term-shot--editor" data-shot="ch15-l02"><div class="term-shot-bar"><span class="ts-dot ts-r"></span><span class="ts-dot ts-y"></span><span class="ts-dot ts-g"></span><span class="term-shot-title">.claude/settings.json</span></div><div class="term-shot-body">{
  "permissions": {
    <span class="ts-ok">"allow"</span>: [
      "Read",
      "Bash(npm test:*)",
      "Bash(git diff:*)"
    ],
    <span class="ts-gold">"ask"</span>: [
      "Bash(git push:*)",
      "WebFetch"
    ],
    <span class="ts-bad">"deny"</span>: [
      "Read(./.env)",
      "Bash(rm -rf:*)"
    ]
  }
}</div><div class="term-shot-cap">Simulated editor view — the three verbs every rule resolves to.</div></div>
<p>Every tool call Claude Code wants to make is matched against your permission rules and resolved into one of three outcomes:</p>
<ul>
  <li><strong>allow</strong> — runs immediately, no prompt.</li>
  <li><strong>ask</strong> — you get a confirmation prompt; default for anything not explicitly listed.</li>
  <li><strong>deny</strong> — silently blocked, with an explanation in the transcript.</li>
</ul>
<h3>Rule syntax — tools and matchers</h3>
<pre><code>{
  "permissions": {
    "allow": [
      "Read",
      "Edit",
      "Bash(npm test:*)",
      "Bash(git status:*)",
      "Bash(git diff:*)"
    ],
    "ask": [
      "Bash(git push:*)",
      "Bash(rm:*)"
    ],
    "deny": [
      "Bash(rm -rf /:*)",
      "Bash(curl * | sh:*)",
      "Read(./.env)",
      "Read(./secrets/**)"
    ]
  }
}</code></pre>
<p>Tool-only matchers (<code>"Read"</code>) cover every invocation of that tool. <code>Tool(pattern)</code> matchers restrict by argument — most common with <code>Bash</code> where the pattern is a glob on the command. <code>Read(./.env)</code> and similar restrict file access by path.</p>
<h3>The six permission modes</h3>
<p>Pass one with <code>--permission-mode</code>, or set <code>defaultMode</code> in a settings file:</p>
<ul>
  <li><code>default</code> — labelled <strong>Manual</strong> in the UI (<code>manual</code> works as an alias). Prompts on first use of each tool.</li>
  <li><code>acceptEdits</code> — auto-accepts file edits and common filesystem commands (<code>mkdir</code>, <code>touch</code>, <code>mv</code>, <code>cp</code>) inside your working directories; shell still asks.</li>
  <li><code>plan</code> — read-only exploration, no writes to your source. Chapter 12.</li>
  <li><code>auto</code> — auto-approves tool calls, with a classifier model checking each one first.</li>
  <li><code>dontAsk</code> — the inverse of auto: anything not pre-approved by <code>/permissions</code> or an <code>allow</code> rule is auto-<strong>denied</strong> instead of queued for you.</li>
  <li><code>bypassPermissions</code> — disables all gating. Dangerous — isolated container/VM only.</li>
</ul>
<h3>Auto mode, and why it isn't "yes to everything"</h3>
<p>Auto mode deserves real attention, because on Pro, Max and Team plans it is where your sessions <strong>start</strong>. It does not blanket-approve. A separate classifier model reviews each action before it runs and blocks anything that escalates beyond what you asked for, touches infrastructure it doesn't recognise, or looks driven by hostile content Claude read in a file or a web page. That last case is the point: it is a guard against prompt injection, not merely a convenience.</p>
<p>Two things still cut through it — your explicit <code>ask</code> rules always force a prompt, and <code>deny</code> rules always win. So the pattern that actually works is to run in auto mode and spend your effort on a short, sharp <code>deny</code>/<code>ask</code> list, rather than on approving every <code>ls</code>.</p>
<p>To remove it for a machine, or org-wide via managed settings, set <code>permissions.disableAutoMode</code> to <code>"disable"</code>. The matching switch for bypass is <code>permissions.disableBypassPermissionsMode</code>.</p>
<div class="callout"><strong>Deprecated.</strong> The old <code>--enable-auto-mode</code> flag was retired in <code>v2.1.111</code> — use <code>--permission-mode auto</code>.</div>
<h3>Managing rules live</h3>
<pre><code>/permissions             # opens the interactive picker
/permissions list        # show current resolved rules
/permissions add deny "Bash(git push --force:*)"</code></pre>
<p>Rena's lab rule: <em>"Default to <code>ask</code>. Only promote to <code>allow</code> after you've watched the same prompt three times in a row. Only <code>deny</code> the things that can ruin a Friday."</em></p>`,
      },
      {
        id: 'ch15-l03', title: 'Claude Code Hook Events', xpReward: 130, videos: ['<iframe src="https://www.youtube.com/embed/Q4gsvJvRjCU" title="How Claude Code Hooks Save Me HOURS Daily" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'],
        lastVerified: '2026-08-26',
        verifiedAgainstVersion: 'v2.1.246',
        content: `<h2>Wire Shell Commands to Lifecycle Events</h2>
<p>Hooks let you run arbitrary shell commands at specific moments. There are <strong>more than 30 hook events</strong> covering every phase of a Claude Code session, and the set keeps growing — recent additions include <code>Setup</code>, <code>PostToolUseFailure</code>, <code>PermissionRequest</code>, <code>Elicitation</code>, and <code>SessionEnd</code>. The most useful clusters:</p>
<h3>Tool lifecycle</h3>
<ul>
  <li><code>PreToolUse</code> — before a tool runs. Can block by exiting non-zero with a message.</li>
  <li><code>PostToolUse</code> — after a tool completes. Lint, format, type-check.</li>
</ul>
<h3>Conversation lifecycle</h3>
<ul>
  <li><code>UserPromptSubmit</code> — before each user message is processed.</li>
  <li><code>Stop</code> — when Claude Code finishes responding.</li>
  <li><code>Notification</code> — when Claude wants attention (e.g. permission prompt).</li>
</ul>
<h3>Session lifecycle</h3>
<ul>
  <li><code>SessionStart</code> / <code>SessionEnd</code> — bookend the whole session.</li>
  <li><code>PreCompact</code> / <code>PostCompact</code> — around <code>/compact</code>.</li>
</ul>
<h3>Subagent lifecycle</h3>
<ul>
  <li><code>SubagentStart</code> / <code>SubagentStop</code> — when a subagent spawns/finishes.</li>
</ul>
<h3>Permissions and instructions</h3>
<ul>
  <li><code>PermissionRequest</code> — a tool call needs a permission decision.</li>
  <li><code>PermissionDenied</code> — <strong>auto mode declined an action</strong>. This is how you see what the classifier is blocking; without it, auto mode is a black box.</li>
  <li><code>InstructionsLoaded</code> — a <code>CLAUDE.md</code> or <code>.claude/rules/*.md</code> file was loaded. The documented way to answer "why isn't Claude following my CLAUDE.md" — it logs exactly which instruction files loaded, when, and why. See Chapter 3.</li>
</ul>
<h3>Concrete example — auto-format on save</h3>
<pre><code>{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "jq -r '.tool_input.file_path' | xargs -r npx prettier --write" }
        ]
      }
    ]
  }
}</code></pre>
<p>Every <code>Edit</code> or <code>Write</code> tool call triggers Prettier on the file just touched. Hooks receive their context as a <strong>JSON object on stdin</strong> — not via environment variables. Key fields: <code>tool_name</code>, <code>tool_input</code> (which carries <code>file_path</code> for <code>Edit</code>/<code>Write</code>), <code>session_id</code>, and <code>hook_event_name</code>. Parse it with a tool like <code>jq</code> (as above) to pull out what you need.</p>
<h3>Blocking with PreToolUse</h3>
<pre><code>{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": ".claude/hooks/block-prod-db.sh" }
        ]
      }
    ]
  }
}</code></pre>
<p>If <code>block-prod-db.sh</code> exits non-zero with output on stderr, the tool call is blocked and the message is shown to Claude — which can re-plan around the block.</p>
<h3>Hooks aren't only shell commands</h3>
<p>Every example above uses <code>"type": "command"</code>, which is the one you'll reach for most. But a handler can also be <code>http</code> (POST to a URL), <code>mcp_tool</code> (call a tool on a connected MCP server — Chapter 13), <code>prompt</code> (hand the decision to Claude), or <code>agent</code> (spawn a subagent; experimental). A <code>prompt</code> handler is the pragmatic choice when the rule you want to enforce is a judgement call rather than a pattern match.</p>
<h3>Hook hygiene</h3>
<p>Hooks run in your shell with your privileges. Treat them like git pre-commit hooks: keep them fast, idempotent, and clearly named under <code>.claude/hooks/</code> in the repo. A 5-second hook on <code>PostToolUse</code> turns every edit into a 5-second wait.</p>`,
      },
      {
        id: 'ch15-l04', title: 'Status Line, Output Styles & Headless Mode', xpReward: 130, videos: [],
        lastVerified: '2026-08-26',
        verifiedAgainstVersion: 'v2.1.246',
        content: `<h2>The Polish Layer</h2>
<p>Three knobs that turn Claude Code from a tool into <em>your</em> tool: a status line, an output style, and a headless CLI for scripts.</p>
<h3>Status line</h3>
<p>The status line is the single line shown above the prompt. By default it shows the model, working directory, and a few stats. You can replace it with the output of any shell command:</p>
<pre><code>{
  "statusLine": {
    "type": "command",
    "command": ".claude/hooks/statusline.sh"
  }
}</code></pre>
<p>Inside the script you have access to the current model, git branch, session cost so far, and more — via environment variables. Common patterns: show the branch + a "⚠ prod" badge when the repo is the production checkout; show the running spend in £ when you want to feel the meter.</p>
<h3>Output styles</h3>
<p>Output styles change Claude Code's <em>system prompt</em> — its role, tone, and default response format. The built-ins are <code>Default</code>, <code>Proactive</code>, <code>Concise</code>, <code>Explanatory</code> and <code>Learning</code>.</p>
<pre><code>{ "outputStyle": "Concise" }     // settings.json — the durable way
/config                           // then pick "Output style" from the menu</code></pre>
<div class="callout"><strong>There is no <code>/output-style</code> command.</strong> It was deprecated in <code>v2.1.73</code> and removed in <code>v2.1.91</code>. Use <code>/config</code>, or set <code>outputStyle</code> in a settings file. The feature itself is very much alive — only the standalone command went away.</div>
<p>An output style is read once, at session start, so a change takes effect after <code>/clear</code> or in your next session — not immediately.</p>
<p>You can also author custom styles in <code>.claude/output-styles/</code> — each a markdown file with frontmatter and rules ("never use emoji", "always cite file:line", "end with a one-sentence summary"). One field matters more than the rest: <code>keep-coding-instructions: true</code> keeps Claude Code's built-in software-engineering behaviour and layers your voice on top. Leave it out and you drop that behaviour entirely — right for a writing assistant, wrong for a coding session that just needs a house style.</p>
<h3>Headless / CI mode</h3>
<p><code>claude -p "..."</code> runs Claude Code in non-interactive mode: takes one prompt, returns one response, exits. This is the building block for CI hooks, cron jobs, GitHub Actions, and Synology Task Scheduler invocations.</p>
<pre><code>claude -p "review the diff between main and HEAD" \\
       --model claude-opus-5 \\
       --permission-mode plan \\
       --output-format json \\
       &gt; review.json</code></pre>
<ul>
  <li><code>--permission-mode plan</code> ensures CI can't accidentally mutate anything.</li>
  <li><code>--output-format json</code> gives a parseable result with cost + duration.</li>
  <li>Auth comes from <code>ANTHROPIC_API_KEY</code> in the environment — no interactive login.</li>
</ul>
<h3>IDE integration</h3>
<p>Claude Code ships VS Code and JetBrains plugins that bridge the in-IDE chat to the same CLI session — every setting above applies. The plugin reads <code>settings.json</code> from the same paths, so guardrails carry over.</p>`,
      },
    ],
    practicalTest: {
      id: 'ch15-test',
      scenarioType: 'email', scenarioFrom: 'Rena Vasquez', scenarioRole: 'Platform Engineer, InfoSec', scenarioAvatar: '🛡️',
      scenario: 'From: rena.vasquez@kedashcorp.com\nSubject: Lock down a new project before it goes near prod\n\nNew project landing on your machine. Before anyone runs Claude in it, set up the guardrails. I want to see:\n\n1. `## settings.json` — a real project-level `.claude/settings.json` with: at least 3 `allow` rules, 2 `ask` rules, and 2 `deny` rules covering an obviously dangerous shell pattern and a secrets path.\n2. `## Hook` — a `PostToolUse` hook that runs your linter/formatter on edited files. Show the JSON block AND the script (or one-liner) it points at.\n3. `## Headless run` — the exact `claude -p ...` command you would put into CI for a nightly diff review, with `--permission-mode plan` and explicit model.\n4. `## Status line` — a `statusLine` config that calls a small script, plus the script (3–6 lines is fine) showing what it prints.\n\nReal config, not pseudocode. If the JSON doesn\'t parse, it doesn\'t count.\n\nThis is the part of the program where I decide whether you ever see floor M— whether you ever see a production credential. Same thing. Real config. No pseudocode.',
      task: 'Paste settings.json, the PostToolUse hook + script, the headless run command, and the statusLine config + script.',
      hint: 'permissions has allow/ask/deny arrays. Hooks live under `hooks.PostToolUse[].hooks[].command`. Headless uses `claude -p`. statusLine has `type: command` + `command`.',
      minLength: 0, passThreshold: 85, xpReward: 725,
      criteria: [
        { type: 'keyword', value: ['## settings.json', '## Hook', '## Headless', '## Status'], description: 'All four sections present', weight: 1 },
        { type: 'keyword', value: ['allow', 'ask', 'deny'], description: 'All three permission buckets shown', weight: 2 },
        { type: 'keyword', value: ['Bash(', 'Read(', 'Edit('], description: 'Real tool(pattern) matchers used', weight: 2 },
        { type: 'keyword', value: ['.env', 'secrets', 'rm -rf', '--force', 'curl'], description: 'Deny covers a real dangerous pattern', weight: 2 },
        { type: 'keyword', value: ['PostToolUse'], description: 'PostToolUse hook present', weight: 2 },
        { type: 'keyword', value: ['Edit|Write', 'Edit', 'Write'], description: 'Hook matcher targets edits', weight: 1 },
        { type: 'keyword', value: ['claude -p', 'claude --print', '-p '], description: 'Headless invocation shown', weight: 2 },
        { type: 'keyword', value: ['--permission-mode plan', 'permission-mode'], description: 'CI uses plan/read-only mode', weight: 2 },
        { type: 'keyword', value: ['--model'], description: 'CI pins a model explicitly', weight: 1 },
        { type: 'keyword', value: ['statusLine', 'status line'], description: 'statusLine block present', weight: 1 },
        { type: 'nonce', description: 'Compliance verification code echoed in the live session', improvement: 'Ask Claude to echo the KDQ verification code shown above, then paste the session output containing it.', weight: 3 },
      ],
      exemplar: '<p>Strong answer: a valid <code>.claude/settings.json</code> with permissions buckets (allow Read/Edit/safe bash; ask for git push and rm; deny rm -rf, curl-pipe-sh, and .env reads), a PostToolUse hook matching Edit|Write that calls a project-local format script, a CI command like <code>claude -p &quot;review diff&quot; --model claude-opus-5 --permission-mode plan --output-format json</code>, and a 4-line statusline script that prints branch + model + running cost.</p>',
    },
    theoreticalTest: {
      id: 'ch15-test-mcq', passThreshold: 80, xpReward: 725, drawCount: 6,
      questionPool: [
        {
          id: 'ch15-q01a', type: 'multi',
          prompt: 'Which of these files does Claude Code merge settings from? (Pick all that apply.)',
          options: [
            '<code>~/.claude/settings.json</code>',
            '<code>.claude/settings.json</code> at repo root',
            '<code>.claude/settings.local.json</code> at repo root',
            '<code>/etc/claude/settings.json</code>',
          ],
          correctIndexes: [0, 1, 2],
          explanation: 'Lesson "Rena Vasquez and the Three settings.json Files" — Claude Code reads three files: user (<code>~/.claude/settings.json</code>), project shared (<code>.claude/settings.json</code>, committed), and project local (<code>.claude/settings.local.json</code>, gitignored). There is no system-wide <code>/etc</code> layer.',
        },
        {
          id: 'ch15-q01b', type: 'single',
          prompt: 'When the three settings layers disagree on the same key, which one wins?',
          options: [
            '<code>~/.claude/settings.json</code>',
            '<code>.claude/settings.json</code> at repo root',
            '<code>.claude/settings.local.json</code> at repo root',
            'The first one read from disk, in alphabetical order',
          ],
          correctIndexes: [2],
          explanation: 'Lesson "Rena Vasquez and the Three settings.json Files" — the project-local file wins, then project-shared, then user. The local file is gitignored on purpose: it\'s the per-developer override layer.',
        },
        {
          id: 'ch15-q02', type: 'multi',
          prompt: 'Which of the following belong in <code>settings.json</code>?',
          options: [
            'permissions (allow / ask / deny)',
            'hooks (shell commands wired to lifecycle events)',
            'env (vars injected into every Bash call)',
            'a default model pin',
            'statusLine config',
            'outputStyle pick',
            'MCP server configuration',
          ],
          correctIndexes: [0, 1, 2, 3, 4, 5],
          explanation: 'Lesson "Rena Vasquez and the Three settings.json Files" — first six belong; MCP servers go in <code>.mcp.json</code>, not settings.json.',
        },
        {
          id: 'ch15-q03', type: 'multi',
          prompt: 'Which of the following are valid permission outcomes for a tool call?',
          options: [
            '<code>allow</code> — runs immediately, no prompt',
            '<code>ask</code> — confirmation prompt; default for anything not explicitly listed',
            '<code>deny</code> — silently blocked, explanation in transcript',
            '<code>warn</code> — runs but logs',
          ],
          correctIndexes: [0, 1, 2],
          explanation: 'Lesson "Permissions: Allow, Ask, Deny" — three verbs; "warn" is invented.',
        },
        {
          id: 'ch15-q04', type: 'single',
          prompt: 'In a permission rule, what does <code>"Bash(npm test:*)"</code> match?',
          options: [
            'Any Bash invocation',
            'Bash commands starting with <code>npm test</code> (the pattern is a glob on the command line)',
            'Only the literal string <code>npm test:*</code>',
            'Anything except <code>npm test</code>',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Permissions: Allow, Ask, Deny" — Tool(pattern) matchers narrow by argument; for Bash, the pattern is a glob over the command.',
        },
        {
          id: 'ch15-q05', type: 'single',
          prompt: 'Rena\'s "lab rule" for permission defaults:',
          options: [
            'Allow everything by default; tighten later',
            'Default to <code>ask</code>. Promote to <code>allow</code> only after seeing the same prompt three times in a row. Only <code>deny</code> the things that can ruin a Friday.',
            'Deny everything; allow only after a security review',
            'Mirror your teammate\'s settings.local.json',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Permissions: Allow, Ask, Deny" — that\'s Rena\'s explicit rule.',
        },
        {
          id: 'ch15-q06', type: 'single',
          prompt: 'Roughly how many lifecycle hook events does Claude Code expose?',
          options: ['About 5', 'About 12', 'Around 30 (and growing)', 'Over 200'],
          correctIndexes: [2],
          explanation: 'Lesson "Claude Code Hook Events" — there are 30+ distinct events spanning the tool, session, subagent, and compaction lifecycles, and the set grows with releases. The point isn\'t the exact number — it\'s that there\'s a hook for nearly every lifecycle moment.',
        },
        {
          id: 'ch15-q07', type: 'multi',
          prompt: 'Which hook events does the lesson group under "Tool lifecycle" and "Session lifecycle"?',
          options: [
            'PreToolUse',
            'PostToolUse',
            'SessionStart / SessionEnd',
            'PreCompact / PostCompact',
            'NetworkRequest',
          ],
          correctIndexes: [0, 1, 2, 3],
          explanation: 'Lesson "Claude Code Hook Events" — first four are in those clusters; NetworkRequest is invented.',
        },
        {
          id: 'ch15-q08', type: 'single',
          prompt: 'You want Prettier to run on every file Claude edits. Which hook event do you wire it to?',
          options: [
            '<code>PreToolUse</code> with matcher <code>Edit|Write</code>',
            '<code>PostToolUse</code> with matcher <code>Edit|Write</code>',
            '<code>SessionEnd</code>',
            '<code>UserPromptSubmit</code>',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Claude Code Hook Events" — <code>PostToolUse</code> matched to Edit|Write is the canonical auto-format hook.',
        },
        {
          id: 'ch15-q09', type: 'single',
          prompt: 'How does a <code>PreToolUse</code> hook BLOCK a dangerous tool call?',
          options: [
            'It returns <code>"block": true</code> in JSON',
            'It exits non-zero; output on stderr is shown to Claude, which can re-plan around the block',
            'It restarts Claude Code',
            'It mutates the prompt',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Claude Code Hook Events" — non-zero exit + stderr message = blocked call with Claude-visible reason.',
        },
        {
          id: 'ch15-q10', type: 'multi',
          prompt: 'Which of these are built-in output styles?',
          options: ['Concise', 'Explanatory', 'Learning', 'Verbose'],
          correctIndexes: [0, 1, 2],
          explanation: 'Lesson "Status Line, Output Styles & Headless Mode" — the built-ins are Default, Proactive, Concise, Explanatory and Learning. There is no Verbose.',
        },
        {
          id: 'ch15-q11', type: 'multi',
          prompt: 'For a nightly CI review with <code>claude -p</code>, which flags does the lesson recommend?',
          options: [
            '<code>--permission-mode plan</code> so CI can\'t accidentally mutate anything',
            '<code>--output-format json</code> for parseable cost+duration',
            '<code>--model claude-opus-5</code> (explicit model pin)',
            '<code>ANTHROPIC_API_KEY</code> in env (no interactive login)',
            '<code>--allow-edits</code> for fix-ups',
          ],
          correctIndexes: [0, 1, 2, 3],
          explanation: 'Lesson "Status Line, Output Styles & Headless Mode" — first four are the explicit recipe; <code>--allow-edits</code> would defeat the purpose.',
        },
              {
          id: 'ch15-q13', type: 'single',
          prompt: 'What does auto mode actually do when Claude wants to run a command?',
          options: [
            'Approves everything without checking — it is bypassPermissions under another name',
            'A separate classifier model reviews the action and blocks anything that escalates beyond your request or looks driven by hostile content',
            'Approves only commands already in your allow list',
            'Queues the command until you return to the terminal',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "The Three Permission Verbs" — auto mode is a classifier, not a blanket yes. It is a guard against prompt injection as much as a convenience. Your ask rules still prompt and deny rules still win.',
        },
        {
          id: 'ch15-q14', type: 'single',
          prompt: 'What does <code>dontAsk</code> mode do?',
          options: [
            'Silently approves anything not explicitly denied',
            'Auto-denies anything not pre-approved via /permissions or an allow rule',
            'Suppresses notifications but still prompts',
            'Disables hooks for the session',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "The Three Permission Verbs" — dontAsk is the inverse of auto: unapproved calls are denied rather than queued for you.',
        },
],
    },
  },

  // ── Chapter 16 ────────────────────────────────────────────────────────────
  {
    id: 'ch16',
    title: 'Remote & Headless Claude Code',
    subtitle: 'Side Quest — Run Claude Code on any always-on box',
    icon: '🖥️',
    xpReward: 500,
    // Side quests sit outside the main path. They don't gate floor
    // progression and they don't have to be completed to "finish" the
    // training programme — but the story finale is still gated on
    // ch16-test (the Kedash Protocol's NAS metaphor is hard-baked into
    // Marcus's dialogue), so players who want the full ending will
    // pick the side quest up. Players who just want the core
    // curriculum can skip it without penalty.
    sideQuest: true,
    lessons: [
      {
        id: 'ch16-l01', title: 'Why Run Claude Code on a Remote Box?', xpReward: 125, videos: [],
        lastVerified: '2026-06-13',
        verifiedAgainstVersion: 'v2.1.130',
        content: '<h2>The Always-On Specialist Setup</h2><p>Running Claude Code on a remote, always-on machine gives you a persistent environment not tied to a specific laptop. Pick whatever you have:</p><ul><li><strong>Cloud VM</strong> — Oracle Always Free, GCP free tier, AWS Free Tier, Fly.io, Hetzner CX11 (~€4/mo)</li><li><strong>NAS</strong> — Synology, QNAP, or any home-server box with shell access</li><li><strong>Raspberry Pi 4/5</strong> — about $35-80, always on, runs Claude Code fine</li><li><strong>WSL on Windows</strong> — treat it as the "remote" from your editor terminal</li><li><strong>GitHub Codespace</strong> — instant, free hours, zero setup</li></ul><p>This is the side quest — it combines every main-path concept on a single deployment: SSH workflows, persistent sessions, headless auth, CLAUDE.md, Business Brain, and multi-window Command Center.</p><h3>Use cases</h3><ul><li>Persistent sessions — start, disconnect, reconnect without losing state (tmux)</li><li>Centralised code storage — any machine can SSH in and continue</li><li>Scheduled automation — Claude Code workflows without tying up a laptop</li><li>Multi-Goal Command Center — multiple tmux sessions = multiple parallel workstreams</li></ul><p>The lessons that follow use a Synology NAS as the worked example because it covers the most setup steps (SSH enable, DSM Task Scheduler, etc.). Skim past anything that doesn\'t apply to your box and use the equivalent on yours — every step has an analog on every platform.</p>',
      },
      {
        id: 'ch16-l02', title: 'SSH Access to Your Remote Box', xpReward: 125, videos: [],
        lastVerified: '2026-06-13',
        verifiedAgainstVersion: 'v2.1.130',
        content: '<h2>Enabling SSH Access</h2><p>Get a shell on the remote box however your platform exposes one:</p><ul><li><strong>Synology DSM:</strong> Control Panel → Terminal &amp; SNMP → Enable SSH service.</li><li><strong>Cloud VM:</strong> Usually SSH is on by default — grab the public IP from the provider\'s console.</li><li><strong>Raspberry Pi:</strong> <code>sudo raspi-config</code> → Interface Options → SSH Enable. (Or drop an empty <code>ssh</code> file on the boot partition for first-boot enable.)</li><li><strong>WSL:</strong> <code>wsl</code> from a Windows terminal — you\'re already in.</li><li><strong>Codespace:</strong> the integrated terminal IS the shell.</li></ul><pre><code># Once SSH is on, connect from your laptop:\nssh user@1.2.3.4         # cloud VM by IP\nssh admin@192.168.1.x    # NAS / Pi on your LAN\nssh pi@raspberrypi.local # Pi via mDNS</code></pre><h3>SSH key auth + config shortcut</h3><p>One-time setup — replaces password prompts with a single short alias:</p><pre><code>ssh-keygen -t ed25519 -C "remote-dev"\nssh-copy-id user@&lt;host&gt;\n\n# ~/.ssh/config — pick any alias\nHost remote-dev\n  HostName 1.2.3.4          # or 192.168.1.x, or *.fly.dev\n  User user                 # or admin / pi / ubuntu / root\n  IdentityFile ~/.ssh/id_ed25519\n  ServerAliveInterval 60</code></pre><p>Connect with just: <code>ssh remote-dev</code></p><p><em>The rest of these lessons use <code>ssh nas</code> as a stand-in for whatever you named yours.</em></p>',
      },
      {
        id: 'ch16-l03', title: 'Installing Node.js and Claude Code', xpReward: 125, videos: [],
        lastVerified: '2026-06-13',
        verifiedAgainstVersion: 'v2.1.130',
        content: '<h2>Getting Claude Code on the Remote Box</h2><p>The native installer is the easiest path on most boxes — Linux x86_64 / arm64 and macOS are all supported. If your platform is unusual (DSM with limited curl, BusyBox, locked-down container), use the npm path.</p><pre><code># Option A: Native installer (recommended on Linux/macOS, including Pi and most NAS firmware)\ncurl -fsSL https://claude.ai/install.sh | bash\n\n# Option B: npm path (universal — works anywhere Node runs)\n# Install nvm (check https://github.com/nvm-sh/nvm for the latest version)\ncurl -o- https://raw.githubusercontent.com/nvm-sh/nvm/HEAD/install.sh | bash\nsource ~/.bashrc\nnvm install 20 && nvm use 20\nnpm install -g @anthropic-ai/claude-code\n\n# API key for headless auth (works on any box)\necho \'export ANTHROPIC_API_KEY="sk-ant-..."\' >> ~/.bashrc\nsource ~/.bashrc\n\n# Verify\nclaude --version</code></pre><h3>Platform notes</h3><ul><li><strong>Pi:</strong> Option A works fine on Pi OS 64-bit. On Pi OS 32-bit, use Option B with nvm.</li><li><strong>Cloud VM / Codespace:</strong> Option A. Done in 60 seconds.</li><li><strong>WSL:</strong> Option A from inside your WSL shell. Don\'t install via Windows — install inside the Linux env.</li><li><strong>Synology DSM:</strong> Option B is the safest path on DSM 7.x.</li></ul>',
      },
      {
        id: 'ch16-l04', title: 'Persistent Sessions with tmux', xpReward: 125, videos: [],
        lastVerified: '2026-06-14',
        verifiedAgainstVersion: 'v2.1.130',
        content: '<h2>Sessions That Survive Disconnection</h2><div class="term-shot" data-shot="ch16-l04"><div class="term-shot-bar"><span class="ts-dot ts-r"></span><span class="ts-dot ts-y"></span><span class="ts-dot ts-g"></span><span class="term-shot-title">ssh remote-dev — tmux: claude-work</span></div><div class="term-shot-body"><span class="ts-dim">$</span> tmux new-session -s claude-work\n<span class="ts-dim">$</span> cd /volume1/projects/my-app\n<span class="ts-dim">$</span> claude\n<span class="ts-gold">✻ Welcome to Claude Code!</span> <span class="ts-dim">claude-sonnet-5 · /volume1/projects/my-app</span>\n\n<span class="ts-cy">&gt;</span> Keep refactoring the importer — I might lose this connection.\n<span class="ts-ok">●</span> Understood. I\'ll keep working through the importer module —\nreattach whenever, this session isn\'t going anywhere.\n\n<span class="ts-tmuxbar">[claude-work] 0:claude*                                  "nas" 23:14</span></div><div class="term-shot-cap">Simulated terminal — run it yourself and you\'ll see the live version.</div></div><p>tmux is the same on every Unix-y box — NAS, cloud VM, Pi, WSL, Codespace. The flow:</p><pre><code>ssh remote-dev               # whatever you named yours\ntmux new-session -s claude-work\ncd ~/projects/my-app         # or /volume1/projects/my-app on Synology\nclaude\n# Detach: Ctrl+B then D\n\n# Reconnect from any machine:\nssh remote-dev\ntmux attach -t claude-work</code></pre><p>Your laptop can sleep, crash, or close its lid — the Claude session keeps running. Open your laptop the next morning and reattach.</p><h3>Install if not already present</h3><pre><code># Debian / Ubuntu / Pi OS / WSL\nsudo apt install tmux\n# Synology DSM (already installed on 7.x; if not, via Entware)\n# macOS\nbrew install tmux</code></pre><h3>Multi-Goal Command Center</h3><pre><code>tmux new-session -s work\n# Ctrl+B C = new window\n# Window 1: auth refactor\n# Window 2: documentation\n# Window 3: test generation\n# Switch: Ctrl+B N / Ctrl+B P</code></pre>',
      },
      {
        id: 'ch16-l05', title: 'Remote-Box CLAUDE.md and Final Integration', xpReward: 125, videos: [],
        lastVerified: '2026-06-13',
        verifiedAgainstVersion: 'v2.1.130',
        content: '<h2>Applying Everything You\'ve Learned</h2><p>A global <code>~/.claude/CLAUDE.md</code> on the remote box tells Claude the environment it\'s in. The shape is identical across hosts — only the specifics change:</p><pre><code># Example A — Synology NAS\nRunning on Synology DS925+, DSM 7.x, x86_64.\nNode.js via nvm. Projects in /volume1/projects/.\nNo browser available. Persistent sessions via tmux.\n\n# Example B — Hetzner CX11 cloud VM\nRunning on Ubuntu 24.04 LTS, x86_64, 2 GB RAM.\nNode.js 20 via apt. Projects in /home/dev/projects/.\nNo browser available. Persistent sessions via tmux.\n\n# Example C — Raspberry Pi 5\nRunning on Pi OS 64-bit (Bookworm), aarch64.\nNode.js 20 via nvm. Projects in ~/projects/.\nNo browser available. Persistent sessions via tmux.\n\n## Business Context (any host)\nGlobal: ~/shared/business-brain/\nPer-project: .business-brain/ in each project root.</code></pre><p>The "no browser available" line is doing real work: Claude will offer terminal-only flows for tasks that would normally suggest opening a docs page.</p><p>Most always-on boxes can run scheduled scripts that start tmux sessions, invoke Claude Code skills, and deposit output files — fully unattended scheduled automation on hardware that never sleeps. (You\'ll wire one up in the next lesson.)</p>',
      },
      {
        id: 'ch16-l06', title: 'Scheduled Automation with Human Gates', xpReward: 125, videos: [],
        lastVerified: '2026-06-13',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>Automating the Repetitive 80%</h2>
<p>The remote box is always on. <code>claude -p</code> runs unattended. Whatever your scheduler is — cron, systemd timer, Synology Task Scheduler, Windows Task Scheduler driving WSL — you have round-the-clock automation. The senior-engineer rule for what to automate:</p>
<blockquote>Automate the predictable work. Keep a human in the loop for the judgment calls.</blockquote>
<h3>The weekly report — a complete example</h3>
<pre><code>Weekly Report Workflow:
1. [Auto]  Collect: git log, open PRs, closed tickets
2. [Auto]  Draft: run /weekly-status skill via \`claude -p\` (headless)
3. [Human] Review and edit the draft in the morning
4. [Auto]  Send to Slack #team-updates
5. [Auto]  Archive to .business-brain/reports/</code></pre>
<h3>The launcher script (works on every platform)</h3>
<pre><code>#!/bin/sh
# ~/scripts/weekly-report.sh   (or /volume1/scripts/ on Synology)
cd ~/projects/kedash-support     # or /volume1/projects/... on Synology
export ANTHROPIC_API_KEY="sk-ant-..."
claude -p "Run the /weekly-status skill. Save the draft to reports/draft.md." \\
  --model claude-sonnet-5 \\
  --permission-mode plan \\
  --output-format json &gt; reports/last-run.json
</code></pre>
<h3>Scheduling it</h3>
<p>Pick whichever scheduler your box provides — all of these run the same script:</p>
<pre><code># Linux / cloud VM / Pi / WSL — cron
crontab -e
0 6 * * 5 ~/scripts/weekly-report.sh

# Linux / cloud VM — systemd timer (cleaner logs)
# ~/.config/systemd/user/weekly-report.timer  →  OnCalendar=Fri 06:00

# Synology DSM
# Control Panel → Task Scheduler → Create → Scheduled Task →
# User-defined script. Friday 06:00.

# Windows (WSL backend)
# Task Scheduler → Create Basic Task → Action: wsl.exe ~/scripts/weekly-report.sh</code></pre>
<p>Friday 06:00. The draft is waiting when the team logs in.</p>
<h3>The gate principle</h3>
<p>Every workflow that produces external-facing output needs at least one human gate. A 2-minute skim before posting to Slack is often enough — but it must exist. The pattern: auto-draft → human approve → auto-distribute. Never auto-distribute something that hasn't been seen.</p>
<h3>Idle behaviour matters for cost</h3>
<p>From Chapter 12: the prompt cache evicts after 5 minutes. Scheduled jobs spawning fresh sessions every hour pay the cache miss on every run. That's fine — the alternative (a long-lived idle session) wastes more. Just be aware of the trade-off when you design the cadence.</p>
<p><strong>Congratulations.</strong> You've completed the Remote & Headless side quest. From first session to unattended scheduled automation on whatever box you have — you have the full toolkit: Business Brain, lean CLAUDE.md, the Memory Framework, refined skills, token efficiency, Plan Mode, model selection, subagent dispatch, MCP integration, hardened settings, and unattended scheduled automation.</p>`,
      },
      {
        id: 'ch16-l07', title: 'Remote Control: Your Machine, Your Phone', xpReward: 130, videos: [],
        lastVerified: '2026-08-26',
        verifiedAgainstVersion: 'v2.1.246',
        content: `<h2>You May Not Need the Remote Box</h2>
<p>The rest of this chapter builds a genuine remote workstation: SSH in, install Node, keep sessions alive with tmux. That is still the right answer when you want Claude Code running on hardware that is <em>always on</em> and independent of your laptop — a NAS, a VPS, a build server.</p>
<p>But if what you actually want is "start something at my desk and check on it from the sofa", there is a built-in feature for exactly that, and it needs no SSH, no tmux and no second machine.</p>
<h3>Remote Control</h3>
<p><strong>Remote Control</strong> connects claude.ai/code — or the Claude app on iOS and Android — to a session running on your own machine. Claude keeps running locally the whole time, so your filesystem, your MCP servers and your project config all stay where they are. Nothing moves to the cloud; only the conversation does.</p>
<pre><code>claude --remote-control        # a normal session, also reachable remotely (--rc works too)
claude remote-control          # server mode: no local prompt, waits for remote connections
/remote-control                # turn it on for the session you are already in (/rc)</code></pre>
<p>In server mode the terminal prints a session URL and shows connection status; press <kbd>space</kbd> for a QR code to open it on your phone. Name a session with <code>--name "Billing refactor"</code> so it is findable in the list at claude.ai/code.</p>
<p>You can drive the same session from your terminal, a browser and your phone interchangeably — messages, subagent progress and workflow state stay in sync across every connected device.</p>
<div class="callout"><strong>Sign in first.</strong> Remote Control needs a claude.ai login (<code>/login</code>). It is available on all plans, but on Team and Enterprise an Owner must switch it on in the Claude Code admin settings before it works.</div>
<h3>Related: sessions that don't run on your machine at all</h3>
<p>Two neighbours worth knowing by name. <code>claude --cloud</code> starts a session on Anthropic's infrastructure rather than your box — useful when you want work to continue with your laptop shut. And <code>/teleport</code> pulls one of those cloud sessions <em>down</em> into your terminal, so you can finish locally what you started on the web.</p>
<h3>So which do you use?</h3>
<ul>
  <li><strong>Remote Control</strong> — you want your own environment, reachable from another device. Your files, your tools, your machine doing the work.</li>
  <li><strong>Cloud sessions</strong> (<code>--cloud</code>) — you want the work to happen somewhere that isn't your machine, and you don't need your local filesystem.</li>
  <li><strong>SSH + tmux</strong> (the rest of this chapter) — you want a persistent box <em>you</em> control, running on your terms, with everything installed the way you like it. Still the answer for a NAS or a home server.</li>
</ul>
<p>These are not competitors so much as three different answers to "where should the work happen". The chapter's remote box is worth building; just build it because you want that box, not because you think it is the only way to reach Claude Code from your phone.</p>`,
      },
    ],
    practicalTest: {
      id: 'ch16-test',
      scenarioType: 'jira', scenarioFrom: 'Marcus Webb', scenarioRole: 'IT Setup Lead', scenarioAvatar: '👨‍💻',
      scenario: 'KEDASH-CX-99 · Capstone deploy\n\nDeploy `kedash-support/` onto a remote environment so the support team can use Claude Code without tying up their laptops. NAS is ideal but anything counts: a Synology NAS, a cloud VM, a Raspberry Pi, even WSL on Windows treated as headless. SSH in, install/verify Node, install Claude Code, set your API key, transfer `kedash-support/`, set up a persistent session, run a smoke test (open `claude` in the project).\n\nPaste the actual command sequence you ran AND a snippet from the remote Claude session that PROVES it\'s running there (different hostname in the prompt, different file paths, etc.).\n\nWhen your remote session is live, come find me at the server room door. Bring your badge. There\'s a button that isn\'t on the panel.',
      task: 'Paste `## Commands` (the actual sequence you ran) and `## Remote session` (evidence the session is running on the remote box).',
      hint: 'ssh → install Node via nvm → `npm install -g @anthropic-ai/claude-code` → set `ANTHROPIC_API_KEY` → rsync/scp/git the folder → tmux or screen for persistence → `claude` inside the project. Remote evidence: hostname, paths, banner from the remote box.',
      minLength: 0, passThreshold: 85, xpReward: 675,
      criteria: [
        { type: 'keyword', value: ['## Commands', '## Remote session'], description: 'Both sections present', weight: 1 },
        { type: 'keyword', value: ['ssh'], description: 'Includes SSH', weight: 2 },
        { type: 'keyword', value: ['node', 'nvm', 'npm'], description: 'Installs Node', weight: 2 },
        { type: 'keyword', value: ['@anthropic-ai', 'claude-code', 'npm install -g', 'claude'], description: 'Installs Claude Code', weight: 2 },
        { type: 'keyword', value: ['ANTHROPIC_API_KEY', 'api key', 'export', 'setx'], description: 'Authenticates', weight: 2 },
        { type: 'keyword', value: ['rsync', 'scp', 'git clone', 'transfer', 'kedash-support'], description: 'Transfers the project', weight: 2 },
        { type: 'keyword', value: ['tmux', 'screen', 'persistent', 'detach', 'nohup'], description: 'Persistent session', weight: 2 },
        { type: 'keyword', value: ['/home/', '/opt/', '/volume', '~/', '@', ':'], description: 'Remote-session evidence (paths/hostname)', weight: 1 },
        { type: 'nonce', description: 'Compliance verification code echoed in the live session', improvement: 'Ask Claude to echo the KDQ verification code shown above, then paste the session output containing it.', weight: 3 },
      ],
      exemplar: '<p>Strong answer: a numbered command sequence (ssh → nvm → npm install Claude Code → API key → rsync the folder → tmux → <code>claude</code>), then a snippet of the remote Claude banner or prompt showing it\'s clearly on the remote box (different hostname, /home/ or /volume paths).</p>',
    },
    theoreticalTest: {
      id: 'ch16-test-mcq', passThreshold: 80, xpReward: 675, drawCount: 6,
      questionPool: [
        {
          id: 'ch16-q01', type: 'multi',
          prompt: 'Which of these are listed as candidate "always-on remote boxes" for Claude Code?',
          options: [
            'A cloud VM (Oracle free, GCP free tier, Hetzner CX11)',
            'A NAS (Synology, QNAP, etc.)',
            'A Raspberry Pi 4/5',
            'WSL on Windows (treated as remote)',
            'A GitHub Codespace',
            'A USB pen drive',
          ],
          correctIndexes: [0, 1, 2, 3, 4],
          explanation: 'Lesson "Why Run Claude Code on a Remote Box?" — first five are the listed options; pen drives are not.',
        },
        {
          id: 'ch16-q02', type: 'multi',
          prompt: 'Which of the following are use-cases the lesson highlights for a remote Claude Code box?',
          options: [
            'Persistent sessions — start, disconnect, reconnect without losing state (tmux)',
            'Centralised code storage — any machine can SSH in and continue',
            'Scheduled automation — Claude workflows without tying up a laptop',
            'Multi-Goal Command Center — multiple tmux sessions = parallel workstreams',
            'GPU-accelerated training',
          ],
          correctIndexes: [0, 1, 2, 3],
          explanation: 'Lesson "Why Run Claude Code on a Remote Box?" — first four are the explicit benefits; GPU training is not.',
        },
        {
          id: 'ch16-q03', type: 'multi',
          prompt: 'Which entries does the SSH key + config shortcut put into <code>~/.ssh/config</code>?',
          options: ['<code>Host &lt;alias&gt;</code>', '<code>HostName</code>', '<code>User</code>', '<code>IdentityFile</code>', '<code>ServerAliveInterval</code>'],
          correctIndexes: [0, 1, 2, 3, 4],
          explanation: 'Lesson "SSH Access to Your Remote Box" — all five appear in the example <code>~/.ssh/config</code> stanza.',
        },
        {
          id: 'ch16-q04', type: 'single',
          prompt: 'For a Synology DSM 7.x install, which Claude Code install path does the lesson call the safest?',
          options: [
            'Native installer (<code>curl ... install.sh | bash</code>)',
            'npm path — nvm + <code>npm install -g @anthropic-ai/claude-code</code>',
            'Docker container',
            'Pre-built binary copied from a Mac',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Installing Node.js and Claude Code" — Synology DSM gets the npm path.',
        },
        {
          id: 'ch16-q05', type: 'single',
          prompt: 'Which environment variable does the lesson set for HEADLESS authentication on the remote box?',
          options: [
            '<code>CLAUDE_KEY</code>',
            '<code>ANTHROPIC_API_KEY</code>',
            '<code>OPENAI_KEY</code>',
            '<code>ANTHROPIC_TOKEN</code>',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Installing Node.js and Claude Code" — <code>ANTHROPIC_API_KEY</code> is exported into the shell for headless auth.',
        },
        {
          id: 'ch16-q06', type: 'multi',
          prompt: 'Which tmux commands does the lesson demonstrate?',
          options: [
            '<code>tmux new-session -s claude-work</code>',
            'Detach: <code>Ctrl+B</code> then <code>D</code>',
            '<code>tmux attach -t claude-work</code> (reattach)',
            '<code>Ctrl+B C</code> for a new window',
            '<code>tmux kill -9</code>',
          ],
          correctIndexes: [0, 1, 2, 3],
          explanation: 'Lesson "Persistent Sessions with tmux" — those four appear; "tmux kill -9" is invented.',
        },
        {
          id: 'ch16-q07', type: 'single',
          prompt: 'Why does the remote-box CLAUDE.md often include the line "No browser available"?',
          options: [
            'For SEO',
            'It tells Claude to offer terminal-only flows for tasks that would normally suggest opening a docs page',
            'It disables MCP',
            'It blocks /init',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Remote-Box CLAUDE.md and Final Integration" — the line is doing real work, steering Claude away from browser-based suggestions.',
        },
        {
          id: 'ch16-q08', type: 'single',
          prompt: 'The senior-engineer rule for scheduled automation is:',
          options: [
            'Automate everything — no human review',
            'Automate the predictable work; keep a human in the loop for the judgment calls',
            'Schedule manually for the first 6 months',
            'Never automate user-facing output',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Scheduled Automation with Human Gates" — that exact rule is the lesson\'s headline blockquote.',
        },
        {
          id: 'ch16-q09', type: 'multi',
          prompt: 'For the weekly-report example, which flags does the launcher script pass to <code>claude -p</code>?',
          options: [
            '<code>--model claude-sonnet-5</code>',
            '<code>--permission-mode plan</code>',
            '<code>--output-format json</code>',
            '<code>--accept-all-edits</code>',
          ],
          correctIndexes: [0, 1, 2],
          explanation: 'Lesson "Scheduled Automation with Human Gates" — first three flags are explicit; --accept-all-edits is not in the example.',
        },
        {
          id: 'ch16-q10', type: 'single',
          prompt: 'The "gate principle" for external-facing automation outputs is:',
          options: [
            'Auto-distribute everything; review later',
            'Every workflow producing external-facing output needs at least one human gate — auto-draft → human approve → auto-distribute',
            'Disable automation in the first 30 days',
            'Always require a 2-FA prompt',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Scheduled Automation with Human Gates" — that\'s the explicit pattern: never auto-distribute unseen output.',
        },
        {
          id: 'ch16-q11', type: 'single',
          prompt: 'Scheduled jobs spawning a fresh Claude session every hour — what cost behaviour should you EXPECT, per the lesson?',
          options: [
            'Lower bill — fresh sessions cache fully',
            'Each run pays the 5-minute prompt-cache miss because the cache evicts between hourly runs; the alternative (a long-lived idle session) wastes more, so it\'s usually fine',
            'No effect — caching never matters in headless mode',
            'Doubled bill — Claude pings the API twice',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Scheduled Automation with Human Gates" — the lesson explicitly calls out the cache miss + the trade-off vs idle sessions.',
        },
      ],
    },
  }
);
