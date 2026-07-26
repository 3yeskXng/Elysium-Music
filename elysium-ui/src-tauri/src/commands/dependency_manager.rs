// src-tauri/src/commands/dependency_manager.rs
// Cross-platform dependency checker and installer for yt-dlp

use std::fs;
use std::process::Command;

#[tauri::command]
pub async fn check_yt_dlp() -> Result<bool, String> {
    let which_cmd = if cfg!(target_os = "windows") { "where" } else { "which" };
    let output = Command::new(which_cmd).arg("yt-dlp").output();
    match output {
        Ok(o) => Ok(o.status.success()),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
pub async fn install_yt_dlp() -> Result<String, String> {
    let tools_dir = "tools";
    fs::create_dir_all(tools_dir).map_err(|e| format!("Create tools dir failed: {}", e))?;

    let (url, filename) = if cfg!(target_os = "windows") {
        (
            "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe",
            "tools/yt-dlp.exe",
        )
    } else {
        (
            "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp",
            "tools/yt-dlp",
        )
    };

    let output = if cfg!(target_os = "windows") {
        let ps_script = format!("Invoke-WebRequest -Uri '{}' -OutFile '{}'", url, filename);
        Command::new("powershell")
            .args(["-Command", &ps_script])
            .output()
    } else {
        Command::new("curl")
            .args(["-L", "-o", filename, url, "--silent", "--show-error"])
            .output()
    };

    let result = output.map_err(|e| format!("Download command failed: {}", e))?;
    if !result.status.success() {
        let stderr = String::from_utf8_lossy(&result.stderr);
        return Err(format!("Download failed: {}", stderr.trim()));
    }

    if !cfg!(target_os = "windows") {
        let _ = Command::new("chmod").args(["+x", filename]).output();
    }

    Ok(filename.to_string())
}
