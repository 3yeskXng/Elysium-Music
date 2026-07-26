// src-tauri/src/commands/deps/discovery.rs
// Tool path resolution — checks system PATH then local tools/ directory
// Uses absolute paths based on the executable's location for reliability

use std::path::{Path, PathBuf};
use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;

/// Resolve the absolute tools directory path.
/// Uses the directory where the executable lives as base.
fn absolute_tools_dir() -> PathBuf {
    let base = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));
    base.join("tools")
}

/// Check if a tool is available in the system PATH (via where/which).
pub fn find_in_path(tool: &str) -> Option<String> {
    let which_cmd = if cfg!(target_os = "windows") {
        "where"
    } else {
        "which"
    };
    println!("[Deps:Discovery] Searching PATH for '{}' via '{}'", tool, which_cmd);
    if let Ok(o) = Command::new(which_cmd)
        .arg(tool)
        .creation_flags(CREATE_NO_WINDOW)
        .output()
    {
        if o.status.success() {
            let stdout = String::from_utf8_lossy(&o.stdout);
            let first_line = stdout.lines().next().unwrap_or("").trim().to_string();
            if !first_line.is_empty() && Path::new(&first_line).exists() {
                println!("[Deps:Discovery] Found '{}' in PATH at: {}", tool, first_line);
                return Some(first_line);
            }
        }
    }
    println!("[Deps:Discovery] '{}' not found in PATH", tool);
    None
}

/// Check if a tool exists in the local tools/ directory.
pub fn find_in_local_tools(tool: &str) -> Option<String> {
    let tools = absolute_tools_dir();
    let local = if cfg!(target_os = "windows") {
        tools.join(format!("{}.exe", tool))
    } else {
        tools.join(tool)
    };
    println!("[Deps:Discovery] Checking local path: {}", local.display());
    if local.exists() {
        println!("[Deps:Discovery] Found '{}' at: {}", tool, local.display());
        Some(local.to_string_lossy().to_string())
    } else {
        println!("[Deps:Discovery] '{}' not found locally at: {}", tool, local.display());
        None
    }
}

/// Find a tool by checking PATH first, then local tools/ directory.
pub fn find_tool(tool: &str) -> Option<String> {
    println!("[Deps:Discovery] === Looking up tool: {} ===", tool);
    let result = find_in_path(tool).or_else(|| find_in_local_tools(tool));
    match &result {
        Some(path) => println!("[Deps:Discovery] Resolution OK: {} -> {}", tool, path),
        None => println!("[Deps:Discovery] Resolution FAILED: {} not found anywhere", tool),
    }
    result
}

/// Get or create the tools directory path (absolute).
pub fn tools_dir() -> Result<String, String> {
    let dir = absolute_tools_dir();
    println!("[Deps:Discovery] Ensuring tools directory exists: {}", dir.display());
    std::fs::create_dir_all(&dir).map_err(|e| {
        let msg = format!("Create tools dir '{}' failed: {}", dir.display(), e);
        println!("[Deps:Discovery] ERROR: {}", msg);
        msg
    })?;
    Ok(dir.to_string_lossy().to_string())
}

/// Set file as executable on Unix systems (chmod +x). No-op on Windows.
pub fn make_executable(path: &str) {
    if !cfg!(target_os = "windows") {
        println!("[Deps:Discovery] Setting executable permission: {}", path);
        let output = Command::new("chmod")
            .args(["+x", path])
            .output();
        match output {
            Ok(o) if o.status.success() => {
                println!("[Deps:Discovery] chmod +x succeeded for: {}", path);
            }
            Ok(o) => {
                let stderr = String::from_utf8_lossy(&o.stderr);
                println!("[Deps:Discovery] chmod +x failed: {}", stderr.trim());
            }
            Err(e) => {
                println!("[Deps:Discovery] chmod command failed: {}", e);
            }
        }
    }
}

/// Check if a specific file exists and log its size.
pub fn verify_file(path: &str) -> bool {
    match std::fs::metadata(path) {
        Ok(meta) => {
            let size_mb = meta.len() as f64 / (1024.0 * 1024.0);
            println!("[Deps:Discovery] File verified: {} ({:.2} MB)", path, size_mb);
            meta.len() > 0
        }
        Err(e) => {
            println!("[Deps:Discovery] File verification FAILED: {} — {}", path, e);
            false
        }
    }
}
