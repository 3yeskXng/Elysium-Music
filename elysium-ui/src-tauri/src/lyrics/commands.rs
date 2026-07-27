// src-tauri/src/lyrics/commands.rs
// IPC commands for lyrics: LRC file search, embedded tag extraction, custom lyrics CRUD

use std::fs;
use std::path::Path;

use crate::lyrics::storage;

#[tauri::command]
pub async fn read_lrc_file(file_path: String) -> Result<Option<String>, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Ok(None);
    }
    let content = fs::read_to_string(path)
        .map_err(|e| format!("Failed to read LRC file: {}", e))?;
    Ok(Some(content))
}

#[tauri::command]
pub async fn read_embedded_lyrics(file_path: String) -> Result<Option<String>, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Ok(None);
    }
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    match ext.as_str() {
        "mp3" => read_id3_uslt(path),
        "opus" | "ogg" | "oga" => read_vorbis_lyrics(path),
        "flac" => read_flac_lyrics(path),
        _ => Ok(None),
    }
}

#[tauri::command]
pub async fn read_custom_lyrics(
    app_handle: tauri::AppHandle,
    track_id: String,
) -> Result<Option<String>, String> {
    Ok(storage::read_custom_for_track(&app_handle, &track_id))
}

#[tauri::command]
pub async fn write_custom_lyrics(
    app_handle: tauri::AppHandle,
    track_id: String,
    lyrics: String,
) -> Result<(), String> {
    storage::write_custom_for_track(&app_handle, &track_id, &lyrics)
}

fn read_id3_uslt(path: &Path) -> Result<Option<String>, String> {
    use lofty::config::ParseOptions;
    use lofty::read_from_path;
    use lofty::tag::{Accessor, Tag, TaggedItem};

    let mut tagged_file = read_from_path(path)
        .map_err(|e| format!("Failed to parse MP3: {}", e))?;
    let tag = tagged_file
        .primary_tag()
        .or_else(|| tagged_file.first_tag())
        .ok_or_else(|| "No tag found in file".to_string())?;

    match tag.get_item(&lofty::item::ItemKey::Lyrics) {
        Some(item) => Ok(item.value().text().map(|s| s.to_string())),
        None => Ok(None),
    }
}

fn read_vorbis_lyrics(path: &Path) -> Result<Option<String>, String> {
    use lofty::config::ParseOptions;
    use lofty::read_from_path;
    use lofty::tag::{Accessor, Tag, TaggedItem};

    let mut tagged_file = read_from_path(path)
        .map_err(|e| format!("Failed to parse Opus/OGG: {}", e))?;
    let tag = tagged_file
        .primary_tag()
        .or_else(|| tagged_file.first_tag())
        .ok_or_else(|| "No tag found in file".to_string())?;

    match tag.get_item(&lofty::item::ItemKey::Lyrics) {
        Some(item) => Ok(item.value().text().map(|s| s.to_string())),
        None => Ok(None),
    }
}

fn read_flac_lyrics(path: &Path) -> Result<Option<String>, String> {
    use lofty::config::ParseOptions;
    use lofty::read_from_path;
    use lofty::tag::{Accessor, Tag, TaggedItem};

    let mut tagged_file = read_from_path(path)
        .map_err(|e| format!("Failed to parse FLAC: {}", e))?;
    let tag = tagged_file
        .primary_tag()
        .or_else(|| tagged_file.first_tag())
        .ok_or_else(|| "No tag found in file".to_string())?;

    match tag.get_item(&lofty::item::ItemKey::Lyrics) {
        Some(item) => Ok(item.value().text().map(|s| s.to_string())),
        None => Ok(None),
    }
}
