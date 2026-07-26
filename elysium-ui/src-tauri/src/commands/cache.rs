// src-tauri/src/commands/cache.rs
// Persistent audio cache — stores playlist audio files with 1.5GB eviction limit

use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use std::time::SystemTime;

const AUDIO_EXTENSIONS: &[&str] = &["opus", "mp3", "webm", "weba"];

fn cache_dir() -> PathBuf {
    let base = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
    base.join("elysium-music").join("audio_cache")
}

fn ensure_dir() -> Result<(), String> {
    let dir = cache_dir();
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| format!("Failed to create cache dir: {}", e))?;
    }
    Ok(())
}

#[derive(Serialize)]
pub struct CacheEntry {
    pub path: String,
    pub size: u64,
    pub modified: u64,
}

#[tauri::command]
pub async fn cache_store_file(track_id: String, source_path: String) -> Result<String, String> {
    ensure_dir()?;
    let dir = cache_dir();
    let target = dir.join(format!("{}.{}", track_id, source_path.split('.').last().unwrap_or("opus")));

    fs::copy(&source_path, &target).map_err(|e| format!("Cache copy failed: {}", e))?;
    Ok(target.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn cache_get_file(track_id: String) -> Result<Option<String>, String> {
    ensure_dir()?;
    let dir = cache_dir();

    for ext in AUDIO_EXTENSIONS {
        let candidate = dir.join(format!("{}.{}", track_id, ext));
        if candidate.exists() {
            return Ok(Some(candidate.to_string_lossy().to_string()));
        }
    }

    Ok(None)
}

#[tauri::command]
pub async fn cache_get_size() -> Result<u64, String> {
    ensure_dir()?;
    let dir = cache_dir();
    let mut total: u64 = 0;

    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            if let Ok(meta) = entry.metadata() {
                total += meta.len();
            }
        }
    }

    Ok(total)
}

#[tauri::command]
pub async fn cache_evict(target_bytes: u64) -> Result<(), String> {
    ensure_dir()?;
    let dir = cache_dir();

    let mut entries: Vec<(PathBuf, u64, SystemTime)> = Vec::new();
    if let Ok(read) = fs::read_dir(&dir) {
        for entry in read.flatten() {
            if let Ok(meta) = entry.metadata() {
                let modified = meta.modified().unwrap_or(SystemTime::UNIX_EPOCH);
                entries.push((entry.path(), meta.len(), modified));
            }
        }
    }

    entries.sort_by_key(|(_, _, modified)| *modified);

    let mut current_size: u64 = entries.iter().map(|(_, s, _)| s).sum();
    for (path, size, _) in &entries {
        if current_size <= target_bytes {
            break;
        }
        let _ = fs::remove_file(path);
        current_size -= size;
    }

    Ok(())
}
