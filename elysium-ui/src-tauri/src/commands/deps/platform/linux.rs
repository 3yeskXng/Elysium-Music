// src-tauri/src/commands/deps/platform/linux.rs
// Linux package manager operations (apt, dnf) for dependency installation
// Opens a separate terminal window with sudo, tries apt first then falls back to dnf

use super::super::progress::emit_progress;
use std::process::Command;
use tauri::AppHandle;

const TERMINAL_EMULATORS: &[&str] = &[
    "x-terminal-emulator",
    "gnome-terminal",
    "konsole",
    "xfce4-terminal",
];

fn build_script(tool_name: &str, pkg: &str, is_install: bool) -> String {
    let (label, cmd) = if is_install {
        ("Installing", format!("apt install -y {} 2>&1 || dnf install -y {} 2>&1", pkg, pkg))
    } else {
        ("Updating", format!("apt install --only-upgrade -y {} 2>&1 || dnf upgrade -y {} 2>&1", pkg, pkg))
    };
    format!(
        "echo '=== {} {} ==='; sudo bash -c '{}'; echo ''; echo '=== Done. Press Enter to close. ==='; read",
        label, tool_name, cmd
    )
}

fn try_open_terminal(script: &str) -> bool {
    for term in TERMINAL_EMULATORS {
        let result = match *term {
            "gnome-terminal" => Command::new(term)
                .args(["--", "bash", "-c", script])
                .spawn(),
            _ => Command::new(term)
                .args(["-e", "bash", "-c", script])
                .spawn(),
        };
        if result.is_ok() {
            println!("[Deps:Linux] Opened terminal: {}", term);
            return true;
        }
        println!("[Deps:Linux] Failed to open: {}", term);
    }
    false
}

fn run_inline(pkg: &str, tool_name: &str, is_install: bool, app: &AppHandle) -> Result<String, String> {
    println!("[Deps:Linux] No terminal found, running inline via pkexec/sudo...");

    for mgr in &["apt", "dnf"] {
        let args: Vec<&str> = if is_install {
            vec![mgr, "install", "-y", pkg]
        } else if *mgr == "apt" {
            vec![mgr, "install", "--only-upgrade", "-y", pkg]
        } else {
            vec![mgr, "upgrade", "-y", pkg]
        };

        let output = Command::new("pkexec")
            .args(&args)
            .output()
            .or_else(|_| Command::new("sudo").args(&args).output());

        if let Ok(ref out) = output {
            if out.status.success() {
                let action = if is_install { "installed" } else { "updated" };
                let msg = format!("{} {} successfully", tool_name, action);
                emit_progress(app, tool_name, "done", &msg);
                return Ok(msg);
            }
        }
        println!("[Deps:Linux] {} failed, trying next...", mgr);
    }
    Err("No terminal emulator or sudo available, and all package managers failed".to_string())
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
    println!("[Deps:Linux] Installing {} (apt -> dnf fallback)...", tool_name);
    emit_progress(app, tool_name, "download",
        &format!("Opening installation terminal for {}...", tool_name));

    let script = build_script(tool_name, apt_pkg, true);
    if try_open_terminal(&script) {
        let msg = format!("Installation terminal opened for {}. Check the terminal window.", tool_name);
        emit_progress(app, tool_name, "done", &msg);
        return Ok(msg);
    }
    run_inline(apt_pkg, tool_name, true, app)
}

pub fn update_tool(apt_pkg: &str, tool_name: &str, app: &AppHandle) -> Result<String, String> {
    println!("[Deps:Linux] Updating {} (apt -> dnf fallback)...", tool_name);
    emit_progress(app, tool_name, "update",
        &format!("Opening update terminal for {}...", tool_name));

    let script = build_script(tool_name, apt_pkg, false);
    if try_open_terminal(&script) {
        let msg = format!("Update terminal opened for {}. Check the terminal window.", tool_name);
        emit_progress(app, tool_name, "done", &msg);
        return Ok(msg);
    }
    run_inline(apt_pkg, tool_name, false, app)
}
