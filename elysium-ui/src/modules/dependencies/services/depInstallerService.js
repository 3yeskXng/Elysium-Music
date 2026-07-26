// elysium-ui/src/modules/dependencies/services/depInstallerService.js
// Install and update handlers for yt-dlp, ffmpeg, ffprobe

import { invokeBackend } from '../../../api.js';
import { t } from '../../../utils/translate.js';
import { showLoader, hideLoader } from '../../../core/loader.js';
import { listenProgress, safeUnlisten } from './depProgressService.js';
import { checkAllDependencies, setStatusBox } from './depStatusService.js';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Deps', msg);
}

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 20;

function getToolInstalled(status, toolName) {
    if (toolName === 'yt-dlp') return status.ytdlp;
    if (toolName === 'ffmpeg') return status.ffmpeg;
    return status.ffprobe;
}

function startPollingVerification(tool, statusBox, onRefresh) {
    let attempts = 0;
    const interval = setInterval(async () => {
        attempts++;
        try {
            const status = await checkAllDependencies();
            if (getToolInstalled(status, tool.name)) {
                clearInterval(interval);
                log('SUCCESS', `${tool.name} detected after ${attempts} polls`);
                setStatusBox(statusBox, 'rgba(34,197,94,0.1)', '#22c55e',
                    `${tool.name} ${t('deps_installed')}`);
                onRefresh();
            } else if (attempts >= POLL_MAX_ATTEMPTS) {
                clearInterval(interval);
                log('WARN', `${tool.name} not detected after ${POLL_MAX_ATTEMPTS} polls`);
                setStatusBox(statusBox, 'rgba(251,191,36,0.1)', '#fbbf24',
                    t('deps_check_terminal'));
            }
        } catch (err) {
            log('ERROR', `Poll check failed: ${err.message || err}`);
        }
    }, POLL_INTERVAL_MS);
}

export async function installTool(tool, section, statusBox, onRefresh) {
    let unlistenFn = null;
    log('INFO', `Starting installation of ${tool.name}...`);
    showLoader(section, `${t('dl_downloading')} ${tool.name}...`);
    unlistenFn = await listenProgress(tool.name, statusBox);

    try {
        const result = await invokeBackend('install_dep', { name: tool.name });
        log('SUCCESS', `${tool.name}: ${result}`);
        hideLoader(section);
        unlistenFn = safeUnlisten(unlistenFn);
        setStatusBox(statusBox, 'rgba(34,197,94,0.1)', '#22c55e',
            `${tool.name} ${t('deps_installed')}`);
        onRefresh();
    } catch (err) {
        hideLoader(section);
        unlistenFn = safeUnlisten(unlistenFn);
        const errMsg = `${t('dl_install_error')}: ${err.message || err}`;
        setStatusBox(statusBox, 'rgba(239,68,68,0.1)', '#ef4444', errMsg);
        log('ERROR', `${tool.name} install failed: ${err.message || err}`);
    }
}

export async function updateTool(tool, section, statusBox, onRefresh) {
    let unlistenFn = null;
    log('INFO', `Starting update of ${tool.name}...`);
    showLoader(section, `${t('deps_checking_update')} ${tool.name}...`);
    unlistenFn = await listenProgress(tool.name, statusBox);

    try {
        const result = await invokeBackend('update_dep', { name: tool.name });
        log('SUCCESS', `${tool.name} update result: ${result}`);
        hideLoader(section);
        unlistenFn = safeUnlisten(unlistenFn);
        setStatusBox(statusBox, 'rgba(34,197,94,0.1)', '#22c55e',
            `${tool.name} ${t('deps_installed')}`);
        onRefresh();
    } catch (err) {
        hideLoader(section);
        unlistenFn = safeUnlisten(unlistenFn);
        setStatusBox(statusBox, 'rgba(239,68,68,0.1)', '#ef4444',
            `${err.message || err}`);
        log('ERROR', `${tool.name} update failed: ${err.message || err}`);
    }
}
