// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // FIXED: Match the explicit library name defined in your Cargo.toml
    elysium_lib::run();
}