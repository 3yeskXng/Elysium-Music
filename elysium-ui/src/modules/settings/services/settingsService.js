// elysium-ui/src/modules/settings/services/settingsService.js
// Language and plugin toggle handlers

import { pluginManager } from '../../../core/pluginManager.js';
import { moduleRegistry } from '../../../core/moduleRegistry.js';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Settings', msg);
}

export function handleLanguageChange(langCode) {
    log('INFO', `Language changed to: "${langCode}"`);
    window.elysiumTranslate(langCode);
    moduleRegistry.applyTranslations();
}

export function handlePluginToggle(pluginId) {
    pluginManager.togglePlugin(pluginId);
    const nowActive = pluginManager.isPluginActive(pluginId);
    log(nowActive ? 'SUCCESS' : 'WARN', `Plugin "${pluginId}" ${nowActive ? 'enabled' : 'disabled'}`);
    moduleRegistry.setActive('settings');
}
