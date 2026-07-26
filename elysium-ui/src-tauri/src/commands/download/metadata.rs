// src-tauri/src/commands/download/metadata.rs
// ffprobe metadata extraction for downloaded audio files

use crate::commands::deps::discovery::find_tool;
use std::process::Command;

pub fn probe(path: &str) -> (String, u32) {
    let ffprobe = match find_tool("ffprobe") {
        Some(p) => p,
        None => return ("00:00".into(), 0),
    };

    let out = Command::new(&ffprobe)
        .args([
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nocorrect=1",
            path,
        ])
        .output();
    if let Ok(o) = out {
        if o.status.success() {
            let raw = String::from_utf8_lossy(&o.stdout);
            if let Ok(s) = raw.trim().parse::<f64>() {
                let secs = s as u32;
                return (format!("{:02}:{:02}", secs / 60, secs % 60), secs);
            }
        }
    }
    ("00:00".into(), 0)
}
