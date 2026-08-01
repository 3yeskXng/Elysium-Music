// elysium-ui/src/core/audioEngine.js
// Core audio playback engine with MediaSession integration and session cache

import { invokeBackend } from '../api.js';
import { getCachedAudio, storeToCache } from './cache/audioCache.js';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'AudioEngine', msg);
}

class AudioEngine {
    constructor() {
        this.audio = new Audio();
        this.currentTrack = null;
        this.trackChangeListeners = new Set();
        this.statusChangeListeners = new Set();

        this.audio.addEventListener('timeupdate', () => {
            if (this.onStatusChangeCallback) this.onStatusChangeCallback('timeupdate');
        });
        this.audio.addEventListener('play', () => {
            this.updateMediaSession('playing');
            if (this.onStatusChangeCallback) this.onStatusChangeCallback('playing');
        });
        this.audio.addEventListener('pause', () => {
            this.updateMediaSession('paused');
            if (this.onStatusChangeCallback) this.onStatusChangeCallback('paused');
        });
        this.audio.addEventListener('ended', () => {
            if (this.onStatusChangeCallback) this.onStatusChangeCallback('ended');
        });
        this.audio.addEventListener('error', (e) => {
            log('ERROR', `Audio element error: code=${e.target.error?.code} msg="${e.target.error?.message}" track="${this.currentTrack?.title || 'N/A'}"`);
        });

        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', () => this.togglePause());
            navigator.mediaSession.setActionHandler('pause', () => this.togglePause());
        }
    }

    emitTrackChange(track, status) {
        for (const listener of this.trackChangeListeners) {
            try {
                listener(track, status);
            } catch (err) {
                log('ERROR', `Track change listener failed: ${err.message || err}`);
            }
        }
    }

    emitStatusChange(status) {
        for (const listener of this.statusChangeListeners) {
            try {
                listener(status);
            } catch (err) {
                log('ERROR', `Status change listener failed: ${err.message || err}`);
            }
        }
    }

    async playTrack(track) {
        try {
            this.currentTrack = track;
            this.emitTrackChange(track, 'loading');

            const cachedUrl = await getCachedAudio(track);
            if (cachedUrl && cachedUrl.startsWith('blob:')) {
                log('INFO', `Playing from session cache: "${track.title}"`);
                this.audio.src = cachedUrl;
                await this.audio.play();
                this.emitTrackChange(track, 'playing');
                return;
            }

            log('INFO', `Loading audio bytes for: "${track.title}" from ${track.file_path}`);
            const bytes = await invokeBackend('get_track_bytes', { filePath: track.file_path });
            log('INFO', `Received ${bytes.length} bytes (${(bytes.length / 1024).toFixed(1)} KB) for "${track.title}"`);

            const ext = track.file_path.split('.').pop()?.toLowerCase() || 'opus';
            const mimeMap = { opus: 'audio/opus', mp3: 'audio/mpeg', webm: 'audio/webm' };
            const blob = new Blob([new Uint8Array(bytes)], { type: mimeMap[ext] || 'audio/opus' });
            const streamUrl = URL.createObjectURL(blob);

            this.audio.src = streamUrl;
            await this.audio.play();
            log('SUCCESS', `Playback started: "${track.title}" — Duration: ${this.audio.duration ? Math.floor(this.audio.duration) + 's' : 'calculating...'}`);

            storeToCache(track, track.file_path);
            this.emitTrackChange(track, 'playing');
        } catch (fault) {
            log('ERROR', `Playback failed for "${track?.title}": ${fault.message || fault}`);
            this.emitTrackChange(track, 'error');
        }
    }

    togglePause() {
        if (!this.audio.src) return 'idle';
        if (this.audio.paused) {
            this.audio.play();
            return 'playing';
        } else {
            this.audio.pause();
            return 'paused';
        }
    }

    seek(seconds) {
        if (this.audio.duration) this.audio.currentTime = seconds;
    }

    getProgress() {
        if (!this.audio.duration) return { current: 0, total: 0, percent: 0 };
        return {
            current: this.audio.currentTime,
            total: this.audio.duration,
            percent: (this.audio.currentTime / this.audio.duration) * 100
        };
    }

    updateMediaSession(state) {
        if ('mediaSession' in navigator && this.currentTrack) {
            navigator.mediaSession.playbackState = state;
            navigator.mediaSession.metadata = new MediaMetadata({
                title: this.currentTrack.title,
                artist: this.currentTrack.artist || "Elysium Premium"
            });
        }
    }

    addTrackChangeListener(cb) {
        this.trackChangeListeners.add(cb);
        return () => this.trackChangeListeners.delete(cb);
    }

    addStatusChangeListener(cb) {
        this.statusChangeListeners.add(cb);
        return () => this.statusChangeListeners.delete(cb);
    }

    onTrackChange(cb) {
        this.trackChangeListeners.clear();
        if (cb) this.trackChangeListeners.add(cb);
    }

    onStatusChange(cb) {
        this.statusChangeListeners.clear();
        if (cb) this.statusChangeListeners.add(cb);
    }
}

export const audioEngine = new AudioEngine();
