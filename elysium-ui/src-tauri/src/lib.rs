use tauri::Manager;
use std::process::Command;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        // HIER WIRD DAS BACKEND GESTARTET
        .setup(|app| {
            // 1. Holt sich den Pfad, wo Tauri die Ressourcen (deinen backend-Ordner) installiert hat
            let resource_path = app.path().resource_dir()
                .expect("Fehler beim Laden des Ressourcen-Verzeichnisses")
                .join("backend");

            // 2. Setzt den genauen Pfad zur app.js zusammen
            let backend_entry = resource_path.join("app.js");

            // 3. Startet 'node backend/app.js' unsichtbar im Hintergrund
            Command::new("node")
                .arg(backend_entry)
                .spawn()
                .expect("Node-Backend konnte nicht gestartet werden");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}