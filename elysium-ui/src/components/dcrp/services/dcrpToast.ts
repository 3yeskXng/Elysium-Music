// src/components/dcrp/services/dcrpToast.ts
// Discord Rich Presence toast helper — emits localized popup events without coupling to the toast module

import { t } from '../../../utils/translate.js';

type DcrpToastState = 'enabled' | 'disabled';

export function showDcrpStateToast(state: DcrpToastState): void {
    const messageKey = state === 'enabled' ? 'dcrp_toast_enabled' : 'dcrp_toast_disabled';
    window.dispatchEvent(new CustomEvent('elysium-toast', {
        detail: {
            type: 'info',
            title: t('dcrp_title'),
            message: t(messageKey),
            duration: 4000
        }
    }));
}