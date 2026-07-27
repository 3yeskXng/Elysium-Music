// src/components/lyrics/services/lyricsService.ts
// IPC bridge for lyrics backend commands — load embedded, LRC, and custom lyrics

import { invokeBackend } from '../../../api.js';
import { parseLrc, type ParsedLyrics } from './lrcParser.js';

export type LyricsSource = 'embedded' | 'lrc' | 'custom' | 'none';

export interface LyricsResult {
  raw: string | null;
  parsed: ParsedLyrics;
  source: LyricsSource;
}

interface Track {
  id: string;
  title: string;
  file_path: string;
}

function log(level: string, msg: string): void {
  if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Lyrics', msg);
}

async function tryEmbeddedLyrics(filePath: string): Promise<string | null> {
  try {
    const result = await invokeBackend('read_embedded_lyrics', { filePath });
    if (result && typeof result === 'string' && result.trim().length > 0) {
      log('INFO', `Embedded lyrics found for: ${filePath}`);
      return result;
    }
  } catch (err) {
    log('ERROR', `Embedded lyrics read failed: ${err}`);
  }
  return null;
}

async function tryLrcFile(audioPath: string): Promise<string | null> {
  try {
    const lrcPath = audioPath.replace(/\.[^.]+$/, '.lrc');
    const result = await invokeBackend('read_lrc_file', { filePath: lrcPath });
    if (result && typeof result === 'string' && result.trim().length > 0) {
      log('INFO', `LRC file found: ${lrcPath}`);
      return result;
    }
  } catch (err) {
    log('ERROR', `LRC file read failed: ${err}`);
  }
  return null;
}

async function tryCustomLyrics(trackId: string): Promise<string | null> {
  try {
    const result = await invokeBackend('read_custom_lyrics', { trackId });
    if (result && typeof result === 'string' && result.trim().length > 0) {
      log('INFO', `Custom lyrics found for track: ${trackId}`);
      return result;
    }
  } catch (err) {
    log('ERROR', `Custom lyrics read failed: ${err}`);
  }
  return null;
}

export async function loadLyrics(track: Track): Promise<LyricsResult> {
  const empty: LyricsResult = { raw: null, parsed: { metadata: {}, lines: [] }, source: 'none' };
  if (!track || !track.file_path) return empty;

  const embedded = await tryEmbeddedLyrics(track.file_path);
  if (embedded) {
    return { raw: embedded, parsed: parseLrc(embedded), source: 'embedded' };
  }

  const lrc = await tryLrcFile(track.file_path);
  if (lrc) {
    return { raw: lrc, parsed: parseLrc(lrc), source: 'lrc' };
  }

  const custom = await tryCustomLyrics(track.id);
  if (custom) {
    return { raw: custom, parsed: parseLrc(custom), source: 'custom' };
  }

  return empty;
}

export async function saveCustomLyrics(trackId: string, lyrics: string): Promise<void> {
  await invokeBackend('write_custom_lyrics', { trackId, lyrics });
  log('INFO', `Custom lyrics saved for track: ${trackId}`);
}
