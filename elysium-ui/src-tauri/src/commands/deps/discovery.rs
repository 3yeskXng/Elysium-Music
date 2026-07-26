// src-tauri/src/commands/deps/discovery.rs
// Tool path resolution — checks system PATH then local tools/ directory

use std::process::Command;

pub fn find_in_path(tool: &str) -> Option<String> {
    let which_cmd = if cfg!(target_os = "windows") { "where" } else { "which" };
    if let Ok(o) = Command::new(which_cmd).arg(tool).output() {
        if o.status.success() {
            let stdout = String::from_utf8_lossy(&o.stdout);
            let first_line = stdout.lines().next().unwrap_or("").trim();
            if !first_line.is_empty() {
                return Some(first_line.to_string());
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
    if std::path::Path::new(&local).exists() {
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
