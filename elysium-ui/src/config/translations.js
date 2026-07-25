// src/config/translations.js

export const translations = {
    de: {
        appTitle: "Elysium",
        settingsTitle: "Einstellungen",
        settingsSub: "Konfiguration der Systemschnittstellen und Erweiterungen.",
        langLabel: "Sprache / Language",
        idleStatus: "BEREIT",
        noTrack: "Kein Titel",
        nav_download: "Laden",
        nav_listen: "Hören",
        nav_settings: "Einstellungen",
        nav_debug: "System Logs",
        dl_title: "Mittelpunkt-Audio-Downloader",
        dl_sub: "Geben Sie einen Songtitel ein, um ihn direkt via Netzwerkintegration herunterzuladen.",
        dl_placeholder: "Z.B. Linkin Park - Numb",
        dl_btn: "Download",
        import_title: "Manueller Datei-Import",
        import_sub: "Füge vorhandene .opus oder .mp3 Dateien von deinem PC direkt über das Interface zur App-Bibliothek hinzu.",
        import_btn: "Datei auswählen & importieren",
        lib_title: "Deine Musikbibliothek",
        lib_sub: "High-Fidelity Audio-Übersicht mit lokalen und heruntergeladenen Titeln.",
        lib_loading: "Lese lokalen Musik-Pool aus...",
        lib_empty: 'Keine Audiodateien im Ordner "music/" gefunden.',
        lib_import_title: "Lokale Datei hinzufügen",
        lib_import_sub: "Importiere .mp3 oder .opus Dateien von deinem PC.",
        lib_import_btn: "Datei auswählen",
        pm_title: "Plugin-Verwaltung",
        pm_sub: "Aktive Core-Erweiterungen für modulares Streaming.",
        pm_status_active: "Aktiviert",
        pm_status_inactive: "Inaktiv",
        pm_btn_disable: "Deaktivieren",
        pm_btn_enable: "Aktivieren"
    },
    en: {
        appTitle: "Elysium",
        settingsTitle: "Settings",
        settingsSub: "Configuration of system interfaces and extensions.",
        langLabel: "Language / Sprache",
        idleStatus: "IDLE",
        noTrack: "No Track Loaded",
        nav_download: "Download",
        nav_listen: "Listen",
        nav_settings: "Settings",
        nav_debug: "System Logs",
        dl_title: "Central Audio Downloader",
        dl_sub: "Enter a song title to download it directly via network integration.",
        dl_placeholder: "E.g., Linkin Park - Numb",
        dl_btn: "Download",
        import_title: "Manual File Import",
        import_sub: "Add existing .opus or .mp3 files from your PC directly to the app library via the interface.",
        import_btn: "Select & Import File",
        lib_title: "Your Music Library",
        lib_sub: "High-Fidelity audio overview with local and downloaded tracks.",
        lib_loading: "Scanning local music pool...",
        lib_empty: 'No audio files found in the "music/" folder.',
        lib_import_title: "Add Local File",
        lib_import_sub: "Import .mp3 or .opus files from your PC.",
        lib_import_btn: "Select File",
        pm_title: "Plugin Manager",
        pm_sub: "Active core extensions for modular streaming capabilities.",
        pm_status_active: "Active",
        pm_status_inactive: "Inactive",
        pm_btn_disable: "Disable",
        pm_btn_enable: "Enable"
    }
};

window.elysiumTranslate = function(lang) {
    localStorage.setItem('elysium_language', lang);
    document.documentElement.lang = lang;
    
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                element.placeholder = translations[lang][key];
            } else {
                element.textContent = translations[lang][key];
            }
        }
    });
};