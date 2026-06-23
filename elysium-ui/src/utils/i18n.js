// Dictionary containing all UI strings for supported languages
const translations = {
    de: {
        searchPlaceholder: "Nach Songs, Alben oder Plugins suchen...",
        skipButton: "Song überspringen",
        settingsLabel: "Sprache wechseln",
        noPlugins: "Keine aktiven Streaming-Plugins gefunden."
    },
    en: {
        searchPlaceholder: "Search for songs, albums or plugins...",
        skipButton: "Skip song",
        settingsLabel: "Change Language",
        noPlugins: "No active streaming plugins found."
    }
};

// Retrieve saved language from localStorage, default to German ('de')
let currentLang = localStorage.getItem('elysium_lang') || 'de';

/**
 * Updates all DOM elements with data-i18n attributes based on the current language
 */
export function applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang] && translations[currentLang][key]) {
            // Check if element is an input field to change placeholder instead of text
            if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
                el.placeholder = translations[currentLang][key];
            } else {
                el.innerText = translations[currentLang][key];
            }
        }
    });
    
    // Synchronize language selectors (dropdowns) if they exist
    const selector = document.getElementById('language-select');
    if (selector) selector.value = currentLang;
}

/**
 * Changes the active language and persists the selection
 * @param {string} langCode - 'de' or 'en'
 */
export function setLanguage(langCode) {
    if (translations[langCode]) {
        currentLang = langCode;
        localStorage.setItem('elysium_lang', langCode);
        applyTranslations();
    }
}

// Automatically apply translations on initial script execution
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
});