// elysium-ui/src/modules/search/services/streamService.js
// YouTube stream search and playback — metadata-first search with play/download

import { invokeBackend } from '../../../api.js';
import { audioEngine } from '../../../core/audioEngine.js';
import { pluginManager } from '../../../core/pluginManager.js';
import { ensureYtDlp } from '../../../utils/dependencyService.js';
import { showLoader, hideLoader } from '../../../core/loader.js';
import { t } from '../../../utils/translate.js';
import { metadataRegistry } from '../../../core/metadata/metadataRegistry.js';
import { buildTrackRow } from './trackRowBuilder.js';
import { setStatus } from './searchService.js';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Stream', msg);
}

export async function handleStreamSearch(query, statusBox, resultsContainer) {
    if (!pluginManager.isPluginActive('youtube_core')) {
        hideLoader(resultsContainer);
        setStatus(statusBox, 'rgba(255,255,255,0.05)', 'var(--text-muted)', t('dl_plugin_off'));
        return;
    }

    ensureYtDlp(statusBox, async () => {
        showLoader(resultsContainer, t('search_searching'));
        try {
            const metadataResults = await metadataRegistry.resolve(query, 'youtube');
            hideLoader(resultsContainer);
            resultsContainer.innerHTML = '';

            if (metadataResults.length > 0) {
                metadataResults.forEach(track => resultsContainer.appendChild(buildTrackRow(track, resultsContainer)));
                setStatus(statusBox, 'rgba(34,197,94,0.1)', '#22c55e',
                    t('search_found_local').replace('${count}', metadataResults.length));
            } else {
                setStatus(statusBox, 'rgba(239,68,68,0.1)', '#ef4444', t('dl_error'));
            }
        } catch (err) {
            hideLoader(resultsContainer);
            setStatus(statusBox, 'rgba(239,68,68,0.1)', '#ef4444',
                `${t('dl_error')}: ${err.message || err}`);
            log('ERROR', `Stream search failed: ${err.message || err}`);
        }
    });
}

export async function playStreamTrack(track, container) {
    showLoader(container, t('dl_downloading'));
    try {
        const result = await invokeBackend('download_youtube', { query: track.title });
        hideLoader(container);
        audioEngine.playTrack(result);
        window.dispatchEvent(new CustomEvent('elysium-library-refresh'));
    } catch (err) {
        hideLoader(container);
        log('ERROR', `Stream failed: ${err.message || err}`);
    }
}
