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
        // HIER IST DER KUGELSICHERE START
        .setup(|app| {
            // 1. Sicheres Auflösen des Ressourcen-Pfads ohne .expect()
            let resource_path = match app.path().resource_dir() {
                Ok(path) => path.join("backend"),
                Err(e) => {
                    eprintln!("[Elysium Rust] Fehler: Ressourcen-Verzeichnis nicht gefunden: {:?}", e);
                    return Ok(()); // Beendet das Setup sauber, App stürzt nicht ab
                }
            };

            let backend_entry = resource_path.join("app.js");

            // 2. Prüfen, ob die Datei dort wirklich existiert
            if !backend_entry.exists() {
                eprintln!("[Elysium Rust] Fehler: app.js existiert nicht unter: {:?}", backend_entry);
                return Ok(()); // App bleibt offen, Core bleibt halt offline
            }

            // 3. Node starten ohne abzustürzen (match statt .expect)
            match Command::new("node").arg(&backend_entry).spawn() {
                Ok(_) => {
                    println!("[Elysium Rust] Node-Backend wurde im Hintergrund gestartet.");
                }
                Err(e) => {
                    eprintln!("[Elysium Rust] Kritisch: 'node' konnte nicht ausgeführt werden. Fehler: {:?}", e);
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}