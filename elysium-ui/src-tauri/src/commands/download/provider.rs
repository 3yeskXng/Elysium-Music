// src-tauri/src/commands/download/provider.rs
// Pluggable download provider trait — swap yt-dlp for any other backend

use crate::deps::checker::find_on_path as find_tool;
use std::path::Path;
use std::process::Command;

pub struct DownloadResult {
    pub safe_stem: String,
    pub title: String,
}

pub trait DownloadProvider {
    fn download(&self, query: &str, music_dir: &Path) -> Result<DownloadResult, String>;
}

pub struct YtDlpProvider;

impl DownloadProvider for YtDlpProvider {
    fn download(&self, query: &str, music_dir: &Path) -> Result<DownloadResult, String> {
        let safe_stem = crate::commands::download::file_utils::sanitize(query);
        let temp_base = music_dir.join(format!("__dl_{}", safe_stem));
        let output_template = format!("{}.%(ext)s", temp_base.to_string_lossy());
        let search = format!("ytsearch1:{}", query);
        let yt_dlp = find_tool("yt-dlp")
            .ok_or("yt-dlp not found. Install it via Settings → Dependencies.")?;

        let mut args = vec![
            "-x".to_string(),
            "--audio-format".to_string(),
            "opus".to_string(),
            "--audio-quality".to_string(),
            "0".to_string(),
            "--no-playlist".to_string(),
            "--no-overwrites".to_string(),
            "--print".to_string(),
            "title".to_string(),
            "-o".to_string(),
            output_template,
            search,
        ];

        if let Some(ffmpeg_path) = find_tool("ffmpeg") {
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

        let title = String::from_utf8_lossy(&dl.stdout)
            .lines()
            .next()
            .unwrap_or(query)
            .trim()
            .to_string();

        Ok(DownloadResult { safe_stem, title })
    }
}
