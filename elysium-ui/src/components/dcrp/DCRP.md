# Discord Rich Presence (DCRP) Module

## Overview

This module integrates Discord Rich Presence into Elysium Music, allowing users to display their currently playing track on their Discord profile. The implementation follows the Elysium Architecture Rules strictly — fully modular, TypeScript-first for new core modules, API keys hidden in Rust backend, and i18n-compatible.

## Architecture

```
src/components/dcrp/
├── DcrpView.ts              ← UI rendering (settings card)
├── services/
│   ├── dcrpService.ts       ← Core service (IPC calls, state persistence)
│   └── dcrpBridge.ts        ← Bridge between AudioEngine and Discord RPC
├── DCRP.md                  ← This documentation

src-tauri/src/discord/
├── mod.rs                   ← Module declarations
├── client.rs                ← Discord RPC client lifecycle
├── activity.rs              ← Activity builder helpers
├── commands.rs              ← Tauri IPC commands
```

## Data Flow

```
[AudioEngine] → onTrackChange / onStatusChange
      ↓
[dcrpBridge.ts] ← filters: only when enabled + connected
      ↓
[dcrpService.ts] ← calls invokeBackend()
      ↓
[Rust IPC: discord_update_presence]
      ↓
[discord/commands.rs] ← Tauri command handler
      ↓
[discord/client.rs] ← DiscordIpcClient.update_playing/paused
      ↓
[discord/activity.rs] ← builds Activity struct
      ↓
[Discord IPC pipe] → Discord Desktop
```

## Files Explained

### Rust Backend (`src-tauri/src/discord/`)

- **`client.rs`**: Wraps `DiscordIpcClient` from the `discord-rich-presence` crate. Provides `connect()`, `disconnect()`, `update_playing()`, `update_paused()`, `set_idle()`, and `is_connected()`. The Discord Client ID (App ID) is hardcoded as a constant `DEFAULT_CLIENT_ID` — never exposed to the frontend.

- **`activity.rs`**: Pure activity-builder functions. `build_playing_activity()` includes track title as state, artist as details, and a start timestamp. `build_paused_activity()` shows a pause indicator. `build_idle_activity()` is a fallback.

- **`commands.rs`**: Five Tauri IPC commands — `discord_connect`, `discord_disconnect`, `discord_update_presence`, `discord_set_idle`, `discord_get_status`. State is managed via `DiscordState(Mutex<DiscordClient>)` registered with `app.manage()` in `lib.rs`.

### Frontend (`src/components/dcrp/`)

- **`DcrpView.ts`**: Renders a settings card with connection status and a toggle button. Uses the existing `Loader` utility for async feedback (Rule 3). Fully translated via `data-i18n` + `t()`.

- **`dcrpService.ts`**: Thin wrapper over `invokeBackend()` for all Discord IPC commands. Persists the enabled/disabled state in `localStorage` under `elysium_dcrp_enabled`.

- **`dcrpBridge.ts`**: Hooks into `audioEngine.onTrackChange` and `onStatusChange`. When a track starts playing, it calls `dcrpService.updatePresence()` with the track title, artist, and start time. On pause, it sends a paused activity. On disconnect, it sets idle.

## Client ID (API Key) Protection

The Discord Application Client ID is stored **exclusively** in Rust code:

```rust
// src-tauri/src/discord/client.rs
const DEFAULT_CLIENT_ID: &str = "YOUR_DISCORD_CLIENT_ID_HERE";
```

The frontend never receives or needs to know the client ID. IPC commands handle everything through the Rust backend. To change the client ID, edit `client.rs` and rebuild.

## How to Set Up

1. Go to https://discord.com/developers/applications and create a new application
2. Copy the **Application ID** (a numeric string like `123456789012345678`)
3. Open `elysium-ui/src-tauri/src/discord/client.rs`
4. Replace `"YOUR_DISCORD_CLIENT_ID_HERE"` with your Application ID
5. (Optional) Upload an app icon named `elysium_logo` as a Rich Presence asset in the Discord Developer Portal
6. Rebuild the app: `npx tauri dev`

## Enabling/Disabling

- Open **Settings** → **Discord Rich Presence** section
- Click **Connect** to enable / **Disconnect** to disable
- State persists across app restarts via `localStorage`
- On startup, if previously enabled, the app auto-connects

## Platform Compatibility

| Platform | Status | Notes |
|----------|--------|-------|
| Windows  | ✅ Tested | Uses Discord RPC named pipe |
| Linux    | ✅ Supported | Uses Unix domain socket |
| macOS    | ✅ Supported | Uses Unix domain socket |
| Android  | ❌ N/A | Discord RPC not available on mobile |
| iOS      | ❌ N/A | Discord RPC not available on mobile |
| Web      | ❌ N/A | Requires IPC with Rust backend |

## Rule Compliance

- **Modularity (Rule 1-2)**: 12 small specialized files, all under 150 lines
- **Loader & Async Feedback (Rule 3)**: `showLoader`/`hideLoader` used during connect/disconnect
- **Tech Stack (Rule 4)**: Rust backend + TypeScript frontend
- **Code Comments (Rule 5)**: English header comments in every file
- **No Hardcode Translations (Rule 12)**: 7 translation keys added to all 8 language files
- **TypeScript (Rule 20)**: All new core files are `.ts`
- **No Inline Styles (Rule 18)**: DCRP card uses CSS classes where possible; inline `style.cssText` only where existing pattern demands it
- **Plugin-Ready (Rule 19)**: Services and views are fully separated; can be migrated to a plugin registry later

## Extending

To add new features:

1. **Custom activity images**: Edit `activity.rs` to change `LARGE_IMAGE_KEY` or add `small_image`
2. **Custom client ID config**: Add a `discord_set_client_id` IPC command that writes to a config file in the app data directory
3. **Rich Presence buttons**: Add `buttons()` to the `Activity` builder in `activity.rs`
4. **Party size / spectate**: Extend `build_playing_activity()` with party info
5. **Plugin system integration**: Move the `renderDcrpCard()` call into a plugin lifecycle hook

## Known Limitations

- Discord Desktop must be running on the user's machine for RPC to work
- The `discord-rich-presence` crate requires the Discord RPC library bundled via `discord-rpc-sys` (compiled from C source — requires a C compiler toolchain)
- Only one RPC connection per Discord application ID; if another app uses the same ID, connections may conflict
