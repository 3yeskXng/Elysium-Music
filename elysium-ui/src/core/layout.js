// elysium-ui/src/core/layout.js
import { registry } from './registry.js';
import { eventBus } from './eventBus.js';
import { i18n } from './i18n.js';

export const layoutEngine = {
    init() {
        // Wire up core reactive UI re-renders
        eventBus.on('registry:viewSwitched', () => this.renderMainContent());
        eventBus.on('registry:viewAdded', () => this.renderSidebar());
        window.addEventListener('languageChanged', () => this.refreshLocalization());
    },

    renderSidebar() {
        const navContainer = document.getElementById('sidebar-navigation-slots');
        const footerContainer = document.getElementById('sidebar-footer-slots');
        if (!navContainer || !footerContainer) return;

        // Render upper navigation items (Laden, Hören)
        navContainer.innerHTML = registry.slots.sidebarNavigation.map(item => `
            <button class="nav-btn ${registry.activeView === item.id ? 'active' : ''}" data-view="${item.id}">
                ${i18n.t(item.labelKey)}
            </button>
        `).join('');

        // Render lower navigation items (Settings)
        footerContainer.innerHTML = registry.slots.sidebarFooter.map(item => `
            <button class="nav-btn footer-btn ${registry.activeView === item.id ? 'active' : ''}" data-view="${item.id}">
                ${i18n.t(item.labelKey)}
            </button>
        `).join('');

        // Attach atomic hardware event delegation for click switching
        [navContainer, footerContainer].forEach(container => {
            container.querySelectorAll('.nav-btn').forEach(btn => {
                btn.onclick = () => {
                    const target = btn.getAttribute('data-view');
                    registry.switchView(target);
                };
            });
        });
    },

    renderMainContent() {
        const mountPoint = document.getElementById('content-mount-point');
        if (!mountPoint) return;

        const renderFn = registry.slots.mainViews.get(registry.activeView);
        if (typeof renderFn === 'function') {
            mountPoint.innerHTML = ''; // Wipe current view securely
            try {
                renderFn(mountPoint); // Plugin takes over drawing space
            } catch (renderError) {
                console.error(`[Layout Self-Healing] Main view execution crashed for "${registry.activeView}":`, renderError);
                mountPoint.innerHTML = `<div class="error-boundary">Module rendering failed. Restoring integrity parameters...</div>`;
            }
        }
        this.renderSidebar(); // Refresh active highlights
    },

    refreshLocalization() {
        this.renderSidebar();
        this.renderMainContent();
    }
};