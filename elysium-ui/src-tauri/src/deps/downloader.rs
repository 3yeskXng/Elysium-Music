// src-tauri/src/deps/downloader.rs
// Downloads missing dependency binaries via HTTPS, extracts archives, and sets permissions.

use super::{config, extract, logger, paths};
use config::ToolDefinition;
use std::fs;

pub async fn download_and_install(tool: &ToolDefinition) -> Result<String, String> {
    let url = config::download_url_for(tool);
    let target = paths::binary_path(tool);
    let temp = paths::temp_file_for(tool.name);

    logger::info(&format!("Downloading {}...", tool.name));
    paths::ensure_dirs()?;

    let bytes = fetch_bytes(url).await?;
    logger::info(&format!("Downloaded {} ({} bytes)", tool.name, bytes.len()));

    fs::write(&temp, &bytes).map_err(|e| format!("Write temp: {}", e))?;

    let archive = config::archive_type_from_url(url);
    extract::extract(&temp, &paths::deps_dir(), &target, archive)?;
    logger::info(&format!("Extracted {}", tool.name));

    set_executable_permissions(&target)?;

    fs::remove_file(&temp).ok();
    logger::info(&format!("{} installed successfully", tool.name));
    Ok(format!("{} installed", tool.name))
}

async fn fetch_bytes(url: &str) -> Result<Vec<u8>, String> {
    let client = reqwest::Client::builder()
        .build()
        .map_err(|e| format!("HTTP client: {}", e))?;
    let resp = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Request: {}", e))?;
    resp.bytes()
        .await
        .map(|b| b.to_vec())
        .map_err(|e| format!("Read response: {}", e))
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
