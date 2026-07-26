// elysium-ui/src/modules/player/services/playbackService.js
// Audio engine hook bindings — title, status, progress, time display

import { ICON_PLAY, ICON_PAUSE } from '../../../config/icons.js';
import { audioEngine } from '../../../core/audioEngine.js';
import { resolveArtist } from '../../../utils/resolveArtist.js';

export function bindAudioEngineHooks(playerBar) {
    const titleText = document.getElementById('player-title');
    const statusText = document.getElementById('player-status');
    const playBtn = document.getElementById('player-play-trigger');
    const progressFill = document.getElementById('player-progress-fill');
    const timeText = document.getElementById('player-time');

    audioEngine.onTrackChange((track, status) => {
        playerBar.currentTrack = track;
        titleText.removeAttribute('data-i18n');
        titleText.textContent = track.title;
        statusText.removeAttribute('data-i18n');
        statusText.textContent = resolveArtist(track.artist);
        playBtn.innerHTML = status === 'playing' ? ICON_PAUSE : ICON_PLAY;
    });

    audioEngine.onStatusChange((nativeState) => {
        const prog = audioEngine.getProgress();
        progressFill.style.width = `${prog.percent}%`;

        if (nativeState === 'playing') {
            playBtn.innerHTML = ICON_PAUSE;
        } else if (nativeState === 'paused') {
            playBtn.innerHTML = ICON_PLAY;
        }

        if (playerBar.currentTrack) {
            statusText.textContent = resolveArtist(playerBar.currentTrack.artist);
        }

        timeText.textContent = formatTime(prog.current, prog.total);
    });
}

function formatTime(current, total) {
    const curMin = Math.floor(current / 60).toString().padStart(2, '0');
    const curSec = Math.floor(current % 60).toString().padStart(2, '0');
    const totMin = isNaN(total) ? "00" : Math.floor(total / 60).toString().padStart(2, '0');
    const totSec = isNaN(total) ? "00" : Math.floor(total % 60).toString().padStart(2, '0');
    return `${curMin}:${curSec} / ${totMin}:${totSec}`;
}
