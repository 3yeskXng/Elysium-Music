// src-tauri/src/deps/process.rs
// Cross-platform command builder — suppresses console windows on Windows
// Use no_window_command() instead of Command::new() for all external tool invocations.

use std::process::Command;

/// Creates a new Command for the given program that hides the console window
/// on Windows (CREATE_NO_WINDOW = 0x08000000). On Linux/macOS it behaves
/// identically to `Command::new(program)`.
pub fn no_window_command<S: AsRef<std::ffi::OsStr>>(program: S) -> Command {
    let mut cmd = Command::new(program);
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }
    cmd
}
