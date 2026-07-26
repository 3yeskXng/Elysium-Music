// src-tauri/src/commands/deps/yt_dlp.rs
// yt-dlp dependency management: check, install, update
// Downloads the official yt-dlp binary from GitHub releases

use super::discovery::{find_tool, tools_dir, verify_file};
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

/// Check if yt-dlp is available in PATH or local tools/ directory.
pub fn check() -> bool {
    println!("[Deps:YtDlp] Checking availability...");
    let found = find_tool("yt-dlp").is_some();
    println!("[Deps:YtDlp] Check result: {}", if found { "FOUND" } else { "NOT FOUND" });
    found
}

/// Install yt-dlp from GitHub releases with retry logic.
/// Downloads the latest binary to the tools/ directory.
pub fn install(app: &AppHandle) -> Result<String, String> {
    println!("[Deps:YtDlp] === Starting installation ===");
    let dir = tools_dir()?;
    let (url, filename) = if cfg!(target_os = "windows") {
        (YTDLP_URL_WINDOWS, format!("{}\\yt-dlp.exe", dir))
    } else {
        (YTDLP_URL_LINUX, format!("{}/yt-dlp", dir))
    };

    println!("[Deps:YtDlp] Target directory: {}", dir);
    println!("[Deps:YtDlp] Target filename: {}", filename);

    if Path::new(&filename).exists() {
        if verify_file(&filename) {
            let msg = "yt-dlp already installed and verified";
            println!("[Deps:YtDlp] {}", msg);
            emit_progress(app, "yt-dlp", "skip", msg);
            return Ok(filename);
        }
        println!("[Deps:YtDlp] Existing file is invalid, re-downloading...");
    }

    let msg = "Downloading yt-dlp from GitHub...";
    println!("[Deps:YtDlp] {}", msg);
    emit_progress(app, "yt-dlp", "download", msg);

    download_file_with_retry(url, None, &filename, app, "yt-dlp")?;
    make_executable(&filename);

    if !verify_file(&filename) {
        return Err("yt-dlp download succeeded but file verification failed".to_string());
    }

    let msg = "yt-dlp installed and verified successfully";
    println!("[Deps:YtDlp] === {} ===", msg);
    emit_progress(app, "yt-dlp", "done", msg);
    Ok(filename)
}

/// Update yt-dlp by running yt-dlp -U (self-update mechanism).
pub fn update(app: &AppHandle) -> Result<String, String> {
    println!("[Deps:YtDlp] === Starting update ===");
    let yt_dlp = find_tool("yt-dlp").ok_or_else(|| {
        let msg = "yt-dlp not found for update".to_string();
        println!("[Deps:YtDlp] ERROR: {}", msg);
        msg
    })?;

    println!("[Deps:YtDlp] Found yt-dlp at: {}", yt_dlp);
    let msg = "Running yt-dlp -U...";
    println!("[Deps:YtDlp] {}", msg);
    emit_progress(app, "yt-dlp", "update", msg);

    let output = Command::new(&yt_dlp)
        .args(["-U"])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| {
            let msg = format!("Failed to run yt-dlp -U: {}", e);
            println!("[Deps:YtDlp] ERROR: {}", msg);
            msg
        })?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let combined = format!("{}{}", stdout, stderr);

    println!("[Deps:YtDlp] yt-dlp -U stdout: {}", stdout.trim());
    println!("[Deps:YtDlp] yt-dlp -U stderr: {}", stderr.trim());
    println!("[Deps:YtDlp] Exit code: {}", output.status.code().unwrap_or(-1));

    if output.status.success()
        || combined.contains("up to date")
        || combined.contains("Updated")
    {
        let msg = combined.trim().to_string();
        println!("[Deps:YtDlp] === Update complete: {} ===", msg);
        emit_progress(app, "yt-dlp", "done", &msg);
        Ok(msg)
    } else {
        let msg = format!("yt-dlp update failed: {}", combined.trim());
        println!("[Deps:YtDlp] ERROR: {}", msg);
        Err(msg)
    }
}
