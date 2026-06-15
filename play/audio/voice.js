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
const FEMALE_HINTS = ['female', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'fiona', 'zira', 'susan', 'allison', 'ava', 'kate', 'serena', 'amelie', 'anna', 'paulina', 'google uk english female', 'google us english',
  // Edge / Azure "Natural" + other neural female voice names
  'aria', 'jenny', 'michelle', 'ana', 'natasha', 'clara', 'sonia', 'libby', 'maisie', 'emma', 'nova', 'jane', 'nancy', 'amber', 'ashley', 'cora', 'elizabeth', 'monica', 'sara', 'hazel', 'heera', 'catherine', 'neerja', 'yan'];
const MALE_HINTS = ['male', 'daniel', 'alex', 'fred', 'tom', 'oliver', 'rishi', 'david', 'mark', 'google uk english male', 'aaron', 'arthur', 'gordon',
  // Edge / Azure "Natural" + other neural male voice names
  'guy', 'davis', 'tony', 'jason', 'andrew', 'brian', 'christopher', 'eric', 'jacob', 'roger', 'steffan', 'ryan', 'thomas', 'william', 'liam', 'adam', 'ethan', 'prabhat', 'george', 'james', 'paul', 'richard', 'sean', 'wayne'];
function genderHint(name) {
  const n = (name || '').toLowerCase();
  for (const h of FEMALE_HINTS) if (n.includes(h)) return 1;
  for (const h of MALE_HINTS) if (n.includes(h)) return -1;
  return 0;
}

// Higher = more natural-sounding. Network/neural voices (Edge "Natural",
// Google network, Apple Siri/enhanced) sound dramatically closer to
// Alexa/ChatGPT than the old local "compact"/eSpeak/"Desktop" voices, so
// we rank them up and the robotic ones down.
function qualityScore(v) {
  const n = (v.name || '').toLowerCase();
  let s = 0;
  if (v.localService === false) s += 5;        // cloud/network voice
  if (n.includes('natural')) s += 7;
  if (n.includes('neural')) s += 7;
  if (n.includes('online')) s += 4;
  if (n.includes('siri')) s += 5;
  if (n.includes('enhanced') || n.includes('premium')) s += 4;
  if (n.includes('google')) s += 3;
  if (n.includes('compact') || n.includes('espeak') || n.includes('desktop')) s -= 5;
  return s;
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

  // Rank by naturalness first, then pick deterministically WITHIN the best
  // quality tier so a character always sounds the same yet two same-gender
  // NPCs still differ when several top-tier voices exist.
  let best = -Infinity;
  for (const v of candidates) best = Math.max(best, qualityScore(v));
  const topTier = candidates.filter(v => qualityScore(v) >= best - 1);
  const pool = topTier.length ? topTier : candidates;

  const seed = (Math.round((pitch + 0.0001) * 1000) + (profile.seed | 0)) >>> 0;
  const voice = pool[seed % pool.length] || null;
  return { voice, matchedGender, quality: voice ? qualityScore(voice) : 0 };
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

// ─── Cloud neural TTS (Azure) ────────────────────────────────────────────────
// When the server's /tts endpoint is configured with an Azure key, we play
// genuinely human neural voices instead of the on-device Web Speech voices.
// If the endpoint is unconfigured/unreachable we fall back to local speech, so
// the game still works offline / with no key.
const CLOUD_LS_KEY = 'ccq_voice_cloud';
let cloudPref = (() => {
  try {
    const raw = localStorage.getItem(CLOUD_LS_KEY);
    if (raw === null) return true; // default: use cloud when available
    return raw === '1' || raw === 'true';
  } catch { return true; }
})();
let cloudDisabledThisSession = false; // set after a 503 so we stop retrying
let _cloudAudio = null;               // current HTMLAudioElement
let _speakToken = 0;                  // guards against stale async responses

export function isCloudVoiceEnabled() { return cloudPref; }
export function setCloudVoiceEnabled(on) {
  cloudPref = !!on;
  try { localStorage.setItem(CLOUD_LS_KEY, cloudPref ? '1' : '0'); } catch {}
  if (!cloudPref) cancelSpeech();
}

// Map a character profile → an Azure neural voice. The accent (profile.lang,
// derived from the rig's ethnicity in play.js voiceProfileFor) picks the voice
// LOCALE so a South-Asian rig sounds Indian-English, etc.; gender picks within
// it; the id seed keeps a character consistent yet distinct from same-bucket peers.
const AZ_VOICES = {
  'en-US': { male: ['en-US-AndrewNeural', 'en-US-GuyNeural', 'en-US-BrianNeural', 'en-US-DavisNeural'],
             female: ['en-US-AriaNeural', 'en-US-JennyNeural', 'en-US-MichelleNeural', 'en-US-AvaNeural'] },
  'en-GB': { male: ['en-GB-RyanNeural', 'en-GB-ThomasNeural'],
             female: ['en-GB-SoniaNeural', 'en-GB-LibbyNeural'] },
  'en-IN': { male: ['en-IN-PrabhatNeural'], female: ['en-IN-NeerjaNeural'] },
  'en-NG': { male: ['en-NG-AbeoNeural'], female: ['en-NG-EzinneNeural'] },
  'en-HK': { male: ['en-HK-SamNeural'], female: ['en-HK-YanNeural'] },
};
function azureVoiceFor(opts) {
  const bucket = AZ_VOICES[opts.lang] || AZ_VOICES['en-US'];
  const g = opts.gender === 'male' ? 'male' : 'female'; // unknown → female
  const list = bucket[g] || bucket.female || bucket.male;
  const seed = hashSeed((opts.id || '') + g);
  return list[seed % list.length];
}

// Returns true if it kicked off a cloud playback attempt (which may still
// fall back to local on network failure). Returns false to signal "use local
// straight away" (cloud off / disabled / unsupported).
function speakCloud(spoken, opts, token) {
  if (!cloudPref || cloudDisabledThisSession) return false;
  if (typeof fetch !== 'function' || typeof Audio === 'undefined') return false;
  const voice = azureVoiceFor(opts);
  fetch('/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: spoken, voice }),
  }).then((r) => {
    if (r.status === 503) { cloudDisabledThisSession = true; throw new Error('tts-unconfigured'); }
    if (!r.ok) throw new Error('tts-' + r.status);
    return r.blob();
  }).then((blob) => {
    if (token !== _speakToken) return;            // a newer line started
    if (!enabled || !audioAllowsVoice()) return;  // muted in the meantime
    const url = URL.createObjectURL(blob);
    const a = new Audio(url);
    a.volume = effectiveVoiceVolume() * (opts.whisper ? 0.75 : 1.0);
    a.addEventListener('ended', () => URL.revokeObjectURL(url));
    _cloudAudio = a;
    a.play().catch(() => { /* autoplay/interrupt — ignore */ });
  }).catch(() => {
    // Network/credential failure → degrade gracefully to local speech.
    if (token === _speakToken) speakLocal(spoken, opts);
  });
  return true;
}

function cancelSpeech() {
  try { window.speechSynthesis?.cancel(); } catch {}
  try { if (_cloudAudio) { _cloudAudio.pause(); _cloudAudio = null; } } catch {}
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
// Tries cloud neural TTS first (human voices); falls back to the on-device
// Web Speech voices if the cloud endpoint is off/unreachable.
export function speakLine(text, opts = {}) {
  if (!enabled) return;
  try {
    if (!audioAllowsVoice()) return;
    const spoken = cleanForSpeech(text);
    if (!spoken) return;

    // New line → bump the token and stop anything still playing so rapid
    // line changes / skipping the typewriter don't stack overlapping speech.
    const token = ++_speakToken;
    cancelSpeech();

    if (speakCloud(spoken, opts, token)) return; // cloud attempt in flight
    speakLocal(spoken, opts);
  } catch {
    // Voice must never break dialogue.
  }
}

// On-device Web Speech fallback (and the path when cloud is disabled).
function speakLocal(spoken, opts = {}) {
  try {
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;
    if (!enabled || !audioAllowsVoice()) return;

    // Lazily ensure we have the latest voice list.
    if (!cachedVoices.length) refreshVoices();

    const blipPitch = (typeof opts.pitch === 'number' && isFinite(opts.pitch)) ? opts.pitch : 1.0;

    const u = new SpeechSynthesisUtterance(spoken);

    const { voice: v, matchedGender, quality } = pickVoice({
      pitch: blipPitch,
      gender: opts.gender || null,
      lang: opts.lang || null,
      seed: hashSeed(opts.id || ''),
    });
    if (v) { u.voice = v; if (v.lang) u.lang = v.lang; }

    // Pitch strategy — pitch-shifting is the #1 cause of "robotic", so do as
    // little of it as we can get away with:
    //  • Right-gender voice found → keep pitch essentially natural (tiny bias).
    //  • No gender match but the voice is high quality (neural/network) →
    //    only a GENTLE shift; these voices stay natural through ±0.15.
    //  • No gender match AND a low-quality local voice → last-resort stronger
    //    shift so a male at least reads male (accept some artificiality).
    if (opts.gender && !matchedGender) {
      const gentle = quality >= 4; // neural / network voice tolerates less shift
      if (opts.gender === 'male')   u.pitch = gentle ? 0.82 : 0.6;
      else                          u.pitch = gentle ? 1.18 : 1.32;
    } else {
      const genderBias = opts.gender === 'female' ? 0.05 : (opts.gender === 'male' ? -0.05 : 0);
      u.pitch = Math.max(0.85, Math.min(1.15, 1.0 + genderBias));
    }
    // Slight per-character rate variation so same-voice characters differ.
    const rateJitter = (((hashSeed(opts.id || '') % 14)) - 7) / 100; // -0.07..+0.06
    u.rate = Math.max(0.9, Math.min(1.08, (opts.whisper ? 0.94 : 1.0) + rateJitter));
    // Follow the Voice slider (× master). Whisper lines a touch quieter.
    u.volume = effectiveVoiceVolume() * (opts.whisper ? 0.75 : 1.0);

    synth.speak(u);
  } catch {
    // SpeechSynthesis must never break dialogue.
  }
}

// Allow callers (e.g. dialogue teardown) to silence speech.
export function stopVoice() { cancelSpeech(); }
