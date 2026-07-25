// src-tauri/src/commands/download.rs
// YouTube audio download pipeline using yt-dlp + ffprobe metadata extraction

use crate::models::TrackPayload;
use std::path::Path;
use std::process::Command;

#[tauri::command]
pub async fn download_youtube(query: String) -> Result<TrackPayload, String> {
    let music_dir = std::path::Path::new("music");
    std::fs::create_dir_all(music_dir).map_err(|e| format!("Failed to create music dir: {}", e))?;

    // Execute yt-dlp: search YouTube, extract audio, convert to opus
    let output_template = music_dir.join("%(title)s.%(ext)s").to_string_lossy().to_string();
    let search_query = format!("ytsearch1:{}", query);

    let dl_result = Command::new("yt-dlp")
        .args([
            "-x", "--audio-format", "opus",
            "--no-playlist",
            "--print", "filename",
            "-o", &output_template,
            &search_query,
        ])
        .output()
        .map_err(|e| format!("yt-dlp not found or failed to execute: {}. Is yt-dlp installed and in PATH?", e))?;

    if !dl_result.status.success() {
        let stderr = String::from_utf8_lossy(&dl_result.stderr);
        return Err(format!("yt-dlp error (exit {}): {}", dl_result.status.code().unwrap_or(0), stderr.trim()));
    }

    // Parse the output filename from yt-dlp's --print filename
    let raw_output = String::from_utf8_lossy(&dl_result.stdout);
    let file_path_str = raw_output.trim().lines().last().unwrap_or("").to_string();

    if file_path_str.is_empty() || !Path::new(&file_path_str).exists() {
        return Err(format!("Download completed but output file not found at: {}", file_path_str));
    }

    // Extract metadata via ffprobe
    let (duration_str, secs) = probe_duration(&file_path_str);
    let title = Path::new(&file_path_str)
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| query.clone());

    Ok(TrackPayload {
        id: uuid::Uuid::new_v4().to_string(),
        title,
        artist: "YouTube Stream".to_string(),
        duration: duration_str,
        duration_secs: secs,
        duration_secs_snake: secs,
        file_path: file_path_str.clone(),
        filePath: file_path_str,
        album: "Elysium Archive".to_string(),
        cover_url_camel: String::new(),
        cover_url_snake: String::new(),
    })
}

/// Extract audio duration via ffprobe, returns (formatted_string, total_seconds)
fn probe_duration(path: &str) -> (String, u32) {
    let output = Command::new("ffprobe")
        .args(["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nocorrect=1", path])
        .output();

    if let Ok(out) = output {
        if out.status.success() {
            let raw = String::from_utf8_lossy(&out.stdout);
            if let Ok(secs_f) = raw.trim().parse::<f64>() {
                let secs = secs_f as u32;
                return (format!("{:02}:{:02}", secs / 60, secs % 60), secs);
            }
        }
    }
    ("00:00".to_string(), 0)
}
