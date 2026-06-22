use tauri::Manager;
use std::process::{Command, Stdio};
use std::fs::File;
use std::path::PathBuf;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

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

            // 1. Initialize central logging system in AppData/Local or Temp
            let log_dir = app.path().app_local_data_dir().unwrap_or_else(|_| std::env::temp_dir());
            let _ = std::fs::create_dir_all(&log_dir);
            let log_file_path = log_dir.join("backend_debug.log");
            let mut log_file = File::create(&log_file_path).expect("Failed to initialize log file");

            let _ = writeln!(log_file, "[Elysium Core] --- Booting Core Subsystem ---");

            // 2. Resolve internal asset and deployment paths via Tauri v2 Lifecycle API
            let backend_entry = match app.path().resolve("../backend/app.js", BaseDirectory::Resource) {
                Ok(path) => path,
                Err(e) => {
                    let _ = writeln!(log_file, "[Elysium Core] CRITICAL: Failed to resolve app.js asset: {:?}", e);
                    return Ok(());
                }
            };

            let resource_path = match app.path().resolve("../backend", BaseDirectory::Resource) {
                Ok(path) => path,
                Err(e) => {
                    let _ = writeln!(log_file, "[Elysium Core] CRITICAL: Failed to resolve backend root directory: {:?}", e);
                    return Ok(());
                }
            };

            let i18n_path = resource_path.join("i18n.js");

            // 3. Determine OS-specific runtime binary names
            let node_binary_name = if cfg!(windows) { "node.exe" } else { "node" };
            let node_executable = resource_path.join(node_binary_name);

            // 4. Sanitize paths by stripping Windows UNC prefixes to maximize Node compatibility
            let clean_backend_entry = backend_entry.to_string_lossy().replace(r#"\\?\"#, "");
            let clean_resource_path = resource_path.to_string_lossy().replace(r#"\\?\"#, "");
            let mut clean_node_executable = node_executable.to_string_lossy().replace(r#"\\?\"#, "");

            // 5. SELF-HEALING & INTEGRITY CHECK
            let mut use_system_fallback = false;
            if !node_executable.exists() {
                let _ = writeln!(log_file, "[Elysium Core] WARNING: Bundled Sidecar node binary missing at target path.");
                let _ = writeln!(log_file, "[Elysium Core] TRIGGERING SELF-HEALING: Attempting global system fallback...");
                use_system_fallback = true;
                clean_node_executable = node_binary_name.to_string(); // Fallback to 'node' or 'node.exe' from PATH
            }

            // 6. POSIX COMPLIANCE: Native Linux/macOS executable permission enforcement (chmod +x)
            #[cfg(unix)]
            {
                if !use_system_fallback {
                    use std::os::unix::fs::PermissionsExt;
                    if let Ok(metadata) = std::fs::metadata(&clean_node_executable) {
                        let mut perms = metadata.permissions();
                        if perms.mode() & 0o111 != 0o111 {
                            let _ = writeln!(log_file, "[Elysium Core] Linux Permissions missing. Enforcing 0o755 execution bits.");
                            perms.set_mode(0o755);
                            if let Err(e) = std::fs::set_permissions(&clean_node_executable, perms) {
                                let _ = writeln!(log_file, "[Elysium Core] ERROR: Permission enforcement failed: {:?}", e);
                            }
                        }
                    }
                }
            }

            // 7. Clone active file handles for asynchronous pipeline tracing
            let stdout_file = log_file.try_clone().unwrap_or_else(|_| File::create(log_dir.join("stdout.log")).unwrap());
            let stderr_file = log_file.try_clone().unwrap_or_else(|_| File::create(log_dir.join("stderr.log")).unwrap());

            // 8. Configure Runtime Command Context
            let mut command = Command::new(&clean_node_executable);
            
            // Hide terminal spawn sequence on Windows machines
            #[cfg(windows)]
            command.creation_flags(0x08000000);

            // 9. INTERNATIONALIZATION (i18n) & SCOPE ENVIRONMENT INJECTION
            command.arg(&clean_backend_entry)
                   .current_dir(&clean_resource_path)
                   .stdout(Stdio::from(stdout_file))
                   .stderr(Stdio::from(stderr_file))
                   // Expose absolute path targeting i18n localization maps into runtime scope env
                   .env("ELYSIUM_I18N_FILE", i18n_path.to_string_lossy().replace(r#"\\?\"#, ""))
                   // Inherit host environmental properties (e.g., system language variables)
                   .env("LANG", std::env::var("LANG").unwrap_or_else(|_| "en_US.UTF-8".to_string()));

            // 10. Process execution deployment lifecycle
            match command.spawn() {
                Ok(_) => {
                    let _ = writeln!(log_file, "[Elysium Core] Backend deployment subsystem successfully established!");
                }
                Err(e) => {
                    let _ = writeln!(log_file, "[Elysium Core] FATAL: Deployment pipeline broken. Both Sidecar and Self-Healing contexts crashed.");
                    if let Ok(mut panic_file) = File::create(log_dir.join("backend_spawn_error.txt")) {
                        let _ = writeln!(panic_file, "Critical Runtime Exception: Node process failed allocation.\nDetails: {:?}", e);
                    }
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}