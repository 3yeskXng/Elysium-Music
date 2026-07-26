// src-tauri/src/lib.rs
pub mod models;
pub mod commands;

use std::process::Command;
use tauri::Emitter;
use commands::scanner::scan_local_library;
use commands::download::download_youtube;
use commands::file_ops::{get_track_bytes, save_track};
use commands::dependency_manager::{
    check_yt_dlp, install_yt_dlp, update_yt_dlp,
    check_ffmpeg, install_ffmpeg,
    check_ffprobe, install_ffprobe,
    check_all_dependencies,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Some(path) = commands::dependency_manager::find_tool_static("yt-dlp") {
                    if let Ok(output) = Command::new(&path).args(["-U"]).output() {
                        let stdout = String::from_utf8_lossy(&output.stdout);
                        let stderr = String::from_utf8_lossy(&output.stderr);
                        let msg = if stdout.is_empty() { stderr.to_string() } else { stdout.to_string() };
                        let _ = handle.emit("elysium-log", msg.trim().to_string());
                    }
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            scan_local_library,
            download_youtube,
            get_track_bytes,
            save_track,
            check_yt_dlp,
            install_yt_dlp,
            update_yt_dlp,
            check_ffmpeg,
            install_ffmpeg,
            check_ffprobe,
            install_ffprobe,
            check_all_dependencies
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
