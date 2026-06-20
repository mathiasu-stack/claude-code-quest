// curriculum3.js — Chapter 17, the "Build Your First Product" capstone.
//
// Pushes onto window.CURRICULUM (curriculum.js must load first). ch17 is a
// SPECIAL capstone chapter, not a standard zone chapter:
//   • capstone: true  → excluded from badge-floor math (engine/progress.js)
//     and exempted from the per-chapter NPC audit (it has no 3D zone).
//   • It is delivered via the Product Lab bench in reception + the dashboard,
//     not a dedicated elevator floor.
//   • Its practical test is graded by the composite `product` artifact kind
//     (engine/evaluator.js): the player pastes a real multi-part "build kit",
//     structurally checked for several real shapes — never that it ran.
//   • Passing ch17-test unlocks the Product Lab AND (re-)gates the grand finale.
//
// The 18 selectable templates live in data/productTemplates.js (shared with
// the Product Lab). The test view (ui/test.js) renders the picker when
// ch.id === 'ch17'; grading is template-agnostic.

window.CURRICULUM.push({
  id: 'ch17',
  title: 'Build Your First Product',
  subtitle: 'Capstone — Point your Playbook at one real thing and ship it',
  icon: '🚀',
  xpReward: 600,
  capstone: true,
  lessons: [
    {
      id: 'ch17-l01', title: 'From Competence to Product', xpReward: 150, videos: [],
      lastVerified: '2026-06-20', verifiedAgainstVersion: 'v2.1.160',
      content: `<h2>The Playbook was the means. This is the end.</h2>
<p>Across sixteen chapters you built a real, portable <code>.claude/</code> <strong>Playbook</strong> — a CLAUDE.md, skills, a slash command, a subagent, a permissions profile, a scheduled job, a learnings loop. Useful, hand-off-able. But a toolkit that never touches a real job is just a toolkit.</p>
<p>This chapter is the first time you <em>assemble</em> the pieces instead of producing them one at a time. You pick <strong>one real thing</strong> — something useful to an actual person (you, a parent, a student, a retiree) — and you point the whole Playbook at it until it ships.</p>
<h3>What "ship" means here</h3>
<p>You're building the <strong>blueprint + wiring kit</strong>: the flow written down, plus the real artifacts that make it run (a skill or subagent, an <code>.mcp.json</code> or <code>settings.json</code>, a scheduled <code>claude -p</code> line). You adapt the <em>delivery channel</em> to whatever you actually have — Telegram, an email to yourself, a local file. (WhatsApp is the spiky one: it needs the Business API or a bridge, so treat it as an optional stretch, never the default.)</p>
<p>The honest line: this proves you can <em>assemble a real product</em>, not that it's already running in production. That last mile is yours — but everything that makes it possible, you now have.</p>
<p>This is also the Maya/Ines payoff: the product is the one unstaged thing you carry out of rented Kedash Corp. It runs without you in the room. Someone else could pick it up.</p>`,
    },
    {
      id: 'ch17-l02', title: 'Anatomy of an Autonomous Agent', xpReward: 150, videos: [],
      lastVerified: '2026-06-20', verifiedAgainstVersion: 'v2.1.160',
      content: `<h2>Trigger → Fetch → Reason → Act</h2>
<p>Almost every useful everyday product is the same four-beat loop. Name the beats and the build falls out of them:</p>
<ol>
<li><strong>Trigger</strong> — what starts it. A schedule (<code>claude -p</code> on a cron/timer/Task Scheduler) for "every morning" jobs, or a click for a browser add-on.</li>
<li><strong>Fetch</strong> — where the facts come from. An <strong>MCP</strong> connection (<code>.mcp.json</code>) to email, a calendar, a weather feed; or a local notes file; or the page you're on.</li>
<li><strong>Reason</strong> — the judgment. A <strong>skill</strong> that knows how to do the task your way, often with a <strong>subagent</strong> for a focused sub-job (triage, grading, list-building) so the main flow stays clean.</li>
<li><strong>Act</strong> — the visible result. A message to your phone, a written file, a draft for you to approve.</li>
</ol>
<h3>The Money Sentinel, mapped</h3>
<p>The flagship template makes the loop concrete: <em>Trigger</em> = a 7am scheduled <code>claude -p</code>; <em>Fetch</em> = an <code>.mcp.json</code> to your email; <em>Reason</em> = a "statement reader" skill + a triage subagent that flags trials about to auto-charge and odd charges; <em>Act</em> = one short "money heads-up" to Telegram. Five Playbook pieces, one product.</p>
<p>Every one of the 18 templates is this loop with different beats filled in. When you build, write the four beats down first — that README <em>is</em> the spine of your build kit.</p>`,
    },
    {
      id: 'ch17-l03', title: 'Guardrails: Shipping Something That Acts For You', xpReward: 150, videos: [],
      lastVerified: '2026-06-20', verifiedAgainstVersion: 'v2.1.160',
      content: `<h2>An agent that acts on your behalf needs a leash</h2>
<p>The moment a product reads your email or spends near your money, "move fast" stops being free. Three guardrails, all built from pieces you already have:</p>
<ul>
<li><strong>Least privilege</strong> — a <code>settings.json</code> <code>permissions</code> block that <em>allows</em> the safe reads, <em>asks</em> before anything that acts, and <em>denies</em> the rest. The Money Sentinel is strictly read-only; it never moves money.</li>
<li><strong>A human gate</strong> — anything outward-facing (a message, a posted reply) is <em>drafted</em> for you to approve, not auto-sent. Auto-draft → human approve → auto-distribute. Never auto-distribute something unseen.</li>
<li><strong>Hooks for the reflexes</strong> — a <code>hooks</code> entry that, say, logs every run or blocks a forbidden action, so the rules hold even when you're not watching.</li>
</ul>
<h3>Now build it</h3>
<p>In the practical, you'll pick one of <strong>18 templates</strong> (rated 🟢 Easy / 🟡 Medium / 🔴 Hard) and paste its build kit: the four-beat README plus the real pieces it orchestrates. Build one to finish your training — then keep building the rest at the <strong>Product Lab</strong> in reception, which opens the moment you pass.</p>`,
    },
  ],
  practicalTest: {
    id: 'ch17-test',
    scenarioType: 'slack', scenarioFrom: 'Maya Okonkwo', scenarioRole: 'Founder, Ines & Co.', scenarioAvatar: '👩🏾‍💼',
    scenario: "You've built the whole Playbook. Now do the thing it was always for.\n\nPick ONE product from the catalog below — whatever's genuinely useful to you or someone you love — and assemble its build kit. I don't need it running on a server today; I need to see you've put the pieces together into one real thing: the flow written down, plus the actual artifacts that make it work (a skill or subagent, an .mcp.json or settings.json, the scheduled claude -p line).\n\nThis is the one unstaged thing you take out of here. Build it well — someone else should be able to pick it up.",
    task: 'Pick a template below, then paste your build kit: a short README of the four-beat flow (trigger → fetch → reason → act) PLUS the real pieces it orchestrates. Several real shapes, not one description.',
    hint: 'Write the four beats first — that README is the spine. Then paste the real artifacts: a `---` frontmatter skill/subagent, an `.mcp.json` (`mcpServers`) or `settings.json` (`permissions`/`hooks`), and the scheduled `claude -p "…"` line. The grader looks for at least three real shapes, not prose.',
    minLength: 150, passThreshold: 70, xpReward: 600,
    criteria: [
      { type: 'structure', value: 'numbered-steps', description: 'A written flow (numbered beats / steps)', weight: 1, improvement: 'Add the four-beat flow as a numbered list: 1. Trigger 2. Fetch 3. Reason 4. Act.' },
      { type: 'keyword', value: ['skill', 'subagent', 'agent', 'mcpServers', '.mcp.json', 'permissions', 'settings.json', 'claude -p', 'cron', 'schedule'], description: 'Names the real Playbook pieces it orchestrates', weight: 1, improvement: 'Reference the actual pieces — a skill/subagent, an .mcp.json or settings.json, the scheduled claude -p line.' },
      // The composite `product` artifact criterion (kind:'product', weight 3) is
      // appended automatically by capstoneCriteria() in ui/test.js — it requires
      // at least three real artifact shapes in the pasted kit.
    ],
    exemplar: '<p>Strong answer: a short README with a numbered <em>trigger → fetch → reason → act</em> flow, then the real pieces pasted in — a <code>---</code> frontmatter skill or subagent, an <code>.mcp.json</code> with an <code>mcpServers</code> object (or a <code>settings.json</code> <code>permissions</code>/<code>hooks</code> block), and the scheduled <code>claude -p "…"</code> line. Three or more real shapes assembled into one product — not a paragraph describing the idea.</p>',
  },
});
