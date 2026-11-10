# New Fast Listen Module

## Purpose
This module adds an optional playback path called **New Fast Listen**.
It resolves a direct audio stream URL via `yt-dlp` from the Rust backend and starts playback immediately in the frontend audio engine.

## Why this exists
The classic path downloads and converts first, then starts playback.
New Fast Listen starts with a direct stream URL to reduce waiting time before audio begins.

## Architecture
- `types/NewFastTypes.ts`
  - Shared contracts for playback mode and stream providers.
- `services/NewFastPreferenceService.ts`
  - Stores playback mode in localStorage and emits a mode-change event.
- `providers/NewFastProviderRegistry.ts`
  - Registry that allows swapping or adding future providers.
- `providers/YtDlpNewFastProvider.ts`
  - Provider implementation that calls Rust command `resolve_fast_listen_stream`.
- `services/NewFastPlaybackService.ts`
  - Orchestrates fast playback attempt, loader handling, and fallback behavior.
- `ui/NewFastSettingsCard.ts`
  - Settings card for selecting `Classic Download` or `New Fast Listen`.

## Backend command
Rust command: `resolve_fast_listen_stream`
- Input: `query` and optional `video_id`
- Uses `yt-dlp --get-url --format bestaudio`
- Returns first direct stream URL

## Extending with new sources
1. Create a new provider file under `providers/`.
2. Implement `FastListenProvider`.
3. Register it in `NewFastProviderRegistry.ts`.
4. Switch provider selection in `NewFastPlaybackService.ts` or expose selection in settings.

## Plugin readiness
This module is plugin-friendly:
- Provider registry decouples source-specific logic.
- UI and playback orchestration are separated.
- Existing playback path remains intact as fallback.

## Platform notes
- Rust command uses existing cross-platform command helper (`no_window_command`).
- Works on Windows and Linux as long as `yt-dlp` dependency is available.
- Frontend controls use touch-safe select sizing through CSS class rules.

## Known hacks
No hacks are currently required in this module.
