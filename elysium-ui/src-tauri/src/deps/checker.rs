// src-tauri/src/deps/checker.rs
// Checks whether dependency tools are available — locally in deps dir or on system PATH.

use super::{config, logger, paths};
use config::ToolDefinition;

pub fn is_available_locally(tool: &ToolDefinition) -> bool {
    paths::binary_path(tool).exists()
}

pub fn find_on_path(name: &str) -> Option<String> {
    let cmd = if cfg!(target_os = "windows") { "where" } else { "which" };
    let mut command = std::process::Command::new(cmd);
    command.arg(name);

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x08000000);
    }

    command
        .output()
        .ok()
        .and_then(|o| {
            if o.status.success() {
                let stdout = String::from_utf8_lossy(&o.stdout);
                stdout.lines().next().map(|s| s.trim().to_string())
            } else {
                None
            }
        })
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
            logger::info(&format!(
                "Check {}: {}",
                t.name,
                if ok { "OK" } else { "MISSING" }
            ));
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
