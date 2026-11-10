// src/modules/newfast/ui/NewFastSettingsCard.ts
// Settings UI card for selecting legacy playback or New Fast Listen mode.

import { pluginManager } from '../../../core/pluginManager.js';
import { t } from '../../../utils/translate.js';
import {
  getPlaybackMode,
  setPlaybackMode
} from '../services/NewFastPreferenceService';
import type { PlaybackMode } from '../types/NewFastTypes';

const NEW_FAST_PLUGIN_ID = 'new_fast_listen';

function modeOption(value: PlaybackMode, current: PlaybackMode, key: string): string {
  const selected = value === current ? 'selected' : '';
  return `<option value="${value}" ${selected}>${t(key)}</option>`;
}

export function renderNewFastSettingsCard(): HTMLElement {
  const wrapper = document.createElement('section');
  wrapper.className = 'newfast-card';

  const currentMode = getPlaybackMode();
  const pluginActive = pluginManager.isPluginActive(NEW_FAST_PLUGIN_ID);
  const pluginStateKey = pluginActive ? 'newfast_plugin_active' : 'newfast_plugin_inactive';

  wrapper.innerHTML = `
    <h3 class="newfast-title" data-i18n="newfast_title">${t('newfast_title')}</h3>
    <p class="newfast-subtitle" data-i18n="newfast_subtitle">${t('newfast_subtitle')}</p>
    <label class="newfast-label" for="newfast-mode-select" data-i18n="newfast_mode_label">${t('newfast_mode_label')}</label>
    <select id="newfast-mode-select" class="newfast-select">
      ${modeOption('classic_download', currentMode, 'newfast_mode_classic')}
      ${modeOption('new_fast_listen', currentMode, 'newfast_mode_fast')}
    </select>
    <p class="newfast-plugin-state" data-i18n="${pluginStateKey}">${t(pluginStateKey)}</p>
  `;

  const select = wrapper.querySelector('#newfast-mode-select') as HTMLSelectElement | null;
  if (select) {
    select.addEventListener('change', () => {
      setPlaybackMode(select.value as PlaybackMode);
    });
  }

  return wrapper;
}
