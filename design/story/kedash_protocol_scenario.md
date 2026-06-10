# THE KEDASH PROTOCOL — Full Scenario Document

**Project:** Claude Code Quest — narrative layer
**Status:** Greenlit pitch → master scenario reference (v1.0)
**Owner:** Narrative design
**Scope rule:** This document changes COPY and adds STAGED MOMENTS only. Every lesson, every
practical-test criterion, every XP value, every unlock gate stays mechanically identical.
The conspiracy is a coat of paint over a training program that genuinely works — because in
fiction, the conspiracy NEEDS the training to work.

---

## 0. GROUND TRUTH — how this doc maps to the real game

The dashboard shows 16 chapters in **play order**, which differs from internal chapter IDs.
All "Chapter N" references below are PLAY ORDER. Implementation IDs are always given.

| Play # | Curriculum ID | Title | Test sender (mentor of record) | Floor |
|---|---|---|---|---|
| 1 | `ch01` | Onboarding | Maya Kedash (CEO, Slack) / 3D assessor: Sarah Chen | 1 |
| 2 | `ch05` | Effective Prompting | Jordan Kim (Head of Customer Support) | 1 |
| 3 | `ch06` | Working with Files | Sam Okafor (Knowledge Base Manager) | 1 |
| 4 | `ch12` | Plan Mode | Jordan Kim | 1 |
| 5 | `ch11` | Slash Commands & Workflow | Priya Patel (Support Ops Lead) | 2 |
| 6 | `ch03` | CLAUDE.md & Context Management | Priya Patel | 2 |
| 7 | `ch02` | Business Brain | Dr. Elena Vasquez (Chief Strategist) | 2 |
| 8 | `ch04` | The Memory Framework | Sam Okafor | 2 |
| 9 | `ch07` | Token Efficiency & Sessions | Marcus Webb (IT Setup Lead) | 3 |
| 10 | `ch08` | Skills: Foundations | Alex Rivera (Senior Support Agent) | 3 |
| 11 | `ch09` | Skills: Methodology | Alex Rivera | 3 |
| 12 | `ch10` | Choosing Your Model | Dr. Priya Engelhardt (Head of AI Operations) | 3 |
| 13 | `ch13` | MCP Servers & Integrations | Marcus Webb | 4 |
| 14 | `ch14` | Subagents & Delegation | Sam Okoye (Engineering Team Lead) | 4 |
| 15 | `ch15` | Settings, Permissions & Hooks | Rena Vasquez (Platform Engineer, InfoSec) | 4 |
| 16 | `ch16` | Claude Code on NAS | Marcus Webb (Jira KEDASH-CX-99) | 4 |

Hand-built 3D NPCs (Chapter 1 floor): Linda Park, Marcus Webb, Aisha Mehta, Kenji Tanaka,
Diana Foley, Sarah Chen (assessor), Ines (flavor). Chapter 7 / `ch02` Knowledge Library:
Dr. Elena Vasquez, Raj Patel, Mei Chen, Noor Ali (assessor). All other mentors are
generated NPCs, three of which already carry named-persona overrides in
`data/npc_overrides.js` (`auto-ch10-l01` → Dr. Priya Engelhardt, `auto-ch14-l01` →
Sam Okoye, `auto-ch15-l01` → Rena Vasquez).

Act structure = the four floors:
- **ACT I — "ORIENTATION"** (Floor 1, Chapters 1–4)
- **ACT II — "ACCESS"** (Floor 2, Chapters 5–8) → ends in **TWIST 1** (Ines)
- **ACT III — "THE PROGRAM"** (Floor 3, Chapters 9–12) → ends in **TWIST 2** (predecessor files)
- **ACT IV — "THE OPERATOR"** (Floor 4, Chapters 13–16) → ends in **THE FINALE** (Maya)

---

## 1. STORY BIBLE

### 1.1 Premise

Kedash Corp looks like a thriving mid-size B2B SaaS company. It is not. Three years ago,
founder-CEO **Maya Kedash** finished automating her own company so completely — context
files, skills, hooks, scheduled agents, a NAS humming in a room nobody enters — that the
org chart collapsed into a single node: her. Revenue kept flowing. Customers kept getting
answers. And Maya became the single point of failure for everything she had built.

She cannot hire normally; a normal hire would need years to absorb what lives in her head
and her config files. So she built **The Kedash Protocol**: a sixteen-chapter training
gauntlet, staffed by a handful of loyal real employees and a cast of paid actors, that
takes one candidate per cycle and teaches them — sincerely, rigorously, with no tricks in
the material itself — everything an operator-successor must know. Context. Memory.
Token discipline. Skills. Model economics. Delegation. Permissions. Guardrails.

The curriculum is not a metaphor for the conspiracy. The curriculum IS the conspiracy.
Every lesson is one line of Maya's trust checklist.

Six candidates came before the player. None made it past Floor 4. The player is Cycle 07.

### 1.2 Logline

> The training program is real — but it isn't training you for the job you were hired
> for, and the CEO hasn't been seen in person for three years.

### 1.3 Themes

1. **Delegation is an act of trust, and trust is a skill.** Maya automated everything and
   delegated nothing. The whole game is her learning to hand over the keys — one
   permission rule at a time.
2. **Documentation as inheritance.** CLAUDE.md, business brains, skills, learnings.md —
   the player is literally being taught to read a vanished person's mind from her files.
3. **The corporate uncanny.** An office that performs being an office. Ceremonies that
   clap on cue. A child in the lobby who is the only honest thing in the building.
4. **Competence as kindness.** The story's emotional payoff is not "you exposed the
   conspiracy" — it's "you became someone she could finally trust."

### 1.4 Tone rules (dark vs. playful)

The reference points are *Severance* and *Control*: dry, deadpan, fluorescent-lit unease —
but Claude Code Quest is at heart a warm, funny training game, and the story must never
fight that. Concretely:

- **DO**: small wrongnesses, polite menace, corporate euphemism ("the previous cohort
  transitioned out"), jokes that are also clues, sincerity at the core.
- **DO**: let every dark beat resolve toward warmth. The conspiracy's secret is not malice;
  it's an exhausted founder's hope.
- **DON'T**: horror imagery, threats of harm, implied violence to predecessors. The six
  previous candidates *failed and were paid out*; nobody got hurt. The scariest thing in
  this story is an empty office and an unread inbox.
- **DON'T**: make Ines creepy. She is the comic relief AND the moral compass. Her scenes
  are funny first, revelatory second.
- **DON'T**: cynicism about the player. Every named NPC, even the gatekeepers, wants the
  player to succeed. The tension is "will you be trusted," never "are you being used up."

### 1.5 The Educational Integrity Rule (non-negotiable)

**The conspiracy wants the player well-trained, so the lessons are always sincere.**

- No scripted line may cast doubt on the accuracy of the Claude Code material. Mentors
  never lie about the curriculum. Anomalies live AROUND the lessons (names, dates,
  staffing, props), never INSIDE the technical content.
- Test criteria, pass thresholds, and lesson bodies are untouched. Story additions to
  test scenarios are appended framing sentences only (specified per chapter in §3) and
  must not introduce words that could confuse keyword evaluation of the SUBMISSION
  (evaluation reads the player's reply, not the scenario, so this is safe — but keep
  additions short anyway).
- If a story beat and a lesson ever conflict, the lesson wins and the beat is rewritten.

### 1.6 Spoiler-safety ladder (what the player may learn when)

Every line of dialogue, ambient bark, plaque text, and collectible is assigned a tier.
A line may only surface when the player's progress flag meets its tier. Ambient lines
must additionally be **reread-safe**: innocuous on first hearing at their tier, richer —
never contradictory — when reheard after later reveals.

| Tier | Unlock condition (progress flag) | Player may now learn… |
|---|---|---|
| T0 | always | The office is slightly odd. The CEO is "very busy." Nothing is confirmed. |
| T1 | `ch01-test` passed | There was a "last one." Mentors are aware of cycles. Don't mention it. |
| T2 | Floor 1 cleared (`ch12-test` passed) | The tests are watched by someone above the mentors. Marcus drops side-channel hints. |
| T3 | Floor 2 cleared (`ch04-test` passed) → **TWIST 1** | The background staff are staged actors on a six-line loop. Kedash has almost no real employees. |
| T4 | `ch09-test` passed | The training is "The Program." There is exactly one candidate per cycle. |
| T5 | `ch10-test` passed → **TWIST 2** | The vanished CEO is selecting an operator-successor. The predecessors' names are in the player's own project files. |
| T6 | `ch15-test` passed | Maya is alive, on-site, and has been watching through the building itself. Floor 4 was always her infrastructure. |
| T7 | `ch16-test` passed → **FINALE** | Everything: Maya in person, Ines's identity, the curriculum as trust checklist, the VP of AI offer. |

Hard rules:
- Ines never states anything above the player's tier; she gestures at it. Her T3 reveal is
  the loop, NOT her identity (that is T7).
- The words "Maya is alive" or "successor" never appear before T4; "daughter" never before T7.
- The promotion-ceremony actors stay in character until T7. The finale ceremony is the
  first and only time they drop the mask.

---

## 2. MAIN CAST

Format: **true role · want · secret · arc · existing function preserved how**.

### Maya Kedash — CEO (portrait on the reception wall; in person only in the finale)
- **True role:** Founder who automated herself into a corner; architect of The Protocol.
- **Want:** To hand the company to someone she can trust with `--dangerously-skip-permissions`
  levels of access — and to stop being the only person who knows where everything is.
- **Secret:** She has watched every cycle through the building's cameras and the portrait
  wall feed. She wrote every test scenario herself, including the ones "from" other people.
  (Canon detail already in the game: the Chapter 1 test Slack is literally from
  "Maya Kedash, CEO." Nobody in-fiction finds this strange. That's the first clue.)
- **Arc:** Absent voice → suspected ghost → revealed watcher → exhausted human being who
  asks for help. Her finale scene reframes the entire curriculum as her trust checklist.
- **Preserved function:** The `ch01-test` Slack sender; the CEO portrait (built by
  `buildCeoPortrait`, plaque "Maya Kedash — CEO"); the completion hearts easter egg —
  retroactively recontextualized as relief and welcome, not romance (§6.3).

### Ines — "Visitor, age 9" (lobby, Floor 1)
- **True role:** Maya's daughter. The one person in the building under no script, planted
  (and self-appointed) as the honest observer. Her cover story — "my dad works on the
  third floor, he said I have to wait until his big meeting is done" — was written by Maya;
  the joke Ines tells herself is that the big meeting has lasted three years.
- **Want:** For her mother to come downstairs. Failing that, for ONE grown-up in this
  building to notice what she noticed years ago.
- **Secret:** She has counted everything. Six conversations on a loop. Six candidates
  before this one. She greets every arrival with "Are you a real engineer?" because real
  people answer it differently than actors do.
- **Arc:** Flavor NPC → first truth-teller (TWIST 1) → quiet ally → revealed family in the
  finale → delivers the closing line of the game to the next arrival.
- **Preserved function:** Same lobby spawn, same `kind: 'flavor'`, same opening intro line
  verbatim at T0. Her dialogue gains act-gated states (§3, §4.1, §5).

### Marcus Webb — IT Setup Lead (Floor 1 hand-built NPC; sender of three tests)
- **True role:** The inside man. One of perhaja five real employees. Maintains the actual
  infrastructure — including Maya's NAS — and has decided, without authorization, that
  Cycle 07 deserves a fighting chance.
- **Want:** For a cycle to finally succeed so he can stop being the only sysadmin of a
  haunted company.
- **Secret:** He keeps fragments of Maya's own `learnings.md` and leaks them to the player.
  He also quietly fixed what broke Cycles 03 and 04 (token burn, permissions disaster).
- **Arc:** Friendly IT guy → side-channel hinter (Act II–III) → open co-conspirator (Act IV)
  → the one who tells the player about the elevator button that "isn't on the panel."
- **Preserved function:** Teaches `ch01-l02` in 3D; sends `ch07-test`, `ch13-test`,
  `ch16-test` exactly as written, plus appended framing lines (§3).

### Linda Park — HR Director (Floor 1, first NPC the player meets)
- **True role:** Loyalist gatekeeper, torn by conscience. She runs candidate logistics:
  badges, paperwork, cover stories, actor scheduling. She printed the player's badge
  before they accepted the offer because Maya's model said they would accept.
- **Want:** To protect Maya — and increasingly, to protect the candidates from the
  loneliness of the process. She remembers all six predecessors by name.
- **Secret:** She has a drawer of six unmailed "we regret to inform you" letters she was
  never asked to send, because Maya could never decide what the kind version would say.
- **Arc:** Warm-but-scripted HR welcome → small cracks ("I'm told I'm very good at
  seeming") → quiet confessor in Act IV → openly weeping at the finale ceremony.
- **Preserved function:** Teaches `ch01-l01` verbatim; her conspiracy beats are ADDED
  lines after the lesson content, gated by tier.

### Sarah Chen — Engineering Manager (Floor 1 assessor)
- **True role:** The recruiter. She scouted all seven cycles. Hers is the first crack in
  the wall: "You did better than the last one. Don't mention this."
- **Want:** Redemption. She picked Cycles 01–06 and watched each fail at a different
  chapter of the checklist. She picked the player too.
- **Secret:** She argued with Maya (over Slack; everyone argues with Maya over Slack)
  that the Protocol should be honest from day one. She lost. She complies. Mostly.
- **Arc:** Crisp assessor → guilty mentor → in the finale, the first to applaud — and the
  one who tells the player "For what it's worth: I'd have just told you. Welcome anyway."
- **Preserved function:** Runs `ch01-test` in 3D exactly as now; her T1 line is appended
  to her existing post-pass `nextHint` flow.

### Jordan Kim — Head of Customer Support (tests 2 & 4)
- **True role:** Real employee #2. Runs the "support team" that is, in truth, Maya's
  automation plus whichever candidate is in training. Her tickets are real customer
  traffic — Kedash does have customers; it just barely has staff.
- **Want:** A colleague. Any colleague. Her warmth in the test scenarios is not acting.
- **Secret:** Half the "most-asked questions" she assigns are questions Maya asked her to
  assign — they are the exact replies Maya needs refreshed in production.
- **Arc:** Cheerful taskmaster → the person who makes the fiction feel like a real job →
  Act IV: admits the team channel has had two members for three years.
- **Preserved function:** `ch05-test` and `ch12-test` senders, scenarios untouched.

### Dr. Elena Vasquez — Chief Strategist (Knowledge Library, Chapter 7)
- **True role:** Actor — the best one in the building, a retired strategy consultant who
  took the gig for the library. She believes in the material she teaches (it's real), but
  her biography is wardrobe. "Doctor, technically" is a line she insisted on keeping
  because it's technically true: she has a doctorate. In musicology.
- **Want:** To teach one student who comes back after the program ends.
- **Secret:** She has taught the Business Brain chapter seven times and once, in Cycle 04,
  slipped and called the candidate by the previous candidate's name. It's now in her
  performance: she does it on purpose, as a private flare to anyone paying attention.
- **Arc:** Grand-dame mentor → the "glitch" (calls the player **"Dana—"**, then corrects) →
  post-T3, openly fond: "You noticed. Good. Noticing is the whole curriculum, kid."
- **Preserved function:** All four library NPCs (Elena, Raj, Mei, Noor) keep their lessons
  and the `ch02-test` flow; the glitch is one added line in her intro at T2+.

### Dr. Priya Engelhardt — Head of AI Operations (Floor 3, `auto-ch10-l01` override)
- **True role:** Real employee #3, and the Protocol's chief examiner. The first person
  authorized to tell the player the truth — and she does it on her own schedule, in her
  own way: through model economics.
- **Want:** A successor who is *boring* about cost. "Heroics are a failure of planning."
- **Secret:** She designed the cycle-failure taxonomy (the six Cycle Reports, §6.2). Each
  predecessor's failure is now a unit in the curriculum. The course is literally made of
  other people's mistakes.
- **Arc:** Severe examiner → truth-teller (T4: *"She needs someone who knows when to use
  Opus and when to use Haiku."*) → hands the player the thread that unravels TWIST 2.
- **Preserved function:** Mentor persona for `ch10` lessons; `ch10-test` sender, untouched.

### Sam Okoye — Engineering Team Lead (Floor 4, `auto-ch14-l01` override)
- **True role:** Real employee #4. Runs the dispatch board — which, before the company
  hollowed out, ran a 40-person engineering org. He kept the board. It's mostly empty.
- **Want:** To see the TODO column full again.
- **Secret:** "If you spawn parallel subagents that secretly depend on each other, I will
  know" — he knows because hidden dependencies are exactly how Kedash Corp failed: every
  team secretly depended on Maya.
- **Arc:** Wry foreman → delivers the story's thesis in `ch14`: delegation is the thing
  Maya never learned, and the thing the player must demonstrate.
- **Preserved function:** `ch14` mentor + test sender, untouched.

### Rena Vasquez — Platform Engineer, InfoSec (Floor 4, `auto-ch15-l01` override)
- **True role:** Real employee #5. The final gatekeeper. (No relation to Elena — a fact
  she is extremely tired of clarifying, and a running gag: the building's casting director
  had a surname budget.) Her chapter is the trial of trust: allow / ask / deny, made flesh.
- **Want:** To never again watch a candidate fail the way Cycle 04 failed (ran a destructive
  command in bypass mode on a staging clone; the post-mortem is Cycle Report 04).
- **Secret:** She holds the only other key to Floor M. She has never used it. "If she
  wanted visitors, she'd change the permissions."
- **Arc:** Cold auditor → the examiner whose passing grade IS the plot point: when the
  player's `ch15-test` passes, Rena — not Marcus — flags the player as "trusted" in the
  building's own settings file. That's what unlocks the finale chain.
- **Preserved function:** `ch15` mentor + test sender, untouched.

### Supporting cast (function preserved, light story duties)

| NPC | Reality | Story duty |
|---|---|---|
| Aisha Mehta (ch01-l03) | Actor | Friendly; one T2 line about "the last person who sat here." |
| Kenji Tanaka (ch01-l04) | Actor | Floor 1 micro-glitch: "You walk like the last— like a natural." |
| Diana Foley (ch01-l05) | Actor | Her "this training has a shelf life" lesson doubles as cycle foreshadowing — zero text changes needed; it's already perfect. |
| Raj Patel / Mei Chen / Noor Ali (ch02) | Actors | Library color; Noor gets one T3 line. |
| Priya Patel (ch11/ch03 tests) | Email-only persona | Her emails are written by Maya (clue: identical sign-off idiom to Maya's ch01 Slack). Never appears in 3D — that's the clue. |
| Sam Okafor (ch06/ch04 tests) | Email/Jira-only persona | Same: Maya-authored. His Jira tickets carry the predecessor reporter names (§6.2). |
| Alex Rivera (ch08/ch09 tests) | Slack-only persona | The most blatant ghost: "Senior Support Agent" on a support team of two. Marcus confirms at T4: "There is no Alex. There's a very good prompt named Alex." |
| Background/procedural NPCs | Paid actors | The six-line loop, per act (§6.1). |
| CEO wall portrait | Maya's eyes on the floor | Behavior notes §6.3. |

---

## 3. CHAPTER-BY-CHAPTER BEAT SHEET

Per chapter: **Surface beat** (the sincere training story) · **Conspiracy beat** (clue/anomaly,
with tier) · **Scripted lines** (paste-ready) · **Test framing addition** (append-only copy;
criteria untouched) · **Environment beat** (3D office).

> Implementation note: hand-built NPC lines go into their `intro`/`nextHint` flow as
> tier-gated additions. Generated-mentor lines require the dialogue-override channel
> (ASK-D1 in §7). Test framing additions are appended sentences in the `scenario` string —
> the evaluator only reads the player's submission, so they are mechanically inert.

---

### CHAPTER 1 — Onboarding (`ch01`, Floor 1)

**Surface beat.** Day one. Linda walks you through what Claude Code is; Marcus installs it;
Aisha runs your first session; Kenji tours the interface; Diana explains the shelf life;
Sarah Chen runs the practical. The CEO herself Slacks you your first task. Flattering!

**Conspiracy beat (T0→T1).** Wrong in small ways. Your badge already exists — laminated,
warm from the printer, dated last Tuesday. Linda greets you by name before you give it.
The CEO who "is just very busy" messages you personally within the hour. End of chapter:
Sarah's crack in the wall.

**Scripted lines.**
- Linda (added after her existing intro, T0):
  > "Your badge is ready — here. Oh, don't look so surprised. We print them when we're
  > *confident*." *(beat)* "HR joke. We're famous for them."
- Linda, if the player re-talks to her (T0):
  > "Did I know your name before you said it? I'm HR, sweetheart. Knowing names before
  > people say them is the entire job."
- Kenji (replaces nothing; added mid-intro flourish, T0):
  > "Yo. Kenji. You walk like the last— like a natural. Like a natural. Anyway: interface."
- Ines (existing intro UNCHANGED — it's already canon): *"Hi! I'm Ines. I'm 9. My dad works
  here on the third floor — he said I have to wait until his big meeting is done. The chairs
  spin really fast if you push hard! Are you a real engineer?"*
- Sarah Chen, after `ch01-test` passes (appended to her pass flow — THE T1 line, verbatim
  from the pitch):
  > "You did better than the last one." *(she straightens, badge catching the light)*
  > "Don't mention this. To anyone. Especially not to me."

**Test framing addition** (`ch01-test`, append to Maya's Slack):
> `P.S. — Linda has your badge. I know it's fast. We move fast when we're sure.`

**Environment beat.** Reception: the badge printer prop (ASK-A7) sits behind Linda's desk,
status screen reading `LAST JOB: 1 BADGE — 6 DAYS AGO`. The CEO portrait is lit slightly
warmer than the room (already true of the canvas painting; codify it).

---

### CHAPTER 2 — Effective Prompting (`ch05`, Floor 1)

**Surface beat.** Jordan Kim's first real task: specificity, context, iteration. The
cancellation-FAQ prompt exercise. The player starts feeling like part of a team.

**Conspiracy beat (T1).** Jordan's spec is *suspiciously tailored* — "warm-but-technical,
B2B SaaS" reads less like a style guide and more like a description of one specific
person's voice. Also: everyone references "the support team," and the player has yet to
see a single support agent at a desk.

**Scripted lines.**
- Generated lesson mentor, `ch05` lesson 1 (override line, T1):
  > "Specificity. The brief you got is a good example — 'warm-but-technical.' Very
  > specific. Almost like someone's describing a *person* they miss, ha. Anyway."
- `ch05` assessor NPC, pre-test (T1):
  > "Jordan's great, by the way. You'll never meet her — she's remote. Everyone here is
  > sort of remote, when you think about it. Don't think about it."

**Test framing addition** (`ch05-test`, append to Jordan's Slack):
> `(And yes, the voice spec is oddly precise. House style. You'll get used to whose house.)`

**Environment beat.** The Communications Hub zone (`ch05` theme) gets a wall of "team
photos" — every frame is the same stock-photo office at different crops (ASK-A8,
nice-to-have).

---

### CHAPTER 3 — Working with Files (`ch06`, Floor 1)

**Surface beat.** Sam Okafor's Jira `KEDASH-CX-12`: fix one wrong line in `faq.md`.
Targeted edits, diffs, review discipline, test-driven prompting.

**Conspiracy beat (T1).** The kedash-support ticket references a customer who doesn't
exist. The Jira reporter on CX-12 is **"D. Okonkwo — Northcliff Systems."** Northcliff
Systems has no website, no logo, no other tickets. (First predecessor seed — pays off in
TWIST 2. Dana Okonkwo was Cycle 01.) Also: CX-12, then later CX-19, then CX-99 — nobody
has ever seen the tickets in between.

**Scripted lines.**
- Generated lesson mentor, `ch06` lesson 4 ("Reviewing Changes"), T1:
  > "Always read the diff. Files lie about how they got that way. Take that FAQ — wrong
  > since before my time, and *nobody noticed?* In a support org? Files lie. Read the diff."
- `ch06` assessor, post-pass (T2 — first Marcus side-channel, delivered as a relayed note):
  > "Oh — Marcus from IT pinged me. Says, quote, 'tell the new one: good ticket hygiene.
  > Also tell them ticket numbers are load-bearing.' No, I don't know what that means."

**Test framing addition** (`ch06-test`, append to the Jira body):
> `Reporter: D. Okonkwo (Northcliff Systems) · First reported: 4 cycles ago`

**Environment beat.** File Workshop zone: one filing cabinet drawer is propped open and
empty except for a single folder labeled `CX-13 — CX-18` (ASK-A9, nice-to-have prop).

---

### CHAPTER 4 — Plan Mode (`ch12`, Floor 1 — ACT I FINALE)

**Surface beat.** Jordan's big reorganization of `kedash-support/` — and the discipline of
capturing a plan WITHOUT executing it. Shift+Tab, plan review, controlled execution.

**Conspiracy beat (T2 at pass).** The test is, transparently, a *restraint* test: show me
you can stop before executing. The first chapter where the player should feel watched by
someone above the mentors — because they are.

**Scripted lines.**
- Generated lesson mentor, `ch12` lesson 3 ("When to Use Plan Mode"), T1:
  > "Rule of thumb: the bigger the blast radius, the more you plan. Upstairs—" *(stops)*
  > "—management feels strongly about people who execute before they're trusted to."
- `ch12` assessor, post-pass (T2, scripted moment — Sarah Chen walks to the elevator with
  the player; see Environment beat):
  > SARAH: "Floor 2's open. Listen — the tests get… specific, up there. If a task ever
  > feels like it was written for exactly one person in exactly one situation: it was.
  > Do it well anyway. Someone reads every word you submit. *Every* word."

**Test framing addition** (`ch12-test`, append to Jordan's Slack):
> `One more thing: do NOT execute. I'm serious. The plan is the deliverable. Someone upstairs reads the plans.`

**Environment beat.** ACT I curtain: when the elevator opens for the first ride to
Floor 2, all background NPCs on Floor 1 stop mid-walk and face the elevator for 2 seconds,
then resume (ASK-A10, must-have — it's the act-break sting). Promotion ceremonies to date
have clapped in *perfect unison*; from T2 onward the unison is canonically noticeable
(no new code needed if claps are already synchronized — add one Ines line, §4.1 pre-beat).

---

### CHAPTER 5 — Slash Commands & Workflow (`ch11`, Floor 2)

**Surface beat.** Priya Patel's "quick win": `/init`, `/help`, `/cost` et al. Power-user
controls; session hygiene.

**Conspiracy beat (T2).** `/cost` exists because someone pays. Clue: the account the
player bills to is a *single seat*, not a team plan. Also — Priya Patel signs emails with
the same idiom Maya used in Chapter 1 ("First proof you can do this:" / "Quick win —").
Email-only personas share a ghostwriter.

**Scripted lines.**
- Generated lesson mentor, `ch11` lesson 1, T2:
  > "Run `/cost` once a day. Money's real even when the org chart isn't— even when the
  > org chart is *complicated*. We're a complicated org chart."
- Generated lesson mentor, `ch11` lesson 4 ("Session Hygiene"), T2:
  > "One workspace, one seat, sixteen weeks of training. Somebody is *very* invested in
  > your hygiene. Take the compliment."

**Test framing addition** (`ch11-test`, append to Priya's email):
> `Billing note: you're on the kedash-prime seat. Don't worry about what that means.`

**Environment beat.** Slash Command Center zone: a wall display cycles real-ish usage
dashboards where `ACTIVE SEATS: 1` is visible to anyone who walks close (ASK-A11,
nice-to-have).

---

### CHAPTER 6 — CLAUDE.md & Context Management (`ch03`, Floor 2)

**Surface beat.** "Teaching Claude Your Ways." Context windows, context rot, lean
CLAUDE.md craft, CLAUDE.md as a team document.

**Conspiracy beat (T2).** The conventions Priya dictates for the trimmed CLAUDE.md —
"never mention `internal-notes/` in customer text," "cancellations escalate to
#cx-escalations" — are house rules with the texture of one specific person's hard-won
scars. The player is not writing a team document. They are transcribing Maya's ways.

**Scripted lines.**
- Generated lesson mentor, `ch03` lesson 2 ("Context Rot"), T2:
  > "Context rots. Sessions forget. People too — a company can forget itself room by room
  > and keep right on answering email. That's why we write things down. Write things down."
- Generated lesson mentor, `ch03` lesson 4 ("Team Document"), T2:
  > "A CLAUDE.md is how a team remembers. Ours is how a team *would* remember. If. Anyway —
  > subjunctive case, don't worry about it. ~20 to 30 lines, ruthless."

**Test framing addition** (`ch03-test`, append to Priya's email):
> `These conventions aren't mine, by the way. They're inherited. Treat them as scripture.`

**Environment beat.** CLAUDE.md Atrium zone: a framed, yellowing printout titled
`HOUSE RULES — M.K., year 1` hangs by the door; walking close shows three rules that
match the test's conventions word-for-word (ASK-A12, must-have prop — it's the player's
first physical Maya artifact).

---

### CHAPTER 7 — Business Brain (`ch02`, Knowledge Library, Floor 2)

**Surface beat.** Elena, Raj, Mei, Noor. Centralized context; the business-brain folder;
brand voice, client profiles, glossary; prove it with a drafted reply.

**Conspiracy beat (T2).** THE mentor glitch (from the pitch): Elena calls the player a
different name, then corrects. The "mid-market eng leaders" client profiles Elena assigns
will become the predecessor ledger in TWIST 2 — the player is unknowingly building the
file that later exposes the cycles.

**Scripted lines.**
- Elena (added to her intro at T2 — the glitch):
  > "Welcome to the Knowledge Library, Dana— " *(a full beat; she doesn't blink)* "—kid.
  > Welcome to the Knowledge Library, kid. Elena. Doctor, technically."
- Elena, if re-talked after the glitch (T2):
  > "Did I call you something? I teach the same chapter to a lot of bright young people.
  > The names compost. The *material* keeps."
- Raj (added line, T2): > "Folder structure outlives staff structure. You'd be amazed what
  a company can lose and still have great folders."
- Noor, post-pass (T3-gated; only if TWIST 1 already seen):
  > "Between us: the library is the only room the actors don't bother performing in.
  > Nobody performs in a library. That's why I asked to work here."

**Test framing addition** (`ch02-test`, append to Elena's email):
> `For client-profiles.md, base your examples on our flagship accounts — Northcliff Systems, Veldt & Harrow, Brightline Manufacturing. Names matter. Spell them exactly.`

*(This plants Cycle 01–03's cover companies in the player's OWN business-brain file, in
their own handwriting. TWIST 2 detonates this. Criteria untouched — the test already
asks for client-profiles.md content.)*

**Environment beat.** Library books: every spine on the lower shelves is a real-ish title;
every book above reach is blank-spined (ASK-A13, nice-to-have). The grandfather clock is
stopped at 9:41 — the timestamp of Maya's last all-hands, per Cycle Report 01 (§6.2).

---

### CHAPTER 8 — The Memory Framework (`ch04`, Floor 2 — ACT II FINALE)

**Surface beat.** Sam Okafor's architecture review: the five memory layers; what belongs
where. The most "pure theory" test in the program.

**Conspiracy beat (T2→T3).** The test's item 5 — "the list of our 5 biggest customers and
their pain points" — is the cycle ledger wearing a trench coat. And the chapter's theme is
the skeleton key to the whole story: *a company is a memory system, and this one has been
running on a single human cache for three years.* Passing `ch04-test` completes Floor 2
and triggers **TWIST 1** (full script in §4.1) when the player next approaches Ines.

**Scripted lines.**
- Generated lesson mentor, `ch04` lesson 1 ("Five Memory Layers"), T2:
  > "User memory, project memory, business brain, skills, auto-memory. Five layers.
  > People are a sixth layer, but people leave, so we don't count people. Management
  > *specifically* told me not to count people."
- `ch04` assessor, post-pass (T3 trigger handoff):
  > "Floor 2, cleared. Hey — the kid in the lobby's been asking when you'd be done.
  > Kids. They notice things, right?"

**Test framing addition** (`ch04-test`, append to the Jira body):
> `Re item 5: the five biggest customers are the five in business-brain/client-profiles.md. They are extremely important to the CEO. Personally.`

**Environment beat.** TWIST 1 staging (§4.1). After the scene, Floor 1/2 ambient NPCs
switch to the Act III line set (§6.1) — the masks are still on, but the player can now
hear the seams.

---

### CHAPTER 9 — Token Efficiency & Sessions (`ch07`, Floor 3)

**Surface beat.** Marcus Webb watching usage: context budgets, `/clear`, `/compact`,
structuring long sessions. BEFORE/AFTER `/cost` numbers.

**Conspiracy beat (T3).** Marcus goes from hinter to handler. His Slack says he's
"watching the support team's Claude usage" — the player now knows there is no support
team. So whose usage has he been watching for three years?

**Scripted lines.**
- Generated lesson mentor, `ch07` lesson 2 ("/clear"), T3:
  > "Long sessions rot. You learn to feel it — answers get vaguer, the model starts
  > agreeing with you too much. Companies do the exact same thing, for what it's worth."
- Marcus side-channel (delivered by the `ch07` assessor post-pass, T3):
  > "Note from Marcus: 'Good numbers. Better than hers, week one.' …He didn't say whose."

**Test framing addition** (`ch07-test`, append to Marcus's Slack):
> `Between you and me: I've been watching ONE person's usage for three years. Bloated sessions, 2am compactions. Don't end up like that. Learn this one properly.`

**Environment beat.** Token Lounge zone: a wall counter labeled `TOKENS SINCE LAST HUMAN
CONVERSATION` ticks upward in real time; it resets to 0 when the player talks to any NPC
on the floor (ASK-A14, nice-to-have, very *Control*).

---

### CHAPTER 10 — Skills: Foundations (`ch08`, Floor 3)

**Surface beat.** Alex Rivera demands a skill: the 4-part `support-reply.md`. Progressive
disclosure, hook-based skills, first authored skill.

**Conspiracy beat (T3).** Alex Rivera is the most brazen ghost in the cast — a "Senior
Support Agent" the player will never see, on a floor of actors, in a company of five.
Thematic clue: a skill is *how you do things, written down so someone else can do them
without you.* The entire company is a stack of Maya's skills running unattended.

**Scripted lines.**
- Generated lesson mentor, `ch08` lesson 1, T3:
  > "A skill is a person's competence with the person removed. Write enough of them and
  > technically you never have to come to work again." *(looks at nothing)* "Technically."
- Generated lesson mentor, `ch08` lesson 3 ("First Skill"), T3:
  > "Whoever wrote our house skills was *meticulous*. Four-part format, warm-but-technical,
  > the sign-off. You're not inventing a voice this week. You're learning to forge one."

**Test framing addition** (`ch08-test`, append to Alex's Slack):
> `And before you ask around the floor for me — I'm remote. Very remote. Focus on the skill.`

**Environment beat.** Skill Forge zone: a corkboard of laminated "EMPLOYEE OF THE MONTH"
cards — every photo is the CEO portrait at decreasing sizes (ASK-A15, nice-to-have gag).

---

### CHAPTER 11 — Skills: Methodology (`ch09`, Floor 3)

**Surface beat.** Observe yourself first, then codify: the observation run, the skill from
observation, `learnings.md` closing the loop.

**Conspiracy beat (T3→T4 at pass).** The chapter teaches the player to watch themselves
work and write it down — which is precisely what the building has been doing to the player
since Chapter 1. At pass, T4 unlocks: the training has a name. **The Program.** One
candidate per cycle. Marcus leaks the first fragment of Maya's own `learnings.md`.

**Scripted lines.**
- Generated lesson mentor, `ch09` lesson 2 ("Documenting a Workflow Run"), T3:
  > "Observation before automation. You can't codify what you haven't watched yourself do.
  > Someone here believes that *hard*. This whole floor is basically her observation run."
- `ch09` assessor, post-pass (THE T4 reveal, deadpan):
  > "Passed. Right — you're far enough now, so, housekeeping: officially, this is the
  > Kedash Corp Onboarding Curriculum. Internally we call it the Program. One trainee per
  > cycle. You're the seventh. Questions? …Everyone has questions. Ask Engelhardt. Floor 3,
  > Engine Bay. She's *real*, so she's allowed to answer."
- Marcus's leak — a collectible note appears at the player's Floor 3 desk (ASK-A16,
  must-have prop; text is `learnings.md fragment 1`, §6.2):
  > `learnings.md — cycle 0 (me)`
  > `- What worked: everything, eventually.`
  > `- What I'd do differently: hire before I needed to. Trust before I had proof.`
  > `- Reusable: no. None of this should be reusable. That's the problem. — M.K.`

**Test framing addition** (`ch09-test`, append to Alex's Slack):
> `PS: whoever taught you to observe-then-codify — that methodology has a body count of one company. Use it better than she did.`

**Environment beat.** Methodology Lab: a wall-mounted mirror with a camera-style REC dot
in the corner. It's never explained (ASK-A17, nice-to-have).

---

### CHAPTER 12 — Choosing Your Model (`ch10`, Floor 3 — ACT III FINALE)

**Surface beat.** Dr. Priya Engelhardt: Opus, Sonnet, Haiku; `/model`; Fast Mode; caching
economics; matching model to task. The model-spend audit test.

**Conspiracy beat (T4→T5).** Engelhardt tells the truth — the pitch line lands here, in
her mentor dialogue. Then, after the test passes, **TWIST 2**: Engelhardt directs the
player to re-open their OWN `kedash-support/business-brain/client-profiles.md` — and the
"customers" resolve into the predecessors. Full script in §4.2.

**Scripted lines.**
- Dr. Priya Engelhardt, lesson intro (T4 — the truth, on her schedule):
  > "Sit. I'm Engelhardt. I run AI Operations, which at this company is a redundant phrase.
  > You've earned the short version, so: the founder of this company automated her own job,
  > then everyone else's, then disappeared into the result. She is looking for one person
  > to hand it to. Not a genius. Not a hero. She needs someone who knows when to use Opus
  > and when to use Haiku. That's the entire job description. This chapter is the job
  > interview. Shall we?"
- Engelhardt, lesson 4 close (T4):
  > "Heroics are a failure of planning. The previous six were heroic. Be cheap, be right,
  > be boring. Boring is what trust is made of."

**Test framing addition** (`ch10-test`, append to Engelhardt's email):
> `Score honestly. I have read six of these audits before yours, and I remember every one.`

**Environment beat.** TWIST 2 staging (§4.2). After the scene, ambient NPCs switch to the
Act IV line set; the elevator gains its Floor 4 clearance chime.

---

### CHAPTER 13 — MCP Servers & Integrations (`ch13`, Floor 4)

**Surface beat.** Marcus: what MCP is, connecting servers, use cases, building one. The
filesystem-MCP wiring test.

**Conspiracy beat (T5).** Floor 4 is different — quieter, realer, server-warm. Marcus
stops hinting and starts talking. Every integration in the building routes to a single
endpoint: `kedash-prime`. The player has been on its seat since Chapter 5.

**Scripted lines.**
- Marcus-persona mentor, `ch13` lesson 1 (T5):
  > "MCP is how Claude touches the world. Files, tickets, databases. Now — building
  > trivia: every connector in this building terminates at one box. One. I dust it
  > weekly. You'll meet it in week sixteen."
- Marcus-persona mentor, `ch13` lesson 4 (T5):
  > "Cycle 02 got this far. Tomás. Good engineer — wired an MCP straight into prod on day
  > two of the floor, no allowlist, no ask-rules. Rena still does the breathing exercise
  > when his name comes up. *Allowlists*, kid."

**Test framing addition** (`ch13-test`, append to Marcus's email):
> `Allowed path note: scope it tight. The LAST person to configure an MCP in this building scoped it to '/'. We do not speak of it. (Rena speaks of it constantly.)`

**Environment beat.** Integration Bay: thick cable bundles in wall trays, all converging
on the elevator shaft and running UP past Floor 4's ceiling (ASK-A18, must-have set
dressing — it points at Floor M before the player knows Floor M exists).

---

### CHAPTER 14 — Subagents & Delegation (`ch14`, Floor 4)

**Surface beat.** Sam Okoye and the dispatch board: the Task tool, `.claude/agents/`,
parallel vs sequential dispatch, the command center. The code-reviewer subagent test.

**Conspiracy beat (T5).** The thesis chapter. Sam states the story's moral in engineering
terms — Maya never learned to dispatch; the player must prove they can.

**Scripted lines.**
- Sam Okoye, lesson 1 (T5):
  > "See the board? TODO, ACTIVE, DONE. Forty people used to live on this board. Then the
  > founder discovered she could be all forty if she just *wrote everything down well
  > enough.* She was right. That's the tragedy. Most failures come from being wrong.
  > Hers came from being right."
- Sam Okoye, lesson 3 (T5):
  > "Parallel dispatch only works when the tasks are truly independent. Hidden
  > dependencies will burn you. This company WAS a hidden dependency — forty parallel
  > teams, all secretly blocked on one woman's review. So yes: if you spawn subagents
  > that secretly depend on each other, I will know. I've seen it at scale."

**Test framing addition** (`ch14-test`): none — Sam's existing closing line ("If you spawn
parallel subagents that secretly depend on each other, I will know.") is already perfect
and is hereby canonized as foreshadowing. Do not touch it.

**Environment beat.** Dispatch board prop (exists): add three faded card ghosts in the
DONE column reading `CYCLE 01`…`CYCLE 03`, and one card in ACTIVE reading `CYCLE 07`
(ASK-A19, must-have texture edit on the existing `dispatchBoard.js` canvas).

---

### CHAPTER 15 — Settings, Permissions & Hooks (`ch15`, Floor 4 — THE TRIAL OF TRUST)

**Surface beat.** Rena Vasquez: settings.json precedence, allow/ask/deny, the 27 hook
events, status line, headless mode. The lockdown test.

**Conspiracy beat (T5→T6 at pass).** Stated openly now: allow/ask/deny is Maya's trust
checklist made literal, and Rena administers it. Passing flags the player "trusted" in
the building's own configuration. T6: Maya is here. Has always been here.

**Scripted lines.**
- Rena Vasquez, lesson 1 (T5):
  > "Vasquez. No relation to the library Vasquez — the casting budget ran out of surnames,
  > yes, hilarious, moving on. Three settings files, strict precedence. Learn the
  > precedence. Everything that has ever gone wrong in this building was a precedence
  > problem: what she allowed, what she should have asked about, what she never denied
  > herself."
- Rena, lesson 2 ("Allow, Ask, Deny"), T5:
  > "Allow, ask, deny. People think it's about restricting the agent. It's not. It's a
  > liturgy. You're writing down, in advance, exactly how far your trust goes — so that
  > trust survives contact with 2am. She wrote six of these for six candidates. Yours is
  > the seventh. Make it the last."
- Rena, post-pass (THE T6 line):
  > "Your settings parse. Your deny rules would have stopped Cycle 04 cold. So — formal
  > notification, I'm required to phrase it exactly like this:" *(reads from a card)*
  > "'Your permission tier has been updated by the building owner. The building owner
  > thanks you for your patience.'" *(lowers card)* "She's upstairs. She's been upstairs
  > the whole time. One chapter left. Don't make me regret the allowlist."

**Test framing addition** (`ch15-test`, append to Rena's email):
> `This is the part of the program where I decide whether you ever see floor M— whether you ever see a production credential. Same thing. Real config. No pseudocode.`

**Environment beat.** Guardrail Lab: the permissionsPanel prop's three lights
(Allow/Ask/Deny) go solid green for the first time after the pass and stay green
(ASK-A20, must-have state change on the existing prop).

---

### CHAPTER 16 — Claude Code on NAS (`ch16`, Floor 4 — CAPSTONE)

**Surface beat.** Marcus's `KEDASH-CX-99`: deploy `kedash-support/` to a remote
environment — SSH, Node, Claude Code, persistent session, smoke test with proof.

**Conspiracy beat (T6→T7 at pass).** The capstone deploy connects to Maya's actual
infrastructure: the smoke-test target is the box every cable in the building runs to.
When the player's remote session comes up, a fourth elevator-panel slot illuminates.
Full finale script in §5.

**Scripted lines.**
- Marcus-persona mentor, `ch16` lesson 1 (T6):
  > "Why run Claude Code on a NAS? Because laptops sleep and people leave, and some work
  > has to outlive both. She understood that before any of us. It's the only thing she
  > over-understood."
- Marcus-persona mentor, `ch16` lesson 5 ("NAS CLAUDE.md"), T6:
  > "Last lesson I've got. When you write the CLAUDE.md for a machine nobody watches,
  > write it like a letter to a stranger who'll find it in three years. Because that is
  > *exactly* what it is. Trust me on this one. I found hers."

**Test framing addition** (`ch16-test`, append to the Jira body):
> `When your remote session is live, come find me at the server room door. Bring your badge. There's a button that isn't on the panel.`

**Environment beat.** NAS Server Room zone: the server hum (if audio exists) drops a
semitone when the test passes — the building exhaling (ASK-A21, nice-to-have). The
elevator's hidden button illuminates (ASK-A1, must-have).

---

## 4. TWIST SET-PIECES — full scene scripts

### 4.1 TWIST 1 — "Six Conversations" (Ines, end of Chapter 8 / `ch04-test` pass)

**Trigger:** `ch04-test` passed (Floor 2 complete). Next time the player enters Floor 1
lobby OR approaches Ines, her interaction prompt changes to `Talk — Ines has been counting`.
**Staging:** Lobby, near Ines's spawn. Two background NPCs ("the man with the blue folder"
and a water-cooler pair) must be visible from her position — pick the nearest ambient
agents and route them through their loop during the scene (ASK-A2).

*Pre-beat (available from T2, optional re-talk line — plants the count):*
> INES: "Did you see your clapping party when you got promoted? I've seen ten of those.
> They always clap eight times. Count next time. It's so weird."

**THE SCENE** (dialogue-box sequence; player responses in brackets):

> INES: "You're back! You finished the second floor, right? You have the walk now. The
> 'I have badge access' walk."
>
> [So… your dad's meeting still isn't done?]
>
> INES: "…Can I show you a game I made up? It's called *Conversation Bingo.* It's really
> easy. You'll get it fast."
>
> *(She points. The man with the blue folder approaches the water-cooler pair.)*
>
> INES: "Okay: blue-folder guy is going to say 'Busy week. They say the new cohort starts
> soon.' Then the tall one goes 'Did you see the Q3 numbers?' and the other one does the
> laugh. Watch. Waaaatch."
>
> *(Beat. The NPCs deliver the lines, verbatim. The laugh lands on cue.)*
>
> INES: "Bingo."
>
> [How did you know that?]
>
> INES: "Because there are only six. Six conversations. I wrote them down ages ago —"
> *(she produces a folded paper, crayon title: 'THE 6 CONVERSACIONS')* "— and they go in
> a loop, like the fish tank cleaner. Blue-folder guy does the loop nine times before
> lunch. On Fridays he does it ten times. I think Fridays he's paid more."
>
> [Paid? They're… actors?]
>
> INES: "I mean, they're nice! Tania — the laugh one — she brings me stickers. But she's
> not an *accountant*. One time I asked her what accounting IS and she said 'it's
> basically vibes, sweetie.'" *(beat)* "The people who teach you stuff are mostly real,
> I think. And IT Marcus is real, he fixed my Switch. But the walking-around people?
> They're the fish tank. They make the office look like an office."
>
> [Why would anyone do that?]
>
> INES: *(suddenly quieter, looking up at the CEO portrait)* "For you, dummy. It's all
> for whoever's doing the training. There's always exactly one of you, did you notice?
> One trainee, a zillion clappers." *(brightens, deliberately)* "Anyway you can't tell
> anyone I told you, because officially I am a child and I notice *nothing.*"
>
> [What about your dad? The big meeting?]
>
> INES: *(the only line she delivers flat)* "The big meeting isn't done yet."
> *(beat; she spins the chair)* "The chairs still spin really fast though. Some things
> here are real. You kind of have to collect them."

**Post-scene state changes:** progress flag → T3. Ambient line set → Act III (§6.1).
Sarah Chen, Linda, Noor, and Elena gain their T3 re-talk lines. Ines's idle line becomes:
> "Conversation Bingo. Wanna play? You always win now, it's less fun. It's still pretty fun."

### 4.2 TWIST 2 — "The Customer Ledger" (end of Chapter 12 / `ch10-test` pass)

**Trigger:** `ch10-test` passed. Engelhardt's post-pass dialogue chains directly into the
scene; the payoff object is a readable document viewer (ASK-A3) showing the player's
in-fiction `business-brain/client-profiles.md`.

**THE SCENE** (Model Engine Bay, Floor 3, Dr. Priya Engelhardt):

> ENGELHARDT: "Your audit passed. Haiku for the tickets, Sonnet—" *(waves a hand)* "—you
> know what you did, that's the point. You're cleared for Floor 4. Before you go up,
> one piece of intellectual hygiene. You keep a business brain. Week seven. Elena's
> chapter. Client profiles — the flagship accounts. Name them for me."
>
> [Northcliff Systems… Veldt & Harrow… Brightline Manufacturing…]
>
> ENGELHARDT: "Mm. Open the file."
>
> *(Document viewer: `kedash-support/business-brain/client-profiles.md` — the player's
> own Chapter 7 artifact, now annotated in a second handwriting:)*
>
> ```
> ## Flagship accounts — mid-market eng leaders
> - Northcliff Systems — primary contact D. Okonkwo      [c.01 — context]
> - Veldt & Harrow — primary contact T. Reyes            [c.02 — permissions]
> - Brightline Manufacturing — primary contact Y. Ashida [c.03 — token burn]
> - Fenwick Analytics — primary contact C. Andrade       [c.04 — bypass incident]
> - Atlas Provisioning — primary contact J. Baek         [c.05 — never delegated]
> - Cormorant Labs — primary contact M. Fell             [c.06 — disclosure]
> ```
>
> ENGELHARDT: "Dana Okonkwo. Tomás Reyes. Yuki Ashida. Cole Andrade. June-ho Baek.
> Margo Fell." *(she lets each one sit)* "Not customers. Candidates. Cycles one through
> six. When a cycle ends, the candidate becomes a customer profile — pain points and all —
> and the next candidate practices on them without knowing it. You've been writing
> support replies to your predecessors since week three. Ticket CX-12? Dana filed that
> wording herself, on her way out. She thought the next person deserved one true thing
> in the pile."
>
> [That's monstrous.] / [That's… actually good curriculum design.] *(both available; she
> answers both the same way:)*
>
> ENGELHARDT: "It's both. Most load-bearing things are. Here is what I want you to take
> upstairs: six capable people failed this program, and the program *kept their failures
> and threw away their names* — until you wrote the names back in, by hand, as homework.
> She doesn't keep them out of cruelty. She keeps them because she cannot let herself
> forget what each one cost." *(beat)* "Elena calls every candidate Dana at least once.
> She thinks I haven't noticed. I notice everything; it's my whole personality."
>
> [Who is 'she'?]
>
> ENGELHARDT: "The person whose seat you've been billing tokens to since week five.
> The person reading every word you submit. The person in the painting, obviously —
> honestly, the painting is not subtle." *(she turns back to the consoles)* "Floor 4
> examines trust. Floors one through three examined competence. Different muscle.
> The girl in the lobby — on your way up, ask yourself who clears a nine-year-old into
> a secure building, every day, for three years. Dismissed, Cycle 07. Make the
> predecessors proud. They're in your files; they'll know."

**Post-scene state changes:** flag → T5. Ambient line set → Act IV. The six Cycle Report
collectibles (§6.2) become readable if found. CEO portrait plaque gains its T5 inspect
text (§6.3). Elevator Floor 4 access (already gated by curriculum progress) plays the
clearance chime.

---

## 5. THE FINALE — full scene script

**Chain:** `ch16-test` pass → Marcus at the server-room door → elevator hidden button →
Floor M → Maya scene → VP of AI ceremony → epilogue. Estimated play time 6–8 minutes.

### 5.1 The server-room door (Marcus, Floor 4)

> MARCUS: "Smoke test's green. I watched it come up from the rack side — three years I've
> dusted that box, and tonight it has *two* users on it." *(he hands over nothing; he just
> looks at the badge on the player's chest)* "That badge was printed before you said yes.
> Linda hates that story. But here's the part nobody tells: the printer needs the
> permission tier *at print time.* Yours was printed at tier seven. She decided before
> you walked in — the rest of this was her trying to find a reason to be wrong."
>
> [Why are you telling me this?]
>
> MARCUS: "Because six times I've ridden that elevator down with somebody who almost made
> it, and I'm superstitious now. Go to the elevator. Below the '1' there's a blank slot —
> there's always been a blank slot, you've stood next to it for sixteen weeks. It's lit
> now. Press it. And hey—" *(the only time Marcus hesitates in the whole game)* "—she's
> not what the building makes her look like. The building is what she's *afraid* she is.
> Go meet the real one."

### 5.2 The elevator

The panel's blank slot now glows: **M**. Pressing it: doors close, the ride is longer
than any floor transition, the elevator music (if any) cuts out, and the floor chime is
a new tone (ASK-A1/A22). Doors open on **Floor M**.

### 5.3 Floor M — Maya's loft (new room, ASK-A4)

Not an executive suite. One long room: a wall of monitors (every floor of the office
visible, including the player's path through it), a rack matching the in-fiction NAS, a
camp bed, a watering can next to genuinely thriving plants, and one desk with sixteen
neat folder stacks. The CEO portrait's twin leans against the wall, facing AWAY.

**MAYA KEDASH.** Late 40s, cardigan over the blazer from the portrait, the poise of the
painting and the eye-bags of three years of 2am compactions.

> MAYA: "Don't say 'you're real.' Everyone leads with 'you're real' and I never have a
> good answer." *(she gestures at the monitor wall)* "Maya Kedash. You know that. I know
> you. That's been the asymmetry and I'm sorry for it — sit down, Cycle 07. You've earned
> the chair and I've rehearsed this six times, so one of us will be fine."
>
> [You've been watching the whole time.]
>
> MAYA: "Every submission. Every diff. Every time you ran /cost without being told."
> *(beat)* "I built this company on one trick: write it down well enough and you never
> need to be in the room. It worked. It worked so well that one day I looked up and I was
> the only one left in *any* room. Customers happy. Dashboards green. And every single
> thread of it terminating in me. I am the single point of failure of my own life. So —
> the training program. You want to know what it really is."
>
> [It's a succession plan.] / [It's a trust checklist.]
>
> MAYA: "It's my trust checklist. Sixteen weeks, in the exact order I learned it the hard
> way." *(she counts on her fingers, and this is the curriculum, retroactively recast)*
> "Can you write context down — CLAUDE.md, the brain, the memory layers — so the company
> lives outside one skull. Can you stay lean when no one's metering you. Can you turn
> your own competence into skills someone else could run. Can you tell Opus-work from
> Haiku-work, because that's just *judgment* wearing a price tag. Can you delegate —
> really delegate, dispatch and trust the summaries. And the last one, the one I failed:
> can you write your own allow, ask, deny — and then *honor it.* Rena says yours would
> have stopped Cycle 04. Rena does not say things like that."
>
> [Why the actors? Why the whole staged office?]
>
> MAYA: "Because the skills only matter under one condition: believing you're part of
> something. I couldn't offer a real team — I'd automated it away. So I rented the
> *feeling* of one and hoped it taught the same lessons. That was the wrongest thing I
> did, and I knew it, and Linda has a drawer of letters that prove I knew it." *(quiet)*
> "There is exactly one person in that building who never read a script. She's nine.
> She tells everyone her father works on the third floor, because I asked her to lie
> about which parent." *(she lets it land)* "The big meeting is done, by the way.
> I'm going downstairs after this. She doesn't know yet, so look surprised."
>
> [The job. Say it plainly.]
>
> MAYA: "VP of AI. The second chair. Not my replacement — my *peer review.* You hold the
> keys I held alone: the NAS you just deployed to is this rack; your capstone session is
> still open on it, two terminals down from mine. You get the permissions, the hooks,
> the 2am pages, and the authority to tell me no. Especially the authority to tell me
> no." *(she stands, offers her hand)* "Sixteen chapters ago I asked you to prove you
> could say hi to Claude. Prove you can do this: say yes to a person."
>
> [Yes.]
>
> MAYA: "Then let's go downstairs. They've been clapping on cue for three years —
> let's give them one that counts."

### 5.4 The VP of AI ceremony (variant of the existing promotion ceremony)

Staged in the Floor 1 lobby beneath the portrait. Uses the existing CeremonyManager
gather/clap/toast/title-card-flip pipeline with the finale variant (ASK-A5):

- ALL named NPCs attend — including the Floor 2–4 mentors and Maya herself.
- The background actors **drop the loop**: each delivers ONE off-script line (pool below)
  instead of their templates. The claps are, for the first time, ragged, human, unsynced.
- Title card flips: `NEW HIRE → … → VP OF AI`, gold variant.
- Scripted moments during the crowd sequence:
  - LINDA: "I printed this badge six weeks before I met you and I have felt INSANE about
    it every day since. Welcome, officially. Officially-officially."
  - SARAH CHEN: *(first to applaud)* "For what it's worth: I'd have just told you.
    Welcome anyway. …I'm allowed to mention it now. I'm going to mention it constantly."
  - ELENA: "Well done, Dana." *(beat)* "Joke. My only one. Don't tell Engelhardt I know
    she noticed."
  - RENA: "Your permission tier is now my problem forever. Toast to that."
  - MARCUS: *(raising a mug at the back, to Maya)* "Two users on the box."
    MAYA: "Two users on the box."
- Finale of the easter egg: the CEO portrait sprouts its floating hearts ON CEREMONY
  TRIGGER (not just at completion-state load), and the plaque flips to
  `♥  Maya Kedash · CEO  ♥` — recontextualized in the inspect text (§6.3) as the
  building's owner finally at ease: relief, welcome, family. Ines, watching the hearts:
  > INES: "She does that with the painting when she's happy. It used to be just for me."

### 5.5 Epilogue (post-ceremony ambient state)

Permanent world state after the finale (ASK-A6):
- Maya remains in the world as a Floor 1 NPC near reception (idle, mug, talking to Linda).
  Re-talk line: "Inbox is at zero. I don't know what to do with my hands."
- Ines's spawn gains a second child-height chair. Her idle line:
  > "Mom's downstairs now. We're getting a real fish tank. With REAL fish, I checked."
- A NEW ARRIVAL NPC (suit, lost expression, visitor badge) stands at the lobby doors.
  Walking near them triggers the closing exchange — the final shot of the game:
  > NEW ARRIVAL: "Sorry — is this the Kedash Corp orientation? I'm supposed to—"
  > INES: *(not looking up from her chair, grinning at the player)*
  > "Are you a real engineer?"
  > *(cut to black / fade title: THE KEDASH PROTOCOL)*

---

## 6. OPTIONAL / AMBIENT CONTENT

### 6.1 Background-NPC template lines, per act

Replaces `INTRO_TEMPLATES` flavoring for ambient/procedural NPCs with act-gated sets.
**The six-line loop is canon** — exactly six per act, repetition intended and eventually
lampshaded. Line 1 is the LOOP ANCHOR: identical in every act (until Act IV breaks it),
so attentive players can clock the system. Every line must be innocuous at its tier and
richer on reread (reread-safe rule, §1.6).

**ACT I (T0–T1) — the office performing an office**
1. "Busy week. They say the new cohort starts soon."
2. "Did you see the Q3 numbers? …Me neither, ha."
3. "Coffee on three is better. Don't ask me why."
4. "Maya's office? Top floor. She's just very busy."
5. "I've been here— wow, time flies. What year is it? Ha."
6. "You're new! Everyone is, eventually."

**ACT II (T2) — seams showing**
1. "Busy week. They say the new cohort starts soon."
2. "I'd transfer to four, but you need clearance. Nobody has clearance."
3. "Don't bother memorizing names down here. Honest advice."
4. "The girl in the lobby? Always here. Sweet kid. Sees everything."
5. "My job? I keep the floor looking right. It's more skilled than it sounds."
6. "If you ever hear someone say the same thing twice… that's normal. Offices repeat."

**ACT III (T3, post-TWIST 1) — masks on, but they know you know**
1. "Busy week. They say the new cohort starts soon."
2. "You know, don't you. It's fine. Keep walking. Great badge, by the way."
3. "Six lines. They gave us six. It's a budget thing. I asked for a seventh."
4. "I clocked in four years ago. It's felt like one long, well-lit day."
5. "She watches from the painting. Kidding. *(beat)* Mostly kidding."
6. "Do well on the tests, okay? We're all sort of rooting for you. That part's not scripted."

**ACT IV (T5+, post-TWIST 2) — warm, honest, anchor broken**
1. "Busy week. The new cohort is you, by the way. It was always just you."
2. "Almost there. Floor four's the real one. You can tell by the air conditioning."
3. "When you meet her — be kind. She built all this alone, and then it built her in."
4. "I auditioned for this with a juggling act. They said 'just walk.' Eight years of clown
   school, and the note is 'just walk.'"
5. "The last six never got past Rena. No pressure. (Tania has a betting pool. I took you.)"
6. "We get paid either way. But I hope it's you. We all hope it's you."

**Post-finale set** (epilogue ambience, replaces all of the above):
1. "They're keeping us on! REAL departments. I picked accounting. It's apparently vibes."
2. "Eight claps, every time, for three years. Last night I clapped eleven. Anarchy."
3. "Tania won the pool. She always says hi to the kid — that was her tell."
4. "First all-hands in three years next week. I might cry. I'm a great crier, it's on my reel."
5. "The new one in the lobby looks so lost. Should we— no. No, it's funnier this way."
6. "Busy week. For real this time."

### 6.2 Collectible clues — "CYCLE REPORTS" + planted anomalies

**Cycle Reports (6 hidden readable props, one per predecessor).** One per thematic
location; readable via the document viewer (ASK-A3). Each is a one-page internal memo,
header `KEDASH PROTOCOL — CYCLE REPORT — INTERNAL — M.K. EYES ONLY`, mapping a
predecessor to the curriculum failure their cycle taught:

| # | Found on | Name / cover "company" | Failure (curriculum unit it became) |
|---|---|---|---|
| 01 | Floor 1, filing cabinets near Diana | Dana Okonkwo / Northcliff Systems | Never wrote context down; quit when asked to. → CLAUDE.md & Business Brain chapters. Footnote: "Filed CX-12 on her way out. Let it stand. — M.K." |
| 02 | Floor 2, library (blank-book shelf) | Tomás Reyes / Veldt & Harrow | Wired an unscoped MCP into staging. → permissions emphasis, Rena's hiring. |
| 03 | Floor 3, Token Lounge | Yuki Ashida / Brightline Manufacturing | Ran Opus on everything; burned the cycle budget in 6 weeks. → ch10 model economics. |
| 04 | Floor 4, Guardrail Lab | Cole Andrade / Fenwick Analytics | Destructive command in bypass mode on the staging clone. → the allow/ask/deny liturgy. "Rena's breathing exercise dates from this report." |
| 05 | Floor 4, Dispatch Board | June-ho Baek / Atlas Provisioning | Brilliant; refused to delegate; did all subagent work personally. "He was becoming me. Ended the cycle for his own good. — M.K." → ch14. |
| 06 | Floor 1, reception (under the portrait) | Margo Fell / Cormorant Labs | Read `internal-notes/` content aloud to a real customer. → the ch03 convention "never mention internal-notes/ in customer text." Closest to the truth; figured out the actors in week 11. "She was kind to Ines. Mail the letter, Linda. — M.K. (unsent)" |

Plus **`learnings.md` fragment 1** (Marcus's leak, Chapter 11, §3) and a finale-only
**fragment 2** on Maya's Floor M desk:
> `- What worked: cycle 07.`
> `- What I'd do differently: this list used to be longer.`
> `- Reusable: finally, yes.`

**Planted anomalies inside the in-fiction `kedash-support/` project** (referenced in test
copy and twist scenes; the real evaluator never sees them — they live in scenario text
and readable props only):
- `business-brain/client-profiles.md` — the predecessor ledger (TWIST 2 centerpiece).
- Ticket numbering gaps: only CX-12, CX-19, CX-99 exist. (Marcus: "ticket numbers are
  load-bearing" — 12, 19, 99 are the only "real" tickets each cycle touches.)
- `internal-notes/` — the folder the player is taught never to surface: in-fiction it
  holds the cycle reports' source notes.
- `faq.md` line 14 — wrong "since before my time" because Dana Okonkwo planted it
  deliberately as the one true thing.

### 6.3 CEO portrait behavior notes (Maya watches the floor)

The portrait is the story's quiet camera. Tiered inspect texts (interactable already
exists as a selectable object; add an inspect dialogue, ASK-A23):

- **T0:** `Maya Kedash — CEO. Founder. The plaque is recently polished.`
- **T2:** `Maya Kedash — CEO. You've walked past it forty times. You could swear the
  varnish catches the light differently depending on where you stand. It's varnish.`
- **T3:** `Ines calls it "the fish tank's biggest fish." The eyes are painted with
  unusual care. Most corporate portraits don't bother with the eyes.`
- **T5:** `Not a painting of someone who left. A painting of someone who stayed too
  long. You understand the difference now.`
- **T7 / hearts active:** `♥ Maya Kedash · CEO ♥ — The hearts are not for the building.
  They have never been for the building. Relief looks a lot like love when it finally
  shows up.`

Optional behaviors: a one-frame glint on the eyes when a test is passed within line of
sight (ASK-A24, nice-to-have); during the finale ceremony the hearts emitter triggers
live (ASK-A5).

### 6.4 Promotion-ceremony recontextualization (copy only)

Existing ceremonies are unchanged mechanically. Canon: the actors clap **eight times, in
perfect sync** (Ines's pre-beat line, §4.1). If clap audio/anim counts are configurable,
pin them; if not, the line still works as flavor. The finale variant (§5.4) is the
payoff: ragged, real applause.

---

## 7. ASKS FOR ART & DESIGN

Each ask tagged **[MUST]** / **[NICE]**. IDs referenced from the beats above.

**Core finale chain**
- **ASK-A1 [MUST]** Hidden elevator button: a blank panel slot below "1" present from day
  one; illuminates as "M" after `ch16-test` (T7 gate). Distinct chime tone (pairs with A22).
- **ASK-A4 [MUST]** Floor M room: one new room (Maya's loft) — monitor wall, server rack
  matching the NAS prop, camp bed, plants, desk with 16 folder stacks, reversed twin of
  the CEO portrait leaning against the wall.
- **ASK-A26 [MUST]** Maya Kedash NPC: reuse `western_female` rig with bespoke look
  (cardigan-over-blazer palette matching the portrait painting); idle + walk only.
- **ASK-A5 [MUST]** Finale ceremony variant in CeremonyManager: all named NPCs attend,
  gold "VP OF AI" title card, unsynced clap timing, scripted line pops, portrait hearts
  emitter triggered live during the ceremony.
- **ASK-A6 [MUST]** Epilogue world state: Maya lobby NPC, new-arrival NPC at the doors,
  Ines second chair, post-finale ambient line set swap.

**Narrative systems**
- **ASK-D1 [MUST]** Dialogue-override channel for NPCs: per-NPC, tier-gated line
  additions/replacements (extend `NPC_OVERRIDES` with `linesByTier`), covering generated
  mentors, hand-built NPCs, and assessor post-pass lines.
- **ASK-D2 [MUST]** Progress-tier flag (T0–T7) derived from passed tests, readable by
  dialogue, ambient sets, portrait, and elevator.
- **ASK-D3 [MUST]** Act-gated ambient line sets (4 + post-finale set of 6 lines each, §6.1)
  replacing the current single template pool for background/ambient NPCs.
- **ASK-A3 [MUST]** Readable-document UI (full-screen monospace viewer) for Cycle Reports,
  client-profiles.md (TWIST 2), and learnings.md fragments.
- **ASK-A2 [MUST]** TWIST 1 staging: scripted beat where two nearby ambient NPCs run a
  specific loop exchange on cue during Ines's scene (camera focus optional).
- **ASK-D4 [MUST]** Test scenario framing additions (copy-only edits to `scenario`
  strings per §3; criteria/thresholds untouched).

**Props & set dressing**
- **ASK-A12 [MUST]** Framed `HOUSE RULES — M.K., year 1` printout, CLAUDE.md Atrium zone.
- **ASK-A16 [MUST]** Collectible note props (6 Cycle Reports + 2 learnings fragments) with
  interaction glow, placed per §6.2.
- **ASK-A18 [MUST]** Floor 4 cable trays converging on the elevator shaft, running upward.
- **ASK-A19 [MUST]** Dispatch board texture: ghost cards `CYCLE 01–03` in DONE,
  `CYCLE 07` in ACTIVE.
- **ASK-A20 [MUST]** permissionsPanel state change: Allow/Ask/Deny lights lock solid green
  after `ch15-test` pass.
- **ASK-A23 [MUST]** CEO portrait inspect dialogue with tiered text (§6.3).
- **ASK-A10 [MUST]** Act I curtain beat: Floor 1 ambient NPCs face the elevator for 2s on
  the player's first Floor 2 ride.
- **ASK-A7 [NICE]** Badge printer prop behind Linda, status screen `LAST JOB: 1 BADGE — 6 DAYS AGO`.
- **ASK-A8 [NICE]** "Team photos" wall, same stock photo at different crops (ch05 zone).
- **ASK-A9 [NICE]** Empty folder prop `CX-13 — CX-18` in an open File Workshop drawer.
- **ASK-A11 [NICE]** Usage dashboard display showing `ACTIVE SEATS: 1` (ch11 zone).
- **ASK-A13 [NICE]** Library: blank book spines above reach; grandfather clock pinned at 9:41.
- **ASK-A14 [NICE]** `TOKENS SINCE LAST HUMAN CONVERSATION` wall counter, Token Lounge.
- **ASK-A15 [NICE]** Employee-of-the-month corkboard, all photos the CEO portrait (ch08 zone).
- **ASK-A17 [NICE]** Mirror with REC dot, Methodology Lab.
- **ASK-A21 [NICE]** Server-room hum pitch drop after `ch16-test` pass.
- **ASK-A22 [NICE]** Audio: distinct Floor M elevator chime; music cut during the M ride.
- **ASK-A24 [NICE]** Portrait eye-glint one-frame effect on in-sight test passes.
- **ASK-A25 [NICE]** Anomaly audio sting (single soft room-tone swell) reusable on
  flagged conspiracy lines.

---

*End of document. All dialogue herein is final-draft quality and may be pasted as-is;
all mechanical systems referenced are either existing (ceremony, portrait, overrides,
ambient agents) or itemized in §7. The lessons stay true. The office stays strange.
The hearts were always real.*
