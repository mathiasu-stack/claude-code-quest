// productTemplates.js — the Chapter 17 "Build Your First Product" catalog.
//
// One source of truth for BOTH the ch17 practical-test template picker
// (ui/test.js) and the in-world Product Lab overlay (play/ui/productLab.js).
// Each template is a real, everyday product the player assembles by pointing
// their Playbook (skills + subagents + MCP + schedule + permissions) at one
// concrete job. Grading is STRUCTURAL (the composite `product` artifact kind):
// the player pastes a real "build kit" and we check it contains several real
// artifact shapes — a genuine multi-part build — not that it ran.
//
// Honest framing (kept in the copy): the player builds the BLUEPRINT + WIRING
// KIT and adapts the delivery channel to what they actually have. WhatsApp is
// an optional stretch everywhere — Telegram / email-to-self / a local file are
// the defaults.
//
// Schema per entry:
//   id          kebab-case unique id (persisted in progress.productsBuilt)
//   name        display name
//   complexity  'easy' | 'medium' | 'hard'  (🟢/🟡/🔴 in the UI)
//   form        one-line form factor ('scheduled agent', 'browser add-on', …)
//   audience    who it helps (non-work-specific by design)
//   blurb       1–2 sentence what-it-does
//   pieces      Playbook pieces it reuses (chips in the UI)
//   kit         one-line of what to paste as the build kit (the grading hint)

window.PRODUCT_TEMPLATES = [
  // ── 🟢 Easy — prove it end-to-end with nothing but a laptop ──────────────
  {
    id: 'kitchen-planner',
    name: 'The Sunday Kitchen Planner',
    complexity: 'easy',
    form: 'weekly agent (or on-demand)',
    audience: 'households, students, retirees',
    blurb: 'From a "what\'s in my kitchen" note + who\'s eating + a budget, it plans the week\'s dinners, writes an aisle-grouped shopping list, and flags what\'s about to expire.',
    pieces: ['skill', 'subagent', 'schedule', 'CLAUDE.md'],
    kit: 'a README of the flow, a meal-planner SKILL.md, the shopping-list subagent, the weekly schedule, and your food prefs in CLAUDE.md',
  },
  {
    id: 'bill-calendar',
    name: 'Bill & Subscription Calendar',
    complexity: 'easy',
    form: 'scheduled reminder (no email access)',
    audience: 'everyone',
    blurb: 'You list your recurring bills once; it just reminds you before each is due. The Money Sentinel\'s no-sensitive-data cousin.',
    pieces: ['skill', 'schedule', 'CLAUDE.md'],
    kit: 'a README, the bills list, a reminder SKILL.md, and a scheduled claude -p line',
  },
  {
    id: 'memory-keeper',
    name: 'The "On This Day" Memory Keeper',
    complexity: 'easy',
    form: 'daily journal agent',
    audience: 'retirees, parents',
    blurb: 'You send it a line about your day; it keeps a private journal and resurfaces "a year ago today".',
    pieces: ['skill', 'schedule', 'learnings'],
    kit: 'a README, a journal SKILL.md, the journal/memory file format, and the daily schedule',
  },
  {
    id: 'forms-advocate',
    name: 'Letters & Forms Advocate',
    complexity: 'easy',
    form: 'on-demand assistant',
    audience: 'retirees, anyone vs. bureaucracy',
    blurb: 'Drafts and helps you fill complaints, insurance appeals, benefit applications, and replies to officialdom.',
    pieces: ['skill', 'command', 'CLAUDE.md'],
    kit: 'a README, a letter-drafting SKILL.md or /letter command, and your details/tone in CLAUDE.md',
  },
  {
    id: 'bedtime-story',
    name: 'The Bedtime Story Maker',
    complexity: 'easy',
    form: 'on-demand (optionally read aloud)',
    audience: 'parents, grandparents',
    blurb: 'A personalized short story starring your kid and their interests, optionally read aloud.',
    pieces: ['skill', 'command', 'CLAUDE.md'],
    kit: 'a README, a story SKILL.md or /story command, and the kid + interests profile in CLAUDE.md',
  },
  {
    id: 'declutter-coach',
    name: 'Declutter Coach',
    complexity: 'easy',
    form: 'daily nudge agent',
    audience: 'everyone',
    blurb: 'One small daily decluttering task (a drawer, your photos, your inbox) with streaks.',
    pieces: ['skill', 'schedule', 'learnings'],
    kit: 'a README, a task-picker SKILL.md, a progress/streak file, and the daily schedule',
  },

  // ── 🟡 Medium — one external piece, no sensitive data ────────────────────
  {
    id: 'plain-language-lens',
    name: 'The Plain-Language Lens',
    complexity: 'medium',
    form: 'browser add-on',
    audience: 'retirees, students, non-native speakers',
    blurb: 'Click anything baffling and get it re-explained at your reading level, in your language — medical results, insurance, dense text.',
    pieces: ['skill', 'CLAUDE.md', 'permissions'],
    kit: 'a README of the flow, a plain-language SKILL.md, your reading-level/language prefs in CLAUDE.md, and a read-only permissions block',
  },
  {
    id: 'is-this-real',
    name: 'The "Is This Real?" Guard',
    complexity: 'medium',
    form: 'browser add-on',
    audience: 'retirees especially; everyone',
    blurb: 'Flags scam / phishing / fake-review / misinformation red flags on an email, listing, or viral claim — and explains them calmly.',
    pieces: ['skill', 'subagent', 'permissions'],
    kit: 'a README, a red-flags SKILL.md, a skeptical subagent, and a read-only (never-act) permissions block',
  },
  {
    id: 'patient-tutor',
    name: 'The Patient Tutor',
    complexity: 'medium',
    form: 'scheduled agent + chat',
    audience: 'students, retirees keeping sharp',
    blurb: 'Daily spaced-repetition micro-quizzes on anything you\'re learning, leaning on what you keep getting wrong.',
    pieces: ['skill', 'subagent', 'schedule', 'learnings'],
    kit: 'a README, a spaced-repetition SKILL.md, the answer-grading subagent, your weak-spots learnings file, and the daily schedule',
  },
  {
    id: 'language-buddy',
    name: 'Language Buddy',
    complexity: 'medium',
    form: 'daily chat agent',
    audience: 'learners, travelers',
    blurb: 'A short daily conversation in your target language with gentle corrections, adapting to your level.',
    pieces: ['skill', 'schedule', 'CLAUDE.md'],
    kit: 'a README, a conversation SKILL.md, your level/goals in CLAUDE.md, and the daily schedule',
  },
  {
    id: 'read-later',
    name: 'Read-It-Later Companion',
    complexity: 'medium',
    form: 'weekly agent',
    audience: 'everyone drowning in tabs',
    blurb: 'Summarizes and reads aloud the articles you save, with a weekly "your queue" digest.',
    pieces: ['skill', 'subagent', 'schedule'],
    kit: 'a README, a summarizer SKILL.md, a queue subagent, and the weekly digest schedule',
  },
  {
    id: 'outings-curator',
    name: 'Local Outings Curator',
    complexity: 'medium',
    form: 'weekly agent',
    audience: 'retirees, students, families',
    blurb: 'A weekly digest of free/cheap local events matching your interests — library talks, markets, walks, free-museum days.',
    pieces: ['mcp', 'skill', 'schedule'],
    kit: 'a README, an .mcp.json for your event source, a curator SKILL.md, and the weekly schedule',
  },
  {
    id: 'plant-care',
    name: 'Garden & Plant Care Coach',
    complexity: 'medium',
    form: 'scheduled agent',
    audience: 'hobbyists, retirees',
    blurb: 'Watering/care reminders per plant by season and your local weather; what to plant when.',
    pieces: ['mcp', 'skill', 'schedule', 'CLAUDE.md'],
    kit: 'a README, an .mcp.json for weather, a plant-care SKILL.md, your plants list in CLAUDE.md, and the schedule',
  },
  {
    id: 'news-editor',
    name: 'Personal News Editor',
    complexity: 'medium',
    form: 'daily agent',
    audience: 'everyone overwhelmed by the feed',
    blurb: 'One calm daily brief on the topics you care about, deliberately away from doom-scroll.',
    pieces: ['mcp', 'subagent', 'schedule', 'CLAUDE.md'],
    kit: 'a README, an .mcp.json for your news source, a filtering subagent, your topics in CLAUDE.md, and the daily schedule',
  },

  // ── 🔴 Hard — full orchestration, sensitive access, real guardrails ──────
  {
    id: 'money-sentinel',
    name: 'The Money Sentinel',
    complexity: 'hard',
    form: 'scheduled morning agent',
    audience: 'everyone — students on a budget, retirees on a fixed income',
    blurb: 'Reads your personal email and warns BEFORE money leaves: a trial about to auto-charge, a price hike, an odd charge, a bill due in three days. The flagship — it touches every piece.',
    pieces: ['mcp', 'skill', 'subagent', 'schedule', 'permissions'],
    kit: 'a README of the flow, an .mcp.json for email, a statement-reader SKILL.md, a triage subagent, a strict read-only permissions/hooks block, and the morning schedule',
  },
  {
    id: 'family-hub',
    name: 'The Family Logistics Hub',
    complexity: 'hard',
    form: 'weekly agent',
    audience: 'parents, carers, multi-gen households',
    blurb: 'A weekly "what\'s happening" brief from a shared calendar/notes: birthdays, appointments, school events, bin day.',
    pieces: ['mcp', 'subagent', 'schedule', 'permissions'],
    kit: 'a README, an .mcp.json for the shared calendar, a brief-builder subagent, a permissions block, and the weekly schedule',
  },
  {
    id: 'gentle-checkin',
    name: 'The Gentle Check-In',
    complexity: 'hard',
    form: 'scheduled agent with escalation',
    audience: 'carers, the elderly living alone',
    blurb: 'A scheduled "how are you today?" to someone living alone; logs the reply, and if there\'s no answer by midday, quietly nudges a designated family member.',
    pieces: ['skill', 'subagent', 'schedule', 'permissions'],
    kit: 'a README of the flow + escalation rule, a check-in SKILL.md, an escalation subagent, a contact/permissions block, and the schedule',
  },
  {
    id: 'price-watcher',
    name: 'Price-Drop Wishlist Watcher',
    complexity: 'hard',
    form: 'scheduled agent',
    audience: 'budget-conscious everyone',
    blurb: 'Watches the price of specific things you want and pings you on a drop or back-in-stock.',
    pieces: ['mcp', 'skill', 'subagent', 'schedule'],
    kit: 'a README, an .mcp.json or fetch step for the listings, a watcher SKILL.md, a compare subagent, and the schedule',
  },
];
