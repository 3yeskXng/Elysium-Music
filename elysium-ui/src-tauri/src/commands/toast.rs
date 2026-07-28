// src-tauri/src/commands/toast.rs
// Tauri command to emit toast events from Rust backend to the frontend

use serde::Serialize;
use tauri::Emitter;

#[derive(Debug, Clone, Serialize)]
pub struct ToastPayload {
    #[serde(rename = "type")]
    pub toast_type: String,
    pub title: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<u64>,
}

#[tauri::command]
pub fn emit_toast(
    app: tauri::AppHandle,
    toast_type: String,
    title: String,
    message: String,
    duration: Option<u64>,
) -> Result<(), String> {
    let payload = ToastPayload {
        toast_type,
        title,
        message,
        duration,
    };

    app.emit("elysium-toast", &payload)
        .map_err(|e| format!("Failed to emit toast event: {}", e))
}

/// Convenience helper for emitting info toasts from Rust code (not exposed to frontend)
pub fn emit_info_toast(app: &tauri::AppHandle, title: &str, message: &str) {
    let payload = ToastPayload {
        toast_type: "info".to_string(),
        title: title.to_string(),
        message: message.to_string(),
        duration: None,
    };
    let _ = app.emit("elysium-toast", &payload);
}

/// Convenience helper for emitting warning toasts from Rust code
pub fn emit_warning_toast(app: &tauri::AppHandle, title: &str, message: &str) {
    let payload = ToastPayload {
        toast_type: "warning".to_string(),
        title: title.to_string(),
        message: message.to_string(),
        duration: None,
    };
    let _ = app.emit("elysium-toast", &payload);
}

/// Convenience helper for emitting error toasts from Rust code
pub fn emit_error_toast(app: &tauri::AppHandle, title: &str, message: &str) {
    let payload = ToastPayload {
        toast_type: "error".to_string(),
        title: title.to_string(),
        message: message.to_string(),
        duration: None,
    };
    let _ = app.emit("elysium-toast", &payload);
}
