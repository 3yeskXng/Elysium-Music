// src-tauri/src/commands/deps/manager.rs
// Core dependency manager — orchestrates check/install/update across platforms
// Delegates to platform-specific modules (winget, apt, dnf)

use super::platform::{self, detect, Platform, tool_configs};
use super::progress::emit_progress;
use super::DependencyStatus;
use tauri::AppHandle;

pub fn find_tool_path(check_cmd: &str) -> Option<String> {
    let which_cmd = if cfg!(target_os = "windows") { "where" } else { "which" };
    std::process::Command::new(which_cmd)
        .arg(check_cmd)
        .output()
        .ok()
        .and_then(|o| {
            if o.status.success() {
                let first = String::from_utf8_lossy(&o.stdout);
                let path = first.lines().next().unwrap_or("").trim().to_string();
                if !path.is_empty() { Some(path) } else { None }
            } else {
                None
            }
        })
}

pub fn check(tool_name: &str) -> bool {
    let config = tool_configs().into_iter().find(|c| c.name == tool_name);
    match config {
        Some(cfg) => {
            let found = match detect() {
                #[cfg(target_os = "windows")]
                Platform::Windows => platform::windows::check_tool(cfg.check_command),
                #[cfg(target_os = "linux")]
                Platform::Linux => platform::linux::check_tool(cfg.check_command),
                _ => false,
            };
            println!("[Deps:Manager] {} check result: {}", tool_name, found);
            found
        }
        None => {
            println!("[Deps:Manager] Unknown tool: {}", tool_name);
            false
        }
    }
}

pub fn check_all() -> DependencyStatus {
    DependencyStatus {
        ytdlp: check("yt-dlp"),
        ffmpeg: check("ffmpeg"),
        ffprobe: check("ffprobe"),
    }
}

pub fn install(tool_name: &str, app: &AppHandle) -> Result<String, String> {
    let config = tool_configs()
        .into_iter()
        .find(|c| c.name == tool_name)
        .ok_or_else(|| format!("Unknown tool: {}", tool_name))?;

    println!("[Deps:Manager] Installing {} (platform: {:?})", tool_name, detect());
    emit_progress(app, tool_name, "start", &format!("Preparing {} installation...", tool_name));

    let result = match detect() {
        #[cfg(target_os = "windows")]
        Platform::Windows => platform::windows::install_tool(config.winget_id, tool_name, app),
        #[cfg(target_os = "linux")]
        Platform::Linux => platform::linux::install_tool(config.apt_package, tool_name, app),
        _ => Err("Unsupported platform".to_string()),
    };

    match &result {
        Ok(msg) => println!("[Deps:Manager] {} install OK: {}", tool_name, msg),
        Err(e) => {
            println!("[Deps:Manager] {} install FAILED: {}", tool_name, e);
            emit_progress(app, tool_name, "error", e);
        }
    }
    result
}

pub fn update(tool_name: &str, app: &AppHandle) -> Result<String, String> {
    let config = tool_configs()
        .into_iter()
        .find(|c| c.name == tool_name)
        .ok_or_else(|| format!("Unknown tool: {}", tool_name))?;

    println!("[Deps:Manager] Updating {}", tool_name);

    let result = match detect() {
        #[cfg(target_os = "windows")]
        Platform::Windows => platform::windows::update_tool(config.winget_id, tool_name, app),
        #[cfg(target_os = "linux")]
        Platform::Linux => platform::linux::update_tool(config.apt_package, tool_name, app),
        _ => Err("Unsupported platform".to_string()),
    };

    match &result {
        Ok(msg) => println!("[Deps:Manager] {} update OK: {}", tool_name, msg),
        Err(e) => {
            println!("[Deps:Manager] {} update FAILED: {}", tool_name, e);
            emit_progress(app, tool_name, "error", e);
        }
    }
    result
}

pub fn run_startup_ytdlp_update(app: &AppHandle) {
    println!("[Deps:Manager] Running startup yt-dlp -U...");
    emit_progress(app, "yt-dlp", "update", "Checking for yt-dlp updates...");

    let result = std::process::Command::new("yt-dlp")
        .args(["-U"])
        .output();

    match result {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let stderr = String::from_utf8_lossy(&output.stderr);
            let combined = format!("{}{}", stdout, stderr);
            println!("[Deps:Manager] yt-dlp -U: {}", combined.trim());
            emit_progress(app, "yt-dlp", "done", combined.trim());
        }
        Err(e) => {
            println!("[Deps:Manager] yt-dlp -U failed: {}", e);
            emit_progress(app, "yt-dlp", "done", "yt-dlp not found, skipping update check");
        }
    }
}
