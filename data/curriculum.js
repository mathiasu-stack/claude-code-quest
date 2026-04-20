window.CURRICULUM = [
  // ── Chapter 1 ─────────────────────────────────────────────────────────────
  {
    id: 'ch01',
    title: 'Onboarding',
    subtitle: 'Week 1 — Meet Your AI Colleague',
    icon: '🏢',
    xpReward: 200,
    lessons: [
      {
        id: 'ch01-l01', title: 'What is Claude Code?', xpReward: 50, videos: [],
        content: `<h2>Welcome to Acme Corp</h2>
<p>Congratulations on your first day! You've been assigned an AI coding assistant: <strong>Claude Code</strong>. Think of it as a senior engineer who lives in your terminal — one who never sleeps, never gets annoyed at your questions, and has read every doc you've been putting off.</p>
<p>Claude Code is Anthropic's official CLI tool that brings the Claude AI model directly into your development workflow. Unlike a chat interface, Claude Code operates <em>inside your project directory</em>. It can read your files, understand your codebase, make edits, run commands, and help you ship faster.</p>
<h3>What Claude Code can do</h3>
<ul>
  <li>Read, write, and refactor code across your entire project</li>
  <li>Run shell commands and interpret the output</li>
  <li>Explain unfamiliar code or debug errors</li>
  <li>Follow persistent project instructions from a <code>CLAUDE.md</code> file</li>
  <li>Use tools like web search, MCP servers, and custom skills</li>
</ul>
<h3>What it is not</h3>
<p>Claude Code works best as a <em>collaborative partner</em>. You provide direction, context, and judgment; it provides speed, recall, and tireless execution. The quality of what you get out depends heavily on the quality of what you put in.</p>`,
      },
      {
        id: 'ch01-l02', title: 'Installation & Setup', xpReward: 50, videos: [],
        content: `<h2>Getting Claude Code Running</h2>
<p>Claude Code is distributed as an npm package. You'll need Node.js 18+ installed. If you're on a fresh machine, install it from <code>nodejs.org</code> or use <code>nvm</code>.</p>
<h3>Install globally</h3>
<pre><code>npm install -g @anthropic-ai/claude-code</code></pre>
<h3>Authentication</h3>
<ul>
  <li><strong>Claude.ai account</strong> — Sign in via browser (easiest for individuals)</li>
  <li><strong>API key</strong> — Set <code>ANTHROPIC_API_KEY</code> in your environment (recommended for teams)</li>
</ul>
<h3>Verify the installation</h3>
<pre><code>claude --version</code></pre>
<p>You should see the installed version. If you get "command not found", check that your npm global bin directory is in your <code>PATH</code>.</p>
<h3>Updating</h3>
<pre><code>npm update -g @anthropic-ai/claude-code</code></pre>
<p>Run this regularly — new versions often bring improved tool use and new features.</p>`,
      },
      {
        id: 'ch01-l03', title: 'Your First Session', xpReward: 50, videos: [],
        content: `<h2>Starting Your First Session</h2>
<p>Navigate to any project directory in your terminal, then run:</p>
<pre><code>claude</code></pre>
<p>This opens an interactive session. Claude Code immediately reads your project context — files, folder structure, and any <code>CLAUDE.md</code> you've set up.</p>
<h3>The session loop</h3>
<ol>
  <li>You type a message and press Enter</li>
  <li>Claude Code reads relevant files, reasons about the task</li>
  <li>It proposes actions (edits, commands) — some require your approval</li>
  <li>Results appear in the terminal; you give the next instruction</li>
</ol>
<h3>Ending a session</h3>
<p>Type <code>/exit</code> or press <kbd>Ctrl+C</kbd> twice. If you need to resume complex work, use <code>/compact</code> before exiting to create a summary you can hand back in your next session.</p>`,
      },
      {
        id: 'ch01-l04', title: 'Understanding the Interface', xpReward: 50, videos: [],
        content: `<h2>Navigating the Terminal Interface</h2>
<h3>Tool use indicators</h3>
<p>When Claude Code acts on your project, it shows what it's doing: <strong>Read</strong> (viewing a file), <strong>Edit</strong> (modifying — shows a diff), <strong>Bash</strong> (running a shell command), <strong>Write</strong> (creating a new file). Some actions are auto-approved; others require you to press <kbd>Y</kbd>.</p>
<h3>Slash commands</h3>
<p>Commands beginning with <code>/</code> are instructions to Claude Code itself, not to the AI. <code>/clear</code> resets context, <code>/help</code> shows available commands. You'll learn these in Chapter 10.</p>
<h3>Keyboard shortcuts</h3>
<ul>
  <li><kbd>↑</kbd> / <kbd>↓</kbd> — navigate prompt history</li>
  <li><kbd>Ctrl+C</kbd> — cancel current operation</li>
  <li><kbd>Shift+Tab</kbd> — toggle between Auto and Plan modes</li>
</ul>`,
      },
    ],
    practicalTest: {
      id: 'ch01-test',
      scenarioType: 'slack', scenarioFrom: 'Sarah Chen', scenarioRole: 'Engineering Manager', scenarioAvatar: '👩‍💼',
      scenario: `Hey, welcome to the team! 🎉 Before your first standup tomorrow I need to make sure you're set up with Claude Code. Can you let me know: (1) what Claude Code actually is in your own words, and (2) what command you'd type in the terminal to start a session inside a project folder?`,
      task: 'Reply to Sarah with a message that explains what Claude Code is and shows the command to start a session.',
      hint: 'Think about what makes Claude Code different from a normal chatbot, and make sure to include the actual terminal command.',
      minLength: 80, passThreshold: 70, xpReward: 300,
      criteria: [
        { type: 'keyword', value: ['terminal', 'cli', 'command line'], description: 'Mentions it runs in the terminal / is a CLI tool', weight: 1 },
        { type: 'keyword', value: ['claude'], description: 'Includes the `claude` start command', weight: 2 },
        { type: 'keyword', value: ['file', 'files', 'codebase', 'project', 'code'], description: 'Explains it works with your code/files', weight: 1 },
        { type: 'keyword', value: ['ai', 'assistant', 'anthropic', 'model'], description: 'Identifies it as an AI assistant', weight: 1 },
        { type: 'length', value: 80, description: 'Response is at least 80 characters', weight: 1 },
      ],
    },
  },

  // ── Chapter 2 ─────────────────────────────────────────────────────────────
  {
    id: 'ch02',
    title: 'Business Brain',
    subtitle: 'Week 2 — The Foundation Layer',
    icon: '🧠',
    xpReward: 250,
    lessons: [
      {
        id: 'ch02-l01', title: 'What is a Business Brain?', xpReward: 60, videos: [],
        content: `<h2>Centralised Context Beats Smart Orchestration</h2>
<p>One of the most common mistakes teams make with AI coding assistants is trying to make the AI smarter through complex prompt engineering or multi-agent orchestration. The simpler — and more effective — approach is to give the AI a rich, centralised store of business context it can draw from on every task.</p>
<p>A <strong>Business Brain</strong> is a dedicated folder in your project (or organisation) that holds everything an AI assistant needs to understand your business: your brand voice, your clients, your product strategy, your team's conventions, and your domain vocabulary. Instead of explaining your context in every session, you build it once and reference it everywhere.</p>
<h3>What goes in the Business Brain?</h3>
<ul>
  <li><strong>Brand context</strong> — voice, tone, values, messaging guidelines</li>
  <li><strong>Client profiles</strong> — who your users are, their pain points, their vocabulary</li>
  <li><strong>Product strategy</strong> — current priorities, roadmap decisions, what's been ruled out</li>
  <li><strong>Domain glossary</strong> — terms that have specific meanings in your business</li>
  <li><strong>Team conventions</strong> — how your team works, decisions that have been made</li>
</ul>
<h3>Why it matters more than orchestration</h3>
<p>A 5-agent system with shallow context will produce generic output. A single agent with deep business context will produce work that sounds like it came from inside the company. Business context is the multiplier — invest there first.</p>`,
      },
      {
        id: 'ch02-l02', title: 'Structuring the Business Brain Folder', xpReward: 60, videos: [],
        content: `<h2>Folder Layout and File Conventions</h2>
<p>The Business Brain folder is typically stored at the root of your project or in a shared repository accessible to all your projects. A consistent structure makes it easy for Claude Code to find and use the right context.</p>
<h3>Recommended structure</h3>
<pre><code>.business-brain/
├── brand/
│   ├── voice.md          # Tone, style, messaging principles
│   ├── values.md         # Company values and how they show up in work
│   └── visual-identity.md
├── clients/
│   ├── overview.md       # Client segments and profiles
│   └── acme-internal.md  # Notes on this specific project's audience
├── product/
│   ├── strategy.md       # Current priorities, roadmap
│   └── decisions.md      # Key decisions and their rationale
└── team/
    ├── conventions.md    # How we work, PR standards, etc.
    └── glossary.md       # Domain-specific vocabulary</code></pre>
<h3>Referencing Business Brain in CLAUDE.md</h3>
<p>Your project's CLAUDE.md should point Claude Code to the Business Brain folder:</p>
<pre><code>## Business Context
All brand, client, and product context lives in \`.business-brain/\`.
When writing user-facing content, always consult \`.business-brain/brand/voice.md\`.
When discussing product decisions, check \`.business-brain/product/decisions.md\` first.</code></pre>
<p>This single pointer means every skill and every session automatically knows where to find business context — without you having to re-explain it each time.</p>`,
      },
      {
        id: 'ch02-l03', title: 'Business Brain in Practice', xpReward: 60, videos: [],
        content: `<h2>Using Context, Not Repeating It</h2>
<p>The power of a Business Brain is that you write context once and reference it forever. Every skill, every session, every team member draws from the same source of truth.</p>
<h3>Before Business Brain (what most teams do)</h3>
<p>Developer opens Claude Code. Writes: <em>"Write a user-facing error message for when login fails. We use a friendly, professional tone and we're building a B2B SaaS tool for enterprise HR teams."</em> Next session: same explanation again. Six months later: a new team member gives a slightly different description, and the AI produces inconsistent output.</p>
<h3>After Business Brain</h3>
<p>Developer opens Claude Code. Writes: <em>"Write a user-facing error message for when login fails. Follow our tone guidelines."</em> Claude Code reads <code>.business-brain/brand/voice.md</code> and produces output that's perfectly on-brand — without the developer needing to explain it.</p>
<h3>Keeping it current</h3>
<ul>
  <li>Treat Business Brain files like code — they get PR reviews and versioning</li>
  <li>When a major product decision is made, update <code>decisions.md</code> immediately</li>
  <li>When brand guidelines change, update <code>voice.md</code> before the next sprint</li>
  <li>Add a note to your team's definition of done: "Did this change the Business Brain?"</li>
</ul>
<p>A stale Business Brain is worse than no Business Brain — it produces confidently wrong output. Maintenance is not optional.</p>`,
      },
    ],
    practicalTest: {
      id: 'ch02-test',
      scenarioType: 'email', scenarioFrom: 'Jordan Kim', scenarioRole: 'Head of Product', scenarioAvatar: '👩‍💼',
      scenario: `From: jordan.kim@acmecorp.com\nSubject: Setting up our AI context library\n\nHi,\n\nWe keep re-explaining the same context to Claude Code in every session — who our customers are, what our brand voice is, how we make decisions. It's inefficient and inconsistent.\n\nI'd like you to set up a "Business Brain" folder structure for Acme Corp. We're a B2B SaaS company building developer tooling. Our tone is technical but approachable. Our key clients are mid-market engineering teams. Please write out the folder structure and what each key file should contain.`,
      task: 'Design the Business Brain folder structure for Acme Corp and describe what each key file should contain.',
      hint: 'Include at minimum: a brand/voice file, a client overview, and a team conventions file. Show the folder structure clearly.',
      minLength: 150, passThreshold: 70, xpReward: 350,
      criteria: [
        { type: 'keyword', value: ['brand', 'voice', 'tone'], description: 'Includes a brand/voice file', weight: 2 },
        { type: 'keyword', value: ['client', 'customers', 'audience'], description: 'Includes client/audience context', weight: 2 },
        { type: 'keyword', value: ['convention', 'team', 'decision', 'glossary'], description: 'Includes team conventions or decisions', weight: 2 },
        { type: 'regex', value: '\\.(md|txt|json)', description: 'References actual file types', weight: 1 },
        { type: 'length', value: 150, description: 'Response is at least 150 characters', weight: 1 },
      ],
    },
  },

  // ── Chapter 3 ─────────────────────────────────────────────────────────────
  {
    id: 'ch03',
    title: 'CLAUDE.md & Context Management',
    subtitle: 'Week 3 — Teaching Claude Your Ways',
    icon: '📋',
    xpReward: 300,
    lessons: [
      {
        id: 'ch03-l01', title: 'What is CLAUDE.md?', xpReward: 60, videos: [],
        content: `<h2>Persistent Memory for Your Project</h2>
<p>Every time you start a new Claude Code session, the AI starts fresh. <strong>CLAUDE.md</strong> solves this — it's a markdown file you place in your project root that Claude Code reads automatically at the start of every session.</p>
<h3>Where it lives</h3>
<ul>
  <li><code>./CLAUDE.md</code> — project-specific instructions (commit to the repo)</li>
  <li><code>~/.claude/CLAUDE.md</code> — global instructions applied to every project</li>
  <li><code>./src/CLAUDE.md</code> — subdirectory instructions (for monorepos)</li>
</ul>
<h3>What goes in it</h3>
<ul>
  <li>Tech stack and language version</li>
  <li>How to run tests, lint, and build</li>
  <li>Coding conventions and what not to do</li>
  <li>Pointers to your Business Brain folder</li>
  <li>Architecture notes and folder structure</li>
</ul>
<p>The CLAUDE.md is loaded into context on every session — so everything in it costs tokens. This makes <em>what you put in it</em> a critical design decision, not just a convenience.</p>`,
      },
      {
        id: 'ch03-l02', title: 'The 250k Token Limit and Context Rot', xpReward: 60, videos: [],
        content: `<h2>Your Context Window is Finite</h2>
<p>Claude Code has a maximum context window of approximately 250,000 tokens. Every word in your conversation — your messages, Claude's responses, files it reads, your CLAUDE.md — counts against this limit. Understanding this limit is not optional; it directly impacts the quality of output you get.</p>
<h3>What "context rot" looks like</h3>
<p>As a session grows and approaches the limit, something subtle happens: earlier context gets compressed or dropped. The AI starts "forgetting" instructions from earlier in the session. You get responses that ignore constraints you set at the start. Output quality degrades — not dramatically, but consistently.</p>
<h3>The CLAUDE.md trap</h3>
<p>A common mistake is treating CLAUDE.md as a dump for everything you might ever need. A 5,000-word CLAUDE.md is loaded into every single session, consuming tokens before you've typed a single prompt. If 80% of those instructions are irrelevant to the current task, you've wasted context budget on noise.</p>
<h3>The lean context principle</h3>
<p><strong>Load only what's needed for the current session.</strong> This is the single most important rule for maintaining output quality over time. A 300-token CLAUDE.md that's always relevant beats a 3,000-token CLAUDE.md that's usually irrelevant.</p>`,
      },
      {
        id: 'ch03-l03', title: 'Writing a Lean CLAUDE.md', xpReward: 60, videos: [],
        content: `<h2>Less is More</h2>
<p>A well-written CLAUDE.md is concise, declarative, and always relevant. Every line should earn its place — if it's not going to affect Claude Code's behaviour in a meaningful way, cut it.</p>
<h3>What belongs in CLAUDE.md</h3>
<ul>
  <li><strong>Stack and commands</strong> — what language/framework, how to test/build/lint</li>
  <li><strong>Critical constraints</strong> — things Claude Code must never do</li>
  <li><strong>Pointers, not content</strong> — "brand voice is in <code>.business-brain/brand/voice.md</code>" not the full voice guide</li>
  <li><strong>Folder structure</strong> — a brief map so it can navigate efficiently</li>
</ul>
<h3>What does NOT belong in CLAUDE.md</h3>
<ul>
  <li>Long explanations of your business or product (→ Business Brain)</li>
  <li>Workflow instructions for specific tasks (→ skills)</li>
  <li>Rarely-needed edge cases that don't apply to most sessions</li>
  <li>History, context, or "why we made this decision" narratives</li>
</ul>
<h3>The pointer pattern</h3>
<pre><code>## Brand & Product Context
See .business-brain/ for brand voice, client profiles, and product strategy.
Load the relevant file when the task requires it.</code></pre>
<p>This is far better than pasting the full brand voice guide into CLAUDE.md. The guide gets loaded only when relevant, not on every session.</p>`,
      },
      {
        id: 'ch03-l04', title: 'CLAUDE.md as a Team Document', xpReward: 60, videos: [],
        content: `<h2>A Shared Contract with the AI</h2>
<p>When CLAUDE.md is committed to your repo, it becomes a shared document — every team member's Claude Code sessions use the same project context. This is powerful: the AI behaves consistently for everyone on the team.</p>
<h3>What to standardise</h3>
<ul>
  <li><strong>Commands</strong> — test, lint, build, deploy — written as the actual commands</li>
  <li><strong>Constraints</strong> — "never commit to main", "always handle errors", "no var"</li>
  <li><strong>Skill pointers</strong> — list available skills so every session knows what tools exist</li>
</ul>
<h3>Example lean CLAUDE.md</h3>
<pre><code># Acme Billing Service
Stack: TypeScript 5, Node.js 20, PostgreSQL 15, Knex
Test: \`npm test\`  Lint: \`npm run lint\`  Build: \`npm run build\`

## Constraints
- Never commit directly to main
- All async functions must have error handling
- No \`var\` — use \`const\` or \`let\`

## Structure
src/api/ → routes  src/services/ → business logic  src/db/ → queries

## Context
Business context: .business-brain/
Skills: .claude/commands/ (run /help to list them)</code></pre>
<p>This entire CLAUDE.md is under 150 tokens. It's always relevant, always loaded, never wasted.</p>`,
      },
    ],
    practicalTest: {
      id: 'ch03-test',
      scenarioType: 'email', scenarioFrom: 'Priya Nair', scenarioRole: 'Tech Lead', scenarioAvatar: '👩‍💻',
      scenario: `From: priya.nair@acmecorp.com\nSubject: Our CLAUDE.md is a mess\n\nHi,\n\nI just looked at our CLAUDE.md and it's 2,400 words. It has our entire brand history, a full explanation of the product, onboarding docs for new engineers, and the kitchen sink. Sessions are sluggish and Claude keeps ignoring instructions from the start of conversations.\n\nCan you rewrite it? Keep only what's essential. The project is: TypeScript, Node.js 20, PostgreSQL. Test command: npm test. Deploy: npm run deploy. Never commit to main. Error handling on all async functions. Business context is in .business-brain/.`,
      task: 'Write a lean, well-structured CLAUDE.md for the Acme project using only the essential information provided.',
      hint: 'A lean CLAUDE.md is under 200 words. Use pointers for business context rather than pasting it in. Include commands, constraints, and a structure note.',
      minLength: 100, passThreshold: 70, xpReward: 400,
      criteria: [
        { type: 'keyword', value: ['npm test', 'npm run test'], description: 'Includes test command', weight: 2 },
        { type: 'keyword', value: ['npm run deploy', 'deploy'], description: 'Includes deploy command', weight: 2 },
        { type: 'keyword', value: ['main', 'commit'], description: 'Includes no-commit-to-main constraint', weight: 2 },
        { type: 'keyword', value: ['.business-brain', 'business-brain', 'business brain'], description: 'Uses pointer pattern for business context', weight: 2 },
        { type: 'keyword', value: ['typescript', 'TypeScript', 'node', 'postgres'], description: 'Includes stack information', weight: 1 },
        { type: 'length', value: 100, description: 'Response is at least 100 characters', weight: 1 },
      ],
    },
  },

  // ── Chapter 4 ─────────────────────────────────────────────────────────────
  {
    id: 'ch04',
    title: 'Effective Prompting',
    subtitle: 'Week 4 — Speaking the Right Language',
    icon: '✍️',
    xpReward: 250,
    lessons: [
      {
        id: 'ch04-l01', title: 'Why Specificity Matters', xpReward: 50, videos: [],
        content: `<h2>Garbage In, Garbage Out</h2>
<p>The single biggest factor in Claude Code's output quality is how specific your prompt is. Vague instructions produce vague results. Claude Code will make reasonable guesses when information is missing, and those guesses will often be wrong for your context.</p>
<h3>The specificity spectrum</h3>
<table>
  <thead><tr><th>Vague</th><th>Specific</th></tr></thead>
  <tbody>
    <tr><td>"Fix the bug"</td><td>"Fix the off-by-one error in <code>paginate()</code> in <code>src/utils.js</code> — it skips the last item when total is divisible by page size"</td></tr>
    <tr><td>"Make it faster"</td><td>"The <code>loadUsers()</code> function in <code>api/users.js</code> is making N+1 database queries. Refactor it to use a single JOIN."</td></tr>
  </tbody>
</table>
<h3>What to include</h3>
<ul>
  <li><strong>File path</strong> — where is the code?</li>
  <li><strong>Function/class name</strong> — what specifically needs to change?</li>
  <li><strong>Expected behaviour</strong> — what should it do when done?</li>
  <li><strong>Constraints</strong> — what must not change?</li>
</ul>`,
      },
      {
        id: 'ch04-l02', title: 'Providing Context', xpReward: 50, videos: [],
        content: `<h2>Context is Competitive Advantage</h2>
<p>When you open a Claude Code session, it can read your files — but it doesn't automatically understand <em>why</em> things are structured the way they are. Context bridges that gap.</p>
<h3>Types of context to provide</h3>
<p><strong>Background:</strong> What is this project? What tech stack? Without this, Claude Code might suggest solutions that don't fit your environment.</p>
<p><strong>Constraint context:</strong> What must not change? Prevents Claude Code from refactoring things that are intentionally designed a certain way.</p>
<p><strong>Objective context:</strong> Why are you doing this? Helps Claude Code make better judgment calls when it encounters ambiguity.</p>
<pre><code>We're preparing this for a security audit next week, so prioritise safety over brevity.</code></pre>
<h3>Persistent context</h3>
<p>If you find yourself repeating the same context in every session, it belongs in your CLAUDE.md or Business Brain — not in every prompt.</p>`,
      },
      {
        id: 'ch04-l03', title: 'Iterative Prompting', xpReward: 50, videos: [],
        content: `<h2>Prompting is a Conversation, Not a Command</h2>
<p>The best results often come from multiple turns. Think of it like pair programming — you don't give your pair programmer a 500-word spec and wait an hour. You collaborate in real time.</p>
<h3>The iterative loop</h3>
<ol>
  <li><strong>Start rough</strong> — Give the high-level intent and let Claude Code propose an approach</li>
  <li><strong>Review the plan</strong> — Correct it before it writes a line of code</li>
  <li><strong>Refine</strong> — Accept, reject, or redirect specific parts</li>
  <li><strong>Test</strong> — Ask Claude Code to write or run tests to verify the result</li>
</ol>
<h3>When to start fresh</h3>
<p>If a session has gone badly wrong — Claude Code is confused, making circular edits, or the context has bloated — use <code>/clear</code> to reset and start a new, focused conversation with a better-crafted first prompt. Don't double down on a bad session.</p>`,
      },
      {
        id: 'ch04-l04', title: 'Anatomy of a Good Prompt', xpReward: 50, videos: [],
        content: `<h2>The Prompt Formula</h2>
<pre><code>[ACTION] [WHAT] in [WHERE]
so that [WHY / OUTCOME]
[CONSTRAINTS]</code></pre>
<h3>Example</h3>
<pre><code>Refactor the \`calculateTax()\` function in \`src/billing/tax.js\`
so that it handles null and undefined inputs without throwing,
returning 0 in those cases.
Do not change the function signature or any callers.</code></pre>
<p>This prompt hits every mark: clear action, specific target (function + file), success criteria (null handling), and a constraint (don't change callers).</p>
<h3>Avoid these antipatterns</h3>
<ul>
  <li>Combining multiple unrelated tasks in one prompt</li>
  <li>Asking for both implementation and documentation in the same turn</li>
  <li>Underspecifying which file or function when there are several candidates</li>
</ul>`,
      },
    ],
    practicalTest: {
      id: 'ch04-test',
      scenarioType: 'jira', scenarioFrom: 'Marcus Webb', scenarioRole: 'Senior Engineer', scenarioAvatar: '👨‍💻',
      scenario: `ACME-42 · In Review\n\nThe \`calculateDiscount()\` function in \`src/pricing.js\` is crashing when called with null or undefined product objects. We need it to return 0 in those cases instead of throwing. Assigned to you. Please write the prompt you'll give Claude Code to fix this.`,
      task: 'Write the prompt you would give Claude Code to fix the null-handling bug in calculateDiscount().',
      hint: 'A great prompt includes the file path, function name, the current problem, and what the correct behaviour should be.',
      minLength: 80, passThreshold: 70, xpReward: 350,
      criteria: [
        { type: 'keyword', value: ['calculateDiscount', 'calculate_discount', 'calculate discount'], description: 'Names the specific function', weight: 2 },
        { type: 'keyword', value: ['src/pricing.js', 'pricing.js'], description: 'Includes the file path', weight: 2 },
        { type: 'keyword', value: ['null', 'undefined'], description: 'Mentions the null/undefined edge case', weight: 2 },
        { type: 'keyword', value: ['return 0', 'returns 0', '0', 'zero', 'without throwing', 'crash'], description: 'Describes expected behaviour', weight: 1 },
        { type: 'length', value: 80, description: 'Response is at least 80 characters', weight: 1 },
      ],
    },
  },

  // ── Chapter 5 ─────────────────────────────────────────────────────────────
  {
    id: 'ch05',
    title: 'Working with Files',
    subtitle: 'Week 5 — Hands on the Codebase',
    icon: '📁',
    xpReward: 250,
    lessons: [
      {
        id: 'ch05-l01', title: 'Reading Files with Claude Code', xpReward: 50, videos: [],
        content: `<h2>Claude Code as a Code Reader</h2>
<p>Before Claude Code changes anything, it reads. You can ask it to read and explain any file in your project, and it will do so in context — tracing function calls, explaining relationships, answering questions about behaviour.</p>
<pre><code>Read \`src/auth/middleware.js\` and explain what it does, focusing on the token validation logic.</code></pre>
<h3>Cross-file understanding</h3>
<pre><code>Find everywhere that \`UserService\` is called across the codebase and list the call sites.</code></pre>
<p>Claude Code can grep, read, and synthesise information across many files in a single turn — something tedious to do manually.</p>
<h3>Useful questions to ask</h3>
<ul>
  <li>"What would break if I removed this class?"</li>
  <li>"Is there any input validation on this route handler?"</li>
  <li>"What does this function return when the input is empty?"</li>
</ul>`,
      },
      {
        id: 'ch05-l02', title: 'Making Targeted Edits', xpReward: 50, videos: [],
        content: `<h2>Surgical vs Broad Edits</h2>
<p>When you know exactly what needs to change, be specific:</p>
<pre><code>In \`components/Button.tsx\`, change the default \`variant\` prop from "primary" to "secondary".</code></pre>
<p>Targeted prompts produce clean, reviewable diffs. They're less likely to introduce unintended side effects.</p>
<h3>Reviewing diffs</h3>
<p>Claude Code shows diffs for every file it edits. Read them. A 10-second diff review catches most mistakes before they compound. When Claude Code proposes something unexpected, that's a signal your prompt was ambiguous — clarify and try again.</p>
<h3>Undoing changes</h3>
<ul>
  <li>"Revert that last change" — Claude Code can undo its most recent edit</li>
  <li><code>git diff</code> and <code>git checkout</code> — for manual recovery</li>
  <li>Keeping regular commits gives you clean rollback points</li>
</ul>`,
      },
      {
        id: 'ch05-l03', title: 'Multi-file Operations', xpReward: 50, videos: [],
        content: `<h2>Working Across Files</h2>
<p>Claude Code can reason across multiple files simultaneously. It's not just a search-and-replace tool — it understands relationships between files.</p>
<pre><code>Rename the \`processPayment()\` function to \`chargeCard()\` across all files in \`src/\`. Update all call sites and any JSDoc references.</code></pre>
<h3>Tips for multi-file work</h3>
<ul>
  <li>Commit your current state before starting a large multi-file operation</li>
  <li>Ask Claude Code to confirm the scope before it begins: "How many files will this affect?"</li>
  <li>After the operation, ask it to verify: "Check that no call sites were missed"</li>
</ul>
<p>For large operations, switch to Plan Mode first (Chapter 11) so you can review the full scope before any edits are made.</p>`,
      },
      {
        id: 'ch05-l04', title: 'Reviewing Changes Before Accepting', xpReward: 50, videos: [],
        content: `<h2>You're Still in Charge</h2>
<p>Reviewing every change Claude Code proposes — especially in critical paths — is not optional. It's part of the workflow.</p>
<h3>The review habit</h3>
<ol>
  <li>Read the diff completely, not just the first few lines</li>
  <li>Ask: "Does this match my intent?"</li>
  <li>Ask: "Could this break anything I didn't think about?"</li>
  <li>Check that no unrelated files were modified</li>
</ol>
<h3>Asking Claude Code to explain its changes</h3>
<pre><code>Before you make any changes, explain your plan and list every file you'll modify.</code></pre>
<p>A good workflow: commit before every significant Claude Code operation. Then the worst case is always a simple <code>git reset</code>.</p>`,
      },
    ],
    practicalTest: {
      id: 'ch05-test',
      scenarioType: 'email', scenarioFrom: 'David Osei', scenarioRole: 'Tech Lead', scenarioAvatar: '👨‍🔧',
      scenario: `From: david.osei@acmecorp.com\nSubject: Quick task — JSDoc for utils\n\nHi,\n\nWe have a new dev starting Monday and the \`utils/helpers.js\` file is completely undocumented. Can you add JSDoc comments to every function in that file before EOD Friday? Use Claude Code for this — should be a quick job. Thanks.`,
      task: 'Write the Claude Code prompt you would use to add JSDoc comments to all functions in utils/helpers.js.',
      hint: 'Make sure to specify the exact file, what should be added, and that you want it on every function.',
      minLength: 60, passThreshold: 65, xpReward: 350,
      criteria: [
        { type: 'keyword', value: ['utils/helpers.js', 'helpers.js'], description: 'Specifies the correct file path', weight: 2 },
        { type: 'keyword', value: ['jsdoc', 'JSDoc', '@param', '@returns', 'doc comment'], description: 'Mentions JSDoc format', weight: 2 },
        { type: 'keyword', value: ['every function', 'all functions', 'each function'], description: 'Specifies all functions', weight: 2 },
        { type: 'keyword', value: ['comment', 'comments', 'document', 'documentation'], description: 'Includes the word comment or documentation', weight: 1 },
        { type: 'length', value: 60, description: 'Response is at least 60 characters', weight: 1 },
      ],
    },
  },

  // ── Chapter 6 ─────────────────────────────────────────────────────────────
  {
    id: 'ch06',
    title: 'Token Efficiency & Sessions',
    subtitle: 'Week 6 — Working Lean',
    icon: '🪙',
    xpReward: 300,
    lessons: [
      {
        id: 'ch06-l01', title: 'Understanding the 250k Token Budget', xpReward: 60, videos: [],
        content: `<h2>Every Word Costs</h2>
<p>Every word in your conversation with Claude Code — your messages, its responses, file contents it reads, your CLAUDE.md — consumes tokens. Claude Code's context window is approximately 250,000 tokens. That sounds large until you realise a mid-size codebase file can be 2,000 tokens, and a long session can accumulate tens of thousands of tokens in conversation history alone.</p>
<h3>What eats your budget</h3>
<ul>
  <li>Your full conversation history from session start</li>
  <li>Every file Claude Code reads (full content, not summaries)</li>
  <li>Claude Code's responses, tool calls, and reasoning</li>
  <li>Your CLAUDE.md, loaded on every session</li>
  <li>Active skill contents when invoked</li>
</ul>
<h3>Why compacting degrades output</h3>
<p>When a session approaches the limit, Claude Code compresses older context. This compression is lossy — nuance, specific instructions, and edge cases from early in the session can be dropped. You'll notice it as "forgetting" earlier constraints or producing output that ignores decisions you made earlier. This is not a bug; it's physics.</p>
<h3>The practical implication</h3>
<p>Leaner context = better results. Not because Claude Code gets smarter, but because more of its attention is focused on what matters right now rather than diluted across thousands of tokens of noise.</p>`,
      },
      {
        id: 'ch06-l02', title: 'When to Use /clear', xpReward: 60, videos: [],
        content: `<h2>The Fresh Start</h2>
<p><code>/clear</code> resets your conversation context completely. Everything before the <code>/clear</code> is gone — Claude Code starts the next turn as if you just opened a new session.</p>
<h3>When to use /clear</h3>
<ul>
  <li><strong>Task switch</strong> — You've finished one task and are starting something completely different</li>
  <li><strong>Session gone wrong</strong> — Claude Code is confused or has accumulated bad assumptions</li>
  <li><strong>Long build-up</strong> — You've had a very long session and notice degradation in response quality</li>
</ul>
<h3>When NOT to use /clear</h3>
<ul>
  <li>In the middle of a task that needs continuity</li>
  <li>When Claude Code needs to remember earlier decisions in the same workflow</li>
</ul>
<h3>Before you clear</h3>
<p>If there's important context you want to carry forward, summarise it yourself and paste it as your first message after <code>/clear</code>. Or use <code>/compact</code> to let Claude Code create the summary automatically.</p>`,
      },
      {
        id: 'ch06-l03', title: '/compact and Summaries', xpReward: 60, videos: [],
        content: `<h2>Compression Without Loss</h2>
<p><code>/compact</code> asks Claude Code to summarise the current conversation into a compact representation — preserving key decisions, context, and state — then replace the full history with that summary. You continue from a leaner starting point without losing the thread.</p>
<pre><code>/compact Focus on the decisions we made about the auth flow; discard the debugging tangents.</code></pre>
<h3>/compact vs /clear</h3>
<table>
  <thead><tr><th></th><th>/compact</th><th>/clear</th></tr></thead>
  <tbody>
    <tr><td>Preserves context?</td><td>Yes (summarised)</td><td>No</td></tr>
    <tr><td>Reduces tokens?</td><td>Yes</td><td>Completely</td></tr>
    <tr><td>Best for</td><td>Ongoing complex tasks</td><td>Task switch / restart</td></tr>
  </tbody>
</table>
<h3>Important caveat</h3>
<p>Even /compact summaries can lose fidelity. For critical decisions made earlier in the session, consider writing them down externally (a note, a comment in the code) rather than relying purely on the compacted context to remember them.</p>`,
      },
      {
        id: 'ch06-l04', title: 'Structuring Long Sessions', xpReward: 60, videos: [],
        content: `<h2>Staying Lean Over Time</h2>
<p>On large projects, a single task might span multiple days. Without intentional structure, context bloat compounds into a real productivity drag.</p>
<h3>One session, one task</h3>
<p>Start a new session for each distinct task. Use <code>/clear</code> liberally at natural task boundaries. Don't carry unrelated context from yesterday's bug fix into today's feature work.</p>
<h3>Front-load context, don't let it accumulate</h3>
<p>Rather than having Claude Code read files organically throughout a session (which keeps them in context permanently), specify the relevant files at the start and work efficiently with that context:</p>
<pre><code>Focus only on \`src/billing/processor.ts\` and \`src/billing/types.ts\` for this task. Don't read anything else.</code></pre>
<h3>The lean session checklist</h3>
<ul>
  <li>Does this session have a single clear goal?</li>
  <li>Are you carrying context from a different task? (/clear)</li>
  <li>Is the session getting long without progress? (/compact)</li>
  <li>Is your CLAUDE.md lean and pointer-based, not encyclopaedic?</li>
</ul>`,
      },
    ],
    practicalTest: {
      id: 'ch06-test',
      scenarioType: 'slack', scenarioFrom: 'Yuki Tanaka', scenarioRole: 'Senior Engineer', scenarioAvatar: '👩‍🔬',
      scenario: `Hey — our team's Claude Code costs are out of hand. Sessions are running for hours, context keeps ballooning, and I'm seeing 2-3x slower responses by end of day. We're doing a big refactor spanning multiple days. What's your strategy for keeping sessions lean without losing important context?`,
      task: 'Describe your strategy for maintaining token efficiency during a multi-day refactor with Claude Code.',
      hint: 'Your answer should cover /clear, /compact, how to structure sessions, and why lean context produces better results.',
      minLength: 100, passThreshold: 70, xpReward: 400,
      criteria: [
        { type: 'keyword', value: ['/clear', 'clear command', 'clear the context'], description: 'Mentions /clear', weight: 2 },
        { type: 'keyword', value: ['/compact', 'compact command'], description: 'Mentions /compact', weight: 2 },
        { type: 'keyword', value: ['context', 'token', 'tokens', '250k', 'window'], description: 'Discusses context/token management', weight: 1 },
        { type: 'keyword', value: ['session', 'new session', 'one task', 'single task'], description: 'Recommends single-task sessions', weight: 1 },
        { type: 'length', value: 100, description: 'Response is at least 100 characters', weight: 1 },
      ],
    },
  },

  // ── Chapter 7 ─────────────────────────────────────────────────────────────
  {
    id: 'ch07',
    title: 'Skills: Foundations',
    subtitle: 'Week 7 — Reusable Workflows',
    icon: '⚡',
    xpReward: 350,
    lessons: [
      {
        id: 'ch07-l01', title: 'What Are Skills?', xpReward: 70, videos: [],
        content: `<h2>Reusable Prompt Templates</h2>
<p>Skills (custom slash commands) are reusable, parameterised prompt templates stored in <code>.claude/commands/</code>. They let you package complex workflows into a single command invocable from any session.</p>
<h3>Without skills</h3>
<p>Every time you want a PR description, a security review, or a changelog entry, you write the same multi-paragraph prompt from memory. Results vary based on how well you remember the prompt. Context is wasted typing it out.</p>
<h3>With skills</h3>
<p>You run <code>/pr-description</code> or <code>/security-review</code> and get consistent, high-quality output every time — without burning context on the prompt instructions themselves.</p>
<h3>Built-in skills</h3>
<ul>
  <li><code>/init</code> — Initialise a CLAUDE.md for your project</li>
  <li><code>/review</code> — Review a pull request</li>
  <li><code>/security-review</code> — Security check on changed code</li>
  <li><code>/simplify</code> — Code quality pass</li>
</ul>`,
      },
      {
        id: 'ch07-l02', title: 'Progressive Disclosure: Why Skills Beat Static Config', xpReward: 70, videos: [],
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
        id: 'ch07-l03', title: 'Writing Your First Skill', xpReward: 70, videos: [],
        content: `<h2>A Skill is Just a Markdown File</h2>
<p>Creating a skill: create a markdown file in <code>.claude/commands/</code>, name it after the command you want, write the prompt template inside.</p>
<h3>Example: changelog skill</h3>
<p>File: <code>.claude/commands/changelog.md</code></p>
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
  <li>Skills in <code>.claude/commands/</code> are shared with the team via git</li>
  <li>Personal skills go in <code>~/.claude/commands/</code></li>
</ul>`,
      },
      {
        id: 'ch07-l04', title: 'Hook-based Skills', xpReward: 70, videos: [],
        content: `<h2>Skills That Trigger Automatically</h2>
<p>Some skills don't need manual invocation — they run automatically at specific lifecycle events. These are configured in <code>settings.json</code> using hooks.</p>
<h3>Hook events</h3>
<ul>
  <li><strong>PreToolUse</strong> — runs before Claude Code uses any tool</li>
  <li><strong>PostToolUse</strong> — runs after a tool completes</li>
  <li><strong>Stop</strong> — runs when Claude Code finishes responding</li>
  <li><strong>Notification</strong> — triggered by specific conditions</li>
</ul>
<h3>Example: auto-lint on stop</h3>
<pre><code>{
  "hooks": {
    "Stop": [{ "command": "npm run lint" }]
  }
}</code></pre>
<p>Every time Claude Code finishes a response, the linter runs automatically. You never have to remember to lint after a Claude Code edit.</p>
<h3>When hooks shine</h3>
<p>Hooks are best for guardrails — things that should always happen regardless of which skill or task is running. Linting, type checking, running the test suite on a changed file. They're your automated quality gate.</p>`,
      },
    ],
    practicalTest: {
      id: 'ch07-test',
      scenarioType: 'slack', scenarioFrom: 'James Kato', scenarioRole: 'DevOps Lead', scenarioAvatar: '🧑‍💻',
      scenario: `Hey — a few things. First, we keep forgetting to run the linter before commits, causing CI failures. Second, our CLAUDE.md has grown to 3,000 words because we stuffed all our workflow instructions in it. Can you (1) write a settings.json hook to run the linter automatically, and (2) explain why the workflow instructions should be moved to skills instead?`,
      task: 'Write the settings.json hook for auto-linting AND explain why skills beat a large CLAUDE.md for workflow instructions.',
      hint: 'Cover both: the hook config AND the progressive disclosure argument (only name+description in context until invoked).',
      minLength: 120, passThreshold: 70, xpReward: 450,
      criteria: [
        { type: 'keyword', value: ['hook', 'hooks', 'Stop', 'PreToolUse'], description: 'References hook configuration', weight: 2 },
        { type: 'keyword', value: ['npm run lint', 'lint'], description: 'Includes the lint command in the hook', weight: 2 },
        { type: 'keyword', value: ['progressive', 'disclosure', 'name', 'description', 'loaded on demand', 'only when'], description: 'Explains progressive disclosure', weight: 2 },
        { type: 'keyword', value: ['token', 'context', 'cost', 'efficient'], description: 'Makes the token efficiency argument', weight: 1 },
        { type: 'length', value: 120, description: 'Response is at least 120 characters', weight: 1 },
      ],
    },
  },

  // ── Chapter 8 ─────────────────────────────────────────────────────────────
  {
    id: 'ch08',
    title: 'Skills: Methodology',
    subtitle: 'Week 8 — Build Skills That Actually Work',
    icon: '🔬',
    xpReward: 350,
    lessons: [
      {
        id: 'ch08-l01', title: 'Walk Before You Codify', xpReward: 70, videos: [],
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
        id: 'ch08-l02', title: 'Documenting a Workflow Run', xpReward: 70, videos: [],
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
        id: 'ch08-l03', title: 'Writing the Skill from Observation', xpReward: 70, videos: [],
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
    ],
    practicalTest: {
      id: 'ch08-test',
      scenarioType: 'jira', scenarioFrom: 'Engineering Enablement Team', scenarioRole: 'Developer Experience', scenarioAvatar: '🛠️',
      scenario: `ACME-DX-14 · Assigned to You\n\nWe want to build a skill for generating weekly status reports from git commits. Before writing the skill file, you've run the workflow manually three times. Here's what you observed:\n\n- Opening that worked: "Summarise this week's commits into a status report for non-technical stakeholders"\n- Always needed to add: "avoid jargon, focus on business impact"\n- Always needed to add: "group by feature area, not by commit"\n- Required input: the date range\n- Output should be: 3-5 bullet points per feature area, plain English\n\nWrite the skill.md file based on these observations.`,
      task: 'Write the skill.md file for the weekly status report workflow based on the observed manual run notes.',
      hint: 'Encode the corrections (avoid jargon, group by feature area) as guardrails in the skill. Include $ARGUMENTS for the date range.',
      minLength: 120, passThreshold: 70, xpReward: 450,
      criteria: [
        { type: 'keyword', value: ['$ARGUMENTS', '$arguments', 'date range', 'week', 'date'], description: 'Includes $ARGUMENTS for date range input', weight: 2 },
        { type: 'keyword', value: ['jargon', 'technical', 'non-technical', 'business impact', 'plain'], description: 'Encodes the jargon correction', weight: 2 },
        { type: 'keyword', value: ['feature area', 'feature', 'group', 'grouped'], description: 'Encodes the grouping correction', weight: 2 },
        { type: 'keyword', value: ['bullet', 'bullets', 'format', 'output', 'structure'], description: 'Specifies the output format', weight: 1 },
        { type: 'length', value: 120, description: 'Response is at least 120 characters', weight: 1 },
      ],
    },
  },
