// src-tauri/src/deps/mod.rs
// Dependency auto-download system — isolated module for checking, downloading, and updating
// external tools (yt-dlp, ffmpeg, ffprobe) without system package managers.

pub mod checker;
pub mod config;
pub mod downloader;
pub mod extract;
pub mod logger;
pub mod paths;
pub mod updater;

pub use config::{
    detect_platform, find_tool_definition, get_deps_directory,
    ArchiveType, Platform, ToolDefinition,
};
pub use logger::LogEventPayload;

pub async fn ensure_all_tools() {
    logger::info("Checking dependencies...");
    paths::ensure_dirs().unwrap_or_else(|e| logger::error(&e));

    let missing = checker::missing_tools();
    if missing.is_empty() {
        logger::info("All dependencies are present");
        updater::check_and_update_all().await;
        logger::info("Startup tasks complete");
        return;
    }

    logger::info(&format!(
        "{} missing tool(s), starting download...",
        missing.len()
    ));

    for tool in &missing {
        match downloader::download_and_install(tool).await {
            Ok(msg) => logger::info(&msg),
            Err(e) => logger::error(&format!("Install {} failed: {}", tool.name, e)),
        }
    }

    logger::info("Checking for updates...");
    updater::check_and_update_all().await;
    logger::info("Startup tasks complete");
}
