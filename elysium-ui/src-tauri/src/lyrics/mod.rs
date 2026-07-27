// src-tauri/src/lyrics/mod.rs
// Lyrics backend module — IPC commands and cross-platform storage

pub mod commands;
pub mod storage;

use commands::{read_lrc_file, read_embedded_lyrics, read_custom_lyrics, write_custom_lyrics};
