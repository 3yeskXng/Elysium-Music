// src-tauri/src/deps/downloader.rs
// Downloads missing dependency binaries via HTTPS, extracts archives, and sets permissions.

use super::{config, extract, logger, paths, progress};
use config::ToolDefinition;
use futures_util::StreamExt;
use std::fs;
use tauri::AppHandle;

pub async fn download_and_install(tool: &ToolDefinition, app: &AppHandle) -> Result<String, String> {
    let url = config::download_url_for(tool);
    let target = paths::binary_path(tool);
    let temp = paths::temp_file_for(tool.name);

    progress::emit_progress(app, tool.name, 5.0, "Preparing download...");
    paths::ensure_dirs()?;

    progress::emit_progress(app, tool.name, 10.0, &format!("Downloading {}...", tool.name));
    let bytes = fetch_bytes_with_progress(url, tool.name, app).await?;

    progress::emit_progress(app, tool.name, 70.0, &format!("Extracting {}...", tool.name));
    fs::write(&temp, &bytes).map_err(|e| format!("Write temp: {}", e))?;
    let archive = config::archive_type_from_url(url);
    extract::extract(&temp, &paths::deps_dir(), &target, archive)?;

    progress::emit_progress(app, tool.name, 90.0, "Setting permissions...");
    set_executable_permissions(&target)?;

    fs::remove_file(&temp).ok();
    progress::emit_progress(app, tool.name, 100.0, &format!("{} installed", tool.name));
    logger::info(&format!("{} installed successfully", tool.name));
    Ok(format!("{} installed", tool.name))
}

async fn fetch_bytes_with_progress(
    url: &str,
    tool_name: &str,
    app: &AppHandle,
) -> Result<Vec<u8>, String> {
    let client = reqwest::Client::builder()
        .build()
        .map_err(|e| format!("HTTP client: {}", e))?;
    let resp = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Request: {}", e))?;

    let total = resp.content_length().unwrap_or(0);
    let mut stream = resp.bytes_stream();
    let mut bytes = Vec::new();
    let mut downloaded: u64 = 0;

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Chunk: {}", e))?;
        bytes.extend_from_slice(&chunk);
        downloaded += chunk.len() as u64;
        if total > 0 {
            let pct = (downloaded as f64 / total as f64) * 60.0 + 10.0;
            progress::emit_progress(app, tool_name, pct, &format!("Downloading... {}%", pct as u32));
        }
    }
    Ok(bytes)
}

fn set_executable_permissions(_path: &std::path::Path) -> Result<(), String> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(_path, fs::Permissions::from_mode(0o755))
            .map_err(|e| format!("chmod +x: {}", e))?;
    }
    Ok(())
}
