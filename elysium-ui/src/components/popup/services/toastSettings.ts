// elysium-ui/src/components/popup/services/toastSettings.ts
// Toast settings — reads/writes notification preferences from localStorage

import { TOAST_DEFAULTS } from '../ToastTypes';
import type { ToastSettings, ToastType } from '../ToastTypes';

const ENABLED_KEY = 'elysium_toasts_enabled';
const LEVELS_KEY = 'elysium_toast_levels';

export function getToastSettings(): ToastSettings {
    const enabledRaw = localStorage.getItem(ENABLED_KEY);
    const enabled = enabledRaw !== null ? enabledRaw === 'true' : TOAST_DEFAULTS.enabled;

    const levelsRaw = localStorage.getItem(LEVELS_KEY);
    const allowedLevels: ToastType[] = levelsRaw
        ? JSON.parse(levelsRaw)
        : TOAST_DEFAULTS.allowedLevels;

    return { enabled, allowedLevels };
}

export function setToastsEnabled(value: boolean): void {
    localStorage.setItem(ENABLED_KEY, String(value));
}

export function setAllowedLevels(levels: ToastType[]): void {
    localStorage.setItem(LEVELS_KEY, JSON.stringify(levels));
}

export function isToastAllowed(type: ToastType): boolean {
    const settings = getToastSettings();
    return settings.enabled && settings.allowedLevels.includes(type);
}
