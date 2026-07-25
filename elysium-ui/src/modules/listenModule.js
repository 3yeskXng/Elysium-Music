// elysium-ui/src/modules/listenModule.js
import { invokeBackend } from '../api.js';
import { audioEngine } from '../core/audioEngine.js';

const ICON_HEADPHONES = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>`;

export const listenModule = {
    id: 'listen',
    label: 'Hören',
    icon: ICON_HEADPHONES,
    
    tracks: [],
    currentTrackIndex: -1,
    viewportElement: null,

    render() {
        const viewport = document.createElement('div');
        viewport.className = 'view-container animate-fade-in';
        this.viewportElement = viewport;
        
        viewport.innerHTML = `
            <h2 class="view-title" data-i18n="lib_title">Deine Musikbibliothek</h2>
            <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 24px;" data-i18n="lib_sub">High-Fidelity Audio-Übersicht mit lokalen und heruntergeladenen Titeln.</p>

            <div style="padding: 20px; border: 1px solid var(--border-subtle); background: var(--bg-sidebar); border-radius: 8px; margin-bottom: 24px;">
                <h3 style="font-size: 1rem; margin-bottom: 8px; color: var(--text-main); font-weight: 600;" data-i18n="lib_import_title">Lokale Datei hinzufügen</h3>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 16px;" data-i18n="lib_import_sub">Importiere .mp3 oder .opus Dateien von deinem PC.</p>
                <button id="listen-import-btn" data-i18n="lib_import_btn" style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); color: var(--text-main); font-weight: 600; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">Datei auswählen</button>
                <input type="file" id="listen-file-input" accept=".opus,.mp3" style="display: none;">
                <div id="listen-import-status" style="display: none; margin-top: 12px; padding: 10px; border-radius: 6px; font-size: 0.85rem; user-select: text;"></div>
            </div>

            <div id="library-tracks-container" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 90px;">
                <span style="color: var(--accent-premium);" data-i18n="lib_loading">Lese lokalen Musik-Pool aus...</span>
            </div>
        `;
        
        this.wireEvents(viewport);
        this.loadLocalTracks(viewport);
        this.initSkipEngine();
        this.initLibraryRefreshListener();
        return viewport;
    },

    wireEvents(viewport) {
        const importBtn = viewport.querySelector('#listen-import-btn');
        const fileInput = viewport.querySelector('#listen-file-input');
        const statusBox = viewport.querySelector('#listen-import-status');

        importBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const currentLang = localStorage.getItem('elysium_language') || 'de';
            statusBox.style.display = 'block';
            statusBox.style.background = 'rgba(138, 92, 246, 0.1)';
            statusBox.style.color = 'var(--accent-premium)';
            statusBox.textContent = currentLang === 'de' ? `Kopiere "${file.name}"...` : `Copying "${file.name}"...`;

            try {
                const arrayBuffer = await file.arrayBuffer();
                const bytes = Array.from(new Uint8Array(arrayBuffer));
                const cleanName = file.name.replace(/\.(opus|mp3)$/i, '');
                
                await invokeBackend('save_track', { title: cleanName, bytes });
                
                statusBox.style.background = 'rgba(34, 197, 94, 0.1)';
                statusBox.style.color = '#22c55e';
                statusBox.textContent = currentLang === 'de' ? `Erfolgreich importiert!` : `Successfully imported!`;

                if (window.triggerElysiumLog) {
                    window.triggerElysiumLog('SUCCESS', 'Listen', `File imported: ${file.name}`);
                }

                this.loadLocalTracks(viewport);
            } catch (err) {
                statusBox.style.background = 'rgba(239, 68, 68, 0.1)';
                statusBox.style.color = '#ef4444';
                statusBox.textContent = `Error: ${err.message || err}`;
                statusBox.style.userSelect = 'text';

                if (window.triggerElysiumLog) {
                    window.triggerElysiumLog('ERROR', 'Listen', `File import failed: ${err.message || err}`);
                }
            }

            fileInput.value = '';
        });
    },

    initLibraryRefreshListener() {
        window.removeEventListener('elysium-library-refresh', this.handleLibraryRefresh);
        this.handleLibraryRefresh = () => {
            if (this.viewportElement) {
                this.loadLocalTracks(this.viewportElement);
            }
        };
        window.addEventListener('elysium-library-refresh', this.handleLibraryRefresh);
    },

    async loadLocalTracks(viewport) {
        const container = viewport.querySelector('#library-tracks-container');
        if (!container) return;

        try {
            this.tracks = await invokeBackend('scan_local_library');
            const currentLang = localStorage.getItem('elysium_language') || 'de';

            if (this.tracks.length === 0) {
                container.innerHTML = `
                    <div style="color: var(--text-muted); padding: 20px; border: 1px dashed var(--border-subtle); border-radius: 8px; text-align: center; user-select: text;" data-i18n="lib_empty">
                        ${currentLang === 'de' ? 'Keine Audiodateien im Ordner "music/" gefunden.' : 'No audio files found in the "music/" folder.'}
                    </div>`;
                return;
            }

            container.innerHTML = '';
            
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

            if (this.currentTrackIndex !== -1 && this.currentTrackIndex < this.tracks.length) {
                this.highlightTrackRow(this.currentTrackIndex);
            }

            if (window.triggerElysiumLog) {
                window.triggerElysiumLog('SUCCESS', 'Listen', `Library loaded: ${this.tracks.length} track(s) found.`);
            }

        } catch (error) {
            container.innerHTML = `<span style="color: #ef4444; user-select: text;">Fehler: ${error.message || error}</span>`;
            if (window.triggerElysiumLog) {
                window.triggerElysiumLog('ERROR', 'Listen', `Library scan failed: ${error.message || error}`);
            }
        }
    },

    playTrackAt(index) {
        if (index < 0 || index >= this.tracks.length) return;
        
        this.currentTrackIndex = index;
        const track = this.tracks[index];

        this.highlightTrackRow(index);
        audioEngine.playTrack(track);

        if (window.triggerElysiumLog) {
            window.triggerElysiumLog('INFO', 'Listen', `Playing: ${track.title}`);
        }
    },

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

    initSkipEngine() {
        window.removeEventListener('elysium-skip-next', this.handleGlobalSkip);
        this.handleGlobalSkip = () => {
            if (this.tracks.length === 0) return;
            const nextIndex = (this.currentTrackIndex + 1) % this.tracks.length;
            this.playTrackAt(nextIndex);
        };
        window.addEventListener('elysium-skip-next', this.handleGlobalSkip);
    }
};
