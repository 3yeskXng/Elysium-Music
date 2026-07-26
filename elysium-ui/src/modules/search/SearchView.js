// elysium-ui/src/modules/search/SearchView.js
// Unified search module — merges local library browsing and stream download into a single view

import { ICON_SEARCH } from '../../config/icons.js';
import { t } from '../../utils/translate.js';
import { handleSearch } from './services/searchService.js';

export const searchModule = {
    id: 'search',
    label: 'nav_search',
    icon: ICON_SEARCH,
    viewportElement: null,

    render() {
        const vp = document.createElement('div');
        vp.className = 'view-container animate-fade-in';
        this.viewportElement = vp;

        vp.innerHTML = `
            <h2 class="view-title" data-i18n="search_title">${t('search_title')}</h2>
            <p style="color:var(--text-muted); font-size:0.95rem; margin-bottom:24px;" data-i18n="search_sub">${t('search_sub')}</p>
            <div style="display:flex; gap:12px; margin-bottom:24px;">
                <input type="text" id="search-input" data-i18n="search_placeholder" placeholder="${t('search_placeholder')}"
                    style="flex:1; padding:12px 16px; background:var(--bg-sidebar); border:1px solid var(--border-subtle);
                    border-radius:6px; color:var(--text-main); font-size:0.95rem; outline:none;">
                <button id="search-trigger" style="background:var(--accent-premium); border:none; color:white;
                    font-weight:600; padding:0 24px; border-radius:6px; cursor:pointer; font-size:0.95rem;
                    display:flex; align-items:center; gap:8px;">
                    ${ICON_SEARCH} ${t('search_btn')}
                </button>
            </div>
            <div id="search-results" style="display:flex; flex-direction:column; gap:8px; margin-bottom:90px;"></div>
            <div id="search-status" style="display:none; padding:16px; border-radius:6px; font-size:0.9rem; line-height:1.4;"></div>
        `;

        this.wireEvents(vp);
        return vp;
    },

    wireEvents(vp) {
        const input = vp.querySelector('#search-input');
        const trigger = vp.querySelector('#search-trigger');
        const results = vp.querySelector('#search-results');
        const statusBox = vp.querySelector('#search-status');

        trigger.addEventListener('click', () => handleSearch(input, results, statusBox));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleSearch(input, results, statusBox);
        });
    }
};
