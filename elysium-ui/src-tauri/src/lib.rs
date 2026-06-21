use tauri::Manager;
use std::process::{Command, Stdio};
use std::fs::File;

// Import the Windows-specific extension trait for processes
#[cfg(windows)]
use std::os::windows::process::CommandExt;

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
        .setup(|app| {
            use tauri::path::BaseDirectory;
            use std::io::Write;

            // 1. Log-Ordner im AppData-Verzeichnis bestimmen
            let log_dir = match app.path().app_local_data_dir() {
                Ok(path) => {
                    let _ = std::fs::create_dir_all(&path);
                    path
                },
                Err(_) => std::env::temp_dir(),
            };
            let log_file_path = log_dir.join("backend_debug.log");
            
            // Log-Datei öffnen
            let mut log_file = File::create(&log_file_path).expect("Logdatei Fehler");

            let _ = writeln!(log_file, "[Elysium Log] --- App-Setup wurde gestartet ---");

            // 2. Pfade über die offizielle Tauri v2 Resolve-API auflösen
            let backend_entry = match app.path().resolve("../backend/app.js", BaseDirectory::Resource) {
                Ok(path) => path,
                Err(e) => {
                    let _ = writeln!(log_file, "[Elysium Log] Fehler beim Auflösen von app.js: {:?}", e);
                    return Ok(());
                }
            };

            let resource_path = match app.path().resolve("../backend", BaseDirectory::Resource) {
                Ok(path) => path,
                Err(e) => {
                    let _ = writeln!(log_file, "[Elysium Log] Fehler beim Auflösen des Ordners: {:?}", e);
                    return Ok(());
                }
            };

            let node_executable = resource_path.join("node.exe");

            // 🌟 NEU: Das Windows UNC-Präfix "\\?\" entfernen, weil Node.js sonst abstürzt!
            let clean_backend_entry = backend_entry.to_string_lossy().replace(r#"\\?\"#, "");
            let clean_resource_path = resource_path.to_string_lossy().replace(r#"\\?\"#, "");
            let clean_node_executable = node_executable.to_string_lossy().replace(r#"\\?\"#, "");

            let _ = writeln!(log_file, "[Elysium Log] Gesuchter Pfad zu app.js: {:?}", clean_backend_entry);
            let _ = writeln!(log_file, "[Elysium Log] Gesuchter Pfad zu node.exe: {:?}", clean_node_executable);
            let _ = writeln!(log_file, "[Elysium Log] Existiert node.exe? {}", node_executable.exists());

            if !node_executable.exists() {
                let _ = writeln!(log_file, "[Elysium Log] ABBRUCH: node.exe existiert nicht.");
                return Ok(());
            }

            let _ = writeln!(log_file, "[Elysium Log] Starte Node-Prozess jetzt über integrierte node.exe...");

            // Klonen der Datei-Handles für stdout und stderr
            let stdout_file = match log_file.try_clone() {
                Ok(f) => f,
                Err(_) => return Ok(()),
            };
            let stderr_file = match log_file.try_clone() {
                Ok(f) => f,
                Err(_) => return Ok(()),
            };

            // 3. Node-Prozess vorbereiten – Jetzt mit den BEREINIGTEN Pfaden!
            let mut command = Command::new(&clean_node_executable);
            
            // Injects the Win32 windowless creation flag if compiling target is Windows
            #[cfg(windows)]
            command.creation_flags(0x08000000);

            command.arg(&clean_backend_entry)
                   .current_dir(&clean_resource_path)
                   .stdout(Stdio::from(stdout_file))
                   .stderr(Stdio::from(stderr_file));

            // 4. Node starten
            match command.spawn() {
                Ok(_) => {
                    let _ = writeln!(log_file, "[Elysium Log] Prozess erfolgreich gestartet! Ab hier übernimmt Node.");
                }
                Err(e) => {
                    if let Ok(mut panic_file) = File::create(log_dir.join("backend_spawn_error.txt")) {
                        let _ = writeln!(panic_file, "Kritischer Fehler: Integrierte node.exe konnte nicht ausgeführt werden.\nDetails: {:?}", e);
                    }
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Kleine Hilfsfunktion für den absoluten Notfall-Log
fn json_utils_or_write_failed(f: &mut File, e: std::io::Error) -> std::io::Result<()> {
    use std::io::Write;
    writeln!(f, "Kritischer Fehler: Windows konnte den 'node' Befehl nicht ausführen.")?;
    writeln!(f, "Möglicher Grund: Node.js ist im System-PATH nicht verfügbar.")?;
    writeln!(f, "Details: {:?}", e)
}