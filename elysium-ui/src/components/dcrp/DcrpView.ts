// src/components/dcrp/DcrpView.ts
// Discord Rich Presence settings card — status and connect/disconnect toggle

import { t } from '../../utils/translate.js';
import * as dcrpService from './services/dcrpService.js';
import { startBridge, stopBridge } from './services/dcrpBridge.js';
import { showLoader, hideLoader } from '../../core/loader.js';

function syncUI(container: HTMLElement, enabled: boolean, connected: boolean): void {
    const statusEl = container.querySelector('.dcrp-card-status') as HTMLElement;
    const btn = container.querySelector('#dcrp-toggle-btn') as HTMLElement;
    if (statusEl) {
        statusEl.className = `dcrp-card-status ${connected ? 'connected' : 'disconnected'}`;
        statusEl.setAttribute('data-i18n', connected ? 'dcrp_status_connected' : 'dcrp_status_disconnected');
        statusEl.textContent = connected ? t('dcrp_status_connected') : t('dcrp_status_disconnected');
    }
    if (btn) {
        btn.className = `dcrp-toggle-btn ${enabled ? 'enabled' : 'disabled'}`;
        btn.textContent = enabled ? t('dcrp_btn_disconnect') : t('dcrp_btn_connect');
    }
}

export function renderDcrpCard(container: HTMLElement): void {
    if (!container) return;
    const enabled = dcrpService.isEnabled();

    container.innerHTML = `
        <div class="dcrp-card">
            <div>
                <div class="dcrp-card-title">${t('dcrp_title')}</div>
                <div class="dcrp-card-status disconnected" data-i18n="dcrp_status_disconnected">${t('dcrp_status_disconnected')}</div>
            </div>
            <button id="dcrp-toggle-btn" class="dcrp-toggle-btn ${enabled ? 'enabled' : 'disabled'}">
                ${enabled ? t('dcrp_btn_disconnect') : t('dcrp_btn_connect')}
            </button>
        </div>
    `;

    const btn = container.querySelector('#dcrp-toggle-btn') as HTMLElement;
    if (!btn) return;

    btn.addEventListener('click', async () => {
        btn.style.pointerEvents = 'none';
        const loader = showLoader(container, '...');
        try {
            if (dcrpService.isEnabled()) {
                stopBridge();
                await dcrpService.disconnect();
                syncUI(container, false, false);
            } else {
                const ok = await dcrpService.connect();
                if (ok) {
                    startBridge();
                    syncUI(container, true, true);
                }
            }
        } finally {
            hideLoader(container);
            btn.style.pointerEvents = 'auto';
        }
    });

    dcrpService.getStatus().then(connected => {
        syncUI(container, dcrpService.isEnabled(), connected);
    });
}
