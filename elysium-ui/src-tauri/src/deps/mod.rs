// src-tauri/src/deps/mod.rs
// Dependency auto-download system — isolated module for checking, downloading, and updating
// external tools (yt-dlp, ffmpeg, ffprobe) without system package managers.

pub mod checker;
pub mod config;
pub mod downloader;
pub mod extract;
pub mod logger;
pub mod paths;
pub mod process;
pub mod progress;
pub mod updater;

use tauri::AppHandle;

pub use config::{
    detect_platform, find_tool_definition, get_deps_directory,
    ArchiveType, Platform, ToolDefinition,
};
pub use logger::LogEventPayload;

pub async fn init(app: AppHandle) {
    let log_dir = logger::get_log_directory();
    logger::init(log_dir, app.clone());
    logger::info("Elysium dependency system initialized");

    paths::ensure_dirs().unwrap_or_else(|e| logger::error(&e));
    checker::run_dependency_sync(&app).await;
}

// ── Tauri commands ─────────────────────────────────────────────

#[derive(serde::Serialize)]
pub struct DependencyStatus {
    pub ytdlp: bool,
    pub ffmpeg: bool,
    pub ffprobe: bool,
}

#[tauri::command]
pub async fn check_all_deps() -> Result<DependencyStatus, String> {
    let results = checker::check_all();
    let mut status = DependencyStatus {
        ytdlp: false,
        ffmpeg: false,
        ffprobe: false,
    };
    for (name, ok) in results {
        match name.as_str() {
            "yt-dlp" => status.ytdlp = ok,
            "ffmpeg" => status.ffmpeg = ok,
            "ffprobe" => status.ffprobe = ok,
            _ => {}
        }
    }
    Ok(status)
}

#[tauri::command]
pub async fn install_dep(app: AppHandle, name: String) -> Result<String, String> {
    let tool = config::find_tool_definition(&name)
        .ok_or_else(|| format!("Unknown tool: {}", name))?;
    downloader::download_and_install(&tool, &app).await
}

#[tauri::command]
pub async fn update_dep(app: AppHandle, name: String) -> Result<String, String> {
    let tool = config::find_tool_definition(&name)
        .ok_or_else(|| format!("Unknown tool: {}", name))?;
    updater::update_tool(&tool, &app).await
}

#[tauri::command]
pub async fn restart_app(app: AppHandle) -> Result<(), String> {
    app.restart();
    #[allow(unreachable_code)]
    Ok(())
}
