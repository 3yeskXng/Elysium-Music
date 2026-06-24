// src-tauri/src/lib.rs
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;
use serde::{Serialize, Deserialize};
use std::fs;
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Clone)]
pub struct TrackPayload {
    id: String,
    title: String,
    artist: String,
    duration: String,
    #[serde(rename = "durationSecs")]
    duration_secs: u32,
    #[serde(rename = "duration_secs")]
    duration_secs_snake: u32,
    file_path: String,
    #[serde(rename = "filePath")]
    filePath: String,
    album: String,
    #[serde(rename = "coverUrl")]
    cover_url_camel: String,
    #[serde(rename = "cover_url")]
    cover_url_snake: String,
}

fn elysium_log(module: &str, message: &str) {
    println!("[Elysium Engine] ⚙️ [{}] {}", module, message);
}

fn sanitize_filename(name: &str) -> String {
    name.chars()
        .filter(|&c| !r#"<>:"/\|?*"#.contains(c))
        .collect::<String>()
        .trim()
        .to_string()
}

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
        fs::create_dir_all(&music_dir).map_err(|e| format!("Failed to auto-create music directory: {}", e))?;
        elysium_log("Init", "Successfully generated missing music/ folder.");
    }
    Ok(music_dir)
}

#[tauri::command]
async fn get_local_library() -> Result<Vec<TrackPayload>, String> {
    elysium_log("Library", "Scanning local storage directory for audio tracks...");
    let music_dir = get_music_dir()?;
    let mut tracks = Vec::new();

    if let Ok(entries) = fs::read_dir(music_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
                    let ext_lower = ext.to_lowercase();
                    if ext_lower == "opus" || ext_lower == "webm" || ext_lower == "mp3" || ext_lower == "m4a" {
                        let file_name = path.file_stem().and_then(|s| s.to_str()).unwrap_or("Unknown Track").to_string();
                        
                        let parts: Vec<&str> = file_name.splitn(2, " - ").collect();
                        let (artist, title) = if parts.len() == 2 {
                            (parts[0].to_string(), parts[1].to_string())
                        } else {
                            ("YouTube Stream".to_string(), file_name.to_string())
                        };
                        
                        let path_str = path.to_string_lossy().into_owned();
                        
                        tracks.push(TrackPayload {
                            id: uuid::Uuid::new_v4().to_string(),
                            title,
                            artist,
                            duration: "03:30".to_string(), 
                            duration_secs: 210,
                            duration_secs_snake: 210,
                            file_path: path_str.clone(),
                            filePath: path_str,
                            album: "Elysium Archive".to_string(),
                            cover_url_camel: "".to_string(),
                            cover_url_snake: "".to_string(),
                        });
                    }
                }
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

#[tauri::command]
async fn save_track(title: String, bytes: Vec<u8>) -> Result<TrackPayload, String> {
    let mut music_dir = get_music_dir()?;
    let safe_title = sanitize_filename(&title);
    music_dir.push(format!("{}.webm", safe_title));
    
    fs::write(&music_dir, bytes).map_err(|e| format!("Failed to write track to storage: {}", e))?;
    
    let parts: Vec<&str> = safe_title.splitn(2, " - ").collect();
    let (artist, track_title) = if parts.len() == 2 {
        (parts[0].to_string(), parts[1].to_string())
    } else {
        ("Imported Asset".to_string(), safe_title.clone())
    };

    let path_str = music_dir.to_string_lossy().into_owned();

    Ok(TrackPayload {
        id: uuid::Uuid::new_v4().to_string(),
        title: track_title,
        artist,
        duration: "03:30".to_string(),
        duration_secs: 210,
        duration_secs_snake: 210,
        file_path: path_str.clone(),
        filePath: path_str,
        album: "Elysium Archive".to_string(),
        cover_url_camel: "".to_string(),
        cover_url_snake: "".to_string(),
    })
}

#[tauri::command]
async fn download_youtube(_app: AppHandle, query: String) -> Result<TrackPayload, String> {
    elysium_log("Downloader", &format!("Fetching metadata from YouTube for: {}", query));
    let music_dir = get_music_dir()?;
    let shell = _app.shell();

    let meta_output = shell
        .command("yt-dlp")
        .args([
            "--skip-download",
            "--no-warnings",
            "--ignore-errors",
            "--print", "%(title)s|||%(uploader)s|||%(duration)s",
            &format!("ytsearch1:{}", query),
        ])
        .output()
        .await
        .map_err(|e| format!("Failed to execute metadata sequence: {}", e))?;

    let meta_str = String::from_utf8_lossy(&meta_output.stdout);
    let mut raw_title = query.clone();
    let mut raw_artist = "YouTube Stream".to_string();
    let mut duration_str = "03:30".to_string();
    let mut secs_u32 = 210;

    if meta_output.status.success() && !meta_str.trim().is_empty() {
        let parts: Vec<&str> = meta_str.trim().split("|||").collect();
        if parts.len() == 3 {
            raw_title = parts[0].to_string();
            raw_artist = parts[1].to_string();
            if let Ok(secs) = parts[2].parse::<u32>() {
                secs_u32 = secs;
                duration_str = format!("{:02}:{:02}", secs / 60, secs % 60);
            }
        }
    }

    let clean_artist = sanitize_filename(&raw_artist);
    let clean_title = sanitize_filename(&raw_title);
    let file_base_name = format!("{} - {}", clean_artist, clean_title);

    let temp_output_template = music_dir.join(format!("{}.%(ext)s", file_base_name));

    elysium_log("Downloader", &format!("Downloading audio stream for: {}", file_base_name));

    let download_output = shell
        .command("yt-dlp")
        .args([
            "-f", "251/bestaudio[acodec=opus]/bestaudio",
            "--no-playlist",
            "--no-warnings",
            "--no-part",              // Verhindert .part-Dateien ohne ffprobe
            "--no-check-formats",     // Ignoriert ffprobe-Checks komplett
            "--ignore-errors",
            "--output", &temp_output_template.to_string_lossy(),
            &format!("ytsearch1:{}", query),
        ])
        .output()
        .await
        .map_err(|e| format!("Download pipeline execution failed: {}", e))?;

    if !download_output.status.success() {
        let error_log = String::from_utf8_lossy(&download_output.stderr);
        elysium_log("Downloader", &format!("🔴 yt-dlp Core Error: {}", error_log));
    }

    let extensions = ["webm", "m4a", "opus", "ogg", "mp3"];
    let mut final_track_path = PathBuf::new();
    let mut found = false;

    for ext in extensions.iter() {
        let path = music_dir.join(format!("{}.{}", file_base_name, ext));
        if path.exists() {
            final_track_path = path;
            found = true;
            break;
        }
    }

    if !found {
        return Err("yt-dlp finished, but the audio asset could not be verified on disk.".to_string());
    }

    let path_str = final_track_path.to_string_lossy().into_owned();
    elysium_log("Downloader", &format!("🎯 Asset deployed successfully: {}", path_str));

    Ok(TrackPayload {
        id: uuid::Uuid::new_v4().to_string(),
        title: clean_title,
        artist: clean_artist,
        duration: duration_str,
        duration_secs: secs_u32,
        duration_secs_snake: secs_u32,
        file_path: path_str.clone(),
        filePath: path_str,
        album: "YouTube Release".to_string(),
        cover_url_camel: "".to_string(),
        cover_url_snake: "".to_string(),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_local_library,
            get_track_bytes,
            save_track,
            download_youtube
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}