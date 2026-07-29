// src-tauri/src/discord/client.rs
// Discord Rich Presence client lifecycle — connect, disconnect, update

use discord_rich_presence::{DiscordIpc, DiscordIpcClient};
use crate::discord::activity;

pub struct DiscordClient {
    inner: Option<DiscordIpcClient>,
    connected: bool,
}

impl DiscordClient {
    pub fn new() -> Self {
        Self { inner: None, connected: false }
    }

    pub fn connect(&mut self, client_id: &str) -> Result<(), String> {
        if self.connected {
            return Ok(());
        }
        let mut client = DiscordIpcClient::new(client_id)
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
