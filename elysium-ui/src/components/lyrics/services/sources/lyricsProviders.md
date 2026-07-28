# Lyrics Source Providers — Modular External API Integration

## Overview

The `sources/` directory implements a **Provider Registry Pattern** for fetching lyrics from external APIs. This design allows you to add, remove, or replace lyrics providers without touching any core rendering or state logic.

## Registry Pattern

### Source Provider Interface

Every provider must implement the `LyricsSourceProvider` interface (defined in `sourceRegistry.ts`):

```typescript
interface LyricsSourceProvider {
  id: string;            // unique identifier, e.g. 'lrclib'
  name: string;          // human-readable name, e.g. 'LRCLIB'
  priority: number;      // lower = higher priority (100-999)
  resolve(track: Track): Promise<string | null>;  // returns raw LRC text or null
}
```

### Priority System

Providers auto-sort by their `priority` field when registered. The current priority chain:

| Priority | Source     | Description                           |
|----------|------------|---------------------------------------|
| 100      | embedded   | Audio file tags (ID3/Vorbis)          |
| 200      | lrc        | Companion .lrc file                   |
| 300      | custom     | Backend user storage                  |
| 350      | lrclib     | LRCLIB.net API (external provider)    |
| 999      | (fallback) | None                                  |

For new external API providers, use priority **350+** to keep local sources preferred.

## Current Providers

| File              | ID      | Name   | Priority | Description                       |
|-------------------|---------|--------|----------|-----------------------------------|
| `lrclibSource.ts` | `lrclib`| LRCLIB | 350      | Synced/plain lyrics from lrclib.net |

## Adding a New Provider

1. Create a file in this directory (e.g. `geniusSource.ts`)
2. Implement `LyricsSourceProvider`
3. In `lyricsService.ts`: import, register, add try-func, and insert into `loadLyrics()`
4. Add `lyrics_source_<id>` key to all 8 language files
5. Add `<id>: 'lyrics_source_<id>'` in `LyricsRenderer.ts` `sourceKeyFor()` map

See `src/components/lyrics/lyrics.md` for detailed step-by-step instructions.

## Platform Compatibility

- Uses only `fetch()` API — works on all platforms (Windows, Linux, macOS, Android, iOS, Web)
- No native dependencies, no platform-specific code
- Touch-friendly: the provider layer has no UI concerns

## Replacing LRCLIB

To switch from LRCLIB to another service:
1. Create a new provider file with `priority: 350`
2. Register it in `lyricsService.ts`
3. Unregister LRCLIB: `lyricsSourceRegistry.unregister('lrclib')`
4. Remove LRCLIB import if desired

The source badge in the UI will automatically show the new provider name via the translation key.

## HACKs

None. The provider registry is clean and follows the same pattern as `src/core/metadata/metadataRegistry.js`.
