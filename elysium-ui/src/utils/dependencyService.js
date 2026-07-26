// elysium-ui/src/utils/dependencyService.js
// Cross-platform yt-dlp availability check and auto-installer

import { invokeBackend } from '../api.js';
import { translations } from '../config/translations.js';
import { showLoader, hideLoader } from '../core/loader.js';

const getLang = () => localStorage.getItem('elysium_language') || 'de';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Dependency', msg);
}

function setStatus(box, bg, color, text) {
    box.style.display = 'block';
    box.style.background = bg;
    box.style.color = color;
    box.textContent = text;
}

export async function checkYtDlp() {
    try {
        return await invokeBackend('check_yt_dlp');
    } catch {
        return true;
    }
}

export async function ensureYtDlp(statusBox, onReady) {
    const available = await checkYtDlp();
    if (available) { onReady(); return; }

    const lang = getLang();
    const t = translations[lang] || translations.de;

    statusBox.innerHTML = '';
    const textSpan = document.createElement('span');
    textSpan.textContent = t.dl_ytdlp_missing + ' ';
    statusBox.appendChild(textSpan);

    const installBtn = document.createElement('button');
    installBtn.textContent = t.dl_install_now;
    installBtn.style.cssText = 'background:#eab308; color:#000; border:none; padding:4px 12px; border-radius:4px; cursor:pointer; font-weight:600; margin-left:8px;';

    installBtn.addEventListener('click', async () => {
        installBtn.disabled = true;
        installBtn.textContent = t.dl_installing;
        showLoader(statusBox.parentElement, t.dl_installing);

        try {
            await invokeBackend('install_yt_dlp');
            hideLoader(statusBox.parentElement);
            log('SUCCESS', 'yt-dlp installed successfully');
            onReady();
        } catch (err) {
            hideLoader(statusBox.parentElement);
            setStatus(statusBox, 'rgba(239,68,68,0.1)', '#ef4444',
                `${t.dl_install_error}: ${err.message || err}`);
            log('ERROR', `yt-dlp install failed: ${err.message || err}`);
        }
    });

    setStatus(statusBox, 'rgba(255,180,0,0.1)', '#eab308', '');
    statusBox.appendChild(installBtn);
}
