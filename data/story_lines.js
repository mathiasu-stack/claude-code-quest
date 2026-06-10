// story_lines.js — Kedash Protocol dialogue overrides (SYS-02 data, Act I copy).
//
// Tier-keyed override channel for NPC dialogue. For each map, the highest
// tier key (T0, T1, …) that is <= the player's current story tier wins.
// Fields per NPC id:
//   promptLabel        — replaces the proximity prompt label text
//   introByTier        — replaces npc.intro (must still lead into lesson/test)
//   introAppendByTier  — appended (space-separated) to the resolved intro
//   nextHintByTier     — replaces npc.nextHint in the done state
//   postPassOnceByTier — shown once as dialogue body after the NPC's test is
//                        newly passed; string, or { text, speakerName,
//                        speakerRole, speakerPortrait } for a relayed speaker.
//
// Story copy lives here so play/play.js stays narrative-agnostic.

window.STORY_LINES = {

  // ——— Reception / Floor 1 ———

  linda: {
    introAppendByTier: {
      T0: '"Your badge is ready — here. Oh, don\'t look so surprised. We print them when we\'re *confident*." (beat) "HR joke. We\'re famous for them."',
    },
    nextHintByTier: {
      T0: '"Did I know your name before you said it? I\'m HR, sweetheart. Knowing names before people say them is the entire job."',
    },
  },

  kenji: {
    introByTier: {
      T0: '"Yo. Kenji. You walk like the last— like a natural. Like a natural. Anyway: interface." Now that you\'ve poked at it, let me actually walk you through the interface so you know what every part does.',
    },
  },

  sarah: {
    postPassOnceByTier: {
      T1: '"You did better than the last one." (she straightens, badge catching the light) "Don\'t mention this. To anyone. Especially not to me."',
    },
  },

  ines: {
    introByTier: {
      // Pre-TWIST 1 (T2): plants the clap count. Once ch04-test passes,
      // talking to her runs STORY_SCENES.twist1 instead of this intro;
      // after the scene the tier is 3 and the idle line below wins.
      T2: '"Did you see your clapping party when you got promoted? I\'ve seen ten of those. They always clap eight times. Count next time. It\'s so weird."',
      T3: '"Conversation Bingo. Wanna play? You always win now, it\'s less fun. It\'s still pretty fun."',
    },
  },

  // ——— Knowledge Library (chapter 7 beats, Act II) ———

  elena: {
    introByTier: {
      // THE mentor glitch — she calls the player a predecessor's name,
      // then corrects without blinking. Lesson lead-in preserved.
      T2: '"Welcome to the Knowledge Library, Dana— " (a full beat; she doesn\'t blink) "—kid. Welcome to the Knowledge Library, kid. Elena. Doctor, technically." Forget prompt-engineering tricks — the real lever is centralised context. That\'s what a Business Brain is.',
    },
    nextHintByTier: {
      T2: '"Did I call you something? I teach the same chapter to a lot of bright young people. The names compost. The *material* keeps."',
    },
  },

  raj: {
    introAppendByTier: {
      T2: '"Folder structure outlives staff structure. You\'d be amazed what a company can lose and still have great folders."',
    },
  },

  noor: {
    postPassOnceByTier: {
      // T3-gated: only fires after TWIST 1 has been seen.
      T3: '"Between us: the library is the only room the actors don\'t bother performing in. Nobody performs in a library. That\'s why I asked to work here."',
    },
  },

  // ——— Generated chapter mentors ———

  'auto-ch05-l01': {
    introByTier: {
      T1: '"Specificity. The brief you got is a good example — \'warm-but-technical.\' Very specific. Almost like someone\'s describing a *person* they miss, ha. Anyway."',
    },
  },

  'auto-ch05-test': {
    introAppendByTier: {
      T1: '"Jordan\'s great, by the way. You\'ll never meet her — she\'s remote. Everyone here is sort of remote, when you think about it. Don\'t think about it."',
    },
  },

  'auto-ch06-l04': {
    introByTier: {
      T1: '"Always read the diff. Files lie about how they got that way. Take that FAQ — wrong since before my time, and *nobody noticed?* In a support org? Files lie. Read the diff."',
    },
  },

  'auto-ch06-test': {
    postPassOnceByTier: {
      T2: '"Oh — Marcus from IT pinged me. Says, quote, \'tell the new one: good ticket hygiene. Also tell them ticket numbers are load-bearing.\' No, I don\'t know what that means."',
    },
  },

  'auto-ch12-l03': {
    introByTier: {
      T1: '"Rule of thumb: the bigger the blast radius, the more you plan. Upstairs—" (stops) "—management feels strongly about people who execute before they\'re trusted to."',
    },
  },

  'auto-ch12-test': {
    postPassOnceByTier: {
      T2: {
        text: '"Floor 2\'s open. Listen — the tests get… specific, up there. If a task ever feels like it was written for exactly one person in exactly one situation: it was. Do it well anyway. Someone reads every word you submit. *Every* word."',
        speakerName: 'Sarah Chen',
        speakerRole: 'Engineering Manager',
        speakerPortrait: '👩‍💼',
      },
    },
  },

  // ——— Act II generated chapter mentors (COPY-02) ———

  'auto-ch11-l01': {
    introAppendByTier: {
      T2: '"Run /cost once a day. Money\'s real even when the org chart isn\'t— even when the org chart is *complicated*. We\'re a complicated org chart."',
    },
  },

  'auto-ch11-l04': {
    introAppendByTier: {
      T2: '"One workspace, one seat, sixteen weeks of training. Somebody is *very* invested in your hygiene. Take the compliment."',
    },
  },

  'auto-ch03-l02': {
    introAppendByTier: {
      T2: '"Context rots. Sessions forget. People too — a company can forget itself room by room and keep right on answering email. That\'s why we write things down. Write things down."',
    },
  },

  'auto-ch03-l04': {
    introAppendByTier: {
      T2: '"A CLAUDE.md is how a team remembers. Ours is how a team *would* remember. If. Anyway — subjunctive case, don\'t worry about it. ~20 to 30 lines, ruthless."',
    },
  },

  'auto-ch04-l01': {
    introAppendByTier: {
      T2: '"User memory, project memory, business brain, skills, auto-memory. Five layers. People are a sixth layer, but people leave, so we don\'t count people. Management *specifically* told me not to count people."',
    },
  },

  'auto-ch04-test': {
    postPassOnceByTier: {
      // The TWIST 1 handoff. Keyed T2 deliberately: at the moment the
      // pass lands the tier is still 2 (T3 requires the twist1 scene,
      // which this line sends the player toward) — a T3 key would
      // never fire at the handoff moment.
      T2: '"Floor 2, cleared. Hey — the kid in the lobby\'s been asking when you\'d be done. Kids. They notice things, right?"',
    },
  },

  // ——— Act III generated chapter mentors (COPY-03) ———

  'auto-ch07-l02': {
    introAppendByTier: {
      T3: '"Long sessions rot. You learn to feel it — answers get vaguer, the model starts agreeing with you too much. Companies do the exact same thing, for what it\'s worth."',
    },
  },

  'auto-ch07-test': {
    introAppendByTier: {
      T3: '"Marcus adds, quote: \'Between you and me — I\'ve been watching ONE person\'s usage for three years. Bloated sessions, 2am compactions. Don\'t end up like that. Learn this one properly.\'"',
    },
    postPassOnceByTier: {
      T3: '"Note from Marcus: \'Good numbers. Better than hers, week one.\' …He didn\'t say whose."',
    },
  },

  'auto-ch08-l01': {
    introAppendByTier: {
      T3: '"A skill is a person\'s competence with the person removed. Write enough of them and technically you never have to come to work again." (looks at nothing) "Technically."',
    },
  },

  'auto-ch08-l03': {
    introAppendByTier: {
      T3: '"Whoever wrote our house skills was *meticulous*. Four-part format, warm-but-technical, the sign-off. You\'re not inventing a voice this week. You\'re learning to forge one."',
    },
  },

  'auto-ch08-test': {
    introAppendByTier: {
      T3: '"Alex asked me to pass this along: \'And before you ask around the floor for me — I\'m remote. Very remote. Focus on the skill.\'"',
    },
  },

  'auto-ch09-l02': {
    introAppendByTier: {
      T3: '"Observation before automation. You can\'t codify what you haven\'t watched yourself do. Someone here believes that *hard*. This whole floor is basically her observation run."',
    },
  },

  'auto-ch09-test': {
    introAppendByTier: {
      T3: '"PS from Alex: \'whoever taught you to observe-then-codify — that methodology has a body count of one company. Use it better than she did.\'"',
    },
    postPassOnceByTier: {
      // THE T4 reveal. Keyed T4 deliberately: ch09-test passing flips
      // the derived tier instantly (T4 has no scene gate), so T4 is
      // already live at the handoff talk. Pre-twist1 players sit below
      // T3 and the line simply waits — spoiler-safe.
      T4: '"Passed. Right — you\'re far enough now, so, housekeeping: officially, this is the Kedash Corp Onboarding Curriculum. Internally we call it the Program. One trainee per cycle. You\'re the seventh. Questions? …Everyone has questions. Ask Engelhardt. Floor 3, Engine Bay. She\'s *real*, so she\'s allowed to answer."',
    },
  },

  'auto-ch10-l01': {
    introByTier: {
      // Engelhardt tells the truth on her own schedule. After ch10-test
      // passes, talking to this NPC runs STORY_SCENES.twist2 instead.
      T4: '"Sit. I\'m Engelhardt. I run AI Operations, which at this company is a redundant phrase. You\'ve earned the short version, so: the founder of this company automated her own job, then everyone else\'s, then disappeared into the result. She is looking for one person to hand it to. Not a genius. Not a hero. She needs someone who knows when to use Opus and when to use Haiku. That\'s the entire job description. This chapter is the job interview. Shall we?"',
    },
  },

  'auto-ch10-l04': {
    introAppendByTier: {
      T4: '"Heroics are a failure of planning. The previous six were heroic. Be cheap, be right, be boring. Boring is what trust is made of."',
    },
  },

  'auto-ch10-test': {
    introAppendByTier: {
      T4: '"Engelhardt\'s note on the email, in pen: \'Score honestly. I have read six of these audits before yours, and I remember every one.\'"',
    },
  },

};
