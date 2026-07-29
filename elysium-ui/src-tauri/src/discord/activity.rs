// src-tauri/src/discord/activity.rs
// Activity builder — converts track metadata into Discord Rich Presence activity

use discord_rich_presence::activity::{Activity, Assets, Timestamps};

const APP_NAME: &str = "Elysium Music";
const LARGE_IMAGE_KEY: &str = "elysium_logo";

pub fn build_playing_activity<'a>(track_title: &'a str, track_artist: &'a str, start_time: u64) -> Activity<'a> {
    Activity::new()
        .state(track_title)
        .details(track_artist)
        .assets(
            Assets::new()
                .large_image(LARGE_IMAGE_KEY)
                .large_text(APP_NAME)
        )
        .timestamps(
            Timestamps::new()
                .start(start_time as i64)
        )
}

pub fn build_paused_activity<'a>(track_title: &'a str, track_artist: &'a str) -> Activity<'a> {
    Activity::new()
        .state(track_title)
        .details(track_artist)
        .assets(
            Assets::new()
                .large_image(LARGE_IMAGE_KEY)
                .large_text(APP_NAME)
        )
}

pub fn build_idle_activity() -> Activity<'static> {
    Activity::new()
        .state("Idle")
        .details("Elysium Music")
        .assets(
            Assets::new()
                .large_image(LARGE_IMAGE_KEY)
                .large_text(APP_NAME)
        )
}
