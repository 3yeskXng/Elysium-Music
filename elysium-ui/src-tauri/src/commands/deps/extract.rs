// src-tauri/src/commands/deps/extract.rs
// Cross-platform archive extraction and binary collection utilities
// Handles: zip (Windows via PowerShell), tar.xz (Linux/macOS), recursive binary discovery

use std::path::Path;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;

/// Extract a zip archive on Windows using PowerShell Expand-Archive (hidden window).
pub fn extract_zip(zip_path: &str, dest_dir: &str) -> Result<(), String> {
    let ps_script = format!(
        "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; \
         Expand-Archive -Path '{}' -DestinationPath '{}' -Force",
        zip_path, dest_dir
    );
    let output = std::process::Command::new("powershell.exe")
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

/// Extract a tar.xz archive on Linux/macOS using system tar.
/// Uses --strip-components=1 to remove the top-level directory from the archive.
pub fn extract_tar_xz(tar_path: &str, dest_dir: &str) -> Result<(), String> {
    let output = std::process::Command::new("tar")
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
    let ffmpeg_name = ffmpeg_bin_name();
    let ffprobe_name = ffprobe_bin_name();
    let dest = Path::new(dest_dir);

    if dest.join(ffmpeg_name).exists() && dest.join(ffprobe_name).exists() {
        installed.push(ffmpeg_name.to_string());
        installed.push(ffprobe_name.to_string());
        return Ok(installed);
    }

    if let Ok(entries) = std::fs::read_dir(dest) {
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }

            let bin_dir = path.join("bin");
            if bin_dir.exists() {
                copy_if_missing(&bin_dir, dest, ffmpeg_name, &mut installed);
                copy_if_missing(&bin_dir, dest, ffprobe_name, &mut installed);
                if !installed.is_empty() {
                    return Ok(installed);
                }
            }

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
        crate::commands::deps::discovery::make_executable(&dst.to_string_lossy());
        out.push(name.to_string());
    }
}

pub fn ffmpeg_bin_name() -> &'static str {
    if cfg!(target_os = "windows") {
        "ffmpeg.exe"
    } else {
        "ffmpeg"
    }
}

pub fn ffprobe_bin_name() -> &'static str {
    if cfg!(target_os = "windows") {
        "ffprobe.exe"
    } else {
        "ffprobe"
    }
}
