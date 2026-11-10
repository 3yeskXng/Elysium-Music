// src/modules/newfast/services/NewFastPlaybackService.ts
// Orchestrates optional New Fast Listen playback with loader feedback and safe fallback behavior.

import { audioEngine } from '../../../core/audioEngine.js';
import { showLoader, hideLoader } from '../../../core/loader.js';
import { pluginManager } from '../../../core/pluginManager.js';
import { t } from '../../../utils/translate.js';
import type { Track } from '../../../types/Track.ts';
import { newFastProviderRegistry } from '../providers/NewFastProviderRegistry';
import { isNewFastModeSelected } from './NewFastPreferenceService';

const NEW_FAST_PLUGIN_ID = 'new_fast_listen';
const NEW_FAST_PROVIDER_ID = 'yt_dlp_newfast';

function canUseNewFastListen(track: Track): boolean {
  if (!track || !!track.file_path) return false;
  if (!isNewFastModeSelected()) return false;
  return pluginManager.isPluginActive(NEW_FAST_PLUGIN_ID);
}

function log(level: string, msg: string): void {
  window.triggerElysiumLog?.(level, 'NewFastListen', msg);
}

export async function tryPlayWithNewFastListen(
  track: Track,
  container: HTMLElement
): Promise<boolean> {
  if (!canUseNewFastListen(track)) {
    return false;
  }

  const provider = newFastProviderRegistry.getProvider(NEW_FAST_PROVIDER_ID);
  if (!provider) {
    log('ERROR', 'Provider registry did not return yt_dlp_newfast.');
    return false;
  }

  showLoader(container, t('newfast_loader_resolving'));
  try {
    const streamUrl = await provider.resolveStreamUrl(track);
    await audioEngine.playRemoteTrack(track, streamUrl);
    log('SUCCESS', `Fast playback started for "${track.title}".`);
    return true;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    log('WARN', `Fast playback failed, fallback to classic: ${reason}`);
    return false;
  } finally {
    hideLoader(container);
  }
}
