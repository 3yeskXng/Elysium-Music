// src-tauri/src/deps/updater.rs
// Silent background updates for tools that support self-update (e.g., yt-dlp -U).

use super::{config, downloader, logger, paths, progress};
use config::ToolDefinition;
use tauri::AppHandle;

pub async fn update_tool(tool: &ToolDefinition, app: &AppHandle) -> Result<String, String> {
    if let Some(args) = tool.update_args {
        run_self_update(tool, args, app).await
    } else {
        logger::info(&format!("{} has no self-update, re-downloading", tool.name));
        downloader::download_and_install(tool, app).await
    }
}

async fn run_self_update(
    tool: &ToolDefinition,
    args: &[&str],
    app: &AppHandle,
) -> Result<String, String> {
    let binary = paths::binary_path(tool);
    if !binary.exists() {
        logger::warn(&format!("{} not installed, skipping update", tool.name));
        return Ok(format!("{} not installed, skipped", tool.name));
    }

    progress::emit_progress(app, tool.name, 50.0, &format!("{} {}...", tool.name, args.join(" ")));
    logger::info(&format!("Running {} {}...", tool.name, args.join(" ")));

    let binary_clone = binary.clone();
    let args_owned: Vec<String> = args.iter().map(|s| s.to_string()).collect();

    let output = tokio::task::spawn_blocking(move || {
        super::process::no_window_command(&binary_clone)
            .args(&args_owned)
            .output()
    })
    .await
    .map_err(|e| format!("Task join: {}", e))?
    .map_err(|e| format!("Spawn {}: {}", tool.name, e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let combined = format!("{}{}", stdout, stderr).trim().to_string();

    if output.status.success() {
        progress::emit_progress(app, tool.name, 100.0, &format!("{} updated", tool.name));
        logger::info(&format!("{} update: {}", tool.name, combined));
    } else {
        let code = output.status.code().unwrap_or(0);
        progress::emit_progress(app, tool.name, 100.0, &format!("{} update complete", tool.name));
        logger::warn(&format!("{} update exit {}: {}", tool.name, code, combined));
    }
    Ok(combined)
}

pub async fn check_and_update_all(app: &AppHandle) {
    let tools = config::get_tool_definitions();
    for tool in &tools {
        if tool.update_args.is_some() {
            if let Err(e) = update_tool(tool, app).await {
                logger::error(&format!("Update {} failed: {}", tool.name, e));
            }
        }
    }
}
