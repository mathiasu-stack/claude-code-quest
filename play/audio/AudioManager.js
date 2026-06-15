// AudioManager — single global audio surface for the game.
//
// Channel graph:
//   destination
//      ↑
//   limiter (DynamicsCompressor — stacked ceremony voices can't clip)
//      ↑
//   masterGain
//      ↑
//   ┌──────┬──────┬──────┬──────┬──────────┐
//  music   sfx    ui    voice   ambience
//   (music routes through one tier-driven highshelf — see setStoryTier)
//
// Public API surface (consumed by play.js, app.js, lesson.js, test.js):
//   AudioManager.shared() → singleton
//   .ensureUnlocked(eventTarget?)   – attach unlock listeners (auto-resume)
//   .isUnlocked()                   – has the context resumed?
//   .play(channel, builder, opts?)  – play a one-shot (builder receives a ctx)
//   .playSpatial(channel, builder, position) – panned at world position
//   .listenerPosition(x,y,z)        – update the listener (camera) location
//   .startMusic(name, url, fadeMs)  – crossfade to a new music track
//   .stopMusic(fadeMs)              – fade out current music
//   .setChannelVolume(name, 0..1)   – persisted
//   .setChannelMute(name, bool)     – persisted
//   .setMasterVolume(0..1)          – persisted
//   .setMasterMute(bool)            – persisted
//   .getPrefs()                     – {master, mute, channels:{...}}
//
// Persistence: localStorage key `ccq_audio_prefs`. Defaults if absent.
//
// Mobile guards:
//   • Context constructed lazily — only on first interaction.
//   • Voice pool capped (mobile: 8, desktop: 24). Steals oldest.
//   • Music files load with credentials:'omit' to be safe.

import { isMobile } from '../lighting/mobile.js';
import { createPianoPlayer } from './proceduralMusic.js?v=20260615b';

const PREFS_KEY = 'ccq_audio_prefs';
const CHANNEL_NAMES = ['music', 'sfx', 'ui', 'voice', 'ambience'];

const DEFAULT_PREFS = {
  master: 0.85,
  masterMute: false,
  channels: {
    music:    { volume: 0.55, mute: false },
    sfx:      { volume: 0.85, mute: false },
    ui:       { volume: 0.7,  mute: false },
    voice:    { volume: 0.8,  mute: false },
    ambience: { volume: 0.8,  mute: false },
  },
};

// Tier-driven highshelf on the music bus (AUDIO design pass). Neutral at
// T0–T3, gentle cut deepening through T4–T6, restored at T7 (resolution).
// Values are deliberately below the conscious-notice threshold.
const MUSIC_SHELF_DB = { 4: -1.5, 5: -2.8, 6: -4.5 };

let _shared = null;

export class AudioManager {
  static shared() {
    if (!_shared) _shared = new AudioManager();
    return _shared;
  }

  constructor() {
    this.ctx = null;
    this.master = null;
    this.channels = {}; // name -> { gain: GainNode, mute: bool, volume: 0..1 }
    this.unlocked = false;
    this.prefs = this._loadPrefs();
    this._unlockHandlers = null;

    // Music state
    this.music = {
      current: null, // { source, gain, name }
      next: null,    // during crossfade
      lastUrl: null,
    };

    // Voice pool — non-music sources for stealing on mobile
    this.voiceCap = isMobile() ? 8 : 24;
    this.voicePool = []; // [{node, channel, t}]
    this._missingMusicLogged = new Set();

    // Master limiter + tier-shift state (built lazily with the context)
    this.limiter = null;
    this.musicTierShelf = null;
    this._storyTier = 0;
  }

  // ── Prefs ─────────────────────────────────────────────────────────────────
  _loadPrefs() {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_PREFS));
      const parsed = JSON.parse(raw);
      // Merge with defaults so new channels added later still work.
      const merged = JSON.parse(JSON.stringify(DEFAULT_PREFS));
      if (typeof parsed.master === 'number') merged.master = parsed.master;
      if (typeof parsed.masterMute === 'boolean') merged.masterMute = parsed.masterMute;
      if (parsed.channels) {
        for (const k of CHANNEL_NAMES) {
          if (parsed.channels[k]) {
            if (typeof parsed.channels[k].volume === 'number') merged.channels[k].volume = parsed.channels[k].volume;
            if (typeof parsed.channels[k].mute === 'boolean') merged.channels[k].mute = parsed.channels[k].mute;
          }
        }
      }
      return merged;
    } catch {
      return JSON.parse(JSON.stringify(DEFAULT_PREFS));
    }
  }

  _savePrefs() {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(this.prefs)); } catch {}
  }

  getPrefs() { return JSON.parse(JSON.stringify(this.prefs)); }

  // ── Unlock / context lifecycle ────────────────────────────────────────────
  ensureUnlocked(target = document.body) {
    if (this.unlocked || this._unlockHandlers) return;
    const handler = () => {
      try {
        this._buildContext();
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      } catch (e) { /* ignored — silent */ }
      this.unlocked = !!this.ctx && this.ctx.state === 'running';
      if (this.unlocked) this._removeUnlockHandlers();
    };
    this._unlockHandlers = handler;
    ['pointerdown', 'touchstart', 'keydown', 'click'].forEach((evt) => {
      target.addEventListener(evt, handler, { once: false, passive: true });
    });
  }

  _removeUnlockHandlers() {
    if (!this._unlockHandlers) return;
    const h = this._unlockHandlers;
    ['pointerdown', 'touchstart', 'keydown', 'click'].forEach((evt) => {
      document.body.removeEventListener(evt, h);
    });
    this._unlockHandlers = null;
  }

  isUnlocked() { return this.unlocked; }

  _buildContext() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx({ latencyHint: isMobile() ? 'playback' : 'interactive' });

    // Master limiter — a brick-wall-ish compressor between the master
    // gain and the destination so stacked voices (ceremony: cheers +
    // fanfare + music) can never clip the output. Fast attack, high
    // ratio, threshold a touch under full-scale.
    this.limiter = this.ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -6;
    this.limiter.knee.value = 4;
    this.limiter.ratio.value = 12;
    this.limiter.attack.value = 0.003;
    this.limiter.release.value = 0.25;
    this.limiter.connect(this.ctx.destination);

    // master
    this.master = this.ctx.createGain();
    this.master.gain.value = this._effectiveMasterGain();
    this.master.connect(this.limiter);

    // channel buses. The music bus routes through ONE tier-driven
    // highshelf (neutral until T4) so late-story music reads slightly
    // duller without the player consciously noticing.
    for (const name of CHANNEL_NAMES) {
      const g = this.ctx.createGain();
      g.gain.value = this._effectiveChannelGain(name);
      if (name === 'music') {
        this.musicTierShelf = this.ctx.createBiquadFilter();
        this.musicTierShelf.type = 'highshelf';
        this.musicTierShelf.frequency.value = 2400;
        this.musicTierShelf.gain.value = MUSIC_SHELF_DB[this._storyTier] || 0;
        g.connect(this.musicTierShelf).connect(this.master);
      } else {
        g.connect(this.master);
      }
      this.channels[name] = { gain: g };
    }
  }

  // ── Story tier → music bus shelf ─────────────────────────────────────────
  // Called (throttled) from play.js. Safe before the context exists — the
  // tier is stored and applied when _buildContext runs.
  setStoryTier(tier) {
    const t = Math.max(0, Math.min(7, tier | 0));
    if (t === this._storyTier && this.musicTierShelf) return;
    this._storyTier = t;
    if (this.musicTierShelf && this.ctx) {
      const db = MUSIC_SHELF_DB[t] || 0;
      this.musicTierShelf.gain.setTargetAtTime(db, this.ctx.currentTime, 0.8);
    }
  }

  _effectiveMasterGain() {
    return this.prefs.masterMute ? 0 : Math.max(0, Math.min(1, this.prefs.master));
  }
  _effectiveChannelGain(name) {
    const c = this.prefs.channels[name];
    if (!c) return 0;
    return c.mute ? 0 : Math.max(0, Math.min(1, c.volume));
  }

  // ── Volume / mute setters ────────────────────────────────────────────────
  setMasterVolume(v) {
    this.prefs.master = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.setTargetAtTime(this._effectiveMasterGain(), this.ctx.currentTime, 0.02);
    this._savePrefs();
  }
  setMasterMute(m) {
    this.prefs.masterMute = !!m;
    if (this.master) this.master.gain.setTargetAtTime(this._effectiveMasterGain(), this.ctx.currentTime, 0.02);
    this._savePrefs();
  }
  setChannelVolume(name, v) {
    if (!this.prefs.channels[name]) return;
    this.prefs.channels[name].volume = Math.max(0, Math.min(1, v));
    if (this.channels[name]) {
      this.channels[name].gain.setTargetAtTime(this._effectiveChannelGain(name), this.ctx.currentTime, 0.02);
    }
    this._savePrefs();
  }
  setChannelMute(name, m) {
    if (!this.prefs.channels[name]) return;
    this.prefs.channels[name].mute = !!m;
    if (this.channels[name]) {
      this.channels[name].gain.setTargetAtTime(this._effectiveChannelGain(name), this.ctx.currentTime, 0.02);
    }
    this._savePrefs();
  }

  // ── Voice playback (procedural & spatial) ────────────────────────────────
  // builder: function(ctx, output) where you create + connect nodes; return
  // an object { stop(), node } so the manager can steal voices on mobile.
  play(channel, builder, opts = {}) {
    if (!this.unlocked) { this._buildContext(); }
    if (!this.ctx) return null;
    const bus = this.channels[channel];
    if (!bus) return null;
    // voice cap
    if (this.voicePool.length >= this.voiceCap) {
      const oldest = this.voicePool.shift();
      try { oldest.handle.stop?.(); } catch {}
    }
    const handle = builder(this.ctx, bus.gain, opts);
    if (handle) {
      const entry = { handle, channel, t: this.ctx.currentTime };
      this.voicePool.push(entry);
      // auto-cleanup after duration if provided
      if (opts.expectedDuration) {
        setTimeout(() => {
          const idx = this.voicePool.indexOf(entry);
          if (idx >= 0) this.voicePool.splice(idx, 1);
        }, (opts.expectedDuration + 0.2) * 1000);
      }
    }
    return handle;
  }

  // Spatial: builder must return { node, stop }. We wire output through a
  // PannerNode rather than direct to the channel gain.
  playSpatial(channel, builder, position, opts = {}) {
    if (!this.unlocked) { this._buildContext(); }
    if (!this.ctx) return null;
    const bus = this.channels[channel];
    if (!bus) return null;
    const panner = this.ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = opts.refDistance ?? 1.5;
    panner.maxDistance = opts.maxDistance ?? 30;
    panner.rolloffFactor = opts.rolloffFactor ?? 1.4;
    panner.positionX.value = position[0];
    panner.positionY.value = position[1];
    panner.positionZ.value = position[2];
    panner.connect(bus.gain);
    if (this.voicePool.length >= this.voiceCap) {
      const oldest = this.voicePool.shift();
      try { oldest.handle.stop?.(); } catch {}
    }
    const handle = builder(this.ctx, panner, opts);
    if (handle) {
      const entry = { handle, channel, t: this.ctx.currentTime };
      this.voicePool.push(entry);
      if (opts.expectedDuration) {
        setTimeout(() => {
          const idx = this.voicePool.indexOf(entry);
          if (idx >= 0) this.voicePool.splice(idx, 1);
          try { panner.disconnect(); } catch {}
        }, (opts.expectedDuration + 0.2) * 1000);
      }
    }
    return handle;
  }

  listenerPosition(x, y, z) {
    if (!this.ctx) return;
    const L = this.ctx.listener;
    if (L.positionX) {
      L.positionX.setTargetAtTime(x, this.ctx.currentTime, 0.05);
      L.positionY.setTargetAtTime(y, this.ctx.currentTime, 0.05);
      L.positionZ.setTargetAtTime(z, this.ctx.currentTime, 0.05);
    } else if (L.setPosition) {
      L.setPosition(x, y, z);
    }
  }

  // ── Music ────────────────────────────────────────────────────────────────
  // Fetches an audio file, decodes, starts as an AudioBufferSourceNode
  // routed to the music channel via its own GainNode for crossfade.
  async startMusic(name, url, fadeMs = 2500) {
    if (!url) { return this.stopMusic(fadeMs); }
    if (!this.unlocked) { this._buildContext(); }
    if (!this.ctx) return;
    if (this.music.lastUrl === url && this.music.current) return; // already playing this track

    let buf;
    try {
      const res = await fetch(url, { credentials: 'omit' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuf = await res.arrayBuffer();
      buf = await this.ctx.decodeAudioData(arrayBuf);
    } catch (err) {
      // Silent fallback: if file missing, stop existing music and bail.
      if (!this._missingMusicLogged.has(url)) {
        this._missingMusicLogged.add(url);
        // single-line console; not an error so dev console stays clean
        console.info(`[audio] no music file at ${url} (will play silently)`);
      }
      return this.stopMusic(fadeMs);
    }

    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const g = ctx.createGain();
    g.gain.value = 0;
    src.connect(g).connect(this.channels.music.gain);
    src.start(0);

    // Fade in new track
    const now = ctx.currentTime;
    const fade = fadeMs / 1000;
    g.gain.setTargetAtTime(1.0, now, fade / 3);

    // Fade out + stop old track
    if (this.music.current) {
      const old = this.music.current;
      old.gain.gain.setTargetAtTime(0, now, fade / 3);
      const stopAt = now + fade + 0.2;
      try { old.source.stop(stopAt); } catch {}
      setTimeout(() => {
        try { old.source.disconnect(); old.gain.disconnect(); } catch {}
      }, fadeMs + 400);
    }
    this.music.current = { source: src, gain: g, name };
    this.music.lastUrl = url;
  }

  // Procedural music track (chill 4-chord piano, no audio file). `spec`
  // is a key into PIANO_TRACKS ('reception'|'library'|'andante'|'workshop')
  // or a full track object. Routed through the same music channel gain as
  // streamed music, so the tier shelf + master limiter apply uniformly.
  startProceduralMusic(name, spec, fadeMs = 2500) {
    if (!this.unlocked) { this._buildContext(); }
    if (!this.ctx) return;
    // Already playing this procedural track — no-op (avoids restarting on
    // every zone re-entry).
    if (this.music.current?.procName === name) return;
    // Tear down whatever's playing (streamed or procedural).
    this.stopMusic(fadeMs);
    const player = createPianoPlayer(this.ctx, this.channels.music.gain, spec);
    player.start(fadeMs);
    this.music.current = { proc: player, procName: name, name };
    this.music.lastUrl = null;
  }

  stopMusic(fadeMs = 1500) {
    if (!this.ctx || !this.music.current) return;
    const ctx = this.ctx;
    const old = this.music.current;
    // Procedural track — has its own scheduler/teardown.
    if (old.proc) {
      try { old.proc.stop(fadeMs); } catch {}
      this.music.current = null;
      this.music.lastUrl = null;
      return;
    }
    const now = ctx.currentTime;
    const fade = Math.max(0.1, fadeMs / 1000);
    old.gain.gain.setTargetAtTime(0, now, fade / 3);
    try { old.source.stop(now + fade + 0.2); } catch {}
    setTimeout(() => {
      try { old.source.disconnect(); old.gain.disconnect(); } catch {}
    }, fadeMs + 400);
    this.music.current = null;
    this.music.lastUrl = null;
  }
}

export const audio = AudioManager.shared();
