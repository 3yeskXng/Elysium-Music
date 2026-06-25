// src-tauri/src/lib.rs
pub mod models;
pub mod commands;

use commands::scanner::scan_local_library;
use commands::download::download_youtube;

#[cfg_with_tauri::mobile]
fn mobile_entry_point() {}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            scan_local_library,
            download_youtube
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}