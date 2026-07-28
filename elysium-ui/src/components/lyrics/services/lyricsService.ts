// src/components/lyrics/services/lyricsService.ts
// IPC bridge for lyrics backend commands — loads lyrics via priority chain (embedded → lrc → custom → lrclib)

import { invokeBackend } from '../../../api.js';
import { parseLrc, type ParsedLyrics } from './lrcParser.js';
import { lyricsSourceRegistry } from './sources/sourceRegistry.js';
import { lrclibProvider } from './sources/lrclibSource.js';
import type { Track } from '../../../types/Track.js';

export type LyricsSource = 'embedded' | 'lrc' | 'custom' | 'lrclib' | 'none';

export interface LyricsResult {
  raw: string | null;
  parsed: ParsedLyrics;
  source: LyricsSource;
}

function log(level: string, msg: string): void {
  if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Lyrics', msg);
}

lyricsSourceRegistry.register(lrclibProvider);

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

async function tryLrclib(track: Track): Promise<string | null> {
  try {
    const provider = lyricsSourceRegistry.getProvider('lrclib');
    if (!provider) return null;
    return await provider.resolve(track);
  } catch (err) {
    log('ERROR', `LRCLIB resolve failed: ${err}`);
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

  const lrclib = await tryLrclib(track);
  if (lrclib) {
    return { raw: lrclib, parsed: parseLrc(lrclib), source: 'lrclib' };
  }

  return empty;
}

export async function saveCustomLyrics(trackId: string, lyrics: string): Promise<void> {
  await invokeBackend('write_custom_lyrics', { trackId, lyrics });
  log('INFO', `Custom lyrics saved for track: ${trackId}`);
}
