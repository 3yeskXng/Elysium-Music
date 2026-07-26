// src-tauri/src/commands/deps/platform/mod.rs
// Platform detection and tool configuration registry
// Maps each dependency to its platform-specific package manager ID
// Conditionally compiles platform modules for cross-platform support

#[cfg(target_os = "windows")]
pub mod windows;

#[cfg(target_os = "linux")]
pub mod linux;

#[derive(Debug)]
pub enum Platform {
    Windows,
    Linux,
    Unknown,
}

pub fn detect() -> Platform {
    if cfg!(target_os = "windows") {
        Platform::Windows
    } else if cfg!(target_os = "linux") {
        Platform::Linux
    } else {
        Platform::Unknown
    }
}

pub struct ToolConfig {
    pub name: &'static str,
    pub winget_id: &'static str,
    pub apt_package: &'static str,
    pub check_command: &'static str,
}

pub fn tool_configs() -> Vec<ToolConfig> {
    vec![
        ToolConfig {
            name: "yt-dlp",
            winget_id: "yt-dlp.yt-dlp",
            apt_package: "yt-dlp",
            check_command: "yt-dlp",
        },
        ToolConfig {
            name: "ffmpeg",
            winget_id: "Gyan.FFmpeg",
            apt_package: "ffmpeg",
            check_command: "ffmpeg",
        },
        ToolConfig {
            name: "ffprobe",
            winget_id: "Gyan.FFmpeg",
            apt_package: "ffmpeg",
            check_command: "ffprobe",
        },
    ]
}
