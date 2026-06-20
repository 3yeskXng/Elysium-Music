export const languages = {
    de: {
        brand: "ELYSIUM // CORE",
        standby: "BEREIT",
        playing: "WIEDERGABE",
        paused: "PAUSE",
        offline: "OFFLINE",
        noTrack: "Kein Track geladen",
        btnSkip: "ÜBERSPRINGEN",
        btnSettings: "OPTIONEN"
    },
    en: {
        brand: "ELYSIUM // CORE",
        standby: "STANDBY",
        playing: "PLAYING",
        paused: "PAUSED",
        offline: "OFFLINE",
        noTrack: "No track loaded",
        btnSkip: "SKIP",
        btnSettings: "SETTINGS"
    }
};

export let currentLang = 'de'; // Standard-Sprache

export function t(key) {
    return languages[currentLang][key] || key;
}

export function setLanguage(lang) {
    if (languages[lang]) currentLang = lang;
}export const languages = {
    de: {
        brand: "ELYSIUM // CORE",
        standby: "BEREIT",
        playing: "WIEDERGABE",
        paused: "PAUSE",
        offline: "OFFLINE",
        noTrack: "Kein Track geladen",
        btnSkip: "ÜBERSPRINGEN",
        btnSettings: "OPTIONEN"
    },
    en: {
        brand: "ELYSIUM // CORE",
        standby: "STANDBY",
        playing: "PLAYING",
        paused: "PAUSED",
        offline: "OFFLINE",
        noTrack: "No track loaded",
        btnSkip: "SKIP",
        btnSettings: "SETTINGS"
    }
};

export let currentLang = 'de'; // Standard-Sprache

export function t(key) {
    return languages[currentLang][key] || key;
}

export function setLanguage(lang) {
    if (languages[lang]) currentLang = lang;
}