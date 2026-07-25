// elysium-ui/src/utils/resolveArtist.js
// Shared artist name resolution — centralizes the local-file vs artist logic

import { translations } from '../config/translations.js';

export function resolveArtist(artist) {
    const lang = localStorage.getItem('elysium_language') || 'de';
    const t = translations[lang] || translations.de;
    if (!artist || artist.trim() === '') return t.artist_local || 'Local File';
    return artist;
}
