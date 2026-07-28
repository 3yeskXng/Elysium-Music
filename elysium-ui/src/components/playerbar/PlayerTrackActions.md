# PlayerTrackActions — Architecture & Documentation

## Overview

PlayerTrackActions provides two track-specific action buttons in the player bar:
- **Download** — downloads the currently playing track via yt-dlp
- **Add to Playlist (+)** — opens the add-to-playlist modal for the current track

These buttons visually match the existing download and plus buttons in playlist song rows (see `songRowRenderer.ts`) and reuse the same backend commands.

---

## File Structure

```
src/components/playerbar/
  PlayerTrackActions.ts    — Button creation, event handlers, IPC calls
  PlayerTrackActions.md    — This file

src/styles/player/
  player-track-actions.css — Container layout, spinner animation
```

---

## Module Responsibilities

### PlayerTrackActions.ts (~80 lines)

The main module. Creates a flex container with two `player-btn` buttons.

**Download button (`pta-dl-btn`):**
1. Reads `audioEngine.currentTrack` on click
2. Shows a CSS border-spinner (`.pta-spinner`) and disables the button
3. Opens a Tauri save dialog (`.opus` filter) — gracefully skips if `window.__TAURI__` is unavailable (browser dev mode)
4. Calls `invokeBackend('download_youtube', { query, destPath })`
5. Dispatches `elysium-library-refresh` on success
6. Restores the original icon in the `finally` block

**Add-to-playlist button (`pta-add-btn`):**
1. Reads `audioEngine.currentTrack` on click
2. Calls `showAddToPlaylistModal(track)` from the shared playlist module
3. The modal handles null/undefined tracks gracefully

### player-track-actions.css (~20 lines)

Contains:
- `.player-track-actions` — flex row with 4px gap
- `.pta-spinner` — 18px CSS border spinner using the existing `@keyframes spin` from `style.css`

---

## Data Flow

```
[Download Button Click]
      │
      ▼
audioEngine.currentTrack ── null → return (no-op)
      │
      ▼ (track exists)
save dialog ← window.__TAURI__.dialog.save()
      │
      ├── null (cancelled) → restore icon, return
      └── path → invoke Backend('download_youtube', { query, destPath })
                    │
                    ▼
              dispatch 'elysium-library-refresh'
                    │
                    ▼
              finally → restore icon, re-enable button


[Add to Playlist Button Click]
      │
      ▼
audioEngine.currentTrack ── null → return (no-op)
      │
      ▼ (track exists)
showAddToPlaylistModal(track)
      │
      ▼
[AddToPlaylistModal renders playlist list]
```

---

## Cross-Platform Considerations

| Platform | Dialog Support | Notes |
|----------|---------------|-------|
| Windows (Webview2) | `window.__TAURI__.dialog.save()` | Standard Tauri v2 dialog |
| Linux (WebKitGTK) | `window.__TAURI__.dialog.save()` | Works via Tauri dialog API |
| macOS (WKWebView) | `window.__TAURI__.dialog.save()` | Works via Tauri dialog API |
| Browser (dev mode) | Fallback: no dialog, no-op | Logs warning to console |

- All buttons use `player-btn` base class (40x40px touch-friendly target)
- No hover-only interactions (buttons are always clickable)
- SVG icons use `pointer-events: none` on child elements to avoid click capture
- The CSS spinner uses `var(--accent-premium)` and `rgba()` — themable via CSS custom properties

---

## Translation Keys Used

| Key | English | German |
|-----|---------|--------|
| `pl_download` | "Download Song" | "Song herunterladen" |
| `pl_add_to` | "Add to Playlist" | "Zu Playlist hinzufügen" |

These keys already existed in all 8 language files — no new translations were needed.

---

## Architecture Rules Compliance

| Rule | Status | Notes |
|------|--------|-------|
| No file >150 lines | ✅ | Largest: ~80 lines |
| No hardcoded strings | ✅ | All text via `t()` |
| Full i18n (8 languages) | ✅ | Reuses existing keys |
| Modular architecture | ✅ | Single-responsibility, one file per concern |
| English comments | ✅ | All comments in English |
| No inline style deserts | ✅ | All styles in `player-track-actions.css` |
| TypeScript for new modules | ✅ | `.ts` with typed imports |
| Cross-platform ready | ✅ | Tauri guard, 40px touch targets |
| Plugin-system ready | ✅ | Uses slot-based architecture via `#player-utilities-slot` |

---

## Known Duplication

The download logic (save dialog + IPC call + spinner state) is duplicated across three files:
1. `songRowRenderer.ts` (playlist song rows)
2. `trackRowBuilder.js` (search results)
3. `PlayerTrackActions.ts` (player bar)

A future refactor could extract this into a shared `services/downloadService.ts` that all three modules import. This was not done to keep the change focused on the player bar and to match the existing pattern.
