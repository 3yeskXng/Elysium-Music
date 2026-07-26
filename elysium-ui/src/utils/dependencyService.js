// elysium-ui/src/utils/dependencyService.js
// Central dependency checking service
// Calls check_all_dependencies backend command to verify yt-dlp, ffmpeg, ffprobe availability

import { invokeBackend } from '../api.js';
import { t } from './translate.js';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Deps', msg);
}

/**
 * Check availability of all dependencies via the Rust backend.
 * @returns {Promise<{ytdlp: boolean, ffmpeg: boolean, ffprobe: boolean}>}
 */
export async function checkAllDependencies() {
    log('INFO', 'Checking all dependencies...');
    try {
        const result = await invokeBackend('check_all_dependencies');
        log('SUCCESS', `Dependencies: ytdlp=${result.ytdlp}, ffmpeg=${result.ffmpeg}, ffprobe=${result.ffprobe}`);
        return result;
    } catch (err) {
        log('ERROR', `check_all_dependencies failed: ${err.message || err}`);
        return { ytdlp: false, ffmpeg: false, ffprobe: false };
    }
}

/**
 * Check availability of a single dependency by name.
 * @param {'ytdlp'|'ffmpeg'|'ffprobe'} name
 * @returns {Promise<boolean>}
 */
export async function checkDependency(name) {
    try {
        const status = await checkAllDependencies();
        return !!status[name];
    } catch (err) {
        log('ERROR', `checkDependency failed for ${name}: ${err.message || err}`);
        return false;
    }
}

/**
 * Ensure yt-dlp is available. If not installed, prompt user and install.
 * Called by download flow before attempting a YouTube download.
 * @param {HTMLElement} statusBox - Status display element
 * @param {Function} onSuccess - Callback to run after confirmed installed
 */
export async function ensureYtDlp(statusBox, onSuccess) {
    const status = await checkAllDependencies();
    if (status.ytdlp) {
        log('INFO', 'yt-dlp is available, proceeding');
        onSuccess();
        return;
    }
    log('INFO', 'yt-dlp not found, prompting install...');
    const { setStatusBox } = await import('../modules/dependencies/services/depStatusService.js');
    const { installTool } = await import('../modules/dependencies/services/depInstallerService.js');
    setStatusBox(statusBox, 'rgba(138,92,246,0.1)', 'var(--accent-premium)', t('dl_install_needed'));
    const tool = { name: 'yt-dlp', install: 'install_yt_dlp' };
    await installTool(tool, statusBox, statusBox, onSuccess);
}
