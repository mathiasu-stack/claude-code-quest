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

// Pick a system voice for a speaker profile { gender, lang, pitch, seed }.
//   gender — 'male' | 'female' | null (null → infer from pitch)
//   lang   — preferred accent like 'en-GB' / 'en-IN' (used only if the
//            platform actually has a matching voice; else falls back to
//            any English voice of the right gender)
//   seed   — a per-character integer (hash of the id) so DIFFERENT
//            same-gender characters get DIFFERENT voices even though most
//            NPCs share the default pitch of 1.0 (the old code keyed only
//            on pitch, so every default-pitch NPC got the identical voice).
// Returns { voice, matchedGender }. matchedGender is true when the chosen
// system voice's NAME actually reads as the requested gender — when it's
// false (common: platforms like Android Chrome expose a single un-gendered
// or female default), the caller compensates with a decisive pitch shift so
// a male character still sounds male.
function pickVoice(profile) {
  const voices = cachedVoices;
  if (!voices || !voices.length) return { voice: null, matchedGender: false };
  const pitch = (typeof profile.pitch === 'number') ? profile.pitch : 1.0;

  let enPool = voices.filter(v => /^en(-|_|$)/i.test(v.lang || ''));
  if (!enPool.length) enPool = voices.slice();

  // Real gender if we know it; otherwise infer from pitch (legacy).
  const wantFeminine = profile.gender
    ? (profile.gender === 'female')
    : (pitch >= 1.0);
  const matchGender = (v) => genderHint(v.name) === (wantFeminine ? 1 : -1);

  // Prefer the requested accent, but only when it yields a matching-gender
  // voice; otherwise drop the accent and use the whole English pool.
  let candidates = enPool.filter(matchGender);
  let matchedGender = candidates.length > 0;
  if (profile.lang) {
    const want = profile.lang.toLowerCase().replace('_', '-');
    const accent = enPool.filter(v =>
      (v.lang || '').toLowerCase().replace('_', '-').startsWith(want) && matchGender(v));
    if (accent.length) { candidates = accent; matchedGender = true; }
  }
  if (!candidates.length) candidates = enPool;

  // Deterministic, varied per character: combine the id seed with pitch so
  // two female western NPCs don't both land on the same voice.
  const seed = (Math.round((pitch + 0.0001) * 1000) + (profile.seed | 0)) >>> 0;
  return { voice: candidates[seed % candidates.length] || null, matchedGender };
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

// Simple string hash → small int, for per-character voice variety.
function hashSeed(s) {
  let h = 2166136261;
  for (let i = 0; i < (s || '').length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

// ─── Public: speak one line ──────────────────────────────────────────────────
// opts: { pitch, whisper, gender:'male'|'female', lang:'en-GB'|…, id:String }
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

    const { voice: v, matchedGender } = pickVoice({
      pitch: blipPitch,
      gender: opts.gender || null,
      lang: opts.lang || null,
      seed: hashSeed(opts.id || ''),
    });
    if (v) { u.voice = v; if (v.lang) u.lang = v.lang; }

    // Pitch strategy:
    //  • If we landed on a system voice whose NAME matches the requested
    //    gender, the timbre already does the work — keep pitch moderate so
    //    it doesn't sound chipmunk/robotic.
    //  • If we did NOT (e.g. the platform only offers an un-gendered/female
    //    default), the timbre is wrong, so shift pitch decisively: push male
    //    well below 1.0 to deepen it, female above 1.0 to brighten it. This
    //    is the lever that finally makes male characters stop sounding like
    //    a female American voice on single-voice platforms.
    if (opts.gender && !matchedGender) {
      u.pitch = opts.gender === 'male' ? 0.55 : 1.35;
    } else {
      const genderBias = opts.gender === 'female' ? 0.08 : (opts.gender === 'male' ? -0.08 : 0);
      u.pitch = Math.max(0.7, Math.min(1.3, blipPitch * 0.85 + 0.15 + genderBias));
    }
    // Slight per-character rate variation so same-voice characters differ.
    // Males also read a touch slower, which helps sell a deeper voice.
    const rateJitter = (((hashSeed(opts.id || '') % 14)) - 7) / 100; // -0.07..+0.06
    const maleSlow = (opts.gender === 'male' && !matchedGender) ? -0.06 : 0;
    u.rate = Math.max(0.82, Math.min(1.1, (opts.whisper ? 0.92 : 1.0) + rateJitter + maleSlow));
    // Follow the Voice slider (× master). Whisper lines a touch quieter.
    u.volume = effectiveVoiceVolume() * (opts.whisper ? 0.75 : 1.0);

    synth.speak(u);
  } catch {
    // SpeechSynthesis must never break dialogue.
  }
}

// Allow callers (e.g. dialogue teardown) to silence speech.
export function stopVoice() { cancelSpeech(); }
