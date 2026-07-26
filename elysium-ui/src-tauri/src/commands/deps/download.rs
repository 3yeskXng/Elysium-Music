// src-tauri/src/commands/deps/download.rs
// Cross-platform file download with retry, fallback URL, and file verification
// Uses curl on all platforms (ships with Windows 10+ and all Linux/macOS)

use super::discovery::verify_file;
use super::progress::emit_progress;
use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;
const MAX_RETRIES: u32 = 3;
const RETRY_DELAYS_MS: [u64; 3] = [2000, 4000, 8000];
const MIN_FILE_SIZE_BYTES: u64 = 1024;

fn curl_bin() -> &'static str {
    if cfg!(target_os = "windows") {
        "curl.exe"
    } else {
        "curl"
    }
}

/// Download a file via curl. Silent, no visible windows on Windows.
/// Returns the file size in bytes on success.
fn download_file(url: &str, dest: &str) -> Result<u64, String> {
    println!("[Deps:Download] Starting curl download:");
    println!("[Deps:Download]   URL:  {}", url);
    println!("[Deps:Download]   Dest: {}", dest);

    let output = Command::new(curl_bin())
        .args([
            "-L",
            "-o",
            dest,
            url,
            "--silent",
            "--fail",
            "--show-error",
            "--progress-bar",
        ])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| {
            let msg = format!("curl not found. Install curl: {}", e);
            println!("[Deps:Download] FATAL: {}", msg);
            msg
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let msg = format!("curl failed (exit {}): {}", output.status.code().unwrap_or(-1), stderr.trim());
        println!("[Deps:Download] ERROR: {}", msg);
        return Err(msg);
    }

    if !verify_file(dest) {
        return Err(format!("Downloaded file is empty or missing: {}", dest));
    }

    let size = std::fs::metadata(dest).map(|m| m.len()).unwrap_or(0);
    if size < MIN_FILE_SIZE_BYTES {
        let msg = format!("Downloaded file too small ({} bytes): {}", size, dest);
        println!("[Deps:Download] ERROR: {}", msg);
        return Err(msg);
    }

    println!("[Deps:Download] Download complete: {} ({:.2} MB)", dest, size as f64 / (1024.0 * 1024.0));
    Ok(size)
}

/// Delete a partially downloaded file (cleanup on failure).
fn cleanup_partial(dest: &str) {
    if Path::new(dest).exists() {
        println!("[Deps:Download] Cleaning up partial file: {}", dest);
        let _ = std::fs::remove_file(dest);
    }
}

use std::path::Path;

/// Download a file with retry logic and optional fallback URL.
/// Tries the primary URL up to 3 times with exponential backoff.
/// If all attempts fail and a fallback URL is provided, tries the fallback.
/// Returns the file size in bytes on success.
pub fn download_file_with_retry(
    primary_url: &str,
    fallback_url: Option<&str>,
    dest: &str,
    app: &tauri::AppHandle,
    tool_name: &str,
) -> Result<(), String> {
    println!("[Deps:Download] === Download orchestration for '{}' ===", tool_name);
    println!("[Deps:Download] Primary URL: {}", primary_url);
    if let Some(fb) = fallback_url {
        println!("[Deps:Download] Fallback URL: {}", fb);
    }

    for attempt in 1..=MAX_RETRIES {
        let delay = RETRY_DELAYS_MS[(attempt - 1) as usize];
        let msg = format!(
            "Downloading {} from primary source (attempt {}/{})...",
            tool_name, attempt, MAX_RETRIES
        );
        println!("[Deps:Download] {}", msg);
        emit_progress(app, tool_name, "download", &msg);

        if attempt > 1 {
            println!("[Deps:Download] Waiting {}ms before retry...", delay);
            std::thread::sleep(std::time::Duration::from_millis(delay));
        }

        match download_file(primary_url, dest) {
            Ok(size) => {
                println!("[Deps:Download] SUCCESS: '{}' downloaded ({:.2} MB)", tool_name, size as f64 / (1024.0 * 1024.0));
                return Ok(());
            }
            Err(e) => {
                cleanup_partial(dest);
                let warn = format!(
                    "Attempt {}/{} failed: {}. {}",
                    attempt,
                    MAX_RETRIES,
                    e,
                    if attempt < MAX_RETRIES {
                        "Retrying..."
                    } else {
                        "Trying fallback..."
                    }
                );
                println!("[Deps:Download] {}", warn);
                emit_progress(app, tool_name, "download", &warn);
            }
        }
    }

    if let Some(fallback) = fallback_url {
        if fallback != primary_url {
            println!("[Deps:Download] All primary attempts failed, switching to fallback...");
            for attempt in 1..=MAX_RETRIES {
                let delay = RETRY_DELAYS_MS[(attempt - 1) as usize];
                let msg = format!(
                    "Trying fallback mirror (attempt {}/{})...",
                    attempt, MAX_RETRIES
                );
                println!("[Deps:Download] {}", msg);
                emit_progress(app, tool_name, "download", &msg);

                if attempt > 1 {
                    std::thread::sleep(std::time::Duration::from_millis(delay));
                }

                match download_file(fallback, dest) {
                    Ok(size) => {
                        println!("[Deps:Download] SUCCESS (fallback): '{}' downloaded ({:.2} MB)", tool_name, size as f64 / (1024.0 * 1024.0));
                        return Ok(());
                    }
                    Err(e) => {
                        cleanup_partial(dest);
                        let warn = format!(
                            "Fallback attempt {}/{} failed: {}",
                            attempt, MAX_RETRIES, e
                        );
                        println!("[Deps:Download] {}", warn);
                        emit_progress(app, tool_name, "download", &warn);
                    }
                }
            }
        }
    }

    let final_err = format!("All download attempts failed for {}", tool_name);
    println!("[Deps:Download] FATAL: {}", final_err);
    Err(final_err)
}

/// Set file as executable on Unix systems (chmod +x). No-op on Windows.
pub fn make_executable(path: &str) {
    if !cfg!(target_os = "windows") {
        println!("[Deps:Download] Setting executable: {}", path);
        let _ = Command::new("chmod")
            .args(["+x", path])
            .output();
    }
}
