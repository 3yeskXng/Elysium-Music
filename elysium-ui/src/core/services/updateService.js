// elysium-ui/src/core/services/updateService.js
// Auto-updater — checks GitHub releases for newer versions on app start

import { APP_VERSION, GITHUB_REPO } from '../../config/appInfo.js';

let cachedUpdate = null;

export async function checkForUpdate() {
    try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
        if (!res.ok) return null;
        const data = await res.json();
        const latest = (data.tag_name || '').replace(/^v/, '');
        if (latest && latest !== APP_VERSION) {
            cachedUpdate = { version: latest, url: data.html_url, name: data.name || `v${latest}` };
            return cachedUpdate;
        }
    } catch { /* network error, ignore */ }
    return null;
}

export function getUpdateInfo() {
    return cachedUpdate;
}

export function openUpdatePage() {
    if (cachedUpdate?.url) window.open(cachedUpdate.url, '_blank');
}
