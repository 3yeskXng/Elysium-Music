// src/modules/settingsModule.js
import { ICON_SETTINGS } from '../config/icons.js';
import { translations } from '../config/translations.js';
import { pluginManager } from '../core/pluginManager.js';

export const settingsModule = {
    id: 'settings',
    label: 'Einstellungen',
    icon: ICON_SETTINGS,
    render() {
        const div = document.createElement('div');
        div.className = 'view-container animate-fade-in';
        
        const current = localStorage.getItem('elysium_language') || 'de';
        const activePlugins = pluginManager.getPlugins();
        
        div.innerHTML = `
            <h2 class="view-title" data-i18n="settingsTitle">${translations[current].settingsTitle}</h2>
            <p style="color:var(--text-muted); margin-bottom: 24px;" data-i18n="settingsSub">${translations[current].settingsSub}</p>
            
            <div style="background: var(--bg-sidebar); border: 1px solid var(--border-subtle); padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <label style="display: block; color: var(--text-main); font-weight: 600; margin-bottom: 10px; font-size:0.9rem;" data-i18n="langLabel">${translations[current].langLabel}</label>
                <select id="language-select" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); color: var(--text-main); padding: 8px 12px; border-radius: 6px; font-size: 0.9rem; outline: none; cursor: pointer;">
                    <option value="de" ${current === 'de' ? 'selected' : ''}>Deutsch</option>
                    <option value="en" ${current === 'en' ? 'selected' : ''}>English</option>
                </select>
            </div>

            <h3 style="color: var(--text-main); font-size: 1.2rem; margin-bottom: 8px;" data-i18n="pm_title">${translations[current].pm_title}</h3>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 16px;" data-i18n="pm_sub">${translations[current].pm_sub}</p>
            
            <div id="plugin-list-container" style="display: flex; flex-direction: column; gap: 12px;">
                ${activePlugins.map(plugin => `
                    <div style="background: var(--bg-sidebar); border: 1px solid var(--border-subtle); padding: 16px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <div style="font-weight: 600; color: var(--text-main); font-size: 0.95rem;">${plugin.name} <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 400;">v${plugin.version}</span></div>
                            <div style="font-size: 0.8rem; color: ${plugin.active ? 'var(--accent-premium)' : 'var(--text-muted)'}; margin-top: 4px;" data-i18n="${plugin.active ? 'pm_status_active' : 'pm_status_inactive'}">
                                ${plugin.active ? translations[current].pm_status_active : translations[current].pm_status_inactive}
                            </div>
                        </div>
                        <button class="plugin-toggle-btn" data-plugin-id="${plugin.id}" style="background: ${plugin.active ? 'rgba(255,0,0,0.15)' : 'var(--accent-premium)'}; border: 1px solid ${plugin.active ? '#ff4a4a' : 'none'}; color: ${plugin.active ? '#ff4a4a' : 'white'}; padding: 6px 14px; border-radius: 6px; font-size: 0.85rem; cursor: pointer; transition: all 0.2s;">
                            ${plugin.active ? translations[current].pm_btn_disable : translations[current].pm_btn_enable}
                        </button>
                    </div>
                `).join('')}
            </div>
        `;

        div.querySelector('#language-select').addEventListener('change', (e) => {
            window.elysiumTranslate(e.target.value);
        });

        div.querySelectorAll('.plugin-toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pid = e.target.getAttribute('data-plugin-id');
                pluginManager.togglePlugin(pid);
                const mountPoint = document.getElementById('content-mount-point');
                mountPoint.innerHTML = '';
                mountPoint.appendChild(settingsModule.render());
            });
        });

        return div;
    }
};