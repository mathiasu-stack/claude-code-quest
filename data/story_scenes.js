// story_scenes.js — Kedash Protocol scripted scene data (SYS-03 data).
//
// Consumed by play/story/sceneRunner.js. Beats play in order inside the
// standard dialogue card; `choices` are the player's bracketed responses
// from the scenario script (clicking any choice advances), `action`
// names a staging handler registered in play.js (registerSceneActions).
//
// TWIST 1 copy is verbatim from design/story/kedash_protocol_scenario.md
// §4.1 — "Six Conversations". TWIST 2 is verbatim from §4.2 — "The
// Customer Ledger" (the ledger itself opens in the document viewer via
// the 'twist2_ledger' action; its text lives in story_docs.js).
// The finale chain (marcusDoor / mayaScene / epilogueArrival /
// finaleCeremony) is verbatim from §5.1–§5.5.

window.STORY_SCENES = {

  twist1: {
    id: 'twist1',
    promptLabel: 'Talk — Ines has been counting',
    speaker: { name: 'Ines', role: 'Visitor, age 9', portrait: '👧' },
    endLabel: '…okay.',
    beats: [
      {
        text: '"You\'re back! You finished the second floor, right? You have the walk now. The \'I have badge access\' walk."',
        choices: ['So… your dad\'s meeting still isn\'t done?'],
      },
      {
        text: '"…Can I show you a game I made up? It\'s called *Conversation Bingo.* It\'s really easy. You\'ll get it fast." (She points. The man with the blue folder approaches the water-cooler pair.)',
        action: 'twist1_point',
      },
      {
        text: '"Okay: blue-folder guy is going to say \'Busy week. They say the new cohort starts soon.\' Then the tall one goes \'Did you see the Q3 numbers?\' and the other one does the laugh. Watch. Waaaatch."',
        action: 'twist1_exchange',
      },
      {
        text: '(Beat. The NPCs deliver the lines, verbatim. The laugh lands on cue.) "Bingo."',
        choices: ['How did you know that?'],
      },
      {
        text: '"Because there are only six. Six conversations. I wrote them down ages ago —" (she produces a folded paper, crayon title: \'THE 6 CONVERSACIONS\') "— and they go in a loop, like the fish tank cleaner. Blue-folder guy does the loop nine times before lunch. On Fridays he does it ten times. I think Fridays he\'s paid more."',
        choices: ['Paid? They\'re… actors?'],
      },
      {
        text: '"I mean, they\'re nice! Tania — the laugh one — she brings me stickers. But she\'s not an *accountant*. One time I asked her what accounting IS and she said \'it\'s basically vibes, sweetie.\'" (beat) "The people who teach you stuff are mostly real, I think. And IT Marcus is real, he fixed my Switch. But the walking-around people? They\'re the fish tank. They make the office look like an office."',
        choices: ['Why would anyone do that?'],
      },
      {
        text: '(suddenly quieter, looking up at the CEO portrait) "For you, dummy. It\'s all for whoever\'s doing the training. There\'s always exactly one of you, did you notice? One trainee, a zillion clappers." (brightens, deliberately) "Anyway you can\'t tell anyone I told you, because officially I am a child and I notice *nothing.*"',
        choices: ['What about your dad? The big meeting?'],
      },
      {
        text: '(the only line she delivers flat) "The big meeting isn\'t done yet." (beat; she spins the chair) "The chairs still spin really fast though. Some things here are real. You kind of have to collect them."',
      },
    ],
  },

  twist2: {
    id: 'twist2',
    promptLabel: 'Talk — Engelhardt has your file',
    speaker: { name: 'Dr. Priya Engelhardt', role: 'AI Operations', portrait: '👩‍🔬' },
    endLabel: '…make them proud.',
    beats: [
      {
        text: '"Your audit passed. Haiku for the tickets, Sonnet—" (waves a hand) "—you know what you did, that\'s the point. You\'re cleared for Floor 4. Before you go up, one piece of intellectual hygiene. You keep a business brain. Week seven. Elena\'s chapter. Client profiles — the flagship accounts. Name them for me."',
        choices: ['Northcliff Systems… Veldt & Harrow… Brightline Manufacturing…'],
      },
      {
        // Opens kedash-support/business-brain/client-profiles.md in the
        // document viewer (SYS-05) — the player's own Chapter 7
        // artifact, now annotated in a second handwriting.
        text: '"Mm. Open the file."',
        action: 'twist2_ledger',
      },
      {
        text: '"Dana Okonkwo. Tomás Reyes. Yuki Ashida. Cole Andrade. June-ho Baek. Margo Fell." (she lets each one sit) "Not customers. Candidates. Cycles one through six. When a cycle ends, the candidate becomes a customer profile — pain points and all — and the next candidate practices on them without knowing it. You\'ve been writing support replies to your predecessors since week three. Ticket CX-12? Dana filed that wording herself, on her way out. She thought the next person deserved one true thing in the pile."',
        choices: ['That\'s monstrous.', 'That\'s… actually good curriculum design.'],
      },
      {
        text: '"It\'s both. Most load-bearing things are. Here is what I want you to take upstairs: six capable people failed this program, and the program *kept their failures and threw away their names* — until you wrote the names back in, by hand, as homework. She doesn\'t keep them out of cruelty. She keeps them because she cannot let herself forget what each one cost." (beat) "Elena calls every candidate Dana at least once. She thinks I haven\'t noticed. I notice everything; it\'s my whole personality."',
        choices: ['Who is \'she\'?'],
      },
      {
        text: '"The person whose seat you\'ve been billing tokens to since week five. The person reading every word you submit. The person in the painting, obviously — honestly, the painting is not subtle." (she turns back to the consoles) "Floor 4 examines trust. Floors one through three examined competence. Different muscle. The girl in the lobby — on your way up, ask yourself who clears a nine-year-old into a secure building, every day, for three years. Dismissed, Cycle 07. Make the predecessors proud. They\'re in your files; they\'ll know."',
      },
    ],
  },

  // ─── FINALE (§5) ────────────────────────────────────────────────────────

  marcusDoor: {
    id: 'marcusDoor',
    promptLabel: 'Talk — Marcus has been waiting',
    speaker: { name: 'Marcus Webb', role: 'IT Setup Lead', portrait: '👨‍🔧' },
    endLabel: '…go meet the real one.',
    beats: [
      {
        text: '"Smoke test\'s green. I watched it come up from the rack side — three years I\'ve dusted that box, and tonight it has *two* users on it." (he hands over nothing; he just looks at the badge on the player\'s chest) "That badge was printed before you said yes. Linda hates that story. But here\'s the part nobody tells: the printer needs the permission tier *at print time.* Yours was printed at tier seven. She decided before you walked in — the rest of this was her trying to find a reason to be wrong."',
        choices: ['Why are you telling me this?'],
      },
      {
        text: '"Because six times I\'ve ridden that elevator down with somebody who almost made it, and I\'m superstitious now. Go to the elevator. Below the \'1\' there\'s a blank slot — there\'s always been a blank slot, you\'ve stood next to it for sixteen weeks. It\'s lit now. Press it. And hey—" (the only time Marcus hesitates in the whole game) "—she\'s not what the building makes her look like. The building is what she\'s *afraid* she is. Go meet the real one."',
      },
    ],
  },

  mayaScene: {
    id: 'mayaScene',
    promptLabel: 'Talk — she rehearsed this',
    speaker: { name: 'Maya Kedash', role: 'CEO', portrait: '👩‍💼' },
    endLabel: 'Then let\'s go downstairs.',
    beats: [
      {
        text: '"Don\'t say \'you\'re real.\' Everyone leads with \'you\'re real\' and I never have a good answer." (she gestures at the monitor wall) "Maya Kedash. You know that. I know you. That\'s been the asymmetry and I\'m sorry for it — sit down, Cycle 07. You\'ve earned the chair and I\'ve rehearsed this six times, so one of us will be fine."',
        choices: ['You\'ve been watching the whole time.'],
      },
      {
        text: '"Every submission. Every diff. Every time you ran /cost without being told." (beat) "I built this company on one trick: write it down well enough and you never need to be in the room. It worked. It worked so well that one day I looked up and I was the only one left in *any* room. Customers happy. Dashboards green. And every single thread of it terminating in me. I am the single point of failure of my own life. So — the training program. You want to know what it really is."',
        choices: ['It\'s a succession plan.', 'It\'s a trust checklist.'],
      },
      {
        text: '"It\'s my trust checklist. Sixteen weeks, in the exact order I learned it the hard way." (she counts on her fingers, and this is the curriculum, retroactively recast) "Can you write context down — CLAUDE.md, the brain, the memory layers — so the company lives outside one skull. Can you stay lean when no one\'s metering you. Can you turn your own competence into skills someone else could run. Can you tell Opus-work from Haiku-work, because that\'s just *judgment* wearing a price tag. Can you delegate — really delegate, dispatch and trust the summaries. And the last one, the one I failed: can you write your own allow, ask, deny — and then *honor it.* Rena says yours would have stopped Cycle 04. Rena does not say things like that."',
        choices: ['Why the actors? Why the whole staged office?'],
      },
      {
        text: '"Because the skills only matter under one condition: believing you\'re part of something. I couldn\'t offer a real team — I\'d automated it away. So I rented the *feeling* of one and hoped it taught the same lessons. That was the wrongest thing I did, and I knew it, and Linda has a drawer of letters that prove I knew it." (quiet) "There is exactly one person in that building who never read a script. She\'s nine. She tells everyone her father works on the third floor, because I asked her to lie about which parent." (she lets it land) "The big meeting is done, by the way. I\'m going downstairs after this. She doesn\'t know yet, so look surprised."',
        choices: ['The job. Say it plainly.'],
      },
      {
        text: '"VP of AI. The second chair. Not my replacement — my *peer review.* You hold the keys I held alone: the NAS you just deployed to is this rack; your capstone session is still open on it, two terminals down from mine. You get the permissions, the hooks, the 2am pages, and the authority to tell me no. Especially the authority to tell me no." (she stands, offers her hand) "Sixteen chapters ago I asked you to prove you could say hi to Claude. Prove you can do this: say yes to a person."',
        choices: ['Yes.'],
      },
      {
        text: '"Then let\'s go downstairs. They\'ve been clapping on cue for three years — let\'s give them one that counts."',
      },
    ],
  },

  // The §5.5 closing exchange. Triggered by walking up to the NEW
  // ARRIVAL at the lobby doors post-finale; ends in the title card.
  epilogueArrival: {
    id: 'epilogueArrival',
    promptLabel: 'Someone looks lost — press E',
    speaker: { name: 'New Arrival', role: 'Visitor', portrait: '🧑‍💼' },
    endLabel: '…',
    beats: [
      {
        text: '"Sorry — is this the Kedash Corp orientation? I\'m supposed to—"',
      },
      {
        speaker: { name: 'Ines', role: 'Visitor, age 9', portrait: '👧' },
        text: '(not looking up from her chair, grinning at the player) "Are you a real engineer?"',
      },
    ],
  },

};

// ─── Finale ceremony scripted moments (§5.4) ─────────────────────────────────
// Consumed by CeremonyManager.startFinale() via play.js. Each entry pops a
// speech bubble over the named NPC on a timeline during the crowd sequence.
// `inesLine` lands after the portrait hearts appear.
window.STORY_FINALE = {
  lines: [
    { npc: 'linda',  text: 'I printed this badge six weeks before I met you and I have felt INSANE about it every day since. Welcome, officially. Officially-officially.' },
    { npc: 'sarah',  text: 'For what it\'s worth: I\'d have just told you. Welcome anyway. …I\'m allowed to mention it now. I\'m going to mention it constantly.' },
    { npc: 'elena',  text: 'Well done, Dana. …Joke. My only one. Don\'t tell Engelhardt I know she noticed.' },
    { npc: 'rena',   text: 'Your permission tier is now my problem forever. Toast to that.' },
    { npc: 'marcus', text: 'Two users on the box.' },
    { npc: 'maya',   text: 'Two users on the box.' },
  ],
  inesLine: { npc: 'ines', text: 'She does that with the painting when she\'s happy. It used to be just for me.' },
};
