// src-tauri/src/commands/deps/ffmpeg.rs
// ffmpeg and ffprobe dependency management: check, install
// Downloads from official sources with fallback URLs and retry logic
// Supports Windows (zip), Linux and macOS (tar.xz)

use super::discovery::{find_tool, tools_dir};
use super::download::make_executable;
use super::extract::{collect_binaries, extract_tar_xz, extract_zip, ffprobe_bin_name};
use super::progress::emit_progress;
use std::fs;
use std::path::Path;
use tauri::AppHandle;

const FFMPEG_URL_WINDOWS: &str =
    "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip";
const FFMPEG_URL_UNIX: &str =
    "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz";
const FFMPEG_URL_WINDOWS_FALLBACK: &str =
    "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip";
const FFMPEG_URL_UNIX_FALLBACK: &str =
    "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz";

/// Check if ffmpeg is available in PATH or local tools/ directory.
pub fn check_ffmpeg() -> bool {
    find_tool("ffmpeg").is_some()
}

/// Check if ffprobe is available in PATH or local tools/ directory.
pub fn check_ffprobe() -> bool {
    find_tool("ffprobe").is_some()
}

/// Install ffmpeg (and ffprobe) from official sources with fallback URLs.
pub fn install(app: &AppHandle) -> Result<String, String> {
    let dir = tools_dir()?;
    let ffmpeg_name = super::extract::ffmpeg_bin_name();
    let ffprobe_name = ffprobe_bin_name();

    if Path::new(&dir).join(ffmpeg_name).exists()
        && Path::new(&dir).join(ffprobe_name).exists()
    {
        emit_progress(app, "ffmpeg", "skip", "ffmpeg + ffprobe already installed");
        return Ok("Already installed".to_string());
    }

    if cfg!(target_os = "windows") {
        install_windows(app, &dir)
    } else {
        install_unix(app, &dir)
    }
}

/// Windows: Download zip, extract, collect binaries.
fn install_windows(app: &AppHandle, dir: &str) -> Result<String, String> {
    let zip_path = format!("{}\\ffmpeg.zip", dir);

    if !Path::new(&zip_path).exists() {
        emit_progress(app, "ffmpeg", "download", "Downloading ffmpeg (~30 MB)...");
        super::download::download_file_with_retry(
            FFMPEG_URL_WINDOWS, Some(FFMPEG_URL_WINDOWS_FALLBACK), &zip_path, app, "ffmpeg",
        )?;
    } else {
        emit_progress(app, "ffmpeg", "extract", "Using cached archive...");
    }

    emit_progress(app, "ffmpeg", "extract", "Extracting ffmpeg...");
    extract_zip(&zip_path, dir)?;
    post_extract(app, dir, &zip_path)
}

/// Linux/macOS: Download tar.xz, extract, collect binaries.
fn install_unix(app: &AppHandle, dir: &str) -> Result<String, String> {
    let tar_path = format!("{}/ffmpeg.tar.xz", dir);

    if !Path::new(&tar_path).exists() {
        emit_progress(app, "ffmpeg", "download", "Downloading ffmpeg (~80 MB)...");
        super::download::download_file_with_retry(
            FFMPEG_URL_UNIX, Some(FFMPEG_URL_UNIX_FALLBACK), &tar_path, app, "ffmpeg",
        )?;
    } else {
        emit_progress(app, "ffmpeg", "extract", "Using cached archive...");
    }

    emit_progress(app, "ffmpeg", "extract", "Extracting ffmpeg...");
    extract_tar_xz(&tar_path, dir)?;
    post_extract(app, dir, &tar_path)
}

/// Shared post-extraction: collect binaries, clean up archive, report result.
fn post_extract(app: &AppHandle, dir: &str, archive_path: &str) -> Result<String, String> {
    emit_progress(app, "ffmpeg", "collect", "Locating binaries...");
    let installed = collect_binaries(dir)?;
    let _ = fs::remove_file(archive_path);

    if installed.is_empty() {
        return try_fallback_extract(app, dir);
    }

    let msg = format!("Installed: {}", installed.join(", "));
    emit_progress(app, "ffmpeg", "done", &msg);
    Ok(msg)
}

/// Try to find binaries in nested directories after extraction (fallback).
fn try_fallback_extract(app: &AppHandle, dir: &str) -> Result<String, String> {
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }
            let name = path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
            if !(name.contains("ffmpeg") && name.contains("static")) {
                continue;
            }
            for bin in &["ffmpeg", "ffprobe"] {
                let src = path.join(bin);
                if src.exists() {
                    let _ = fs::copy(&src, Path::new(dir).join(bin));
                    make_executable(&format!("{}/{}", dir, bin));
                }
            }
            if Path::new(dir).join("ffmpeg").exists() {
                let msg = "Installed: ffmpeg, ffprobe (from static build)".to_string();
                emit_progress(app, "ffmpeg", "done", &msg);
                return Ok(msg);
            }
        }
    }
    Err("Extraction succeeded but ffmpeg/ffprobe binaries not found".to_string())
}
