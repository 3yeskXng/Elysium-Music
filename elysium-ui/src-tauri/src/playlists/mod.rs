// src-tauri/src/playlists/mod.rs
// Playlist system — modular backend for persistent playlist management

pub mod storage;
pub mod commands;

pub use storage::{Playlist, SongInfo};
