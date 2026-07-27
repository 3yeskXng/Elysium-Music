// src-tauri/src/commands/file_ops.rs
use std::fs;
use std::path::Path;

#[tauri::command]
pub async fn get_track_bytes(file_path: String) -> Result<Vec<u8>, String> {
    println!("=== RUST IPC: get_track_bytes === path={}", file_path);
    fs::read(&file_path).map_err(|e| format!("Failed to read file '{}': {}", file_path, e))
}

#[tauri::command]
pub async fn save_track(title: String, bytes: Vec<u8>) -> Result<String, String> {
    let music_dir = Path::new("music");
    fs::create_dir_all(music_dir).map_err(|e| format!("Failed to create music dir: {}", e))?;

    let file_name = format!("{}.opus", title);
    let file_path = music_dir.join(&file_name);

    fs::write(&file_path, bytes).map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(file_path.to_string_lossy().to_string())
}
