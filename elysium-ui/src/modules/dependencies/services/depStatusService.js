// elysium-ui/src/modules/dependencies/services/depStatusService.js
// Dependency status checking and UI status display helpers

import { invokeBackend } from '../../../api.js';
import { t } from '../../../utils/translate.js';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Deps', msg);
}

export async function checkAllDependencies() {
    try {
        const status = await invokeBackend('check_all_deps');
        log('INFO', `Dependency status — yt-dlp: ${status.ytdlp}, ffmpeg: ${status.ffmpeg}, ffprobe: ${status.ffprobe}`);
        return status;
    } catch (err) {
        log('ERROR', `Failed to check dependencies: ${err.message || err}`);
        return { ytdlp: false, ffmpeg: false, ffprobe: false };
    }
}

export function updateStatusDisplay(statusDot, statusLabel, installed) {
    statusDot.style.background = installed ? '#22c55e' : '#ef4444';
    statusLabel.textContent = installed ? t('deps_installed') : t('deps_not_installed');
}

export function setStatusBox(el, bg, color, text) {
    el.style.display = 'block';
    el.style.background = bg;
    el.style.color = color;
    el.style.padding = '8px 12px';
    el.style.borderRadius = '6px';
    el.style.fontSize = '0.85rem';
    el.style.marginTop = '8px';
    el.style.userSelect = 'text';
    el.textContent = text;
}

export function createActionButton(text, bgColor, textColor, onClick) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `background:${bgColor}; color:${textColor}; border:none; padding:6px 14px; border-radius:6px; cursor:pointer; font-size:0.85rem; font-weight:600; transition:all 0.2s;`;
    btn.addEventListener('click', onClick);
    return btn;
}
