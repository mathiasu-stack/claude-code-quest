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
    waypoints: [
      { pos: [6, -3], face: -Math.PI / 2, dwell: 25 },     // her desk
      { pos: [3, 8], face: 0, dwell: 4 },                  // doorway to library
      { pos: [0, 18], face: Math.PI, dwell: 12 },          // inside library
      { pos: [3, 8], face: Math.PI, dwell: 3 },            // back through door
      { pos: [6, -3], face: -Math.PI / 2, dwell: 40 },     // back to desk
    ],
    speed: 1.4,
  },
  // Linda is special — she greets the door instead of pathing.
};

export class LiveAgents {
  constructor({ scene, npcMeshes, makeCharacter, isMobile }) {
    this.scene = scene;
    this.npcMeshes = npcMeshes;
    this.makeCharacter = makeCharacter;
    this.mobile = isMobile;

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
    const look = {
      skin: skinTones[seed % skinTones.length],
      hair: 0x3e2723, hairStyle: seed % 2 ? 'short' : 'long',
      shirt: palettes[seed % palettes.length], pants: 0x37474f,
      face: 'dot', expression: 'neutral',
    };
    const mesh = this.makeCharacter(look);
    // Spawn in Library so they don't crowd Reception.
    mesh.position.set(-7 + (seed % 3) * 2, 0, 18 + (seed % 2) * 6);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(mesh);
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
    const baseX = -6 + (seed % 3) * 4;
    const baseZ = 14 + (seed % 4) * 4;
    for (let i = 0; i < 4; i++) {
      wp.push({
        pos: [
          baseX + (i % 2) * 6 - 3,
          baseZ + (i < 2 ? 0 : 6) + Math.random() * 2,
        ],
        face: (i % 4) * (Math.PI / 2),
        dwell: 5 + (seed * 3 + i) % 4,
      });
    }
    return wp;
  }

  update(dt, now, playerPos) {
    // Run routines for named NPCs
    for (const [id, routine] of Object.entries(ROUTINES)) {
      const npc = this.named[id];
      if (!npc) continue;
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

    // Ambient agents
    for (const a of this.ambient) {
      if (!a) continue;
      this._stepAgent(a, dt);
    }
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
        this.scene.remove(a.mesh);
      }
    }
    this.ambient = [];
    this.named = {};
    this.routineState = {};
  }
}
