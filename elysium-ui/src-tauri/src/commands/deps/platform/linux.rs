// [Zeilen: 78/150]
// src-tauri/src/commands/deps/platform/linux.rs
// Linux package manager (apt/dnf) operations for dependency installation
// Spawns a native terminal with sudo for installing dependencies

use super::super::progress::emit_progress;
use std::process::Command;
use tauri::AppHandle;

const TERMINALS: &[(&str, &[&str])] = &[
    ("x-terminal-emulator", &["-e"]),
    ("gnome-terminal", &["--"]),
    ("konsole", &["-e"]),
    ("xfce4-terminal", &["-e"]),
    ("ptyxis", &["--"]),
    ("alacritty", &["-e"]),
    ("xterm", &["-e"]),
];

fn build_bash_command(pkg: &str, is_install: bool) -> String {
    let pkg_cmd = if is_install {
        format!("sudo apt update && sudo apt install -y {pkg} || sudo dnf install -y {pkg}")
    } else {
        format!("sudo apt install --only-upgrade -y {pkg} || sudo dnf upgrade -y {pkg}")
    };
    format!("bash -c '{pkg_cmd}; echo \"\"; echo \"Process finished. Press Enter to exit...\"; read'")
}

fn try_launch_terminal(bash_payload: &str) -> bool {
    for (term, flag) in TERMINALS {
        let mut args = flag.to_vec();
        args.push(bash_payload);

        if Command::new(term).args(&args).spawn().is_ok() {
            println!("[Deps:Linux] Successfully spawned terminal: {}", term);
            return true;
        }
    }
    false
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
    println!("[Deps:Linux] Installing {}...", tool_name);
    emit_progress(app, tool_name, "download", &format!("Opening terminal for {}...", tool_name));

    let bash_payload = build_bash_command(apt_pkg, true);
    if try_launch_terminal(&bash_payload) {
        let msg = format!("Terminal window opened for {}.", tool_name);
        emit_progress(app, tool_name, "done", &msg);
        return Ok(msg);
    }

    Err("Could not find a supported terminal emulator (gnome-terminal, konsole, xterm, etc.)".to_string())
}

pub fn update_tool(apt_pkg: &str, tool_name: &str, app: &AppHandle) -> Result<String, String> {
    println!("[Deps:Linux] Updating {}...", tool_name);
    emit_progress(app, tool_name, "update", &format!("Opening terminal for {}...", tool_name));

    let bash_payload = build_bash_command(apt_pkg, false);
    if try_launch_terminal(&bash_payload) {
        let msg = format!("Update terminal opened for {}.", tool_name);
        emit_progress(app, tool_name, "done", &msg);
        return Ok(msg);
    }

    Err("Could not find a supported terminal emulator".to_string())
}