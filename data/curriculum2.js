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
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: `<h2>Reusable Prompt Templates</h2>
<p>Skills (custom slash commands) are reusable, parameterised prompt templates stored in <code>.claude/skills/</code>. They let you package complex workflows into a single command invocable from any session.</p>
<h3>Without skills</h3>
<p>Every time you want a PR description, a security review, or a changelog entry, you write the same multi-paragraph prompt from memory. Results vary based on how well you remember the prompt. Context is wasted typing it out.</p>
<h3>With skills</h3>
<p>You run <code>/pr-description</code> or <code>/security-review</code> and get consistent, high-quality output every time — without burning context on the prompt instructions themselves.</p>
<h3>Built-in commands vs bundled skills</h3>
<p>Some slash commands are <strong>built-in</strong> (coded behaviour, not prompt templates): <code>/init</code>, <code>/review</code>, <code>/security-review</code>, <code>/clear</code>, <code>/compact</code>, <code>/plan</code>. Others are <strong>bundled skills</strong> (prompt-based, same progressive disclosure rules): <code>/simplify</code>, <code>/batch</code>, <code>/debug</code>. Your custom skills work exactly like bundled skills — the difference is location.</p>`,
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
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: `<h2>A Skill is Just a Markdown File</h2>
<p>Creating a skill: make a directory inside <code>.claude/skills/</code> named after the command, and put a <code>SKILL.md</code> file inside it with the prompt template.</p>
<h3>Example: changelog skill</h3>
<p>File: <code>.claude/skills/changelog/SKILL.md</code></p>
<pre><code>Generate a changelog entry for version $ARGUMENTS.

Review the git log since the last tag and summarise:
1. New features (## Added)
2. Bug fixes (## Fixed)
3. Breaking changes (## Breaking) — flag prominently
4. Internal changes (## Changed)

Format as Keep a Changelog. Be concise — one line per item.</code></pre>
<p>Usage: <code>/changelog v2.5.0</code></p>
<h3>Best practices</h3>
<ul>
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
<p>There are 27 hook events in total — see the official docs for the complete list.</p>
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
        lastVerified: '2026-05-30',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>Dr. Priya Engelhardt — AI Operations</h2>
<p><em>You step out of the Library balancing a stack of refined skills. Dr. Priya Engelhardt — Head of AI Operations — is waiting at the AI Ops console with her arms folded.</em></p>
<p><em>"Most engineers here run Sonnet for everything and rack up surprise bills. The other half run Opus for everything and rack up bigger ones. I'm going to teach you to spend deliberately. Sit down."</em></p>
<h3>The Claude 4 family in Claude Code</h3>
<p>Three model tiers are available, each with a different cost/intelligence trade-off:</p>
<ul>
  <li><strong>Claude Opus 4.8</strong> — the smartest model. Multi-step reasoning, long refactors, ambiguous architectural calls, hard debugging. Highest cost per token; slowest output.</li>
  <li><strong>Claude Sonnet 4.6</strong> — the balanced default. Most coding work, day-to-day prompts, skill execution, code review. Strong intelligence at ~⅕ the cost of Opus.</li>
  <li><strong>Claude Haiku 4.5</strong> — the fast lane. Quick edits, log triage, short summaries, scripted hook actions. Sub-second time-to-first-token; cheapest tier.</li>
</ul>
<h3>Why this matters</h3>
<p>The wrong model for the job costs you either money (Opus on a one-line typo fix) or time and quality (Haiku on a multi-file architectural change). The first habit of a senior Claude Code user is matching the engine to the workload.</p>
<h3>What Claude Code picks by default</h3>
<p>On launch Claude Code uses Sonnet. That's almost always correct. But the moment a task obviously falls outside Sonnet's sweet spot, you should switch — explicitly, every time, not as an afterthought.</p>`,
      },
      {
        id: 'ch10-l02', title: 'Switching with /model and Fast Mode', xpReward: 110, videos: [],
        lastVerified: '2026-05-30',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>Three Levers, One Session</h2>
<p>Claude Code exposes three switches that change which model executes your next prompt. Learning all three keeps you in control instead of letting defaults silently drive your bill.</p>
<h3>1. /model — pick the tier</h3>
<pre><code>/model opus       # Opus 4.8
/model sonnet     # Sonnet 4.6  (default)
/model haiku      # Haiku 4.5
/model            # opens an interactive picker</code></pre>
<p>The choice persists for the rest of the session (or until you switch again). You'll see the active model in the status line.</p>
<h3>2. /fast — Fast Mode for Opus</h3>
<p><code>/fast</code> toggles <strong>Fast Mode</strong> while on Opus. It does <em>not</em> downgrade you to Sonnet or Haiku — you stay on Opus, but output streams much faster. Worth it when you're paired with Opus on a long refactor and don't want to watch tokens drip out.</p>
<h3>3. The 1M-context window</h3>
<p>Opus 4.7 and 4.8 support a <strong>1,000,000-token context</strong> tier. The model is the same engine; the only difference is that very large repos, transcripts, or doc bundles fit in one session. When 1M context is active, the model ID reads <code>claude-opus-4-8[1m]</code>. Switch on automatically when your context starts to approach the standard 200k limit — or proactively when you know you're about to load a full codebase.</p>
<h3>One-shot override per command</h3>
<p>For headless / scripted runs, pass the model explicitly:</p>
<pre><code>claude -p "summarise this PR" --model claude-haiku-4-5
claude -p "redesign the auth module" --model claude-opus-4-8</code></pre>
<p>This bypasses whatever the interactive default is — perfect for cron jobs and CI hooks that should always run on a specific tier.</p>`,
      },
      {
        id: 'ch10-l03', title: 'Cost Economics & Prompt Caching', xpReward: 110, videos: [],
        lastVerified: '2026-05-30',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>Where Your Money Actually Goes</h2>
<p>Priya pulls up last month's bill on a wall display. "This team spent £4,200 on Claude Code. Half of it was avoidable. Let me show you why."</p>
<h3>The order-of-magnitude rule</h3>
<p>As a rough mental model, per million tokens:</p>
<ul>
  <li><strong>Opus</strong>: ~15× the cost of Haiku</li>
  <li><strong>Sonnet</strong>: ~3× the cost of Haiku</li>
  <li><strong>Haiku</strong>: the cheap reference point</li>
</ul>
<p>Running Opus on a task Haiku could handle is throwing 15× the money at the same answer.</p>
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
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: '<h2>Model Context Protocol</h2><p>MCP is an open standard that lets Claude Code connect to external services, databases, and tools. The community has built hundreds of MCP servers for common tools: GitHub, Postgres, Slack, Notion, Linear, Figma, and more — and Anthropic now maintains an <strong>official MCP Registry</strong> of curated servers. Add any registry server with <code>claude mcp add &lt;server-name&gt;</code>.</p><h3>How it works</h3><ol><li>An MCP server exposes tools over a standardised protocol</li><li>Claude Code connects to the server (local or remote)</li><li>Claude Code uses those tools as naturally as built-in ones</li></ol>',
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
        lastVerified: '2026-05-30',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>"I Don't Type — I Dispatch"</h2>
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
        lastVerified: '2026-05-30',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>Specialist Roles You Can Hire</h2>
<p>Beyond the built-in <em>general-purpose</em> and <em>Explore</em> subagents, you can define your own specialists in <code>.claude/agents/</code> (per project) or <code>~/.claude/agents/</code> (global).</p>
<h3>The agent file</h3>
<pre><code># .claude/agents/code-reviewer.md
---
name: code-reviewer
description: Reviews diffs for correctness, security, and style. Use when asked for a second opinion on a PR.
model: opus
tools: [Read, Grep, Bash]
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
  <li><strong>tools</strong> restricts what this agent can do — a reviewer doesn't need <code>Write</code> or <code>Edit</code>.</li>
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
  <li><strong>model</strong> — pin a default model for this project (e.g. <code>"claude-opus-4-8"</code>).</li>
  <li><strong>statusLine</strong> — a custom command that produces the prompt status string.</li>
  <li><strong>outputStyle</strong> — pick an output style (concise / explanatory / etc).</li>
</ul>
<h3>What does NOT live here</h3>
<p>MCP server configs go in <code>.mcp.json</code>, not <code>settings.json</code>. Skills go in <code>.claude/skills/</code>. Subagents go in <code>.claude/agents/</code>. Don't try to stuff them into settings — they're separate files for a reason.</p>`,
      },
      {
        id: 'ch15-l02', title: 'Permissions: Allow, Ask, Deny', xpReward: 130, videos: [],
        lastVerified: '2026-05-30',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>The Three Permission Verbs</h2>
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
<h3>Sandbox mode</h3>
<p>Run Claude Code with <code>--permission-mode plan</code> to allow read-only exploration but block all writes. <code>--permission-mode acceptEdits</code> auto-accepts edits but still asks for shell. <code>--permission-mode bypassPermissions</code> disables all gating (dangerous — only inside an isolated container/VM).</p>
<h3>Managing rules live</h3>
<pre><code>/permissions             # opens the interactive picker
/permissions list        # show current resolved rules
/permissions add deny "Bash(git push --force:*)"</code></pre>
<p>Rena's lab rule: <em>"Default to <code>ask</code>. Only promote to <code>allow</code> after you've watched the same prompt three times in a row. Only <code>deny</code> the things that can ruin a Friday."</em></p>`,
      },
      {
        id: 'ch15-l03', title: 'The 27 Hook Events', xpReward: 130, videos: ['<iframe src="https://www.youtube.com/embed/Q4gsvJvRjCU" title="How Claude Code Hooks Save Me HOURS Daily" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'],
        lastVerified: '2026-05-30',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>Wire Shell Commands to Lifecycle Events</h2>
<p>Hooks let you run arbitrary shell commands at specific moments. There are <strong>27 hook events</strong> covering every phase of a Claude Code session. The most useful clusters:</p>
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
<h3>Concrete example — auto-format on save</h3>
<pre><code>{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "npx prettier --write $CLAUDE_FILE_PATHS" }
        ]
      }
    ]
  }
}</code></pre>
<p>Every <code>Edit</code> or <code>Write</code> tool call triggers Prettier on the affected paths. Hooks receive context via environment variables — <code>$CLAUDE_FILE_PATHS</code>, <code>$CLAUDE_TOOL_NAME</code>, <code>$CLAUDE_SESSION_ID</code>, and more.</p>
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
<h3>Hook hygiene</h3>
<p>Hooks run in your shell with your privileges. Treat them like git pre-commit hooks: keep them fast, idempotent, and clearly named under <code>.claude/hooks/</code> in the repo. A 5-second hook on <code>PostToolUse</code> turns every edit into a 5-second wait.</p>`,
      },
      {
        id: 'ch15-l04', title: 'Status Line, Output Styles & Headless Mode', xpReward: 130, videos: [],
        lastVerified: '2026-05-30',
        verifiedAgainstVersion: 'v2.1.130',
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
<p>Output styles change how Claude Code formats its replies. Built-in styles include <code>default</code>, <code>concise</code>, and <code>explanatory</code>. You can pick one persistently in settings or per-session via <code>/output-style</code>.</p>
<pre><code>{ "outputStyle": "concise" }     // settings.json
/output-style explanatory         // one-off, for the current session</code></pre>
<p>You can also author custom styles in <code>.claude/output-styles/</code> — each is a markdown file with rules ("never use emoji", "always cite file:line", "end with a one-sentence summary"). Useful for matching house style on PR bodies or report drafts.</p>
<h3>Headless / CI mode</h3>
<p><code>claude -p "..."</code> runs Claude Code in non-interactive mode: takes one prompt, returns one response, exits. This is the building block for CI hooks, cron jobs, GitHub Actions, and Synology Task Scheduler invocations.</p>
<pre><code>claude -p "review the diff between main and HEAD" \\
       --model claude-opus-4-8 \\
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
      exemplar: '<p>Strong answer: a valid <code>.claude/settings.json</code> with permissions buckets (allow Read/Edit/safe bash; ask for git push and rm; deny rm -rf, curl-pipe-sh, and .env reads), a PostToolUse hook matching Edit|Write that calls a project-local format script, a CI command like <code>claude -p &quot;review diff&quot; --model claude-opus-4-8 --permission-mode plan --output-format json</code>, and a 4-line statusline script that prints branch + model + running cost.</p>',
    },
  },

  // ── Chapter 16 ────────────────────────────────────────────────────────────
  {
    id: 'ch16',
    title: 'Claude Code on NAS',
    subtitle: 'Side Quest — Remote & Headless Specialist',
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
        id: 'ch16-l01', title: 'Why Run Claude Code on a NAS?', xpReward: 125, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: '<h2>The Capstone Setup</h2><p>Running Claude Code on a Synology DS925+ NAS gives you a persistent, always-on environment not tied to a specific laptop. This is the capstone — it combines every concept: SSH workflows, persistent sessions, headless auth, CLAUDE.md, Business Brain, and multi-window Command Center.</p><h3>Use cases</h3><ul><li>Persistent sessions — start, disconnect, reconnect without losing state (tmux)</li><li>Centralised code storage — any machine can SSH in and continue</li><li>Scheduled automation — Claude Code workflows without tying up a laptop</li><li>Multi-Goal Command Center — multiple tmux sessions = multiple parallel workstreams</li></ul>',
      },
      {
        id: 'ch16-l02', title: 'SSH Setup on Synology DSM', xpReward: 125, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: '<h2>Enabling SSH Access</h2><p>Control Panel → Terminal &amp; SNMP → Enable SSH. Then connect:</p><pre><code>ssh admin@192.168.1.x</code></pre><h3>SSH key auth + config shortcut</h3><pre><code>ssh-keygen -t ed25519 -C "nas-dev"\nssh-copy-id admin@192.168.1.x\n\n# ~/.ssh/config\nHost nas\n  HostName 192.168.1.x\n  User admin\n  IdentityFile ~/.ssh/nas-dev\n  ServerAliveInterval 60</code></pre><p>Connect with just: <code>ssh nas</code></p>',
      },
      {
        id: 'ch16-l03', title: 'Installing Node.js and Claude Code', xpReward: 125, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: '<h2>Getting Claude Code on DSM</h2><p>The native installer is the easiest path. If you need the npm path on DSM (e.g. limited curl access), install nvm first for Node.js management.</p><pre><code># Option A: Native installer (recommended)\ncurl -fsSL https://claude.ai/install.sh | bash\n\n# Option B: npm path (requires Node.js)\n# Install nvm (check https://github.com/nvm-sh/nvm for latest version)\ncurl -o- https://raw.githubusercontent.com/nvm-sh/nvm/HEAD/install.sh | bash\nsource ~/.bashrc\nnvm install 20 && nvm use 20\nnpm install -g @anthropic-ai/claude-code\n\n# API key for headless auth\necho \'export ANTHROPIC_API_KEY="sk-ant-..."\' >> ~/.bashrc\nsource ~/.bashrc</code></pre>',
      },
      {
        id: 'ch16-l04', title: 'Persistent Sessions with tmux', xpReward: 125, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: '<h2>Sessions That Survive Disconnection</h2><pre><code>ssh nas\ntmux new-session -s claude-work\ncd /volume1/projects/my-app\nclaude\n# Detach: Ctrl+B then D\n\n# Reconnect from any machine:\nssh nas\ntmux attach -t claude-work</code></pre><h3>Multi-Goal Command Center on NAS</h3><pre><code>tmux new-session -s work\n# Ctrl+B C = new window\n# Window 1: auth refactor\n# Window 2: documentation\n# Window 3: test generation\n# Switch: Ctrl+B N / Ctrl+B P</code></pre>',
      },
      {
        id: 'ch16-l05', title: 'NAS CLAUDE.md and Final Integration', xpReward: 125, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: '<h2>Applying Everything You\'ve Learned</h2><pre><code># ~/.claude/CLAUDE.md on NAS\nRunning on Synology DS925+, DSM 7.x, x86_64.\nNode.js via nvm. Projects in /volume1/projects/.\nNo browser available.\nPersistent sessions via tmux.\n\n## Business Context\nGlobal: /volume1/shared/business-brain/\nPer-project: .business-brain/ in each project root.</code></pre><p>Synology\'s Task Scheduler can run shell scripts that start tmux sessions, invoke Claude Code skills, and deposit output files — fully unattended scheduled automation on always-on hardware. (You\'ll wire one up in the next lesson.)</p>',
      },
      {
        id: 'ch16-l06', title: 'Scheduled Automation with Human Gates', xpReward: 125, videos: [],
        lastVerified: '2026-05-30',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>Automating the Repetitive 80%</h2>
<p>The NAS is always on. <code>claude -p</code> runs unattended. Add a cron entry or Synology Task Scheduler job and you have round-the-clock automation. The senior-engineer rule for what to automate:</p>
<blockquote>Automate the predictable work. Keep a human in the loop for the judgment calls.</blockquote>
<h3>The weekly report — a complete example</h3>
<pre><code>Weekly Report Workflow:
1. [Auto]  Collect: git log, open PRs, closed tickets
2. [Auto]  Draft: run /weekly-status skill via \`claude -p\` (headless)
3. [Human] Review and edit the draft in the morning
4. [Auto]  Send to Slack #team-updates
5. [Auto]  Archive to .business-brain/reports/</code></pre>
<h3>Synology Task Scheduler — the launcher script</h3>
<pre><code>#!/bin/sh
# /volume1/scripts/weekly-report.sh
cd /volume1/projects/kedash-support
export ANTHROPIC_API_KEY="sk-ant-..."
/usr/local/bin/claude -p "Run the /weekly-status skill. Save the draft to reports/draft.md." \\
  --model claude-sonnet-4-6 \\
  --permission-mode plan \\
  --output-format json &gt; reports/last-run.json
</code></pre>
<p>Schedule it from DSM → Control Panel → Task Scheduler → Create → Scheduled Task → User-defined script. Friday 06:00. The draft is waiting when the team logs in.</p>
<h3>The gate principle</h3>
<p>Every workflow that produces external-facing output needs at least one human gate. A 2-minute skim before posting to Slack is often enough — but it must exist. The pattern: auto-draft → human approve → auto-distribute. Never auto-distribute something that hasn't been seen.</p>
<h3>Idle behaviour matters for cost</h3>
<p>From Chapter 12: the prompt cache evicts after 5 minutes. Scheduled jobs spawning fresh sessions every hour pay the cache miss on every run. That's fine — the alternative (a long-lived idle session) wastes more. Just be aware of the trade-off when you design the cadence.</p>
<p><strong>Congratulations.</strong> You've completed the Claude Code Quest. From first session to headless NAS automation — you have the full toolkit: Business Brain, lean CLAUDE.md, the Memory Framework, refined skills, token efficiency, Plan Mode, model selection, subagent dispatch, MCP integration, hardened settings, and unattended scheduled automation.</p>`,
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
  }
);
