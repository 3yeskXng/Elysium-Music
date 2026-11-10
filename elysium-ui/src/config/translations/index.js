// elysium-ui/src/config/translations/index.js
// Combined translation dictionary and DOM translator — single entry point

import de from './de.js';
import en from './en.js';
import es from './es.js';
import fr from './fr.js';
import ja from './ja.js';
import ru from './ru.js';
import tr from './tr.js';
import ptBR from './pt-BR.js';
import { newFastTranslations } from './newfast/index.js';

function mergeLanguage(base, extra) {
    return { ...base, ...(extra || {}) };
}

export const translations = {
    de: mergeLanguage(de, newFastTranslations.de),
    en: mergeLanguage(en, newFastTranslations.en),
    es: mergeLanguage(es, newFastTranslations.es),
    fr: mergeLanguage(fr, newFastTranslations.fr),
    ja: mergeLanguage(ja, newFastTranslations.ja),
    ru: mergeLanguage(ru, newFastTranslations.ru),
    tr: mergeLanguage(tr, newFastTranslations.tr),
    'pt-BR': mergeLanguage(ptBR, newFastTranslations['pt-BR'])
};

window.elysiumTranslate = function (lang) {
    localStorage.setItem('elysium_language', lang);
    document.documentElement.lang = lang;
    const dict = translations[lang] || translations.en;
    if (!dict) return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (!dict[key]) return;
        if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
            el.placeholder = dict[key];
        } else {
            el.textContent = dict[key];
        }
    });
};
