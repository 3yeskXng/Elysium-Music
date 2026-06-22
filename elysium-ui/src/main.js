// elysium-ui/src/main.js
import { registry } from './core/registry.js';

// Premium Clean Line-Art Icons (SVG Vector Definitions)
const ICON_DOWNLOAD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
const ICON_HEADPHONES = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>`;
const ICON_SETTINGS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;

// Connect the interface mount acceleration pipeline
registry.onViewChange((plugin) => {
    const mountPoint = document.getElementById('content-mount-point');
    if (mountPoint) {
        mountPoint.innerHTML = '';
        // Inject the active component UI smoothly
        mountPoint.appendChild(plugin.render());
    }
});

// ==========================================
// MODULE 1: DOWNLOAD ENGINE ("Laden")
// ==========================================
registry.register({
    id: 'download',
    label: 'Laden',
    icon: ICON_DOWNLOAD,
    render: () => {
        const view = document.createElement('div');
        view.className = 'view-container animate-fade-in';
        view.innerHTML = `
            <input type="text" class="search-input" placeholder="Gebe hier URL, Songname, Videoname oder Dateiname des Liedes ein...">
            <div class="dashboard-preview-text">Zuletzt Heruntergeladen</div>
            `;
        return view;
    }
});

// ==========================================
// MODULE 2: LIBRARY PLATFORM ("Hören")
// ==========================================
registry.register({
    id: 'listen',
    label: 'Hören',
    icon: ICON_HEADPHONES,
    render: () => {
        const view = document.createElement('div');
        view.className = 'view-container animate-fade-in';
        view.innerHTML = `
            <h2 class="view-title">Deine Musikbibliothek</h2>
            <p style="color: var(--text-muted); font-size: 0.95rem;">Hier entstehen bald deine intelligenten lokalen Musik-Grids.</p>
        `;
        return view;
    }
});

// ==========================================
// KICKSTART CORE ENGINE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Compile primary navigation sidebar items
    registry.renderSidebar();
    
    // 2. Setup the separated, dedicated bottom Settings point
    const footerSlots = document.getElementById('sidebar-footer-slots');
    if (footerSlots) {
        footerSlots.innerHTML = `
            <button class="nav-btn" id="settings-trigger">
                <span class="nav-icon">${ICON_SETTINGS}</span>
                <span class="nav-label">Settings</span>
            </button>
        `;
        document.getElementById('settings-trigger').addEventListener('click', () => {
            alert('Settings-Modul bereit zur Koppelung!');
        });
    }

    // 3. Set standard view on boot sequence
    registry.switchTo('download');
});