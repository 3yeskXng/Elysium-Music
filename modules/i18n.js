// modules/i18n.js
const fs = require('fs');

const translations = {
    en: {
        welcome: "Welcome to Elysium Music Command Line Interface",
        help_play: "Type 'play <song name>' to listen to music.",
        help_stop: "Type 'stop' to halt playback.",
        help_exit: "Type 'exit' to close the application.",
        shutdown: "[Elysium] Shutting down systems. Goodbye!",
        unknown_cmd: "[Elysium] Unknown command",
        track_started: "[Elysium Engine] Now playing: ",
        library_hit: "[Elysium Library] 📦 Local high-quality Opus file matched! Playing from disk...",
        library_searching: "[Elysium Library] Scanning local storage directory...",
        engine_active: "[Elysium Engine] Activating module: ",
        auto_mode_active: "[Elysium Engine] Auto-Mode: Streaming instantly while caching to disk in the background...",
        auto_mode_complete: "[Elysium Engine] Background caching complete for: ",
        welcome: "==================================================\n🎵 Welcome to Elysium Music Command Line Interface\nCommands: play <name> | add <name> | playlist <name> | next | queue | stop | exit\n==================================================\n",
        playlist_loading: "[Elysium Playlist] Loading playlist: ",
        playlist_loaded: "[Elysium Playlist] Loaded X tracks from playlist: ",
        playlist_err_not_found: "[Elysium Playlist] Error: Playlist file not found.",
        playlist_err_empty: "[Elysium Playlist] Error: Playlist is empty or corrupted.",
        err_no_playlist: "[Elysium] Error: Please specify a playlist name.",
    },
    de: {
        welcome: "Willkommen beim Elysium Music Kommandozeilen-Interface",
        help_play: "Tippe 'play <Songname>', um Musik zu hören.",
        help_stop: "Tippe 'stop', um die Wiedergabe anzuhalten.",
        help_exit: "Tippe 'exit', um die Anwendung zu schließen.",
        shutdown: "[Elysium] Systeme werden heruntergefahren. Auf Wiedersehen!",
        unknown_cmd: "[Elysium] Unbekannter Befehl",
        track_started: "[Elysium Engine] Aktuelle Wiedergabe: ",
        library_hit: "[Elysium Library] 📦 Local high-quality Opus file matched! Playing from disk...",
        library_searching: "[Elysium Library] Scanning local storage directory...",
        engine_active: "[Elysium Engine] Aktiviere Modul: ",
        library_hit: "[Elysium Library] 📦 Lokale hochauflösende Opus-Datei gefunden! Spiele von Festplatte...",
        library_searching: "[Elysium Library] Scanne lokalen Speicherordner...",
        auto_mode_active: "[Elysium Engine] Auto-Modus: Sofortiges Streaming, während im Hintergrund auf Festplatte zwischengespeichert wird...",
        auto_mode_complete: "[Elysium Engine] Hintergrund-Speicherung abgeschlossen für: ",
        welcome: "==================================================\n🎵 Willkommen beim Elysium Music Kommandozeilen-Interface\nBefehle: play <Name> | add <Name> | playlist <Name> | next | queue | stop | exit\n==================================================\n",
        playlist_loading: "[Elysium Playlist] Lade Playlist: ",
        playlist_loaded: "[Elysium Playlist] X Titel aus Playlist geladen: ",
        playlist_err_not_found: "[Elysium Playlist] Fehler: Playlist-Datei nicht gefunden.",
        playlist_err_empty: "[Elysium Playlist] Fehler: Playlist ist leer oder beschädigt.",
        err_no_playlist: "[Elysium] Fehler: Bitte gib einen Playlist-Namen an.",
    },
   
};

module.exports = {
    // T (Translate) function fetches the correct string based on config
    t: function(key) {
        const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
        const lang = config.language || 'en';
        
        return translations[lang][key] || translations['en'][key] || key;
    }
};