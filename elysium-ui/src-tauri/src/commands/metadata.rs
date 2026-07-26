// src-tauri/src/commands/metadata.rs
// YouTube metadata search — fetches video metadata without downloading
// Returns structured title, artist, duration, thumbnail for search results

use crate::deps::checker::find_on_path as find_tool;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoMetadata {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub duration_secs: u32,
    pub thumbnail: String,
}

#[derive(Deserialize)]
struct YtDlpJsonEntry {
    #[serde(default)]
    id: String,
    #[serde(default)]
    title: String,
    #[serde(default)]
    uploader: String,
    #[serde(default, rename = "duration")]
    duration_secs: Option<f64>,
    #[serde(default)]
    thumbnail: String,
}

#[tauri::command]
pub async fn search_youtube_metadata(query: String) -> Result<Vec<VideoMetadata>, String> {
    let yt_dlp = find_tool("yt-dlp")
        .ok_or("yt-dlp not found. Install it via Settings -> Dependencies.")?;

    let search = format!("ytsearch3:{}", query);
    let output = std::process::Command::new(&yt_dlp)
        .args(["--dump-json", "--no-download", "--no-playlist", &search])
        .output()
        .map_err(|e| format!("Failed to run yt-dlp: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("yt-dlp metadata error: {}", stderr.trim()));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut results = Vec::new();

    for line in stdout.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() { continue; }
        if let Ok(entry) = serde_json::from_str::<YtDlpJsonEntry>(trimmed) {
            let secs = entry.duration_secs.unwrap_or(0.0) as u32;
            results.push(VideoMetadata {
                id: entry.id,
                title: entry.title,
                artist: entry.uploader,
                duration_secs: secs,
                thumbnail: entry.thumbnail,
            });
        }
    }

    Ok(results)
}
