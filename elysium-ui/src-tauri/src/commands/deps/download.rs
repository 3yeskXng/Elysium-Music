// src-tauri/src/commands/deps/download.rs
// Cross-platform file download using curl (available on Windows 10+ and all Linux)

use std::process::Command;

pub fn download_file(url: &str, dest: &str) -> Result<(), String> {
    let curl = if cfg!(target_os = "windows") {
        "curl.exe"
    } else {
        "curl"
    };

    let output = Command::new(curl)
        .args(["-L", "-o", dest, url, "--silent", "--fail", "--show-error"])
        .output()
        .map_err(|e| format!("curl not found. Please install curl: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Download failed: {}", stderr.trim()));
    }
    Ok(())
}

pub fn extract_zip_windows(zip_path: &str, dest_dir: &str) -> Result<(), String> {
    let ps_script = format!(
        "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Expand-Archive -Path '{}' -DestinationPath '{}' -Force",
        zip_path, dest_dir
    );
    let output = Command::new("powershell")
        .args(["-NoProfile", "-Command", &ps_script])
        .output()
        .map_err(|e| format!("PowerShell extract failed: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Extract failed: {}", stderr.trim()));
    }
    Ok(())
}

pub fn extract_tar_linux(tar_path: &str, dest_dir: &str) -> Result<(), String> {
    let output = Command::new("tar")
        .args(["-xf", tar_path, "-C", dest_dir, "--strip-components=1"])
        .output()
        .map_err(|e| format!("tar extract failed: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Extract failed: {}", stderr.trim()));
    }
    Ok(())
}

pub fn move_binaries_from_subdir(dest_dir: &str) -> Result<(), String> {
    let ffmpeg_name = if cfg!(target_os = "windows") { "ffmpeg.exe" } else { "ffmpeg" };
    let ffprobe_name = if cfg!(target_os = "windows") { "ffprobe.exe" } else { "ffprobe" };

    if let Ok(entries) = std::fs::read_dir(dest_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let bin_dir = path.join("bin");
                let src_ffmpeg = bin_dir.join(ffmpeg_name);
                let src_ffprobe = bin_dir.join(ffprobe_name);

                if src_ffmpeg.exists() {
                    let _ = std::fs::copy(&src_ffmpeg, std::path::Path::new(dest_dir).join(ffmpeg_name));
                }
                if src_ffprobe.exists() {
                    let _ = std::fs::copy(&src_ffprobe, std::path::Path::new(dest_dir).join(ffprobe_name));
                }
            }
        }
    }
    Ok(())
}
