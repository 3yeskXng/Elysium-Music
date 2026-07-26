// src-tauri/src/deps/progress.rs
// Progress event emitter for real-time frontend dependency status updates.

use tauri::{AppHandle, Emitter};

#[derive(serde::Serialize, Clone)]
pub struct DepProgress {
    pub tool: String,
    pub progress: f64,
    pub status: String,
}

pub fn emit_progress(app: &AppHandle, tool: &str, progress: f64, status: &str) {
    let _ = app.emit(
        "dep-progress",
        DepProgress {
            tool: tool.to_string(),
            progress,
            status: status.to_string(),
        },
    );
}
