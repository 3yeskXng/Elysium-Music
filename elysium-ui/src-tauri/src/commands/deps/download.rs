// src-tauri/src/commands/deps/download.rs
// Cross-platform file download with retry and fallback URL support
// Uses curl on all platforms (ships with Windows 10+ and all Linux/macOS)

use super::progress::emit_progress;
use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;
const MAX_RETRIES: u32 = 3;
const RETRY_DELAYS_MS: [u64; 3] = [2000, 4000, 8000];

fn curl_bin() -> &'static str {
    if cfg!(target_os = "windows") {
        "curl.exe"
    } else {
        "curl"
    }
}

/// Download a file via curl. Silent, no visible windows on Windows.
fn download_file(url: &str, dest: &str) -> Result<(), String> {
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
        .map_err(|e| format!("curl not found. Install curl: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Download failed: {}", stderr.trim()));
    }
    Ok(())
}

/// Download a file with retry logic and optional fallback URL.
/// Tries the primary URL up to 3 times with exponential backoff.
/// If all attempts fail and a fallback URL is provided, tries the fallback.
pub fn download_file_with_retry(
    primary_url: &str,
    fallback_url: Option<&str>,
    dest: &str,
    app: &tauri::AppHandle,
    tool_name: &str,
) -> Result<(), String> {
    for attempt in 1..=MAX_RETRIES {
        let delay = RETRY_DELAYS_MS[(attempt - 1) as usize];
        let msg = format!(
            "Downloading {} from primary source (attempt {}/{})...",
            tool_name, attempt, MAX_RETRIES
        );
        emit_progress(app, tool_name, "download", &msg);

        if attempt > 1 {
            std::thread::sleep(std::time::Duration::from_millis(delay));
        }

        match download_file(primary_url, dest) {
            Ok(()) => return Ok(()),
            Err(e) => {
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
                emit_progress(app, tool_name, "download", &warn);
            }
        }
    }

    if let Some(fallback) = fallback_url {
        if fallback != primary_url {
            for attempt in 1..=MAX_RETRIES {
                let delay = RETRY_DELAYS_MS[(attempt - 1) as usize];
                let msg = format!(
                    "Trying fallback mirror (attempt {}/{})...",
                    attempt, MAX_RETRIES
                );
                emit_progress(app, tool_name, "download", &msg);

                if attempt > 1 {
                    std::thread::sleep(std::time::Duration::from_millis(delay));
                }

                match download_file(fallback, dest) {
                    Ok(()) => return Ok(()),
                    Err(e) => {
                        let warn = format!(
                            "Fallback attempt {}/{} failed: {}",
                            attempt, MAX_RETRIES, e
                        );
                        emit_progress(app, tool_name, "download", &warn);
                    }
                }
            }
        }
    }

    Err(format!(
        "All download attempts failed for {}",
        tool_name
    ))
}

/// Set file as executable on Unix systems (chmod +x). No-op on Windows.
pub fn make_executable(path: &str) {
    if !cfg!(target_os = "windows") {
        let _ = Command::new("chmod")
            .args(["+x", path])
            .output();
    }
}
