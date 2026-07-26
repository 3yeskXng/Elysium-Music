// elysium-ui/src/modules/dependencies/DependencyView.js
// Dependencies module view — UI layout for managing yt-dlp, ffmpeg, ffprobe

import { ICON_DEPS } from '../../config/icons.js';
import { t } from '../../utils/translate.js';
import { checkAllDependencies, updateStatusDisplay, setStatusBox, createActionButton } from './services/depStatusService.js';
import { installTool, updateTool } from './services/depInstallerService.js';

const TOOLS = [
    { name: 'yt-dlp', canUpdate: true },
    { name: 'ffmpeg', canUpdate: false },
    { name: 'ffprobe', canUpdate: false },
];

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Deps', msg);
}

function createToolRow(tool, section) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'margin-bottom:12px;';

    const row = document.createElement('div');
    row.style.cssText = 'display:flex; align-items:center; gap:12px; padding:12px; background:rgba(0,0,0,0.2); border-radius:6px;';

    const label = document.createElement('span');
    label.style.cssText = 'font-weight:600; color:var(--text-main); min-width:80px;';
    label.textContent = tool.name;

    const statusDot = document.createElement('span');
    statusDot.style.cssText = 'width:8px; height:8px; border-radius:50%;';

    const statusLabel = document.createElement('span');
    statusLabel.style.cssText = 'font-size:0.8rem; color:var(--text-muted); flex:1;';

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex; gap:8px; margin-left:auto;';

    row.appendChild(label);
    row.appendChild(statusDot);
    row.appendChild(statusLabel);
    row.appendChild(actions);

    const statusBox = document.createElement('div');
    statusBox.style.cssText = 'display:none; width:100%; margin-top:8px; padding:10px 14px; border-radius:6px; font-size:0.85rem; line-height:1.5; user-select:text;';

    wrapper.appendChild(row);
    wrapper.appendChild(statusBox);

    async function refreshStatus() {
        try {
            const status = await checkAllDependencies();
            let installed;
            if (tool.name === 'yt-dlp') installed = status.ytdlp;
            else if (tool.name === 'ffmpeg') installed = status.ffmpeg;
            else installed = status.ffprobe;

            updateStatusDisplay(statusDot, statusLabel, installed);
            actions.innerHTML = '';
            statusBox.style.display = 'none';

            if (!installed) {
                const installBtn = createActionButton(
                    t('dl_install_now'),
                    'var(--accent-premium)', 'white',
                    async () => {
                        installBtn.disabled = true;
                        installBtn.textContent = t('deps_installing');
                        await installTool(tool, section, statusBox, refreshStatus);
                        installBtn.disabled = false;
                        installBtn.textContent = t('dl_install_now');
                    }
                );
                actions.appendChild(installBtn);
            } else if (tool.canUpdate) {
                const updateBtn = createActionButton(
                    t('deps_update'),
                    'rgba(255,180,0,0.15)', '#eab308',
                    async () => {
                        updateBtn.disabled = true;
                        updateBtn.textContent = t('deps_update_running');
                        await updateTool(tool, section, statusBox, refreshStatus);
                        updateBtn.disabled = false;
                        updateBtn.textContent = t('deps_update');
                    }
                );
                actions.appendChild(updateBtn);
            }
        } catch {
            statusDot.style.background = '#ef4444';
            statusLabel.textContent = t('deps_check_error');
        }
    }

    refreshStatus();
    return wrapper;
}

export const dependenciesModule = {
    id: 'dependencies',
    label: 'nav_dependencies',
    icon: ICON_DEPS,

    render() {
        const div = document.createElement('div');
        div.className = 'view-container animate-fade-in';

        div.innerHTML = `
            <h2 class="view-title" data-i18n="deps_title">${t('deps_title')}</h2>
            <p style="color:var(--text-muted); font-size:0.95rem; margin-bottom:24px;" data-i18n="settingsSub">${t('settingsSub')}</p>
        `;

        const section = document.createElement('div');
        section.style.cssText = 'background:var(--bg-sidebar); border:1px solid var(--border-subtle); padding:20px; border-radius:8px; margin-bottom:30px;';

        const title = document.createElement('h3');
        title.style.cssText = 'color:var(--text-main); font-size:1rem; font-weight:600; margin-bottom:16px;';
        title.textContent = t('deps_title');
        section.appendChild(title);

        TOOLS.forEach(tool => {
            section.appendChild(createToolRow(tool, section));
        });

        div.appendChild(section);
        return div;
    }
};
