// elysium-ui/src/modules/search/services/searchService.js
// Search handler — local library search with cached scan + YouTube stream fallback

import { showLoader, hideLoader } from '../../../core/loader.js';
import { t } from '../../../utils/translate.js';
import { handleStreamSearch } from './streamService.js';
import { getLocalTracks } from './libraryCache.js';
import { buildTrackRow } from './trackRowBuilder.js';

export function setStatus(box, bg, color, text) {
    box.style.display = 'block';
    box.style.background = bg;
    box.style.color = color;
    box.textContent = text;
}

function searchLocal(tracks, query) {
    const q = query.toLowerCase();
    return tracks.filter(track =>
        track.title.toLowerCase().includes(q) ||
        (track.artist && track.artist.toLowerCase().includes(q))
    );
}

function renderBatchResults(container, tracks) {
    const fragment = document.createDocumentFragment();
    tracks.forEach(track => fragment.appendChild(buildTrackRow(track, container)));
    container.appendChild(fragment);
}

export async function handleSearch(input, resultsContainer, statusBox) {
    const query = input.value.trim();
    if (!query) return;

    showLoader(resultsContainer, t('search_loading'));
    setStatus(statusBox, 'rgba(138,92,246,0.1)', 'var(--accent-premium)', t('search_searching'));

    try {
        const allTracks = await getLocalTracks();
        const localResults = searchLocal(allTracks, query);
        if (localResults.length > 0) {
            hideLoader(resultsContainer);
            resultsContainer.innerHTML = '';
            renderBatchResults(resultsContainer, localResults);
            setStatus(statusBox, 'rgba(34,197,94,0.1)', '#22c55e',
                t('search_found_local').replace('${count}', localResults.length));
        } else {
            await handleStreamSearch(query, statusBox, resultsContainer);
        }
    } catch (err) {
        hideLoader(resultsContainer);
        setStatus(statusBox, 'rgba(239,68,68,0.1)', '#ef4444',
            `${t('dl_error')}: ${err.message || err}`);
    }
}
