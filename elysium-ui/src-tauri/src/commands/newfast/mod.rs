// src-tauri/src/commands/newfast/mod.rs
// New Fast Listen command — resolves direct audio stream URLs via yt-dlp for near-instant playback.

use crate::deps::checker::find_on_path as find_tool;
use crate::deps::process::no_window_command;
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct FastListenStreamPayload {
    pub stream_url: String,
    pub provider: String,
}

#[tauri::command]
pub async fn resolve_fast_listen_stream(
    query: String,
    video_id: Option<String>,
) -> Result<FastListenStreamPayload, String> {
    let yt_dlp = find_tool("yt-dlp")
        .ok_or("yt-dlp not found. Install it via Settings -> Dependencies.")?;

    let target = build_target(&query, video_id.as_deref());
    let output = no_window_command(&yt_dlp)
        .args([
            "--get-url",
            "--format",
            "bestaudio",
            "--no-playlist",
            "--no-warnings",
            &target,
        ])
        .output()
        .map_err(|e| format!("Failed to run yt-dlp fast listen: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!(
            "yt-dlp fast listen error (exit {}): {}",
            output.status.code().unwrap_or(0),
            stderr.trim()
        ));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stream_url = stdout
        .lines()
        .find(|line| !line.trim().is_empty())
        .map(|line| line.trim().to_string())
        .ok_or("No stream URL received from yt-dlp.")?;

    Ok(FastListenStreamPayload {
        stream_url,
        provider: "yt-dlp".to_string(),
    })
}

fn build_target(query: &str, video_id: Option<&str>) -> String {
    if let Some(id) = video_id {
        let trimmed = id.trim();
        if !trimmed.is_empty() {
            return format!("https://www.youtube.com/watch?v={}", trimmed);
        }
    }
    format!("ytsearch1:{}", query)
}
