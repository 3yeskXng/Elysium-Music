// elysium-ui/src/modules/settings/services/dependencyInstaller.js
// LEGACY: This module has been replaced by modules/dependencies/DependencyView.js
// Kept for backward compatibility — delegates to the new dependency module

import { t } from '../../../utils/translate.js';

export function createDependencySection(container) {
    const hint = document.createElement('div');
    hint.style.cssText = 'padding:16px; background:rgba(138,92,246,0.1); border:1px solid rgba(138,92,246,0.3); border-radius:8px; text-align:center;';
    hint.innerHTML = `<p style="color:var(--accent-premium); font-size:0.9rem;">${t('dl_missing_hint').replace('${deps}', '<strong>yt-dlp, ffmpeg, ffprobe</strong>')}</p>`;
    container.appendChild(hint);
}
