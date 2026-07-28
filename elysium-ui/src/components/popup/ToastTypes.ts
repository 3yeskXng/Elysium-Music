// elysium-ui/src/components/popup/ToastTypes.ts
// Toast data model — single source of truth for all toast payloads

export type ToastType = 'info' | 'warning' | 'error';

export interface ToastAction {
    label: string;
    onClick: string;
}

export interface ToastData {
    id?: string;
    type: ToastType;
    title: string;
    message: string;
    duration?: number;
    actions?: ToastAction[];
}

export interface ToastSettings {
    enabled: boolean;
    allowedLevels: ToastType[];
}

export const TOAST_DEFAULTS: Required<ToastSettings> = {
    enabled: true,
    allowedLevels: ['info', 'warning', 'error'],
};

export const TOAST_DEFAULT_DURATION = 4000;
