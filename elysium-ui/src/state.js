// elysium-ui/src/state.js
// Global application state object

import { t } from './utils/translate.js';

export const state = {
    get currentTrack() { return t('noTrack'); },
    duration: 0,
    currentSeconds: 0,
    status: "standby",
    isPlaying: false
};

export function updateDOM() {
    // Placeholder for DOM update logic managed by main.js
}
