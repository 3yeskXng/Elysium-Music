// src-tauri/src/lib.rs
pub mod models;
pub mod commands;

use commands::scanner::scan_local_library;
use commands::download::download_youtube;

// Use Tauri v2 mobile entry point conditional compilation flags if needed down the line
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init()) // Required core plugin for Tauri v2 CLI commands
        .invoke_handler(tauri::generate_handler![
            scan_local_library,
            download_youtube
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}