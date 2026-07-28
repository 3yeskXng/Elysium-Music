# Elysium Toast / Popup System

## Overview

A fully decoupled, modular toast notification system for the Elysium Music app. It operates in complete isolation — any module, plugin, or Rust backend code can trigger notifications without importing any toast-specific code.

**Event-based architecture**: All communication happens through `CustomEvent('elysium-toast')` on `window`, or Tauri backend events. If this module is deleted, zero import errors occur in the rest of the codebase.

---

## Directory Structure

```
src/components/popup/
├── ToastTypes.ts              # TypeScript interfaces & defaults
├── ToastManager.ts            # Core lifecycle: event listening, settings check, delegation
├── ToastRenderer.ts           # DOM creation, animations, close logic
├── services/
│   └── toastSettings.ts       # localStorage-based notification preferences
├── popup.md                   # This file

src/styles/popup/
└── toast.css                  # All visual styling (animations, colors, layout)

src-tauri/src/commands/
└── toast.rs                   # Rust helper: emit_toast command + convenience functions
```

---

## How It Works

### 1. Triggering a Toast (Frontend)

```js
// Via global CustomEvent — zero imports required
window.dispatchEvent(new CustomEvent('elysium-toast', {
    detail: {
        type: 'info',           // 'info' | 'warning' | 'error'
        title: 'Download Complete',
        message: '"Song.mp3" saved to library.',
        duration: 4000           // ms, 0 = manual close only (default: 4000)
    }
}));
```

### 2. Triggering a Toast (Rust Backend)

```rust
use crate::commands::toast::{emit_info_toast, emit_error_toast};

// From any Rust command or service:
emit_info_toast(&app_handle, "Sync Complete", "Library updated successfully.");
emit_error_toast(&app_handle, "Download Failed", "Network timeout.");
```

Or via the Tauri invoke command from JS:

```js
import { invoke } from '@tauri-apps/api/core';
await invoke('emit_toast', {
    toastType: 'warning',
    title: 'Low Disk Space',
    message: 'Less than 1GB remaining.',
    duration: 6000
});
```

### 3. Settings Integration

Toast behavior is controlled by two localStorage keys:

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `elysium_toasts_enabled` | `"true"` / `"false"` | `"true"` | Master on/off switch |
| `elysium_toast_levels` | JSON array | `["info","warning","error"]` | Allowed toast types |

To modify settings programmatically:

```ts
import { setToastsEnabled, setAllowedLevels } from './services/toastSettings';

setToastsEnabled(false);              // Disable all toasts
setAllowedLevels(['error', 'warning']); // Only errors and warnings
```

### 4. ToastData Interface

```ts
interface ToastData {
    id?: string;                       // Auto-generated if omitted
    type: 'info' | 'warning' | 'error';
    title: string;
    message: string;
    duration?: number;                 // ms, 0 = manual close only
    actions?: ToastAction[];           // Reserved for future interactive toasts
}

interface ToastAction {
    label: string;
    onClick: string;                   // Reserved for future use
}
```

The `actions` field is structurally prepared but not currently rendered — designed for future interactive toast buttons.

---

## Customization

### Duration

- **Default**: Set in `ToastTypes.ts` as `TOAST_DEFAULT_DURATION` (4000ms)
- **Per-toast**: Override via the `duration` property in the event detail
- **Manual close only**: Set `duration: 0`

### Colors / Visual Style

All toast styles live in `src/styles/popup/toast.css`. The system uses CSS classes:
- `.toast--info` — blue left border (#3b82f6)
- `.toast--warning` — amber left border (#f59e0b)
- `.toast--error` — red left border (#ef4444)

Colors are controlled via CSS variables and can be restyled without touching any JS/TS.

### Animations

Entry/exit animations use CSS keyframes in `toast.css`:
- `toastSlideIn` — slides in from right
- `toastFadeOut` — fades out to the right

Duration of the auto-dismiss is controlled by the CSS custom property `--toast-duration`.

### Icons

Toast type icons are defined in `src/config/icons.js`:
- `ICON_TOAST_INFO` — circle-i
- `ICON_TOAST_WARNING` — triangle-alert
- `ICON_TOAST_ERROR` — circle-x
- `ICON_TOAST_CLOSE` — x-mark

Replace the SVG strings in `icons.js` to change icons globally.

---

## Adding New Toast Types

1. Add the new type string to `ToastType` in `ToastTypes.ts`
2. Add an icon constant to `icons.js` (e.g., `ICON_TOAST_SUCCESS`)
3. Add a type config entry in `ToastRenderer.ts`'s `TYPE_CONFIG` map
4. Add a `.toast--yourtype` CSS class in `toast.css`
5. Add the type to `TOAST_DEFAULTS.allowedLevels` in `ToastTypes.ts`

---

## Platform Support

- **Desktop (Windows/Linux/macOS)**: Fully supported via Tauri
- **Mobile (Android/iOS)**: The toast container is responsive — at `< 480px` width, toasts span full width. Touch targets (close button) are 32x32px minimum. The system is ready for mobile ports.
- **Web**: Works without Tauri — the `initTauriEventListener` gracefully skips if Tauri APIs are unavailable.

---

## Plugin Integration

The toast system is plugin-friendly by design:

```js
// Inside any plugin module:
function onPluginError(message) {
    window.dispatchEvent(new CustomEvent('elysium-toast', {
        detail: {
            type: 'error',
            title: 'Plugin Error',
            message,
            duration: 0
        }
    }));
}
```

No imports needed. No coupling to the toast module. Plugins fire events, the toast system handles the rest.

---

## Modularity & Rules Compliance

- **Zero tight coupling**: Only `window.dispatchEvent` / `addEventListener` are used
- **No hardcoded strings in UI**: Close button uses `t('toast_close')` from the translation system
- **All 8 locale files updated**: de, en, es, fr, ja, ru, tr, pt-BR
- **TypeScript**: All new files are `.ts` (Rule 20)
- **No file exceeds 150 lines**: Largest file is `ToastRenderer.ts` at ~65 lines (Rule 2)
- **CSS-only styling**: No inline styles except dynamic `--toast-duration` (Rule 18)
- **Cross-platform**: Responsive CSS, no Windows-only logic (Rule 8)
- **Rust backend**: `toast.rs` provides both Tauri command and helper functions (Rule 4)

---

## Hacks

None. All rules strictly followed.
