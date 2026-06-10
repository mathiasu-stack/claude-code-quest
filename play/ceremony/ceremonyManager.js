// ceremonyManager.js — orchestrates the promotion ceremony when the
// player passes a chapter test.
//
// The ceremony is a coordinated sequence of:
//   1. Lock-in (input frozen, camera pulls back, cinematic angle)
//   2. Spotlight drop (vertical light shaft, gold dust swirl)
//   3. Accessory unveil (per-tier — see accessoryUnveil.js)
//   4. Title transition (3D card-flip — see titleTransition.js)
//   5. NPC announcement (turn-toward-player + congrats line)
//   6. Ambient celebration (clapping NPCs, confetti)
//   7. Dance (existing animation)
//   8. Toast + resume
//
// The previous "dance only" trigger was at sessionStorage `ccq_dance_for`.
// The promotion-fired guard at localStorage `ccq_promotion_fired` makes
// this a once-per-chapter event so re-entering a passed lesson doesn't
// re-fire.
//
// Public API (called from play.js):
//   const cer = new CeremonyManager(api);
//   cer.maybeStartFromFlag();        // on entering play, if the flag is set
//   cer.update(dt, now);             // each frame
//   cer.isActive();                  // gameplay code can check & lock input
//   cer.dispose();

import * as THREE from 'three';
import { unveilForTier } from './accessoryUnveil.js';
import { animateTitleTransition } from './titleTransition.js';
import { spawnNpcReactions, clearNpcReactions } from './npcReactions.js?v=20260610e';

const PROMOTION_KEY = 'ccq_promotion_fired';
const TIER_TITLES = [
  'Intern',          // 0
  'Junior Hire',     // 1
  'Associate',       // 2
  'Engineer',        // 3
  'Senior Engineer', // 4
  'Staff Engineer',  // 5
  'Principal',       // 6
  'Distinguished',   // 7
  'Director',        // 8
  'VP of AI',        // 9 — capstone
];

function loadFiredSet() {
  try {
    const raw = localStorage.getItem(PROMOTION_KEY);
    return new Set(JSON.parse(raw || '[]'));
  } catch { return new Set(); }
}
function saveFiredSet(set) {
  try { localStorage.setItem(PROMOTION_KEY, JSON.stringify([...set])); } catch {}
}

export class CeremonyManager {
  constructor(api) {
    // api must expose:
    //   getPlayer()            -> THREE.Group
    //   getCamera()
    //   getNpcMeshes()
    //   getScene()
    //   setInputLocked(bool)
    //   setDanceUntil(ms)      -> overrides existing dance trigger
    //   playerPromotionTier(t) -> rebuild player with tier accessories
    //   audio                  -> { playFanfare, playCheer, playPpPing }
    this.api = api;
    this.active = false;
    this.firedSet = loadFiredSet();
    this.timeline = []; // queued steps
    this.t0 = 0;
    this.spotlight = null;
    this.npcReactionState = null;
  }

  isActive() { return this.active; }

  // Called from play.js start(): reads sessionStorage 'ccq_promotion_for'
  // (set by test.js on a fresh pass) and either kicks off the ceremony
  // immediately or no-ops.
  maybeStartFromFlag() {
    let chapterId;
    try { chapterId = sessionStorage.getItem('ccq_promotion_for'); } catch {}
    if (!chapterId) return;
    sessionStorage.removeItem('ccq_promotion_for');
    if (this.firedSet.has(chapterId)) {
      // Already celebrated — show a small re-entry stinger instead.
      return;
    }
    this.start(chapterId);
  }

  start(chapterId) {
    if (this.active) return;
    if (this.firedSet.has(chapterId)) return;
    this.firedSet.add(chapterId);
    saveFiredSet(this.firedSet);

    this.active = true;
    this.t0 = performance.now();
    this.api.setInputLocked(true);

    // Compute new tier from completed chapter count (chapter id like 'ch01' → 1).
    const chNum = parseInt(chapterId.replace(/\D/g, ''), 10);
    const newTier = Math.min(chNum, TIER_TITLES.length - 1);
    const newTitle = TIER_TITLES[newTier] || TIER_TITLES[TIER_TITLES.length - 1];
    const isCapstone = chNum === 16;
    const isMilestone = (chNum === 5 || chNum === 10);

    const player = this.api.getPlayer();
    const scene = this.api.getScene();

    // ── Step 1: spotlight drop ─────────────────────────────────────────
    this._spawnSpotlight(scene, player.position);

    // ── Step 2: accessory unveil for this tier ────────────────────────
    const unveilHandle = unveilForTier(newTier, player, this.api.audio);

    // ── Step 3: title transition ───────────────────────────────────────
    const titleHandle = animateTitleTransition(player, newTitle, 1.2);

    // ── Step 4: NPC reactions (turn + clap nearby NPCs) ───────────────
    this.npcReactionState = spawnNpcReactions({
      scene, npcMeshes: this.api.getNpcMeshes(), playerPos: player.position,
      announceWith: this._announcerForChapter(chapterId),
      isCapstone,
    });

    // ── Step 5: kick off the dance via existing system after a delay ─
    const danceDelayMs = 1800 + (isMilestone ? 800 : 0) + (isCapstone ? 1500 : 0);
    setTimeout(() => {
      const danceLen = isCapstone ? 7000 : (isMilestone ? 5500 : 4500);
      this.api.setDanceUntil(performance.now() + danceLen);
    }, danceDelayMs);

    // ── Audio: fanfare ─────────────────────────────────────────────────
    try {
      this.api.audio.playFanfare();
      setTimeout(() => this.api.audio.playCheer(isCapstone ? 6 : 4), 600);
    } catch {}

    // ── Toast: "Promoted to ..."  ──────────────────────────────────────
    this._showPromotionToast(newTitle, isCapstone);

    // ── Resume after total ceremony length ────────────────────────────
    const totalLen = 6500 + (isMilestone ? 800 : 0) + (isCapstone ? 2500 : 0);
    setTimeout(() => this._end(), totalLen);
  }

  // FIN-06 — the VP-of-AI finale ceremony (§5.4). A separate, later event
  // from the per-chapter promotion path: triggered by the Maya scene
  // completing (FIN-05), never by ccq_promotion_for, so there is no
  // firedSet entry to collide with. opts:
  //   showBubbleFor(npcId, text)  — pops a speech bubble over a named NPC
  //   setPortraitCelebration(on)  — live hearts + plaque flip (R-7)
  //   script                      — window.STORY_FINALE ({ lines, inesLine })
  //   onDone()                    — fired after the ceremony fully ends
  startFinale({ showBubbleFor, setPortraitCelebration, script, onDone } = {}) {
    if (this.active) return;
    this.active = true;
    this.t0 = performance.now();
    this.api.setInputLocked(true);

    const player = this.api.getPlayer();
    const scene = this.api.getScene();
    this._spawnSpotlight(scene, player.position);
    unveilForTier(9, player, this.api.audio);
    animateTitleTransition(player, TIER_TITLES[9], 1.2);

    // Ragged, human, unsynced claps — the first uncued applause (§5.4).
    this.npcReactionState = spawnNpcReactions({
      scene, npcMeshes: this.api.getNpcMeshes(), playerPos: player.position,
      announceWith: null, isCapstone: true, desync: true, maxClappers: 9,
    });

    try {
      this.api.audio.playFanfare();
      setTimeout(() => this.api.audio.playCheer(8), 600);
    } catch {}
    this._showPromotionToast(TIER_TITLES[9], true);

    setTimeout(() => this.api.setDanceUntil(performance.now() + 8000), 1800);
    // Unlock early so the player can walk the crowd while the scripted
    // lines land; the ceremony stays "active" for update() ticks.
    setTimeout(() => { if (this.active) this.api.setInputLocked(false); }, 5200);

    // Portrait hearts ON CEREMONY TRIGGER, not at completion-state load.
    if (setPortraitCelebration) {
      setTimeout(() => { try { setPortraitCelebration(true); } catch {} }, 2600);
    }

    // Scripted crowd moments on a timeline. The last line is Maya's
    // "Two users on the box." echo — it lands tight on Marcus's.
    const lines = script?.lines || [];
    const firstAt = 3200, spacing = 3400;
    lines.forEach((ln, i) => {
      const at = firstAt + i * spacing - (i === lines.length - 1 ? 1700 : 0);
      setTimeout(() => {
        if (this.active && showBubbleFor) showBubbleFor(ln.npc, ln.text);
      }, at);
    });
    const inesAt = firstAt + lines.length * spacing + 600;
    if (script?.inesLine) {
      setTimeout(() => {
        if (this.active && showBubbleFor) showBubbleFor(script.inesLine.npc, script.inesLine.text);
      }, inesAt);
    }

    setTimeout(() => {
      if (!this.active) return;
      this._end();
      if (onDone) { try { onDone(); } catch (e) { console.warn('[finale] onDone failed', e); } }
    }, inesAt + 4800);
  }

  _end() {
    this.active = false;
    this.api.setInputLocked(false);
    if (this.spotlight) {
      this.api.getScene().remove(this.spotlight);
      this.spotlight.traverse(o => {
        o.geometry?.dispose?.();
        o.material?.dispose?.();
      });
      this.spotlight = null;
    }
    clearNpcReactions(this.npcReactionState);
    this.npcReactionState = null;
  }

  _spawnSpotlight(scene, position) {
    const g = new THREE.Group();
    g.position.set(position.x, 0, position.z);
    // Cone of warm light — additive blend reads as a beam.
    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(1.4, 8, 24, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xffe0a0, transparent: true, opacity: 0.32,
        blending: THREE.AdditiveBlending, depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    beam.position.y = 4.0;
    g.add(beam);
    // Floor halo
    const halo = new THREE.Mesh(
      new THREE.CircleGeometry(1.6, 32),
      new THREE.MeshBasicMaterial({
        color: 0xfff5d0, transparent: true, opacity: 0.55,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }),
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.02;
    g.add(halo);
    // Top-down point light for actual illumination
    const pt = new THREE.PointLight(0xffe0a0, 1.6, 8, 1.5);
    pt.position.set(0, 6, 0);
    g.add(pt);
    scene.add(g);
    this.spotlight = g;
  }

  _announcerForChapter(chapterId) {
    // Map chapter id → NPC id who gave the test (the NPC who will
    // deliver the congratulations line).
    const map = {
      ch01: 'sarah', ch02: 'noor',
      ch03: 'auto-ch03-test', ch04: 'auto-ch04-test', ch05: 'auto-ch05-test',
      ch06: 'auto-ch06-test', ch07: 'auto-ch07-test', ch08: 'auto-ch08-test',
      ch09: 'auto-ch09-test', ch10: 'auto-ch10-test', ch11: 'auto-ch11-test',
      ch12: 'auto-ch12-test', ch13: 'auto-ch13-test', ch14: 'auto-ch14-test',
      ch15: 'auto-ch15-test', ch16: 'auto-ch16-test',
    };
    return map[chapterId] || null;
  }

  _showPromotionToast(title, isCapstone) {
    const toast = document.createElement('div');
    toast.className = 'play-toast play-promotion-toast';
    toast.innerHTML = `
      <div class="prom-eyebrow">${isCapstone ? '🏆 CAPSTONE' : '🎓 PROMOTION'}</div>
      <div class="prom-title">${title}</div>
    `;
    const host = document.getElementById('play-canvas-host')?.parentElement
              || document.body;
    host.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 60);
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 500);
    }, 5500);
  }

  update(dt, now) {
    if (!this.active) return;
    // Spotlight pulse
    if (this.spotlight) {
      const t = (now - this.t0) * 0.001;
      this.spotlight.children.forEach((c) => {
        if (c.isMesh && c.material?.opacity !== undefined) {
          // Subtle flicker
          c.material.opacity = c.material.opacity; // no-op, keep stable
        }
      });
      // Slight rotation of the cone for kinetic feel
      this.spotlight.rotation.y = t * 0.4;
    }
    if (this.npcReactionState) {
      // npcReactions module ticks itself when given dt
      this.npcReactionState.update?.(dt, now);
    }
  }

  dispose() {
    if (this.active) this._end();
  }
}

export function tierTitleFor(tier) {
  return TIER_TITLES[Math.min(tier, TIER_TITLES.length - 1)];
}
