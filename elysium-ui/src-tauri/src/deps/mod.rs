// src-tauri/src/deps/mod.rs
// Dependency auto-download system — isolated module for checking, downloading, and updating
// external tools (yt-dlp, ffmpeg, ffprobe) without system package managers.

pub mod config;
pub mod logger;

// Future modules (added in subsequent steps):
// pub mod checker;
// pub mod downloader;
// pub mod updater;

pub use config::{
    detect_platform, find_tool_definition, get_deps_directory,
    ArchiveType, Platform, ToolDefinition,
};
pub use logger::{LogEventPayload};
