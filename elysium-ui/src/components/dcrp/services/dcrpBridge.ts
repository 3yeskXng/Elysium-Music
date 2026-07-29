// src/components/dcrp/services/dcrpBridge.ts
// Bridge between audio engine events and Discord Rich Presence

import { audioEngine } from '../../../core/audioEngine.js';
import * as dcrpService from './dcrpService.js';

let playStartTime = 0;
let currentTitle = '';
let currentArtist = '';
let bridgeActive = false;

function log(level: string, msg: string): void {
    if ((window as any).triggerElysiumLog) {
        (window as any).triggerElysiumLog(level, 'DCRP-Bridge', msg);
    }
}

function shouldSync(): boolean {
    return bridgeActive && dcrpService.isEnabled();
}

function onTrackChange(track: any, status: string): void {
    if (!track || !shouldSync()) return;
    currentTitle = track.title || 'Unknown';
    currentArtist = track.artist || 'Unknown Artist';
    if (status === 'playing') {
        playStartTime = Date.now();
        dcrpService.updatePresence(currentTitle, currentArtist, true, playStartTime);
        log('INFO', `Presence updated — playing: "${currentTitle}"`);
    }
}

function onStatusChange(status: string): void {
    if (!shouldSync()) return;
    if (status === 'playing' && currentTitle) {
        playStartTime = Date.now();
        dcrpService.updatePresence(currentTitle, currentArtist, true, playStartTime);
    } else if (status === 'paused' && currentTitle) {
        dcrpService.updatePresence(currentTitle, currentArtist, false, playStartTime);
    }
}

export function startBridge(): void {
    if (bridgeActive) return;
    bridgeActive = true;
    audioEngine.onTrackChange(onTrackChange);
    audioEngine.onStatusChange(onStatusChange);
    // Set initial presence immediately — query current track if any
    const track = (audioEngine as any).currentTrack;
    if (track) {
        currentTitle = track.title || 'Unknown';
        currentArtist = track.artist || 'Unknown Artist';
        const paused = (audioEngine as any).audio?.paused;
        if (paused) {
            dcrpService.updatePresence(currentTitle, currentArtist, false, 0);
        } else {
            playStartTime = Date.now();
            dcrpService.updatePresence(currentTitle, currentArtist, true, playStartTime);
        }
    } else {
        dcrpService.setIdle();
    }
    log('INFO', 'DCRP bridge started');
}

export function stopBridge(): void {
    bridgeActive = false;
    audioEngine.onTrackChange(null as any);
    audioEngine.onStatusChange(null as any);
    dcrpService.setIdle();
    log('INFO', 'DCRP bridge stopped');
}

export function isBridgeActive(): boolean {
    return bridgeActive;
}
