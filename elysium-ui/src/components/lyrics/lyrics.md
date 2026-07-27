# Lyrics System — Architecture & Adding New Sources

## Overview

The lyrics system auto-detects lyrics for the currently playing track using a priority chain. No user interaction required — lyrics appear automatically when the panel is opened.

## Pipeline Priority Chain

```
loadLyrics(track)
  ├─ 1. tryEmbeddedLyrics(filePath)   → reads from audio file tags (ID3/Vorbis)
  ├─ 2. tryLrcFile(audioPath)         → looks for .lrc file next to audio file
  ├─ 3. tryCustomLyrics(trackId)      → reads from backend custom storage
  └─ 4. return empty                   → no lyrics found
```

The first source that returns non-empty content wins. Lower priority sources are never queried if a higher one succeeds.

## File Architecture

```
src/components/lyrics/
├── Lyrics.md                    ← this file
├── services/
│   ├── lrcParser.ts             ← pure LRC format parser (no side effects)
│   ├── lyricsService.ts         ← IPC bridge + priority chain
│   ├── lyricsState.ts           ← centralized state (active line, source)
│   ├── lyricsSync.ts            ← time-sync subscription (RAF-based)
│   ├── LyricsPanel.ts           ← panel lifecycle (open/close/DOM shell)
│   └── LyricsRenderer.ts        ← DOM rendering (lines, empty state, badge)
```

## Adding a New Source (Step by Step)

### 1. Add Source Type

In `lyricsService.ts`, extend the `LyricsSource` union:

```typescript
export type LyricsSource = 'embedded' | 'lrc' | 'custom' | 'lrclib' | 'none';
```

### 2. Create the try* Function

Add a new async function following the pattern:

```typescript
async function tryLrclib(track: Track): Promise<string | null> {
  try {
    const response = await fetch(
      `https://lrclib.net/api/get?artist_name=${encodeURIComponent(track.artist)}&track_name=${encodeURIComponent(track.title)}`
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (data.syncedLyrics && data.syncedLyrics.trim().length > 0) {
      log('INFO', `LRCLIB lyrics found for: ${track.title}`);
      return data.syncedLyrics;
    }
  } catch (err) {
    log('ERROR', `LRCLIB fetch failed: ${err}`);
  }
  return null;
}
```

### 3. Insert into Pipeline

In `loadLyrics()`, add your source at the desired priority position:

```typescript
export async function loadLyrics(track: Track): Promise<LyricsResult> {
  // ... existing embedded check ...
  // ... existing lrc check ...

  const lrclib = await tryLrclib(track);
  if (lrclib) {
    return { raw: lrclib, parsed: parseLrc(lrclib), source: 'lrclib' };
  }

  // ... existing custom check ...
}
```

### 4. Add Translation Keys

Add to ALL 6 language files (`en.js`, `de.js`, `fr.js`, `es.js`, `ru.js`, `pt-BR.js`):

```javascript
// en.js
lyrics_source_lrclib: "LRCLIB",

// de.js
lyrics_source_lrclib: "LRCLIB",
```

### 5. Register in Source Key Map

In `LyricsRenderer.ts`, add to `sourceKeyFor()`:

```typescript
function sourceKeyFor(source: LyricsSource): string {
  const map: Record<LyricsSource, string> = {
    embedded: 'lyrics_source_embedded',
    lrc: 'lyrics_source_lrc',
    custom: 'lyrics_source_custom',
    lrclib: 'lyrics_source_lrclib',   // ← add here
    none: 'lyrics_source_none',
  };
  return map[source] || 'lyrics_source_none';
}
```

## LRC Format Reference

The parser (`lrcParser.ts`) supports standard LRC format:

```
[ar:Artist Name]
[ti:Song Title]
[al:Album Name]
[00:12.00]First line of lyrics
[00:17.20]Second line of lyrics
```

- Timestamps: `[MM:SS.ms]` — ms can be 2 or 3 digits
- Metadata: `[ar:]`, `[ti:]`, `[al:]` — optional, parsed into `metadata` object
- Multiple timestamps per line: `[01:00.00][02:00.00]Same text` — creates two entries
- Deduplication: duplicate timestamps (within 1ms) are silently dropped

## IPC Backend Commands

The lyrics system uses these Tauri commands (defined in `src-tauri/src/lyrics/commands.rs`):

| Command | Parameters | Returns |
|---------|-----------|---------|
| `read_embedded_lyrics` | `{ filePath: string }` | `string \| null` |
| `read_lrc_file` | `{ filePath: string }` | `string \| null` |
| `read_custom_lyrics` | `{ trackId: string }` | `string \| null` |
| `write_custom_lyrics` | `{ trackId: string, lyrics: string }` | `void` |

## State Management

`lyricsState.ts` manages a centralized state object:

```typescript
interface LyricsState {
  lines: LyricLine[];       // parsed lyric lines
  activeIndex: number;      // currently highlighted line (-1 = none)
  source: LyricsSource;     // where lyrics came from
  trackId: string | null;   // current track ID
  loading: boolean;         // true during loadLyrics() call
}
```

Components subscribe via `lyricsState.subscribe(listener)` and receive a copy of the state on every change.
