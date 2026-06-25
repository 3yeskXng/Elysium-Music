// src-tauri/src/models.rs
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TrackPayload {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub duration: String,
    pub duration_secs: u32,
    pub duration_secs_snake: u32,
    pub file_path: String,
    // FIXED: Allowed non_snake_case to suppress compiler style warnings for JS payload properties
    #[allow(non_snake_case)]
    pub filePath: String, 
    pub album: String,
    pub cover_url_camel: String,
    pub cover_url_snake: String,
}