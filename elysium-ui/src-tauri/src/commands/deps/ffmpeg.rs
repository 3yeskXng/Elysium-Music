// src-tauri/src/commands/deps/ffmpeg.rs
// ffmpeg and ffprobe dependency management: check, install
// Downloads from official sources with fallback URLs and retry logic
// Supports Windows (zip), Linux and macOS (tar.xz)

use super::discovery::{find_tool, tools_dir, verify_file};
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
    println!("[Deps:Ffmpeg] Checking ffmpeg availability...");
    let found = find_tool("ffmpeg").is_some();
    println!("[Deps:Ffmpeg] ffmpeg check: {}", if found { "FOUND" } else { "NOT FOUND" });
    found
}

/// Check if ffprobe is available in PATH or local tools/ directory.
pub fn check_ffprobe() -> bool {
    println!("[Deps:Ffmpeg] Checking ffprobe availability...");
    let found = find_tool("ffprobe").is_some();
    println!("[Deps:Ffmpeg] ffprobe check: {}", if found { "FOUND" } else { "NOT FOUND" });
    found
}

/// Install ffmpeg (and ffprobe) from official sources with fallback URLs.
pub fn install(app: &AppHandle) -> Result<String, String> {
    println!("[Deps:Ffmpeg] === Starting ffmpeg/ffprobe installation ===");
    let dir = tools_dir()?;
    let ffmpeg_name = super::extract::ffmpeg_bin_name();
    let ffprobe_name = ffprobe_bin_name();

    println!("[Deps:Ffmpeg] Tools directory: {}", dir);
    println!("[Deps:Ffmpeg] Expected binaries: {}, {}", ffmpeg_name, ffprobe_name);

    let ffmpeg_path = Path::new(&dir).join(ffmpeg_name);
    let ffprobe_path = Path::new(&dir).join(ffprobe_name);

    if ffmpeg_path.exists() && ffprobe_path.exists() {
        if verify_file(&ffmpeg_path.to_string_lossy())
            && verify_file(&ffprobe_path.to_string_lossy())
        {
            let msg = "ffmpeg + ffprobe already installed and verified";
            println!("[Deps:Ffmpeg] {}", msg);
            emit_progress(app, "ffmpeg", "skip", msg);
            return Ok("Already installed".to_string());
        }
        println!("[Deps:Ffmpeg] Existing files are invalid, re-downloading...");
    }

    if cfg!(target_os = "windows") {
        install_windows(app, &dir)
    } else {
        install_unix(app, &dir)
    }
}

/// Windows: Download zip, extract, collect binaries.
fn install_windows(app: &AppHandle, dir: &str) -> Result<String, String> {
    println!("[Deps:Ffmpeg] Platform: Windows");
    let zip_path = format!("{}\\ffmpeg.zip", dir);

    if !Path::new(&zip_path).exists() {
        let msg = "Downloading ffmpeg (~30 MB)...";
        println!("[Deps:Ffmpeg] {}", msg);
        emit_progress(app, "ffmpeg", "download", msg);
        super::download::download_file_with_retry(
            FFMPEG_URL_WINDOWS,
            Some(FFMPEG_URL_WINDOWS_FALLBACK),
            &zip_path,
            app,
            "ffmpeg",
        )?;
    } else {
        let msg = "Using cached archive...";
        println!("[Deps:Ffmpeg] {}", msg);
        emit_progress(app, "ffmpeg", "extract", msg);
    }

    let msg = "Extracting ffmpeg on Windows...";
    println!("[Deps:Ffmpeg] {}", msg);
    emit_progress(app, "ffmpeg", "extract", msg);
    extract_zip(&zip_path, dir)?;
    post_extract(app, dir, &zip_path)
}

/// Linux/macOS: Download tar.xz, extract, collect binaries.
fn install_unix(app: &AppHandle, dir: &str) -> Result<String, String> {
    let platform = if cfg!(target_os = "macos") { "macOS" } else { "Linux" };
    println!("[Deps:Ffmpeg] Platform: {}", platform);
    let tar_path = format!("{}/ffmpeg.tar.xz", dir);

    if !Path::new(&tar_path).exists() {
        let msg = "Downloading ffmpeg (~80 MB)...";
        println!("[Deps:Ffmpeg] {}", msg);
        emit_progress(app, "ffmpeg", "download", msg);
        super::download::download_file_with_retry(
            FFMPEG_URL_UNIX,
            Some(FFMPEG_URL_UNIX_FALLBACK),
            &tar_path,
            app,
            "ffmpeg",
        )?;
    } else {
        let msg = "Using cached archive...";
        println!("[Deps:Ffmpeg] {}", msg);
        emit_progress(app, "ffmpeg", "extract", msg);
    }

    let msg = format!("Extracting ffmpeg on {}...", platform);
    println!("[Deps:Ffmpeg] {}", msg);
    emit_progress(app, "ffmpeg", "extract", &msg);
    extract_tar_xz(&tar_path, dir)?;
    post_extract(app, dir, &tar_path)
}

/// Shared post-extraction: collect binaries, clean up archive, report result.
fn post_extract(app: &AppHandle, dir: &str, archive_path: &str) -> Result<String, String> {
    let msg = "Locating binaries in extracted archive...";
    println!("[Deps:Ffmpeg] {}", msg);
    emit_progress(app, "ffmpeg", "collect", msg);

    let installed = collect_binaries(dir)?;
    let _ = fs::remove_file(archive_path);
    println!("[Deps:Ffmpeg] Cleaned up archive: {}", archive_path);

    if installed.is_empty() {
        println!("[Deps:Ffmpeg] Standard collection failed, trying fallback extraction...");
        return try_fallback_extract(app, dir);
    }

    // Verify each installed binary
    for name in &installed {
        let path = format!("{}/{}", dir, name);
        if !verify_file(&path) {
            return Err(format!("Installed binary verification failed: {}", name));
        }
    }

    let msg = format!("Installed: {}", installed.join(", "));
    println!("[Deps:Ffmpeg] === {} ===", msg);
    emit_progress(app, "ffmpeg", "done", &msg);
    Ok(msg)
}

/// Try to find binaries in nested directories after extraction (fallback).
fn try_fallback_extract(app: &AppHandle, dir: &str) -> Result<String, String> {
    println!("[Deps:Ffmpeg] Searching nested directories for ffmpeg binaries...");
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }
            let name = path
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default();
            if !(name.contains("ffmpeg") && name.contains("static")) {
                continue;
            }
            println!("[Deps:Ffmpeg] Found static build directory: {}", path.display());
            for bin in &["ffmpeg", "ffprobe"] {
                let src = path.join(bin);
                if src.exists() {
                    let dst = Path::new(dir).join(bin);
                    println!("[Deps:Ffmpeg] Copying {} -> {}", src.display(), dst.display());
                    let _ = fs::copy(&src, &dst);
                    make_executable(&dst.to_string_lossy());
                }
            }
            if Path::new(dir).join("ffmpeg").exists() {
                let ffmpeg_path = format!("{}/ffmpeg", dir);
                let ffprobe_path = format!("{}/ffprobe", dir);
                if verify_file(&ffmpeg_path) && verify_file(&ffprobe_path) {
                    let msg = "Installed: ffmpeg, ffprobe (from static build)";
                    println!("[Deps:Ffmpeg] === {} ===", msg);
                    emit_progress(app, "ffmpeg", "done", msg);
                    return Ok(msg.to_string());
                }
            }
        }
    }
    Err("Extraction succeeded but ffmpeg/ffprobe binaries not found".to_string())
}
