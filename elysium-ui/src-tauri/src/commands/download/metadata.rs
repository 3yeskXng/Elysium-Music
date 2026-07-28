// src-tauri/src/commands/download/metadata.rs
// ffprobe metadata extraction for downloaded audio files

use crate::deps::checker::find_on_path as find_tool;
use crate::deps::process::no_window_command;

pub fn probe(path: &str) -> (String, u32) {
    let ffprobe = match find_tool("ffprobe") {
        Some(p) => p,
        None => return ("00:00".into(), 0),
    };

    let out = no_window_command(&ffprobe)
        .args([
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1",
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
