// src-tauri/src/commands/deps/mod.rs
// Dependency management module — Tauri commands and re-exports
// Delegates all logic to manager.rs and platform-specific modules

pub mod manager;
pub mod platform;
pub mod progress;

use tauri::AppHandle;

#[derive(serde::Serialize)]
pub struct DependencyStatus {
    pub ytdlp: bool,
    pub ffmpeg: bool,
    pub ffprobe: bool,
}

pub fn find_tool_static(tool: &str) -> Option<String> {
    manager::find_tool_path(tool)
}

pub fn run_startup_tasks(app: &AppHandle) {
    manager::run_startup_ytdlp_update(app);
}

// ── Check commands ─────────────────────────────────────────────

#[tauri::command]
pub async fn check_yt_dlp() -> Result<bool, String> {
    Ok(manager::check("yt-dlp"))
}

#[tauri::command]
pub async fn check_ffmpeg() -> Result<bool, String> {
    Ok(manager::check("ffmpeg"))
}

#[tauri::command]
pub async fn check_ffprobe() -> Result<bool, String> {
    Ok(manager::check("ffprobe"))
}

#[tauri::command]
pub async fn check_all_dependencies() -> Result<DependencyStatus, String> {
    Ok(manager::check_all())
}

// ── Install commands ───────────────────────────────────────────

#[tauri::command]
pub async fn install_yt_dlp(app: AppHandle) -> Result<String, String> {
    tokio::task::spawn_blocking(move || manager::install("yt-dlp", &app))
        .await
        .map_err(|e| format!("Task failed: {}", e))?
}

#[tauri::command]
pub async fn install_ffmpeg(app: AppHandle) -> Result<String, String> {
    tokio::task::spawn_blocking(move || manager::install("ffmpeg", &app))
        .await
        .map_err(|e| format!("Task failed: {}", e))?
}

#[tauri::command]
pub async fn install_ffprobe(app: AppHandle) -> Result<String, String> {
    tokio::task::spawn_blocking(move || manager::install("ffprobe", &app))
        .await
        .map_err(|e| format!("Task failed: {}", e))?
}

// ── Update commands ────────────────────────────────────────────

#[tauri::command]
pub async fn update_yt_dlp(app: AppHandle) -> Result<String, String> {
    tokio::task::spawn_blocking(move || manager::update("yt-dlp", &app))
        .await
        .map_err(|e| format!("Task failed: {}", e))?
}

// ── Utility commands ───────────────────────────────────────────

#[tauri::command]
pub async fn restart_app(app: AppHandle) -> Result<(), String> {
    app.restart();
    #[allow(unreachable_code)]
    Ok(())
}
