// src-tauri/src/commands/download/provider.rs
// Pluggable download provider trait — swap yt-dlp for any other backend

use std::path::Path;
use std::process::Command;

pub trait DownloadProvider {
    fn download(&self, query: &str, music_dir: &Path) -> Result<String, String>;
}

fn find_yt_dlp_path() -> Result<String, String> {
    let which_cmd = if cfg!(target_os = "windows") { "where" } else { "which" };
    if let Ok(o) = Command::new(which_cmd).arg("yt-dlp").output() {
        if o.status.success() {
            return Ok("yt-dlp".to_string());
        }
    }

    let local = if cfg!(target_os = "windows") {
        "tools\\yt-dlp.exe"
    } else {
        "tools/yt-dlp"
    };
    if std::path::Path::new(local).exists() {
        return Ok(local.to_string());
    }

    Err("yt-dlp not found. Use the auto-installer in the Download tab.".to_string())
}

pub struct YtDlpProvider;

impl DownloadProvider for YtDlpProvider {
    fn download(&self, query: &str, music_dir: &Path) -> Result<String, String> {
        let safe_stem = crate::commands::download::file_utils::sanitize(query);
        let temp_base = music_dir.join(format!("__dl_{}", safe_stem));
        let output_template = format!("{}.%(ext)s", temp_base.to_string_lossy());
        let search = format!("ytsearch1:{}", query);
        let yt_dlp = find_yt_dlp_path()?;

        let dl = Command::new(&yt_dlp)
            .args([
                "-x", "--audio-format", "opus",
                "--audio-quality", "0",
                "--no-playlist", "--no-overwrites",
                "--postprocessor-args", "-acodec libopus -ab 128k",
                "-o", &output_template,
                &search,
            ])
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
