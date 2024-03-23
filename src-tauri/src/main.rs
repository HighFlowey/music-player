// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

const DISCORD_RETRY_INTERVAL: u64 = 2;
const DISCORD_RETRY_ATTEMPTS: i32 = 10;

use audiotags::Tag;
use discord_rich_presence::{
    activity::{Activity, Assets, Timestamps},
    DiscordIpc, DiscordIpcClient,
};
use serde::{Deserialize, Serialize};
use std::{
    fs::{read_dir, DirEntry},
    path::{Path, PathBuf},
    sync::{Arc, RwLock},
    thread,
    time::Duration,
};
use tauri::{AppHandle, Manager, State};

#[derive(Debug, Serialize)]
struct FileInfo {
    duration: f64,
    path: PathBuf,
    name: String,
    artist: String,
}

#[derive(Clone)]
struct AppState {
    rich_presence: Arc<RwLock<DiscordIpcClient>>,
}

fn remove_extension(entry: &DirEntry) -> Option<String> {
    let file_name = entry.file_name();
    let path = Path::new(&file_name);
    let file_stem = path.file_stem()?.to_str()?;
    Some(file_stem.to_string())
}

#[derive(Serialize, Deserialize)]
struct DiscordRichPresence {
    playing: bool,
    details: String,
    state: String,
    left: i64,
}

#[tauri::command]
fn change_rich_presence(app_state: State<'_, AppState>, new_status: DiscordRichPresence) {
    let discord_client_opt = app_state.rich_presence.write();

    if discord_client_opt.is_ok() {
        let mut discord_client = discord_client_opt.unwrap();
        let mut activity = Activity::new()
            .state(&new_status.state)
            .details(&new_status.details)
            .assets(Assets::new().large_image("galaxy"));

        if new_status.playing {
            activity = activity.timestamps(Timestamps::new().end(new_status.left));
        }

        let result = discord_client.set_activity(activity);

        if result.is_ok() {
            result.unwrap();
        } else {
            println!("set_activity err: {}", result.err().unwrap());
        }
    }
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn read_directory(directory_url: &str) -> Vec<FileInfo> {
    let directory = read_dir(directory_url);

    if directory.is_ok() {
        let mut entries: Vec<FileInfo> = Vec::new();

        for entry in directory.unwrap().into_iter() {
            if entry.is_err() {
                continue;
            }

            let entry_result = entry.unwrap();
            let tag_result = Tag::new().read_from_path(entry_result.path());

            if tag_result.is_ok() {
                let tag = tag_result.unwrap();
                let artist = tag.artist();
                let file_name = entry_result.file_name();
                let file_name_without_extension = remove_extension(&entry_result);

                entries.push(FileInfo {
                    duration: mp3_duration::from_path(entry_result.path())
                        .unwrap_or_else(|_| Duration::from_secs(0))
                        .as_secs_f64(),
                    path: entry_result.path(),
                    name: if file_name_without_extension.is_some() {
                        file_name_without_extension.unwrap()
                    } else {
                        file_name.to_str().unwrap().to_string()
                    },
                    artist: if artist.is_some() {
                        artist.unwrap().to_owned()
                    } else {
                        String::from("Uknown Artist")
                    },
                });
            }
        }

        return entries;
    }

    return Vec::new();
}

#[tauri::command]
fn get_mp3_cover(app: AppHandle, path: PathBuf) {
    let tag_result = Tag::new().read_from_path(path);

    if tag_result.is_ok() {
        let tag = tag_result.unwrap();
        if tag.album_cover().is_some() {
            app.emit_all(
                "mp3_cover",
                tag.album_cover().unwrap().to_owned().data.to_owned(),
            )
            .expect("Expected to send mp3 cover to frontend");
        }
    }
}

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            rich_presence: Arc::new(RwLock::new(
                DiscordIpcClient::new("1203039006846361762").unwrap(),
            )),
        })
        .setup(|app| {
            let app_state = app.state::<AppState>();
            let discord_client_opt = app_state.rich_presence.write();

            if discord_client_opt.is_ok() {
                let mut discord_client = discord_client_opt.unwrap();

                for _ in 1..=DISCORD_RETRY_ATTEMPTS {
                    let result = discord_client.connect();

                    if result.is_ok() {
                        result.unwrap();
                        break;
                    } else {
                        thread::sleep(Duration::from_secs(DISCORD_RETRY_INTERVAL));
                    }
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            read_directory,
            get_mp3_cover,
            change_rich_presence
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
