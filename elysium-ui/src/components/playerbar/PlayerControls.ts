// src/components/playerbar/PlayerControls.ts
// Play/pause, rewind/forward, progress bar — core transport controls

import { ICON_PLAY, ICON_PAUSE, ICON_BACK, ICON_FORWARD } from '../../config/icons.js';
import * as playback from './services/playbackService.js';

function formatTime(sec: number): string {
  if (!sec || !isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function createPlayerControls(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'player-controls';

  const transport = document.createElement('div');
  transport.className = 'player-transport';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'player-btn';
  prevBtn.innerHTML = ICON_BACK;
  prevBtn.addEventListener('click', playback.rewind10);

  const playBtn = document.createElement('button');
  playBtn.className = 'player-btn player-btn-play';
  playBtn.innerHTML = ICON_PLAY;
  playBtn.addEventListener('click', playback.togglePlay);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'player-btn';
  nextBtn.innerHTML = ICON_FORWARD;
  nextBtn.addEventListener('click', playback.fastForward);

  transport.append(prevBtn, playBtn, nextBtn);

  const progressWrap = document.createElement('div');
  progressWrap.className = 'player-progress-wrap';

  const timeCurrent = document.createElement('span');
  timeCurrent.className = 'player-time';

  const progressTrack = document.createElement('div');
  progressTrack.className = 'player-progress-track';

  const progressFill = document.createElement('div');
  progressFill.className = 'player-progress-fill';

  const progressInput = document.createElement('input');
  progressInput.type = 'range';
  progressInput.className = 'player-progress-input';
  progressInput.min = '0';
  progressInput.max = '100';
  progressInput.value = '0';
  progressInput.addEventListener('input', () => {
    const dur = playback.getState().duration;
    playback.seekTo((parseFloat(progressInput.value) / 100) * dur);
  });

  progressTrack.append(progressFill, progressInput);

  const timeTotal = document.createElement('span');
  timeTotal.className = 'player-time';

  progressWrap.append(timeCurrent, progressTrack, timeTotal);
  wrap.append(transport, progressWrap);

  playback.subscribe((s) => {
    playBtn.innerHTML = s.isPlaying ? ICON_PAUSE : ICON_PLAY;
    const pct = s.duration ? (s.currentTime / s.duration) * 100 : 0;
    progressInput.value = pct.toString();
    progressFill.style.width = `${pct}%`;
    timeCurrent.textContent = formatTime(s.currentTime);
    timeTotal.textContent = formatTime(s.duration);
  });

  return wrap;
}
