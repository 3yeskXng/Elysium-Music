// src/components/dcrp/services/dcrpService.ts
// Core Discord RPC service — IPC bridge, connection state

import { invokeBackend } from '../../../api.js';
import { showDcrpStateToast } from './dcrpToast.js';

const ENABLED_KEY = 'elysium_dcrp_enabled';

function log(level: string, msg: string): void {
    if ((window as any).triggerElysiumLog) {
        (window as any).triggerElysiumLog(level, 'DCRP', msg);
    }
}

export async function connect(): Promise<boolean> {
    try {
        await invokeBackend('discord_connect');
        setEnabled(true);
        showDcrpStateToast('enabled');
        log('SUCCESS', 'Connected to Discord Rich Presence');
        return true;
    } catch (err: any) {
        log('ERROR', `Connection failed: ${err.message || err}`);
        return false;
    }
}

export async function disconnect(): Promise<boolean> {
    try {
        await invokeBackend('discord_disconnect');
        setEnabled(false);
        showDcrpStateToast('disabled');
        log('INFO', 'Disconnected from Discord Rich Presence');
        return true;
    } catch (err: any) {
        log('ERROR', `Disconnect failed: ${err.message || err}`);
        return false;
    }
}

export async function updatePresence(
    trackTitle: string,
    trackArtist: string,
    isPlaying: boolean,
    startTime: number
): Promise<boolean> {
    try {
        await invokeBackend('discord_update_presence', {
            trackTitle,
            trackArtist,
            isPlaying,
            startTime: Math.floor(startTime / 1000)
        });
        return true;
    } catch (err: any) {
        log('WARN', `Presence update failed: ${err.message || err}`);
        return false;
    }
}

export async function setIdle(): Promise<boolean> {
    try {
        await invokeBackend('discord_set_idle');
        return true;
    } catch (err: any) {
        log('WARN', `Set idle failed: ${err.message || err}`);
        return false;
    }
}

export async function getStatus(): Promise<boolean> {
    try {
        return await invokeBackend('discord_get_status') as boolean;
    } catch {
        return false;
    }
}

export function isEnabled(): boolean {
    return localStorage.getItem(ENABLED_KEY) === 'true';
}

export function setEnabled(val: boolean): void {
    localStorage.setItem(ENABLED_KEY, val ? 'true' : 'false');
}
