// src-tauri/src/commands/deps/platform/linux.rs
// Linux package manager operations (apt, dnf, pacman) for dependency installation
// Uses pkexec for graphical privilege escalation when sudo is required

use super::super::progress::emit_progress;
use std::process::Command;
use tauri::AppHandle;

#[derive(Debug)]
enum PkgManager { Apt, Dnf, Pacman, Unknown }

fn detect_pkg_manager() -> PkgManager {
    if Command::new("apt").arg("--version").output().is_ok() {
        PkgManager::Apt
    } else if Command::new("dnf").arg("--version").output().is_ok() {
        PkgManager::Dnf
    } else if Command::new("pacman").arg("--version").output().is_ok() {
        PkgManager::Pacman
    } else {
        PkgManager::Unknown
    }
}

fn sudo_install_args(pkg: &str, mgr: &PkgManager) -> Vec<String> {
    let (mgr_cmd, pkg_arg) = match mgr {
        PkgManager::Apt => ("apt", vec!["install", "-y", pkg]),
        PkgManager::Dnf => ("dnf", vec!["install", "-y", pkg]),
        PkgManager::Pacman => ("pacman", vec!["-S", "--noconfirm", pkg]),
        PkgManager::Unknown => ("apt", vec!["install", "-y", pkg]),
    };
    let inner = format!("{} {}", mgr_cmd, pkg_arg.join(" "));
    vec!["-c".to_string(), inner]
}

fn sudo_upgrade_args(pkg: &str, mgr: &PkgManager) -> Vec<String> {
    let (mgr_cmd, pkg_arg) = match mgr {
        PkgManager::Apt => ("apt", vec!["upgrade", "-y", pkg]),
        PkgManager::Dnf => ("dnf", vec!["upgrade", "-y", pkg]),
        PkgManager::Pacman => ("pacman", vec!["-S", "--noconfirm", pkg]),
        PkgManager::Unknown => ("apt", vec!["upgrade", "-y", pkg]),
    };
    let inner = format!("{} {}", mgr_cmd, pkg_arg.join(" "));
    vec!["-c".to_string(), inner]
}

pub fn check_tool(check_cmd: &str) -> bool {
    println!("[Deps:Linux] Checking tool: {}", check_cmd);
    if let Ok(o) = Command::new("which").arg(check_cmd).output() {
        let found = o.status.success();
        println!("[Deps:Linux] {} check: {}", check_cmd, if found { "FOUND" } else { "NOT FOUND" });
        return found;
    }
    false
}

pub fn install_tool(apt_pkg: &str, tool_name: &str, app: &AppHandle) -> Result<String, String> {
    let mgr = detect_pkg_manager();
    println!("[Deps:Linux] Installing {} via {:?}...", tool_name, mgr);
    emit_progress(app, tool_name, "download", &format!("Installing {} via system package manager...", tool_name));

    let args = sudo_install_args(apt_pkg, &mgr);
    let output = Command::new("pkexec")
        .args(&args)
        .output()
        .or_else(|_| {
            println!("[Deps:Linux] pkexec failed, trying sudo...");
            Command::new("sudo").args(&args).output()
        })
        .map_err(|e| format!("Neither pkexec nor sudo available: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    println!("[Deps:Linux] Package manager exit: {}", output.status.code().unwrap_or(-1));

    if output.status.success() || stdout.contains("already the newest") || stdout.contains("Nothing to do") {
        let msg = format!("{} installed successfully", tool_name);
        emit_progress(app, tool_name, "done", &msg);
        return Ok(msg);
    }

    Err(format!("Package install failed: {}", stderr.trim()))
}

pub fn update_tool(apt_pkg: &str, tool_name: &str, app: &AppHandle) -> Result<String, String> {
    let mgr = detect_pkg_manager();
    println!("[Deps:Linux] Updating {} via {:?}...", tool_name, mgr);
    emit_progress(app, tool_name, "update", &format!("Updating {} via system package manager...", tool_name));

    let args = sudo_upgrade_args(apt_pkg, &mgr);
    let output = Command::new("pkexec")
        .args(&args)
        .output()
        .or_else(|_| {
            println!("[Deps:Linux] pkexec failed, trying sudo...");
            Command::new("sudo").args(&args).output()
        })
        .map_err(|e| format!("Neither pkexec nor sudo available: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    println!("[Deps:Linux] Package manager exit: {}", output.status.code().unwrap_or(-1));

    if output.status.success() || stdout.contains("up to date") {
        let msg = format!("{} is already up to date", tool_name);
        emit_progress(app, tool_name, "done", &msg);
        return Ok(msg);
    }

    Err(format!("Package upgrade failed: {}", stdout.trim()))
}
