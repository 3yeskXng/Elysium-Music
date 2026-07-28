# Lyrics System — Architecture & Adding New Sources

## Overview

The lyrics system auto-detects lyrics for the currently playing track using a priority chain. No user interaction required — lyrics appear automatically when the panel is opened.

## Pipeline Priority Chain

```
loadLyrics(track)
  ├─ 1. tryEmbeddedLyrics(filePath)   → reads from audio file tags (ID3/Vorbis)
  ├─ 2. tryLrcFile(audioPath)         → looks for .lrc file next to audio file
  ├─ 3. tryCustomLyrics(trackId)      → reads from backend custom storage
  ├─ 4. tryLrclib(track)              → fetches synced lyrics from lrclib.net API
  └─ 5. return empty                   → no lyrics found
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
│   ├── LyricsRenderer.ts        ← DOM rendering (lines, empty state, badge)
│   └── sources/                 ← modular source providers (registry pattern)
│       ├── sourceRegistry.ts    ← LyricsSourceProvider interface + registry
│       └── lrclibSource.ts      ← LRCLIB.net API provider
```

## Adding a New Source (Step by Step)

External API sources (like LRCLIB) follow the **Provider Registry Pattern** for modularity. To switch to a different lyrics API, create a new provider and register it instead.

### 1. Create a Provider File

In `src/components/lyrics/services/sources/`, create a file implementing `LyricsSourceProvider`:

```typescript
// src/components/lyrics/services/sources/mySource.ts
import type { Track } from '../../../../types/Track.js';
import type { LyricsSourceProvider } from './sourceRegistry.js';

export const myProvider: LyricsSourceProvider = {
  id: 'my_source',
  name: 'My Lyrics API',
  priority: 350,   // lower = higher priority; 350 = after custom (300)

  async resolve(track: Track): Promise<string | null> {
    try {
      const response = await fetch(`https://api.example.com/lyrics?artist=${encodeURIComponent(track.artist)}&track=${encodeURIComponent(track.title)}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.lyrics || null;
    } catch (err) {
      return null;
    }
  },
};
```

### 2. Register in the Pipeline

In `lyricsService.ts`, import and register your provider:

```typescript
import { lyricsSourceRegistry } from './sources/sourceRegistry.js';
import { myProvider } from './sources/mySource.js';

// Register at module level (runs once on import)
lyricsSourceRegistry.register(myProvider);
```

Then add a `try*` function and insert it into `loadLyrics()`:

```typescript
async function tryMySource(track: Track): Promise<string | null> {
  const provider = lyricsSourceRegistry.getProvider('my_source');
  if (!provider) return null;
  return await provider.resolve(track);
}

export async function loadLyrics(track: Track): Promise<LyricsResult> {
  // ... existing checks ...

  const result = await tryMySource(track);
  if (result) {
    return { raw: result, parsed: parseLrc(result), source: 'my_source' };
  }

  return empty;
}
```

### 3. Add Source Type

In `lyricsService.ts`, extend the `LyricsSource` union:

```typescript
export type LyricsSource = 'embedded' | 'lrc' | 'custom' | 'my_source' | 'lrclib' | 'none';
```

### 4. Add Translation Keys

Add to ALL 8 language files (`en.js`, `de.js`, `fr.js`, `es.js`, `ru.js`, `pt-BR.js`, `ja.js`, `tr.js`):

```javascript
lyrics_source_my_source: "My Source",
```

### 5. Register in Source Key Map

In `LyricsRenderer.ts`, add to `sourceKeyFor()`:

```typescript
const map: Record<LyricsSource, string> = {
  embedded: 'lyrics_source_embedded',
  lrc: 'lyrics_source_lrc',
  custom: 'lyrics_source_custom',
  my_source: 'lyrics_source_my_source',
  lrclib: 'lyrics_source_lrclib',
  none: 'lyrics_source_none',
};
```

### 6. Priority Tuning

Providers auto-sort by their `priority` field. Lower values run first:

| Source | Priority | Description |
|--------|----------|-------------|
| `embedded` | 100 (hardcoded) | Local file tags |
| `lrc` | 200 (hardcoded) | Companion .lrc file |
| `custom` | 300 (hardcoded) | User-stored lyrics |
| external APIs | 350+ | Registry providers (configurable) |

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
