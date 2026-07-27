# PlayerBar — Architecture & Documentation

## Overview

The PlayerBar is the persistent bottom bar in Elysium that provides transport controls, track metadata, volume, utility actions, and lyrics access. It is built entirely in TypeScript with modular CSS, following the Elysium Architecture Rules (no file >150 lines, no hardcodes, full i18n, modular architecture).

---

## File Structure

```
src/components/playerbar/
  PlayerBar.ts          — Shell lifecycle, track binding, lyrics sync
  PlayerControls.ts     — Play/pause, rewind/forward, progress bar
  PlayerActions.ts      — Download, add-to-playlist (+), lyrics toggle
  PlayerVolume.ts       — Volume slider with mute toggle
  services/
    playbackService.ts  — Playback state, RAF loop, transport actions

src/styles/player/
  player-layout.css     — Grid positioning, meta slot, track info
  player-controls.css   — Transport buttons, progress bar, actions
  player-volume.css     — Volume slider styles
```

---

## Module Responsibilities

### PlayerBar.ts (69 lines)
The entry point. Called once from `main.js` via `initPlayerBar()`.

- **createShell()**: Clears the three HTML slots (`#player-meta-slot`, `#player-controls-slot`, #player-utilities-slot`) and populates them with the sub-modules.
- **bindTrackUpdates()**: Subscribes to `audioEngine.onTrackChange` to update the track title/artist display and trigger lyrics loading.
- **initPlayerBar()**: Guarded by `initialized` flag to prevent double-init.

### PlayerControls.ts (82 lines)
Creates the transport row (prev, play/pause, next) and the progress bar.

- **Progress bar**: Uses a native `<input type="range">` (0–100) with a visual fill div. The range input sits in normal flow inside a 14px-tall track; the fill and background rail are absolutely positioned at 4px height, centered vertically.
- **Time display**: Two `<span>` elements showing `currentTime` and `duration` in `m:ss` format.
- **Subscription**: Calls `playback.subscribe()` to receive 60fps updates from the RAF loop. Updates button icon (`ICON_PLAY` / `ICON_PAUSE`), progress value, fill width, and time labels.

### PlayerActions.ts (62 lines)
Three utility buttons in the right slot:

- **Download**: Opens a Tauri save dialog, then invokes `download_youtube` backend command.
- **Add to playlist (+)**: Opens the `AddToPlaylistModal` with the current track.
- **Lyrics toggle**: Calls `toggleLyrics()` from LyricsPanel to show/hide the lyrics overlay.

### PlayerVolume.ts (45 lines)
Volume control with mute toggle:

- **Icon button**: Toggles `audioEngine.audio.muted` and swaps between `ICON_VOLUME` and `ICON_MUTE`.
- **Slider**: `<input type="range">` (0–100) with a CSS custom property `--vol-pct` driving a gradient fill. Directly sets `audioEngine.audio.volume`.

### playbackService.ts (80 lines)
The core playback state manager. This is the **single source of truth** for transport state in the player bar.

- **RAF loop**: `requestAnimationFrame` loop starts on `play` event, stops on `pause`/`ended`. Provides smooth 60fps progress updates without polling.
- **Native events**: Subscribes to `audio.addEventListener('play'/'pause'/'ended'/'loadedmetadata')` for state changes.
- **Subscriber pattern**: `subscribe(fn)` returns an unsubscribe function. When no subscribers remain, the RAF loop stops automatically.
- **Transport actions**:
  - `togglePlay()` → `audioEngine.togglePause()`
  - `fastForward()` → sets `currentTime = duration` (jump to end)
  - `rewind10()` → seeks back 10 seconds
  - `seekTo(time)` → seeks to absolute time

---

## HTML Structure (from index.html)

```html
<footer id="shell-player-bar">
  <div id="player-meta-slot"></div>      <!-- Track info: title + artist -->
  <div id="player-controls-slot"></div>  <!-- Transport + progress bar -->
  <div id="player-utilities-slot"></div> <!-- Volume + actions -->
</footer>
```

The shell uses CSS Grid (`grid-column: 2; grid-row: 2`) and flexbox internally for the three-slot layout.

---

## CSS Architecture

| File | Lines | Purpose |
|------|-------|---------|
| `player-layout.css` | 74 | Grid positioning, meta slot, track info typography |
| `player-controls.css` | 150 | Transport buttons, progress bar, action buttons |
| `player-volume.css` | 58 | Volume slider with gradient fill |

All sizing uses `clamp()` for responsive scaling. No hardcoded px values for layout dimensions.

---

## Design Decisions

### Why RAF instead of `setInterval`?
The `requestAnimationFrame` loop in `playbackService.ts` syncs progress updates to the display refresh rate. This prevents jank and unnecessary CPU usage when the tab is backgrounded (RAF automatically pauses). `setInterval` would continue firing at fixed intervals regardless of visibility.

### Why a native `<input type="range">` instead of a custom slider?
Native range inputs provide built-in accessibility (keyboard navigation, screen reader support), touch handling, and correct pointer capture behavior across platforms. The visual appearance is fully overridden with CSS to match the Elysium design language.

### Why separate `playbackService` from `audioEngine`?
`audioEngine` is the low-level Web Audio API wrapper shared across the entire app. `playbackService` is a higher-level state manager specific to the player bar's UI needs (RAF loop, subscriber pattern, transport actions). This separation keeps the player bar decoupled from other audio consumers (lyrics sync, visualizer, etc.).

### Why `overflow: hidden` on the progress track?
Range inputs in browsers have extended hit areas that can extend beyond their visual bounds. The `overflow: hidden` on `.player-progress-track` contains the range input's interactive area within the track, preventing it from intercepting clicks on the transport buttons above.

### Why `z-index: 2` on `.player-transport`?
Creates a stacking context that ensures transport buttons render above the progress bar. This is a defense-in-depth measure alongside `overflow: hidden` to prevent click interception.

---

## Responsive Scaling

All dimensions use CSS `clamp()` for continuous scaling:

| Variable | Min | Preferred | Max |
|----------|-----|-----------|-----|
| `--sidebar-width` | 140px | 14vw | 240px |
| `--player-height` | 50px | 6vh | 80px |
| Main padding | 16px | 3vw | 40px |
| Player buttons | 32px | 3.5vw | 40px |
| View title | 0.9rem | 1.2vw | 1.4rem |

At 800px width, the progress bar and volume slider are hidden to save space. Below 680px, the sidebar collapses entirely.

---

## Plugin System Compatibility

The PlayerBar is designed to be extensible for a future plugin system:

1. **Slot-based architecture**: The three HTML slots (`meta`, `controls`, `utilities`) can accept additional elements from plugins without modifying PlayerBar code.
2. **Subscriber pattern**: Plugins can subscribe to `playbackService.subscribe()` to react to playback state changes without tight coupling.
3. **Event-driven**: Track changes fire via `audioEngine.onTrackChange`, which plugins can listen to independently.
4. **No global state mutation**: The player bar reads from `audioEngine` but never modifies global app state directly (except via `audioEngine` API calls).

**To add a plugin element to the player bar:**
- Add a new slot in `index.html` (e.g., `#player-plugin-slot`)
- Have the plugin call `document.getElementById('player-plugin-slot').appendChild(...)` during init
- Style it in a new CSS module under `src/styles/player/`

---

## Cross-Platform Considerations

- **Tauri v2**: All backend calls use `invokeBackend()` which wraps `window.__TAURI__.core.invoke()`. The save dialog uses `window.__TAURI__.dialog.save()`.
- **Volume control**: Uses the standard `HTMLAudioElement.volume` property (0.0–1.0), which works identically across Webview2 (Windows), WebKitGTK (Linux), and WKWebView (macOS).
- **Range inputs**: Styled with both `::-webkit-slider-*` and `::-moz-range-*` pseudo-elements for cross-engine compatibility.
- **No platform-specific code**: The player bar contains zero `#ifdef` or platform detection. All platform abstraction lives in the Rust backend.

---

## Architecture Rules Compliance

| Rule | Status | Notes |
|------|--------|-------|
| No file >150 lines | ✅ | Largest file: `player-controls.css` at 150 lines |
| No hardcodes | ✅ | All colors, sizes via CSS variables; all text via i18n keys |
| Full i18n (6 languages) | ✅ | All user-facing strings use `t()` or `data-i18n` |
| Modular architecture | ✅ | 5 TypeScript modules + 3 CSS files, each single-responsibility |
| English comments | ✅ | All comments in English |
| No inline style deserts | ✅ | Styles in CSS files; inline only in SettingsView (legacy, separate concern) |
| TypeScript for new modules | ✅ | All playerbar modules are TypeScript |
| `// HACK!!!` marking | ✅ | No hacks in playerbar code |

---

## Legacy vs Modern Code

The PlayerBar is **100% modern code**:
- TypeScript with strict types
- ES module imports
- CSS custom properties (no Sass/LESS)
- `requestAnimationFrame` for animations
- No jQuery, no inline event handlers, no `document.write`
- Subscriber pattern instead of global mutable state

The only legacy code in the app is `SettingsView.js` (JavaScript, inline styles) which is outside the player bar scope.

---

## Future: Queue System

To add a play queue, the following changes would be needed:

### 1. New module: `QueueManager.ts`
```typescript
// src/components/playerbar/services/QueueManager.ts
export interface QueueEntry {
  track: Track;
  addedBy: string; // plugin ID or 'user'
  position: number;
}

export class QueueManager {
  private entries: QueueEntry[] = [];
  private currentIndex = 0;

  enqueue(track: Track, addedBy?: string): void { ... }
  dequeue(position: number): void { ... }
  next(): QueueEntry | null { ... }
  previous(): QueueEntry | null { ... }
  shuffle(): void { ... }
  clear(): void { ... }
  getEntries(): QueueEntry[] { ... }
  subscribe(fn: (entries: QueueEntry[], index: number) => void): () => void { ... }
}
```

### 2. Integrate with playbackService
```typescript
// In playbackService.ts
import { queueManager } from './QueueManager.js';

audio.addEventListener('ended', () => {
  const next = queueManager.next();
  if (next) {
    audioEngine.loadTrack(next.track);
    audioEngine.play();
  }
  notify();
  stopLoop();
});
```

### 3. New UI module: `PlayerQueue.ts`
- Slide-in panel from the right (like lyrics panel)
- Shows current queue with drag-to-reorder
- "Add to queue" option alongside "Add to playlist" in PlayerActions

### 4. CSS: `player-queue.css`
- Follows the same pattern as lyrics panel CSS
- Uses CSS custom properties for theming

### 5. i18n keys needed
```
queue_title: "Play Queue"
queue_empty: "Queue is empty"
queue_clear: "Clear Queue"
queue_add: "Add to Queue"
queue_remove: "Remove from Queue"
queue_drag_hint: "Drag to reorder"
```

---

## Adding a New Lyrics Source

See `src/components/lyrics/Lyrics.md` for the full pipeline documentation. In summary:

1. Add a `try<Source>` function in `lyricsService.ts`
2. Call it in the pipeline (between existing steps)
3. Add i18n key `lyrics_source_<name>` to all 7 language files
4. Add the key to `languageRegistry.js` if it needs a UI label
