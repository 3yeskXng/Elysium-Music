// src/components/playerbar/PlayerBar.ts
// Player bar lifecycle — shell creation, track binding, lyrics & queue init

import { audioEngine } from '../../core/audioEngine.js';
import { resolveArtist } from '../../utils/resolveArtist.js';
import { createPlayerControls } from './PlayerControls.js';
import { createPlayerActions } from './PlayerActions.js';
import { createPlayerVolume } from './PlayerVolume.js';
import { createPlayerTrackActions } from './PlayerTrackActions.js';
import { loadTrackLyrics, initLyricsPanel } from '../lyrics/services/LyricsPanel.js';
import { initQueuePanel } from '../queue/PlayerQueue.js';
import type { Track } from '../../types/Track.js';

function renderTrack(track: Track | null): void {
  const titleEl = document.getElementById('player-track-title');
  const artistEl = document.getElementById('player-track-artist');
  if (!titleEl || !artistEl) return;

  if (!track) {
    titleEl.textContent = '';
    artistEl.textContent = '';
    return;
  }

  titleEl.textContent = track.title || '';
  artistEl.textContent = resolveArtist(track.artist);
}

function createShell(): void {
  const metaSlot = document.getElementById('player-meta-slot');
  const controlsSlot = document.getElementById('player-controls-slot');
  const utilsSlot = document.getElementById('player-utilities-slot');
  if (!metaSlot || !controlsSlot || !utilsSlot) return;

  metaSlot.innerHTML = '';

  const info = document.createElement('div');
  info.className = 'player-info';

  const title = document.createElement('div');
  title.className = 'player-track-title';
  title.id = 'player-track-title';
  title.textContent = '';

  const artist = document.createElement('div');
  artist.className = 'player-track-artist';
  artist.id = 'player-track-artist';
  artist.textContent = '';

  info.append(title, artist);
  metaSlot.appendChild(info);

  controlsSlot.appendChild(createPlayerControls());

  utilsSlot.appendChild(createPlayerTrackActions());
  utilsSlot.appendChild(createPlayerVolume());
  utilsSlot.appendChild(createPlayerActions());

  initLyricsPanel();
  initQueuePanel();
}

function bindTrackUpdates(): void {
  audioEngine.addTrackChangeListener((track: Track, status?: string) => {
    renderTrack(track);
    if (!track || status === 'loading') return;
    loadTrackLyrics(track);
  });
}

let initialized = false;

export function initPlayerBar(): void {
  if (initialized) return;
  initialized = true;
  createShell();
  renderTrack(audioEngine.currentTrack);
  bindTrackUpdates();
  if (audioEngine.currentTrack) {
    loadTrackLyrics(audioEngine.currentTrack);
  }
  window.triggerElysiumLog?.('INFO', 'PlayerBar', 'Player bar initialized (TypeScript)');
}
