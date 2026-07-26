// src-tauri/src/commands/scanner.rs
// Local music directory scanner — reads audio files and sidecar .meta metadata

use crate::commands::deps::discovery::find_tool;
use crate::commands::track_meta::resolve_artist;
use crate::models::TrackPayload;
use std::fs;
use std::path::Path;
use std::process::Command;

fn strip_temp_prefix(name: &str) -> String {
    let mut result = name;
    if let Some(rest) = result.strip_prefix("__dl_") {
        result = rest;
    }
    if let Some(rest) = result.strip_prefix("Temp_") {
        result = rest;
    }
    result.to_string()
}

#[tauri::command]
pub async fn scan_local_library() -> Result<Vec<TrackPayload>, String> {
    let mut tracks = Vec::new();
    let music_dir = Path::new("music");

    if !music_dir.exists() {
        fs::create_dir_all(music_dir).map_err(|e| format!("Failed to create music dir: {}", e))?;
        return Ok(tracks);
    }

    let entries = fs::read_dir(music_dir).map_err(|e| format!("Failed to read music dir: {}", e))?;

    let ffprobe = find_tool("ffprobe");

    for entry in entries.flatten() {
        let path = entry.path();
        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();

        if ext != "opus" && ext != "mp3" && ext != "webm" {
            continue;
        }

        let raw_name = path.file_stem().and_then(|e| e.to_str()).unwrap_or("Unknown").to_string();
        let file_name = strip_temp_prefix(&raw_name);
        let path_str = path.to_string_lossy().to_string();
        let artist = resolve_artist(&path, &file_name);

        let mut duration_str = "00:00".to_string();
        let mut secs_u32 = 0u32;

        if let Some(ref ffprobe_path) = ffprobe {
            let meta_output = Command::new(ffprobe_path)
                .args(["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nocorrect=1", &path_str])
                .output();

            if let Ok(output) = meta_output {
                if output.status.success() {
                    let meta_str = String::from_utf8_lossy(&output.stdout);
                    if let Ok(secs_f64) = meta_str.trim().parse::<f64>() {
                        secs_u32 = secs_f64 as u32;
                        let minutes = secs_u32 / 60;
                        let seconds = secs_u32 % 60;
                        duration_str = format!("{:02}:{:02}", minutes, seconds);
                    }
                }
            }
        }

        tracks.push(TrackPayload {
            id: uuid::Uuid::new_v4().to_string(),
            title: file_name,
            artist,
            duration: duration_str,
            duration_secs: secs_u32,
            duration_secs_snake: secs_u32,
            file_path: path_str.clone(),
            filePath: path_str,
            album: String::new(),
            cover_url_camel: String::new(),
            cover_url_snake: String::new(),
        });
    }

    tracks.sort_by(|a, b| a.title.cmp(&b.title));
    Ok(tracks)
}
