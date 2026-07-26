// elysium-ui/src/modules/settings/services/dependencyInstaller.js
// Individual dependency install/update buttons for Settings view
// Listens to "dep-progress" Tauri events for real-time status

import { invokeBackend } from '../../../api.js';
import { translations } from '../../../config/translations.js';
import { showLoader, hideLoader } from '../../../core/loader.js';

function t(key) {
    const lang = localStorage.getItem('elysium_language') || 'de';
    const dict = translations[lang] || translations.de;
    return dict[key] || key;
}

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Dependency', msg);
}

function makeButton(text, bgColor, textColor, onClick) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `background:${bgColor}; color:${textColor}; border:none; padding:6px 14px; border-radius:6px; cursor:pointer; font-size:0.85rem; font-weight:600; transition:all 0.2s;`;
    btn.addEventListener('click', onClick);
    return btn;
}

function setStatus(el, bg, color, text) {
    el.style.display = 'block';
    el.style.background = bg;
    el.style.color = color;
    el.style.padding = '8px 12px';
    el.style.borderRadius = '6px';
    el.style.fontSize = '0.85rem';
    el.style.marginTop = '8px';
    el.textContent = text;
}

function listenProgress(toolName, statusBox, onDone) {
    if (!window.__TAURI_INTERNALS__) return () => {};
    const { listen } = window.__TAURI_INTERNALS__;
    const unlisten = listen('dep-progress', (event) => {
        const p = event.payload;
        if (p.tool !== toolName && p.tool !== 'ffmpeg') return;
        log('INFO', `[${p.tool}] ${p.step}: ${p.message}`);
        if (p.step === 'done' || p.step === 'skip') {
            setStatus(statusBox, 'rgba(34,197,94,0.1)', '#22c55e', p.message);
            if (onDone) onDone();
        } else {
            setStatus(statusBox, 'rgba(138,92,246,0.1)', 'var(--accent-premium)', p.message);
        }
    });
    return unlisten;
}

export function createDependencySection(container) {
    const section = document.createElement('div');
    section.style.cssText = 'background:var(--bg-sidebar); border:1px solid var(--border-subtle); padding:20px; border-radius:8px; margin-bottom:30px;';

    const title = document.createElement('h3');
    title.style.cssText = 'color:var(--text-main); font-size:1rem; font-weight:600; margin-bottom:16px;';
    title.textContent = t('deps_title');
    section.appendChild(title);

    const tools = [
        { name: 'yt-dlp', check: 'check_yt_dlp', install: 'install_yt_dlp', update: 'update_yt_dlp', canUpdate: true },
        { name: 'ffmpeg', check: 'check_ffmpeg', install: 'install_ffmpeg', canUpdate: false },
        { name: 'ffprobe', check: 'check_ffprobe', install: 'install_ffprobe', canUpdate: false },
    ];

    tools.forEach(tool => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex; align-items:center; gap:12px; margin-bottom:12px; padding:12px; background:rgba(0,0,0,0.2); border-radius:6px;';

        const label = document.createElement('span');
        label.style.cssText = 'font-weight:600; color:var(--text-main); min-width:80px;';
        label.textContent = tool.name;

        const statusDot = document.createElement('span');
        statusDot.style.cssText = 'width:8px; height:8px; border-radius:50%;';

        const statusLabel = document.createElement('span');
        statusLabel.style.cssText = 'font-size:0.8rem; color:var(--text-muted); flex:1;';

        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex; gap:8px; margin-left:auto;';

        const statusBox = document.createElement('div');
        statusBox.style.cssText = 'display:none; width:100%; margin-top:8px;';

        row.appendChild(label);
        row.appendChild(statusDot);
        row.appendChild(statusLabel);
        row.appendChild(actions);
        row.appendChild(statusBox);
        section.appendChild(row);

        async function refreshStatus() {
            let unlistenFn = null;
            try {
                const result = await invokeBackend(tool.check);
                const installed = result === true || result === 'true';
                statusDot.style.background = installed ? '#22c55e' : '#ef4444';
                statusLabel.textContent = installed ? t('deps_installed') : t('deps_not_installed');
                actions.innerHTML = '';
                statusBox.style.display = 'none';

                if (!installed) {
                    const installBtn = makeButton(
                        t('dl_install_now'),
                        'var(--accent-premium)', 'white',
                        async () => {
                            installBtn.disabled = true;
                            installBtn.textContent = t('deps_installing');
                            showLoader(section, `${t('dl_downloading')} ${tool.name}...`);
                            unlistenFn = listenProgress(tool.name, statusBox);
                            try {
                                await invokeBackend(tool.install);
                                log('SUCCESS', `${tool.name} installed`);
                                hideLoader(section);
                                refreshStatus();
                            } catch (err) {
                                hideLoader(section);
                                if (unlistenFn) { unlistenFn(); unlistenFn = null; }
                                setStatus(statusBox, 'rgba(239,68,68,0.1)', '#ef4444',
                                    `${t('dl_install_error')}: ${err.message || err}`);
                                log('ERROR', `${tool.name} install failed: ${err.message || err}`);
                                installBtn.disabled = false;
                                installBtn.textContent = t('dl_install_now');
                            }
                        }
                    );
                    actions.appendChild(installBtn);
                } else if (tool.canUpdate) {
                    const updateBtn = makeButton(
                        t('deps_update'),
                        'rgba(255,180,0,0.15)', '#eab308',
                        async () => {
                            updateBtn.disabled = true;
                            updateBtn.textContent = t('deps_update_running');
                            showLoader(section, `${t('deps_checking_update')} ${tool.name}...`);
                            unlistenFn = listenProgress(tool.name, statusBox);
                            try {
                                const result = await invokeBackend(tool.update);
                                hideLoader(section);
                                if (unlistenFn) { unlistenFn(); unlistenFn = null; }
                                setStatus(statusBox, 'rgba(34,197,94,0.1)', '#22c55e',
                                    result || `${tool.name} ${t('deps_up_to_date')}`);
                                log('SUCCESS', `${tool.name} update: ${result}`);
                                refreshStatus();
                            } catch (err) {
                                hideLoader(section);
                                if (unlistenFn) { unlistenFn(); unlistenFn = null; }
                                setStatus(statusBox, 'rgba(239,68,68,0.1)', '#ef4444',
                                    `${err.message || err}`);
                                log('ERROR', `${tool.name} update failed: ${err.message || err}`);
                                updateBtn.disabled = false;
                                updateBtn.textContent = t('deps_update');
                            }
                        }
                    );
                    actions.appendChild(updateBtn);
                }
            } catch {
                if (unlistenFn) unlistenFn();
                statusDot.style.background = '#ef4444';
                statusLabel.textContent = t('deps_check_error');
            }
        }

        refreshStatus();
    });

    container.appendChild(section);
}
