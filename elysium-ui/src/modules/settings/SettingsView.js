// elysium-ui/src/modules/settings/SettingsView.js
// Settings panel view — language selection, plugins, and footer

import { ICON_SETTINGS } from '../../config/icons.js';
import { t } from '../../utils/translate.js';
import { getLanguageOptions } from '../../config/languageRegistry.js';
import { pluginManager } from '../../core/pluginManager.js';
import { APP_FOOTER_TEXT } from '../../config/appInfo.js';
import { handleLanguageChange, handlePluginToggle } from './services/settingsService.js';

export const settingsModule = {
    id: 'settings',
    label: 'nav_settings',
    icon: ICON_SETTINGS,

    render() {
        const div = document.createElement('div');
        div.className = 'view-container animate-fade-in';
        const lang = localStorage.getItem('elysium_language') || 'en';
        const plugins = pluginManager.getPlugins();
        const langOptions = getLanguageOptions(lang);

        div.innerHTML = `
            <h2 class="view-title" data-i18n="settingsTitle">${t('settingsTitle')}</h2>
            <p style="color:var(--text-muted); margin-bottom:24px;" data-i18n="settingsSub">${t('settingsSub')}</p>
            <div style="background:var(--bg-sidebar); border:1px solid var(--border-subtle); padding:20px; border-radius:8px; margin-bottom:30px;">
                <label style="display:block; color:var(--text-main); font-weight:600; margin-bottom:10px; font-size:0.9rem;" data-i18n="langLabel">${t('langLabel')}</label>
                <select id="language-select" style="background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); color:var(--text-main); padding:8px 12px; border-radius:6px; font-size:0.9rem; outline:none; cursor:pointer;">
                    ${langOptions.map(o => `<option value="${o.code}" ${o.selected ? 'selected' : ''}>${o.label}</option>`).join('')}
                </select>
            </div>
            <h3 style="color:var(--text-main); font-size:1.2rem; margin-bottom:8px;" data-i18n="pm_title">${t('pm_title')}</h3>
            <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:16px;" data-i18n="pm_sub">${t('pm_sub')}</p>
            <div id="plugin-list-container" style="display:flex; flex-direction:column; gap:12px;">
                ${plugins.map(p => `
                    <div style="background:var(--bg-sidebar); border:1px solid var(--border-subtle); padding:16px; border-radius:8px; display:flex; align-items:center; justify-content:space-between;">
                        <div>
                            <div style="font-weight:600; color:var(--text-main); font-size:0.95rem;">${p.name} <span style="font-size:0.75rem; color:var(--text-muted); font-weight:400;">v${p.version}</span></div>
                            <div style="font-size:0.8rem; color:${p.active ? 'var(--accent-premium)' : 'var(--text-muted)'}; margin-top:4px;" data-i18n="${p.active ? 'pm_status_active' : 'pm_status_inactive'}">${p.active ? t('pm_status_active') : t('pm_status_inactive')}</div>
                        </div>
                        <button class="plugin-toggle-btn" data-plugin-id="${p.id}" style="background:${p.active ? 'rgba(255,0,0,0.15)' : 'var(--accent-premium)'}; border:1px solid ${p.active ? '#ff4a4a' : 'none'}; color:${p.active ? '#ff4a4a' : 'white'}; padding:6px 14px; border-radius:6px; font-size:0.85rem; cursor:pointer; transition:all 0.2s;">${p.active ? t('pm_btn_disable') : t('pm_btn_enable')}</button>
                    </div>
                `).join('')}
            </div>
            <div id="update-banner" style="display:none; margin-top:20px; padding:14px 18px; background:rgba(138,92,246,0.1); border:1px solid rgba(138,92,246,0.3); border-radius:8px;"></div>
            <div style="margin-top:40px; padding-top:16px; border-top:1px solid var(--border-subtle); text-align:center; font-size:0.8rem; color:var(--text-muted); user-select:none;">
                ${APP_FOOTER_TEXT}
            </div>
        `;

        div.querySelector('#language-select').addEventListener('change', (e) => handleLanguageChange(e.target.value));
        div.querySelectorAll('.plugin-toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => handlePluginToggle(e.target.getAttribute('data-plugin-id')));
        });

        return div;
    }
};
