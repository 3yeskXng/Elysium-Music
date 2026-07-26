// elysium-ui/src/utils/translate.js
// Centralized translation lookup — single source of truth for all t() calls

import { translations } from '../config/translations.js';

export function t(key) {
    const lang = localStorage.getItem('elysium_language') || 'en';
    const dict = translations[lang] || translations.en;
    return dict[key] || key;
}

export function getCurrentLang() {
    return localStorage.getItem('elysium_language') || 'en';
}

export function interpolate(template, values) {
    let result = template;
    for (const [key, val] of Object.entries(values)) {
        result = result.replace(`\${${key}}`, String(val));
    }
    return result;
}
