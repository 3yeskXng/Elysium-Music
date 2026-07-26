// src-tauri/src/deps/config.rs
// Central dependency configuration — tool definitions, platform detection, and storage paths.
// Adding a new tool requires only a single entry in get_tool_definitions().

use std::path::PathBuf;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Platform {
    Windows,
    Linux,
    MacOs,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ArchiveType {
    Zip,
    TarGz,
    TarXz,
    PlainBinary,
}

#[derive(Debug, Clone)]
pub struct ToolBinaryNames {
    pub windows: &'static str,
    pub linux: &'static str,
    pub macos: &'static str,
}

#[derive(Debug, Clone)]
pub struct ToolDownloadUrls {
    pub windows: &'static str,
    pub linux: &'static str,
    pub macos: &'static str,
}

#[derive(Debug, Clone)]
pub struct ToolDefinition {
    pub name: &'static str,
    pub binary_names: ToolBinaryNames,
    pub download_urls: ToolDownloadUrls,
    pub update_args: Option<&'static [&'static str]>,
}

pub fn detect_platform() -> Platform {
    if cfg!(target_os = "windows") {
        Platform::Windows
    } else if cfg!(target_os = "macos") {
        Platform::MacOs
    } else {
        Platform::Linux
    }
}

pub fn binary_name_for(tool: &ToolDefinition) -> &'static str {
    match detect_platform() {
        Platform::Windows => tool.binary_names.windows,
        Platform::Linux => tool.binary_names.linux,
        Platform::MacOs => tool.binary_names.macos,
    }
}

pub fn download_url_for(tool: &ToolDefinition) -> &'static str {
    match detect_platform() {
        Platform::Windows => tool.download_urls.windows,
        Platform::Linux => tool.download_urls.linux,
        Platform::MacOs => tool.download_urls.macos,
    }
}

pub fn archive_type_from_url(url: &str) -> ArchiveType {
    if url.ends_with(".zip") {
        ArchiveType::Zip
    } else if url.ends_with(".tar.gz") || url.ends_with(".tgz") {
        ArchiveType::TarGz
    } else if url.ends_with(".tar.xz") || url.ends_with(".txz") {
        ArchiveType::TarXz
    } else {
        ArchiveType::PlainBinary
    }
}

// ── TOOL REGISTRY ─────────────────────────────────────────────────────────────────────────
// Adding a new tool = adding one entry here. That's it.

pub fn get_tool_definitions() -> Vec<ToolDefinition> {
    vec![
        ToolDefinition {
            name: "yt-dlp",
            binary_names: ToolBinaryNames {
                windows: "yt-dlp.exe",
                linux: "yt-dlp",
                macos: "yt-dlp",
            },
            download_urls: ToolDownloadUrls {
                windows: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe",
                linux: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp",
                macos: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos",
            },
            update_args: Some(&["-U"]),
        },
        ToolDefinition {
            name: "ffmpeg",
            binary_names: ToolBinaryNames {
                windows: "ffmpeg.exe",
                linux: "ffmpeg",
                macos: "ffmpeg",
            },
            download_urls: ToolDownloadUrls {
                windows: "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip",
                linux: "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz",
                macos: "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-macos64-gpl.zip",
            },
            update_args: None,
        },
        ToolDefinition {
            name: "ffprobe",
            binary_names: ToolBinaryNames {
                windows: "ffprobe.exe",
                linux: "ffprobe",
                macos: "ffprobe",
            },
            download_urls: ToolDownloadUrls {
                windows: "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip",
                linux: "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz",
                macos: "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-macos64-gpl.zip",
            },
            update_args: None,
        },
    ]
}

pub fn find_tool_definition(name: &str) -> Option<ToolDefinition> {
    get_tool_definitions().into_iter().find(|t| t.name == name)
}

/// Directory where downloaded dependency binaries are stored locally.
/// Path: <app_data_local>/elysium/deps/
pub fn get_deps_directory() -> PathBuf {
    dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("elysium")
        .join("deps")
}
