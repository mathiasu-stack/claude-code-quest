// Chapters 9–15 — appended after curriculum.js loads
window.CURRICULUM.push(

  // ── Chapter 9 ─────────────────────────────────────────────────────────────
  {
    id: 'ch09',
    title: 'Recursive Skill Refinement',
    subtitle: 'Week 9 — Skills That Get Smarter',
    icon: '🔄',
    xpReward: 400,
    lessons: [
      {
        id: 'ch09-l01', title: 'Failures Are Data', xpReward: 80, videos: [],
        content: '<h2>Every Failure is an Upgrade Opportunity</h2><p>Skills are not write-once artefacts. They\'re living documents that improve every time the workflow produces suboptimal output. When a skill fails, diagnose why and update the skill so it won\'t fail that way again.</p><h3>Common failure patterns</h3><ul><li><strong>Missing context</strong> — the skill didn\'t have information it needed</li><li><strong>Ambiguous instructions</strong> — a phrase was interpreted differently than intended</li><li><strong>Missing guardrails</strong> — an edge case wasn\'t anticipated</li><li><strong>Stale assumptions</strong> — the skill was written when the codebase looked different</li></ul><h3>The update loop</h3><ol><li>Skill produces bad output</li><li>Diagnose the root cause</li><li>Update the skill file to address it</li><li>Re-run on the same input to verify the fix</li><li>Document the change in learnings.md</li></ol>',
      },
      {
        id: 'ch09-l02', title: 'The learnings.md Pattern', xpReward: 80, videos: [],
        content: '<h2>Institutional Memory for AI Workflows</h2><p>A <code>learnings.md</code> file captures what you\'ve discovered about how your AI workflows behave — what works, what doesn\'t, and what you\'ve changed and why.</p><pre><code># Skill Learnings\n\n## pr-description.md\n### v1 → v2 (2024-03-15)\n**Problem**: Output too technical for non-engineering reviewers\n**Fix**: Added "Assume the reader is a product manager, not an engineer"\n**Verified**: Ran on 3 PRs; PM feedback improved significantly</code></pre><p>Without learnings.md, the same mistakes get repeated by new team members who don\'t know the history. With it, the team\'s collective prompt-engineering knowledge compounds over time.</p><h3>Format</h3><ul><li>One entry per meaningful change</li><li>Always include Problem, Fix, and Verified fields</li><li>Date every entry</li></ul>',
      },
      {
        id: 'ch09-l03', title: 'Requesting Human Feedback', xpReward: 80, videos: [],
        content: '<h2>Building Feedback Loops into Skills</h2><p>The most self-improving skills actively request feedback after producing output.</p><pre><code>## Feedback Request\nAfter delivering output, ask:\n"Does this meet the brief? If not, what would you change?\nYour answer will help improve this skill for next time."</code></pre><h3>Closing the loop</h3><p>When the user responds — even briefly ("the tone was too formal") — Claude Code can suggest a skill update right there in the session, then apply it to the skill file. A skill that requests feedback after every use and gets updated from that feedback will be dramatically better after 20 uses than after 1.</p>',
      },
    ],
    practicalTest: {
      id: 'ch09-test',
      scenarioType: 'jira', scenarioFrom: 'Platform Engineering', scenarioRole: 'Tech Lead', scenarioAvatar: '👷',
      scenario: 'ACME-SKILLS-07 · Escalated\n\nOur code-review.md skill is producing inconsistent results:\n- It misses SQL injection risks in template literals\n- It doesn\'t flag hardcoded secrets (API keys, passwords)\n- When it finds issues, the descriptions are too vague to be actionable\n\nDiagnose these failures and write the updated skill instructions that fix all three issues. Also write a learnings.md entry for this update.',
      task: 'Write updated skill instructions fixing the three issues, plus a learnings.md entry documenting the change.',
      hint: 'Encode each failure as a specific guardrail. The learnings.md entry should follow the Problem/Fix/Verified format.',
      minLength: 150, passThreshold: 70, xpReward: 500,
      criteria: [
        { type: 'keyword', value: ['sql injection', 'SQL injection', 'template literal', 'injection'], description: 'Addresses the SQL injection gap', weight: 2 },
        { type: 'keyword', value: ['secret', 'secrets', 'api key', 'API key', 'hardcoded', 'password'], description: 'Addresses hardcoded secrets', weight: 2 },
        { type: 'keyword', value: ['actionable', 'specific', 'vague', 'description'], description: 'Addresses vague descriptions', weight: 1 },
        { type: 'keyword', value: ['learnings', 'learning', 'problem', 'fix', 'verified'], description: 'Includes a learnings.md entry', weight: 2 },
        { type: 'length', value: 150, description: 'Response is at least 150 characters', weight: 1 },
      ],
    },
  },

  // ── Chapter 10 ────────────────────────────────────────────────────────────
  {
    id: 'ch10',
    title: 'Slash Commands & Workflow',
    subtitle: 'Week 10 — Power User Controls',
    icon: '🎮',
    xpReward: 300,
    lessons: [
      {
        id: 'ch10-l01', title: 'Essential Slash Commands', xpReward: 60, videos: [],
        content: '<h2>The Command Vocabulary</h2><table><thead><tr><th>Command</th><th>What it does</th></tr></thead><tbody><tr><td><code>/help</code></td><td>List available commands and skills</td></tr><tr><td><code>/clear</code></td><td>Reset conversation context</td></tr><tr><td><code>/compact</code></td><td>Summarise and compress the session</td></tr><tr><td><code>/init</code></td><td>Generate a CLAUDE.md for the project</td></tr><tr><td><code>/exit</code></td><td>End the session</td></tr><tr><td><code>/status</code></td><td>Show model, usage, session info</td></tr></tbody></table><p>Arguments are passed as text after the command name. <code>/compact Focus on auth decisions</code> passes a focus hint to the compact operation.</p>',
      },
      {
        id: 'ch10-l02', title: '/init and Project Setup', xpReward: 60, videos: [],
        content: '<h2>Bootstrapping a New Project</h2><p><code>/init</code> inspects your project and generates a starter CLAUDE.md — identifying tech stack, test commands, and build tooling automatically.</p><p>Treat it as generating a first draft. After running it: correct inaccuracies, add the Business Brain pointer, apply lean CLAUDE.md principles (Chapter 3), and commit. The generated file is a starting point, not a finished product.</p>',
      },
      {
        id: 'ch10-l03', title: '/help and Skill Discovery', xpReward: 60, videos: [],
        content: '<h2>Always Know What\'s Available</h2><p><code>/help</code> shows all built-in commands plus your custom skills — names and one-line descriptions only (progressive disclosure in action). Run it on any new project to discover what skills the team has set up. You might find a <code>/deploy-staging</code> or <code>/security-review</code> skill that saves significant time.</p>',
      },
      {
        id: 'ch10-l04', title: 'Session Hygiene', xpReward: 60, videos: [],
        content: '<h2>Keeping Sessions Healthy</h2><ul><li>One task per session</li><li>Start with a clear, specific first message</li><li>/clear when switching tasks</li><li>/compact on long sessions before context degrades</li><li>Read every diff before accepting</li></ul><h3>Opening message pattern</h3><pre><code>I\'m adding rate limiting to `/api/auth/login` in `src/routes/auth.js`.\nProject uses express-rate-limit. Don\'t modify any other routes.</code></pre><p>This front-loaded context saves multiple clarification turns and reduces wasted tokens.</p>',
      },
    ],
    practicalTest: {
      id: 'ch10-test',
      scenarioType: 'jira', scenarioFrom: 'Onboarding System', scenarioRole: 'IT Helpdesk', scenarioAvatar: '🖥️',
      scenario: 'ACME-ONBOARDING-10\n\nYou\'ve just been added to the Acme Payments repo. You\'ve cloned it and opened a terminal. List the first 3 Claude Code slash commands you would run and explain why.',
      task: 'List the first 3 Claude Code slash commands you would run in a new repo and explain the purpose of each.',
      hint: 'Think about setup, discovery, and understanding the project. Use numbered steps.',
      minLength: 100, passThreshold: 70, xpReward: 400,
      criteria: [
        { type: 'keyword', value: ['/init'], description: 'Mentions /init', weight: 2 },
        { type: 'keyword', value: ['/help'], description: 'Mentions /help', weight: 2 },
        { type: 'structure', value: 'numbered-steps', description: 'Uses numbered list format', weight: 1 },
        { type: 'keyword', value: ['CLAUDE.md', 'skill', 'context', 'setup', 'project'], description: 'Explains the purpose of at least one command', weight: 1 },
        { type: 'length', value: 100, description: 'Response is at least 100 characters', weight: 1 },
      ],
    },
  },

  // ── Chapter 11 ────────────────────────────────────────────────────────────
  {
    id: 'ch11',
    title: 'Plan Mode',
    subtitle: 'Week 11 — Control the Execution',
    icon: '🗂️',
    xpReward: 350,
    lessons: [
      {
        id: 'ch11-l01', title: 'What is Plan Mode?', xpReward: 70, videos: [],
        content: '<h2>Think Before You Act</h2><p><strong>Plan Mode</strong> separates thinking from acting. Claude Code reasons about the task and produces a detailed plan — but makes no file changes, runs no commands, takes no actions until you explicitly switch back to Auto mode.</p><h3>The three modes</h3><ul><li><strong>Auto</strong> — Default. Plans and executes together.</li><li><strong>Plan</strong> — Think only. No execution until you switch back.</li><li><strong>Auto (no prompts)</strong> — Executes without asking. Use with care.</li></ul><p>Plan Mode is the answer to "how do I review what Claude Code intends to do before it does it?" — the question every developer asks after their first multi-file surprise.</p>',
      },
      {
        id: 'ch11-l02', title: 'Shift+Tab: Switching Modes', xpReward: 70, videos: [],
        content: '<h2>The Mode Cycle</h2><p>Press <kbd>Shift+Tab</kbd> to cycle: Auto → Plan → Auto (no prompts) → Auto</p><h3>Workflow</h3><ol><li>Press Shift+Tab to enter Plan Mode</li><li>Submit your prompt — Claude Code thinks, does not act</li><li>Read the plan, ask questions, request changes</li><li>Press Shift+Tab back to Auto</li><li>Claude Code executes the refined plan</li></ol><p>You can iterate on the plan multiple times. The plan is part of the conversation — Claude Code remembers decisions made during planning when it executes.</p>',
      },
      {
        id: 'ch11-l03', title: 'When to Use Plan Mode', xpReward: 70, videos: [],
        content: '<h2>Choosing the Right Mode</h2><h3>Use Plan Mode for</h3><ul><li>Operations affecting more than 3–5 files</li><li>Renames or restructures of shared interfaces</li><li>Database migrations, security-sensitive changes</li><li>Anything you\'d want code-reviewed before it exists</li></ul><h3>Auto mode is fine for</h3><ul><li>Single-file edits with a clear, bounded scope</li><li>Adding a function or fixing a small bug</li><li>Generating tests for an existing function</li></ul><h3>Heuristic</h3><p>Ask: "If this goes wrong, how long does it take to recover?" More than 5 minutes → use Plan Mode.</p>',
      },
      {
        id: 'ch11-l04', title: 'Reviewing Plans Before Execution', xpReward: 70, videos: [],
        content: '<h2>Reading a Plan Critically</h2><ol><li>Scope check — files affected as expected?</li><li>Approach check — is this the right solution?</li><li>Constraint check — respects your constraints?</li><li>Side-effect check — could this break something else?</li><li>Completeness check — anything missed?</li></ol><p>Correct conversationally before executing: "Remove step 3", "Add a step for TypeScript types", "Step 2 should use a transaction". The execution won\'t start until you switch back to Auto — take your time.</p>',
      },
    ],
    practicalTest: {
      id: 'ch11-test',
      scenarioType: 'slack', scenarioFrom: 'Rachel Okonkwo', scenarioRole: 'QA Lead', scenarioAvatar: '🧪',
      scenario: 'Hey — last week Claude Code made 14 file changes at once as part of a "refactor" and introduced a regression in the payment flow. Developer only noticed after deploying to staging. What workflow change would prevent this?',
      task: 'Explain the workflow change you would recommend to prevent unreviewed multi-file changes causing regressions.',
      hint: 'Specifically mention Plan Mode, how to activate it with Shift+Tab, and when to use it.',
      minLength: 80, passThreshold: 70, xpReward: 450,
      criteria: [
        { type: 'keyword', value: ['plan mode', 'planning mode', 'plan'], description: 'Mentions Plan Mode', weight: 3 },
        { type: 'keyword', value: ['shift+tab', 'shift tab', 'Shift+Tab'], description: 'Mentions the Shift+Tab shortcut', weight: 2 },
        { type: 'keyword', value: ['review', 'verify', 'check', 'approve'], description: 'Emphasises reviewing before execution', weight: 1 },
        { type: 'length', value: 80, description: 'Response is at least 80 characters', weight: 1 },
      ],
    },
  },

  // ── Chapter 12 ────────────────────────────────────────────────────────────
  {
    id: 'ch12',
    title: 'MCP Servers & Integrations',
    subtitle: 'Week 12 — Connecting the World',
    icon: '🔌',
    xpReward: 400,
    lessons: [
      {
        id: 'ch12-l01', title: 'What is MCP?', xpReward: 80, videos: [],
        content: '<h2>Model Context Protocol</h2><p>MCP is an open standard that lets Claude Code connect to external services, databases, and tools. The community has built hundreds of MCP servers for common tools: GitHub, Postgres, Slack, Notion, Linear, Figma, and more. You can also write your own.</p><h3>How it works</h3><ol><li>An MCP server exposes tools over a standardised protocol</li><li>Claude Code connects to the server (local or remote)</li><li>Claude Code uses those tools as naturally as built-in ones</li></ol>',
      },
      {
        id: 'ch12-l02', title: 'Connecting MCP Servers', xpReward: 80, videos: [],
        content: '<h2>Configuration</h2><p>Configure in <code>~/.claude/settings.json</code> (global) or <code>.claude/settings.json</code> (project).</p><pre><code>{\n  "mcpServers": {\n    "postgres": {\n      "command": "npx",\n      "args": ["-y", "@modelcontextprotocol/server-postgres"],\n      "env": { "DATABASE_URL": "postgres://localhost:5432/mydb" }\n    }\n  }\n}</code></pre><p>After adding, run <code>/status</code> to verify the server connected. Use read-only credentials for production databases.</p>',
      },
      {
        id: 'ch12-l03', title: 'Common MCP Use Cases', xpReward: 80, videos: [],
        content: '<h2>What You Can Do with MCP</h2><p><strong>Database:</strong> "Show schema for orders table", "Write a migration to add deleted_at to products", "What indexes exist on users?"</p><p><strong>GitHub:</strong> "Summarise open PRs blocking this release", "Create a PR for the current branch with a description from the commits"</p><p><strong>Business Brain + MCP:</strong> An MCP server can serve your Business Brain folder as a searchable index — returning only the relevant sections rather than loading entire files into context. This scales the Business Brain pattern to large organisations without ballooning token usage.</p>',
      },
      {
        id: 'ch12-l04', title: 'Building a Simple MCP Server', xpReward: 80, videos: [],
        content: '<h2>Writing Your Own MCP Server</h2><p>Anthropic provides official SDKs for TypeScript and Python. A basic server can be written in under 50 lines.</p><pre><code>import { Server } from \'@modelcontextprotocol/sdk/server/index.js\';\nimport { StdioServerTransport } from \'@modelcontextprotocol/sdk/server/stdio.js\';\n\nconst server = new Server({ name: \'acme-wiki\', version: \'1.0.0\' });\n\nserver.tool(\'search_wiki\', { query: { type: \'string\' } }, async ({ query }) => {\n  const results = await searchConfluence(query);\n  return { content: [{ type: \'text\', text: JSON.stringify(results) }] };\n});\n\nawait server.connect(new StdioServerTransport());</code></pre><p>For standard tools, use existing community MCP servers. Build your own only for internal systems without open-source alternatives.</p>',
      },
    ],
    practicalTest: {
      id: 'ch12-test',
      scenarioType: 'jira', scenarioFrom: 'Architecture Review Board', scenarioRole: 'Platform Team', scenarioAvatar: '🏗️',
      scenario: 'ACME-ARCH-23 · Proposal Required\n\nThe dev experience team wants to connect Claude Code to the Acme billing Postgres database so engineers can query schemas and generate migrations during development. Describe how to set this up using MCP, including the configuration.',
      task: 'Describe how to connect Claude Code to a Postgres database using MCP, including the settings.json configuration.',
      hint: 'Include what MCP is, the settings.json config block, and how Claude Code will use the Postgres tools.',
      minLength: 100, passThreshold: 70, xpReward: 500,
      criteria: [
        { type: 'keyword', value: ['mcp', 'MCP', 'model context protocol'], description: 'Mentions MCP', weight: 2 },
        { type: 'keyword', value: ['settings.json', 'mcpServers', 'config'], description: 'References the settings configuration', weight: 2 },
        { type: 'keyword', value: ['postgres', 'postgresql', 'database'], description: 'Mentions Postgres', weight: 1 },
        { type: 'keyword', value: ['server', 'npx', 'command'], description: 'Describes server setup', weight: 1 },
        { type: 'length', value: 100, description: 'Response is at least 100 characters', weight: 1 },
      ],
    },
  },

  // ── Chapter 13 ────────────────────────────────────────────────────────────
  {
    id: 'ch13',
    title: 'Multi-Goal Command Center',
    subtitle: 'Week 13 — Supervising Parallel Work',
    icon: '📊',
    xpReward: 450,
    lessons: [
      {
        id: 'ch13-l01', title: 'Beyond the Single Chat Thread', xpReward: 90, videos: [],
        content: '<h2>Running Multiple Workstreams</h2><p>A single sequential thread is fine for simple work. But as the scope of AI-assisted work grows, it becomes a bottleneck. A Command Center is a model for supervising multiple parallel Claude Code workflows simultaneously — you\'re the lead, not the executor.</p><p>This unlocks dramatically higher throughput, but requires clear task decomposition and well-defined checkpoints.</p>',
      },
      {
        id: 'ch13-l02', title: 'Designing for Parallel Execution', xpReward: 90, videos: [],
        content: '<h2>What Can Run in Parallel?</h2><p>Key question: does task B depend on task A\'s output? If yes — sequential. If no — parallel.</p><pre><code>TODO          IN PROGRESS        AWAITING REVIEW\n─────────     ───────────        ───────────────\nAuth docs     API tests          DB migration\n              (session 1)        (session 2)\n              Feature X docs\n              (session 3)</code></pre><p>You\'re not in any session right now — you\'re looking at the board, deciding where attention is needed. Each session should start with a concise context brief so you can quickly re-orient when you check back in.</p>',
      },
      {
        id: 'ch13-l03', title: 'Human Checkpoints in Parallel Workflows', xpReward: 90, videos: [],
        content: '<h2>Where You Must Be Present</h2><p>Place a checkpoint wherever: the output feeds another task, a judgment call is needed, the action is irreversible, or a wrong output could compound.</p><pre><code>## Checkpoint: Before Finalising\nStop here. Summarise what you\'ve produced and ask:\n"Does this look correct? Anything to adjust before I continue?"\nWait for explicit approval before proceeding.</code></pre><h3>Review rhythm</h3><p>With 3 parallel sessions: check each every 15–30 minutes (or when it signals it\'s waiting). Make decisions quickly, unblock, move on. You\'re doing spot-check reviews and judgment calls — not reading every line of every change.</p>',
      },
    ],
    practicalTest: {
      id: 'ch13-test',
      scenarioType: 'email', scenarioFrom: 'CTO Office', scenarioRole: 'Quarterly Planning', scenarioAvatar: '📊',
      scenario: 'From: planning@acmecorp.com\nSubject: Q2 AI Workflow Design\n\nDesign a Command Center setup for three simultaneous Q2 projects:\n1. Refactoring the auth module (risky, needs careful review)\n2. Writing API documentation for all endpoints\n3. Generating unit tests for the billing service\n\nDescribe how you\'d organise these in parallel, what human checkpoints you\'d put in place, and your review rhythm.',
      task: 'Design a Command Center workflow for three parallel Claude Code sessions, including checkpoints and review rhythm.',
      hint: 'Address all three projects, identify human approval gates (especially for the risky auth refactor), and describe how you track progress.',
      minLength: 150, passThreshold: 70, xpReward: 550,
      criteria: [
        { type: 'keyword', value: ['parallel', 'simultaneously', 'concurrent'], description: 'Addresses parallel execution', weight: 2 },
        { type: 'keyword', value: ['checkpoint', 'review', 'approval', 'gate', 'human'], description: 'Includes human checkpoints', weight: 2 },
        { type: 'keyword', value: ['auth', 'risky', 'careful'], description: 'Gives special attention to the risky auth refactor', weight: 1 },
        { type: 'keyword', value: ['rhythm', 'check in', 'check-in', 'interval', 'monitor'], description: 'Describes a review rhythm', weight: 1 },
        { type: 'length', value: 150, description: 'Response is at least 150 characters', weight: 1 },
      ],
    },
  },

  // ── Chapter 14 ────────────────────────────────────────────────────────────
  {
    id: 'ch14',
    title: 'Advanced Patterns & Scaling',
    subtitle: 'Week 14 — Senior Engineer Moves',
    icon: '🚀',
    xpReward: 500,
    lessons: [
      {
        id: 'ch14-l01', title: 'Start Minimal, Scale Deliberately', xpReward: 100, videos: [],
        content: '<h2>The Complexity Trap</h2><p>A 5-agent system with shallow skills will dramatically underperform a single well-configured agent with deep business context and refined skills. The scaling ladder:</p><ol><li>One agent + core skills — refine 3–5 skills covering frequent tasks</li><li>Business Brain established — context layer complete</li><li>Skills library mature — skills run without manual correction</li><li>Add parallel execution — Command Center model now makes sense</li><li>Sub-agents only when a task genuinely requires specialised context isolation</li></ol><p><strong>Test:</strong> "Does the simpler version fail at this task in a way that complexity would fix?" If no — don\'t add the complexity.</p>',
      },
      {
        id: 'ch14-l02', title: 'Multi-file Refactors', xpReward: 100, videos: [],
        content: '<h2>The Safe Refactor Playbook</h2><ol><li>Scope first — list every file and call site before any changes</li><li>Commit current state</li><li>Use Plan Mode — review the full plan</li><li>Phase the work — types first, then implementations, then callers</li><li>Test at each phase</li><li>Final scan — search for missed references</li></ol><pre><code>Before making any changes, list every file that references `OrderProcessor` and show how each uses it. Don\'t make any changes yet.</code></pre><p>This single step prevents most multi-file refactor disasters.</p>',
      },
      {
        id: 'ch14-l03', title: 'Scheduled Automation with Human Gates', xpReward: 100, videos: [],
        content: '<h2>Automating the Repetitive 80%</h2><p>Automate predictable work; keep a human in the loop for judgment calls.</p><pre><code>Weekly Report Workflow:\n1. [Auto]  Collect: git log, open PRs, closed tickets\n2. [Auto]  Draft: run /weekly-status skill\n3. [Human] Review and edit\n4. [Auto]  Send to Slack #team-updates\n5. [Auto]  Archive to .business-brain/reports/</code></pre><p><strong>Gate principle:</strong> Every workflow producing external-facing output needs at least one human gate. A 2-minute skim is often enough — but it must exist.</p>',
      },
      {
        id: 'ch14-l04', title: 'Test-driven Prompting', xpReward: 100, videos: [],
        content: '<h2>Tests as Specification</h2><p>Write the tests first, then ask Claude Code to implement code that makes them pass. Tests are unambiguous in a way prose descriptions rarely are.</p><pre><code>I\'ve written tests for `formatCurrency()` in `src/utils/format.test.js`.\nImplement `formatCurrency()` in `src/utils/format.js` to pass all of them.\nAfter implementing, run `npm test -- format.test.js` to verify.</code></pre><p>When Claude Code has tests to satisfy, it has an objective success criterion — dramatically reducing "close but not quite right" iterations.</p>',
      },
    ],
    practicalTest: {
      id: 'ch14-test',
      scenarioType: 'jira', scenarioFrom: 'Elena Marchetti', scenarioRole: 'Principal Engineer', scenarioAvatar: '👩‍🏫',
      scenario: 'ACME-SCALE-04 · Architecture Review\n\nA team member built a 5-agent system for generating marketing copy: Agent 1 researches, Agent 2 drafts, Agent 3 checks tone, Agent 4 checks SEO, Agent 5 posts to Slack. It\'s complex, unreliable, and hard to debug.\n\nDescribe how you\'d simplify this to a more maintainable approach. What\'s the minimum viable version? Where should the human gate be?',
      task: 'Redesign the 5-agent marketing copy system as a simpler, more maintainable workflow with a clear human approval gate.',
      hint: 'Apply "start minimal". A single agent with good skills + human review will likely outperform 5 shallow agents. Explain why.',
      minLength: 150, passThreshold: 70, xpReward: 600,
      criteria: [
        { type: 'keyword', value: ['single agent', 'one agent', 'simpler', 'simplify', 'minimal'], description: 'Recommends reducing to fewer agents', weight: 2 },
        { type: 'keyword', value: ['skill', 'skills', 'prompt', 'context', 'business brain'], description: 'Mentions using skills or context instead', weight: 2 },
        { type: 'keyword', value: ['human gate', 'human review', 'approval', 'review before', 'checkpoint'], description: 'Includes a human approval gate', weight: 2 },
        { type: 'keyword', value: ['brand', 'voice', 'tone', 'context'], description: 'Mentions brand/voice context', weight: 1 },
        { type: 'length', value: 150, description: 'Response is at least 150 characters', weight: 1 },
      ],
    },
  },

  // ── Chapter 15 ────────────────────────────────────────────────────────────
  {
    id: 'ch15',
    title: 'Claude Code on NAS',
    subtitle: 'Week 15 — Remote & Headless Capstone',
    icon: '🖥️',
    xpReward: 500,
    lessons: [
      {
        id: 'ch15-l01', title: 'Why Run Claude Code on a NAS?', xpReward: 100, videos: [],
        content: '<h2>The Capstone Setup</h2><p>Running Claude Code on a Synology DS925+ NAS gives you a persistent, always-on environment not tied to a specific laptop. This is the capstone — it combines every concept: SSH workflows, persistent sessions, headless auth, CLAUDE.md, Business Brain, and multi-window Command Center.</p><h3>Use cases</h3><ul><li>Persistent sessions — start, disconnect, reconnect without losing state (tmux)</li><li>Centralised code storage — any machine can SSH in and continue</li><li>Scheduled automation — Claude Code workflows without tying up a laptop</li><li>Multi-Goal Command Center — multiple tmux sessions = multiple parallel workstreams</li></ul>',
      },
      {
        id: 'ch15-l02', title: 'SSH Setup on Synology DSM', xpReward: 100, videos: [],
        content: '<h2>Enabling SSH Access</h2><p>Control Panel → Terminal &amp; SNMP → Enable SSH. Then connect:</p><pre><code>ssh admin@192.168.1.x</code></pre><h3>SSH key auth + config shortcut</h3><pre><code>ssh-keygen -t ed25519 -C "nas-dev"\nssh-copy-id admin@192.168.1.x\n\n# ~/.ssh/config\nHost nas\n  HostName 192.168.1.x\n  User admin\n  IdentityFile ~/.ssh/nas-dev\n  ServerAliveInterval 60</code></pre><p>Connect with just: <code>ssh nas</code></p>',
      },
      {
        id: 'ch15-l03', title: 'Installing Node.js and Claude Code', xpReward: 100, videos: [],
        content: '<h2>Getting Claude Code on DSM</h2><pre><code># Install nvm\ncurl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash\nsource ~/.bashrc\n\n# Install Node.js 20\nnvm install 20 && nvm use 20\n\n# Install Claude Code\nnpm install -g @anthropic-ai/claude-code\n\n# API key for headless auth\necho \'export ANTHROPIC_API_KEY="sk-ant-..."\' >> ~/.bashrc\nsource ~/.bashrc</code></pre>',
      },
      {
        id: 'ch15-l04', title: 'Persistent Sessions with tmux', xpReward: 100, videos: [],
        content: '<h2>Sessions That Survive Disconnection</h2><pre><code>ssh nas\ntmux new-session -s claude-work\ncd /volume1/projects/my-app\nclaude\n# Detach: Ctrl+B then D\n\n# Reconnect from any machine:\nssh nas\ntmux attach -t claude-work</code></pre><h3>Multi-Goal Command Center on NAS</h3><pre><code>tmux new-session -s work\n# Ctrl+B C = new window\n# Window 1: auth refactor\n# Window 2: documentation\n# Window 3: test generation\n# Switch: Ctrl+B N / Ctrl+B P</code></pre>',
      },
      {
        id: 'ch15-l05', title: 'NAS CLAUDE.md and Final Integration', xpReward: 100, videos: [],
        content: '<h2>Applying Everything You\'ve Learned</h2><pre><code># ~/.claude/CLAUDE.md on NAS\nRunning on Synology DS925+, DSM 7.x, x86_64.\nNode.js via nvm. Projects in /volume1/projects/.\nNo browser available.\nPersistent sessions via tmux.\n\n## Business Context\nGlobal: /volume1/shared/business-brain/\nPer-project: .business-brain/ in each project root.</code></pre><p>Synology\'s Task Scheduler can run shell scripts that start tmux sessions, invoke Claude Code skills, and deposit output files — fully unattended scheduled automation on always-on hardware.</p><p><strong>Congratulations.</strong> You\'ve completed the Claude Code Quest. From first session to headless NAS automation — you have the full toolkit: Business Brain, lean CLAUDE.md, refined skills, token efficiency, Plan Mode, MCP, Command Center, and persistent remote execution.</p>',
      },
    ],
    practicalTest: {
      id: 'ch15-test',
      scenarioType: 'jira', scenarioFrom: 'IT Department', scenarioRole: 'Infrastructure Team', scenarioAvatar: '🔧',
      scenario: 'ACME-IT-099 · Final Assessment\n\nSet up a complete Claude Code environment on the office Synology DS925+ NAS:\n- SSH access with key authentication\n- Node.js via nvm\n- Claude Code authenticated via API key\n- Sessions persist after SSH disconnects (tmux)\n- Global CLAUDE.md configured for the NAS environment\n\nDocument the complete command sequence from first SSH connection to a working Claude Code session.',
      task: 'Write the complete step-by-step command sequence to set up Claude Code on a Synology DS925+ NAS, from SSH connection to first working session.',
      hint: 'Cover: SSH connection, nvm/Node install, Claude Code install, API key setup, tmux, and the NAS CLAUDE.md.',
      minLength: 150, passThreshold: 70, xpReward: 600,
      criteria: [
        { type: 'keyword', value: ['ssh', 'SSH'], description: 'Includes SSH connection', weight: 2 },
        { type: 'keyword', value: ['nvm', 'node', 'npm'], description: 'Mentions Node.js/nvm installation', weight: 2 },
        { type: 'keyword', value: ['npm install', 'claude-code', '@anthropic-ai', 'install -g'], description: 'Includes Claude Code install', weight: 2 },
        { type: 'keyword', value: ['tmux', 'persistent', 'detach'], description: 'Covers persistent sessions', weight: 2 },
        { type: 'keyword', value: ['ANTHROPIC_API_KEY', 'api key', 'API key', 'authenticate'], description: 'Covers API key authentication', weight: 1 },
        { type: 'structure', value: 'numbered-steps', description: 'Uses numbered step-by-step format', weight: 1 },
        { type: 'length', value: 150, description: 'Response is at least 150 characters', weight: 1 },
      ],
    },
  }
);
