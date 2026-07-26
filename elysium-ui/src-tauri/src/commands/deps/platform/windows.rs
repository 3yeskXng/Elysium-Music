// src-tauri/src/commands/deps/platform/windows.rs
// Windows package manager (winget) operations for dependency installation
// Spawns an elevated CMD window using PowerShell Start-Process -Verb RunAs

use super::super::progress::emit_progress;
use std::process::Command;
use tauri::AppHandle;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;

pub fn check_tool(check_cmd: &str) -> bool {
    println!("[Deps:Win] Checking tool: {}", check_cmd);
    let mut cmd = Command::new("where");
    cmd.arg(check_cmd);
    
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);

    if let Ok(o) = cmd.output() {
        let found = o.status.success();
        println!("[Deps:Win] {} check: {}", check_cmd, if found { "FOUND" } else { "NOT FOUND" });
        return found;
    }
    false
}

fn open_elevated_cmd(
    winget_args: &str,
    tool_name: &str,
    action_label: &str,
    app: &AppHandle,
) -> Result<String, String> {
    println!("[Deps:Win] Opening elevated CMD for {} {}...", action_label, tool_name);
    emit_progress(
        app,
        tool_name,
        action_label,
        &format!("Opening Admin CMD window for {}...", tool_name),
    );

    let ps_script = format!(
        "Start-Process cmd -ArgumentList '/k {}' -Verb RunAs",
        winget_args
    );

    let mut cmd = Command::new("powershell");
    cmd.args(["-Command", &ps_script]);

    cmd.spawn().map_err(|e| {
        format!(
            "Failed to launch PowerShell: {}. Ensure PowerShell is available.",
            e
        )
    })?;

    let msg = format!("Admin CMD window launched for {}.", tool_name);
    emit_progress(app, tool_name, "done", &msg);
    Ok(msg)
}

pub fn install_tool(winget_id: &str, tool_name: &str, app: &AppHandle) -> Result<String, String> {
    let winget_args = format!(
        "winget install --id {} -e --silent --accept-package-agreements --accept-source-agreements",
        winget_id
    );
    open_elevated_cmd(&winget_args, tool_name, "install", app)
}

pub fn update_tool(winget_id: &str, tool_name: &str, app: &AppHandle) -> Result<String, String> {
    let winget_args = format!(
        "winget upgrade --id {} -e --silent --accept-package-agreements --accept-source-agreements",
        winget_id
    );
    open_elevated_cmd(&winget_args, tool_name, "update", app)
}