// elysium-ui/src/utils/resolveArtist.js
// Shared artist name resolution — centralizes the local-file vs artist logic

import { t } from './translate.js';

export function resolveArtist(artist) {
    if (!artist || artist.trim() === '' || artist === 'Unknown Artist') return t('artist_unknown');
    return artist;
}
