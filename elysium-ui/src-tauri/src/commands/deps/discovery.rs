// src-tauri/src/commands/deps/discovery.rs
// Tool path resolution — checks system PATH then local tools/ directory

use std::path::Path;
use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;

pub fn find_in_path(tool: &str) -> Option<String> {
    let which_cmd = if cfg!(target_os = "windows") { "where" } else { "which" };
    if let Ok(o) = Command::new(which_cmd)
        .arg(tool)
        .creation_flags(CREATE_NO_WINDOW)
        .output()
    {
        if o.status.success() {
            let stdout = String::from_utf8_lossy(&o.stdout);
            let first_line = stdout.lines().next().unwrap_or("").trim().to_string();
            if !first_line.is_empty() && Path::new(&first_line).exists() {
                return Some(first_line);
            }
        }
    }
    None
}

pub fn find_in_local_tools(tool: &str) -> Option<String> {
    let local = if cfg!(target_os = "windows") {
        format!("tools\\{}.exe", tool)
    } else {
        format!("tools/{}", tool)
    };
    if Path::new(&local).exists() {
        Some(local)
    } else {
        None
    }
}

pub fn find_tool(tool: &str) -> Option<String> {
    find_in_path(tool).or_else(|| find_in_local_tools(tool))
}

pub fn tools_dir() -> Result<String, String> {
    let dir = "tools";
    std::fs::create_dir_all(dir).map_err(|e| format!("Create tools dir failed: {}", e))?;
    Ok(dir.to_string())
}

pub fn make_executable(path: &str) {
    if !cfg!(target_os = "windows") {
        let _ = Command::new("chmod").args(["+x", path]).output();
    }
}

pub fn ffmpeg_bin_name() -> &'static str {
    if cfg!(target_os = "windows") { "ffmpeg.exe" } else { "ffmpeg" }
}

pub fn ffprobe_bin_name() -> &'static str {
    if cfg!(target_os = "windows") { "ffprobe.exe" } else { "ffprobe" }
}
