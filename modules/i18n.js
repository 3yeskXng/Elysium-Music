// modules/i18n.js
const fs = require('fs');

const translations = {
    en: {
        welcome: "Welcome to Elysium Music Command Line Interface",
        help_play: "Type 'play <song name>' to listen to music.",
        help_stop: "Type 'stop' to halt playback.",
        help_exit: "Type 'exit' to close the application.",
        shutdown: "[Elysium] Shutting down systems. Goodbye!",
        unknown_cmd: "[Elysium] Unknown command"
    },
    de: {
        welcome: "Willkommen beim Elysium Music Kommandozeilen-Interface",
        help_play: "Tippe 'play <Songname>', um Musik zu hören.",
        help_stop: "Tippe 'stop', um die Wiedergabe anzuhalten.",
        help_exit: "Tippe 'exit', um die Anwendung zu schließen.",
        shutdown: "[Elysium] Systeme werden heruntergefahren. Auf Wiedersehen!",
        unknown_cmd: "[Elysium] Unbekannter Befehl"
    }
};

module.exports = {
    // T (Translate) function fetches the correct string based on config
    t: function(key) {
        const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
        const lang = config.language || 'en';
        
        return translations[lang][key] || translations['en'][key] || key;
    }
};