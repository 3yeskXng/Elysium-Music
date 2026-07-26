// elysium-ui/src/config/language/languageMap.js
// OS language to app language mapping — single source of truth for locale detection
// Maps browser/OS locale codes to our supported translation codes

import { languageRegistry } from '../languageRegistry.js';

const SUPPORTED_CODES = languageRegistry.map(l => l.code);

const LOCALE_MAP = {
    'de': 'de',
    'en': 'en',
    'es': 'es',
    'fr': 'fr',
    'ru': 'ru',
    'pt-BR': 'pt-BR',
    'pt': 'pt-BR',
    'pt-PT': 'pt-BR',
};

export function mapLocaleToLanguage(locale) {
    if (!locale || typeof locale !== 'string') return 'en';

    if (LOCALE_MAP[locale]) return LOCALE_MAP[locale];

    const base = locale.split('-')[0].toLowerCase();
    if (LOCALE_MAP[base]) return LOCALE_MAP[base];

    if (SUPPORTED_CODES.includes(base)) return base;

    return 'en';
}
