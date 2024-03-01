import { dialog, invoke } from "@tauri-apps/api";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { useMemo, useState } from "react";
import "./App.css";
import Home from "./components/Home";
import Player, { toReadable } from "./components/Player";

export interface Song {
  duration: string;
  path: string;
  url: string;
  name: string;
  artist: string;
}

interface FileInfo {
  duration: number;
  path: string;
  name: string;
  artist: string;
}

export async function loadDirectory(url: string): Promise<Song[]> {
  let entries: FileInfo[] = await invoke("read_directory", {
    directoryUrl: url,
  });
  let songs: Song[] = [];

  for (const info of entries) {
    const url = convertFileSrc(info.path);
    let song: Song = {
      duration: info.duration === 0 ? "unknown" : toReadable(info.duration),
      path: info.path,
      url,
      name: info.name,
      artist: info.artist,
    };

    songs.push(song);
  }

  return songs;
}

export default function App() {
  const [song, setSong] = useState<Song | undefined>();
  const [musicEntries, setMusicEntries] = useState<Song[]>([]);
  const [musicIndex, setMusicIndex] = useState(0);

  async function getDirectory() {
    let dir = await dialog.open({ directory: true });

    if (!dir) {
      return;
    } else if (Array.isArray(dir)) {
      return;
    }

    let songs = await loadDirectory(dir);
    setMusicEntries(songs);
    setMusicIndex(0);
  }

  useMemo(() => {
    if (musicEntries.length === 0) {
      return;
    }

    let song = musicEntries[musicIndex];
    setSong(song);
  }, [musicEntries, musicIndex]);

  return (
    <div className="app">
      <Home
        getDirectory={getDirectory}
        musicEntries={musicEntries}
        musicIndex={musicIndex}
      ></Home>
      <Player
        song={song}
        musicIndex={musicIndex}
        setMusicIndex={setMusicIndex}
        musicEntries={musicEntries}
      ></Player>
    </div>
  );
}
