// src-tauri/src/commands/download/provider.rs
// Pluggable download provider trait — swap yt-dlp for any other backend

use std::path::Path;
use std::process::Command;

pub trait DownloadProvider {
    fn download(&self, query: &str, music_dir: &Path) -> Result<String, String>;
}

pub struct YtDlpProvider;

impl DownloadProvider for YtDlpProvider {
    fn download(&self, query: &str, music_dir: &Path) -> Result<String, String> {
        let safe_stem = crate::commands::download::file_utils::sanitize(query);
        let temp_base = music_dir.join(format!("__dl_{}", safe_stem));
        let output_template = format!("{}.%(ext)s", temp_base.to_string_lossy());
        let search = format!("ytsearch1:{}", query);

        let dl = Command::new("yt-dlp")
            .args([
                "-x", "--audio-format", "opus",
                "--audio-quality", "0",
                "--no-playlist", "--no-overwrites",
                "--postprocessor-args", "-acodec libopus -ab 128k",
                "-o", &output_template,
                &search,
            ])
            .output()
            .map_err(|e| format!("yt-dlp not found: {}. Install yt-dlp and ensure it is in PATH.", e))?;

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
