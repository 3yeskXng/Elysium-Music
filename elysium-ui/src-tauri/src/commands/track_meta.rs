// src-tauri/src/commands/track_meta.rs
// Sidecar .meta file persistence — stores artist and source per audio track
// Falls back to parsing "Artist - Title" from filename when no .meta exists

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

const AUDIO_EXTENSIONS: &[&str] = &["opus", "mp3", "webm"];

#[derive(Serialize, Deserialize, Default, Clone)]
pub struct TrackMeta {
    pub artist: String,
    pub source: String,
}

pub fn save_meta(audio_path: &Path, meta: &TrackMeta) -> Result<(), String> {
    let ext = audio_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("opus");
    let meta_path = audio_path.with_extension(format!("{}.meta", ext));
    let json = serde_json::to_string(meta).map_err(|e| format!("Meta serialize: {}", e))?;
    fs::write(&meta_path, json).map_err(|e| format!("Meta write: {}", e))
}

pub fn load_meta(audio_path: &Path) -> TrackMeta {
    for ext in AUDIO_EXTENSIONS {
        let meta_path = audio_path.with_extension(format!("{}.meta", ext));
        if let Ok(content) = fs::read_to_string(&meta_path) {
            if let Ok(meta) = serde_json::from_str(&content) {
                return meta;
            }
        }
    }
    TrackMeta::default()
}

pub fn parse_artist_from_query(query: &str) -> String {
    if let Some(idx) = query.find(" - ") {
        let candidate = query[..idx].trim();
        if !candidate.is_empty() {
            return candidate.to_string();
        }
    }
    String::new()
}

pub fn resolve_artist(audio_path: &Path, stem: &str) -> String {
    let meta = load_meta(audio_path);
    if !meta.artist.is_empty() {
        return meta.artist;
    }
    parse_artist_from_query(stem)
}
