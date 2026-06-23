// elysium-ui/src/modules/listenModule.js
import { invokeBackend } from '../api.js';
import { audioEngine } from '../core/audioEngine.js';

const ICON_HEADPHONES = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>`;

export const listenModule = {
    id: 'listen',
    label: 'Hören',
    icon: ICON_HEADPHONES,
    
    // Module Runtime State Tracker
    tracks: [],
    currentTrackIndex: -1,
    viewportElement: null,

    render() {
        const viewport = document.createElement('div');
        viewport.className = 'view-container animate-fade-in';
        this.viewportElement = viewport;
        
        viewport.innerHTML = `
            <h2 class="view-title" data-i18n="lib_title">Deine Musikbibliothek</h2>
            <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 24px;" data-i18n="lib_sub">Exklusive High-Fidelity Opus Audiospur-Übersicht.</p>
            <div id="library-tracks-container" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 90px;">
                <span style="color: var(--accent-premium);" data-i18n="lib_loading">Lese lokalen Musik-Pool aus...</span>
            </div>
        `;
        
        this.loadLocalTracks(viewport);
        this.initSkipEngine();
        return viewport;
    },

    async loadLocalTracks(viewport) {
        const container = viewport.querySelector('#library-tracks-container');
        if (!container) return;

        try {
            // Fetch clean array payload from backend system
            this.tracks = await invokeBackend('get_local_library');
            const currentLang = localStorage.getItem('elysium_language') || 'de';

            if (this.tracks.length === 0) {
                container.innerHTML = `
                    <div style="color: var(--text-muted); padding: 20px; border: 1px dashed var(--border-subtle); border-radius: 8px; text-align: center;" data-i18n="lib_empty">
                        ${currentLang === 'de' ? 'Keine .opus Dateien im Ordner "music/" gefunden.' : 'No .opus files found inside "music/" folder.'}
                    </div>`;
                return;
            }

            container.innerHTML = '';
            
            // Build real interactive track node rows
            this.tracks.forEach((track, index) => {
                const trackRow = document.createElement('div');
                trackRow.className = 'track-row-item';
                trackRow.setAttribute('data-track-index', index);
                trackRow.style = `
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 14px 18px; background: var(--bg-sidebar);
                    border: 1px solid var(--border-subtle); border-left: 3px solid transparent; 
                    border-radius: 6px; cursor: pointer; transition: all 0.2s ease;
                `;
                
                trackRow.innerHTML = `
                    <div>
                        <div style="font-weight: 600; font-size: 0.95rem; color:var(--text-main);">${track.title}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">${track.artist || 'Unknown Artist'}</div>
                    </div>
                    <div style="font-size: 0.9rem; color: var(--text-muted); font-family: monospace;">${track.duration || '--:--'}</div>
                `;

                trackRow.addEventListener('click', () => {
                    this.playTrackAt(index);
                });

                container.appendChild(trackRow);
            });

            // Keep visual styling intact if a track is already spinning in the background
            if (this.currentTrackIndex !== -1) {
                this.highlightTrackRow(this.currentTrackIndex);
            }

        } catch (error) {
            container.innerHTML = `<span style="color: #ef4444;">Fehler: ${error.message || error}</span>`;
        }
    },

    // Execution Core for advancing tracks
    playTrackAt(index) {
        if (index < 0 || index >= this.tracks.length) return;
        
        this.currentTrackIndex = index;
        const track = this.tracks[index];

        this.highlightTrackRow(index);
        audioEngine.playTrack(track);
        console.log(`[Listen Module] Queue processing track index: ${index} -> ${track.title}`);
    },

    // Handles visual DOM state transformations cleanly
    highlightTrackRow(index) {
        if (!this.viewportElement) return;
        
        this.viewportElement.querySelectorAll('.track-row-item').forEach(row => {
            row.style.borderLeftColor = 'transparent';
            row.style.background = 'var(--bg-sidebar)';
        });

        const activeRow = this.viewportElement.querySelector(`.track-row-item[data-track-index="${index}"]`);
        if (activeRow) {
            activeRow.style.borderLeftColor = 'var(--accent-premium)';
            activeRow.style.background = 'rgba(138, 92, 246, 0.05)';
        }
    },

    // Dynamic global listener attachment setup
    initSkipEngine() {
        // Prevent duplicate listener attachments on hot view swaps
        window.removeEventListener('elysium-skip-next', this.handleGlobalSkip);
        this.handleGlobalSkip = () => {
            if (this.tracks.length === 0) return;
            
            // Increment index, roll back to 0 if bounds exceeded (circular queue)
            const nextIndex = (this.currentTrackIndex + 1) % this.tracks.length;
            this.playTrackAt(nextIndex);
        };
        window.addEventListener('elysium-skip-next', this.handleGlobalSkip);
    }
};