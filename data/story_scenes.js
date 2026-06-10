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

};
