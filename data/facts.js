// data/facts.js — the volatile facts the curriculum depends on, in ONE place.
//
// Model names, prices, defaults and TTLs change every few months. Lessons
// and quiz items interpolate these values (`${window.FACTS.opus.name}`)
// instead of hard-coding them, so a model release becomes a one-file edit
// plus a re-read of the lessons listed in `usedBy`, not a hand sweep of
// 20 lessons (that sweep happened three times in 2026 before this file).
//
// MONTHLY CHECK (owner decision 2026-11-25): re-verify every value below
// against the `source` URLs, bump `verifiedOn` / `cliVersion`, then run
// `node scripts/audit/data-consistency.cjs` (it fails if this file is more
// than 35 days old).
//
// Must load BEFORE data/curriculum*.js (index.html; scripts/audit/lib/extract.cjs).
window.FACTS = {
  verifiedOn: '2026-11-25',
  cliVersion: 'v2.1.332',

  // Current family. Prices are USD per million tokens (input / output).
  // https://platform.claude.com/docs/en/about-claude/models/overview
  // https://platform.claude.com/docs/en/about-claude/pricing
  opus:   { name: 'Opus 5.5',   full: 'Claude Opus 5.5',   id: 'claude-opus-5-5',   alias: 'opus',   priceIn: 4,    priceOut: 20,   context: '1M' },
  sonnet: { name: 'Sonnet 5.5', full: 'Claude Sonnet 5.5', id: 'claude-sonnet-5-5', alias: 'sonnet', priceIn: 2,    priceOut: 10,   context: '1M' },
  haiku:  { name: 'Haiku 5.5',  full: 'Claude Haiku 5.5',  id: 'claude-haiku-5-5',  alias: 'haiku',  priceIn: 0.10, priceOut: 0.50, context: '1M',
            // Haiku 5.5 is priced by prompt length.
            longPromptThreshold: '100K', longPriceIn: 0.50, longPriceOut: 2.50 },
  fable:  { name: 'Fable 5.2',  full: 'Claude Fable 5.2',  id: 'claude-fable-5-2',  alias: 'fable',  priceIn: 8,    priceOut: 40,   context: '1M' },

  // Rounded cost ratios vs Haiku on short prompts (input price).
  ratio: { opusToHaiku: 40, sonnetToHaiku: 20, opusToSonnet: 2 },

  // Claude Code defaults. https://code.claude.com/docs/en/model-config
  defaultModelKey: 'opus',          // "defaults to Opus 5.5" on Pro/Max/Ultra/Team/Enterprise/API
  defaultEffort: 'medium',          // 5.5 family + Fable 5.2
  effortLevels: ['low', 'medium', 'high', 'xhigh', 'max'],
  fastModeModels: 'Opus 5.5 and Fable 5.2',   // https://code.claude.com/docs/en/fast-mode

  // Prompt caching. https://code.claude.com/docs/en/prompt-caching
  cache: {
    subscriptionTtl: '1 hour',      // main conversation, Claude subscription within plan usage
    otherTtl: '5 minutes',          // subagents; API key / usage credits / cloud providers
    readPct: '5–10%',               // 0.05× on Opus/Sonnet 5.5, 0.1× on most others
    ttlSetting: 'promptCacheTtl',
  },

  usedBy: ['ch07-l01', 'ch07-l03', 'ch10-l01', 'ch10-l02', 'ch10-l03', 'ch10-l04', 'ch15-l01', 'ch16-l06',
           'ch03-test-mcq', 'ch07-test-mcq', 'ch10-test-mcq', 'ch16-test-mcq'],
};
