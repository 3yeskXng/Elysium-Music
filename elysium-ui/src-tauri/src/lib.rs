// src-tauri/src/lib.rs
pub mod models;
pub mod commands;

use commands::scanner::scan_local_library;
use commands::download::download_youtube;
use commands::file_ops::{get_track_bytes, save_track};
use commands::dependency_manager::{check_yt_dlp, install_yt_dlp};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            scan_local_library,
            download_youtube,
            get_track_bytes,
            save_track,
            check_yt_dlp,
            install_yt_dlp
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
