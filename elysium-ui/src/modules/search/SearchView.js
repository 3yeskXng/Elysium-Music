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
                <div style="flex:1; position:relative;">
                    <input type="text" id="search-input" data-i18n="search_placeholder" placeholder="${t('search_placeholder')}"
                        style="width:100%; padding:12px 40px 12px 16px; background:var(--bg-sidebar); border:1px solid var(--border-subtle);
                        border-radius:6px; color:var(--text-main); font-size:0.95rem; outline:none; box-sizing:border-box;">
                    <button id="search-clear-btn" style="position:absolute; right:8px; top:50%; transform:translateY(-50%);
                        background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px;
                        display:none; align-items:center; justify-content:center; transition:color 0.2s;"
                        title="${t('search_clear')}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
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
        const clearBtn = vp.querySelector('#search-clear-btn');

        clearBtn.addEventListener('click', () => {
            input.value = '';
            clearBtn.style.display = 'none';
            input.focus();
        });

        input.addEventListener('input', () => {
            clearBtn.style.display = input.value.length > 0 ? 'flex' : 'none';
        });

        let debounceTimer = null;
        const debouncedSearch = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => handleSearch(input, results, statusBox), 350);
        };

        trigger.addEventListener('click', () => handleSearch(input, results, statusBox));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(debounceTimer);
                handleSearch(input, results, statusBox);
            }
        });
        input.addEventListener('input', debouncedSearch);
    }
};
