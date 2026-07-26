// src-tauri/src/commands/download/mod.rs
// YouTube download orchestrator: provider -> file discovery -> metadata -> payload

pub mod file_utils;
pub mod metadata;
pub mod provider;

use crate::commands::download::file_utils::{find_output, sanitize, unique_path};
use crate::commands::download::metadata::probe;
use crate::commands::download::provider::{DownloadProvider, YtDlpProvider};
use crate::commands::track_meta::{parse_artist_from_query, save_meta, TrackMeta};
use crate::models::TrackPayload;
use std::fs;
use std::path::PathBuf;

#[tauri::command]
pub async fn download_youtube(query: String) -> Result<TrackPayload, String> {
    let music_dir = PathBuf::from("music");
    fs::create_dir_all(&music_dir).map_err(|e| format!("Failed to create music dir: {}", e))?;

    let provider = YtDlpProvider;
    let result = provider.download(&query, &music_dir)?;

    let raw_path = find_output(&music_dir, &result.safe_stem)?;
    let (dur, secs) = probe(raw_path.to_str().unwrap_or(""));

    let title_clean = sanitize(&result.title);
    let final_path = music_dir.join(format!("{}.opus", title_clean));
    let resolved = if raw_path != final_path {
        let p = unique_path(&final_path);
        fs::rename(&raw_path, &p).map_err(|e| format!("Rename failed: {}", e))?;
        p
    } else {
        raw_path
    };

    let artist = parse_artist_from_query(&result.title);
    let meta = TrackMeta {
        artist: artist.clone(),
        source: "download".to_string(),
    };
    save_meta(&resolved, &meta)?;

    build_payload(&resolved, &title_clean, &artist, &dur, secs)
}

fn build_payload(
    path: &PathBuf,
    name: &str,
    artist: &str,
    dur: &str,
    secs: u32,
) -> Result<TrackPayload, String> {
    let p = path.to_string_lossy().to_string();
    Ok(TrackPayload {
        id: uuid::Uuid::new_v4().to_string(),
        title: name.to_string(),
        artist: artist.to_string(),
        duration: dur.to_string(),
        duration_secs: secs,
        duration_secs_snake: secs,
        file_path: p.clone(),
        filePath: p,
        album: String::new(),
        cover_url_camel: String::new(),
        cover_url_snake: String::new(),
    })
}
