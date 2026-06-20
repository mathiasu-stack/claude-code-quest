// Audio settings panel — small floating gear button + popover with
// master / per-channel volume sliders + mute toggles.
//
// Mounts on demand via mountAudioSettings(parent). Idempotent (safe to
// call repeatedly — re-uses existing DOM if already present).

import { audio } from './AudioManager.js?v=20260615b';
import { stopAmbience } from './ambience.js?v=20260615b';
import { isVoiceEnabled, setVoiceEnabled, isCloudVoiceEnabled, setCloudVoiceEnabled } from './voice.js?v=20260615h';

const PANEL_ID = 'play-audio-panel';
const BUTTON_ID = 'play-audio-gear';

function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else e.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return e;
}

function row(labelText, value, mute, onValueInput, onMuteToggle) {
  const slider = el('input', {
    type: 'range', min: '0', max: '100', step: '1',
    value: String(Math.round(value * 100)),
    class: 'aud-range',
  });
  slider.addEventListener('input', () => onValueInput(slider.valueAsNumber / 100));
  const muteBtn = el('button', { class: `aud-mute ${mute ? 'on' : ''}`, type: 'button' });
  muteBtn.textContent = mute ? '🔇' : '🔊';
  muteBtn.addEventListener('click', () => {
    const next = !muteBtn.classList.contains('on');
    muteBtn.classList.toggle('on', next);
    muteBtn.textContent = next ? '🔇' : '🔊';
    onMuteToggle(next);
  });
  return el('div', { class: 'aud-row' }, [
    el('div', { class: 'aud-label' }, [labelText]),
    slider,
    muteBtn,
  ]);
}

// A simple on/off row matching the channel rows, reusing the mute-button
// styling for the toggle. Used for the spoken-line (TTS) preference.
function toggleRow(labelText, isOn, onToggle) {
  const btn = el('button', { class: `aud-mute ${isOn ? '' : 'on'}`, type: 'button' });
  const paint = (on) => { btn.classList.toggle('on', !on); btn.textContent = on ? 'ON' : 'OFF'; };
  paint(isOn);
  btn.addEventListener('click', () => {
    const next = btn.textContent === 'OFF';
    paint(next);
    onToggle(next);
  });
  return el('div', { class: 'aud-row' }, [
    el('div', { class: 'aud-label' }, [labelText]),
    el('div', { class: 'aud-range' }, []), // spacer to align with slider column
    btn,
  ]);
}

export function mountAudioSettings(parent) {
  if (!parent) parent = document.body;
  if (document.getElementById(PANEL_ID) || document.getElementById(BUTTON_ID)) return;

  const prefs = audio.getPrefs();

  // Floating gear button
  const gear = el('button', { id: BUTTON_ID, class: 'play-audio-gear', type: 'button', 'aria-label': 'Audio settings' });
  gear.textContent = '⚙';
  parent.appendChild(gear);

  // Popover (hidden by default)
  const panel = el('div', { id: PANEL_ID, class: 'play-audio-panel hidden' });
  parent.appendChild(panel);

  function rebuild() {
    panel.innerHTML = '';
    const p = audio.getPrefs();
    panel.appendChild(el('div', { class: 'aud-title' }, ['Audio']));

    panel.appendChild(row(
      'Master', p.master, p.masterMute,
      v => audio.setMasterVolume(v),
      m => audio.setMasterMute(m),
    ));
    for (const channel of ['music', 'sfx', 'ui', 'voice', 'ambience']) {
      const c = p.channels[channel];
      panel.appendChild(row(
        cap(channel), c.volume, c.mute,
        v => audio.setChannelVolume(channel, v),
        m => audio.setChannelMute(channel, m),
      ));
    }

    // Character voices (Web Speech API TTS) on/off — gated separately from
    // the 'voice' channel volume above (muting Voice also silences TTS).
    panel.appendChild(toggleRow(
      '🗣 Character voices',
      isVoiceEnabled(),
      (on) => setVoiceEnabled(on),
    ));

    // Neural (cloud) voices vs the on-device fallback. ON = human-sounding
    // Azure voices (needs the server key; small per-line cost, cached).
    panel.appendChild(toggleRow(
      '✨ Natural voice (cloud)',
      isCloudVoiceEnabled(),
      (on) => setCloudVoiceEnabled(on),
    ));

    // Footstep SFX attribution (CC-BY 3.0 requires a visible credit).
    panel.appendChild(el('div', { class: 'aud-credits' }, [
      'Footstep SFX: “Footsteps on different surfaces” by congusbongus (',
      el('a', { href: 'https://opengameart.org/content/footsteps-on-different-surfaces', target: '_blank', rel: 'noopener' }, ['OpenGameArt']),
      ', CC-BY 3.0) — from freesound recordings by swuing, ceberation & Eelke.',
    ]));

    const close = el('button', { class: 'aud-close', type: 'button' }, ['Close']);
    close.addEventListener('click', () => panel.classList.add('hidden'));
    panel.appendChild(close);
  }
  rebuild();

  gear.addEventListener('click', () => {
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) {
      rebuild(); // reflect any external changes
    }
  });

  // Click outside closes
  document.addEventListener('pointerdown', (e) => {
    if (panel.classList.contains('hidden')) return;
    if (panel.contains(e.target) || gear.contains(e.target)) return;
    panel.classList.add('hidden');
  });
}

export function unmountAudioSettings() {
  document.getElementById(BUTTON_ID)?.remove();
  document.getElementById(PANEL_ID)?.remove();
  // The ambience bed's lifecycle is tied to play mode. play.js stop()
  // calls this unmount in its audio-teardown cluster (right after
  // stopMusic / updateServerHum(false)), so this is the one hook that
  // guarantees the roomtone never outlives the 3D view.
  try { stopAmbience(800); } catch {}
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
