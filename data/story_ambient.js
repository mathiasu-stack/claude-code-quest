// story_ambient.js — Kedash Protocol ambient NPC line sets (SYS-04 / COPY-05).
//
// Act-gated six-line sets for the walking-around staff. The six-line
// loop is CANON — exactly six per act, repetition intended and
// eventually lampshaded. Line 1 is the LOOP ANCHOR: identical in every
// act (until Act IV breaks it) so attentive players can clock the system.
//
// Set selection happens at NPC spawn time (play.js → ambientLineForSlot),
// so lines refresh on floor reload only — never mid-scene.
// Copy is verbatim from design/story/kedash_protocol_scenario.md §6.1.

window.STORY_AMBIENT = {

  // ACT I (T0–T1) — the office performing an office
  act1: [
    'Busy week. They say the new cohort starts soon.',
    'Did you see the Q3 numbers? …Me neither, ha.',
    'Coffee on three is better. Don\'t ask me why.',
    'Maya\'s office? Top floor. She\'s just very busy.',
    'I\'ve been here— wow, time flies. What year is it? Ha.',
    'You\'re new! Everyone is, eventually.',
  ],

  // ACT II (T2) — seams showing
  act2: [
    'Busy week. They say the new cohort starts soon.',
    'I\'d transfer to four, but you need clearance. Nobody has clearance.',
    'Don\'t bother memorizing names down here. Honest advice.',
    'The girl in the lobby? Always here. Sweet kid. Sees everything.',
    'My job? I keep the floor looking right. It\'s more skilled than it sounds.',
    'If you ever hear someone say the same thing twice… that\'s normal. Offices repeat.',
  ],

  // ACT III (T3, post-TWIST 1) — masks on, but they know you know
  act3: [
    'Busy week. They say the new cohort starts soon.',
    'You know, don\'t you. It\'s fine. Keep walking. Great badge, by the way.',
    'Six lines. They gave us six. It\'s a budget thing. I asked for a seventh.',
    'I clocked in four years ago. It\'s felt like one long, well-lit day.',
    'She watches from the painting. Kidding. *(beat)* Mostly kidding.',
    'Do well on the tests, okay? We\'re all sort of rooting for you. That part\'s not scripted.',
  ],

  // ACT IV (T5+, post-TWIST 2) — warm, honest, anchor broken
  act4: [
    'Busy week. The new cohort is you, by the way. It was always just you.',
    'Almost there. Floor four\'s the real one. You can tell by the air conditioning.',
    'When you meet her — be kind. She built all this alone, and then it built her in.',
    'I auditioned for this with a juggling act. They said \'just walk.\' Eight years of clown school, and the note is \'just walk.\'',
    'The last six never got past Rena. No pressure. (Tania has a betting pool. I took you.)',
    'We get paid either way. But I hope it\'s you. We all hope it\'s you.',
  ],

  // Post-finale set (epilogue ambience, replaces all of the above)
  postFinale: [
    'They\'re keeping us on! REAL departments. I picked accounting. It\'s apparently vibes.',
    'Eight claps, every time, for three years. Last night I clapped eleven. Anarchy.',
    'Tania won the pool. She always says hi to the kid — that was her tell.',
    'First all-hands in three years next week. I might cry. I\'m a great crier, it\'s on my reel.',
    'The new one in the lobby looks so lost. Should we— no. No, it\'s funnier this way.',
    'Busy week. For real this time.',
  ],

  // Resolve the active set for a story tier (see storyState.deriveTier).
  setForTier(tier) {
    if (tier >= 7) return this.postFinale;
    if (tier >= 5) return this.act4;
    if (tier >= 3) return this.act3;
    if (tier >= 2) return this.act2;
    return this.act1;
  },

};
