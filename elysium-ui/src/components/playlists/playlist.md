# Playlist Module Documentation

## Overview

The playlist module provides full CRUD operations for user-created playlists, including creating, viewing, adding/removing songs, and deleting playlists. It integrates with the queue system and audio engine for playback.

## Architecture

```
src/components/playlists/
├── PlaylistView.ts          # Detail view for a single playlist
├── PlaylistList.ts          # Sidebar list of all playlists
├── CreatePlaylistModal.ts   # Modal for creating new playlists
├── AddToPlaylistModal.ts    # Modal for adding tracks to playlists
└── services/
    ├── playlistApi.ts       # IPC bridge (Tauri invoke calls)
    ├── playlistState.ts     # Reactive state manager (subscriber pattern)
    ├── playlistPlayer.ts    # Playback via audioEngine
    └── songRowRenderer.ts   # Individual song row with action buttons

src/modules/playlists/
└── PlaylistOverviewView.js  # Main "Playlists" module view

src/styles/playlist/
├── song-row.css             # Song row styles (play/download/add/queue/remove)
├── playlist-list.css        # Sidebar list + detail view + overview grid
└── playlist-modals.css      # Modal dialogs (create, add-to, inline create)
```

## How It Works

### State Management

`playlistState.ts` is a singleton that holds the playlist array and current playlist ID. It uses a subscriber pattern (not events) for reactive updates:

```typescript
const unsub = playlistState.subscribe((playlists, currentId) => {
  // React to changes
});
```

State mutations (`create`, `remove`, `addSong`, `removeSong`) automatically call the API, reload from backend, and notify subscribers.

### Playback

`playlistPlayer.ts` loads audio bytes via IPC and plays through `audioEngine`. It validates that the track object is defined and throws immediately if not (Rule 4).

### Song Actions

Each song row (`songRowRenderer.ts`) has five action buttons:
- **Play** - Plays the song directly
- **Download** - Opens Tauri save dialog, downloads via yt-dlp
- **Add to Playlist** - Opens add-to-playlist modal
- **Queue** - Adds to the play queue
- **Remove** - Removes from current playlist

All handlers use closure-captured references (no global state, no WeakMaps).

### Event Flow

| Event | Producer | Consumer |
|-------|----------|----------|
| `elysium-open-playlist` | PlaylistList.ts | PlaylistView.ts |
| `elysium-playlist-created` | CreatePlaylistModal.ts, AddToPlaylistModal.ts | main.js (re-renders sidebar) |
| `elysium-playlists-loaded` | playlistState.ts | main.js (re-renders sidebar) |
| `elysium-close-playlist` | (external) | main.js (navigates to playlists module) |

## How to Extend

### Adding a new action button to song rows

1. Add the icon to `src/config/icons.js`
2. Add a translation key to ALL language files (de.js, en.js, es.js, fr.js, ja.js, ru.js, tr.js, pt-BR.js)
3. Add the button HTML in `songRowRenderer.ts` inside the `row.innerHTML` template
4. Add a click handler using the closure pattern (capture `song` and `playlist` from the function scope)
5. Add corresponding CSS class in `song-row.css`

### Adding a new playlist state property

1. Add the property to `PlaylistStateCore` in `playlistState.ts`
2. Update the `notify()` method if needed
3. Add IPC call in `playlistApi.ts` if it needs backend persistence

### Adding a new modal

1. Create a new `.ts` file in `src/components/playlists/`
2. Use CSS classes from `playlist-modals.css` (`.pl-modal-overlay`, `.pl-modal-dialog`, etc.)
3. Follow the pattern: create overlay → dialog → content → footer actions
4. Export a `showXxxModal()` function

## Hacks

**None.** This module was rebuilt from scratch with zero hacks. All old `// HACK!!!` markers from the previous `PlaylistView.js` debug interceptor have been removed.

## Rule Compliance

- [x] **Rule 1 (Modularity):** Split into 8 specialized files + 3 CSS files
- [x] **Rule 2 (File size):** All files under 150 lines
- [x] **Rule 3 (Loader/Async):** playlistState.load() returns Promise, UI re-renders on resolution
- [x] **Rule 5 (Comments):** English header comments on all files
- [x] **Rule 7 (Modular structure):** services/ subfolder for logic, views at root
- [x] **Rule 8 (Multi-platform):** Touch-friendly buttons (min 44x44px), no hover-only interactions
- [x] **Rule 10 (Git):** No large files or build artifacts
- [x] **Rule 12 (Language system):** All text via t() function, no hardcoded strings
- [x] **Rule 18 (No inline styles):** All styling via CSS classes
- [x] **Rule 19 (Plugin-ready):** Events via CustomEvent, state via subscriber pattern
- [x] **Rule 20 (TypeScript):** All new files in TypeScript

## Cross-Platform Notes

- All interactive elements have `min-height: 44px` for touch targets
- Modal dialogs use `max-width: 90vw` and scroll on narrow screens
- No hover-only features: delete buttons are also accessible via the 3-dot pattern (future)
- CSS uses custom properties for theming (dark mode ready)
