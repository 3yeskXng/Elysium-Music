// src-tauri/src/deps/extract.rs
// Archive extraction — handles Zip, TarGz, TarXz, and PlainBinary formats.
// Extracted into its own module to stay under the 150-line file limit.

use super::config::ArchiveType;
use std::fs::{self, File};
use std::io::Read;
use std::path::Path;

pub fn extract(
    archive_path: &Path,
    deps_dir: &Path,
    target: &Path,
    archive_type: ArchiveType,
) -> Result<(), String> {
    match archive_type {
        ArchiveType::Zip => extract_zip(archive_path, target),
        ArchiveType::TarGz => {
            let file = File::open(archive_path).map_err(|e| format!("Open tar.gz: {}", e))?;
            extract_tar(flate2::read::GzDecoder::new(file), deps_dir, target)
        }
        ArchiveType::TarXz => {
            let file = File::open(archive_path).map_err(|e| format!("Open tar.xz: {}", e))?;
            extract_tar(xz2::read::XzDecoder::new(file), deps_dir, target)
        }
        ArchiveType::PlainBinary => fs::copy(archive_path, target)
            .map(|_| ())
            .map_err(|e| format!("Copy binary: {}", e)),
    }
}

fn extract_zip(archive: &Path, target: &Path) -> Result<(), String> {
    let file = File::open(archive).map_err(|e| format!("Open zip: {}", e))?;
    let mut zip = zip::ZipArchive::new(file).map_err(|e| format!("Read zip: {}", e))?;
    let target_name = target.file_name().unwrap().to_string_lossy();

    for i in 0..zip.len() {
        let mut entry = zip.by_index(i).map_err(|e| format!("Zip entry: {}", e))?;
        let entry_name = entry.mangled_name().to_string_lossy().to_string();
        let filename = std::path::Path::new(&entry_name)
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default();

        if filename == *target_name {
            let mut out = File::create(target).map_err(|e| format!("Create: {}", e))?;
            std::io::copy(&mut entry, &mut out).map_err(|e| format!("Write: {}", e))?;
            return Ok(());
        }
    }
    Err(format!("Binary '{}' not found in zip", target_name))
}

fn extract_tar<R: Read>(reader: R, deps_dir: &Path, target: &Path) -> Result<(), String> {
    let target_name = target.file_name().unwrap().to_string_lossy();
    let mut archive = tar::Archive::new(reader);

    for entry in archive.entries().map_err(|e| format!("Tar entries: {}", e))? {
        let mut entry = entry.map_err(|e| format!("Tar entry: {}", e))?;
        let path = entry.path().map_err(|e| format!("Tar path: {}", e))?;
        let filename = path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default();

        if filename == *target_name {
            entry
                .unpack_in(deps_dir)
                .map_err(|e| format!("Unpack: {}", e))?;
            return move_extracted(deps_dir, &filename, target);
        }
    }
    Err(format!("Binary '{}' not found in tar archive", target_name))
}

fn move_extracted(dir: &Path, name: &str, target: &Path) -> Result<(), String> {
    if let Some(found) = find_recursive(dir, name) {
        if found != target {
            return fs::rename(found, target).map_err(|e| format!("Move: {}", e));
        }
        return Ok(());
    }
    Err(format!("Extracted binary '{}' not found", name))
}

fn find_recursive(dir: &Path, name: &str) -> Option<std::path::PathBuf> {
    let entries = fs::read_dir(dir).ok()?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            if let Some(found) = find_recursive(&path, name) {
                return Some(found);
            }
        } else if path.file_name().map(|n| n == name).unwrap_or(false) {
            return Some(path);
        }
    }
    None
}
