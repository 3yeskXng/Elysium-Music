// elysium-ui/src/main.js
import { i18n } from './core/i18n.js';
import { registry } from './core/registry.js';
import { layoutEngine } from './core/layout.js';

// Boot orchestration engine
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Localization Parameters
    i18n.init();

    // 2. Wake layout reactive event listeners up
    layoutEngine.init();

    // 3. Mock Up Activation of first core functional layout hooks (Temporary registration)
    // We will clean these mocks up in the next phase by building genuine modular plugins!
    registry.registerView('downloader', 'sidebar_load', (mount) => {
        mount.innerHTML = `
            <div style="width:100%">
                <input type="text" class="search-input" style="width:100%; padding:12px; border:2px solid black;" placeholder="${i18n.t('search_placeholder')}">
                <h3 style="margin-top:30px;">${i18n.t('recently_downloaded')}</h3>
            </div>
        `;
    }, 'navigation');

    registry.registerView('player', 'sidebar_listen', (mount) => {
        mount.innerHTML = `<h1>Listen Engine Scope Workspace</h1>`;
    }, 'navigation');

    registry.registerView('settings', 'sidebar_settings', (mount) => {
        mount.innerHTML = `<h1>Settings Layer Control Array</h1>`;
    }, 'footer');

    // 4. Fire initial route switch
    registry.switchView('downloader');
});