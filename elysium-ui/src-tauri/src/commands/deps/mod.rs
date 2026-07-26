// src-tauri/src/commands/deps/mod.rs
// Tauri commands — check, install, update yt-dlp / ffmpeg / ffprobe
// Blocking I/O (downloads, extraction) runs via spawn_blocking
// Emits "dep-progress" events to frontend for real-time logging

pub mod discovery;
pub mod download;

use discovery::{find_tool, ffmpeg_bin_name, ffprobe_bin_name, make_executable, tools_dir};
use download::{collect_binaries, download_file, extract_tar_xz, extract_zip};
use std::fs;
use std::path::Path;
use std::process::Command;
use tauri::{AppHandle, Emitter};

const FFMPEG_URL_WINDOWS: &str = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip";
const FFMPEG_URL_LINUX: &str = "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz";

#[derive(serde::Serialize, Clone)]
pub struct DepProgress {
    pub tool: String,
    pub step: String,
    pub message: String,
}

fn emit_progress(handle: &AppHandle, tool: &str, step: &str, message: &str) {
    let _ = handle.emit("dep-progress", DepProgress {
        tool: tool.to_string(),
        step: step.to_string(),
        message: message.to_string(),
    });
}

#[derive(serde::Serialize)]
pub struct DependencyStatus {
    pub ytdlp: bool,
    pub ffmpeg: bool,
    pub ffprobe: bool,
}

pub fn find_tool_static(tool: &str) -> Option<String> {
    find_tool(tool)
}

// ── Check commands (fast, no I/O) ──────────────────────────────

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

// ── yt-dlp (blocking download) ─────────────────────────────────

#[tauri::command]
pub async fn install_yt_dlp(app: AppHandle) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
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

        if Path::new(&filename).exists() {
            emit_progress(&app, "yt-dlp", "skip", "yt-dlp already installed");
            return Ok(filename);
        }

        emit_progress(&app, "yt-dlp", "download", "Downloading yt-dlp...");
        download_file(&url, &filename)?;
        make_executable(&filename);
        emit_progress(&app, "yt-dlp", "done", "yt-dlp installed");
        Ok(filename)
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}

#[tauri::command]
pub async fn update_yt_dlp(app: AppHandle) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        let yt_dlp = find_tool("yt-dlp").ok_or("yt-dlp not found")?;
        emit_progress(&app, "yt-dlp", "update", "Running yt-dlp -U...");

        let output = Command::new(&yt_dlp)
            .args(["-U"])
            .output()
            .map_err(|e| format!("Failed to run yt-dlp -U: {}", e))?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);
        let combined = format!("{}{}", stdout, stderr);

        if output.status.success() || combined.contains("up to date") || combined.contains("Updated") {
            emit_progress(&app, "yt-dlp", "done", combined.trim());
            Ok(combined.trim().to_string())
        } else {
            Err(combined.trim().to_string())
        }
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}

// ── ffmpeg / ffprobe (blocking download + extract) ──────────────

#[tauri::command]
pub async fn install_ffmpeg(app: AppHandle) -> Result<String, String> {
    tokio::task::spawn_blocking(move || install_ffmpeg_sync(&app))
        .await
        .map_err(|e| format!("Task failed: {}", e))?
}

#[tauri::command]
pub async fn install_ffprobe(app: AppHandle) -> Result<String, String> {
    tokio::task::spawn_blocking(move || install_ffmpeg_sync(&app))
        .await
        .map_err(|e| format!("Task failed: {}", e))?
}

fn install_ffmpeg_sync(app: &AppHandle) -> Result<String, String> {
    let dir = tools_dir()?;
    let ffmpeg_name = ffmpeg_bin_name();
    let ffprobe_name = ffprobe_bin_name();

    if Path::new(&dir).join(ffmpeg_name).exists() && Path::new(&dir).join(ffprobe_name).exists() {
        emit_progress(app, "ffmpeg", "skip", "ffmpeg + ffprobe already installed");
        return Ok("Already installed".to_string());
    }

    if cfg!(target_os = "windows") {
        install_ffmpeg_windows(app, &dir)
    } else {
        install_ffmpeg_linux(app, &dir)
    }
}

fn install_ffmpeg_windows(app: &AppHandle, dir: &str) -> Result<String, String> {
    let zip_path = format!("{}\\ffmpeg.zip", dir);

    if !Path::new(&zip_path).exists() {
        emit_progress(app, "ffmpeg", "download", "Downloading ffmpeg (~30 MB)...");
        download_file(FFMPEG_URL_WINDOWS, &zip_path)?;
    } else {
        emit_progress(app, "ffmpeg", "extract", "Using cached archive...");
    }

    emit_progress(app, "ffmpeg", "extract", "Extracting ffmpeg...");
    extract_zip(&zip_path, dir)?;

    emit_progress(app, "ffmpeg", "collect", "Locating binaries...");
    let installed = collect_binaries(dir)?;

    let _ = fs::remove_file(&zip_path);

    if installed.is_empty() {
        return Err("Extraction succeeded but ffmpeg/ffprobe binaries not found in archive".to_string());
    }

    let msg = format!("Installed: {}", installed.join(", "));
    emit_progress(app, "ffmpeg", "done", &msg);
    Ok(msg)
}

fn install_ffmpeg_linux(app: &AppHandle, dir: &str) -> Result<String, String> {
    let tar_path = format!("{}/ffmpeg.tar.xz", dir);

    if !Path::new(&tar_path).exists() {
        emit_progress(app, "ffmpeg", "download", "Downloading ffmpeg (~80 MB)...");
        download_file(FFMPEG_URL_LINUX, &tar_path)?;
    } else {
        emit_progress(app, "ffmpeg", "extract", "Using cached archive...");
    }

    emit_progress(app, "ffmpeg", "extract", "Extracting ffmpeg...");
    extract_tar_xz(&tar_path, dir)?;

    emit_progress(app, "ffmpeg", "collect", "Locating binaries...");
    let installed = collect_binaries(dir)?;

    let _ = fs::remove_file(&tar_path);

    if installed.is_empty() {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    let name = path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
                    if name.contains("ffmpeg") && name.contains("static") {
                        let src_ffmpeg = path.join("ffmpeg");
                        let src_ffprobe = path.join("ffprobe");
                        if src_ffmpeg.exists() {
                            let _ = fs::copy(&src_ffmpeg, Path::new(dir).join("ffmpeg"));
                            make_executable(&format!("{}/ffmpeg", dir));
                        }
                        if src_ffprobe.exists() {
                            let _ = fs::copy(&src_ffprobe, Path::new(dir).join("ffprobe"));
                            make_executable(&format!("{}/ffprobe", dir));
                        }
                        if Path::new(dir).join("ffmpeg").exists() {
                            let msg = "Installed: ffmpeg, ffprobe (from static build)".to_string();
                            emit_progress(app, "ffmpeg", "done", &msg);
                            return Ok(msg);
                        }
                    }
                }
            }
        }
    }

    if installed.is_empty() {
        return Err("Extraction succeeded but ffmpeg/ffprobe binaries not found".to_string());
    }

    let msg = format!("Installed: {}", installed.join(", "));
    emit_progress(app, "ffmpeg", "done", &msg);
    Ok(msg)
}
