// elysium-ui/src/modules/listen/ListenView.js
// Music library browser — view shell and event wiring

import { ICON_HEADPHONES } from '../../config/icons.js';
import { t } from '../../utils/translate.js';
import { loadLocalTracks, playTrackAt, highlightRow, initSkipEngine, initRefreshListener } from './services/libraryService.js';

export const listenModule = {
    id: 'listen',
    label: 'nav_listen',
    icon: ICON_HEADPHONES,
    tracks: [],
    currentTrackIndex: -1,
    viewportElement: null,

    render() {
        const vp = document.createElement('div');
        vp.className = 'view-container animate-fade-in';
        this.viewportElement = vp;

        vp.innerHTML = `
            <h2 class="view-title" data-i18n="lib_title">${t('lib_title')}</h2>
            <p style="color:var(--text-muted); font-size:0.95rem; margin-bottom:24px;" data-i18n="lib_sub">${t('lib_sub')}</p>
            <div id="library-tracks-container" style="display:flex; flex-direction:column; gap:8px; margin-bottom:90px;">
                <span style="color:var(--accent-premium);" data-i18n="lib_loading">${t('lib_loading')}</span>
            </div>
        `;

        loadLocalTracks(this);
        initSkipEngine(this);
        initRefreshListener(this);
        return vp;
    },

    playTrackAt(index) {
        if (index < 0 || index >= this.tracks.length) return;
        this.currentTrackIndex = index;
        highlightRow(this, index);
        playTrackAt(this, index);
    }
};
