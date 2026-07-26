// src-tauri/src/commands/deps/progress.rs
// Dependency progress event types and emitter for real-time frontend logging

use tauri::{AppHandle, Emitter};

#[derive(serde::Serialize, Clone)]
pub struct DepProgress {
    pub tool: String,
    pub step: String,
    pub message: String,
}

/// Emit a progress event to the frontend for real-time status updates.
/// Steps: "download", "extract", "collect", "update", "done", "skip", "error"
pub fn emit_progress(handle: &AppHandle, tool: &str, step: &str, message: &str) {
    let _ = handle.emit(
        "dep-progress",
        DepProgress {
            tool: tool.to_string(),
            step: step.to_string(),
            message: message.to_string(),
        },
    );
}
