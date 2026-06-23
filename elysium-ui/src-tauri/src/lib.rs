// src-tauri/src/lib.rs
use tauri::AppHandle;
use serde::{Serialize, Deserialize};
use std::fs;
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Clone)]
pub struct TrackPayload {
    id: String,
    title: String,
    artist: String,
    duration: String,
    file_path: String,
}

fn elysium_log(module: &str, message: &str) {
    println!("[Elysium Engine] ⚙️ [{}] {}", module, message);
}

/// Resolves and ensures existence of the root music repository execution context
fn get_music_dir() -> Result<PathBuf, String> {
    let mut music_dir = std::env::current_dir()
        .map_err(|e| format!("Failed to resolve runtime workspace: {}", e))?;
    
    if music_dir.ends_with("src-tauri") {
        music_dir.pop();
        music_dir.pop();
    } else if music_dir.ends_with("elysium-ui") {
        music_dir.pop();
    }
    
    music_dir.push("music");
    
    if !music_dir.exists() {
        fs::create_dir_all(&music_dir).map_err(|e| format!("Failed to auto-create music directory matrix: {}", e))?;
        elysium_log("Init", "Successfully generated missing music/ storage matrix folder.");
    }
    Ok(music_dir)
}

#[tauri::command]
async fn get_local_library() -> Result<Vec<TrackPayload>, String> {
    elysium_log("Library", "Scanning local storage directory for high-quality Opus tracks...");
    let music_dir = get_music_dir()?;
    let mut tracks = Vec::new();

    if let Ok(entries) = fs::read_dir(music_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("opus") {
                let file_name = path.file_stem().and_then(|s| s.to_str()).unwrap_or("Unknown Track").to_string();
                
                tracks.push(TrackPayload {
                    id: uuid::Uuid::new_v4().to_string(),
                    title: file_name,
                    artist: "Local Storage Asset".to_string(),
                    duration: "--:--".to_string(),
                    file_path: path.to_string_lossy().into_owned(),
                });
            }
        }
    }

    elysium_log("Library", &format!("📦 Scan complete. Local files matched: {}", tracks.len()));
    Ok(tracks)
}

#[tauri::command]
async fn get_track_bytes(file_path: String) -> Result<Vec<u8>, String> {
    fs::read(&file_path).map_err(|e| format!("Failed to access local audio track resource: {}", e))
}

/// Global dynamic write interface: saves raw byte arrays safely as an isolated audio file
#[tauri::command]
async fn save_track(title: String, bytes: Vec<u8>) -> Result<TrackPayload, String> {
    let mut music_dir = get_music_dir()?;
    
    // Normalize string naming patterns to prevent operating system path crashes
    let safe_title = title.replace(|c: char| !c.is_alphanumeric() && c != ' ' && c != '-' && c != '_', "");
    music_dir.push(format!("{}.opus", safe_title));
    
    fs::write(&music_dir, bytes).map_err(|e| format!("Failed to write track to storage matrix: {}", e))?;
    elysium_log("Downloader", &format!("Successfully saved high-fidelity asset to disk: {:?}", music_dir));

    Ok(TrackPayload {
        id: uuid::Uuid::new_v4().to_string(),
        title: safe_title,
        artist: "Elysium Audio Pipeline".to_string(),
        duration: "03:15".to_string(),
        file_path: music_dir.to_string_lossy().into_owned(),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_local_library,
            get_track_bytes,
            save_track
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}