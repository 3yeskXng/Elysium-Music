// src-tauri/src/commands/deps/download.rs
// Cross-platform file download and extraction
// Uses curl on all platforms (ships with Windows 10+ and all Linux)
// Hides all console windows on Windows via CREATE_NO_WINDOW

use std::path::Path;
use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;

fn curl_bin() -> &'static str {
    if cfg!(target_os = "windows") { "curl.exe" } else { "curl" }
}

/// Download a file via curl. Silent, no visible windows.
pub fn download_file(url: &str, dest: &str) -> Result<(), String> {
    let output = Command::new(curl_bin())
        .args(["-L", "-o", dest, url, "--silent", "--fail", "--show-error", "--progress-bar"])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| format!("curl not found. Install curl: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Download failed: {}", stderr.trim()));
    }
    Ok(())
}

/// Extract a zip on Windows using PowerShell (hidden window).
pub fn extract_zip(zip_path: &str, dest_dir: &str) -> Result<(), String> {
    let ps_script = format!(
        "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; \
         Expand-Archive -Path '{}' -DestinationPath '{}' -Force",
        zip_path, dest_dir
    );
    let output = Command::new("powershell.exe")
        .args(["-NoProfile", "-NonInteractive", "-Command", &ps_script])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| format!("PowerShell extract failed: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Extract failed: {}", stderr.trim()));
    }
    Ok(())
}

/// Extract a tar.xz on Linux (and Windows tar if available).
pub fn extract_tar_xz(tar_path: &str, dest_dir: &str) -> Result<(), String> {
    let output = Command::new("tar")
        .args(["-xf", tar_path, "-C", dest_dir, "--strip-components=1"])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| format!("tar extract failed: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Extract failed: {}", stderr.trim()));
    }
    Ok(())
}

/// Recursively find ffmpeg/ffprobe binaries in extracted subdirectories
/// and copy them to the tools root directory.
pub fn collect_binaries(dest_dir: &str) -> Result<Vec<String>, String> {
    let mut installed = Vec::new();
    let ffmpeg_name = if cfg!(target_os = "windows") { "ffmpeg.exe" } else { "ffmpeg" };
    let ffprobe_name = if cfg!(target_os = "windows") { "ffprobe.exe" } else { "ffprobe" };

    let dest = Path::new(dest_dir);

    // If binaries already exist at dest root, nothing to do
    if dest.join(ffmpeg_name).exists() && dest.join(ffprobe_name).exists() {
        installed.push(ffmpeg_name.to_string());
        installed.push(ffprobe_name.to_string());
        return Ok(installed);
    }

    // Walk subdirectories to find bin/ folders (handles nested extraction)
    if let Ok(entries) = std::fs::read_dir(dest) {
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }

            // Try direct bin/ subfolder
            let bin_dir = path.join("bin");
            if bin_dir.exists() {
                copy_if_missing(&bin_dir, dest, ffmpeg_name, &mut installed);
                copy_if_missing(&bin_dir, dest, ffprobe_name, &mut installed);
                if !installed.is_empty() {
                    return Ok(installed);
                }
            }

            // Try one more level deep (some archives nest deeper)
            if let Ok(sub_entries) = std::fs::read_dir(&path) {
                for sub in sub_entries.flatten() {
                    let sub_bin = sub.path().join("bin");
                    if sub_bin.exists() {
                        copy_if_missing(&sub_bin, dest, ffmpeg_name, &mut installed);
                        copy_if_missing(&sub_bin, dest, ffprobe_name, &mut installed);
                        if !installed.is_empty() {
                            return Ok(installed);
                        }
                    }
                }
            }
        }
    }

    if installed.is_empty() {
        Err("Could not find ffmpeg/ffprobe binaries in extracted archive".to_string())
    } else {
        Ok(installed)
    }
}

fn copy_if_missing(src_dir: &Path, dest_dir: &Path, name: &str, out: &mut Vec<String>) {
    let src = src_dir.join(name);
    let dst = dest_dir.join(name);
    if src.exists() && !dst.exists() {
        let _ = std::fs::copy(&src, &dst);
        make_executable(&dst.to_string_lossy());
        out.push(name.to_string());
    }
}

pub fn make_executable(path: &str) {
    if !cfg!(target_os = "windows") {
        let _ = Command::new("chmod").args(["+x", path]).output();
    }
}
