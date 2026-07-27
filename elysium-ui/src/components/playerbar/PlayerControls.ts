// src/components/playerbar/PlayerControls.ts
// Play/pause, prev/next, progress bar — core transport controls

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
  prevBtn.addEventListener('click', playback.skipPrevious);

  const playBtn = document.createElement('button');
  playBtn.className = 'player-btn player-btn-play';
  playBtn.innerHTML = ICON_PLAY;
  playBtn.addEventListener('click', playback.togglePlay);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'player-btn';
  nextBtn.innerHTML = ICON_FORWARD;
  nextBtn.addEventListener('click', playback.skipNext);

  transport.append(prevBtn, playBtn, nextBtn);

  const progressWrap = document.createElement('div');
  progressWrap.className = 'player-progress-wrap';

  const timeCurrent = document.createElement('span');
  timeCurrent.className = 'player-time';

  const progressBar = document.createElement('input');
  progressBar.type = 'range';
  progressBar.className = 'player-progress-bar';
  progressBar.min = '0';
  progressBar.max = '100';
  progressBar.value = '0';
  progressBar.addEventListener('input', () => {
    const dur = playback.getState().duration;
    playback.seekTo((parseFloat(progressBar.value) / 100) * dur);
  });

  const timeTotal = document.createElement('span');
  timeTotal.className = 'player-time';

  progressWrap.append(timeCurrent, progressBar, timeTotal);
  wrap.append(transport, progressWrap);

  playback.subscribe((s) => {
    playBtn.innerHTML = s.isPlaying ? ICON_PAUSE : ICON_PLAY;
    progressBar.value = s.duration ? ((s.currentTime / s.duration) * 100).toString() : '0';
    timeCurrent.textContent = formatTime(s.currentTime);
    timeTotal.textContent = formatTime(s.duration);
  });

  return wrap;
}
