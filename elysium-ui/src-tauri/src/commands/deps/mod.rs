// src-tauri/src/commands/deps/mod.rs
// Tauri commands — check, install, update yt-dlp / ffmpeg / ffprobe

pub mod discovery;
pub mod download;

use discovery::{find_tool, tools_dir, make_executable};
use download::{download_file, extract_zip_windows, extract_tar_linux, move_binaries_from_subdir};
use std::fs;
use std::process::Command;

const FFMPEG_URL_WINDOWS: &str = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip";
const FFMPEG_URL_LINUX: &str = "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz";

#[derive(serde::Serialize)]
pub struct DependencyStatus {
    pub ytdlp: bool,
    pub ffmpeg: bool,
    pub ffprobe: bool,
}

pub fn find_tool_static(tool: &str) -> Option<String> {
    find_tool(tool)
}

// ── Check commands ─────────────────────────────────────────────

#[tauri::command]
pub async fn check_yt_dlp() -> Result<bool, String> {
    Ok(find_tool("yt-dlp").is_some())
}

#[tauri::command]
pub async fn check_ffmpeg() -> Result<bool, String> {
    Ok(find_tool("ffmpeg").is_some())
}

#[tauri::command]
pub async fn check_ffprobe() -> Result<bool, String> {
    Ok(find_tool("ffprobe").is_some())
}

#[tauri::command]
pub async fn check_all_dependencies() -> Result<DependencyStatus, String> {
    Ok(DependencyStatus {
        ytdlp: find_tool("yt-dlp").is_some(),
        ffmpeg: find_tool("ffmpeg").is_some(),
        ffprobe: find_tool("ffprobe").is_some(),
    })
}

// ── yt-dlp ─────────────────────────────────────────────────────

#[tauri::command]
pub async fn install_yt_dlp() -> Result<String, String> {
    let dir = tools_dir()?;
    let (url, filename) = if cfg!(target_os = "windows") {
        (
            "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe",
            format!("{}\\yt-dlp.exe", dir),
        )
    } else {
        (
            "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp",
            format!("{}/yt-dlp", dir),
        )
    };

    download_file(&url, &filename)?;
    make_executable(&filename);
    Ok(filename)
}

#[tauri::command]
pub async fn update_yt_dlp() -> Result<String, String> {
    let yt_dlp = find_tool("yt-dlp").ok_or("yt-dlp not found")?;
    let output = Command::new(&yt_dlp)
        .args(["-U"])
        .output()
        .map_err(|e| format!("Failed to run yt-dlp -U: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let combined = format!("{}{}", stdout, stderr);

    if output.status.success() || combined.contains("up to date") || combined.contains("Updated") {
        Ok(combined.trim().to_string())
    } else {
        Err(combined.trim().to_string())
    }
}

// ── ffmpeg / ffprobe ───────────────────────────────────────────

#[tauri::command]
pub async fn install_ffmpeg() -> Result<String, String> {
    let dir = tools_dir()?;
    install_ffmpeg_inner(&dir)
}

#[tauri::command]
pub async fn install_ffprobe() -> Result<String, String> {
    let dir = tools_dir()?;
    install_ffmpeg_inner(&dir)
}

fn install_ffmpeg_inner(dir: &str) -> Result<String, String> {
    if cfg!(target_os = "windows") {
        install_ffmpeg_windows(dir)
    } else {
        install_ffmpeg_linux(dir)
    }
}

fn install_ffmpeg_windows(dir: &str) -> Result<String, String> {
    let zip_path = format!("{}\\ffmpeg.zip", dir);

    if !std::path::Path::new(&zip_path).exists() {
        download_file(FFMPEG_URL_WINDOWS, &zip_path)?;
    }

    extract_zip_windows(&zip_path, dir)?;
    move_binaries_from_subdir(dir)?;
    make_executable(&format!("{}\\ffmpeg.exe", dir));
    make_executable(&format!("{}\\ffprobe.exe", dir));
    let _ = fs::remove_file(&zip_path);
    Ok("ffmpeg + ffprobe installed".to_string())
}

fn install_ffmpeg_linux(dir: &str) -> Result<String, String> {
    let tar_path = format!("{}/ffmpeg.tar.xz", dir);

    if !std::path::Path::new(&tar_path).exists() {
        download_file(FFMPEG_URL_LINUX, &tar_path)?;
    }

    extract_tar_linux(&tar_path, dir)?;
    make_executable(&format!("{}/ffmpeg", dir));
    make_executable(&format!("{}/ffprobe", dir));
    let _ = fs::remove_file(&tar_path);
    Ok("ffmpeg + ffprobe installed".to_string())
}
