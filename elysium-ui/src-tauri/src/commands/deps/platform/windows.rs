// src-tauri/src/commands/deps/platform/windows.rs
// Windows package manager (winget) operations for dependency installation

use super::super::progress::emit_progress;
use std::process::Command;
use tauri::AppHandle;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;

pub fn check_tool(check_cmd: &str) -> bool {
    println!("[Deps:Win] Checking tool: {}", check_cmd);
    if let Ok(o) = Command::new("where")
        .arg(check_cmd)
        .creation_flags(CREATE_NO_WINDOW)
        .output()
    {
        let found = o.status.success();
        println!("[Deps:Win] {} check: {}", check_cmd, if found { "FOUND" } else { "NOT FOUND" });
        return found;
    }
    false
}

pub fn install_tool(winget_id: &str, tool_name: &str, app: &AppHandle) -> Result<String, String> {
    println!("[Deps:Win] Installing {} via winget ({})...", tool_name, winget_id);
    emit_progress(app, tool_name, "download", &format!("Installing {} via winget...", tool_name));

    let output = Command::new("winget")
        .args([
            "install", "--id", winget_id, "-e",
            "--silent", "--accept-package-agreements", "--accept-source-agreements",
        ])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| format!("winget not found: {}. Install winget from Microsoft Store.", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    println!("[Deps:Win] winget exit: {}", output.status.code().unwrap_or(-1));
    println!("[Deps:Win] winget stdout: {}", stdout.trim());
    println!("[Deps:Win] winget stderr: {}", stderr.trim());

    if output.status.success() || stdout.contains("already installed") || stdout.contains("No applicable") {
        let msg = format!("{} installed successfully", tool_name);
        emit_progress(app, tool_name, "done", &msg);
        return Ok(msg);
    }

    let combined = format!("{} {}", stdout.trim(), stderr.trim());
    Err(format!("winget install failed: {}", combined.trim()))
}

pub fn update_tool(winget_id: &str, tool_name: &str, app: &AppHandle) -> Result<String, String> {
    println!("[Deps:Win] Updating {} via winget...", tool_name);
    emit_progress(app, tool_name, "update", &format!("Updating {} via winget...", tool_name));

    let output = Command::new("winget")
        .args([
            "upgrade", "--id", winget_id, "-e",
            "--silent", "--accept-package-agreements", "--accept-source-agreements",
        ])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| format!("winget not found: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    println!("[Deps:Win] winget upgrade exit: {}", output.status.code().unwrap_or(-1));

    if stdout.contains("no applicable") || stdout.contains("up to date") {
        let msg = format!("{} is already up to date", tool_name);
        emit_progress(app, tool_name, "done", &msg);
        return Ok(msg);
    }

    if output.status.success() {
        let msg = format!("{} updated successfully", tool_name);
        emit_progress(app, tool_name, "done", &msg);
        return Ok(msg);
    }

    Err(format!("winget upgrade failed: {}", stdout.trim()))
}
