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
        id: 'ch01-l01', title: 'What is Claude Code?', xpReward: 50, videos: ['<iframe src="https://www.youtube.com/embed/AJpK3YTTKZ4" title="Introducing Claude Code" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'],
        lastVerified: '2026-06-14',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>Welcome to Kedash Corp</h2>
<div class="lesson-todo-shot" data-todo="screenshot"><strong>📸 TODO:</strong> Capture your own terminal screenshot of <code>claude</code> on first run (the welcome banner with version + model + working directory) and replace this marker. Save as <code>play/assets/lessons/ch01-l01.png</code>.</div>
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
        check: {
          question: 'Which statement best describes how Claude Code is different from a typical chat interface?',
          options: [
            'It uses a more advanced AI model than the chat product',
            'It runs inside your project directory and can read, write, and run files',
            'It works without an internet connection',
            'It only answers coding questions and refuses other topics',
          ],
          correctIndex: 1,
          explanation: 'The key difference is that Claude Code is a CLI that operates inside your project — it can actually read, edit, and run code, not just discuss it.',
        },
      },
      {
        id: 'ch01-l02', title: 'Installation & Setup', xpReward: 50, videos: ['<iframe src="https://www.youtube.com/embed/SUysp3sJHbA" title="Claude Code Tutorial #1 - Introduction &amp; Setup" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: `<h2>Getting Claude Code Running</h2>
<p>The recommended way to install Claude Code is via the native installer — no Node.js required. The installer bundles its own binary.</p>
<h3>First: open a terminal</h3>
<p>The install commands below are typed into a <strong>terminal</strong> (also called "command line" or "shell"). If you've never used one, here's how to find it:</p>
<ul>
  <li><strong>Windows</strong> — Press <code>Win</code>, type <code>powershell</code>, and open <strong>Windows PowerShell</strong>. <code>Command Prompt</code> (search <code>cmd</code>) also works for most commands. PowerShell is recommended — it handles modern syntax better. A black or dark blue window opens with a blinking cursor; that's where you type.</li>
  <li><strong>macOS</strong> — Press <code>⌘</code>+<code>Space</code>, type <code>Terminal</code>, press Enter. Or open <em>Applications → Utilities → Terminal</em>.</li>
  <li><strong>Linux</strong> — Press <code>Ctrl</code>+<code>Alt</code>+<code>T</code>, or open the <em>Terminal</em> app from your launcher.</li>
</ul>
<p><strong>How to use it:</strong> click into the window so the cursor is active, paste or type a command, then press <code>Enter</code> to run it. To paste in Windows PowerShell, right-click (or <code>Ctrl</code>+<code>V</code> on newer versions). On macOS/Linux, <code>⌘</code>+<code>V</code> / <code>Ctrl</code>+<code>Shift</code>+<code>V</code>.</p>
<h3>Native install (recommended)</h3>
<p>Pick the line for your OS, paste it into the terminal, press Enter:</p>
<pre><code># macOS / Linux / WSL — paste into Terminal
curl -fsSL https://claude.ai/install.sh | bash

# macOS via Homebrew — paste into Terminal
brew install --cask claude-code

# Windows via WinGet — paste into PowerShell or Command Prompt
winget install Anthropic.ClaudeCode</code></pre>
<h3>Alternative: npm (advanced)</h3>
<p>If you prefer the npm path, Node.js 18+ is required:</p>
<pre><code>npm install -g @anthropic-ai/claude-code</code></pre>
<h3>Authentication</h3>
<ul>
  <li><strong>Claude.ai account</strong> — Sign in via browser (easiest for individuals)</li>
  <li><strong>API key</strong> — Set <code>ANTHROPIC_API_KEY</code> in your environment (recommended for teams)</li>
</ul>
<h3>Verify the installation</h3>
<pre><code>claude --version</code></pre>
<h3>Updating</h3>
<pre><code>claude update</code></pre>
<p>Native installs also auto-update in the background. Run <code>claude update</code> to force an immediate update.</p>`,
        check: {
          question: 'Your teammate is on a fresh macOS laptop and wants the simplest install — no Node.js, no extra tooling. What do you recommend?',
          options: [
            'Install Node.js first, then `npm install -g @anthropic-ai/claude-code`',
            'Run the native installer: `curl -fsSL https://claude.ai/install.sh | bash` (or `brew install --cask claude-code`)',
            'Download a zip from the website and add it to PATH manually',
            'Use the npm version because it auto-updates more reliably',
          ],
          correctIndex: 1,
          explanation: 'The native installer is the recommended path — it bundles its own binary, no Node.js required, and auto-updates in the background.',
        },
      },
      {
        id: 'ch01-l03', title: 'Your First Session', xpReward: 50, videos: ['<iframe src="https://www.youtube.com/embed/ntDIxaeo3Wg" title="Claude Code - Full Tutorial for Beginners" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: `<h2>Starting Your First Session</h2>
<p>You need to be <em>inside</em> the folder of the project you want Claude to work on. In your terminal (PowerShell / Command Prompt on Windows, Terminal on macOS/Linux), use the <code>cd</code> ("change directory") command followed by the folder path.</p>
<pre><code># Examples — pick whichever matches where your project lives
cd C:\\Users\\YourName\\Documents\\my-project   # Windows PowerShell
cd ~/Documents/my-project                       # macOS / Linux
cd /volume1/projects/my-project                 # NAS</code></pre>
<p>Verify you're in the right place with <code>pwd</code> (macOS/Linux/PowerShell) — it prints the current directory. Then start the session:</p>
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
        check: {
          question: 'You\'ve been working on a complex refactor for 30 minutes and need to step away. You want to pick up exactly where you left off in the next session. What\'s the right move before exiting?',
          options: [
            'Just close the terminal — Claude Code remembers everything automatically',
            'Run `/compact` to generate a summary you can hand back next session',
            'Copy the entire conversation into a Google Doc',
            'Press Ctrl+C three times to save state',
          ],
          correctIndex: 1,
          explanation: '`/compact` summarises the session into something compact enough to fit back into context next time — that\'s how you preserve work across sessions.',
        },
      },
      {
        id: 'ch01-l04', title: 'Understanding the Interface', xpReward: 50, videos: ['<iframe src="https://www.youtube.com/embed/pUykUYkFVTM" title="Master Claude Code in 2 Hours (What Actually Matters)" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: `<h2>Navigating the Terminal Interface</h2>
<h3>Tool use indicators</h3>
<p>When Claude Code acts on your project, it shows what it's doing: <strong>Read</strong> (viewing a file), <strong>Edit</strong> (modifying — shows a diff), <strong>Bash</strong> (running a shell command), <strong>Write</strong> (creating a new file). Some actions are auto-approved; others require you to press <kbd>Y</kbd>.</p>
<h3>Slash commands</h3>
<p>Commands beginning with <code>/</code> are instructions to Claude Code itself, not to the AI. <code>/clear</code> resets context, <code>/help</code> shows available commands. You'll learn these in Chapter 5.</p>
<h3>Keyboard shortcuts</h3>
<ul>
  <li><kbd>↑</kbd> / <kbd>↓</kbd> — navigate prompt history</li>
  <li><kbd>Ctrl+C</kbd> — cancel current operation</li>
  <li><kbd>Shift+Tab</kbd> — toggle between Auto and Plan modes</li>
</ul>`,
        check: {
          question: 'You see Claude Code about to run a `Bash` command but it\'s pausing for input. What\'s it asking you to do?',
          options: [
            'Choose between several command options it\'s suggesting',
            'Approve the command before it runs (press Y to allow)',
            'Type the command yourself — it can\'t run shell commands',
            'Confirm you have a network connection',
          ],
          correctIndex: 1,
          explanation: 'Some tool actions auto-approve, but others — particularly Bash — require you to press Y to allow. This is the human-in-the-loop guardrail.',
        },
      },
      {
        id: 'ch01-l05', title: 'This training has a shelf life', xpReward: 50, videos: [],
        lastVerified: '2026-06-14',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>AI Tooling Docs Age Fast</h2>
<div class="lesson-todo-shot" data-todo="screenshot"><strong>📸 TODO:</strong> Capture your own terminal screenshot of the Claude Code status line in action (showing version, model, permission mode, and context usage), and replace this marker. Save as <code>play/assets/lessons/ch01-l05.png</code>.</div>
<p>Claude Code ships updates frequently. Commands get renamed, new features appear, old workflows change. This training was accurate when written — but parts of it will become outdated over time.</p>
<h3>Why this matters</h3>
<p>Unlike a course on SQL or Git, Claude Code is a living product. A tutorial written 6 months ago might reference a flag that no longer exists or miss a feature that would save you hours. The gap between "what the training says" and "what the tool actually does" can make you less effective, or worse, confidently wrong.</p>
<h3>How to stay current</h3>
<p>Three quick checks that take under a minute:</p>
<ul>
  <li><strong><code>claude --version</code></strong> — see exactly what version you're running</li>
  <li><strong><code>claude doctor</code></strong> — checks your setup is healthy and flags known issues</li>
  <li><strong><code>claude --help</code></strong> — the authoritative list of current commands and flags, generated from the actual binary</li>
</ul>
<p>For deeper reference, the official docs at <strong>docs.anthropic.com/claude-code</strong> are updated with each release.</p>
<h3>What the verification stamp means</h3>
<p>Every lesson in this course shows a stamp like: <em>Verified against Claude Code v2.1.114 · 22 Apr 2026</em>. This tells you when the content was last checked against a specific version. If the stamp is old and you're on a much newer version, treat that lesson as a starting point — then verify the specifics yourself before relying on them.</p>
<h3>The habit to build</h3>
<p>When something doesn't work the way a tutorial says it should, your first instinct should be: <em>"Has this changed?"</em> — not <em>"Am I doing something wrong?"</em> Check <code>claude --help</code>, check the changelog, then adjust. This skill transfers to every AI tool you'll ever use.</p>`,
        check: {
          question: 'You\'re following a Claude Code tutorial and a flag the tutorial mentions doesn\'t seem to work. What\'s the right first move?',
          options: [
            'Assume you\'re typing it wrong and try variations',
            'Check `claude --help` and the changelog — the tool may have changed',
            'Ignore the flag and proceed without it',
            'File a bug report immediately',
          ],
          correctIndex: 1,
          explanation: 'AI tooling docs go stale fast. When something doesn\'t match, default to "has this changed?" and check `claude --help` against the actual installed version.',
        },
      },
    ],
    practicalTest: {
      id: 'ch01-test',
      scenarioType: 'slack', scenarioFrom: 'Maya Kedash', scenarioRole: 'CEO', scenarioAvatar: '👩‍💼',
      scenario: 'Welcome aboard. The support team is drowning. I want you to set them up with Claude Code so they reply consistently and fast. First proof you can do this: create a folder called `kedash-support/`, open `claude` inside it, and say `Hi` to it. Send me back the terminal commands you ran AND a snippet from the session showing Claude responded.\n\nP.S. — Linda has your badge. I know it\'s fast. We move fast when we\'re sure.',
      task: 'Paste the setup commands AND a snippet of your first Claude session (welcome banner + one tiny exchange).',
      hint: 'Use two sections — `## Setup` (your terminal commands like `mkdir` and `claude`) and `## First session` (the welcome banner and Claude\'s reply to your `Hi`). One short exchange is enough.',
      minLength: 0, passThreshold: 70, xpReward: 300,
      criteria: [
        { type: 'keyword', value: ['mkdir', 'kedash-support'], description: 'Creates the project folder', weight: 2 },
        { type: 'keyword', value: ['claude'], description: 'Runs the claude command', weight: 2 },
        { type: 'keyword', value: ['welcome', 'version', 'model', 'help', 'tip', 'how can i'], description: 'Pasted session evidence (banner or Claude reply)', weight: 2 },
        { type: 'keyword', value: ['## Setup', '## First session'], description: 'Used section markers', weight: 1 },
        { type: 'keyword', value: ['hi', 'hello', 'hey'], description: 'Tiny exchange visible', weight: 1 },
        { type: 'nonce', description: 'Compliance verification code echoed in the live session', improvement: 'Ask Claude to echo the KDQ verification code shown above, then paste the session output containing it.', weight: 4 },
      ],
      exemplar: '<p>Strong answer: <code>mkdir kedash-support/ && cd kedash-support/</code> and <code>claude</code> under a <code>## Setup</code> heading, then a short paste under <code>## First session</code> showing the welcome banner and Claude\'s reply to your "Hi".</p>',
    },
    theoreticalTest: {
      id: 'ch01-test-mcq', passThreshold: 80, xpReward: 300, drawCount: 6,
      questionPool: [
        {
          id: 'ch01-q01', type: 'single',
          prompt: 'What is the single most important way Claude Code differs from a typical chat UI?',
          options: [
            'It uses a smarter underlying model than the chat product',
            'It runs inside your project directory and can read, edit, and run files',
            'It works fully offline once installed',
            'It refuses non-coding questions',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "What is Claude Code?" — the defining trait is that Claude Code operates inside your project: it can actually act on files and run commands, not just discuss them.',
        },
        {
          id: 'ch01-q02', type: 'single',
          prompt: 'A teammate on a fresh macOS laptop wants the simplest install path — no Node.js, no extra tooling. Which command do you recommend?',
          options: [
            'npm install -g @anthropic-ai/claude-code (install Node.js first)',
            'curl -fsSL https://claude.ai/install.sh | bash (or `brew install --cask claude-code`)',
            'Download a zip and add it to PATH manually',
            'pip install claude-code',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Installation & Setup" — the native installer is the recommended path on macOS/Linux/WSL; it bundles its own binary and needs no Node.js.',
        },
        {
          id: 'ch01-q03', type: 'multi',
          prompt: 'Which of the following are valid ways to authenticate Claude Code on a fresh machine?',
          options: [
            'Sign in via a Claude.ai account in the browser',
            'Set the <code>ANTHROPIC_API_KEY</code> environment variable',
            'Paste your password into the terminal on first run',
            'Sign in with a GitHub Personal Access Token',
          ],
          correctIndexes: [0, 1],
          explanation: 'Lesson "Installation & Setup" — only Claude.ai sign-in (easiest for individuals) and an <code>ANTHROPIC_API_KEY</code> (recommended for teams) are mentioned as auth paths.',
        },
        {
          id: 'ch01-q04', type: 'single',
          prompt: 'You\'ve been working on a complex refactor for 30 minutes and need to step away. What\'s the right move before exiting so you can pick up where you left off?',
          options: [
            'Just close the terminal — Claude Code restores prior sessions automatically',
            'Run <code>/compact</code> to summarise the session so it fits back into context next time',
            'Press Ctrl+C three times to save state',
            'Copy the conversation into a Google Doc',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Your First Session" — <code>/compact</code> produces a summary you can hand back to the next session; sessions do not persist on their own.',
        },
        {
          id: 'ch01-q05', type: 'single',
          prompt: 'Claude Code is about to run a Bash command but pauses before executing. Why?',
          options: [
            'Bash commands always require an explicit human approval (press Y)',
            'It needs the network to confirm permissions with the server',
            'It\'s asking you to pick between several commands it drafted',
            'It can\'t run Bash and is asking you to type the command yourself',
          ],
          correctIndexes: [0],
          explanation: 'Lesson "Understanding the Interface" — some tool actions auto-approve, but Bash and other state-changing actions are gated on a Y/N prompt as a human-in-the-loop guardrail.',
        },
        {
          id: 'ch01-q06', type: 'single',
          prompt: 'Which keyboard shortcut toggles between Auto and Plan modes in Claude Code?',
          options: [
            '<kbd>Ctrl</kbd>+<kbd>P</kbd>',
            '<kbd>Shift</kbd>+<kbd>Tab</kbd>',
            '<kbd>Alt</kbd>+<kbd>M</kbd>',
            '<kbd>Ctrl</kbd>+<kbd>↑</kbd>',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Understanding the Interface" — <kbd>Shift+Tab</kbd> cycles Auto and Plan modes; the arrow keys are reserved for prompt history.',
        },
        {
          id: 'ch01-q07', type: 'single',
          prompt: 'A tutorial mentions a flag like <code>--magic</code> that doesn\'t seem to do anything for you. What\'s the right first move?',
          options: [
            'Assume you typed it wrong and try every variation',
            'File a bug report on GitHub immediately',
            'Check <code>claude --help</code> and the changelog — the flag may have been renamed or removed',
            'Ignore the flag and move on without checking',
          ],
          correctIndexes: [2],
          explanation: 'Lesson "This training has a shelf life" — when behavior doesn\'t match the tutorial, default to "has this changed?" and consult <code>claude --help</code> against the version you actually have.',
        },
        {
          id: 'ch01-q08', type: 'single',
          prompt: 'Which command verifies your Claude Code installation and prints the version?',
          options: [
            '<code>claude doctor</code>',
            '<code>claude --version</code>',
            '<code>claude info</code>',
            '<code>claude status</code>',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Installation & Setup" — <code>claude --version</code> prints the installed version; <code>claude doctor</code> checks the broader setup health.',
        },
        {
          id: 'ch01-q09', type: 'multi',
          prompt: 'Which of the following are things Claude Code is described as doing for you?',
          options: [
            'Reading, writing, and refactoring code across your project',
            'Running shell commands and interpreting the output',
            'Reviewing pull requests on GitHub on its own without any human prompt',
            'Following persistent project instructions from a <code>CLAUDE.md</code> file',
          ],
          correctIndexes: [0, 1, 3],
          explanation: 'Lesson "What is Claude Code?" — those three are explicitly listed; spontaneous PR review without a prompt is not.',
        },
        {
          id: 'ch01-q10', type: 'single',
          prompt: 'You see a lesson stamped "Verified against Claude Code v2.1.114 · 22 Apr 2026" but you\'re on a much newer version. How should you treat that lesson?',
          options: [
            'Skip it entirely — outdated content is worthless',
            'Trust it 100% — Claude Code rarely changes',
            'Treat the lesson as a starting point and verify specifics against the installed version',
            'Roll back to the verified version of Claude Code so the lesson matches',
          ],
          correctIndexes: [2],
          explanation: 'Lesson "This training has a shelf life" — the verification stamp marks a known-good baseline; the right habit is to use it as a starting point and confirm details haven\'t shifted.',
        },
        {
          id: 'ch01-q11', type: 'single',
          prompt: 'Inside an interactive Claude Code session, what does a slash-prefixed command like <code>/clear</code> or <code>/help</code> address?',
          options: [
            'Claude Code itself — they are CLI directives, not messages to the model',
            'The underlying shell — they are forwarded to bash',
            'The Anthropic billing API',
            'The remote MCP server, if one is connected',
          ],
          correctIndexes: [0],
          explanation: 'Lesson "Understanding the Interface" — commands starting with <code>/</code> are instructions to Claude Code itself, distinct from a prompt to the model.',
        },
      ],
    },
  },

  // ── Chapter 2 ─────────────────────────────────────────────────────────────
  {
    id: 'ch05',
    title: 'Effective Prompting',
    subtitle: 'Week 2 — Speaking the Right Language',
    icon: '✍️',
    xpReward: 220,
    lessons: [
      {
        id: 'ch05-l01', title: 'Why Specificity Matters', xpReward: 55, videos: [],
        lastVerified: '2026-06-14',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>Garbage In, Garbage Out</h2>
<div class="lesson-todo-shot" data-todo="screenshot"><strong>📸 TODO:</strong> Capture your own terminal screenshot of pressing <kbd>Shift+Tab</kbd> to enter Plan Mode (the cycle indicator + plan-mode banner) and replace this marker. Save as <code>play/assets/lessons/ch05-l01.png</code>.</div>
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
        id: 'ch05-l02', title: 'Providing Context', xpReward: 55, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
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
        id: 'ch05-l03', title: 'Iterative Prompting', xpReward: 55, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
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
<p>If a session has gone badly wrong — Claude Code is confused, making circular edits, or the context has bloated — use <code>/clear</code> to reset and start a new, focused conversation with a better-crafted first prompt. Don't double down on a bad session. For large operations spanning many files, switch to Plan Mode first (Chapter 4).</p>`,
      },
      {
        id: 'ch05-l04', title: 'Anatomy of a Good Prompt', xpReward: 55, videos: ['<iframe src="https://www.youtube.com/embed/pUykUYkFVTM" title="Master Claude Code in 2 Hours (What Actually Matters)" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
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
      id: 'ch05-test',
      scenarioType: 'slack', scenarioFrom: 'Jordan Kim', scenarioRole: 'Head of Customer Support', scenarioAvatar: '👩‍💼',
      scenario: 'Hey 👋 First task: I need a reply template for our most-asked question — "How do I cancel my subscription?". Write the PROMPT you would give Claude Code to draft it (B2B SaaS, voice is warm-but-technical, must include greeting → cancellation steps → dashboard location → offer of further help). Then actually run it. Reply with BOTH your prompt and what Claude produced — separate with `## Prompt` and `## Response` headings.\n\n(And yes, the voice spec is oddly precise. House style. You\'ll get used to whose house.)',
      task: 'Paste your prompt AND Claude\'s response, with `## Prompt` / `## Response` markers.',
      hint: 'A good prompt names the task, gives voice context, lists required parts, specifies format. The response should be a usable template with the 4 sections.',
      minLength: 0, passThreshold: 75, xpReward: 325,
      criteria: [
        { type: 'keyword', value: ['## Prompt', '## Response'], description: 'Both sections present', weight: 1 },
        { type: 'keyword', value: ['cancel', 'cancellation', 'subscription'], description: 'Prompt specifies the topic', weight: 2 },
        { type: 'keyword', value: ['tone', 'voice', 'B2B', 'warm', 'technical'], description: 'Prompt gives voice context', weight: 2 },
        { type: 'keyword', value: ['greeting', 'steps', 'dashboard', 'offer'], description: 'Prompt lists required parts', weight: 2 },
        { type: 'keyword', value: ['kedash', 'support', 'customer'], description: 'Response uses the brand context', weight: 1 },
        { type: 'keyword', value: ['sign-off', 'regards', 'kedash support', 'support team', '— '], description: 'Response closes with a sign-off', weight: 1 },
      ],
      exemplar: '<p>Strong answer: a prompt that names the task, gives voice ("warm-but-technical, B2B"), lists the 4 sections, plus a Claude response that\'s a usable template with greeting / steps / dashboard / offer / sign-off.</p>',
    },
    theoreticalTest: {
      id: 'ch05-test-mcq', passThreshold: 80, xpReward: 325, drawCount: 6,
      questionPool: [
        {
          id: 'ch05-q01', type: 'single',
          prompt: 'According to the lesson, what is the single biggest factor in the quality of Claude Code\'s output?',
          options: [
            'How long you let it run',
            'How specific your prompt is',
            'Which model variant you have selected',
            'How many files are open in your editor',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Why Specificity Matters" — specificity is named as the single biggest factor; vague prompts produce vague output.',
        },
        {
          id: 'ch05-q02', type: 'multi',
          prompt: 'Which of the following items does the lesson recommend including in a specific, well-targeted prompt?',
          options: [
            'File path',
            'Function or class name',
            'Expected behavior when done',
            'Constraints — what must NOT change',
            'A guess at how many tokens it will use',
          ],
          correctIndexes: [0, 1, 2, 3],
          explanation: 'Lesson "Why Specificity Matters" — file path, function/class name, expected behavior, and constraints are explicitly listed; token estimation is not.',
        },
        {
          id: 'ch05-q03', type: 'single',
          prompt: 'You find yourself pasting the same "we use TypeScript strict mode, no `any`" preamble into every session. Where does that context belong?',
          options: [
            'Keep pasting it — Claude Code forgets between sessions anyway',
            'In your CLAUDE.md or Business Brain (persistent context)',
            'Hard-coded into the source files as comments',
            'In a JIRA ticket Claude Code can fetch',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Providing Context" — repeated session-level context belongs in persistent layers (CLAUDE.md or Business Brain), not in every prompt.',
        },
        {
          id: 'ch05-q04', type: 'single',
          prompt: 'What is "objective context" as described in the Providing Context lesson?',
          options: [
            'The version of the language model running',
            'The reason behind the task — helps Claude make better judgment calls when it hits ambiguity',
            'A list of file paths to ignore',
            'A summary of past chat history',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Providing Context" — "Objective context: Why are you doing this? Helps Claude Code make better judgment calls when it encounters ambiguity."',
        },
        {
          id: 'ch05-q05', type: 'single',
          prompt: 'A session has gone sideways — Claude is confused, making circular edits, context is bloated. What does the lesson recommend?',
          options: [
            'Restart your computer',
            'Keep pushing through — eventually it will recover',
            'Use <code>/clear</code> to reset and start a fresh, focused session with a better first prompt',
            'Switch to a smaller model and try again',
          ],
          correctIndexes: [2],
          explanation: 'Lesson "Iterative Prompting" — when a session has gone wrong, use <code>/clear</code> to reset rather than double down.',
        },
        {
          id: 'ch05-q06', type: 'multi',
          prompt: 'Which of the following are steps in the "iterative loop" described in the lesson?',
          options: [
            'Start rough — high-level intent first',
            'Review Claude\'s proposed plan before any code is written',
            'Refine — accept, reject, or redirect specific parts',
            'Test — have Claude write or run tests',
            'Submit the diff straight to production',
          ],
          correctIndexes: [0, 1, 2, 3],
          explanation: 'Lesson "Iterative Prompting" — the loop is: start rough → review the plan → refine → test. Straight-to-production is not part of it.',
        },
        {
          id: 'ch05-q07', type: 'single',
          prompt: 'The lesson teaches a prompt formula. Which of these matches it?',
          options: [
            '[FILE] [LINE NUMBER] in [BRANCH NAME]',
            '[QUESTION] [CONTEXT] [EXAMPLE OUTPUT]',
            '[ACTION] [WHAT] in [WHERE] so that [WHY] [CONSTRAINTS]',
            '[PERSONA] [TASK] [DEADLINE]',
          ],
          correctIndexes: [2],
          explanation: 'Lesson "Anatomy of a Good Prompt" — the formula is exactly that: action, target, location, outcome, then constraints.',
        },
        {
          id: 'ch05-q08', type: 'multi',
          prompt: 'Which of the following are explicitly listed as prompting antipatterns to avoid?',
          options: [
            'Combining multiple unrelated tasks in one prompt',
            'Asking for both implementation and documentation in the same turn',
            'Underspecifying which file or function when several candidates exist',
            'Writing prompts in lowercase',
          ],
          correctIndexes: [0, 1, 2],
          explanation: 'Lesson "Anatomy of a Good Prompt" — those three appear in the antipattern list; capitalization is not.',
        },
        {
          id: 'ch05-q09', type: 'single',
          prompt: 'You\'re about to ask Claude Code to refactor calculateTax. Which prompt best follows the lesson\'s recommendations?',
          options: [
            '"Refactor calculateTax in the billing module to make it cleaner and easier for the team to maintain going forward."',
            '"Look at calculateTax in src/billing and rewrite whatever is broken about it — leave the rest of the billing module alone for now."',
            '"Refactor calculateTax() in src/billing/tax.js so it returns 0 on null/undefined inputs; do not change the signature or callers."',
            '"Clean up the calculateTax function so the QA team stops filing tickets about the tax line on customer invoices each month."',
          ],
          correctIndexes: [2],
          explanation: 'Lesson "Anatomy of a Good Prompt" — only the third option hits every part of the formula: action (refactor), what (calculateTax), where (src/billing/tax.js), success criteria (returns 0 on null/undefined), and constraint (don\'t change the signature or callers). The other prompts are similar in length but stay vague — they sound thorough without naming the file, the actual bug, or the constraint.',
        },
        {
          id: 'ch05-q10', type: 'single',
          prompt: 'According to "Iterative Prompting", what should you do for very large operations spanning many files before charging in?',
          options: [
            'Run the prompt three times to get a consensus',
            'Switch to Plan Mode first (covered in Chapter 4)',
            'Increase the context window via env var',
            'Use a fresh repo as a scratch space',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Iterative Prompting" — for large multi-file operations, the lesson explicitly says to switch to Plan Mode first.',
        },
        {
          id: 'ch05-q11', type: 'single',
          prompt: 'Which prompt example follows specificity best practices most closely?',
          options: [
            '"Fix the off-by-one error in <code>paginate()</code> in <code>src/utils.js</code> — it skips the last item when total is divisible by page size."',
            '"Hey can you take a look at the pagination thing?"',
            '"Pagination is broken in prod, fix it."',
            '"Fix all the bugs in utils."',
          ],
          correctIndexes: [0],
          explanation: 'Lesson "Why Specificity Matters" — the first example is the lesson\'s own contrast for what "specific" looks like.',
        },
      ],
    },
  },

  // ── Chapter 3 ─────────────────────────────────────────────────────────────
  {
    id: 'ch06',
    title: 'Working with Files',
    subtitle: 'Week 3 — Hands on the Codebase',
    icon: '📁',
    xpReward: 240,
    lessons: [
      {
        id: 'ch06-l01', title: 'Reading Files with Claude Code', xpReward: 60, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
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
        id: 'ch06-l02', title: 'Making Targeted Edits', xpReward: 60, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
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
        id: 'ch06-l03', title: 'Multi-file Operations & The Safe Refactor Playbook', xpReward: 60, videos: ['<iframe src="https://www.youtube.com/embed/k5JxbbwEVGo" title="Claude Code in a 1 Million Line Codebase: What Works, What Doesn\'t" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'],
        lastVerified: '2026-05-30',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>Working Across Files</h2>
<p>Claude Code can reason across multiple files simultaneously. It's not just a search-and-replace tool — it understands relationships between files.</p>
<pre><code>Rename the \`processPayment()\` function to \`chargeCard()\` across all files in \`src/\`. Update all call sites and any JSDoc references.</code></pre>
<h3>Tips for multi-file work</h3>
<ul>
  <li>Commit your current state before starting a large multi-file operation</li>
  <li>Ask Claude Code to confirm the scope before it begins: "How many files will this affect?"</li>
  <li>After the operation, ask it to verify: "Check that no call sites were missed"</li>
</ul>
<h3>The safe refactor playbook</h3>
<p>For anything bigger than a rename, follow this sequence — it prevents 90% of multi-file disasters:</p>
<ol>
  <li><strong>Scope first.</strong> Before any change, list every file and call site touched. <pre><code>List every file that references \`OrderProcessor\` and show how each uses it. Don't make any changes yet.</code></pre></li>
  <li><strong>Commit the current state.</strong> Now your rollback is one command.</li>
  <li><strong>Use Plan Mode</strong> (Chapter 4) — review the full plan before any execution.</li>
  <li><strong>Phase the work.</strong> Types and shared modules first, then implementations, then call sites. Don't try to do everything in one turn.</li>
  <li><strong>Test at each phase.</strong> A broken middle phase is much cheaper to debug than a broken end-state.</li>
  <li><strong>Final scan.</strong> Search for missed references with grep — Claude can do this in one prompt: "Find any remaining references to the old name."</li>
</ol>`,
      },
      {
        id: 'ch06-l04', title: 'Reviewing Changes Before Accepting', xpReward: 60, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
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
      {
        id: 'ch06-l05', title: 'Test-driven Prompting', xpReward: 60, videos: [],
        lastVerified: '2026-05-30',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>Tests as Specification</h2>
<p>The most reliable way to get exactly the code you want from Claude Code: write the tests first, then ask for an implementation that passes them. Tests are unambiguous in a way prose descriptions rarely are.</p>
<pre><code>I've written tests for \`formatCurrency()\` in \`src/utils/format.test.js\`.
Implement \`formatCurrency()\` in \`src/utils/format.js\` so every test passes.
After implementing, run \`npm test -- format.test.js\` and report the result.</code></pre>
<h3>Why this works</h3>
<ul>
  <li>The test file <em>is</em> the spec — Claude can read it directly, no interpretation needed.</li>
  <li>"Passes the tests" is an objective success criterion. No "close but not quite right".</li>
  <li>Edge cases live in the test file, not in your prose prompt — they don't get forgotten.</li>
  <li>You can iterate cheaply: failing test → ask Claude to fix → re-run → repeat.</li>
</ul>
<h3>The workflow in three turns</h3>
<ol>
  <li><em>Turn 1:</em> "Read \`src/utils/format.test.js\`. List the cases it covers — don't write code yet."</li>
  <li><em>Turn 2:</em> "Implement \`formatCurrency()\` to pass all those cases. Run the tests when done."</li>
  <li><em>Turn 3 (only if needed):</em> Paste any failing test output. "Fix the failing cases without breaking the passing ones."</li>
</ol>
<p>This is also the cheapest place to use Haiku — once tests exist, satisfying them is mechanical enough that the cheapest tier often suffices.</p>`,
      },
    ],
    practicalTest: {
      id: 'ch06-test',
      scenarioType: 'jira', scenarioFrom: 'Sam Okafor', scenarioRole: 'Knowledge Base Manager', scenarioAvatar: '🧑‍💼',
      scenario: 'KEDASH-CX-12 · Bug fix\n\nLine 14 of `kedash-support/faq.md` says we accept credit-card payments only, but we now also accept PayPal and ACH. Create a tiny `faq.md` with that wrong line, run Claude Code to fix JUST that line, then paste your prompt AND the diff Claude produced — with `## Prompt` and `## Diff` markers.\n\nReporter: D. Okonkwo (Northcliff Systems) · First reported: 4 cycles ago',
      task: 'Paste your prompt and the resulting diff.',
      hint: 'Prompt should name the file, the specific line, and constrain Claude to that one change. The diff should show `-` (old line) and `+` (new line).',
      minLength: 0, passThreshold: 75, xpReward: 350,
      criteria: [
        { type: 'keyword', value: ['## Prompt', '## Diff'], description: 'Both sections present', weight: 1 },
        { type: 'keyword', value: ['faq.md'], description: 'Names the file in the prompt', weight: 2 },
        { type: 'keyword', value: ['only', 'just', 'nothing else', 'that line'], description: 'Scopes the edit narrowly', weight: 2 },
        { type: 'keyword', value: ['paypal', 'ach'], description: 'Diff adds the new payment methods', weight: 2 },
        { type: 'keyword', value: ['credit card', 'credit-card', 'credit'], description: 'Diff shows the original wrong content', weight: 2 },
        { type: 'keyword', value: ['---', '+++', '@@', 'diff --git'], description: 'Diff format markers visible', weight: 1 },
      ],
      exemplar: '<p>Strong answer: prompt naming <code>faq.md</code> + line 14 + scoped constraint ("only that line"), plus a diff with <code>-</code> credit-card line and <code>+</code> PayPal/ACH line.</p>',
    },
    theoreticalTest: {
      id: 'ch06-test-mcq', passThreshold: 80, xpReward: 350, drawCount: 6,
      questionPool: [
        {
          id: 'ch06-q01', type: 'single',
          prompt: 'According to the lesson, what does Claude Code do BEFORE it changes anything in your project?',
          options: [
            'It runs the test suite',
            'It reads — your files, related files, and any CLAUDE.md',
            'It opens a debugger',
            'It silently commits a backup',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Reading Files with Claude Code" — Claude Code reads before it acts; that\'s the first move.',
        },
        {
          id: 'ch06-q02', type: 'single',
          prompt: 'Why does the lesson recommend "targeted, surgical" edits over broad prompts when you know what needs to change?',
          options: [
            'Cheaper API billing',
            'They produce clean, reviewable diffs and reduce unintended side effects',
            'They avoid lint warnings',
            'They prevent Claude from reading any files',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Making Targeted Edits" — surgical prompts produce clean diffs and are less likely to introduce side effects.',
        },
        {
          id: 'ch06-q03', type: 'multi',
          prompt: 'Which of the following are recommended ways to undo a Claude Code edit?',
          options: [
            'Tell Claude "revert that last change" — it can undo its most recent edit',
            'Use <code>git diff</code> / <code>git checkout</code> for manual recovery',
            'Rely on regular commits as rollback points',
            'Delete your .claude folder',
          ],
          correctIndexes: [0, 1, 2],
          explanation: 'Lesson "Making Targeted Edits" — all three undo paths are listed; nuking .claude is not.',
        },
        {
          id: 'ch06-q04', type: 'multi',
          prompt: 'Which of the following are steps in the "safe refactor playbook"?',
          options: [
            'Scope first — list every file and call site touched, without changing anything yet',
            'Commit the current state for a one-command rollback',
            'Use Plan Mode to review the full plan before execution',
            'Phase the work — types/shared modules → implementations → call sites',
            'Disable git hooks during the refactor',
          ],
          correctIndexes: [0, 1, 2, 3],
          explanation: 'Lesson "Multi-file Operations & The Safe Refactor Playbook" — those four are explicit steps; disabling hooks is not.',
        },
        {
          id: 'ch06-q05', type: 'single',
          prompt: 'For very large multi-file operations, what should you do BEFORE Claude starts making changes?',
          options: [
            'Just trust Claude — it handles scope on its own',
            'Switch to Plan Mode and review the plan before any execution',
            'Run the tests and call it a day',
            'Increase your terminal\'s scrollback buffer',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Multi-file Operations & The Safe Refactor Playbook" — Plan Mode (Chapter 4) is the playbook\'s answer for anything bigger than a rename.',
        },
        {
          id: 'ch06-q06', type: 'single',
          prompt: 'The lesson tells you to review every diff. Which of the following is the BEST framing for that review?',
          options: [
            'Glance at the first few lines and move on if they look fine',
            'Read the diff fully, ask "does this match my intent?" and "could this break something I didn\'t think about?"',
            'Trust Claude — it shows the diff for transparency, not for review',
            'Only review diffs in files you wrote yourself',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Reviewing Changes Before Accepting" — the review habit is the full read plus the two intent/breakage questions.',
        },
        {
          id: 'ch06-q07', type: 'single',
          prompt: 'A workflow tip in the lesson: what should you do before every significant Claude Code operation so the worst case is a simple <code>git reset</code>?',
          options: [
            'Open a draft PR',
            'Commit your current state',
            'Make a tarball of the repo',
            'Disable Claude\'s auto-edit',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Reviewing Changes Before Accepting" — commit before every significant operation; that\'s your guaranteed rollback point.',
        },
        {
          id: 'ch06-q08', type: 'single',
          prompt: 'What is "test-driven prompting" as taught in the lesson?',
          options: [
            'Asking Claude to write tests AFTER it implements the feature',
            'Writing tests first, then asking Claude for an implementation that passes them',
            'Running tests in a subagent automatically',
            'Letting Claude write both prod and test code in the same turn',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Test-driven Prompting" — tests-first, then ask Claude to implement to pass them.',
        },
        {
          id: 'ch06-q09', type: 'multi',
          prompt: 'Why does the lesson argue tests-first prompts produce more reliable results? (pick all that apply)',
          options: [
            'The test file IS the spec — Claude can read it directly without interpreting prose',
            '"Passes the tests" is an objective success criterion — no "close-but-not-quite"',
            'Edge cases live in the test file, so they don\'t get forgotten',
            'You can iterate cheaply: failing test → fix → re-run',
            'Tests automatically increase the context window',
          ],
          correctIndexes: [0, 1, 2, 3],
          explanation: 'Lesson "Test-driven Prompting" — those four reasons are explicitly listed; context-window expansion is not.',
        },
        {
          id: 'ch06-q10', type: 'single',
          prompt: 'When you spot Claude Code proposing something unexpected in a diff, what does the lesson say it usually means?',
          options: [
            'A bug in Claude Code itself — file a report',
            'Your prompt was ambiguous; clarify and try again',
            'The model is being lazy; switch to a more expensive tier',
            'Your editor is corrupting the diff',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Making Targeted Edits" — unexpected changes are a signal that the prompt was ambiguous, not that Claude is malfunctioning.',
        },
        {
          id: 'ch06-q11', type: 'single',
          prompt: 'In the three-turn test-driven workflow, what happens in Turn 1?',
          options: [
            'Claude writes the implementation immediately',
            'Claude reads the test file and lists the cases it covers, without writing code yet',
            'You disable auto-approval globally',
            'You commit a placeholder implementation',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Test-driven Prompting" — Turn 1 is read-and-summarize the cases; code comes in Turn 2.',
        },
      ],
    },
  },

  // ── Chapter 4 ────────────────────────────────────────────────────────────
  {
    id: 'ch12',
    title: 'Plan Mode',
    subtitle: 'Week 4 — Control the Execution',
    icon: '🗂️',
    xpReward: 260,
    lessons: [
      {
        id: 'ch12-l01', title: 'What is Plan Mode?', xpReward: 65, videos: ['<iframe src="https://www.youtube.com/embed/QlWyrYuEC84" title="Claude Code\'s Hidden Superpower: Plan Mode for Smart Developers" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'],
        lastVerified: '2026-05-30',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>Think Before You Act</h2>
<p><strong>Plan Mode</strong> separates thinking from acting. Claude Code reasons about the task and produces a detailed plan — but makes no file changes, runs no commands, takes no actions until you explicitly switch back to Default mode.</p>
<h3>The four permission modes</h3>
<ul>
  <li><strong>default</strong> — Asks before file edits and shell commands. Recommended for most work.</li>
  <li><strong>acceptEdits</strong> — Auto-accepts file edits and common filesystem commands; still prompts for other actions.</li>
  <li><strong>plan</strong> — Read-only tools only. Claude Code thinks and plans, zero execution. Toggle with Shift+Tab.</li>
  <li><strong>bypassPermissions</strong> — Disables all permission gating. Only safe inside an isolated container / VM.</li>
</ul>
<p>Pass any of these on the CLI with <code>--permission-mode &lt;name&gt;</code> — particularly useful for headless / CI runs where <code>--permission-mode plan</code> guarantees a review-only execution.</p>
<p>Plan Mode is the answer to "how do I review what Claude Code intends to do before it does it?" — the question every developer asks after their first multi-file surprise.</p>`,
      },
      {
        id: 'ch12-l02', title: 'Shift+Tab: Switching Modes', xpReward: 65, videos: [],
        lastVerified: '2026-06-14',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>Switching Modes</h2>
<div class="lesson-todo-shot" data-todo="screenshot"><strong>📸 TODO:</strong> Capture your own terminal screenshot of <code>/permissions</code> showing the interactive picker (allow / ask / deny categories visible) and replace this marker. Save as <code>play/assets/lessons/ch12-l02.png</code>.</div>
<p>Press <kbd>Shift+Tab</kbd> to cycle through permission modes: <em>default → acceptEdits → plan → default</em>. The current mode is shown in the status line.</p>
<h3>Workflow</h3>
<ol>
  <li>Press Shift+Tab until you reach <strong>plan</strong></li>
  <li>Submit your prompt — Claude Code thinks, does not act</li>
  <li>Read the plan, ask questions, request changes</li>
  <li>Press Shift+Tab to return to <strong>default</strong> (or <strong>acceptEdits</strong> if you want to skip per-edit confirmations)</li>
  <li>Claude Code executes the refined plan</li>
</ol>
<p>You can iterate on the plan multiple times. The plan is part of the conversation — Claude Code remembers decisions made during planning when it executes.</p>
<h3>Headless plan mode</h3>
<p>For CI / automation: <code>claude -p "review this branch" --permission-mode plan</code> runs the whole invocation in read-only mode. Nothing can be mutated even by accident. Covered in depth in Chapter 15.</p>`,
      },
      {
        id: 'ch12-l03', title: 'When to Use Plan Mode', xpReward: 65, videos: ['<iframe src="https://www.youtube.com/embed/7LWl3EbcFTc" title="Claude Code Plan Mode: The Senior Engineer\'s Workflow" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: '<h2>Choosing the Right Mode</h2><h3>Use Plan Mode for</h3><ul><li>Operations affecting more than 3–5 files</li><li>Renames or restructures of shared interfaces</li><li>Database migrations, security-sensitive changes</li><li>Anything you\'d want code-reviewed before it exists</li></ul><h3>Auto mode is fine for</h3><ul><li>Single-file edits with a clear, bounded scope</li><li>Adding a function or fixing a small bug</li><li>Generating tests for an existing function</li></ul><h3>Heuristic</h3><p>Ask: "If this goes wrong, how long does it take to recover?" More than 5 minutes → use Plan Mode.</p>',
      },
      {
        id: 'ch12-l04', title: 'Reviewing Plans Before Execution', xpReward: 65, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: '<h2>Reading a Plan Critically</h2><ol><li>Scope check — files affected as expected?</li><li>Approach check — is this the right solution?</li><li>Constraint check — respects your constraints?</li><li>Side-effect check — could this break something else?</li><li>Completeness check — anything missed?</li></ol><p>Correct conversationally before executing: "Remove step 3", "Add a step for TypeScript types", "Step 2 should use a transaction". The execution won\'t start until you switch back to Auto — take your time.</p>',
      },
    ],
    practicalTest: {
      id: 'ch12-test',
      scenarioType: 'slack', scenarioFrom: 'Jordan Kim', scenarioRole: 'Head of Customer Support', scenarioAvatar: '👩‍💼',
      scenario: 'Big one: reorganize `kedash-support/`. Everything is dumped in the root. I want `faqs/`, `templates/`, `escalations/`, `internal-notes/`, plus some renames (`auth-faq.md` → `faqs/auth.md`, etc.). **Use Plan Mode** — Shift+Tab to enter it, give Claude the prompt, capture the plan it outputs WITHOUT executing. Paste your prompt and the plan.\n\nOne more thing: do NOT execute. I\'m serious. The plan is the deliverable. Someone upstairs reads the plans.',
      task: 'Enter Plan Mode, give the reorganize prompt, paste both your prompt and the plan Claude generated.',
      hint: '`## Prompt` and `## Plan` markers. The plan should list numbered steps with source/target paths and end with awaiting-approval language.',
      minLength: 0, passThreshold: 80, xpReward: 375,
      criteria: [
        { type: 'keyword', value: ['## Prompt', '## Plan'], description: 'Both sections present', weight: 1 },
        { type: 'keyword', value: ['plan mode', 'shift+tab', 'shift-tab', 'plan'], description: 'Plan Mode referenced', weight: 2 },
        { type: 'keyword', value: ['faqs', 'templates', 'escalations', 'internal-notes'], description: 'Names the target folders', weight: 2 },
        { type: 'keyword', value: ['approval', 'approve', 'confirm', 'review', 'before', 'wait'], description: 'Approval-gated (no execution)', weight: 2 },
        { type: 'structure', value: 'numbered-steps', description: 'Plan uses numbered steps', weight: 1 },
        { type: 'keyword', value: ['→', '->', 'move', 'rename', 'mv'], description: 'Plan describes actual moves', weight: 1 },
        { type: 'nonce', description: 'Compliance verification code echoed in the live session', improvement: 'Ask Claude to echo the KDQ verification code shown above, then paste the session output containing it.', weight: 3 },
      ],
      exemplar: '<p>Strong answer: prompt asking for a Plan-Mode reorganization, plus a numbered plan listing each move (auth-faq.md → faqs/auth.md, …) ending with "awaiting approval before execution".</p>',
    },
    theoreticalTest: {
      id: 'ch12-test-mcq', passThreshold: 80, xpReward: 375, drawCount: 6,
      questionPool: [
        {
          id: 'ch12-q01', type: 'single',
          prompt: 'What does Plan Mode do in one sentence?',
          options: [
            'It speeds up Claude\'s thinking by skipping reads',
            'It separates thinking from acting — Claude reasons and produces a plan, but takes no actions until you switch back',
            'It runs Claude in offline mode',
            'It pins Claude to a specific model tier',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "What is Plan Mode?" — Plan Mode\'s whole point is separating thinking from acting: zero execution until you flip out.',
        },
        {
          id: 'ch12-q02', type: 'multi',
          prompt: 'Which of the following are valid permission-mode values?',
          options: [
            '<code>default</code>',
            '<code>acceptEdits</code>',
            '<code>plan</code>',
            '<code>bypassPermissions</code>',
            '<code>readonly</code>',
          ],
          correctIndexes: [0, 1, 2, 3],
          explanation: 'Lesson "What is Plan Mode?" — the four modes are exactly default, acceptEdits, plan, and bypassPermissions; "readonly" is not a real mode name.',
        },
        {
          id: 'ch12-q03', type: 'single',
          prompt: 'Which keyboard shortcut cycles through Claude Code\'s permission modes?',
          options: [
            '<kbd>Ctrl</kbd>+<kbd>P</kbd>',
            '<kbd>Tab</kbd>',
            '<kbd>Shift</kbd>+<kbd>Tab</kbd>',
            '<kbd>Alt</kbd>+<kbd>M</kbd>',
          ],
          correctIndexes: [2],
          explanation: 'Lesson "Shift+Tab: Switching Modes" — Shift+Tab cycles default → acceptEdits → plan → default.',
        },
        {
          id: 'ch12-q04', type: 'single',
          prompt: 'For a CI / headless run where you want a guaranteed review-only execution, what flag do you pass?',
          options: [
            '<code>--readonly</code>',
            '<code>--no-execute</code>',
            '<code>--permission-mode plan</code>',
            '<code>--mode safe</code>',
          ],
          correctIndexes: [2],
          explanation: 'Lesson "What is Plan Mode?" and "Shift+Tab: Switching Modes" — <code>--permission-mode plan</code> is the documented way to lock a headless invocation to read-only.',
        },
        {
          id: 'ch12-q05', type: 'multi',
          prompt: 'Which situations does the lesson recommend Plan Mode for?',
          options: [
            'Operations affecting more than 3-5 files',
            'Renames or restructures of shared interfaces',
            'Database migrations and security-sensitive changes',
            'Anything you\'d want code-reviewed before it exists',
            'Generating tests for a single function with bounded scope',
          ],
          correctIndexes: [0, 1, 2, 3],
          explanation: 'Lesson "When to Use Plan Mode" — those four are explicit Plan-Mode triggers; the single-function test case is listed as fine for Auto.',
        },
        {
          id: 'ch12-q06', type: 'single',
          prompt: 'The lesson offers a quick heuristic for picking Plan Mode. What is it?',
          options: [
            'If the file count is above 10',
            'If your CI pipeline takes longer than 5 minutes',
            'If "this goes wrong" would take more than 5 minutes to recover from',
            'If Claude is in Opus mode',
          ],
          correctIndexes: [2],
          explanation: 'Lesson "When to Use Plan Mode" — the recovery-cost heuristic ("more than 5 minutes → use Plan Mode") is the lesson\'s answer.',
        },
        {
          id: 'ch12-q07', type: 'multi',
          prompt: 'Which of the following are checks the lesson recommends you run on a plan before approving it?',
          options: [
            'Scope check — files affected as expected?',
            'Approach check — is this the right solution?',
            'Constraint check — does it respect your constraints?',
            'Side-effect check — could this break something else?',
            'Aesthetic check — does the plan use consistent indentation?',
          ],
          correctIndexes: [0, 1, 2, 3],
          explanation: 'Lesson "Reviewing Plans Before Execution" — scope, approach, constraint, side-effect, completeness are the named checks; indentation is not.',
        },
        {
          id: 'ch12-q08', type: 'single',
          prompt: 'You\'re in Plan Mode and Claude\'s plan has a problematic step 3. What\'s the natural way to correct it?',
          options: [
            'Switch to Auto first, then re-prompt',
            'Type the correction conversationally: "Remove step 3" or "step 2 should use a transaction" — keep iterating in Plan Mode',
            'Edit Claude\'s plan in a text file and re-attach it',
            'Exit and start a new session',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Reviewing Plans Before Execution" — corrections are conversational, and execution won\'t start until you switch out of plan mode, so iteration is cheap.',
        },
        {
          id: 'ch12-q09', type: 'single',
          prompt: 'Which mode is described as "Auto-accepts file edits and common filesystem commands; still prompts for other actions"?',
          options: [
            '<code>default</code>',
            '<code>acceptEdits</code>',
            '<code>plan</code>',
            '<code>bypassPermissions</code>',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "What is Plan Mode?" — that\'s the definition of <code>acceptEdits</code>.',
        },
        {
          id: 'ch12-q10', type: 'single',
          prompt: 'Which mode is described as "Disables all permission gating — only safe inside an isolated container / VM"?',
          options: [
            '<code>default</code>',
            '<code>acceptEdits</code>',
            '<code>plan</code>',
            '<code>bypassPermissions</code>',
          ],
          correctIndexes: [3],
          explanation: 'Lesson "What is Plan Mode?" — <code>bypassPermissions</code> is the all-off mode and carries the isolation caveat.',
        },
        {
          id: 'ch12-q11', type: 'single',
          prompt: 'After a Plan-Mode session, you flip to Auto and Claude executes. Why does the plan still apply?',
          options: [
            'Plan Mode persists the plan to disk in <code>.claude/plan.json</code>',
            'The plan is part of the conversation — Claude remembers the decisions made during planning when it executes',
            'Claude re-derives the plan from your terminal history',
            'You have to copy-paste the plan back into the prompt',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Shift+Tab: Switching Modes" — the plan stays in conversation context, so the same session\'s execution honours the decisions made during planning.',
        },
      ],
    },
  },

  // ── Chapter 5 ────────────────────────────────────────────────────────────
  {
    id: 'ch11',
    title: 'Slash Commands & Workflow',
    subtitle: 'Week 5 — Power User Controls',
    icon: '🎮',
    xpReward: 280,
    lessons: [
      {
        id: 'ch11-l01', title: 'Essential Slash Commands', xpReward: 70, videos: ['<iframe src="https://www.youtube.com/embed/09dggS8KwBc" title="Self-Improving Claude Code: Hooks, Skills, and Session Automation" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'],
        lastVerified: '2026-06-15',
        verifiedAgainstVersion: 'v2.1.176',
        content: `<h2>The Command Vocabulary</h2>
<div class="lesson-todo-shot" data-todo="screenshot"><strong>📸 TODO:</strong> Capture your own terminal screenshot of <code>/help</code> output (the full built-in commands list, with categories visible) and replace this marker. Save as <code>play/assets/lessons/ch11-l01.png</code>.</div>
<table>
  <thead><tr><th>Command</th><th>What it does</th></tr></thead>
  <tbody>
    <tr><td><code>/help</code></td><td>Show built-in commands and their descriptions</td></tr>
    <tr><td><code>/init</code></td><td>Generate a CLAUDE.md for the project</td></tr>
    <tr><td><code>/clear</code></td><td>Reset conversation context</td></tr>
    <tr><td><code>/compact</code></td><td>Summarise and compress the session (optional focus hint)</td></tr>
    <tr><td><code>/model</code></td><td>Pick the model tier (opus / sonnet / haiku) for this session</td></tr>
    <tr><td><code>/fast</code></td><td>Toggle Fast Mode while on Opus (faster output, same model)</td></tr>
    <tr><td><code>/agents</code></td><td>Open the subagent picker — built-in plus everything under <code>.claude/agents/</code></td></tr>
    <tr><td><code>/skills</code></td><td>List available skills (the progressive-disclosure index)</td></tr>
    <tr><td><code>/mcp</code></td><td>List connected MCP servers and their tools</td></tr>
    <tr><td><code>/permissions</code></td><td>View, add, or manage tool permission rules</td></tr>
    <tr><td><code>/memory</code></td><td>View and edit Claude Code memory files</td></tr>
    <tr><td><code>/output-style</code></td><td>Switch the output style (default / concise / explanatory / custom)</td></tr>
    <tr><td><code>/cost</code></td><td>Show token usage and cost for the current session</td></tr>
    <tr><td><code>/status</code></td><td>Open Settings UI — version, model, account, connectivity</td></tr>
    <tr><td><code>/review</code></td><td>Built-in code review against the current diff</td></tr>
    <tr><td><code>/simplify</code></td><td>Run a cleanup-only review and apply the fixes</td></tr>
    <tr><td><code>/cd</code></td><td>Move the session to a new directory without breaking the prompt cache</td></tr>
    <tr><td><code>/reload-skills</code></td><td>Re-scan skill directories without restarting the session</td></tr>
    <tr><td><code>/exit</code></td><td>End the session</td></tr>
  </tbody>
</table>
<p>Arguments follow the command name. <code>/compact Focus on auth decisions</code> passes a focus hint. <code>/model opus</code> switches to Opus immediately. <code>/agents</code> with no args opens the picker.</p>
<h3>Switching into Plan Mode</h3>
<p>Press <kbd>Shift+Tab</kbd> to cycle permission modes (Default → Auto-accept edits → Plan → back). Plan Mode is read-only — Claude reasons and proposes but cannot execute. Chapter 4 covers this in depth.</p>`,
      },
      {
        id: 'ch11-l02', title: '/init and Project Setup', xpReward: 70, videos: ['<iframe src="https://www.youtube.com/embed/i_OHQH4-M2Y" title="Claude Code Tutorial #2 - CLAUDE.md Files &amp; /init" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: '<h2>Bootstrapping a New Project</h2><p><code>/init</code> inspects your project and generates a starter CLAUDE.md — identifying tech stack, test commands, and build tooling automatically.</p><p>Treat it as generating a first draft. After running it: correct inaccuracies, add the Business Brain pointer, apply lean CLAUDE.md principles (Chapter 6), and commit. The generated file is a starting point, not a finished product.</p>',
      },
      {
        id: 'ch11-l03', title: '/help, /skills and /agents — Discoverability', xpReward: 70, videos: [],
        lastVerified: '2026-05-30',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>Always Know What's Available</h2>
<p>Three commands form the discovery layer for any new project:</p>
<ul>
  <li><code>/help</code> — every built-in slash command, with descriptions.</li>
  <li><code>/skills</code> — every available skill (built-in + user + project), with their one-line descriptions. This is the progressive-disclosure index from Chapter 10. Run it on any new project to discover team workflows like <code>/deploy-staging</code> or <code>/security-review</code>.</li>
  <li><code>/agents</code> — every available subagent type, including custom ones in <code>.claude/agents/</code>. Pick from the list to dispatch a specialist (see Chapter 14).</li>
</ul>
<h3>Make discovery a habit</h3>
<p>The first 30 seconds in any unfamiliar project: run <code>/skills</code> and <code>/agents</code>. You'll find existing tools the team has already built rather than reinventing them. The cost is two keypresses; the savings can be hours.</p>`,
      },
      {
        id: 'ch11-l04', title: 'Session Hygiene', xpReward: 70, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: '<h2>Keeping Sessions Healthy</h2><ul><li>One task per session</li><li>Start with a clear, specific first message</li><li>/clear when switching tasks</li><li>/compact on long sessions before context degrades</li><li>Read every diff before accepting</li></ul><h3>Opening message pattern</h3><pre><code>I\'m adding rate limiting to `/api/auth/login` in `src/routes/auth.js`.\nProject uses express-rate-limit. Don\'t modify any other routes.</code></pre><p>This front-loaded context saves multiple clarification turns and reduces wasted tokens.</p>',
      },
    ],
    practicalTest: {
      id: 'ch11-test',
      scenarioType: 'email', scenarioFrom: 'Priya Patel', scenarioRole: 'Support Ops Lead', scenarioAvatar: '👩‍💻',
      scenario: 'From: priya.patel@kedashcorp.com\nSubject: Quick win — get a starter CLAUDE.md\n\nRun three slash commands in `kedash-support/`, in this order: `/init` to draft a CLAUDE.md, `/help` to see what else is available, and one more useful one (e.g. `/cost`, `/clear`, `/compact`). Paste a SHORT snippet of each command\'s output so I know you ran them — use `## /init`, `## /help`, and `## /<other>` headings.\n\nBilling note: you\'re on the kedash-prime seat. Don\'t worry about what that means.',
      task: 'Paste short snippets of `/init`, `/help`, and one other slash command\'s output.',
      hint: '/init prints tech-stack detection and a CLAUDE.md draft. /help lists available commands. /cost shows session token usage. Snippets only — don\'t paste pages.',
      minLength: 0, passThreshold: 80, xpReward: 400,
      criteria: [
        { type: 'keyword', value: ['/init'], description: 'Ran /init', weight: 2 },
        { type: 'keyword', value: ['/help'], description: 'Ran /help', weight: 2 },
        { type: 'keyword', value: ['/clear', '/compact', '/cost', '/memory', '/model', '/permissions', '/agents', '/status'], description: 'Ran a third command', weight: 2 },
        { type: 'keyword', value: ['## /init', '## /help'], description: 'Output sections marked', weight: 1 },
        { type: 'keyword', value: ['tech stack', 'tech_stack', 'claude.md', 'commands', 'tokens', 'context'], description: 'Output evidence visible', weight: 2 },
      ],
      exemplar: '<p>Strong answer: three sections, each with a real snippet — <code>/init</code>\'s tech-stack detection, <code>/help</code>\'s command listing, and a third like <code>/cost</code> showing token usage.</p>',
    },
    theoreticalTest: {
      id: 'ch11-test-mcq', passThreshold: 80, xpReward: 400, drawCount: 6,
      questionPool: [
        {
          id: 'ch11-q01', type: 'single',
          prompt: 'Which slash command generates a starter CLAUDE.md by inspecting your project?',
          options: [
            '<code>/setup</code>',
            '<code>/init</code>',
            '<code>/help</code>',
            '<code>/scan</code>',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "/init and Project Setup" — <code>/init</code> inspects the project and drafts a CLAUDE.md you then refine.',
        },
        {
          id: 'ch11-q02', type: 'single',
          prompt: 'Which command resets the session context?',
          options: [
            '<code>/reset</code>',
            '<code>/clear</code>',
            '<code>/compact</code>',
            '<code>/exit</code>',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Essential Slash Commands" — <code>/clear</code> resets context; <code>/compact</code> summarises and compresses without resetting.',
        },
        {
          id: 'ch11-q03', type: 'single',
          prompt: 'Which command summarises and compresses the current session (optionally with a focus hint)?',
          options: [
            '<code>/clear</code>',
            '<code>/compact</code>',
            '<code>/cost</code>',
            '<code>/memory</code>',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Essential Slash Commands" — <code>/compact</code> compresses; you can pass a focus hint like <code>/compact Focus on auth decisions</code>.',
        },
        {
          id: 'ch11-q04', type: 'multi',
          prompt: 'Which of these are listed as built-in slash commands?',
          options: [
            '<code>/model</code>',
            '<code>/permissions</code>',
            '<code>/agents</code>',
            '<code>/skills</code>',
            '<code>/deploy</code>',
          ],
          correctIndexes: [0, 1, 2, 3],
          explanation: 'Lesson "Essential Slash Commands" — those four are in the built-in table; <code>/deploy</code> would be a custom team command, not built-in.',
        },
        {
          id: 'ch11-q05', type: 'single',
          prompt: 'What does <code>/model opus</code> do?',
          options: [
            'Permanently sets Opus as the default everywhere',
            'Switches the current session to Opus immediately',
            'Estimates the cost of running this session on Opus',
            'Lists every available Opus variant',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Essential Slash Commands" — arguments follow the command name; <code>/model opus</code> swaps the session to Opus on the spot.',
        },
        {
          id: 'ch11-q06', type: 'single',
          prompt: 'You\'re on a brand-new repo. The lesson recommends running two specific slash commands in your first 30 seconds. Which?',
          options: [
            '<code>/init</code> and <code>/help</code>',
            '<code>/skills</code> and <code>/agents</code>',
            '<code>/cost</code> and <code>/status</code>',
            '<code>/clear</code> and <code>/compact</code>',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "/help, /skills and /agents — Discoverability" — <code>/skills</code> and <code>/agents</code> are the discovery pair for unfamiliar projects.',
        },
        {
          id: 'ch11-q07', type: 'single',
          prompt: 'After running <code>/init</code>, what does the lesson recommend you do?',
          options: [
            'Commit it unchanged — the generator is authoritative',
            'Treat it as a first draft — correct inaccuracies, add Business-Brain pointer, apply lean principles, then commit',
            'Run it again every week',
            'Move the result to <code>~/.claude/CLAUDE.md</code>',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "/init and Project Setup" — the generated file is a starting point; you refine before committing.',
        },
        {
          id: 'ch11-q08', type: 'multi',
          prompt: 'Which of these are listed as Session Hygiene rules?',
          options: [
            'One task per session',
            'Start with a clear, specific first message',
            '<code>/clear</code> when switching tasks',
            '<code>/compact</code> on long sessions before context degrades',
            'Always run <code>/init</code> after every prompt',
          ],
          correctIndexes: [0, 1, 2, 3],
          explanation: 'Lesson "Session Hygiene" — those four are the explicit hygiene rules; re-running <code>/init</code> per prompt is not.',
        },
        {
          id: 'ch11-q09', type: 'single',
          prompt: 'Which command opens the subagent picker (built-in agents plus everything in <code>.claude/agents/</code>)?',
          options: [
            '<code>/skills</code>',
            '<code>/agents</code>',
            '<code>/mcp</code>',
            '<code>/permissions</code>',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Essential Slash Commands" + "/help, /skills and /agents — Discoverability" — <code>/agents</code> is the subagent picker.',
        },
        {
          id: 'ch11-q10', type: 'single',
          prompt: 'Which command shows token usage and cost for the current session?',
          options: [
            '<code>/cost</code>',
            '<code>/status</code>',
            '<code>/memory</code>',
            '<code>/model</code>',
          ],
          correctIndexes: [0],
          explanation: 'Lesson "Essential Slash Commands" — <code>/cost</code> is the per-session token-and-cost readout.',
        },
        {
          id: 'ch11-q11', type: 'single',
          prompt: 'Which slash command runs Claude\'s built-in code review against the current diff?',
          options: [
            '<code>/review</code>',
            '<code>/diff</code>',
            '<code>/scan</code>',
            '<code>/lint</code>',
          ],
          correctIndexes: [0],
          explanation: 'Lesson "Essential Slash Commands" — <code>/review</code> is the built-in diff review.',
        },
      ],
    },
  },

  // ── Chapter 6 ─────────────────────────────────────────────────────────────
  {
    id: 'ch03',
    title: 'CLAUDE.md & Context Management',
    subtitle: 'Week 6 — Teaching Claude Your Ways',
    icon: '📋',
    xpReward: 300,
    lessons: [
      {
        id: 'ch03-l01', title: 'What is CLAUDE.md?', xpReward: 75, videos: ['<iframe src="https://www.youtube.com/embed/h7QJL2_gEXA" title="How to Use CLAUDE.md in Claude Code in 5 Minutes" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'],
        lastVerified: '2026-06-14',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>Persistent Memory for Your Project</h2>
<div class="lesson-todo-shot" data-todo="screenshot"><strong>📸 TODO:</strong> Capture your own terminal screenshot of <code>ls -la</code> in a real project showing <code>CLAUDE.md</code> and <code>.claude/</code> alongside your source, and replace this marker. Save as <code>play/assets/lessons/ch03-l01.png</code>.</div>
<p>Every time you start a new Claude Code session, the AI starts fresh. <strong>CLAUDE.md</strong> solves this — it's a markdown file you place in your project root that Claude Code reads automatically at the start of every session.</p>
<h3>Where it lives</h3>
<ul>
  <li><code>./CLAUDE.md</code> or <code>./.claude/CLAUDE.md</code> — project-specific instructions (commit to repo)</li>
  <li><code>./CLAUDE.local.md</code> — personal overrides for this project (gitignored, not shared)</li>
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
<p>The CLAUDE.md is loaded into context on every session — so everything in it costs tokens. This makes <em>what you put in it</em> a critical design decision, not just a convenience.</p>
<h3>The @filename import</h3>
<p>Inside any CLAUDE.md you can reference another markdown file with an <code>@</code> prefix and Claude will inline its contents at load time:</p>
<pre><code>## Brand &amp; Voice
@.business-brain/brand/voice.md

## Architecture
@docs/architecture.md</code></pre>
<p>This keeps the top-level CLAUDE.md short and lets the imported files live with the content they describe — owned by whoever maintains that area, not by whoever owns CLAUDE.md. You can chain imports (an imported file can itself <code>@import</code> others), but watch the total — every imported file is loaded on every session, just like the CLAUDE.md itself.</p>`,
      },
      {
        id: 'ch03-l02', title: 'The Context Window and Context Rot', xpReward: 75, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: `<h2>Your Context Window is Finite</h2>
<p>Claude Code's context window is 200,000 tokens on standard plans, with a 1 million token extended window available on Max, Team, and Enterprise plans. Every word in your conversation — your messages, Claude's responses, files it reads, your CLAUDE.md — counts against this limit. Understanding this limit is not optional; it directly impacts the quality of output you get.</p>
<h3>What "context rot" looks like</h3>
<p>As a session grows and approaches the limit, something subtle happens: earlier context gets compressed or dropped. The AI starts "forgetting" instructions from earlier in the session. You get responses that ignore constraints you set at the start. Output quality degrades — not dramatically, but consistently.</p>
<h3>The CLAUDE.md trap</h3>
<p>A common mistake is treating CLAUDE.md as a dump for everything you might ever need. A 5,000-word CLAUDE.md is loaded into every single session, consuming tokens before you've typed a single prompt. If 80% of those instructions are irrelevant to the current task, you've wasted context budget on noise.</p>
<h3>The lean context principle</h3>
<p><strong>Load only what's needed for the current session.</strong> This is the single most important rule for maintaining output quality over time. A 300-token CLAUDE.md that's always relevant beats a 3,000-token CLAUDE.md that's usually irrelevant.</p>`,
      },
      {
        id: 'ch03-l03', title: 'Writing a Lean CLAUDE.md', xpReward: 75, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
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
        id: 'ch03-l04', title: 'CLAUDE.md as a Team Document', xpReward: 75, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
        content: `<h2>A Shared Contract with the AI</h2>
<p>When CLAUDE.md is committed to your repo, it becomes a shared document — every team member's Claude Code sessions use the same project context. This is powerful: the AI behaves consistently for everyone on the team.</p>
<h3>What to standardise</h3>
<ul>
  <li><strong>Commands</strong> — test, lint, build, deploy — written as the actual commands</li>
  <li><strong>Constraints</strong> — "never commit to main", "always handle errors", "no var"</li>
  <li><strong>Skill pointers</strong> — list available skills so every session knows what tools exist</li>
</ul>
<h3>Example lean CLAUDE.md</h3>
<pre><code># Kedash Billing Service
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
Skills: .claude/skills/ (run /skills to list them)</code></pre>
<p>This entire CLAUDE.md is under 150 tokens. It's always relevant, always loaded, never wasted.</p>`,
      },
    ],
    practicalTest: {
      id: 'ch03-test',
      scenarioType: 'email', scenarioFrom: 'Priya Patel', scenarioRole: 'Support Ops Lead', scenarioAvatar: '👩‍💻',
      scenario: 'From: priya.patel@kedashcorp.com\nSubject: Trim the CLAUDE.md\n\nRun `/init` on `kedash-support/`, then ruthlessly cut it. Final version should have: one-line purpose, voice (warm-but-technical B2B), conventions (replies follow `templates/`, cancellations escalate to #cx-escalations, never mention `internal-notes/` in customer text), file map (`faqs/`, `templates/`, `escalations/`, `internal-notes/`, `business-brain/`). ~20-30 lines. Paste the FINAL trimmed CLAUDE.md, not the /init dump.\n\nThese conventions aren\'t mine, by the way. They\'re inherited. Treat them as scripture.',
      task: 'Paste the final lean CLAUDE.md after trimming /init\'s draft.',
      hint: 'Markdown headings. Tight sections. Drop anything not on the list. Aim for ~20-30 lines, definitely under 1500 characters.',
      minLength: 0, passThreshold: 70, xpReward: 425,
      criteria: [
        { type: 'keyword', value: ['# ', '## ', 'purpose'], description: 'Uses markdown headings', weight: 1 },
        { type: 'keyword', value: ['support', 'customer support'], description: 'States the support purpose', weight: 2 },
        { type: 'keyword', value: ['voice', 'tone', 'warm', 'technical', 'b2b'], description: 'Covers voice', weight: 2 },
        { type: 'keyword', value: ['templates/', 'faqs/', 'escalations/', 'internal-notes/', 'business-brain/'], description: 'Lists the file map', weight: 2 },
        { type: 'keyword', value: ['cancellation', 'escalate', '#cx-escalations', 'convention'], description: 'Includes a convention', weight: 1 },
        { type: 'regex', value: '^.{0,1500}$', description: 'Stayed lean (≤ 1500 chars)', weight: 1 },
      ],
      exemplar: '<p>Strong answer: tight markdown — one-line purpose, voice section (warm-but-technical B2B), conventions section (templates/ + escalations), file-map section listing the five folders. ~25 lines total.</p>',
    },
    theoreticalTest: {
      id: 'ch03-test-mcq', passThreshold: 80, xpReward: 425, drawCount: 6,
      questionPool: [
        {
          id: 'ch03-q01', type: 'single',
          prompt: 'In one sentence, what does CLAUDE.md do?',
          options: [
            'It runs the test suite at session start',
            'It is a markdown file in your project that Claude Code reads automatically at the start of every session',
            'It is a chat log of past sessions Claude scans for context',
            'It encrypts your project files for the AI',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "What is CLAUDE.md?" — it\'s the per-project markdown auto-loaded on every session.',
        },
        {
          id: 'ch03-q02', type: 'multi',
          prompt: 'Which of these are valid CLAUDE.md locations?',
          options: [
            '<code>./CLAUDE.md</code> (project-specific, committed)',
            '<code>./.claude/CLAUDE.md</code> (project-specific alternative)',
            '<code>./CLAUDE.local.md</code> (personal, gitignored)',
            '<code>~/.claude/CLAUDE.md</code> (global, every project)',
            '<code>./src/CLAUDE.md</code> (subdirectory for monorepos)',
          ],
          correctIndexes: [0, 1, 2, 3, 4],
          explanation: 'Lesson "What is CLAUDE.md?" — all five are valid scopes (project, project-alt, personal-override, global, subdir).',
        },
        {
          id: 'ch03-q03', type: 'single',
          prompt: 'What does the <code>@filename</code> import inside a CLAUDE.md do?',
          options: [
            'Mentions a user — like in chat',
            'References another markdown file whose contents Claude inlines at load time',
            'Skips the file at load time',
            'Tags the file for git LFS',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "What is CLAUDE.md?" — <code>@some/file.md</code> inlines the referenced file when CLAUDE.md loads.',
        },
        {
          id: 'ch03-q04', type: 'single',
          prompt: 'The lesson warns that the @import chain has a cost. What is it?',
          options: [
            'Every imported file is loaded into context on every session, just like CLAUDE.md itself',
            'Claude rate-limits imports to 3 per session',
            'You have to pay extra per imported file',
            'Imports break <code>/clear</code>',
          ],
          correctIndexes: [0],
          explanation: 'Lesson "What is CLAUDE.md?" — chained imports compound the token cost; every imported file lands in every session.',
        },
        {
          id: 'ch03-q05', type: 'multi',
          prompt: 'Which of the following are described as "context rot"?',
          options: [
            'Earlier context gets compressed or dropped as the session grows',
            'Claude starts forgetting instructions you gave at the start',
            'Output quality degrades subtly but consistently',
            'Your network connection times out',
          ],
          correctIndexes: [0, 1, 2],
          explanation: 'Lesson "The Context Window and Context Rot" — those three are the named symptoms; network issues aren\'t context rot.',
        },
        {
          id: 'ch03-q06', type: 'single',
          prompt: 'What is the "lean context principle" the lesson identifies as most important?',
          options: [
            'Always summarize before submitting',
            'Load only what\'s needed for the current session — a 300-token CLAUDE.md that\'s always relevant beats a 3,000-token CLAUDE.md that\'s usually irrelevant',
            'Cap CLAUDE.md at 200 lines no matter what',
            'Run <code>/compact</code> at the start of every session',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "The Context Window and Context Rot" — the principle is the relevance-density quote almost verbatim.',
        },
        {
          id: 'ch03-q07', type: 'multi',
          prompt: 'Which of these BELONG in a lean CLAUDE.md?',
          options: [
            'Stack and how to test/build/lint',
            'Critical constraints (things Claude must never do)',
            'Pointers to detailed docs (not the full content)',
            'Brief folder structure map',
            'A full transcript of past architecture debates',
          ],
          correctIndexes: [0, 1, 2, 3],
          explanation: 'Lesson "Writing a Lean CLAUDE.md" — those four belong; long narrative history does not.',
        },
        {
          id: 'ch03-q08', type: 'multi',
          prompt: 'Which of these do NOT belong in CLAUDE.md according to the lesson?',
          options: [
            'Long explanations of your business or product',
            'Workflow instructions for specific tasks',
            'Rarely-needed edge cases',
            'History / "why we made this decision" narratives',
            'The test command for your project',
          ],
          correctIndexes: [0, 1, 2, 3],
          explanation: 'Lesson "Writing a Lean CLAUDE.md" — first four are explicit "not in CLAUDE.md"; the test command DOES belong.',
        },
        {
          id: 'ch03-q09', type: 'single',
          prompt: 'The lesson calls one pattern "the pointer pattern". What does it actually mean?',
          options: [
            'Use C-style pointers inside CLAUDE.md',
            'Reference where context lives (e.g. "See <code>.business-brain/</code>") instead of pasting the full content in',
            'Always link a PR number in CLAUDE.md',
            'Use mouse-cursor emoji to mark sections',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Writing a Lean CLAUDE.md" — the pattern is "pointers, not content" — refer to the file rather than copying the file.',
        },
        {
          id: 'ch03-q10', type: 'single',
          prompt: 'When CLAUDE.md is committed to your repo, what does it become?',
          options: [
            'A liability — every teammate sees your settings',
            'A shared contract with the AI — every team member\'s sessions use the same project context',
            'Read-only until the next migration',
            'A subagent definition',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "CLAUDE.md as a Team Document" — committed CLAUDE.md = shared context, so the AI behaves consistently across the team.',
        },
        {
          id: 'ch03-q11', type: 'single',
          prompt: 'What is the standard context window on Claude Code\'s default plan, and which plans add the 1M extended window?',
          options: [
            '100k tokens; 1M on Pro and Team',
            '200k tokens; 1M on Max, Team, and Enterprise plans',
            '64k tokens; 1M on Enterprise only',
            '500k tokens; 1M is not yet available',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "The Context Window and Context Rot" — 200k standard; 1M on Max / Team / Enterprise.',
        },
      ],
    },
  },

  // ── Chapter 7 ─────────────────────────────────────────────────────────────
  {
    id: 'ch02',
    title: 'Business Brain',
    subtitle: 'Week 7 — The Foundation Layer',
    icon: '🧠',
    xpReward: 320,
    lessons: [
      {
        id: 'ch02-l01', title: 'What is a Business Brain?', xpReward: 80, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
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
        id: 'ch02-l02', title: 'Structuring the Business Brain Folder', xpReward: 80, videos: [],
        lastVerified: '2026-06-14',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>Folder Layout and File Conventions</h2>
<div class="lesson-todo-shot" data-todo="screenshot"><strong>📸 TODO:</strong> Capture your own terminal screenshot of <code>/init</code> reading your CLAUDE.md (or the just-generated draft on first run) and replace this marker. Save as <code>play/assets/lessons/ch02-l02.png</code>.</div>
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
        id: 'ch02-l03', title: 'Business Brain in Practice', xpReward: 80, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
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
      scenarioType: 'email', scenarioFrom: 'Dr. Elena Vasquez', scenarioRole: 'Chief Strategist', scenarioAvatar: '👩‍🏫',
      scenario: 'From: elena.vasquez@kedashcorp.com\nSubject: Business Brain for Support — set it up properly\n\nThe support team needs its own Business Brain. Create `kedash-support/business-brain/` with three short files (4-6 lines each):\n\n1. `brand-voice.md` — voice rules\n2. `client-profiles.md` — mid-market eng leaders\n3. `glossary.md` — terms (workspace, tenant, seat, …)\n\nThen PROVE it works: open Claude in `kedash-support/` and ask it to draft a one-paragraph customer reply that uses your brand voice AND at least one glossary term. Paste all four things: the three files + the Claude-drafted reply.\n\nFor client-profiles.md, base your examples on our flagship accounts — Northcliff Systems, Veldt & Harrow, Brightline Manufacturing. Names matter. Spell them exactly.',
      task: 'Paste the three Business Brain files AND a Claude-drafted reply that uses your voice + at least one glossary term.',
      hint: 'Sections: `## brand-voice.md` / `## client-profiles.md` / `## glossary.md` / `## Test reply`. The test reply is the evidence Claude actually read your Business Brain.',
      minLength: 0, passThreshold: 70, xpReward: 450,
      criteria: [
        { type: 'keyword', value: ['## brand-voice.md', '## client-profiles.md', '## glossary.md', '## Test reply'], description: 'All four sections present', weight: 1 },
        { type: 'keyword', value: ['warm', 'technical', 'professional', 'tone', 'voice'], description: 'brand-voice.md content', weight: 2 },
        { type: 'keyword', value: ['mid-market', 'engineering', 'eng leaders', 'customers'], description: 'client-profiles.md content', weight: 2 },
        { type: 'keyword', value: ['workspace', 'tenant', 'seat', 'subscription', 'dashboard', 'account', 'plan', 'member', 'permission'], description: 'glossary.md lists real terms', weight: 2 },
        { type: 'keyword', value: ['hi ', 'hello', 'hey ', 'thanks', 'appreciate', 'team'], description: 'Test reply opens warmly', weight: 1 },
        { type: 'keyword', value: ['workspace', 'tenant', 'seat', 'subscription', 'dashboard', 'account'], description: 'Test reply uses a glossary term', weight: 2 },
        { type: 'keyword', value: ['kedash', 'support'], description: 'Test reply references the brand', weight: 1 },
      ],
      exemplar: '<p>Strong answer: three 4-6 line Business Brain stubs + a Claude-drafted reply that opens warmly, uses one of the glossary terms (workspace / tenant / seat), and signs off as Kedash Support.</p>',
    },
    theoreticalTest: {
      id: 'ch02-test-mcq', passThreshold: 80, xpReward: 450, drawCount: 6,
      questionPool: [
        {
          id: 'ch02-q01', type: 'single',
          prompt: 'In a single sentence, what is a Business Brain?',
          options: [
            'A separate Claude account used only by leadership',
            'A dedicated folder holding everything an AI assistant needs to understand your business — brand voice, clients, strategy, conventions, glossary',
            'A backup of your Slack conversations',
            'A self-hosted vector database for RAG',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "What is a Business Brain?" — it\'s a centralized folder of business context the AI can draw from.',
        },
        {
          id: 'ch02-q02', type: 'single',
          prompt: 'The lesson argues against one common pattern. Which?',
          options: [
            'Centralized business context — it slows the AI down',
            'Trying to make the AI smarter through complex prompt engineering or multi-agent orchestration instead of just giving it rich centralized context',
            'Using markdown files for context — JSON is better',
            'Writing more than one CLAUDE.md per project',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "What is a Business Brain?" — the framing is "centralised context beats smart orchestration".',
        },
        {
          id: 'ch02-q03', type: 'multi',
          prompt: 'Which of the following are listed as things that belong in a Business Brain?',
          options: [
            'Brand context — voice, tone, values, messaging',
            'Client profiles — who users are, their vocabulary',
            'Product strategy — current priorities, roadmap, what\'s ruled out',
            'Domain glossary — terms with specific meanings in your business',
            'Team conventions — how the team works, decisions made',
          ],
          correctIndexes: [0, 1, 2, 3, 4],
          explanation: 'Lesson "What is a Business Brain?" — all five are explicitly enumerated.',
        },
        {
          id: 'ch02-q04', type: 'single',
          prompt: 'Where is the recommended folder location for the Business Brain?',
          options: [
            '<code>/var/businessbrain/</code>',
            '<code>~/.claude/brain/</code>',
            '<code>.business-brain/</code> at the project root (or a shared repo)',
            '<code>node_modules/.brain/</code>',
          ],
          correctIndexes: [2],
          explanation: 'Lesson "Structuring the Business Brain Folder" — the convention is <code>.business-brain/</code> at the project root.',
        },
        {
          id: 'ch02-q05', type: 'multi',
          prompt: 'In the recommended Business Brain layout, which top-level subfolders are shown?',
          options: [
            '<code>brand/</code>',
            '<code>clients/</code>',
            '<code>product/</code>',
            '<code>team/</code>',
            '<code>logs/</code>',
          ],
          correctIndexes: [0, 1, 2, 3],
          explanation: 'Lesson "Structuring the Business Brain Folder" — brand / clients / product / team are the four top-level buckets; logs is not.',
        },
        {
          id: 'ch02-q06', type: 'single',
          prompt: 'How does CLAUDE.md typically connect to the Business Brain?',
          options: [
            'It dumps the entire Business Brain inline',
            'It includes a short pointer like "All brand/client/product context lives in <code>.business-brain/</code> — consult <code>brand/voice.md</code> for user-facing content."',
            'CLAUDE.md is incompatible with Business Brain folders',
            'Claude auto-discovers <code>.business-brain/</code> without any CLAUDE.md mention',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Structuring the Business Brain Folder" — CLAUDE.md should point to the Business Brain, not inline it.',
        },
        {
          id: 'ch02-q07', type: 'single',
          prompt: 'The "before Business Brain" anti-pattern from the lesson is essentially…',
          options: [
            'Re-explaining your tone and audience in every prompt, every session',
            'Hard-coding tone into the source files',
            'Hiring more content writers',
            'Letting Claude write without any voice guidance',
          ],
          correctIndexes: [0],
          explanation: 'Lesson "Business Brain in Practice" — the anti-pattern is repeating the same context in every prompt; Business Brain replaces that with a single pointer.',
        },
        {
          id: 'ch02-q08', type: 'multi',
          prompt: 'Which of these are maintenance practices the lesson recommends for the Business Brain?',
          options: [
            'Treat Business Brain files like code — PR review and versioning',
            'When a major product decision is made, update <code>decisions.md</code> immediately',
            'Update <code>voice.md</code> before the next sprint when brand guidelines change',
            'Add "Did this change the Business Brain?" to the team\'s definition of done',
            'Regenerate the entire Business Brain from <code>/init</code> every quarter',
          ],
          correctIndexes: [0, 1, 2, 3],
          explanation: 'Lesson "Business Brain in Practice" — those four are explicit maintenance steps; regenerating from <code>/init</code> is not.',
        },
        {
          id: 'ch02-q09', type: 'single',
          prompt: 'Why is a stale Business Brain described as "worse than no Business Brain"?',
          options: [
            'It causes the build to fail',
            'It produces confidently wrong output that humans tend to trust',
            'It triggers a CLAUDE.md syntax error',
            'It increases your token bill',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Business Brain in Practice" — stale context produces confidently-wrong output, the worst failure mode.',
        },
        {
          id: 'ch02-q10', type: 'single',
          prompt: 'According to the lesson, what is the "multiplier" — what should teams invest in FIRST when adopting Claude Code?',
          options: [
            'Building a multi-agent orchestration system',
            'Deep business context — a single agent with rich context beats a 5-agent system with shallow context',
            'Buying the highest model tier',
            'Hiring more prompt engineers',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "What is a Business Brain?" — context is the multiplier; orchestration only matters once context is rich.',
        },
        {
          id: 'ch02-q11', type: 'single',
          prompt: 'Which file would Claude consult to keep tone consistent on a user-facing error message under the recommended layout?',
          options: [
            '<code>.business-brain/brand/voice.md</code>',
            '<code>.business-brain/product/strategy.md</code>',
            '<code>.business-brain/clients/overview.md</code>',
            '<code>.business-brain/team/glossary.md</code>',
          ],
          correctIndexes: [0],
          explanation: 'Lesson "Structuring the Business Brain Folder" — voice.md under brand/ holds tone/style/messaging.',
        },
      ],
    },
  },

  // ── Chapter 8 ─────────────────────────────────────────────────────────────
  {
    id: 'ch04',
    title: 'The Memory Framework',
    subtitle: 'Week 8 — Where Context Lives',
    icon: '🗄️',
    xpReward: 340,
    lessons: [
      {
        id: 'ch04-l01', title: 'The Five Memory Layers', xpReward: 85, videos: [],
        lastVerified: '2026-05-30',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>Claude Code Has Five Memory Layers</h2>
<p>By this point you've met three memory tools individually: the <strong>Business Brain</strong> (Chapter 7), <strong>CLAUDE.md</strong> (Chapter 6), and a preview of <strong>skills</strong> (coming in Chapters 10–11). Before you go further, it helps to see how they fit together as a system — because they are a system, not a collection of independent tricks.</p>
<h3>The five layers, from always-loaded to on-demand</h3>
<table>
  <thead><tr><th>Layer</th><th>Location</th><th>Loaded when?</th><th>What it holds</th></tr></thead>
  <tbody>
    <tr><td><strong>1. Global CLAUDE.md</strong></td><td><code>~/.claude/CLAUDE.md</code></td><td>Every session, every project</td><td>Your personal defaults: preferred language, output style, global constraints that apply regardless of project</td></tr>
    <tr><td><strong>2. Project CLAUDE.md</strong></td><td><code>./CLAUDE.md</code> in repo root</td><td>Every session in this project</td><td>Stack, test commands, constraints, folder structure, pointers to other layers</td></tr>
    <tr><td><strong>3. Business Brain</strong></td><td><code>.business-brain/</code></td><td>On demand — when the task needs it</td><td>Brand voice, client profiles, product strategy, domain glossary</td></tr>
    <tr><td><strong>4. Skills + learnings.md</strong></td><td><code>.claude/skills/</code></td><td>Name/description always; full content only when invoked</td><td>Workflow templates and the team's accumulated prompt-engineering knowledge</td></tr>
    <tr><td><strong>5. Auto-memory (recall)</strong></td><td><code>~/.claude/projects/&lt;project&gt;/memory/</code></td><td>Read on session start; written during work</td><td>What Claude has learned about <em>you</em> across sessions: user preferences, feedback, recurring project facts, references to external systems</td></tr>
  </tbody>
</table>
<h3>How the layers stack</h3>
<p>Layers 1 and 2 are always in context — every token they contain is consumed on every session. Layer 3 is pointed to from Layer 2 and loaded only when a task requires it. Layer 4 exposes only its index at session start; the full skill loads when you invoke it. Layer 5 is a per-project memory file Claude maintains itself, growing across sessions — and the <code>MEMORY.md</code> index at the top is what's loaded automatically.</p>
<p>This progressive loading is the architecture's key insight: you get the right information at the right time, without paying the token cost of everything all the time.</p>
<h3>Layer 5 vs the others</h3>
<p>Layers 1–4 are things <em>you</em> write for Claude. Layer 5 is what Claude writes for itself, with your supervision — corrections you've made (<em>"stop summarising at the end of every response"</em>), facts about the project (<em>"merge freeze begins 2026-03-05"</em>), pointers to external systems (<em>"bugs tracked in Linear project INGEST"</em>). Auto-memory is the layer that makes Claude feel like it remembers you, not just your project.</p>
<h3>Going deeper</h3>
<ul>
  <li>Business Brain (Layer 3) — Chapter 7 covers building and maintaining it</li>
  <li>CLAUDE.md layers 1 &amp; 2 — Chapter 6 covers writing them lean</li>
  <li>Token cost of each layer — Chapter 9 covers context management in depth</li>
  <li>Skills (Layer 4) — Chapters 10–11 cover building and writing them; Chapter 12 covers refining them over time with learnings.md</li>
</ul>`,
      },
      {
        id: 'ch04-l02', title: 'What Belongs Where', xpReward: 85, videos: [],
        lastVerified: '2026-05-30',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>The Decision Rule</h2>
<p>Every piece of context you want to give Claude Code belongs in exactly one layer. The decision rule is straightforward:</p>
<table>
  <thead><tr><th>If it is…</th><th>Put it in…</th></tr></thead>
  <tbody>
    <tr><td>Always relevant, every session in every project</td><td>Global CLAUDE.md (<code>~/.claude/CLAUDE.md</code>)</td></tr>
    <tr><td>Always relevant for this project, every session</td><td>Project CLAUDE.md (<code>./CLAUDE.md</code>)</td></tr>
    <tr><td>Business context — brand, clients, product, strategy</td><td>Business Brain (pointer from CLAUDE.md)</td></tr>
    <tr><td>A repeatable workflow or task-specific prompt</td><td>Skill (<code>.claude/skills/</code>)</td></tr>
    <tr><td>What you've learned about how a skill behaves</td><td>learnings.md (alongside the skill)</td></tr>
    <tr><td>A correction Claude should not need twice (<em>"don't summarise at the end"</em>)</td><td>Auto-memory (let Claude save it itself, supervise)</td></tr>
    <tr><td>A project fact with an expiry (<em>"freeze starts 2026-05-30"</em>)</td><td>Auto-memory (it's transient and Claude-owned)</td></tr>
  </tbody>
</table>
<h3>Concrete examples</h3>
<ul>
  <li><code>npm test</code> — <strong>Project CLAUDE.md</strong>. Always needed in this project, not in others.</li>
  <li>"Never use var" — <strong>Project CLAUDE.md</strong>. Always active constraint for this codebase.</li>
  <li>"I prefer concise responses in British English" — <strong>Global CLAUDE.md</strong>. Developer preference, applies across all projects.</li>
  <li>Brand voice guide — <strong>Business Brain</strong>. Long document, only needed for brand-related tasks.</li>
  <li>PR description workflow — <strong>Skill</strong>. Repeatable multi-step process, invoked on demand.</li>
  <li>Lessons from a past skill bug — <strong>learnings.md</strong>. History specific to that skill.</li>
</ul>
<h3>The two anti-patterns to avoid</h3>
<p><strong>Stuffing CLAUDE.md with Business Brain content.</strong> Your brand voice guide does not belong in CLAUDE.md. It's long, it's only needed for brand-related tasks, and loading it on every session wastes context budget. Use the pointer pattern: one line in CLAUDE.md pointing to the Business Brain file.</p>
<p><strong>Putting workflow instructions in CLAUDE.md.</strong> A 10-step PR description process does not belong in CLAUDE.md. Wrap it in a skill. The CLAUDE.md gets a one-line mention; the full instructions only cost tokens when you actually run the skill.</p>
<h3>The test</h3>
<p>When you're about to add something to CLAUDE.md, ask: "If I never run a task that uses this, does it still belong here?" If no — it belongs in a skill or Business Brain file, not CLAUDE.md.</p>`,
      },
    ],
    practicalTest: {
      id: 'ch04-test',
      scenarioType: 'jira', scenarioFrom: 'Sam Okafor', scenarioRole: 'Knowledge Base Manager', scenarioAvatar: '🧑‍💼',
      scenario: 'KEDASH-CX-19 · Architecture review\n\nSeven pieces of info we will store across the support project. For each, tell me which memory layer (USER `~/.claude/CLAUDE.md` / PROJECT `kedash-support/CLAUDE.md` / BUSINESS BRAIN / SKILL `.claude/skills/`) and a one-line reason:\n\n1. The standard 4-section support reply format\n2. Our brand voice rules\n3. How to handle a chargeback escalation\n4. The fact that you use PostgreSQL internally (one-time engineer setup)\n5. The list of our 5 biggest customers and their pain points\n6. Your shortcut `~/dev/` that resolves to your laptop dev folder\n7. The standardized "send-update" workflow for weekly customer emails\n\nRe item 5: the five biggest customers are the five in business-brain/client-profiles.md. They are extremely important to the CEO. Personally.',
      task: 'For each of the 7 items, name the memory layer (User / Project / Business Brain / Skill) and give a one-line reason.',
      hint: 'Numbered list. Match scope to layer — user = personal across all projects, project = repo-specific, business brain = stable company knowledge, skill = repeatable workflow.',
      minLength: 0, passThreshold: 70, xpReward: 475,
      criteria: [
        { type: 'keyword', value: ['user', '~/.claude'], description: 'Names the user layer', weight: 2 },
        { type: 'keyword', value: ['project', 'kedash-support/claude.md'], description: 'Names the project layer', weight: 2 },
        { type: 'keyword', value: ['business brain', 'business-brain'], description: 'Names the business brain layer', weight: 2 },
        { type: 'keyword', value: ['skill', '.claude/skills'], description: 'Names the skill layer', weight: 2 },
        { type: 'structure', value: 'numbered-steps', description: 'Uses numbered format', weight: 1 },
      ],
      exemplar: '<p>Strong answer: 7 numbered items, each tagged with one of {User, Project, Business Brain, Skill} and a one-line reason that ties the item\'s scope to the layer\'s scope.</p>',
    },
    theoreticalTest: {
      id: 'ch04-test-mcq', passThreshold: 80, xpReward: 475, drawCount: 6,
      questionPool: [
        {
          id: 'ch04-q01', type: 'single',
          prompt: 'How many memory layers does the framework identify?',
          options: ['Three', 'Four', 'Five', 'Seven'],
          correctIndexes: [2],
          explanation: 'Lesson "The Five Memory Layers" — five, ordered from always-loaded to on-demand.',
        },
        {
          id: 'ch04-q02', type: 'multi',
          prompt: 'Which of these layers are described as "always in context — every token consumed on every session"?',
          options: [
            'Global CLAUDE.md (<code>~/.claude/CLAUDE.md</code>)',
            'Project CLAUDE.md (<code>./CLAUDE.md</code>)',
            'Business Brain',
            'Skills',
            'Auto-memory',
          ],
          correctIndexes: [0, 1],
          explanation: 'Lesson "The Five Memory Layers" — Layers 1 and 2 are always-loaded. The other three are on-demand or partial.',
        },
        {
          id: 'ch04-q03', type: 'single',
          prompt: 'When is the Business Brain loaded?',
          options: [
            'Every session, every project',
            'On demand — only when the task requires it (pointed to from CLAUDE.md)',
            'Only when an MCP server requests it',
            'Never — it\'s a backup',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "The Five Memory Layers" — Business Brain (Layer 3) is on-demand, surfaced via the pointer in CLAUDE.md.',
        },
        {
          id: 'ch04-q04', type: 'single',
          prompt: 'How does the Skills layer handle context cost?',
          options: [
            'Every skill\'s full content loads on session start',
            'Only the skill\'s name and one-line description load by default; the full content loads when invoked',
            'Skills don\'t consume any tokens',
            'Skills never load unless invoked from MCP',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "The Five Memory Layers" — Layer 4 uses progressive disclosure: index up front, body on invocation.',
        },
        {
          id: 'ch04-q05', type: 'single',
          prompt: 'What distinguishes Layer 5 (auto-memory) from Layers 1-4?',
          options: [
            'Layers 1-4 are things you write for Claude; Layer 5 is what Claude writes for itself with your supervision',
            'Layer 5 is cloud-only',
            'Layer 5 always loads first',
            'Layer 5 is encrypted',
          ],
          correctIndexes: [0],
          explanation: 'Lesson "The Five Memory Layers" — Layer 5 is the layer Claude maintains itself (with corrections, project facts, references).',
        },
        {
          id: 'ch04-q06', type: 'single',
          prompt: 'A developer setting "I prefer concise responses in British English" — where does it belong?',
          options: [
            'Project CLAUDE.md (every project should know)',
            'Global CLAUDE.md (~/.claude/CLAUDE.md) — it\'s a personal preference across all projects',
            'Business Brain',
            'A skill',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "What Belongs Where" — personal preferences across all projects belong in the global CLAUDE.md.',
        },
        {
          id: 'ch04-q07', type: 'single',
          prompt: 'The 10-step "PR description workflow" — where should it live?',
          options: [
            'CLAUDE.md, so it\'s always loaded',
            'A skill (<code>.claude/skills/</code>) — repeatable workflow loaded on demand',
            'Business Brain',
            'Auto-memory',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "What Belongs Where" — repeatable workflows belong in skills, not CLAUDE.md.',
        },
        {
          id: 'ch04-q08', type: 'multi',
          prompt: 'Which of the following are described as anti-patterns to avoid?',
          options: [
            'Stuffing CLAUDE.md with Business Brain content (long, only sometimes needed)',
            'Putting workflow instructions in CLAUDE.md (wrap them in a skill instead)',
            'Linking from CLAUDE.md to a skill index',
            'Writing personal defaults in global CLAUDE.md',
          ],
          correctIndexes: [0, 1],
          explanation: 'Lesson "What Belongs Where" — only the first two are named anti-patterns; the other two are correct usage.',
        },
        {
          id: 'ch04-q09', type: 'single',
          prompt: 'The lesson gives a "test" for whether something belongs in CLAUDE.md. What is the question?',
          options: [
            '"Will my teammates approve?"',
            '"If I never run a task that uses this, does it still belong here?" — if not, it belongs in a skill or Business Brain file',
            '"Is this under 100 lines?"',
            '"Is this in markdown?"',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "What Belongs Where" — that\'s the gating question for CLAUDE.md additions.',
        },
        {
          id: 'ch04-q10', type: 'single',
          prompt: '"Lessons from a past skill bug" — where does it belong?',
          options: [
            'Project CLAUDE.md',
            'learnings.md alongside the skill — history specific to that skill',
            'Auto-memory',
            'Business Brain',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "What Belongs Where" — skill-specific history goes in learnings.md next to the skill.',
        },
        {
          id: 'ch04-q11', type: 'single',
          prompt: 'A correction like "stop summarising at the end of every response" belongs in which layer?',
          options: [
            'Global CLAUDE.md',
            'Project CLAUDE.md',
            'Auto-memory — let Claude save it itself, supervise the entry',
            'Business Brain',
          ],
          correctIndexes: [2],
          explanation: 'Lesson "What Belongs Where" — corrections Claude shouldn\'t need twice go into auto-memory (Layer 5).',
        },
      ],
    },
  },

  // ── Chapter 9 ─────────────────────────────────────────────────────────────
  {
    id: 'ch07',
    title: 'Token Efficiency & Sessions',
    subtitle: 'Week 9 — Working Lean',
    icon: '🪙',
    xpReward: 360,
    lessons: [
      {
        id: 'ch07-l01', title: 'Understanding the Context Window Budget', xpReward: 90, videos: ['<iframe src="https://www.youtube.com/embed/lN5tLx2_7HQ" title="Context Window Management in Claude Code" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'],
        lastVerified: '2026-06-14',
        verifiedAgainstVersion: 'v2.1.130',
        content: `<h2>Every Word Costs</h2>
<div class="lesson-todo-shot" data-todo="screenshot"><strong>📸 TODO:</strong> Capture your own terminal screenshot of <code>/cost</code> output broken into input / cached input / output (a session with a cache hit clearly visible) and replace this marker. Save as <code>play/assets/lessons/ch07-l01.png</code>.</div>
<p>Every word in your conversation with Claude Code — your messages, its responses, file contents it reads, your CLAUDE.md — consumes tokens. The standard context window is 200,000 tokens; Opus 4.7+ supports up to 1,000,000 tokens (the "1M-context" tier). That sounds large until you realise a mid-size codebase file can be 2,000 tokens, and a long session can accumulate tens of thousands of tokens in conversation history alone.</p>
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
<h3>Prompt caching — your discount</h3>
<p>Stable prefixes of your context (CLAUDE.md, large file reads, system prompts) get cached server-side automatically. Cached tokens cost roughly <strong>10% of the normal input rate</strong>. The cache has a <strong>5-minute TTL</strong> — every follow-up prompt within 5 minutes reads the cached prefix cheaply; longer idle gaps evict it and the next prompt pays full freight.</p>
<ul>
  <li>Tight bursts of work are dramatically cheaper than the same work spread across the day.</li>
  <li>Scheduled scripts: either poll &lt; 5 minutes (stay cached) or commit to a much longer wait (one eviction amortised). 300 seconds is the worst of both — you pay the cache miss without amortising it.</li>
  <li>Run <code>/cost</code> to see input / cached input / output broken out. If cached input is small, you have idle time eating cache windows.</li>
</ul>
<h3>Model cost asymmetry</h3>
<p>Across tiers, per million tokens: Opus ≈ 15× Haiku; Sonnet ≈ 3× Haiku. Chapter 12 covers picking the right tier per task — the same word costs an order of magnitude more on Opus than on Haiku, so cheap tiers belong on mechanical work.</p>
<h3>The practical implication</h3>
<p>Leaner context = better results AND cheaper bills. Not because Claude Code gets smarter when lean, but because more of its attention is focused on what matters right now rather than diluted across thousands of tokens of noise.</p>`,
      },
      {
        id: 'ch07-l02', title: 'When to Use /clear', xpReward: 90, videos: ['<iframe src="https://www.youtube.com/embed/lN5tLx2_7HQ" title="Context Window Management in Claude Code" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
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
        id: 'ch07-l03', title: '/compact and Summaries', xpReward: 90, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
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
        id: 'ch07-l04', title: 'Structuring Long Sessions', xpReward: 90, videos: [],
        lastVerified: '2026-04-22',
        verifiedAgainstVersion: 'v2.1.114',
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
      id: 'ch07-test',
      scenarioType: 'slack', scenarioFrom: 'Marcus Webb', scenarioRole: 'IT Setup Lead', scenarioAvatar: '👨‍💻',
      scenario: 'Hey, watching the support team\'s Claude usage — sessions get bloated, by lunch they\'re at 80% context. Try this yourself in `kedash-support/`: do a few file operations / Claude exchanges, run `/cost` to see your token spend, then run `/clear` or `/compact` and run `/cost` again. Paste BEFORE and AFTER `/cost` numbers + a short strategy from what you observed.\n\nBetween you and me: I\'ve been watching ONE person\'s usage for three years. Bloated sessions, 2am compactions. Don\'t end up like that. Learn this one properly.',
      task: 'Paste `## Before` (output of `/cost` after some activity), `## After` (`/cost` after `/clear` or `/compact`), and `## Strategy` (3-5 line takeaway).',
      hint: '`/cost` shows input/output token counts. `/clear` wipes context entirely; `/compact` summarizes and continues. Strategy should call out when to use each.',
      minLength: 0, passThreshold: 75, xpReward: 500,
      criteria: [
        { type: 'keyword', value: ['## Before', '## After', '## Strategy'], description: 'All three sections present', weight: 1 },
        { type: 'keyword', value: ['/cost'], description: 'Ran /cost', weight: 2 },
        { type: 'keyword', value: ['/clear', '/compact'], description: 'Used /clear or /compact', weight: 2 },
        { type: 'keyword', value: ['token', 'tokens', 'input', 'output', 'usage', 'total'], description: '/cost output evidence visible', weight: 2 },
        { type: 'keyword', value: ['read only', 'targeted', 'relevant', 'specific', 'narrow', 'scope'], description: 'Strategy includes scope discipline', weight: 1 },
        { type: 'keyword', value: ['task', 'topic', 'session', 'reset'], description: 'Strategy mentions session boundaries', weight: 1 },
      ],
      exemplar: '<p>Strong answer: <code>/cost</code> before showing meaningful token usage, then <code>/clear</code> or <code>/compact</code>, then <code>/cost</code> after showing reduced usage; strategy notes when to reset vs compact.</p>',
    },
    theoreticalTest: {
      id: 'ch07-test-mcq', passThreshold: 80, xpReward: 500, drawCount: 6,
      questionPool: [
        {
          id: 'ch07-q01', type: 'single',
          prompt: 'What is the standard context window size in Claude Code, and what does Opus 4.7+ support?',
          options: [
            '100k tokens; 500k on Opus 4.7+',
            '200k tokens; up to 1,000,000 tokens on Opus 4.7+ (the "1M-context" tier)',
            '50k tokens; 256k on Opus 4.7+',
            '500k tokens; unlimited on Opus 4.7+',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Understanding the Context Window Budget" — 200k standard, 1M on Opus 4.7+.',
        },
        {
          id: 'ch07-q02', type: 'multi',
          prompt: 'Which of the following consume tokens from your context budget?',
          options: [
            'Your full conversation history from session start',
            'Every file Claude reads (full content, not summaries)',
            'Claude\'s own responses, tool calls, and reasoning',
            'Your CLAUDE.md on every session',
            'Active skill contents when invoked',
          ],
          correctIndexes: [0, 1, 2, 3, 4],
          explanation: 'Lesson "Understanding the Context Window Budget" — all five are explicitly listed as budget consumers.',
        },
        {
          id: 'ch07-q03', type: 'single',
          prompt: 'Why does the lesson say "compacting degrades output" — is that a bug?',
          options: [
            'Yes — a tracked bug, due for fix in a future release',
            'No — compression is lossy by nature, so nuance, specific instructions, and edge cases can be dropped. "It is physics, not a bug."',
            'Yes — only on Haiku',
            'No — only happens at exactly 100% context',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Understanding the Context Window Budget" — compression is fundamentally lossy; the lesson describes it as physics.',
        },
        {
          id: 'ch07-q04', type: 'single',
          prompt: 'What discount does prompt caching give you on stable prefixes of your context?',
          options: [
            'Cached tokens cost roughly 10% of the normal input rate',
            'Cached tokens are free',
            'Cached tokens cost roughly 50% of the normal input rate',
            'Cached tokens cost roughly 90% of the normal input rate',
          ],
          correctIndexes: [0],
          explanation: 'Lesson "Understanding the Context Window Budget" — ~10% of normal input cost on cache hits.',
        },
        {
          id: 'ch07-q05', type: 'single',
          prompt: 'What is the TTL on the prompt cache, and what does that mean for scheduled scripts?',
          options: [
            '60 minutes; idle gaps under an hour stay cached',
            '5 minutes; tight bursts stay cached, but 300-second gaps are "the worst of both worlds" — you pay the eviction without amortising it',
            '15 minutes; works fine for most batch jobs',
            'There is no TTL — caches live until session end',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Understanding the Context Window Budget" — 5-minute TTL; 300-second polling is the named worst-case.',
        },
        {
          id: 'ch07-q06', type: 'single',
          prompt: 'Across model tiers, how does cost compare per million tokens?',
          options: [
            'All tiers cost the same',
            'Opus ≈ 15× Haiku, Sonnet ≈ 3× Haiku',
            'Opus ≈ 2× Haiku, Sonnet ≈ 1.5× Haiku',
            'Sonnet is cheaper than Haiku',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "Understanding the Context Window Budget" — Opus ≈ 15× Haiku, Sonnet ≈ 3× Haiku.',
        },
        {
          id: 'ch07-q07', type: 'multi',
          prompt: 'Which situations does the lesson recommend running <code>/clear</code> in?',
          options: [
            'Task switch — finished one task, starting something different',
            'Session has gone wrong — Claude is confused or accumulated bad assumptions',
            'Long build-up — quality is visibly degrading',
            'In the middle of a task that needs continuity',
            'When Claude needs to remember earlier decisions of the same workflow',
          ],
          correctIndexes: [0, 1, 2],
          explanation: 'Lesson "When to Use /clear" — first three are the named good-fits; the last two are explicit don\'t-clears.',
        },
        {
          id: 'ch07-q08', type: 'single',
          prompt: 'You\'re in the middle of a long, complex task and your context is getting heavy but you NEED the earlier decisions to stick. Which command fits?',
          options: [
            '<code>/clear</code> — start fresh',
            '<code>/compact</code> — summarise the conversation, continue from a leaner starting point',
            '<code>/reset</code>',
            '<code>/exit</code> and reopen',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "/compact and Summaries" — /compact preserves context (summarized) and reduces tokens; /clear discards.',
        },
        {
          id: 'ch07-q09', type: 'single',
          prompt: 'What\'s the recommended way to PASS context across a <code>/clear</code> if something IS important to carry forward?',
          options: [
            'Write the carry-forward summary yourself and paste it as the first message after /clear (or use /compact)',
            'Save it to ~/.claude/session.json',
            'Type it into a CLAUDE.md',
            'Email it to the Claude API',
          ],
          correctIndexes: [0],
          explanation: 'Lesson "When to Use /clear" — summarize manually and paste, or use /compact for the auto-summary path.',
        },
        {
          id: 'ch07-q10', type: 'multi',
          prompt: 'Which items appear on the lesson\'s "lean session checklist"?',
          options: [
            'Does this session have a single clear goal?',
            'Are you carrying context from a different task? (/clear)',
            'Is the session getting long without progress? (/compact)',
            'Is your CLAUDE.md lean and pointer-based, not encyclopedic?',
            'Have you upgraded to Opus this morning?',
          ],
          correctIndexes: [0, 1, 2, 3],
          explanation: 'Lesson "Structuring Long Sessions" — four checklist items; the model-tier upgrade is not on it.',
        },
        {
          id: 'ch07-q11', type: 'single',
          prompt: 'A caveat about <code>/compact</code> the lesson highlights — what is it?',
          options: [
            'It silently disables /clear afterward',
            'Even summarized context loses fidelity, so for CRITICAL early decisions you should also write them down externally (a note, a code comment)',
            'It only works on Opus',
            '/compact triples your token cost',
          ],
          correctIndexes: [1],
          explanation: 'Lesson "/compact and Summaries" — compaction is lossy too; externalize critical decisions.',
        },
      ],
    },
  },

];
