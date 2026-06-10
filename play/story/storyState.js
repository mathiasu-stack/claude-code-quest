// storyState.js — Kedash Protocol narrative state (SYS-01).
//
// Tier is ALWAYS derived from test-pass state + scene-seen flags, never
// stored. Only scene/collectible/epilogue flags persist (localStorage
// key `ccq_story`), so resetting progress and reseeing tests replays
// the story correctly.

const STORY_KEY = 'ccq_story';

function emptyState() {
  return { scenesSeen: [], collectiblesRead: [], epilogue: false, flags: {} };
}

function load() {
  try {
    const raw = localStorage.getItem(STORY_KEY);
    if (!raw) return emptyState();
    const s = JSON.parse(raw);
    return {
      scenesSeen: Array.isArray(s.scenesSeen) ? s.scenesSeen : [],
      collectiblesRead: Array.isArray(s.collectiblesRead) ? s.collectiblesRead : [],
      epilogue: !!s.epilogue,
      flags: (s.flags && typeof s.flags === 'object') ? s.flags : {},
    };
  } catch (e) {
    return emptyState();
  }
}

function save(state) {
  try {
    localStorage.setItem(STORY_KEY, JSON.stringify(state));
  } catch (e) { /* storage full / private mode — story flags degrade gracefully */ }
}

let _state = load();

function passed(progress, testId) {
  return !!(window.Progress && progress && window.Progress.isTestPassed(progress, testId));
}

/**
 * Derive the current story tier (0–7) from progress. Monotonic ladder:
 * each tier requires all previous tiers. T3/T5/T7 additionally gate on
 * a story scene having been seen, so passing tests out of order can't
 * spoil later acts.
 */
export function deriveTier(progress) {
  let t = 0;
  if (passed(progress, 'ch01-test')) t = 1;
  if (t >= 1 && passed(progress, 'ch12-test')) t = 2;
  if (t >= 2 && passed(progress, 'ch04-test') && sceneSeen('twist1')) t = 3;
  if (t >= 3 && passed(progress, 'ch09-test')) t = 4;
  if (t >= 4 && passed(progress, 'ch10-test') && sceneSeen('twist2')) t = 5;
  if (t >= 5 && passed(progress, 'ch15-test')) t = 6;
  if (t >= 6 && passed(progress, 'ch16-test') && sceneSeen('finale')) t = 7;
  return t;
}

function currentProgress() {
  if (window.App && window.App.progress) return window.App.progress;
  return window.Progress ? window.Progress.load() : null;
}

export function getTier() {
  return deriveTier(currentProgress());
}

export function sceneSeen(id) {
  return _state.scenesSeen.includes(id);
}

export function markSceneSeen(id) {
  if (!_state.scenesSeen.includes(id)) {
    _state.scenesSeen.push(id);
    save(_state);
  }
}

export function collectibleRead(id) {
  return _state.collectiblesRead.includes(id);
}

export function markCollectibleRead(id) {
  if (!_state.collectiblesRead.includes(id)) {
    _state.collectiblesRead.push(id);
    save(_state);
  }
}

export function epilogueSeen() {
  return _state.epilogue;
}

export function markEpilogueSeen() {
  if (!_state.epilogue) {
    _state.epilogue = true;
    save(_state);
  }
}

export function getFlag(key) {
  return !!_state.flags[key];
}

export function setFlag(key) {
  if (!_state.flags[key]) {
    _state.flags[key] = true;
    save(_state);
  }
}

export function reset() {
  _state = emptyState();
  try { localStorage.removeItem(STORY_KEY); } catch (e) { /* ignore */ }
}

const Story = {
  deriveTier, getTier,
  sceneSeen, markSceneSeen,
  collectibleRead, markCollectibleRead,
  epilogueSeen, markEpilogueSeen,
  getFlag, setFlag,
  reset,
};

window.Story = Story;

export default Story;
