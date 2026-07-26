// elysium-ui/src/config/languageRegistry.js
// Language registry: single source of truth for all supported languages.
// To add a new language, add an entry here AND the matching keys in translations/<code>.js

export const languageRegistry = [
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

/**
 * Returns available languages formatted for <select> option rendering.
 * @param {string} currentCode - The currently active language code
 * @returns {Array<{code: string, label: string, selected: boolean}>}
 */
export function getLanguageOptions(currentCode) {
    return languageRegistry.map(lang => ({
        code: lang.code,
        label: `${lang.flag} ${lang.name}`,
        selected: lang.code === currentCode,
    }));
}
