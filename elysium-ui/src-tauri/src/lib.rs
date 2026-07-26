// src-tauri/src/lib.rs
pub mod models;
pub mod commands;
pub mod deps;

use commands::scanner::scan_local_library;
use commands::download::download_youtube;
use commands::file_ops::{get_track_bytes, save_track};
use deps::{check_all_deps, install_dep, update_dep, restart_app};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(deps::init(handle));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            scan_local_library,
            download_youtube,
            get_track_bytes,
            save_track,
            check_all_deps,
            install_dep,
            update_dep,
            restart_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
