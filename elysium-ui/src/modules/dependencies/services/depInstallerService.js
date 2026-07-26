// elysium-ui/src/modules/dependencies/services/depInstallerService.js
// Install and update handlers for yt-dlp, ffmpeg, ffprobe
// Triggers auto-restart after ffmpeg/ffprobe installation

import { invokeBackend } from '../../../api.js';
import { t } from '../../../utils/translate.js';
import { showLoader, hideLoader } from '../../../core/loader.js';
import { listenProgress, safeUnlisten } from './depProgressService.js';
import { setStatusBox } from './depStatusService.js';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Deps', msg);
}

const RESTART_DELAY_MS = 5000;

/**
 * Install a dependency tool by calling the backend command.
 * Shows loader, listens to progress events, and triggers auto-restart for ffmpeg.
 * @param {Object} tool - Tool config { name, check, install, update?, canUpdate }
 * @param {HTMLElement} section - The container section element
 * @param {HTMLElement} statusBox - The status display element
 * @param {Function} onRefresh - Callback to refresh status after install
 */
export async function installTool(tool, section, statusBox, onRefresh) {
    let unlistenFn = null;
    showLoader(section, `${t('dl_downloading')} ${tool.name}...`);
    unlistenFn = listenProgress(tool.name, statusBox);

    try {
        await invokeBackend(tool.install);
        log('SUCCESS', `${tool.name} installed`);
        hideLoader(section);
        unlistenFn = safeUnlisten(unlistenFn);

        const isFfmpegTool = tool.name === 'ffmpeg' || tool.name === 'ffprobe';
        if (isFfmpegTool) {
            triggerAutoRestart(section, statusBox, onRefresh);
        } else {
            onRefresh();
        }
    } catch (err) {
        hideLoader(section);
        unlistenFn = safeUnlisten(unlistenFn);
        setStatusBox(statusBox, 'rgba(239,68,68,0.1)', '#ef4444',
            `${t('dl_install_error')}: ${err.message || err}`);
        log('ERROR', `${tool.name} install failed: ${err.message || err}`);
    }
}

/**
 * Update yt-dlp by calling the backend update command.
 * @param {Object} tool - Tool config with update command
 * @param {HTMLElement} section - The container section element
 * @param {HTMLElement} statusBox - The status display element
 * @param {Function} onRefresh - Callback to refresh status after update
 */
export async function updateTool(tool, section, statusBox, onRefresh) {
    let unlistenFn = null;
    showLoader(section, `${t('deps_checking_update')} ${tool.name}...`);
    unlistenFn = listenProgress(tool.name, statusBox);

    try {
        const result = await invokeBackend(tool.update);
        hideLoader(section);
        unlistenFn = safeUnlisten(unlistenFn);
        setStatusBox(statusBox, 'rgba(34,197,94,0.1)', '#22c55e',
            result || `${tool.name} ${t('deps_up_to_date')}`);
        log('SUCCESS', `${tool.name} update: ${result}`);
        onRefresh();
    } catch (err) {
        hideLoader(section);
        unlistenFn = safeUnlisten(unlistenFn);
        setStatusBox(statusBox, 'rgba(239,68,68,0.1)', '#ef4444',
            `${err.message || err}`);
        log('ERROR', `${tool.name} update failed: ${err.message || err}`);
    }
}

/**
 * Trigger auto-restart countdown after ffmpeg/ffprobe installation.
 * Shows countdown in status box, then calls restart_app backend command.
 * @param {HTMLElement} section - The container section element
 * @param {HTMLElement} statusBox - The status display element
 * @param {Function} onRefresh - Callback to refresh status
 */
function triggerAutoRestart(section, statusBox, onRefresh) {
    setStatusBox(statusBox, 'rgba(138,92,246,0.1)', 'var(--accent-premium)',
        t('deps_restart_required'));
    log('INFO', 'Auto-restart triggered after ffmpeg installation');

    let countdown = 5;
    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            restartApp();
        } else {
            setStatusBox(statusBox, 'rgba(138,92,246,0.1)', 'var(--accent-premium)',
                `${t('deps_auto_restart')} ${countdown} ${t('deps_seconds')}`);
        }
    }, 1000);
}

/**
 * Call the backend to restart the application.
 */
async function restartApp() {
    try {
        await invokeBackend('restart_app');
    } catch (err) {
        log('ERROR', `Restart failed: ${err.message || err}`);
        window.location.reload();
    }
}
