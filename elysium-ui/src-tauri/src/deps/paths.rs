// src-tauri/src/deps/paths.rs
// Centralized path resolution for dependency binaries and temporary downloads.

use super::config::{self, ToolDefinition};
use std::fs;
use std::path::PathBuf;

pub fn deps_dir() -> PathBuf {
    config::get_deps_directory()
}

pub fn binary_path(tool: &ToolDefinition) -> PathBuf {
    deps_dir().join(config::binary_name_for(tool))
}

pub fn temp_dir() -> PathBuf {
    deps_dir().join("_temp")
}

pub fn temp_file_for(tool_name: &str) -> PathBuf {
    temp_dir().join(tool_name)
}

pub fn ensure_dirs() -> Result<(), String> {
    fs::create_dir_all(deps_dir())
        .map_err(|e| format!("Create deps dir: {}", e))?;
    fs::create_dir_all(temp_dir())
        .map_err(|e| format!("Create temp dir: {}", e))?;
    Ok(())
}

pub fn cleanup_temp() {
    let _ = fs::remove_dir_all(temp_dir());
}
