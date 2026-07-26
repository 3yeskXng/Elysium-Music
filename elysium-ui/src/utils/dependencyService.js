// elysium-ui/src/utils/dependencyService.js
// Central dependency checking service

import { invokeBackend } from '../api.js';
import { t } from './translate.js';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Deps', msg);
}

export async function checkAllDependencies() {
    log('INFO', 'Checking all dependencies...');
    try {
        const result = await invokeBackend('check_all_deps');
        log('SUCCESS', `Dependencies: ytdlp=${result.ytdlp}, ffmpeg=${result.ffmpeg}, ffprobe=${result.ffprobe}`);
        return result;
    } catch (err) {
        log('ERROR', `check_all_deps failed: ${err.message || err}`);
        return { ytdlp: false, ffmpeg: false, ffprobe: false };
    }
}

export async function checkDependency(name) {
    try {
        const status = await checkAllDependencies();
        return !!status[name];
    } catch (err) {
        log('ERROR', `checkDependency failed for ${name}: ${err.message || err}`);
        return false;
    }
}

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
    const tool = { name: 'yt-dlp' };
    await installTool(tool, statusBox, statusBox, onSuccess);
}
