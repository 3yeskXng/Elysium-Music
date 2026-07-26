// src-tauri/src/commands/dependency_manager.rs
// Cross-platform dependency checker and installer for yt-dlp and ffmpeg

use std::fs;
use std::process::Command;

fn find_in_path(tool: &str) -> Option<String> {
    let which_cmd = if cfg!(target_os = "windows") { "where" } else { "which" };
    if let Ok(o) = Command::new(which_cmd).arg(tool).output() {
        if o.status.success() {
            let stdout = String::from_utf8_lossy(&o.stdout);
            let first_line = stdout.lines().next().unwrap_or("").trim();
            if !first_line.is_empty() {
                return Some(first_line.to_string());
            }
        }
    }
    None
}

fn find_in_local_tools(tool: &str) -> Option<String> {
    let local = if cfg!(target_os = "windows") {
        format!("tools\\{}.exe", tool)
    } else {
        format!("tools/{}", tool)
    };
    if std::path::Path::new(&local).exists() {
        Some(local)
    } else {
        None
    }
}

fn find_tool(tool: &str) -> Option<String> {
    find_in_path(tool).or_else(|| find_in_local_tools(tool))
}

#[derive(serde::Serialize)]
pub struct DependencyStatus {
    pub ytdlp: bool,
    pub ffmpeg: bool,
    pub ffprobe: bool,
}

#[tauri::command]
pub async fn check_yt_dlp() -> Result<bool, String> {
    Ok(find_tool("yt-dlp").is_some())
}

#[tauri::command]
pub async fn check_ffmpeg() -> Result<bool, String> {
    Ok(find_tool("ffmpeg").is_some() && find_tool("ffprobe").is_some())
}

#[tauri::command]
pub async fn check_all_dependencies() -> Result<DependencyStatus, String> {
    Ok(DependencyStatus {
        ytdlp: find_tool("yt-dlp").is_some(),
        ffmpeg: find_tool("ffmpeg").is_some(),
        ffprobe: find_tool("ffprobe").is_some(),
    })
}

#[tauri::command]
pub async fn install_yt_dlp() -> Result<String, String> {
    let tools_dir = "tools";
    fs::create_dir_all(tools_dir).map_err(|e| format!("Create tools dir failed: {}", e))?;

    let (url, filename) = if cfg!(target_os = "windows") {
        (
            "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe",
            "tools/yt-dlp.exe",
        )
    } else {
        (
            "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp",
            "tools/yt-dlp",
        )
    };

    let output = if cfg!(target_os = "windows") {
        let ps_script = format!("Invoke-WebRequest -Uri '{}' -OutFile '{}'", url, filename);
        Command::new("powershell")
            .args(["-Command", &ps_script])
            .output()
    } else {
        Command::new("curl")
            .args(["-L", "-o", filename, url, "--silent", "--show-error"])
            .output()
    };

    let result = output.map_err(|e| format!("Download command failed: {}", e))?;
    if !result.status.success() {
        let stderr = String::from_utf8_lossy(&result.stderr);
        return Err(format!("Download failed: {}", stderr.trim()));
    }

    if !cfg!(target_os = "windows") {
        let _ = Command::new("chmod").args(["+x", filename]).output();
    }

    Ok(filename.to_string())
}
