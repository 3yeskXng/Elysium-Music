// src-tauri/src/commands/download/file_utils.rs
// Filesystem helpers: sanitization, collision avoidance, output discovery

use std::fs;
use std::path::PathBuf;

pub fn sanitize(raw: &str) -> String {
    raw.chars()
        .map(|c| {
            if matches!(c, '<' | '>' | '"' | ':' | '/' | '\\' | '|' | '?' | '*') {
                '_'
            } else {
                c
            }
        })
        .collect::<String>()
        .trim()
        .to_string()
}

pub fn unique_path(base: &PathBuf) -> PathBuf {
    if !base.exists() {
        return base.clone();
    }
    let stem = base.file_stem().and_then(|s| s.to_str()).unwrap_or("track");
    for i in 1.. {
        let candidate = base.with_file_name(format!("{} ({}).opus", stem, i));
        if !candidate.exists() {
            return candidate;
        }
    }
    base.clone()
}

pub fn find_output(dir: &PathBuf, safe_stem: &str) -> Result<PathBuf, String> {
    let prefix = format!("__dl_{}", safe_stem);
    let exts = ["opus", "webm", "weba", "mp3"];

    for ext in &exts {
        let candidate = dir.join(format!("{}.{}", prefix, ext));
        if candidate.exists() {
            if *ext == "opus" {
                return Ok(candidate);
            }
            let target = dir.join(format!("{}.opus", prefix));
            fs::rename(&candidate, &target)
                .map_err(|e| format!("Rename .{} -> .opus failed: {}", ext, e))?;
            return Ok(target);
        }
    }

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with(&prefix) {
                let path = entry.path();
                let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
                if ext == "opus" {
                    return Ok(path);
                }
                let target = dir.join(format!("{}.opus", prefix));
                fs::rename(&path, &target)
                    .map_err(|e| format!("Rename fallback failed: {}", e))?;
                return Ok(target);
            }
        }
    }

    Err(format!("No output file found for \"{}\" in music/.", safe_stem))
}
