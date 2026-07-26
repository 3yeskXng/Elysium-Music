// src-tauri/src/commands/download/provider.rs
// Pluggable download provider trait — swap yt-dlp for any other backend

use crate::deps::checker::find_on_path as find_tool;
use serde::Deserialize;
use std::path::Path;
use std::process::Command;

pub struct DownloadResult {
    pub safe_stem: String,
    pub title: String,
    pub artist: String,
    pub duration_secs: u32,
    pub thumbnail: String,
}

#[derive(Deserialize, Default)]
struct YtDlpJsonMeta {
    #[serde(default)]
    title: String,
    #[serde(default)]
    uploader: String,
    #[serde(default, rename = "duration")]
    duration_secs: Option<f64>,
    #[serde(default)]
    thumbnail: String,
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
            .ok_or("yt-dlp not found. Install it via Settings -> Dependencies.")?;

        let args = vec![
            "--dump-json".to_string(),
            "--no-download".to_string(),
            "--no-playlist".to_string(),
            search.clone(),
        ];

        let meta_output = Command::new(&yt_dlp)
            .args(&args)
            .output()
            .map_err(|e| format!("Failed to run yt-dlp metadata: {}", e))?;

        let mut meta = YtDlpJsonMeta::default();
        if meta_output.status.success() {
            let stdout = String::from_utf8_lossy(&meta_output.stdout);
            if let Some(first_line) = stdout.lines().next() {
                if let Ok(parsed) = serde_json::from_str::<YtDlpJsonMeta>(first_line) {
                    meta = parsed;
                }
            }
        }

        let title = if meta.title.is_empty() { query.to_string() } else { meta.title.clone() };
        let artist = if meta.uploader.is_empty() {
            crate::commands::track_meta::parse_artist_from_query(&title)
        } else {
            meta.uploader.clone()
        };
        let duration = meta.duration_secs.unwrap_or(0.0) as u32;
        let thumbnail = meta.thumbnail.clone();

        let mut dl_args = vec![
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

        if let Some(ffmpeg_path) = find_tool("ffmpeg") {
            dl_args.push("--ffmpeg-location".to_string());
            let ffmpeg_dir = std::path::Path::new(&ffmpeg_path)
                .parent()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or(ffmpeg_path);
            dl_args.push(ffmpeg_dir);
        }

        let dl = Command::new(&yt_dlp)
            .args(&dl_args)
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

        Ok(DownloadResult {
            safe_stem,
            title,
            artist,
            duration_secs: duration,
            thumbnail,
        })
    }
}
