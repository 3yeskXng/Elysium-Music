// elysium-ui/src/utils/dependencyService.js
// Cross-platform dependency check and auto-installer for yt-dlp, ffmpeg, ffprobe

import { invokeBackend } from '../api.js';
import { translations } from '../config/translations.js';
import { showLoader, hideLoader } from '../core/loader.js';

const getLang = () => localStorage.getItem('elysium_language') || 'de';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Dependency', msg);
}

function setStatus(box, bg, color, html) {
    box.style.display = 'block';
    box.style.background = bg;
    box.style.color = color;
    box.innerHTML = html;
}

export async function checkYtDlp() {
    try {
        return await invokeBackend('check_yt_dlp');
    } catch {
        return true;
    }
}

export async function checkAllDependencies() {
    try {
        const status = await invokeBackend('check_all_dependencies');
        return status || { ytdlp: true, ffmpeg: true, ffprobe: true };
    } catch {
        return { ytdlp: true, ffmpeg: true, ffprobe: true };
    }
}

export async function ensureYtDlp(statusBox, onReady) {
    const lang = getLang();
    const t = translations[lang] || translations.de;

    let status;
    try {
        status = await checkAllDependencies();
    } catch {
        status = { ytdlp: true, ffmpeg: true, ffprobe: true };
    }

    const missing = [];
    if (!status.ytdlp) missing.push('yt-dlp');
    if (!status.ffmpeg) missing.push('ffmpeg');
    if (!status.ffprobe) missing.push('ffprobe');

    if (missing.length === 0) {
        onReady();
        return;
    }

    const parts = missing.map(m => `<strong>${m}</strong>`).join(', ');
    const msg = lang === 'de'
        ? `Fehlende Abhängigkeiten: ${parts}. Bitte installiere diese, um Audiodateien herunterzuladen und Metadaten auszulesen.`
        : `Missing dependencies: ${parts}. Please install them to download audio and read metadata.`;

    if (!status.ytdlp) {
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
                const recheck = await checkAllDependencies();
                const stillMissing = [];
                if (!recheck.ytdlp) stillMissing.push('yt-dlp');
                if (!recheck.ffmpeg) stillMissing.push('ffmpeg');
                if (!recheck.ffprobe) stillMissing.push('ffprobe');
                if (stillMissing.length > 0) {
                    const stillParts = stillMissing.map(m => `<strong>${m}</strong>`).join(', ');
                    const hint = lang === 'de'
                        ? `<br><span style="font-size:0.85rem; opacity:0.8;">Bitte installiere zusätzlich: ${stillParts}</span>`
                        : `<br><span style="font-size:0.85rem; opacity:0.8;">Please also install: ${stillParts}</span>`;
                    setStatus(statusBox, 'rgba(255,180,0,0.1)', '#eab308', t.dl_ytdlp_installed + hint);
                } else {
                    onReady();
                }
            } catch (err) {
                hideLoader(statusBox.parentElement);
                setStatus(statusBox, 'rgba(239,68,68,0.1)', '#ef4444',
                    `${t.dl_install_error}: ${err.message || err}`);
                log('ERROR', `yt-dlp install failed: ${err.message || err}`);
            }
        });

        setStatus(statusBox, 'rgba(255,180,0,0.1)', '#eab308', '');
        statusBox.appendChild(installBtn);
    } else {
        setStatus(statusBox, 'rgba(255,180,0,0.1)', '#eab308', msg);
        log('WARN', `Missing dependencies: ${missing.join(', ')}`);
    }
}
