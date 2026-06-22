// elysium-ui/src/modules/listenModule.js
import { invokeBackend } from '../api.js';

const ICON_HEADPHONES = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>`;

export const listenModule = {
    id: 'listen',
    label: 'Hören',
    icon: ICON_HEADPHONES,
    
    render() {
        const viewport = document.createElement('div');
        viewport.className = 'view-container animate-fade-in';
        
        viewport.innerHTML = `
            <h2 class="view-title">Deine Musikbibliothek</h2>
            <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 24px;">Exklusive High-Fidelity Opus Audiospur-Übersicht.</p>
            <div id="library-tracks-container" style="display: flex; flex-direction: column; gap: 8px;">
                <span style="color: var(--accent-premium);">Lese lokalen Musik-Pool aus...</span>
            </div>
        `;
        
        // Starte den asynchronen Ladevorgang direkt nach dem Rendern
        this.loadLocalTracks(viewport);
        
        return viewport;
    },

    async loadLocalTracks(viewport) {
        const container = viewport.querySelector('#library-tracks-container');
        if (!container) return;

        try {
            // Rufe den echten Rust-Scan auf!
            const tracks = await invokeBackend('get_local_library');

            if (tracks.length === 0) {
                container.innerHTML = `
                    <div style="color: var(--text-muted); padding: 20px; border: 1px dashed var(--border-subtle); border-radius: 8px; text-align: center;">
                        Keine .opus Dateien im Ordner "music/" gefunden.
                    </div>`;
                return;
            }

            container.innerHTML = ''; // Lade-Text löschen
            
            // Rendere jedes gefundene Lied als cleane Zeile
            tracks.forEach(track => {
                const trackRow = document.createElement('div');
                trackRow.style = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    background: var(--bg-sidebar);
                    border: 1px solid var(--border-subtle);
                    border-radius: 6px;
                    cursor: pointer;
                `;
                
                trackRow.innerHTML = `
                    <div>
                        <div style="font-weight: 600; font-size: 0.95rem;">${track.title}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">${track.artist}</div>
                    </div>
                    <div style="font-size: 0.9rem; color: var(--text-muted);">${track.duration}</div>
                `;

                // Später hängen wir hier das Klick-Event zum Abspielen an!
                trackRow.addEventListener('click', () => {
                    console.log(`[Playback] Target localized stream uri: ${track.file_path}`);
                });

                container.appendChild(trackRow);
            });

        } catch (error) {
            container.innerHTML = `<span style="color: #ef4444;">Fehler beim Laden der Bibliothek: ${error}</span>`;
        }
    }
};