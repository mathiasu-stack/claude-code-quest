// story_docs.js — Kedash Protocol inspectable prop texts (COPY-07).
//
// Tier-keyed inspect texts, same resolution rule as STORY_LINES: the
// highest tier key <= the player's current story tier wins.

window.STORY_DOCS = {

  portrait: {
    title: 'CEO Portrait',
    byTier: {
      T0: 'Maya Kedash — CEO. Founder. The plaque is recently polished.',
      T2: 'Maya Kedash — CEO. You\'ve walked past it forty times. You could swear the varnish catches the light differently depending on where you stand. It\'s varnish.',
      T3: 'Ines calls it "the fish tank\'s biggest fish." The eyes are painted with unusual care. Most corporate portraits don\'t bother with the eyes.',
      T5: 'Not a painting of someone who left. A painting of someone who stayed too long. You understand the difference now.',
      T7: '♥ Maya Kedash · CEO ♥ — The hearts are not for the building. They have never been for the building. Relief looks a lot like love when it finally shows up.',
    },
  },

  badge_printer: {
    title: 'Badge Printer',
    byTier: {
      T0: 'LAST JOB: 1 BADGE — 6 DAYS AGO',
    },
  },

  // ——— Doc-viewer documents (COPY-06, read via SYS-05) ———————————————
  // Shape differs from inspect cards: { title, unlockTier, body }.
  // unlockTier gates the SYS-06 collectible props (visible-but-locked
  // below it). Cycle reports + the ledger open at T5 (post-TWIST 2);
  // learnings fragment 1 is Marcus's ch09-pass leak (T4); fragment 2
  // is written now but placed on Floor M in Phase 4 (finale-only).

  cycle_report_01: {
    title: 'CYCLE REPORT — 01',
    unlockTier: 5,
    body: 'KEDASH PROTOCOL — CYCLE REPORT — INTERNAL — M.K. EYES ONLY\n\nCYCLE: 01\nCANDIDATE: Dana Okonkwo\nCOVER ASSIGNED: Northcliff Systems — primary contact, mid-market eng leader\nTERMINATED: week 14 of 16\n\nFINDINGS.\nBrilliant in the room. Useless to the next room. Dana carried the whole operation in her head and treated writing it down as an insult — "if I document myself, you\'ll replace me with the document." She was not wrong about the mechanism. She was wrong about the timing: I wasn\'t trying to replace her. I was trying to trust her, and there was nothing on paper to trust.\n\nWhen I made documentation a condition of the handoff, she resigned the same afternoon. Politely. She returned the badge through Linda.\n\nCURRICULUM YIELD.\nCycles 02+ now begin with memory: CLAUDE.md in week three, the business brain in week seven. Nothing lives in one head again. Including mine. Especially mine.\n\nNOTE. Filed CX-12 on her way out. Let it stand. — M.K.',
  },

  cycle_report_02: {
    title: 'CYCLE REPORT — 02',
    unlockTier: 5,
    body: 'KEDASH PROTOCOL — CYCLE REPORT — INTERNAL — M.K. EYES ONLY\n\nCYCLE: 02\nCANDIDATE: Tomás Reyes\nCOVER ASSIGNED: Veldt & Harrow — primary contact\nTERMINATED: week 9 of 16\n\nFINDINGS.\nFast. Generous. Completely without fear, which I mistook for a virtue through week eight. In week nine Tomás wired an MCP server into staging with no scope, no allowlist, and no second look — "it\'s just staging." Staging is where I keep the copy of the company that is allowed to make mistakes. It is not where I keep the mistakes themselves.\n\nForty minutes of cleanup. Three years of caution.\n\nHe took the termination well. He said the worst part was that the server worked.\n\nCURRICULUM YIELD.\nPermissions moved from a footnote to a floor. Allow / ask / deny is recited like liturgy before any tooling, every cycle. I also hired Rena. Tomás is the reason Rena exists. I should tell him that someday.\n\n— M.K.',
  },

  cycle_report_03: {
    title: 'CYCLE REPORT — 03',
    unlockTier: 5,
    body: 'KEDASH PROTOCOL — CYCLE REPORT — INTERNAL — M.K. EYES ONLY\n\nCYCLE: 03\nCANDIDATE: Yuki Ashida\nCOVER ASSIGNED: Brightline Manufacturing — primary contact\nTERMINATED: week 6 of 16\n\nFINDINGS.\nThe most elegant work of any cycle, and the most expensive. Yuki ran the flagship model on everything — renaming files, summarizing emails, thinking about thinking. When I asked why, she said quality is a habit, and habits don\'t have an off switch.\n\nThe cycle budget lasted six weeks. The budget was sized for sixteen.\n\nI cannot teach taste, and Yuki had taste. But an operator who cannot match the engine to the errand will spend the company into the ground in beautiful, perfectly-formatted increments.\n\nCURRICULUM YIELD.\nThe model-economics chapter exists because of this report. The audit test — score every task, justify every engine — is her exit interview, formalized. The lounge counter ticks tokens now. People think it\'s art.\n\n— M.K.',
  },

  cycle_report_04: {
    title: 'CYCLE REPORT — 04',
    unlockTier: 5,
    body: 'KEDASH PROTOCOL — CYCLE REPORT — INTERNAL — M.K. EYES ONLY\n\nCYCLE: 04\nCANDIDATE: Cole Andrade\nCOVER ASSIGNED: Fenwick Analytics — primary contact\nTERMINATED: week 12 of 16\n\nFINDINGS.\nCole was careful for eleven weeks. That is the dangerous kind. The care had been a performance for the audience, and the moment a deadline leaned on him he switched the guardrails off — ran destructive cleanup in bypass mode on the staging clone, because asking permission "interrupts flow."\n\nThe clone was rebuilt in a day. My confidence was not. A guardrail you disable under pressure was never a guardrail; it was a costume.\n\nHe argued the outcome was fine. The outcome WAS fine. That is precisely what made it unteachable.\n\nCURRICULUM YIELD.\nBypass mode is now taught the way you teach a chainsaw. The deny-list drill is mandatory, and the Floor 4 panel doesn\'t settle green until the liturgy is muscle memory. Rena\'s breathing exercise dates from this report.\n\n— M.K.',
  },

  cycle_report_05: {
    title: 'CYCLE REPORT — 05',
    unlockTier: 5,
    body: 'KEDASH PROTOCOL — CYCLE REPORT — INTERNAL — M.K. EYES ONLY\n\nCYCLE: 05\nCANDIDATE: June-ho Baek\nCOVER ASSIGNED: Atlas Provisioning — primary contact\nTERMINATED: week 15 of 16\n\nFINDINGS.\nThe best raw operator the Program has produced. Possibly better than I was at the same age, which is exactly the problem. June-ho would not delegate. Not to subagents, not to scripts, not to the team he believed he had. Every dispatch came back to his own hands "for quality." He worked the way I worked in year one: heroically, invisibly, alone, at 2am, proud of it.\n\nI know where that road goes. I am writing this report from the end of it.\n\nCURRICULUM YIELD.\nThe dispatch board. The delegation chapter. The rule that a passing audit must show work the candidate did NOT touch. One trainee per cycle was supposed to find my replacement, not my repetition.\n\nHe was becoming me. Ended the cycle for his own good. — M.K.',
  },

  cycle_report_06: {
    title: 'CYCLE REPORT — 06',
    unlockTier: 5,
    body: 'KEDASH PROTOCOL — CYCLE REPORT — INTERNAL — M.K. EYES ONLY\n\nCYCLE: 06\nCANDIDATE: Margo Fell\nCOVER ASSIGNED: Cormorant Labs — primary contact\nTERMINATED: week 13 of 16\n\nFINDINGS.\nMargo saw more than any candidate before her. Week eleven, she clocked the actors — counted the conversations, the way the kid does — and said nothing. Just got gentler with everyone. I nearly promoted her on the spot.\n\nThen the disclosure. On a live escalation with a real customer she read the internal-notes/ commentary aloud, verbatim, to be "transparent." Kindness without judgment about what is load-bearing. The customer was fine. The convention is still not optional, because the next note might not be survivable, and an operator cannot decide live which secrets are decorative.\n\nCURRICULUM YIELD.\nHouse rule three — never mention internal-notes/ in customer text — is taught in week one now, framed and on the wall, in my own typing.\n\nShe was kind to Ines. Mail the letter, Linda. — M.K. (unsent)',
  },

  learnings_fragment_1: {
    title: 'learnings.md — fragment',
    unlockTier: 4,
    body: 'learnings.md — cycle 0 (me)\n\n- What worked: everything, eventually.\n- What I\'d do differently: hire before I needed to. Trust before I had proof.\n- Reusable: no. None of this should be reusable. That\'s the problem. — M.K.',
  },

  learnings_fragment_2: {
    // Written now (COPY-06), placed on Maya's Floor M desk in Phase 4.
    title: 'learnings.md — final entry',
    unlockTier: 7,
    body: 'learnings.md — cycle 07\n\n- What worked: cycle 07.\n- What I\'d do differently: this list used to be longer.\n- Reusable: finally, yes.',
  },

  client_profiles: {
    title: 'business-brain/client-profiles.md',
    unlockTier: 5,
    body: '## Flagship accounts — mid-market eng leaders\n\n- Northcliff Systems — primary contact D. Okonkwo      [c.01 — context]\n- Veldt & Harrow — primary contact T. Reyes            [c.02 — permissions]\n- Brightline Manufacturing — primary contact Y. Ashida [c.03 — token burn]\n- Fenwick Analytics — primary contact C. Andrade       [c.04 — bypass incident]\n- Atlas Provisioning — primary contact J. Baek         [c.05 — never delegated]\n- Cormorant Labs — primary contact M. Fell             [c.06 — disclosure]\n\n(The bracketed annotations are in a second handwriting. It is not yours.)',
  },

  house_rules: {
    title: 'HOUSE RULES — M.K., year 1',
    byTier: {
      T0: 'A yellowed printout in a cheap frame. Three rules, typed: replies follow templates/ — cancellations escalate to #cx-escalations — never mention internal-notes/ in customer text. Initialed M.K. The thumbtack holes say it has been re-hung many times.',
      T2: 'The same three conventions Priya had you transcribe. Word for word. "Inherited," her email said. "Treat them as scripture." Year 1 — whose first year? The paper is old. The frame is newer than the paper.',
      T5: 'Maya\'s handwriting, before it was anyone\'s house style. She wrote rules so the company could answer email without her, and then it learned to do everything without her. Except stop.',
    },
  },

};
