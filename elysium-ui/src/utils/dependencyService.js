// elysium-ui/src/utils/dependencyService.js
// Central dependency checking service
// Calls check_all_dependencies backend command to verify yt-dlp, ffmpeg, ffprobe availability

import { invokeBackend } from '../api.js';

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
