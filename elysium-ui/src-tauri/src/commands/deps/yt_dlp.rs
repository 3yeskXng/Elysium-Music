// src-tauri/src/commands/deps/yt_dlp.rs
// yt-dlp dependency management: check, install, update
// Uses official GitHub releases with retry logic (3 attempts with exponential backoff)

use super::discovery::{find_tool, tools_dir};
use super::download::{download_file_with_retry, make_executable};
use super::progress::emit_progress;
use std::path::Path;
use std::process::Command;
use tauri::AppHandle;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;

const YTDLP_URL_WINDOWS: &str =
    "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe";
const YTDLP_URL_LINUX: &str =
    "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";
const YTDLP_URL_WINDOWS_FALLBACK: &str =
    "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe";

/// Check if yt-dlp is available in PATH or local tools/ directory.
pub fn check() -> bool {
    find_tool("yt-dlp").is_some()
}

/// Install yt-dlp from GitHub releases with retry logic.
/// Downloads the latest binary to the tools/ directory.
pub fn install(app: &AppHandle) -> Result<String, String> {
    let dir = tools_dir()?;
    let (url, fallback_url, filename) = if cfg!(target_os = "windows") {
        (
            YTDLP_URL_WINDOWS,
            YTDLP_URL_WINDOWS_FALLBACK,
            format!("{}\\yt-dlp.exe", dir),
        )
    } else {
        (
            YTDLP_URL_LINUX,
            YTDLP_URL_LINUX,
            format!("{}/yt-dlp", dir),
        )
    };

    if Path::new(&filename).exists() {
        emit_progress(app, "yt-dlp", "skip", "yt-dlp already installed");
        return Ok(filename);
    }

    emit_progress(app, "yt-dlp", "download", "Downloading yt-dlp from GitHub...");
    download_file_with_retry(url, Some(fallback_url), &filename, app, "yt-dlp")?;
    make_executable(&filename);
    emit_progress(app, "yt-dlp", "done", "yt-dlp installed successfully");
    Ok(filename)
}

/// Update yt-dlp by running yt-dlp -U (self-update mechanism).
pub fn update(app: &AppHandle) -> Result<String, String> {
    let yt_dlp = find_tool("yt-dlp").ok_or("yt-dlp not found")?;
    emit_progress(app, "yt-dlp", "update", "Running yt-dlp -U...");

    let output = Command::new(&yt_dlp)
        .args(["-U"])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| format!("Failed to run yt-dlp -U: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let combined = format!("{}{}", stdout, stderr);

    if output.status.success()
        || combined.contains("up to date")
        || combined.contains("Updated")
    {
        emit_progress(app, "yt-dlp", "done", combined.trim());
        Ok(combined.trim().to_string())
    } else {
        Err(combined.trim().to_string())
    }
}
