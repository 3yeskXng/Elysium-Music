// src/modules/newfast/providers/NewFastProviderRegistry.ts
// Provider registry for New Fast Listen stream URL resolvers.

import type { FastListenProvider } from '../types/NewFastTypes';
import { ytdlpNewFastProvider } from './YtDlpNewFastProvider';

class NewFastProviderRegistry {
  private providers = new Map<string, FastListenProvider>();

  register(provider: FastListenProvider): void {
    if (!provider.id || typeof provider.resolveStreamUrl !== 'function') {
      return;
    }
    this.providers.set(provider.id, provider);
  }

  getProvider(providerId: string): FastListenProvider | null {
    return this.providers.get(providerId) || null;
  }
}

export const newFastProviderRegistry = new NewFastProviderRegistry();
newFastProviderRegistry.register(ytdlpNewFastProvider);
