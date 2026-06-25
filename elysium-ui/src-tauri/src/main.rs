// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // FIXED: Changed crate reference from the temporary name to your official package name
    elysium::run();
}