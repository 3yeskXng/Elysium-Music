// src-tauri/src/lib.rs
pub mod models;
pub mod commands;
pub mod deps;

use commands::scanner::scan_local_library;
use commands::download::download_youtube;
use commands::file_ops::{get_track_bytes, save_track};
use commands::deps::{
    check_yt_dlp, install_yt_dlp, update_yt_dlp,
    check_ffmpeg, install_ffmpeg,
    check_ffprobe, install_ffprobe,
    check_all_dependencies, restart_app,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle().clone();

            let log_dir = deps::logger::get_log_directory();
            deps::logger::init(log_dir, handle.clone());
            deps::logger::info("Elysium dependency system initialized");

            tauri::async_runtime::spawn(async {
                deps::ensure_all_tools().await;
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
            check_all_dependencies,
            restart_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
