// src/components/dcrp/DcrpView.ts
// Discord Rich Presence settings card with client ID configuration

import { t } from '../../utils/translate.js';
import * as dcrpService from './services/dcrpService.js';
import { startBridge, stopBridge } from './services/dcrpBridge.js';

let feedbackTimer: ReturnType<typeof setTimeout> | null = null;

function showFeedback(el: HTMLElement, msg: string, type: 'ok' | 'error'): void {
    if (feedbackTimer) clearTimeout(feedbackTimer);
    el.textContent = msg;
    el.style.color = type === 'ok' ? 'var(--accent-premium)' : '#ff4a4a';
    feedbackTimer = setTimeout(() => { el.textContent = ''; }, 3000);
}

function syncUI(root: HTMLElement, enabled: boolean, connected: boolean): void {
    const dot = root.querySelector('.dcrp-dot') as HTMLElement;
    const label = root.querySelector('.dcrp-status-label') as HTMLElement;
    const btn = root.querySelector('#dcrp-toggle-btn') as HTMLButtonElement;
    if (dot) dot.className = `dcrp-dot ${connected ? 'on' : 'off'}`;
    if (label) label.textContent = connected ? t('dcrp_status_connected') : t('dcrp_status_disconnected');
    if (btn) {
        btn.textContent = enabled ? t('dcrp_btn_disconnect') : t('dcrp_btn_connect');
    }
}

function attachEvents(root: HTMLElement): void {
    const saveBtn = root.querySelector('#dcrp-save-btn') as HTMLButtonElement;
    const cidInput = root.querySelector('#dcrp-cid-input') as HTMLInputElement;
    const feedback = root.querySelector('#dcrp-feedback') as HTMLElement;
    const toggleBtn = root.querySelector('#dcrp-toggle-btn') as HTMLButtonElement;

    saveBtn?.addEventListener('click', () => {
        const val = cidInput.value.trim();
        if (!val) {
            showFeedback(feedback, t('dcrp_client_id_empty'), 'error');
            return;
        }
        dcrpService.saveConfig(val);
        showFeedback(feedback, t('dcrp_cid_saved'), 'ok');
    });

    toggleBtn?.addEventListener('click', async () => {
        toggleBtn.style.pointerEvents = 'none';
        try {
            const enabled = dcrpService.isEnabled();
            if (enabled) {
                stopBridge();
                await dcrpService.disconnect();
                syncUI(root, false, false);
            } else {
                const cfg = dcrpService.loadConfig();
                if (!cfg.client_id) {
                    showFeedback(feedback, t('dcrp_client_id_empty'), 'error');
                    return;
                }
                const ok = await dcrpService.connect(cfg.client_id);
                if (ok) {
                    startBridge();
                    syncUI(root, true, true);
                }
            }
        } finally {
            toggleBtn.style.pointerEvents = 'auto';
        }
    });
}

export function renderDcrpCard(container: HTMLElement): void {
    if (!container) return;
    const cfg = dcrpService.loadConfig();

    container.innerHTML = `
        <div class="dcrp-card">
            <div class="dcrp-header">
                <span class="dcrp-dot ${cfg.enabled ? 'on' : 'off'}"></span>
                <span class="dcrp-status-label">${cfg.enabled ? t('dcrp_status_connected') : t('dcrp_status_disconnected')}</span>
            </div>
            <label class="dcrp-field-label">${t('dcrp_client_id')}</label>
            <div class="dcrp-row">
                <input id="dcrp-cid-input" class="dcrp-input" type="text"
                    placeholder="${t('dcrp_client_id_placeholder')}" value="${cfg.client_id}" />
                <button id="dcrp-save-btn" class="dcrp-save-btn">${t('dcrp_save_btn')}</button>
            </div>
            <a class="dcrp-howto" href="https://discord.com/developers/applications" target="_blank">${t('dcrp_how_to_get')}</a>
            <div id="dcrp-feedback" class="dcrp-feedback"></div>
            <div class="dcrp-actions">
                <button id="dcrp-toggle-btn" class="dcrp-toggle-btn ${cfg.enabled ? 'enabled' : 'disabled'}">
                    ${cfg.enabled ? t('dcrp_btn_disconnect') : t('dcrp_btn_connect')}
                </button>
            </div>
        </div>
    `;

    attachEvents(container);

    dcrpService.getStatus().then(connected => {
        syncUI(container, dcrpService.isEnabled(), connected);
    });
}
