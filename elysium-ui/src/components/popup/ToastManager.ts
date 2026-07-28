// elysium-ui/src/components/popup/ToastManager.ts
// Core toast lifecycle — listens for CustomEvent('elysium-toast') and Tauri events,
// checks settings, and delegates rendering. Fully decoupled, zero imports from app modules.

import { renderToast } from './ToastRenderer';
import { isToastAllowed } from './services/toastSettings';
import type { ToastData } from './ToastTypes';

const CUSTOM_EVENT_NAME = 'elysium-toast';
const TAURI_EVENT_NAME = 'elysium-toast';

const activeToasts = new Map<string, ToastData>();

function generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function handleToastRequest(data: ToastData): void {
    if (!isToastAllowed(data.type)) return;

    const toastData: ToastData = {
        ...data,
        id: data.id || generateId(),
    };

    activeToasts.set(toastData.id!, toastData);
    renderToast(toastData, handleDismiss);
}

function handleDismiss(id: string): void {
    activeToasts.delete(id);
}

function initWindowEventListener(): void {
    window.addEventListener(CUSTOM_EVENT_NAME, ((e: CustomEvent<ToastData>) => {
        if (e.detail) {
            handleToastRequest(e.detail);
        }
    }) as EventListener);
}

function initTauriEventListener(): void {
    try {
        const internals = window.__TAURI_INTERNALS__;
        const listen = internals && typeof internals.listen === 'function'
            ? internals.listen
            : window.__TAURI__?.event?.listen;

        if (typeof listen !== 'function') return;

        listen(TAURI_EVENT_NAME, (event: { payload: ToastData }) => {
            if (event.payload) {
                handleToastRequest(event.payload);
            }
        });
    } catch (_) {
        /* Tauri event API not available — graceful fallback */
    }
}

export function initToastManager(): void {
    initWindowEventListener();
    initTauriEventListener();
}

export function showNotification(data: ToastData): void {
    handleToastRequest(data);
}

export function getActiveToastCount(): number {
    return activeToasts.size;
}
