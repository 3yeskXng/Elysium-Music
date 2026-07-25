// src-tauri/src/commands/download.rs
// YouTube audio download pipeline: yt-dlp fetch → extension normalization → ffprobe metadata

use crate::models::TrackPayload;
use std::fs;
use std::path::PathBuf;
use std::process::Command;

/// Normalizes a filename by removing/replacing characters unsafe for Windows paths.
fn sanitize_filename(raw: &str) -> String {
    raw.chars()
        .map(|c| match c {
            '<' | '>' | '"' | ':' | '/' | '\\' | '|' | '?' | '*' => '_',
            _ => c,
        })
        .collect::<String>()
        .trim()
        .to_string()
}

#[tauri::command]
pub async fn download_youtube(query: String) -> Result<TrackPayload, String> {
    let music_dir = PathBuf::from("music");
    fs::create_dir_all(&music_dir).map_err(|e| format!("Failed to create music dir: {}", e))?;

    // Use a fixed safe temp name to avoid special-char / encoding issues in yt-dlp output
    let temp_stem = sanitize_filename(&query);
    let temp_out = music_dir.join(format!("__dl_temp_{}", temp_stem));
    let output_template = format!("{}.%(ext)s", temp_out.to_string_lossy());
    let search_query = format!("ytsearch1:{}", query);

    // Run yt-dlp: extract audio, force opus post-processing
    let dl_result = Command::new("yt-dlp")
        .args([
            "-x",
            "--audio-format", "opus",
            "--audio-quality", "0",
            "--no-playlist",
            "--no-overwrites",
            "--postprocessor-args", "-acodec libopus -ab 128k",
            "-o", &output_template,
            &search_query,
        ])
        .output()
        .map_err(|e| format!("yt-dlp not found: {}. Is yt-dlp installed and in PATH?", e))?;

    if !dl_result.status.success() {
        let stderr = String::from_utf8_lossy(&dl_result.stderr);
        return Err(format!("yt-dlp error (exit {}): {}", dl_result.status.code().unwrap_or(0), stderr.trim()));
    }

    // Find the actual output file — could be .opus, .webm, .weba, or .mp3 depending on yt-dlp version
    let final_path = find_downloaded_file(&music_dir, &temp_stem)?;
    let (duration_str, secs) = probe_duration(final_path.to_string_lossy().to_string().as_str());

    let title = final_path
        .file_stem()
        .and_then(|s| s.to_str())
        .map(|s| s.trim_start_matches("__dl_temp_").to_string())
        .unwrap_or_else(|| query.clone());

    let path_str = final_path.to_string_lossy().to_string();

    Ok(TrackPayload {
        id: uuid::Uuid::new_v4().to_string(),
        title,
        artist: "YouTube Stream".to_string(),
        duration: duration_str,
        duration_secs: secs,
        duration_secs_snake: secs,
        file_path: path_str.clone(),
        filePath: path_str,
        album: "Elysium Archive".to_string(),
        cover_url_camel: String::new(),
        cover_url_snake: String::new(),
    })
}

/// Scans the music directory for a file matching the temp stem prefix.
/// Returns the canonical .opus path — renames if necessary.
fn find_downloaded_file(music_dir: &PathBuf, temp_stem: &str) -> Result<PathBuf, String> {
    let prefix = format!("__dl_temp_{}", temp_stem);

    // Priority order: .opus first, then .webm/.weba/.mp3
    let extensions = ["opus", "webm", "weba", "mp3"];

    for ext in &extensions {
        let candidate = music_dir.join(format!("{}.{}", prefix, ext));
        if candidate.exists() {
            if *ext == "opus" {
                return Ok(candidate);
            }
            // Rename non-opus to .opus so the scanner always finds it
            let opus_target = music_dir.join(format!("{}.opus", prefix));
            if let Err(e) = fs::rename(&candidate, &opus_target) {
                return Err(format!("Failed to rename .{} to .opus: {}", ext, e));
            }
            return Ok(opus_target);
        }
    }

    // Fallback: brute-force scan for any file starting with the prefix
    if let Ok(entries) = fs::read_dir(music_dir) {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with(&prefix) {
                let path = entry.path();
                let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
                if ext == "opus" {
                    return Ok(path);
                }
                let opus_target = music_dir.join(format!("{}.opus", prefix));
                if let Err(e) = fs::rename(&path, &opus_target) {
                    return Err(format!("Failed to rename fallback file: {}", e));
                }
                return Ok(opus_target);
            }
        }
    }

    Err(format!(
        "Download completed but no output file found for query \"{}\" in music/ directory.",
        temp_stem
    ))
}

/// Extract audio duration via ffprobe → (formatted MM:SS, total_seconds)
fn probe_duration(path: &str) -> (String, u32) {
    let output = Command::new("ffprobe")
        .args([
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nocorrect=1",
            path,
        ])
        .output();

    if let Ok(out) = output {
        if out.status.success() {
            let raw = String::from_utf8_lossy(&out.stdout);
            if let Ok(secs_f) = raw.trim().parse::<f64>() {
                let secs = secs_f as u32;
                return (format!("{:02}:{:02}", secs / 60, secs % 60), secs);
            }
        }
    }
    ("00:00".to_string(), 0)
}
