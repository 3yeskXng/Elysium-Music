// elysium-ui/src/core/loader.js
// Reusable async spinner overlay for any container element

const SPINNER_STYLE = `
    display:flex; align-items:center; justify-content:center;
    gap:10px; padding:14px 18px; font-size:0.9rem;
    color:var(--accent-premium); user-select:none;
`;

const SPINNER_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="animation: spin 0.8s linear infinite;">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
</svg>
<style>@keyframes spin { to { transform: rotate(360deg); } }</style>`;

export function showLoader(container, message) {
    if (!container) return null;
    const el = document.createElement('div');
    el.className = 'elysium-loader-overlay';
    el.style.cssText = SPINNER_STYLE;
    el.innerHTML = `${SPINNER_SVG}<span>${message}</span>`;
    container.appendChild(el);
    return el;
}

export function hideLoader(container) {
    if (!container) return;
    const el = container.querySelector('.elysium-loader-overlay');
    if (el) el.remove();
}

export async function withLoader(container, message, asyncFn) {
    showLoader(container, message);
    try {
        return await asyncFn();
    } finally {
        hideLoader(container);
    }
}
