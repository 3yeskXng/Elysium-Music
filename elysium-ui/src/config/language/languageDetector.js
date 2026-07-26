// elysium-ui/src/config/language/languageDetector.js
// OS language detection — reads navigator.language and maps to supported app language

import { mapLocaleToLanguage } from './languageMap.js';

const STORAGE_KEY = 'elysium_language';
const USER_OVERRIDE_KEY = 'elysium_language_user_set';

function getNavigatorLocales() {
    const locales = [];
    if (navigator.language) locales.push(navigator.language);
    if (navigator.languages) {
        navigator.languages.forEach(l => {
            if (!locales.includes(l)) locales.push(l);
        });
    }
    return locales;
}

export function detectSystemLanguage() {
    const locales = getNavigatorLocales();
    for (const locale of locales) {
        const mapped = mapLocaleToLanguage(locale);
        if (mapped !== 'en') return mapped;
    }
    return 'en';
}

export function hasUserOverride() {
    return localStorage.getItem(USER_OVERRIDE_KEY) === 'true';
}

export function markUserOverride() {
    localStorage.setItem(USER_OVERRIDE_KEY, 'true');
}

export function initializeLanguage() {
    if (hasUserOverride()) {
        return localStorage.getItem(STORAGE_KEY) || 'en';
    }

    const detected = detectSystemLanguage();
    localStorage.setItem(STORAGE_KEY, detected);
    return detected;
}
