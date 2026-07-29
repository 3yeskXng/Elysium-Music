// src/components/dcrp/types/dcrpTypes.ts
// TypeScript interfaces for Discord Rich Presence configuration and status.

export interface DiscordConfig {
  enabled: boolean;
  client_id: string;
}

export type DiscordConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface DiscordState {
  config: DiscordConfig;
  status: DiscordConnectionStatus;
  errorMessage?: string;
  connectedUser?: string;
}
