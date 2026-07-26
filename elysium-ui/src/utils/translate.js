// elysium-ui/src/utils/translate.js
// Centralized translation lookup — single source of truth for all t() calls
// Replaces duplicated t() functions that were scattered across multiple service files

import { translations } from '../config/translations.js';

/**
 * Returns the translated string for a given key in the current language.
 * Falls back to German if the key is missing in the active language.
 * @param {string} key - The translation key (e.g. 'deps_title')
 * @returns {string} The translated string or the key itself as last resort
 */
export function t(key) {
    const lang = localStorage.getItem('elysium_language') || 'de';
    const dict = translations[lang] || translations.de;
    return dict[key] || key;
}

/**
 * Returns the current language code from localStorage.
 * @returns {string} Language code (e.g. 'de', 'en', 'es', 'fr')
 */
export function getCurrentLang() {
    return localStorage.getItem('elysium_language') || 'de';
}

/**
 * Interpolates a template string with provided values.
 * Usage: interpolate('Hello ${name}', { name: 'World' }) => 'Hello World'
 * @param {string} template - Template string with ${key} placeholders
 * @param {Object} values - Key-value pairs to substitute
 * @returns {string} Interpolated string
 */
export function interpolate(template, values) {
    let result = template;
    for (const [key, val] of Object.entries(values)) {
        result = result.replace(`\${${key}}`, String(val));
    }
    return result;
}
