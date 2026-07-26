// elysium-ui/src/core/metadata/providers/youtubeMetadataProvider.js
// YouTube metadata provider — fetches real video metadata via Tauri + yt-dlp

import { invokeBackend } from '../../../api.js';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'YouTubeMeta', msg);
}

export const youtubeMetadataProvider = {
    id: 'youtube',
    name: 'YouTube Metadata',

    async resolve(query) {
        try {
            const results = await invokeBackend('search_youtube_metadata', { query });
            if (!results || !Array.isArray(results)) return [];
            return results.map(item => ({
                id: item.id,
                title: item.title || query,
                artist: item.artist || '',
                duration: item.duration_secs || 0,
                duration_secs: item.duration_secs || 0,
                thumbnail: item.thumbnail || '',
                file_path: '',
                source: 'youtube',
            }));
        } catch (err) {
            log('ERROR', `YouTube metadata search failed: ${err.message || err}`);
            return [];
        }
    }
};
