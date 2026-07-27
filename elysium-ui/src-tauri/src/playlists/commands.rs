// src-tauri/src/playlists/commands.rs
// Tauri IPC commands for the playlist system — CRUD operations exposed to the frontend

use super::storage::{self, Playlist, SongInfo};

#[tauri::command]
pub async fn get_playlists() -> Result<Vec<Playlist>, String> {
    println!("=== RUST IPC: get_playlists ===");
    storage::load_all()
}

#[tauri::command]
pub async fn create_playlist(name: String) -> Result<Playlist, String> {
    if name.trim().is_empty() {
        return Err("Playlist name cannot be empty".to_string());
    }
    storage::create(name)
}

#[tauri::command]
pub async fn delete_playlist(id: String) -> Result<(), String> {
    storage::delete(&id)
}

#[tauri::command]
pub async fn rename_playlist(id: String, name: String) -> Result<Playlist, String> {
    if name.trim().is_empty() {
        return Err("Playlist name cannot be empty".to_string());
    }
    storage::rename(&id, name)
}

#[tauri::command]
pub async fn add_song_to_playlist(
    playlist_id: String,
    id: String,
    title: String,
    artist: String,
    duration: String,
    duration_secs: u32,
    file_path: String,
) -> Result<Playlist, String> {
    let song = SongInfo {
        id,
        title,
        artist,
        duration,
        duration_secs,
        file_path,
    };
    storage::add_song(&playlist_id, song)
}

#[tauri::command]
pub async fn remove_song_from_playlist(
    playlist_id: String,
    song_id: String,
) -> Result<Playlist, String> {
    storage::remove_song(&playlist_id, &song_id)
}
