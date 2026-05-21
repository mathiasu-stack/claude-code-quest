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
      scenarioType: 'slack', scenarioFrom: 'James Kato', scenarioRole: 'DevOps Lead', scenarioAvatar: '🧑‍💻',
      scenario: `Hey — a few things. First, we keep forgetting to run the linter before commits, causing CI failures. Second, our CLAUDE.md has grown to 3,000 words because we stuffed all our workflow instructions in it. Can you (1) write a settings.json hook to run the linter automatically, and (2) explain why the workflow instructions should be moved to skills instead?`,
      task: 'Write the settings.json hook for auto-linting AND explain why skills beat a large CLAUDE.md for workflow instructions.',
      hint: 'Cover both: the hook config AND the progressive disclosure argument (only name+description in context until invoked).',
      minLength: 120, passThreshold: 70, xpReward: 525,
      criteria: [
        { type: 'keyword', value: ['hook', 'hooks', 'Stop', 'PreToolUse'], description: 'References hook configuration', weight: 2 },
        { type: 'keyword', value: ['npm run lint', 'lint'], description: 'Includes the lint command in the hook', weight: 2 },
        { type: 'keyword', value: ['progressive', 'disclosure', 'name', 'description', 'loaded on demand', 'only when'], description: 'Explains progressive disclosure', weight: 2 },
        { type: 'keyword', value: ['token', 'context', 'cost', 'efficient'], description: 'Makes the token efficiency argument', weight: 1 },
        { type: 'length', value: 120, description: 'Response is at least 120 characters', weight: 1 },
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
    ],
    practicalTest: {
      id: 'ch09-test',
      scenarioType: 'jira', scenarioFrom: 'Engineering Enablement Team', scenarioRole: 'Developer Experience', scenarioAvatar: '🛠️',
      scenario: `KEDASH-DX-14 · Assigned to You\n\nWe want to build a skill for generating weekly status reports from git commits. Before writing the skill file, you've run the workflow manually three times. Here's what you observed:\n\n- Opening that worked: "Summarise this week's commits into a status report for non-technical stakeholders"\n- Always needed to add: "avoid jargon, focus on business impact"\n- Always needed to add: "group by feature area, not by commit"\n- Required input: the date range\n- Output should be: 3-5 bullet points per feature area, plain English\n\nWrite the skill.md file based on these observations.`,
      task: 'Write the skill.md file for the weekly status report workflow based on the observed manual run notes.',
      hint: 'Encode the corrections (avoid jargon, group by feature area) as guardrails in the skill. Include $ARGUMENTS for the date range.',
      minLength: 120, passThreshold: 70, xpReward: 550,
      criteria: [
        { type: 'keyword', value: ['$ARGUMENTS', '$arguments', 'date range', 'week', 'date'], description: 'Includes $ARGUMENTS for date range input', weight: 2 },
        { type: 'keyword', value: ['jargon', 'technical', 'non-technical', 'business impact', 'plain'], description: 'Encodes the jargon correction', weight: 2 },
        { type: 'keyword', value: ['feature area', 'feature', 'group', 'grouped'], description: 'Encodes the grouping correction', weight: 2 },
        { type: 'keyword', value: ['bullet', 'bullets', 'format', 'output', 'structure'], description: 'Specifies the output format', weight: 1 },
        { type: 'length', value: 120, description: 'Response is at least 120 characters', weight: 1 },
      ],
    },
  },
  // ── Chapter 12 ────────────────────────────────────────────────────────────
  {
    id: 'ch10',
    title: 'Recursive Skill Refinement',
    subtitle: 'Week 12 — Skills That Get Smarter',
    icon: '🔄',
    xpReward: 420,
    lessons: [
      {
        id: 'ch10-l01', title: 'Failures Are Data', xpReward: 105, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: '<h2>Every Failure is an Upgrade Opportunity</h2><p>Skills are not write-once artefacts. They\'re living documents that improve every time the workflow produces suboptimal output. When a skill fails, diagnose why and update the skill so it won\'t fail that way again.</p><h3>Common failure patterns</h3><ul><li><strong>Missing context</strong> — the skill didn\'t have information it needed</li><li><strong>Ambiguous instructions</strong> — a phrase was interpreted differently than intended</li><li><strong>Missing guardrails</strong> — an edge case wasn\'t anticipated</li><li><strong>Stale assumptions</strong> — the skill was written when the codebase looked different</li></ul><h3>The update loop</h3><ol><li>Skill produces bad output</li><li>Diagnose the root cause</li><li>Update the skill file to address it</li><li>Re-run on the same input to verify the fix</li><li>Document the change in learnings.md</li></ol>',
      },
      {
        id: 'ch10-l02', title: 'The learnings.md Pattern', xpReward: 105, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: '<h2>Institutional Memory for AI Workflows</h2><p>A <code>learnings.md</code> file captures what you\'ve discovered about how your AI workflows behave — what works, what doesn\'t, and what you\'ve changed and why.</p><pre><code># Skill Learnings\n\n## pr-description.md\n### v1 → v2 (2024-03-15)\n**Problem**: Output too technical for non-engineering reviewers\n**Fix**: Added "Assume the reader is a product manager, not an engineer"\n**Verified**: Ran on 3 PRs; PM feedback improved significantly</code></pre><p>Without learnings.md, the same mistakes get repeated by new team members who don\'t know the history. With it, the team\'s collective prompt-engineering knowledge compounds over time.</p><h3>Format</h3><ul><li>One entry per meaningful change</li><li>Always include Problem, Fix, and Verified fields</li><li>Date every entry</li></ul>',
      },
      {
        id: 'ch10-l03', title: 'Requesting Human Feedback', xpReward: 105, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: '<h2>Building Feedback Loops into Skills</h2><p>The most self-improving skills actively request feedback after producing output.</p><pre><code>## Feedback Request\nAfter delivering output, ask:\n"Does this meet the brief? If not, what would you change?\nYour answer will help improve this skill for next time."</code></pre><h3>Closing the loop</h3><p>When the user responds — even briefly ("the tone was too formal") — Claude Code can suggest a skill update right there in the session, then apply it to the skill file. A skill that requests feedback after every use and gets updated from that feedback will be dramatically better after 20 uses than after 1.</p>',
      },
    ],
    practicalTest: {
      id: 'ch10-test',
      scenarioType: 'jira', scenarioFrom: 'Platform Engineering', scenarioRole: 'Tech Lead', scenarioAvatar: '👷',
      scenario: 'KEDASH-SKILLS-07 · Escalated\n\nOur code-review.md skill is producing inconsistent results:\n- It misses SQL injection risks in template literals\n- It doesn\'t flag hardcoded secrets (API keys, passwords)\n- When it finds issues, the descriptions are too vague to be actionable\n\nDiagnose these failures and write the updated skill instructions that fix all three issues. Also write a learnings.md entry for this update.',
      task: 'Write updated skill instructions fixing the three issues, plus a learnings.md entry documenting the change.',
      hint: 'Encode each failure as a specific guardrail. The learnings.md entry should follow the Problem/Fix/Verified format.',
      minLength: 150, passThreshold: 70, xpReward: 575,
      criteria: [
        { type: 'keyword', value: ['sql injection', 'SQL injection', 'template literal', 'injection'], description: 'Addresses the SQL injection gap', weight: 2 },
        { type: 'keyword', value: ['secret', 'secrets', 'api key', 'API key', 'hardcoded', 'password'], description: 'Addresses hardcoded secrets', weight: 2 },
        { type: 'keyword', value: ['actionable', 'specific', 'vague', 'description'], description: 'Addresses vague descriptions', weight: 1 },
        { type: 'keyword', value: ['learnings', 'learning', 'problem', 'fix', 'verified'], description: 'Includes a learnings.md entry', weight: 2 },
        { type: 'length', value: 150, description: 'Response is at least 150 characters', weight: 1 },
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
      scenarioType: 'jira', scenarioFrom: 'Architecture Review Board', scenarioRole: 'Platform Team', scenarioAvatar: '🏗️',
      scenario: 'KEDASH-ARCH-23 · Proposal Required\n\nThe dev experience team wants to connect Claude Code to the Kedash billing Postgres database so engineers can query schemas and generate migrations during development. Describe how to set this up using MCP, including the configuration.',
      task: 'Describe how to connect Claude Code to a Postgres database using MCP, including the settings.json configuration.',
      hint: 'Include what MCP is, the .mcp.json config block (or ~/.claude.json for user-level), and how Claude Code will use the Postgres tools.',
      minLength: 100, passThreshold: 70, xpReward: 600,
      criteria: [
        { type: 'keyword', value: ['mcp', 'MCP', 'model context protocol'], description: 'Mentions MCP', weight: 2 },
        { type: 'keyword', value: ['settings.json', 'mcpServers', 'config'], description: 'References the settings configuration', weight: 2 },
        { type: 'keyword', value: ['postgres', 'postgresql', 'database'], description: 'Mentions Postgres', weight: 1 },
        { type: 'keyword', value: ['server', 'npx', 'command'], description: 'Describes server setup', weight: 1 },
        { type: 'length', value: 100, description: 'Response is at least 100 characters', weight: 1 },
      ],
    },
  },

  // ── Chapter 14 ────────────────────────────────────────────────────────────
  {
    id: 'ch14',
    title: 'Multi-Goal Command Center',
    subtitle: 'Week 14 — Supervising Parallel Work',
    icon: '📊',
    xpReward: 460,
    lessons: [
      {
        id: 'ch14-l01', title: 'Beyond the Single Chat Thread', xpReward: 115, videos: ['<iframe src="https://www.youtube.com/embed/t5dpuXto-AM" title="Claude Code Agent Teams: Install, Build &amp; Run Them in Parallel" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: '<h2>Running Multiple Workstreams</h2><p>A single sequential thread is fine for simple work. But as the scope of AI-assisted work grows, it becomes a bottleneck. A Command Center is a model for supervising multiple parallel Claude Code workflows simultaneously — you\'re the lead, not the executor.</p><p>This unlocks dramatically higher throughput, but requires clear task decomposition and well-defined checkpoints.</p>',
      },
      {
        id: 'ch14-l02', title: 'Designing for Parallel Execution', xpReward: 115, videos: ['<iframe src="https://www.youtube.com/embed/4AArCH1fgQQ" title="The Simplest Way to Run Parallel AI Agents with Claude Code" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: '<h2>What Can Run in Parallel?</h2><p>Key question: does task B depend on task A\'s output? If yes — sequential. If no — parallel.</p><pre><code>TODO          IN PROGRESS        AWAITING REVIEW\n─────────     ───────────        ───────────────\nAuth docs     API tests          DB migration\n              (session 1)        (session 2)\n              Feature X docs\n              (session 3)</code></pre><p>You\'re not in any session right now — you\'re looking at the board, deciding where attention is needed. Each session should start with a concise context brief so you can quickly re-orient when you check back in.</p>',
      },
      {
        id: 'ch14-l03', title: 'Human Checkpoints in Parallel Workflows', xpReward: 115, videos: ['<iframe src="https://www.youtube.com/embed/RpUTF_U4kiw" title="Claude Code Multi-Agent Orchestration with Opus 4.6" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: '<h2>Where You Must Be Present</h2><p>Place a checkpoint wherever: the output feeds another task, a judgment call is needed, the action is irreversible, or a wrong output could compound.</p><pre><code>## Checkpoint: Before Finalising\nStop here. Summarise what you\'ve produced and ask:\n"Does this look correct? Anything to adjust before I continue?"\nWait for explicit approval before proceeding.</code></pre><h3>Review rhythm</h3><p>With 3 parallel sessions: check each every 15–30 minutes (or when it signals it\'s waiting). Make decisions quickly, unblock, move on. You\'re doing spot-check reviews and judgment calls — not reading every line of every change.</p>',
      },
    ],
    practicalTest: {
      id: 'ch14-test',
      scenarioType: 'email', scenarioFrom: 'CTO Office', scenarioRole: 'Quarterly Planning', scenarioAvatar: '📊',
      scenario: 'From: planning@acmecorp.com\nSubject: Q2 AI Workflow Design\n\nDesign a Command Center setup for three simultaneous Q2 projects:\n1. Refactoring the auth module (risky, needs careful review)\n2. Writing API documentation for all endpoints\n3. Generating unit tests for the billing service\n\nDescribe how you\'d organise these in parallel, what human checkpoints you\'d put in place, and your review rhythm.',
      task: 'Design a Command Center workflow for three parallel Claude Code sessions, including checkpoints and review rhythm.',
      hint: 'Address all three projects, identify human approval gates (especially for the risky auth refactor), and describe how you track progress.',
      minLength: 150, passThreshold: 70, xpReward: 625,
      criteria: [
        { type: 'keyword', value: ['parallel', 'simultaneously', 'concurrent'], description: 'Addresses parallel execution', weight: 2 },
        { type: 'keyword', value: ['checkpoint', 'review', 'approval', 'gate', 'human'], description: 'Includes human checkpoints', weight: 2 },
        { type: 'keyword', value: ['auth', 'risky', 'careful'], description: 'Gives special attention to the risky auth refactor', weight: 1 },
        { type: 'keyword', value: ['rhythm', 'check in', 'check-in', 'interval', 'monitor'], description: 'Describes a review rhythm', weight: 1 },
        { type: 'length', value: 150, description: 'Response is at least 150 characters', weight: 1 },
      ],
    },
  },

  // ── Chapter 15 ────────────────────────────────────────────────────────────
  {
    id: 'ch15',
    title: 'Advanced Patterns & Scaling',
    subtitle: 'Week 15 — Senior Engineer Moves',
    icon: '🚀',
    xpReward: 480,
    lessons: [
      {
        id: 'ch15-l01', title: 'Start Minimal, Scale Deliberately', xpReward: 120, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: '<h2>The Complexity Trap</h2><p>A 5-agent system with shallow skills will dramatically underperform a single well-configured agent with deep business context and refined skills. The scaling ladder:</p><ol><li>One agent + core skills — refine 3–5 skills covering frequent tasks</li><li>Business Brain established — context layer complete</li><li>Skills library mature — skills run without manual correction</li><li>Add parallel execution — Command Center model now makes sense</li><li>Sub-agents only when a task genuinely requires specialised context isolation</li></ol><p><strong>Test:</strong> "Does the simpler version fail at this task in a way that complexity would fix?" If no — don\'t add the complexity.</p>',
      },
      {
        id: 'ch15-l02', title: 'Multi-file Refactors', xpReward: 120, videos: ['<iframe src="https://www.youtube.com/embed/Ac0FMtVYKkA" title="Claude Code\'s Secret Weapon: Access Multiple Directories in One Session" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: '<h2>The Safe Refactor Playbook</h2><ol><li>Scope first — list every file and call site before any changes</li><li>Commit current state</li><li>Use Plan Mode — review the full plan</li><li>Phase the work — types first, then implementations, then callers</li><li>Test at each phase</li><li>Final scan — search for missed references</li></ol><pre><code>Before making any changes, list every file that references `OrderProcessor` and show how each uses it. Don\'t make any changes yet.</code></pre><p>This single step prevents most multi-file refactor disasters.</p>',
      },
      {
        id: 'ch15-l03', title: 'Scheduled Automation with Human Gates', xpReward: 120, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: '<h2>Automating the Repetitive 80%</h2><p>Automate predictable work; keep a human in the loop for judgment calls.</p><pre><code>Weekly Report Workflow:\n1. [Auto]  Collect: git log, open PRs, closed tickets\n2. [Auto]  Draft: run /weekly-status skill\n3. [Human] Review and edit\n4. [Auto]  Send to Slack #team-updates\n5. [Auto]  Archive to .business-brain/reports/</code></pre><p><strong>Gate principle:</strong> Every workflow producing external-facing output needs at least one human gate. A 2-minute skim is often enough — but it must exist.</p>',
      },
      {
        id: 'ch15-l04', title: 'Test-driven Prompting', xpReward: 120, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: '<h2>Tests as Specification</h2><p>Write the tests first, then ask Claude Code to implement code that makes them pass. Tests are unambiguous in a way prose descriptions rarely are.</p><pre><code>I\'ve written tests for `formatCurrency()` in `src/utils/format.test.js`.\nImplement `formatCurrency()` in `src/utils/format.js` to pass all of them.\nAfter implementing, run `npm test -- format.test.js` to verify.</code></pre><p>When Claude Code has tests to satisfy, it has an objective success criterion — dramatically reducing "close but not quite right" iterations.</p>',
      },
    ],
    practicalTest: {
      id: 'ch15-test',
      scenarioType: 'jira', scenarioFrom: 'Elena Marchetti', scenarioRole: 'Principal Engineer', scenarioAvatar: '👩‍🏫',
      scenario: 'KEDASH-SCALE-04 · Architecture Review\n\nA team member built a 5-agent system for generating marketing copy: Agent 1 researches, Agent 2 drafts, Agent 3 checks tone, Agent 4 checks SEO, Agent 5 posts to Slack. It\'s complex, unreliable, and hard to debug.\n\nDescribe how you\'d simplify this to a more maintainable approach. What\'s the minimum viable version? Where should the human gate be?',
      task: 'Redesign the 5-agent marketing copy system as a simpler, more maintainable workflow with a clear human approval gate.',
      hint: 'Apply "start minimal". A single agent with good skills + human review will likely outperform 5 shallow agents. Explain why.',
      minLength: 150, passThreshold: 70, xpReward: 650,
      criteria: [
        { type: 'keyword', value: ['single agent', 'one agent', 'simpler', 'simplify', 'minimal'], description: 'Recommends reducing to fewer agents', weight: 2 },
        { type: 'keyword', value: ['skill', 'skills', 'prompt', 'context', 'business brain'], description: 'Mentions using skills or context instead', weight: 2 },
        { type: 'keyword', value: ['human gate', 'human review', 'approval', 'review before', 'checkpoint'], description: 'Includes a human approval gate', weight: 2 },
        { type: 'keyword', value: ['brand', 'voice', 'tone', 'context'], description: 'Mentions brand/voice context', weight: 1 },
        { type: 'length', value: 150, description: 'Response is at least 150 characters', weight: 1 },
      ],
    },
  },

  // ── Chapter 16 ────────────────────────────────────────────────────────────
  {
    id: 'ch16',
    title: 'Claude Code on NAS',
    subtitle: 'Week 16 — Remote & Headless Capstone',
    icon: '🖥️',
    xpReward: 500,
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
        content: '<h2>Applying Everything You\'ve Learned</h2><pre><code># ~/.claude/CLAUDE.md on NAS\nRunning on Synology DS925+, DSM 7.x, x86_64.\nNode.js via nvm. Projects in /volume1/projects/.\nNo browser available.\nPersistent sessions via tmux.\n\n## Business Context\nGlobal: /volume1/shared/business-brain/\nPer-project: .business-brain/ in each project root.</code></pre><p>Synology\'s Task Scheduler can run shell scripts that start tmux sessions, invoke Claude Code skills, and deposit output files — fully unattended scheduled automation on always-on hardware.</p><p><strong>Congratulations.</strong> You\'ve completed the Claude Code Quest. From first session to headless NAS automation — you have the full toolkit: Business Brain, lean CLAUDE.md, The Memory Framework, refined skills, token efficiency, Plan Mode, MCP, Command Center, and persistent remote execution.</p>',
      },
    ],
    practicalTest: {
      id: 'ch16-test',
      scenarioType: 'jira', scenarioFrom: 'IT Department', scenarioRole: 'Infrastructure Team', scenarioAvatar: '🔧',
      scenario: 'KEDASH-IT-099 · Final Assessment\n\nSet up a complete Claude Code environment on the office Synology DS925+ NAS:\n- SSH access with key authentication\n- Node.js via nvm\n- Claude Code authenticated via API key\n- Sessions persist after SSH disconnects (tmux)\n- Global CLAUDE.md configured for the NAS environment\n\nDocument the complete command sequence from first SSH connection to a working Claude Code session.',
      task: 'Write the complete step-by-step command sequence to set up Claude Code on a Synology DS925+ NAS, from SSH connection to first working session.',
      hint: 'Cover: SSH connection, Claude Code install (native installer or nvm/npm path), API key setup, tmux for persistent sessions, and the NAS CLAUDE.md.',
      minLength: 150, passThreshold: 70, xpReward: 675,
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
