// src-tauri/src/commands/dependency_manager.rs
// Cross-platform dependency checker, installer, and updater for yt-dlp, ffmpeg, ffprobe

use std::fs;
use std::process::Command;

fn find_in_path(tool: &str) -> Option<String> {
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

fn find_in_local_tools(tool: &str) -> Option<String> {
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

fn find_tool(tool: &str) -> Option<String> {
    find_in_path(tool).or_else(|| find_in_local_tools(tool))
}

pub fn find_tool_static(tool: &str) -> Option<String> {
    find_tool(tool)
}

#[derive(serde::Serialize)]
pub struct DependencyStatus {
    pub ytdlp: bool,
    pub ffmpeg: bool,
    pub ffprobe: bool,
}

#[tauri::command]
pub async fn check_yt_dlp() -> Result<bool, String> {
    Ok(find_tool("yt-dlp").is_some())
}

#[tauri::command]
pub async fn check_ffmpeg() -> Result<bool, String> {
    Ok(find_tool("ffmpeg").is_some())
}

#[tauri::command]
pub async fn check_ffprobe() -> Result<bool, String> {
    Ok(find_tool("ffprobe").is_some())
}

#[tauri::command]
pub async fn check_all_dependencies() -> Result<DependencyStatus, String> {
    Ok(DependencyStatus {
        ytdlp: find_tool("yt-dlp").is_some(),
        ffmpeg: find_tool("ffmpeg").is_some(),
        ffprobe: find_tool("ffprobe").is_some(),
    })
}

fn tools_dir() -> Result<String, String> {
    let dir = "tools";
    fs::create_dir_all(dir).map_err(|e| format!("Create tools dir failed: {}", e))?;
    Ok(dir.to_string())
}

#[tauri::command]
pub async fn install_yt_dlp() -> Result<String, String> {
    let dir = tools_dir()?;
    let (url, filename) = if cfg!(target_os = "windows") {
        (
            "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe",
            format!("{}\\yt-dlp.exe", dir),
        )
    } else {
        (
            "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp",
            format!("{}/yt-dlp", dir),
        )
    };

    download_file(&url, &filename)?;
    make_executable(&filename);
    Ok(filename)
}

#[tauri::command]
pub async fn update_yt_dlp() -> Result<String, String> {
    let yt_dlp = find_tool("yt-dlp").ok_or("yt-dlp not found")?;
    let output = Command::new(&yt_dlp)
        .args(["-U"])
        .output()
        .map_err(|e| format!("Failed to run yt-dlp -U: {}", e))?;
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let combined = format!("{}{}", stdout, stderr);
    if output.status.success() || combined.contains("up to date") || combined.contains("Updated") {
        Ok(combined.trim().to_string())
    } else {
        Err(combined.trim().to_string())
    }
}

#[tauri::command]
pub async fn install_ffmpeg() -> Result<String, String> {
    let dir = tools_dir()?;
    if cfg!(target_os = "windows") {
        let zip_path = format!("{}\\ffmpeg.zip", dir);
        let url = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip";
        download_file(url, &zip_path)?;
        extract_ffmpeg_windows(&zip_path, &dir)?;
        let _ = fs::remove_file(&zip_path);
    } else {
        let tar_path = format!("{}/ffmpeg.tar.xz", dir);
        let url = "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz";
        download_file(url, &tar_path)?;
        extract_ffmpeg_linux(&tar_path, &dir)?;
        let _ = fs::remove_file(&tar_path);
    }
    Ok("ffmpeg installed".to_string())
}

#[tauri::command]
pub async fn install_ffprobe() -> Result<String, String> {
    let dir = tools_dir()?;
    if cfg!(target_os = "windows") {
        let zip_path = format!("{}\\ffmpeg.zip", dir);
        if !std::path::Path::new(&zip_path).exists() {
            let url = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip";
            download_file(url, &zip_path)?;
        }
        extract_ffmpeg_windows(&zip_path, &dir)?;
        let _ = fs::remove_file(&zip_path);
    } else {
        let tar_path = format!("{}/ffmpeg.tar.xz", dir);
        if !std::path::Path::new(&tar_path).exists() {
            let url = "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz";
            download_file(url, &tar_path)?;
        }
        extract_ffmpeg_linux(&tar_path, &dir)?;
        let _ = fs::remove_file(&tar_path);
    }
    Ok("ffprobe installed".to_string())
}

fn download_file(url: &str, dest: &str) -> Result<(), String> {
    let output = if cfg!(target_os = "windows") {
        let ps_script = format!(
            "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '{}' -OutFile '{}' -UseBasicParsing",
            url, dest
        );
        Command::new("powershell")
            .args(["-Command", &ps_script])
            .output()
    } else {
        Command::new("curl")
            .args(["-L", "-o", dest, url, "--silent", "--show-error", "--fail"])
            .output()
    };
    let result = output.map_err(|e| format!("Download command failed: {}", e))?;
    if !result.status.success() {
        let stderr = String::from_utf8_lossy(&result.stderr);
        return Err(format!("Download failed: {}", stderr.trim()));
    }
    Ok(())
}

fn make_executable(path: &str) {
    if !cfg!(target_os = "windows") {
        let _ = Command::new("chmod").args(["+x", path]).output();
    }
}

fn extract_ffmpeg_windows(zip_path: &str, dest_dir: &str) -> Result<(), String> {
    let ps_script = format!(
        "Expand-Archive -Path '{}' -DestinationPath '{}' -Force",
        zip_path, dest_dir
    );
    let output = Command::new("powershell")
        .args(["-Command", &ps_script])
        .output()
        .map_err(|e| format!("Extract failed: {}", e))?;
    if !output.status.success() {
        return Err("Failed to extract ffmpeg zip".to_string());
    }
    move_binaries_from_subdir(dest_dir, "ffmpeg")
}

fn extract_ffmpeg_linux(tar_path: &str, dest_dir: &str) -> Result<(), String> {
    let output = Command::new("tar")
        .args(["-xf", tar_path, "-C", dest_dir, "--strip-components=1"])
        .output()
        .map_err(|e| format!("Extract failed: {}", e))?;
    if !output.status.success() {
        return Err("Failed to extract ffmpeg tar.xz".to_string());
    }
    make_executable(&format!("{}/ffmpeg", dest_dir));
    make_executable(&format!("{}/ffprobe", dest_dir));
    Ok(())
}

fn move_binaries_from_subdir(dest_dir: &str, _name: &str) -> Result<(), String> {
    if let Ok(entries) = fs::read_dir(dest_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let bin_name = if cfg!(target_os = "windows") {
                    "ffmpeg.exe"
                } else {
                    "ffmpeg"
                };
                let src = path.join("bin").join(bin_name);
                if src.exists() {
                    let _ = fs::copy(&src, std::path::Path::new(dest_dir).join(bin_name));
                    let probe_src = path.join("bin").join(if cfg!(target_os = "windows") {
                        "ffprobe.exe"
                    } else {
                        "ffprobe"
                    });
                    if probe_src.exists() {
                        let _ = fs::copy(
                            &probe_src,
                            std::path::Path::new(dest_dir).join(if cfg!(target_os = "windows") {
                                "ffprobe.exe"
                            } else {
                                "ffprobe"
                            }),
                        );
                    }
                }
            }
        }
    }
    Ok(())
}
