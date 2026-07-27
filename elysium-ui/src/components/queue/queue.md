# Play Queue — Architecture & Documentation

## Overview

The Play Queue system manages a ordered list of tracks for sequential playback. It auto-advances when a track ends and provides a slide-in panel UI for viewing, reordering, and removing entries. The implementation mirrors the Lyrics panel pattern for consistent UX.

---

## File Structure

```
src/components/queue/
├── PlayerQueue.ts           — Panel lifecycle (open/close/DOM shell)
├── QueueRenderer.ts         — DOM rendering (entries, empty state, sections)
├── queue.md                 — This file
└── services/
    ├── QueueManager.ts      — Core queue logic (enqueue/dequeue/next/previous/shuffle)
    └── queueState.ts        — UI state bridge (subscriber pattern)

src/styles/queue/
└── player-queue.css         — Panel shell, entry rows, responsive breakpoints

src/types/
└── Track.ts                 — Shared Track interface (single source of truth)
```

---

## Module Responsibilities

### QueueManager.ts (~140 lines)
Singleton service that owns the queue data. All mutations go through this module.

- **enqueue(track, addedBy?)** — Appends a track to the end of the queue
- **enqueueAtFront(track, addedBy?)** — Inserts after current track (for "play next")
- **dequeue(position)** — Removes entry at given index
- **move(from, to)** — Reorders entries (used by up/down buttons in UI)
- **next()** — Advances currentIndex, returns next entry or null
- **previous()** — Moves currentIndex back, returns entry or null
- **shuffle()** — Toggles shuffle mode (Fisher-Yates on rest, keeps current)
- **clear()** — Empties the queue
- **subscribe(fn)** — Subscriber pattern for reactive updates

### queueState.ts (~40 lines)
Thin bridge between QueueManager and the UI. Emits a `QueueState` snapshot on every change.

### PlayerQueue.ts (~90 lines)
Panel lifecycle module. Creates the overlay + panel DOM shell, manages open/close state, subscribes to queueState for live rendering.

### QueueRenderer.ts (~130 lines)
Pure DOM rendering. Receives state + translate function, builds the entry list with:
- "Now Playing" section with active track highlight
- "Up Next" section with upcoming tracks
- Move up/down buttons for reordering
- Remove button per entry
- Empty state with icon + message

---

## Integration Points

### playbackService.ts
The `ended` event on the audio element triggers `queueManager.next()`. If a next entry exists, it calls `audioEngine.playTrack()` to load and play it automatically.

### PlayerActions.ts
A queue toggle button (ICON_QUEUE) is added to the player utilities slot. Clicking it opens/closes the queue panel via `toggle()`.

### PlayerBar.ts
`initQueuePanel()` is called during shell creation to set up the panel DOM and state subscription.

---

## Adding Queue Entries from External Code

```typescript
import { queueManager } from '../queue/services/QueueManager.js';

// Add a track to the end of the queue
queueManager.enqueue(track, 'my-plugin');

// Add a track to play next (after current)
queueManager.enqueueAtFront(track, 'my-plugin');
```

---

## Plugin System Compatibility

The queue system follows the same patterns as the rest of the player bar:

1. **Subscriber pattern** — Plugins can `queueManager.subscribe()` to react to queue changes
2. **addedBy field** — Every entry tracks its source (plugin ID or 'user')
3. **No global state mutation** — QueueManager owns its state; external code calls methods
4. **Event-driven** — Track changes propagate through the subscriber chain

To add a plugin button that queues a track:
```typescript
import { queueManager } from './components/queue/services/QueueManager.js';
button.addEventListener('click', () => queueManager.enqueue(currentTrack, 'my-plugin-id'));
```

---

## Cross-Platform Considerations

- **Touch-friendly**: All buttons meet 44x44px minimum touch target
- **No hover-only**: Move/remove buttons are always visible, not hover-dependent
- **Scrollable**: Queue content scrolls on narrow screens
- **Responsive**: Panel goes full-width below 480px
- **No drag-and-drop**: Uses explicit up/down buttons instead (better mobile support)

---

## Architecture Rules Compliance

| Rule | Status | Notes |
|------|--------|-------|
| No file >150 lines | ✅ | Largest: QueueManager.ts ~140 lines |
| No hardcodes | ✅ | All text via i18n keys, all sizes via CSS variables |
| Full i18n (7 languages) | ✅ | All queue_* keys in en, de, fr, es, ru, tr, pt-BR |
| Modular architecture | ✅ | 4 TS modules + 1 CSS file, single-responsibility |
| English comments | ✅ | All comments in English |
| TypeScript | ✅ | All queue modules are TypeScript |
| `// HACK!!!` marking | ✅ | No hacks in queue code |
| Cross-platform | ✅ | Touch-friendly, no hover-only, responsive |

---

## i18n Keys

| Key | Purpose |
|-----|---------|
| `queue_title` | Panel header / button tooltip |
| `queue_empty` | Empty state message |
| `queue_clear` | Clear queue button |
| `queue_add` | Add to queue (external use) |
| `queue_remove` | Remove entry button |
| `queue_now_playing` | Current track section label |
| `queue_upcoming` | Upcoming tracks section label |
| `queue_shuffle` | Shuffle toggle button |
| `queue_move_up` | Move entry up button |
| `queue_move_down` | Move entry down button |
