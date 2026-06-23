// elysium-ui/src/core/audioEngine.js
// High-End Autonomous Web Audio Interface Layer

import { invokeBackend } from '../api.js';

class AudioEngine {
    constructor() {
        this.audio = new Audio();
        this.currentTrack = null;
        this.onTrackChangeCallback = null;
        this.onStatusChangeCallback = null;

        // Sync native HTML5 media pipeline back into our ecosystem
        this.audio.addEventListener('timeupdate', () => {
            if (this.onStatusChangeCallback) this.onStatusChangeCallback('timeupdate');
        });
        
        this.audio.addEventListener('ended', () => {
            if (this.onStatusChangeCallback) this.onStatusChangeCallback('ended');
        });
    }

    /**
     * Streams an isolated local track container by turning raw bytes into an active audio node
     */
    async playTrack(track) {
        try {
            console.log(`[Audio Engine] Initializing memory stream for: ${track.title}`);
            this.currentTrack = track;
            
            if (this.onTrackChangeCallback) this.onTrackChangeCallback(track, 'loading');

            // Pull raw binary buffer from the Rust filesystem matrix
            const bytes = await invokeBackend('get_track_bytes', { filePath: track.file_path });
            
            // Build an in-memory blob locked explicitly to premium opus decoding
            const blob = new Blob([new Uint8Array(bytes)], { type: 'audio/opus' });
            
            // Generate a secure local streaming URL bound to the browser runtime context
            const streamUrl = URL.createObjectURL(blob);

            this.audio.src = streamUrl;
            await this.audio.play();
            
            if (this.onTrackChangeCallback) this.onTrackChangeCallback(track, 'playing');
        } catch (fault) {
            console.error('[Audio Engine Critical Fault] Pipeline crashed:', fault);
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

    getProgress() {
        if (!this.audio.duration) return { current: 0, total: 0, percent: 0 };
        return {
            current: this.audio.currentTime,
            total: this.audio.duration,
            percent: (this.audio.currentTime / this.audio.duration) * 100
        };
    }

    onTrackChange(callback) { this.onTrackChangeCallback = callback; }
    onStatusChange(callback) { this.onStatusChangeCallback = callback; }
}

export const audioEngine = new AudioEngine();