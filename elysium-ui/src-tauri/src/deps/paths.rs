// src-tauri/src/deps/paths.rs
// Centralized path resolution for dependency binaries and temporary downloads.
// resolve_path() checks the local deps directory first, then falls back to system PATH.

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

/// Resolve a tool binary path. Checks the local deps directory first,
/// then falls back to system PATH via `where`/`which`.
pub fn resolve_path(tool_name: &str) -> Option<String> {
    if let Some(tool) = config::find_tool_definition(tool_name) {
        let local = binary_path(&tool);
        if local.exists() {
            return Some(local.to_string_lossy().to_string());
        }
    }
    find_on_system_path(tool_name)
}

fn find_on_system_path(name: &str) -> Option<String> {
    let cmd = if cfg!(target_os = "windows") { "where" } else { "which" };
    let mut command = std::process::Command::new(cmd);
    command.arg(name);
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x08000000);
    }
    command.output().ok().and_then(|o| {
        if o.status.success() {
            let stdout = String::from_utf8_lossy(&o.stdout);
            stdout.lines().next().map(|s| s.trim().to_string())
        } else {
            None
        }
    })
}
