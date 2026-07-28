// elysium-ui/src/components/popup/ToastRenderer.ts
// DOM rendering for toast notifications — creates, animates, and removes toast elements

import { ICON_TOAST_INFO, ICON_TOAST_WARNING, ICON_TOAST_ERROR, ICON_TOAST_CLOSE } from '../../config/icons.js';
import { t } from '../../utils/translate.js';
import type { ToastData } from './ToastTypes';
import { TOAST_DEFAULT_DURATION } from './ToastTypes';

const CONTAINER_ID = 'elysium-toast-container';

const TYPE_CONFIG: Record<string, { icon: string; className: string }> = {
    info:    { icon: ICON_TOAST_INFO,    className: 'toast--info' },
    warning: { icon: ICON_TOAST_WARNING, className: 'toast--warning' },
    error:   { icon: ICON_TOAST_ERROR,   className: 'toast--error' },
};

let toastCounter = 0;

function ensureContainer(): HTMLElement {
    let container = document.getElementById(CONTAINER_ID);
    if (!container) {
        container = document.createElement('div');
        container.id = CONTAINER_ID;
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

function createToastElement(data: ToastData, onDismiss: (id: string) => void): HTMLElement {
    const id = data.id || `toast-${++toastCounter}`;
    const config = TYPE_CONFIG[data.type] || TYPE_CONFIG.info;
    const duration = data.duration ?? TOAST_DEFAULT_DURATION;

    const el = document.createElement('div');
    el.className = `toast ${config.className}`;
    el.setAttribute('role', 'alert');
    el.setAttribute('data-toast-id', id);

    el.innerHTML = `
        <div class="toast__icon">${config.icon}</div>
        <div class="toast__body">
            <div class="toast__title">${escapeHtml(data.title)}</div>
            <div class="toast__message">${escapeHtml(data.message)}</div>
        </div>
        <button class="toast__close" aria-label="${t('toast_close')}">${ICON_TOAST_CLOSE}</button>
    `;

    const closeBtn = el.querySelector('.toast__close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => dismiss(id, el, onDismiss));
    }

    if (duration > 0) {
        el.classList.add('toast--auto-dismiss');
        el.style.setProperty('--toast-duration', `${duration}ms`);
        setTimeout(() => dismiss(id, el, onDismiss), duration);
    }

    return el;
}

function dismiss(id: string, el: HTMLElement, onDismiss: (id: string) => void): void {
    if (el.classList.contains('toast--exiting')) return;
    el.classList.add('toast--exiting');
    el.addEventListener('animationend', () => {
        el.remove();
        onDismiss(id);
    });
}

function escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export function renderToast(data: ToastData, onDismiss: (id: string) => void): string {
    const container = ensureContainer();
    const el = createToastElement(data, onDismiss);
    container.appendChild(el);
    return data.id || `toast-${toastCounter}`;
}

export function removeToastById(id: string): void {
    const el = document.querySelector(`[data-toast-id="${id}"]`);
    if (el) {
        el.classList.add('toast--exiting');
        el.addEventListener('animationend', () => el.remove());
    }
}
