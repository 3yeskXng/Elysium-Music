// src-tauri/src/discord/client.rs
// Discord Rich Presence client lifecycle — connect, disconnect, update

use discord_rich_presence::{DiscordIpc, DiscordIpcClient};
use crate::discord::activity;

pub struct DiscordClient {
    inner: Option<DiscordIpcClient>,
    connected: bool,
}

fn load_client_id() -> String {
    std::env::var("DISCORD_CLIENT_ID").unwrap_or_else(|_| {
        "YOUR_DISCORD_CLIENT_ID_HERE".to_string()
    })
}

impl DiscordClient {
    pub fn new() -> Self {
        Self { inner: None, connected: false }
    }

    pub fn connect(&mut self) -> Result<(), String> {
        if self.connected {
            return Ok(());
        }
        let client_id = load_client_id();
        if client_id == "YOUR_DISCORD_CLIENT_ID_HERE" {
            return Err("DISCORD_CLIENT_ID not set in src-tauri/.env".to_string());
        }
        let mut client = DiscordIpcClient::new(&client_id)
            .map_err(|e| format!("Failed to create Discord IPC client: {}", e))?;
        client.connect()
            .map_err(|e| format!("Failed to connect to Discord: {}", e))?;
        self.inner = Some(client);
        self.connected = true;
        Ok(())
    }

    pub fn disconnect(&mut self) -> Result<(), String> {
        if let Some(mut client) = self.inner.take() {
            client.close()
                .map_err(|e| format!("Failed to disconnect Discord: {}", e))?;
        }
        self.connected = false;
        Ok(())
    }

    pub fn update_playing(&mut self, title: &str, artist: &str, start_time: u64) -> Result<(), String> {
        let client = self.inner.as_mut()
            .ok_or_else(|| "Discord client not connected".to_string())?;
        let act = activity::build_playing_activity(title, artist, start_time);
        client.set_activity(act)
            .map_err(|e| format!("Failed to update presence: {}", e))?;
        Ok(())
    }

    pub fn update_paused(&mut self, title: &str, artist: &str) -> Result<(), String> {
        let client = self.inner.as_mut()
            .ok_or_else(|| "Discord client not connected".to_string())?;
        let act = activity::build_paused_activity(title, artist);
        client.set_activity(act)
            .map_err(|e| format!("Failed to update presence: {}", e))?;
        Ok(())
    }

    pub fn set_idle(&mut self) -> Result<(), String> {
        let client = self.inner.as_mut()
            .ok_or_else(|| "Discord client not connected".to_string())?;
        let act = activity::build_idle_activity();
        client.set_activity(act)
            .map_err(|e| format!("Failed to set idle presence: {}", e))?;
        Ok(())
    }

    pub fn is_connected(&self) -> bool {
        self.connected
    }
}
