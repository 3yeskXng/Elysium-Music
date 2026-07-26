// src-tauri/src/commands/download/provider.rs
// Pluggable download provider trait — swap yt-dlp for any other backend

use std::path::Path;
use std::process::Command;

pub trait DownloadProvider {
    fn download(&self, query: &str, music_dir: &Path) -> Result<String, String>;
}

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

fn find_tool_path(tool: &str) -> Result<String, String> {
    if let Some(p) = find_in_path(tool) {
        return Ok(p);
    }

    let local = if cfg!(target_os = "windows") {
        format!("tools\\{}.exe", tool)
    } else {
        format!("tools/{}", tool)
    };
    if std::path::Path::new(&local).exists() {
        return Ok(local);
    }

    Err(format!(
        "{} not found. Please install it or use the auto-installer.",
        tool
    ))
}

fn find_yt_dlp_path() -> Result<String, String> {
    find_tool_path("yt-dlp")
}

pub fn find_ffmpeg_path() -> Result<String, String> {
    find_tool_path("ffmpeg")
}

pub fn find_ffprobe_path() -> Result<String, String> {
    find_tool_path("ffprobe")
}

pub struct YtDlpProvider;

impl DownloadProvider for YtDlpProvider {
    fn download(&self, query: &str, music_dir: &Path) -> Result<String, String> {
        let safe_stem = crate::commands::download::file_utils::sanitize(query);
        let temp_base = music_dir.join(format!("__dl_{}", safe_stem));
        let output_template = format!("{}.%(ext)s", temp_base.to_string_lossy());
        let search = format!("ytsearch1:{}", query);
        let yt_dlp = find_yt_dlp_path()?;

        let mut args = vec![
            "-x".to_string(),
            "--audio-format".to_string(),
            "opus".to_string(),
            "--audio-quality".to_string(),
            "0".to_string(),
            "--no-playlist".to_string(),
            "--no-overwrites".to_string(),
            "-o".to_string(),
            output_template,
            search,
        ];

        if let Ok(ffmpeg_path) = find_ffmpeg_path() {
            args.push("--ffmpeg-location".to_string());
            let ffmpeg_dir = std::path::Path::new(&ffmpeg_path)
                .parent()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or(ffmpeg_path);
            args.push(ffmpeg_dir);
        }

        let dl = Command::new(&yt_dlp)
            .args(&args)
            .output()
            .map_err(|e| format!("Failed to run yt-dlp at '{}': {}", yt_dlp, e))?;

        if !dl.status.success() {
            let stderr = String::from_utf8_lossy(&dl.stderr);
            return Err(format!(
                "yt-dlp error (exit {}): {}",
                dl.status.code().unwrap_or(0),
                stderr.trim()
            ));
        }

        Ok(safe_stem)
    }
}
