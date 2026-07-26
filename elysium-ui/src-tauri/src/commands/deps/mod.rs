// src-tauri/src/commands/deps/mod.rs
// Dependency management module — re-exports all sub-modules and Tauri commands
// Each tool (yt-dlp, ffmpeg, ffprobe) has its own dedicated module

pub mod discovery;
pub mod download;
pub mod extract;
pub mod ffmpeg;
pub mod progress;
pub mod yt_dlp;

use discovery::find_tool;
use tauri::AppHandle;

/// Static tool lookup for use outside of async context (e.g. in setup).
pub fn find_tool_static(tool: &str) -> Option<String> {
    find_tool(tool)
}

#[derive(serde::Serialize)]
pub struct DependencyStatus {
    pub ytdlp: bool,
    pub ffmpeg: bool,
    pub ffprobe: bool,
}

// ── Check commands (fast, no I/O) ──────────────────────────────

#[tauri::command]
pub async fn check_yt_dlp() -> Result<bool, String> {
    Ok(yt_dlp::check())
}

#[tauri::command]
pub async fn check_ffmpeg() -> Result<bool, String> {
    Ok(ffmpeg::check_ffmpeg())
}

#[tauri::command]
pub async fn check_ffprobe() -> Result<bool, String> {
    Ok(ffmpeg::check_ffprobe())
}

#[tauri::command]
pub async fn check_all_dependencies() -> Result<DependencyStatus, String> {
    Ok(DependencyStatus {
        ytdlp: yt_dlp::check(),
        ffmpeg: ffmpeg::check_ffmpeg(),
        ffprobe: ffmpeg::check_ffprobe(),
    })
}

// ── Install / Update commands (blocking I/O via spawn_blocking) ─

#[tauri::command]
pub async fn install_yt_dlp(app: AppHandle) -> Result<String, String> {
    tokio::task::spawn_blocking(move || yt_dlp::install(&app))
        .await
        .map_err(|e| format!("Task failed: {}", e))?
}

#[tauri::command]
pub async fn update_yt_dlp(app: AppHandle) -> Result<String, String> {
    tokio::task::spawn_blocking(move || yt_dlp::update(&app))
        .await
        .map_err(|e| format!("Task failed: {}", e))?
}

#[tauri::command]
pub async fn install_ffmpeg(app: AppHandle) -> Result<String, String> {
    tokio::task::spawn_blocking(move || ffmpeg::install(&app))
        .await
        .map_err(|e| format!("Task failed: {}", e))?
}

#[tauri::command]
pub async fn install_ffprobe(app: AppHandle) -> Result<String, String> {
    tokio::task::spawn_blocking(move || ffmpeg::install(&app))
        .await
        .map_err(|e| format!("Task failed: {}", e))?
}

#[tauri::command]
pub async fn restart_app(app: AppHandle) -> Result<(), String> {
    app.restart();
    #[allow(unreachable_code)]
    Ok(())
}
