// src/components/playerbar/PlayerVolume.ts
// Volume slider with mute toggle — wraps audioEngine volume controls

import { ICON_VOLUME, ICON_MUTE } from '../../config/icons.js';
import { audioEngine } from '../../core/audioEngine.js';

function updateIcon(btn: HTMLButtonElement, vol: number): void {
  btn.innerHTML = vol === 0 ? ICON_MUTE : ICON_VOLUME;
}

export function createPlayerVolume(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'player-volume';

  const iconBtn = document.createElement('button');
  iconBtn.className = 'player-btn player-volume-icon';
  iconBtn.innerHTML = audioEngine.audio.muted ? ICON_MUTE : ICON_VOLUME;

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.className = 'player-volume-slider';
  slider.min = '0';
  slider.max = '100';
  slider.value = audioEngine.audio.muted ? '0' : String(audioEngine.audio.volume * 100);
  slider.style.setProperty('--vol-pct', `${slider.value}%`);

  iconBtn.addEventListener('click', () => {
    audioEngine.audio.muted = !audioEngine.audio.muted;
    const displayVol = audioEngine.audio.muted ? 0 : audioEngine.audio.volume * 100;
    slider.value = String(displayVol);
    slider.style.setProperty('--vol-pct', `${displayVol}%`);
    updateIcon(iconBtn, displayVol);
  });

  slider.addEventListener('input', () => {
    const vol = parseFloat(slider.value) / 100;
    audioEngine.audio.volume = vol;
    audioEngine.audio.muted = vol === 0;
    slider.style.setProperty('--vol-pct', `${slider.value}%`);
    updateIcon(iconBtn, vol);
  });

  wrap.append(iconBtn, slider);
  return wrap;
}
