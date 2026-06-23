// elysium-ui/src/core/audioEngine.js
import { invokeBackend } from '../api.js';

class AudioEngine {
    constructor() {
        this.audio = new Audio();
        this.currentTrack = null;
        this.onTrackChangeCallback = null;
        this.onStatusChangeCallback = null;

        // Synchronisiere native HTML5 Event-Trigger
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

        // Key-Binding: Registriere globale Medientasten des Keyboards
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', () => this.togglePause());
            navigator.mediaSession.setActionHandler('pause', () => this.togglePause());
        }
    }

    async playTrack(track) {
        try {
            this.currentTrack = track;
            if (this.onTrackChangeCallback) this.onTrackChangeCallback(track, 'loading');

            const bytes = await invokeBackend('get_track_bytes', { filePath: track.file_path });
            const blob = new Blob([new Uint8Array(bytes)], { type: 'audio/opus' });
            const streamUrl = URL.createObjectURL(blob);

            this.audio.src = streamUrl;
            await this.audio.play();
            
            if (this.onTrackChangeCallback) this.onTrackChangeCallback(track, 'playing');
        } catch (fault) {
            console.error('[Audio Engine Fault]', fault);
            if (this.onTrackChangeCallback) this.onTrackChangeCallback(track, 'error');
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
        if (this.audio.duration) {
            this.audio.currentTime = seconds;
        }
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

    onTrackChange(callback) { this.onTrackChangeCallback = callback; }
    onStatusChange(callback) { this.onStatusChangeCallback = callback; }
}

export const audioEngine = new AudioEngine();