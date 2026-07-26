// src-tauri/src/deps/checker.rs
// Checks whether dependency tools are available — locally in deps dir or on system PATH.
// find_on_path() resolves via paths::resolve_path (deps dir first, then system PATH).

use super::{config, downloader, logger, paths, progress};
use config::ToolDefinition;
use tauri::AppHandle;

pub fn is_available_locally(tool: &ToolDefinition) -> bool {
    paths::binary_path(tool).exists()
}

pub fn find_on_path(name: &str) -> Option<String> {
    paths::resolve_path(name)
}

pub fn is_available(tool: &ToolDefinition) -> bool {
    if is_available_locally(tool) {
        return true;
    }
    find_on_path(config::binary_name_for(tool)).is_some()
}

pub fn check_all() -> Vec<(String, bool)> {
    config::get_tool_definitions()
        .iter()
        .map(|t| {
            let ok = is_available(t);
            (t.name.to_string(), ok)
        })
        .collect()
}

pub fn missing_tools() -> Vec<ToolDefinition> {
    config::get_tool_definitions()
        .into_iter()
        .filter(|t| !is_available(t))
        .collect()
}

pub async fn run_dependency_sync(app: &AppHandle) {
    let tools = config::get_tool_definitions();
    let total = tools.len() as f64;

    progress::emit_progress(app, "all", 0.0, "Checking dependencies...");
    logger::info("Starting dependency sync...");

    for (i, tool) in tools.iter().enumerate() {
        let base = (i as f64 / total) * 80.0;
        progress::emit_progress(app, tool.name, base, &format!("Checking {}...", tool.name));

        if is_available(tool) {
            progress::emit_progress(app, tool.name, base + 20.0, &format!("{} found", tool.name));
            logger::info(&format!("{}: OK", tool.name));
        } else {
            progress::emit_progress(app, tool.name, base, &format!("{} missing, downloading...", tool.name));
            logger::info(&format!("{}: MISSING, downloading...", tool.name));
            match downloader::download_and_install(tool, app).await {
                Ok(msg) => logger::info(&msg),
                Err(e) => {
                    logger::error(&format!("Install {} failed: {}", tool.name, e));
                    progress::emit_progress(app, tool.name, base, &format!("Failed: {}", e));
                }
            }
        }
    }

    progress::emit_progress(app, "all", 100.0, "All dependencies ready");
    logger::info("Dependency sync complete");
}
