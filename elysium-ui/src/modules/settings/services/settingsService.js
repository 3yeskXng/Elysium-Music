// elysium-ui/src/modules/settings/services/settingsService.js
// Language and plugin toggle handlers

import { pluginManager } from '../../../core/pluginManager.js';
import { moduleRegistry } from '../../../core/moduleRegistry.js';
import { markUserOverride } from '../../../config/language/languageDetector.js';
import { languageRegistry } from '../../../config/languageRegistry.js';
import { t } from '../../../utils/translate.js';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Settings', msg);
}

export function handleLanguageChange(langCode) {
    markUserOverride();
    log('INFO', `Language changed to: "${langCode}"`);
    window.elysiumTranslate(langCode);
    moduleRegistry.applyTranslations();
    const lang = languageRegistry.find(l => l.code === langCode);
    const langName = lang ? `${lang.flag} ${lang.name}` : langCode;
    window.dispatchEvent(new CustomEvent('elysium-toast', {
        detail: { type: 'info', title: t('toast_language_changed'), message: langName, duration: 3000 }
    }));
}

export function handlePluginToggle(pluginId) {
    pluginManager.togglePlugin(pluginId);
    const nowActive = pluginManager.isPluginActive(pluginId);
    log(nowActive ? 'SUCCESS' : 'WARN', `Plugin "${pluginId}" ${nowActive ? 'enabled' : 'disabled'}`);
    moduleRegistry.setActive('settings');
}
