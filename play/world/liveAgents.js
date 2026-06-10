// liveAgents.js — make the office feel inhabited.
//
// Two systems:
//   1) RoutineDriver — applied to specific named NPCs (Marcus, Aisha,
//      Linda). Each NPC gets a sequence of waypoints + dwell durations;
//      we lerp them between points and orient them toward the next.
//   2) AmbientAgents — extra featureless workers spawned in distant
//      parts of zones. They follow randomized waypoint loops. Cap is
//      lower on mobile.
//
// All movement is simple lerps — no pathfinding, no collision.
//
// Public API:
//   const live = new LiveAgents({ scene, npcMeshes, makeCharacter, isMobile });
//   live.update(dt, now, playerPos);
//   live.dispose();

import * as THREE from 'three';

// Routines for hand-named NPCs. positions are absolute world coords.
const ROUTINES = {
  marcus: {
    waypoints: [
      { pos: [-6, -3], face: Math.PI / 2, dwell: 18 },   // his desk
      { pos: [-9.5, -2], face: Math.PI, dwell: 4 },       // water cooler
      { pos: [-6, -3], face: Math.PI / 2, dwell: 30 },   // back to desk
    ],
    speed: 1.6,
  },
  aisha: {
    // Aisha is the ch01-l03 instructor — she must stay in the atrium
    // so the player can always find her at her desk. Previous routine
    // walked her into the library (z=18) and players lost track of her.
    // Both waypoints below sit safely inside zone 0 (z ∈ [-11, 11]).
    waypoints: [
      { pos: [6, -3], face: -Math.PI / 2, dwell: 30 },   // her desk (main spot)
      { pos: [5, -2], face: 0,            dwell: 3 },    // tiny stretch nearby
      { pos: [6, -3], face: -Math.PI / 2, dwell: 40 },   // back to desk
    ],
    speed: 1.4,
  },
  // The man with the blue folder (Kedash Protocol, TWIST1-02) — a slow
  // lobby loop that keeps him visible from Ines's spot at (2, -4). Ines
  // claims he "does the loop nine times before lunch"; the scene's
  // sendTo() override routes him to the water cooler on cue.
  folderman: {
    // Loops AROUND the reception centerpiece at (0, 0, 1) — the south
    // waypoint keeps the return leg clear of it.
    waypoints: [
      { pos: [7, -1],  face: Math.PI,      dwell: 6 },
      { pos: [6.5, 6], face: -Math.PI / 2, dwell: 4 },
      { pos: [-3, 7],  face: 0,            dwell: 7 },
      { pos: [-6, 1],  face: Math.PI / 2,  dwell: 5 },
      { pos: [-2, -4], face: Math.PI / 2,  dwell: 3 },
    ],
    speed: 0.9,
  },
  // Linda is special — she greets the door instead of pathing.
  // Tania + partner (water-cooler pair) deliberately have NO routine —
  // they hold their cooler spots so TWIST 1's staging always finds them.
};

// Neutral identities for the procedural library ambients — they become
// E-to-talk flavor NPCs (SYS-04), so they need names and a portrait.
const AMBIENT_IDENTITIES = [
  { name: 'Dev Kapoor',      portrait: '🧑‍💼' },
  { name: 'Marta Lindqvist', portrait: '👩‍💼' },
  { name: 'Theo Brandt',     portrait: '👨‍💼' },
  { name: 'Suki Tanabe',     portrait: '👩‍💻' },
];

export class LiveAgents {
  constructor({ scene, npcMeshes, makeCharacter, isMobile, makeNameTag, ambientLineForSlot }) {
    this.scene = scene;
    this.npcMeshes = npcMeshes;
    this.makeCharacter = makeCharacter;
    this.mobile = isMobile;
    this.makeNameTag = makeNameTag || null;
    this.ambientLineForSlot = ambientLineForSlot || null;
    // sendTo() overrides, keyed by npc id (Kedash Protocol staging).
    this.overrides = {};

    // Index hand-named NPCs by id.
    this.named = {};
    for (const m of npcMeshes) {
      const id = m.userData?.npc?.id;
      if (id) this.named[id] = m;
    }

    // Prepare per-NPC routine state.
    this.routineState = {};
    for (const id of Object.keys(ROUTINES)) {
      const npc = this.named[id];
      if (!npc) continue;
      this.routineState[id] = {
        idx: 0,         // current waypoint index
        progress: 0,    // 0..1 lerp from waypoint[idx-1] to waypoint[idx]
        dwellLeft: ROUTINES[id].waypoints[0].dwell,
        homePos: [npc.position.x, npc.position.z],
        homeFace: npc.rotation.y,
      };
    }

    // Linda greeting state.
    this.greetingTriggered = false;
    this.greetingFor = 0;

    // Ambient agents.
    const cap = isMobile ? 2 : 4;
    this.ambient = [];
    for (let i = 0; i < cap; i++) this.ambient.push(this._spawnAmbient(i));
  }

  _spawnAmbient(seed) {
    if (!this.makeCharacter) return null;
    const palettes = [0xffd180, 0xb39ddb, 0xa5d6a7, 0xff8a65];
    const skinTones = [0xfdd9b5, 0xf1c27d, 0xc68642, 0x8d5524];
    const hairColors = [0x1a1a1a, 0x2c1810, 0x4a2c0f, 0xc8a572];
    const hairStyles = ['short', 'long', 'bob', 'bun', 'ponytail', 'side-part'];
    const eyeColors = [0x4a2a14, 0x6b4a2a, 0x4a7a96, 0x4a7a3f, 0x6a6a6a];
    const browShapes = ['soft', 'arched', 'flat'];
    const mouthShapes = ['smile', 'gentle', 'flat'];
    // _id ensures the flatFace system gives each ambient agent a unique
    // deterministic face via id hashing (faceConfigs.getFaceConfig).
    const look = {
      _id: `ambient-${seed}`,
      skin:       skinTones[seed % skinTones.length],
      hair:       hairColors[(seed * 3) % hairColors.length],
      hairStyle:  hairStyles[(seed * 5) % hairStyles.length],
      shirt:      palettes[seed % palettes.length],
      pants:      0x37474f,
      eyeColor:   eyeColors[(seed * 7) % eyeColors.length],
      browShape:  browShapes[seed % browShapes.length],
      mouthShape: mouthShapes[(seed + 1) % mouthShapes.length],
      blush:      (seed % 3) !== 0,
      glasses:    (seed % 4) === 0,
      beard:      (seed % 7) === 0 ? 'stubble' : null,
    };
    const mesh = this.makeCharacter(look);
    // Spawn in the Library's south reading band (the library moved to
    // the west wing at center (-22,-22); the old coords pointed at its
    // former home south of reception and left agents wandering outside).
    mesh.position.set(-27 + (seed % 3) * 4, 0, -16);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    // Ambient library agents belong to floor 1 — hide them when the
    // player rides up to upper floors.
    mesh.userData.floor = 1;
    // SYS-04: ambient agents are E-to-talk flavor NPCs carrying the
    // act-gated six-line set (data/story_ambient.js). Slots 0-2 belong
    // to the dedicated lobby actors (folderman/partner/tania in the
    // NPCS roster); library ambients take slots 3+ and cycle lines 2-6.
    const ident = AMBIENT_IDENTITIES[seed % AMBIENT_IDENTITIES.length];
    const slot = 3 + seed;
    mesh.userData.npc = {
      id: `ambient-${seed}`,
      kind: 'flavor',
      name: ident.name,
      role: 'Kedash Staff',
      portrait: ident.portrait,
      intro: this.ambientLineForSlot ? this.ambientLineForSlot(slot) : 'Busy week.',
      nextHint: '',
    };
    if (this.makeNameTag) {
      const tag = this.makeNameTag(`${ident.portrait} ${ident.name}`);
      tag.position.set(0, 2.30, 0);
      mesh.add(tag);
    }
    this.scene.add(mesh);
    // Registering into npcMeshes makes the proximity loop, dialogue and
    // name-tag systems pick them up — AND means play.js's NPC loop now
    // ticks their GLTF mixer, so update() below must NOT double-tick.
    this.npcMeshes.push(mesh);
    return {
      mesh,
      // Random rectangular waypoint loop within the library.
      waypoints: this._randomWaypoints(seed),
      idx: 0,
      progress: 0,
      dwellLeft: 4 + (seed % 5),
      speed: 1.0 + (seed % 3) * 0.2,
    };
  }

  _randomWaypoints(seed) {
    const wp = [];
    // Loop inside the library's open south band (z -16.5..-14.5),
    // between the shelf grid (south face ~z -17.8) and the reception
    // desk (z -13.6..-12.4, x -23.8..-20.2).
    const baseX = -27 + (seed % 3) * 4;
    const baseZ = -16.5;
    for (let i = 0; i < 4; i++) {
      wp.push({
        pos: [
          baseX + (i % 2) * 6 - 3,
          baseZ + (i < 2 ? 0 : 1.5) + Math.random() * 0.5,
        ],
        face: (i % 4) * (Math.PI / 2),
        dwell: 5 + (seed * 3 + i) % 4,
      });
    }
    return wp;
  }

  update(dt, now, playerPos) {
    // Run routines for named NPCs (sendTo overrides take precedence)
    for (const [id, routine] of Object.entries(ROUTINES)) {
      const npc = this.named[id];
      if (!npc) continue;
      if (this.overrides[id]) {
        this._stepOverride(id, npc, routine, dt);
        continue;
      }
      this._stepRoutine(npc, routine, this.routineState[id], dt);
    }

    // Linda greeting — turns to face the entrance when player crosses
    // z = 8 (south half of Reception). Reverts after 6 s.
    const linda = this.named.linda;
    if (linda && playerPos) {
      // Player entering from doorway (z > 6 means near the front door).
      const isApproaching = playerPos.z > 6 && Math.abs(playerPos.x) < 4
        && Math.hypot(playerPos.x - linda.position.x, playerPos.z - linda.position.z) < 14;
      if (isApproaching && !this.greetingTriggered) {
        this.greetingTriggered = true;
        this.greetingFor = now + 6000;
        // Aim toward player.
        const dx = playerPos.x - linda.position.x;
        const dz = playerPos.z - linda.position.z;
        linda.userData._greetTargetRot = Math.atan2(dx, dz);
      }
      if (this.greetingTriggered && now > this.greetingFor) {
        this.greetingTriggered = false;
        linda.userData._greetTargetRot = undefined;
      }
      if (linda.userData._greetTargetRot !== undefined) {
        const target = linda.userData._greetTargetRot;
        let d = ((target - linda.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
        if (d < -Math.PI) d += Math.PI * 2;
        linda.rotation.y += d * (1 - Math.exp(-dt * 3));
      }
    }

    // Ambient agents. NOTE: their GLTF mixers are NOT ticked here —
    // ambients are registered in npcMeshes now (SYS-04), so play.js's
    // NPC loop handles walk/idle detection + mixer.update. Ticking
    // here too would double-speed the animation.
    for (const a of this.ambient) {
      if (!a) continue;
      this._stepAgent(a, dt);
    }
  }

  // Kedash Protocol staging (TWIST1-01): route a routine NPC to an
  // absolute [x, z], hold there facing `face` for `holdSec`, then walk
  // back to waypoint 0 and resume the loop (avoids a position snap).
  sendTo(id, to, face = 0, holdSec = 60) {
    const npc = this.named[id];
    if (!npc || !ROUTINES[id]) return false;
    this.overrides[id] = { phase: 'go', to, face, holdLeft: holdSec };
    return true;
  }

  _stepOverride(id, npc, routine, dt) {
    const ov = this.overrides[id];
    const speed = routine.speed || 1.2;
    if (ov.phase === 'go' || ov.phase === 'return') {
      const tx = ov.phase === 'go' ? ov.to[0] : routine.waypoints[0].pos[0];
      const tz = ov.phase === 'go' ? ov.to[1] : routine.waypoints[0].pos[1];
      const dx = tx - npc.position.x;
      const dz = tz - npc.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.08) {
        if (ov.phase === 'go') {
          ov.phase = 'hold';
        } else {
          // Back home — resume the normal loop from waypoint 0.
          delete this.overrides[id];
          const st = this.routineState[id];
          if (st) { st.idx = 0; st.progress = 0; st.dwellLeft = routine.waypoints[0].dwell; }
          npc.rotation.y = routine.waypoints[0].face;
        }
        return;
      }
      const step = Math.min(dist, speed * dt);
      npc.position.x += (dx / dist) * step;
      npc.position.z += (dz / dist) * step;
      const targetRot = Math.atan2(dx, dz);
      let r = ((targetRot - npc.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (r < -Math.PI) r += Math.PI * 2;
      npc.rotation.y += r * (1 - Math.exp(-dt * 4));
      return;
    }
    // phase === 'hold' — face the assigned direction, run down the timer.
    let r = ((ov.face - npc.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (r < -Math.PI) r += Math.PI * 2;
    npc.rotation.y += r * (1 - Math.exp(-dt * 3));
    ov.holdLeft -= dt;
    if (ov.holdLeft <= 0) ov.phase = 'return';
  }

  _stepRoutine(npc, routine, state, dt) {
    const wps = routine.waypoints;
    if (!wps?.length) return;
    if (state.dwellLeft > 0) {
      state.dwellLeft -= dt;
      return;
    }
    const targetIdx = (state.idx + 1) % wps.length;
    const fromX = wps[state.idx].pos[0];
    const fromZ = wps[state.idx].pos[1];
    const toX = wps[targetIdx].pos[0];
    const toZ = wps[targetIdx].pos[1];
    const dist = Math.hypot(toX - fromX, toZ - fromZ);
    if (dist < 0.05) {
      state.idx = targetIdx;
      state.dwellLeft = wps[targetIdx].dwell;
      return;
    }
    state.progress += (routine.speed * dt) / dist;
    if (state.progress >= 1) {
      state.progress = 0;
      state.idx = targetIdx;
      state.dwellLeft = wps[targetIdx].dwell;
      npc.position.x = toX;
      npc.position.z = toZ;
      npc.rotation.y = wps[targetIdx].face;
      return;
    }
    npc.position.x = fromX + (toX - fromX) * state.progress;
    npc.position.z = fromZ + (toZ - fromZ) * state.progress;
    // Face direction of travel
    const dx = toX - fromX;
    const dz = toZ - fromZ;
    const targetRot = Math.atan2(dx, dz);
    let r = ((targetRot - npc.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (r < -Math.PI) r += Math.PI * 2;
    npc.rotation.y += r * (1 - Math.exp(-dt * 4));
  }

  _stepAgent(agent, dt) {
    const wps = agent.waypoints;
    if (agent.dwellLeft > 0) {
      agent.dwellLeft -= dt;
      return;
    }
    const targetIdx = (agent.idx + 1) % wps.length;
    const fromX = wps[agent.idx].pos[0];
    const fromZ = wps[agent.idx].pos[1];
    const toX = wps[targetIdx].pos[0];
    const toZ = wps[targetIdx].pos[1];
    const dist = Math.hypot(toX - fromX, toZ - fromZ);
    if (dist < 0.05) {
      agent.idx = targetIdx;
      agent.dwellLeft = wps[targetIdx].dwell;
      return;
    }
    agent.progress += (agent.speed * dt) / dist;
    if (agent.progress >= 1) {
      agent.progress = 0;
      agent.idx = targetIdx;
      agent.dwellLeft = wps[targetIdx].dwell;
      agent.mesh.position.x = toX;
      agent.mesh.position.z = toZ;
      return;
    }
    agent.mesh.position.x = fromX + (toX - fromX) * agent.progress;
    agent.mesh.position.z = fromZ + (toZ - fromZ) * agent.progress;
    const dx = toX - fromX;
    const dz = toZ - fromZ;
    agent.mesh.rotation.y = Math.atan2(dx, dz);
  }

  dispose() {
    for (const a of this.ambient) {
      if (a?.mesh) {
        // Ambients were registered into npcMeshes (SYS-04) — unregister
        // them so a disposed agent can't linger in the proximity loop.
        const idx = this.npcMeshes.indexOf(a.mesh);
        if (idx >= 0) this.npcMeshes.splice(idx, 1);
        this.scene.remove(a.mesh);
      }
    }
    this.ambient = [];
    this.named = {};
    this.routineState = {};
    this.overrides = {};
  }
}
