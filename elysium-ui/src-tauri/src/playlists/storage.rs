// src-tauri/src/playlists/storage.rs
// JSON-file playlist persistence — reads/writes playlists from the user data directory
// Uses the `dirs` crate for cross-platform path resolution (Windows, Linux, macOS)

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SongInfo {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub duration: String,
    pub duration_secs: u32,
    pub file_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Playlist {
    pub id: String,
    pub name: String,
    pub songs: Vec<SongInfo>,
}

fn playlist_dir() -> PathBuf {
    let base = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
    base.join("elysium-music").join("playlists")
}

fn ensure_dir() -> Result<(), String> {
    let dir = playlist_dir();
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| format!("Failed to create playlist dir: {}", e))?;
    }
    Ok(())
}

pub fn load_all() -> Result<Vec<Playlist>, String> {
    ensure_dir()?;
    let dir = playlist_dir();
    let mut playlists = Vec::new();

    let entries = fs::read_dir(&dir).map_err(|e| format!("Failed to read playlist dir: {}", e))?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) == Some("json") {
            if let Ok(content) = fs::read_to_string(&path) {
                if let Ok(playlist) = serde_json::from_str::<Playlist>(&content) {
                    playlists.push(playlist);
                }
            }
        }
    }

    // FIX: Deterministische Sortierung nach Name (alphabetisch)
    playlists.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    Ok(playlists)
}

pub fn create(name: String) -> Result<Playlist, String> {
    ensure_dir()?;
    let playlist = Playlist {
        id: uuid::Uuid::new_v4().to_string(),
        name,
        songs: Vec::new(),
    };
    save(&playlist)?;
    Ok(playlist)
}

pub fn delete(id: &str) -> Result<(), String> {
    let path = playlist_dir().join(format!("{}.json", id));
    if path.exists() {
        fs::remove_file(&path).map_err(|e| format!("Failed to delete playlist: {}", e))?;
    }
    Ok(())
}

pub fn rename(id: &str, new_name: String) -> Result<Playlist, String> {
    let mut playlist = get_by_id(id)?;
    playlist.name = new_name;
    save(&playlist)?;
    Ok(playlist)
}

pub fn add_song(id: &str, song: SongInfo) -> Result<Playlist, String> {
    let mut playlist = get_by_id(id)?;
    let already_exists = playlist.songs.iter().any(|s| s.file_path == song.file_path);
    if !already_exists {
        playlist.songs.push(song);
        save(&playlist)?;
    }
    Ok(playlist)
}

pub fn remove_song(id: &str, song_id: &str) -> Result<Playlist, String> {
    let mut playlist = get_by_id(id)?;
    playlist.songs.retain(|s| s.id != song_id);
    save(&playlist)?;
    Ok(playlist)
}

pub fn get_by_id(id: &str) -> Result<Playlist, String> {
    let path = playlist_dir().join(format!("{}.json", id));
    let content = fs::read_to_string(&path)
        .map_err(|_| format!("Playlist '{}' not found", id))?;
    serde_json::from_str(&content).map_err(|e| format!("Invalid playlist data: {}", e))
}

fn save(playlist: &Playlist) -> Result<(), String> {
    ensure_dir()?;
    let path = playlist_dir().join(format!("{}.json", playlist.id));
    let json =
        serde_json::to_string_pretty(playlist).map_err(|e| format!("Serialize error: {}", e))?;
    fs::write(&path, json).map_err(|e| format!("Failed to write playlist: {}", e))
}
