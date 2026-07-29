// src-tauri/src/discord/commands.rs
// Tauri IPC commands for Discord Rich Presence control

use std::sync::Mutex;
use tauri::State;
use crate::discord::client::DiscordClient;

pub struct DiscordState(pub Mutex<DiscordClient>);

#[tauri::command]
pub fn discord_connect(state: State<'_, DiscordState>) -> Result<String, String> {
    let mut client = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    client.connect()?;
    Ok("connected".to_string())
}

#[tauri::command]
pub fn discord_disconnect(state: State<'_, DiscordState>) -> Result<String, String> {
    let mut client = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    client.disconnect()?;
    Ok("disconnected".to_string())
}

#[tauri::command]
pub fn discord_update_presence(
    state: State<'_, DiscordState>,
    track_title: String,
    track_artist: String,
    is_playing: bool,
    start_time: u64,
) -> Result<String, String> {
    let mut client = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    if !client.is_connected() {
        return Err("Discord client is not connected".to_string());
    }
    if is_playing {
        client.update_playing(&track_title, &track_artist, start_time)?;
    } else {
        client.update_paused(&track_title, &track_artist)?;
    }
    Ok("updated".to_string())
}

#[tauri::command]
pub fn discord_set_idle(state: State<'_, DiscordState>) -> Result<String, String> {
    let mut client = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    if client.is_connected() {
        client.set_idle()?;
    }
    Ok("idle".to_string())
}

#[tauri::command]
pub fn discord_get_status(state: State<'_, DiscordState>) -> Result<bool, String> {
    let client = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(client.is_connected())
}
