// Character voices via the browser Web Speech API (SpeechSynthesis).
//
// Zero assets, zero licensing — matches the game's procedural-audio
// philosophy. Every spoken line in the game flows through play.js
// startTypewriter(), which calls speakLine() here.
//
// The per-character "voice" is derived from the same blip pitch the
// typewriter already uses (blipPitchForNpc in procedural.js): higher
// pitch → higher utterance pitch + a higher/female-sounding system
// voice when the platform exposes gender hints; lower → deeper. The
// mapping is deterministic so a character always sounds the same.

import { audio } from './AudioManager.js?v=20260615b';

const LS_KEY = 'ccq_voice_enabled';

// Default ENABLED: the user explicitly asked for character voices.
// The OFF toggle lives in the in-world audio settings panel.
let enabled = (() => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw === null) return true; // default on
    return raw === '1' || raw === 'true';
  } catch { return true; }
})();

export function isVoiceEnabled() { return enabled; }
export function setVoiceEnabled(on) {
  enabled = !!on;
  try { localStorage.setItem(LS_KEY, enabled ? '1' : '0'); } catch {}
  // Stop anything currently mid-utterance when turning off.
  if (!enabled) cancelSpeech();
}

// ─── Voice list (loads async on most browsers) ───────────────────────────────
let cachedVoices = [];
function refreshVoices() {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const v = synth.getVoices();
    if (v && v.length) cachedVoices = v;
  } catch {}
}
// Prime now + on the async 'voiceschanged' event. getVoices() is empty
// until that fires on Chrome/Safari; until then we speak with the
// platform default voice rather than dropping the line.
try {
  if (window.speechSynthesis) {
    refreshVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
  }
} catch {}

// Heuristic: does this voice name read as feminine? Platforms don't
// expose a reliable gender field, but names often hint. Returns
// 1 (feminine), -1 (masculine), 0 (unknown).
const FEMALE_HINTS = ['female', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'fiona', 'zira', 'susan', 'allison', 'ava', 'kate', 'serena', 'amelie', 'anna', 'paulina', 'google uk english female', 'google us english'];
const MALE_HINTS = ['male', 'daniel', 'alex', 'fred', 'tom', 'oliver', 'rishi', 'david', 'mark', 'google uk english male', 'aaron', 'arthur', 'gordon'];
function genderHint(name) {
  const n = (name || '').toLowerCase();
  for (const h of FEMALE_HINTS) if (n.includes(h)) return 1;
  for (const h of MALE_HINTS) if (n.includes(h)) return -1;
  return 0;
}

// Pick a system voice deterministically from a numeric key (the pitch).
// English voices preferred; bias toward gendered voices that match the
// pitch (higher → feminine). Falls back to plain deterministic indexing
// so each character still gets a stable, distinct voice.
function pickVoice(pitch) {
  const voices = cachedVoices;
  if (!voices || !voices.length) return null;

  // Prefer en-* voices; if none, use everything.
  let pool = voices.filter(v => /^en(-|_|$)/i.test(v.lang || ''));
  if (!pool.length) pool = voices.slice();

  const wantFeminine = pitch >= 1.0;
  const gendered = pool.filter(v => genderHint(v.name) === (wantFeminine ? 1 : -1));
  const candidates = gendered.length ? gendered : pool;

  // Deterministic index from the pitch so a given character is stable.
  // Spread distinct pitches across the candidate list.
  const seed = Math.round((pitch + 0.0001) * 1000);
  const idx = seed % candidates.length;
  return candidates[idx] || null;
}

// ─── Text cleanup ────────────────────────────────────────────────────────────
// Strip what shouldn't be spoken: stage directions in parens, surrounding
// quotes, leaked markdown/HTML, collapse whitespace.
export function cleanForSpeech(raw) {
  if (raw == null) return '';
  let t = String(raw);
  // Strip HTML tags if any leak in.
  t = t.replace(/<[^>]*>/g, ' ');
  // Decode a couple of common entities.
  t = t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  // Remove stage directions: ( ... ) and [ ... ] and * ... * (markdown emphasis used as action).
  t = t.replace(/\([^)]*\)/g, ' ');
  t = t.replace(/\[[^\]]*\]/g, ' ');
  t = t.replace(/\*[^*]+\*/g, ' ');
  // Strip leftover markdown emphasis/code markers.
  t = t.replace(/[*_`#>]/g, ' ');
  // Strip surrounding quote marks (straight + curly).
  t = t.replace(/[“”"‘’']/g, ' ');
  // Collapse whitespace.
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

function cancelSpeech() {
  try { window.speechSynthesis?.cancel(); } catch {}
}

// True if the dedicated TTS flag is on AND the AudioManager 'voice'
// channel (and master) aren't muted — so the existing Voice mute in the
// settings panel also silences TTS.
function audioAllowsVoice() {
  try {
    const prefs = audio.getPrefs();
    if (!prefs) return true;
    if (prefs.masterMute) return false;
    const ch = prefs.channels?.voice;
    if (ch && ch.mute) return false;
  } catch {}
  return true;
}

// TTS goes through the browser's SpeechSynthesis, NOT the Web Audio
// graph, so the Voice channel's GAIN node can't touch it. Mirror that
// slider onto the utterance.volume instead: effective = master × voice.
// This is what makes the Voice dial actually change spoken-line loudness.
function effectiveVoiceVolume() {
  try {
    const prefs = audio.getPrefs();
    if (!prefs) return 0.95;
    const master = (typeof prefs.master === 'number') ? prefs.master : 0.85;
    const ch = prefs.channels?.voice;
    const chVol = (ch && typeof ch.volume === 'number') ? ch.volume : 0.8;
    return Math.max(0, Math.min(1, master * chVol));
  } catch { return 0.95; }
}

// ─── Public: speak one line ──────────────────────────────────────────────────
// opts: { pitch:Number (typewriter blip pitch, ~0.78–1.2), whisper:Bool }
export function speakLine(text, opts = {}) {
  if (!enabled) return;
  try {
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;
    if (!audioAllowsVoice()) return;

    const spoken = cleanForSpeech(text);
    if (!spoken) return;

    // Lazily ensure we have the latest voice list.
    if (!cachedVoices.length) refreshVoices();

    // Cancel any in-flight utterance so rapid line changes / skipping the
    // typewriter don't stack overlapping speech.
    cancelSpeech();

    const blipPitch = (typeof opts.pitch === 'number' && isFinite(opts.pitch)) ? opts.pitch : 1.0;

    const u = new SpeechSynthesisUtterance(spoken);
    // Map blip pitch (~0.7–1.6) → utterance.pitch (clamp 0.6–1.4).
    u.pitch = Math.max(0.6, Math.min(1.4, blipPitch));
    // Slight per-character rate variation (~0.95–1.08) so distinct.
    const rateJitter = ((Math.round(blipPitch * 100) % 14) - 7) / 100; // -0.07..+0.06
    u.rate = Math.max(0.9, Math.min(1.1, (opts.whisper ? 0.92 : 1.0) + rateJitter));
    // Follow the Voice slider (× master). Whisper lines a touch quieter.
    u.volume = effectiveVoiceVolume() * (opts.whisper ? 0.75 : 1.0);

    const v = pickVoice(blipPitch);
    if (v) { u.voice = v; if (v.lang) u.lang = v.lang; }

    synth.speak(u);
  } catch {
    // SpeechSynthesis must never break dialogue.
  }
}

// Allow callers (e.g. dialogue teardown) to silence speech.
export function stopVoice() { cancelSpeech(); }
