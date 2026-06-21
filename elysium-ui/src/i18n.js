// i18n.js - Localization engine for Elysium Music Player Core
export const languages = {
    de: {
        // Core Status Indicators
        brand: "ELYSIUM // CORE",
        standby: "BEREIT",
        playing: "WIEDERGABE",
        paused: "PAUSE",
        offline: "OFFLINE",
        noTrack: "Kein Track geladen",
        
        // General Controls & Buttons
        btnSkip: "ÜBERSPRINGEN",
        btnSettings: "OPTIONEN",
        btnPlay: "ABSPIELEN",
        btnPause: "PAUSIEREN",
        btnStop: "STOPPEN",
        btnAddQueue: "ZUR WARTESCHLANGE HINZUFÜGEN",
        
        // Navigation & Views
        navHome: "STARTSEITE",
        navSearch: "SUCHE",
        navLibrary: "BIBLIOTHEK",
        navPlaylists: "PLAYLISTS",
        navQueue: "WARTESCHLANGE",
        
        // Metadata & Labels
        lblArtist: "KÜNSTLER",
        lblAlbum: "ALBUM",
        lblTrack: "TITEL",
        lblVolume: "LAUTSTÄRKE",
        unknownArtist: "Unbekannter Künstler",
        unknownAlbum: "Unbekanntes Album",
        
        // Audio & Engine Settings
        cfgAudioFormat: "BEVORZUGTES AUDIOFORMAT",
        cfgQuality: "AUDIOQUALITÄT",
        formatOpus: "Opus (Empfohlen - Höhere Codec-Effizienz)",
        formatMp3: "MP3 (Standard)",
        
        // Background & Network Status Tasks
        statusDownloading: "HERUNTERLADEN...",
        statusIndexing: "DATEIEN WERDEN GEINDIZIERT...",
        errPlayback: "Wiedergabefehler aufgetreten",
        errNetwork: "Netzwerkverbindung fehlgeschlagen"
    },
    en: {
        // Core Status Indicators
        brand: "ELYSIUM // CORE",
        standby: "STANDBY",
        playing: "PLAYING",
        paused: "PAUSED",
        offline: "OFFLINE",
        noTrack: "No track loaded",
        
        // General Controls & Buttons
        btnSkip: "SKIP",
        btnSettings: "SETTINGS",
        btnPlay: "PLAY",
        btnPause: "PAUSE",
        btnStop: "STOP",
        btnAddQueue: "ADD TO QUEUE",
        
        // Navigation & Views
        navHome: "HOME",
        navSearch: "SEARCH",
        navLibrary: "LIBRARY",
        navPlaylists: "PLAYLISTS",
        navQueue: "QUEUE",
        
        // Metadata & Labels
        lblArtist: "ARTIST",
        lblAlbum: "ALBUM",
        lblTrack: "TRACK",
        lblVolume: "VOLUME",
        unknownArtist: "Unknown Artist",
        unknownAlbum: "Unknown Album",
        
        // Audio & Engine Settings
        cfgAudioFormat: "PREFERRED AUDIO FORMAT",
        cfgQuality: "AUDIO QUALITY",
        formatOpus: "Opus (Recommended - Higher Codec Efficiency)",
        formatMp3: "MP3 (Legacy)",
        
        // Background & Network Status Tasks
        statusDownloading: "DOWNLOADING...",
        statusIndexing: "INDEXING AUDIO FILES...",
        errPlayback: "Playback error encountered",
        errNetwork: "Network connection failed"
    }
};

export let currentLang = 'de'; // Default fallback application runtime locale

/**
 * Translates a given key based on the current active locale map.
 * @param {string} key - The dictionary reference indicator.
 * @returns {string} The localized string value or the key identifier if missing.
 */
export function t(key) {
    return languages[currentLang]?.[key] || key;
}

/**
 * Mutates the active localization state value at runtime.
 * @param {string} lang - target locale designator ('de' or 'en').
 */
export function setLanguage(lang) {
    if (languages[lang]) currentLang = lang;
}