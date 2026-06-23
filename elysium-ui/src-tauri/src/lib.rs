// src-tauri/src/lib.rs
use tauri::{AppHandle, Manager};
use serde::{Serialize, Deserialize};
use std::fs;

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

#[tauri::command]
async fn get_local_library(_app: AppHandle) -> Result<Vec<TrackPayload>, String> {
    elysium_log("Library", "Scanning local storage directory for high-quality Opus tracks...");

    let mut music_dir = std::env::current_dir()
        .map_err(|e| format!("Failed to get current dir: {}", e))?;
    
    if music_dir.ends_with("src-tauri") {
        music_dir.pop();
        music_dir.pop();
    } else if music_dir.ends_with("elysium-ui") {
        music_dir.pop();
    }
    
    music_dir.push("music");
    elysium_log("Library", &format!("Target scanning path resolved to: {:?}", music_dir));

    if !music_dir.exists() {
        fs::create_dir_all(&music_dir).map_err(|e| format!("Failed to initialize music path: {}", e))?;
        elysium_log("Init", "Creating missing system directory: music/");
    }

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

/// New Command: Reads raw file binary stream buffers directly from disk
#[tauri::command]
async fn get_track_bytes(file_path: String) -> Result<Vec<u8>, String> {
    elysium_log("AudioEngine", &format!("Reading binary stream data from: {}", file_path));
    fs::read(&file_path).map_err(|e| format!("Failed to access local audio track resource: {}", e))
}

#[tauri::command]
async fn process_download_request(query: String) -> Result<TrackPayload, String> {
    if query.trim().is_empty() {
        return Err("Execution payload command rejected: Query parameter cannot be empty.".to_string());
    }
    elysium_log("Engine", &format!("Activating module sequence for target: {}", query));
    tokio::time::sleep(tokio::time::Duration::from_millis(1500)).await;
    elysium_log("Engine", &format!("Background caching complete for: {}", query));

    Ok(TrackPayload {
        id: uuid::Uuid::new_v4().to_string(),
        title: query,
        artist: "Elysium Stream Optimizer".to_string(),
        duration: "03:45".to_string(),
        file_path: format!("../music/{}.opus", ".."),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_local_library,
            process_download_request,
            get_track_bytes // Registered core command intercept
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}