// src-tauri/src/lyrics/storage.rs
// Cross-platform persistent storage for custom user lyrics via Tauri v2 path APIs

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::{Mutex, OnceLock};
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Default, Clone)]
pub struct LyricsStore {
    pub tracks: HashMap<String, String>,
}

fn global_store() -> &'static Mutex<LyricsStore> {
    static INSTANCE: OnceLock<Mutex<LyricsStore>> = OnceLock::new();
    INSTANCE.get_or_init(|| Mutex::new(LyricsStore::default()))
}

fn lyrics_file_path(app_handle: &tauri::AppHandle) -> PathBuf {
    let data_dir = app_handle
        .path()
        .app_data_dir()
        .expect("Failed to resolve app data dir");
    fs::create_dir_all(&data_dir).ok();
    data_dir.join("lyrics.json")
}

fn load_from_disk(app_handle: &tauri::AppHandle) -> LyricsStore {
    let path = lyrics_file_path(app_handle);
    if !path.exists() {
        return LyricsStore::default();
    }
    fs::read_to_string(&path)
        .ok()
        .and_then(|content| serde_json::from_str(&content).ok())
        .unwrap_or_default()
}

pub fn read_custom_for_track(app_handle: &tauri::AppHandle, track_id: &str) -> Option<String> {
    let store = global_store().lock().unwrap();
    if store.tracks.contains_key(track_id) {
        return store.tracks.get(track_id).cloned();
    }
    drop(store);
    let disk_store = load_from_disk(app_handle);
    disk_store.tracks.get(track_id).cloned()
}

pub fn write_custom_for_track(
    app_handle: &tauri::AppHandle,
    track_id: &str,
    lyrics: &str,
) -> Result<(), String> {
    let mut store = load_from_disk(app_handle);
    store.tracks.insert(track_id.to_string(), lyrics.to_string());
    let path = lyrics_file_path(app_handle);
    let json = serde_json::to_string_pretty(&store)
        .map_err(|e| format!("Failed to serialize lyrics: {}", e))?;
    fs::write(&path, json).map_err(|e| format!("Failed to write lyrics file: {}", e))?;
    let mut global = global_store().lock().unwrap();
    *global = store;
    Ok(())
}
