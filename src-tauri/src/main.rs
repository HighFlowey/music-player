// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use audiotags::Tag;
use mp3_duration;
use serde::Serialize;
use std::{fs::read_dir, path::PathBuf, time::Duration};
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize)]
struct FileInfo {
    duration: f64,
    path: PathBuf,
    name: String,
    artist: String,
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn read_directory(directory_url: &str) -> Vec<FileInfo> {
    let mut entries: Vec<FileInfo> = Vec::new();

    for entry in read_dir(directory_url).unwrap().into_iter() {
        let entry_result = entry.unwrap();
        let tag_result = Tag::new().read_from_path(entry_result.path());

        if tag_result.is_ok() {
            let tag = tag_result.unwrap();
            entries.push(FileInfo {
                duration: mp3_duration::from_path(entry_result.path())
                    .unwrap_or_else(|_| Duration::from_secs(0))
                    .as_secs_f64(),
                path: entry_result.path(),
                name: entry_result.file_name().into_string().unwrap(),
                artist: if tag.artist().is_some() {
                    tag.artist().unwrap().to_owned()
                } else {
                    String::from("Uknown Artist")
                },
            });
        }
    }

    return entries;
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
        .invoke_handler(tauri::generate_handler![read_directory, get_mp3_cover])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
