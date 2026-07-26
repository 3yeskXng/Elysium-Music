// src-tauri/src/deps/logger.rs
// Production-ready logging for dependency operations.
// Writes timestamped logs to file and emits live events to the frontend via Tauri events.

use chrono::Local;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use std::sync::{Mutex, OnceLock};
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, serde::Serialize)]
pub struct LogEventPayload {
    pub level: String,
    pub message: String,
    pub timestamp: String,
}

struct DepLogger {
    log_file_path: PathBuf,
    app_handle: AppHandle,
    file_mutex: Mutex<()>,
}

static LOGGER: OnceLock<DepLogger> = OnceLock::new();

impl DepLogger {
    fn write_entry(&self, level: &str, message: &str) {
        let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        let entry = format!("[{}] [{}] {}", timestamp, level, message);

        if let Ok(_guard) = self.file_mutex.lock() {
            if let Ok(mut file) = OpenOptions::new()
                .create(true)
                .append(true)
                .open(&self.log_file_path)
            {
                let _ = writeln!(file, "{}", entry);
            }
        }

        let _ = self.app_handle.emit(
            "dep-log-event",
            LogEventPayload {
                level: level.to_string(),
                message: message.to_string(),
                timestamp,
            },
        );
    }
}

/// Initialize the global dependency logger. Call once during Tauri app setup.
pub fn init(log_dir: PathBuf, app_handle: AppHandle) {
    fs::create_dir_all(&log_dir).ok();
    let log_file_path = log_dir.join("deps.log");
    LOGGER.get_or_init(|| DepLogger {
        log_file_path,
        app_handle,
        file_mutex: Mutex::new(()),
    });
}

pub fn info(message: &str) {
    if let Some(logger) = LOGGER.get() {
        logger.write_entry("INFO", message);
    }
}

pub fn warn(message: &str) {
    if let Some(logger) = LOGGER.get() {
        logger.write_entry("WARN", message);
    }
}

pub fn error(message: &str) {
    if let Some(logger) = LOGGER.get() {
        logger.write_entry("ERROR", message);
    }
}

/// Platform-appropriate directory for log files.
/// Windows: %APPDATA%/elysium/logs/ | Linux/macOS: ~/.local/share/elysium/logs/
pub fn get_log_directory() -> PathBuf {
    dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("elysium")
        .join("logs")
}
