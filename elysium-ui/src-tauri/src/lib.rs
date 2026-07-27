// src-tauri/src/lib.rs
pub mod models;
pub mod commands;
pub mod deps;
pub mod playlists;
pub mod lyrics;

use commands::scanner::scan_local_library;
use commands::download::download_youtube;
use commands::file_ops::{get_track_bytes, save_track};
use commands::metadata::search_youtube_metadata;
use commands::cache::{cache_store_file, cache_get_file, cache_get_size, cache_evict};
use deps::{check_all_deps, install_dep, update_dep, restart_app};
use playlists::commands::{
    get_playlists, create_playlist, delete_playlist, rename_playlist,
    add_song_to_playlist, remove_song_from_playlist,
};
use lyrics::commands::{read_lrc_file, read_embedded_lyrics, read_custom_lyrics, write_custom_lyrics};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(deps::init(handle));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            scan_local_library,
            download_youtube,
            search_youtube_metadata,
            get_track_bytes,
            save_track,
            cache_store_file,
            cache_get_file,
            cache_get_size,
            cache_evict,
            check_all_deps,
            install_dep,
            update_dep,
            restart_app,
            get_playlists,
            create_playlist,
            delete_playlist,
            rename_playlist,
            add_song_to_playlist,
            remove_song_from_playlist,
            read_lrc_file,
            read_embedded_lyrics,
            read_custom_lyrics,
            write_custom_lyrics
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
