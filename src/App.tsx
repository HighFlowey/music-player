import { dialog, invoke } from "@tauri-apps/api";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import "./App.css";
import Home from "./components/Home";
import Player from "./components/Player";
import { useEffect, useMemo, useState } from "react";

export interface Song extends FileInfo {
  url: string;
  index: number;
}

interface FileInfo {
  duration: number;
  path: string;
  name: string;
  artist: string;
}

async function askForDirectory() {
  let dir = await dialog.open({ directory: true });

  if (!dir) {
    return;
  } else if (Array.isArray(dir)) {
    return;
  }

  return dir;
}

async function searchDirectory(url: string): Promise<Song[]> {
  let songs: Song[] = [];
  let entries: FileInfo[] = await invoke("read_directory", {
    directoryUrl: url,
  });

  for (const info of entries) {
    const url = convertFileSrc(info.path);
    let song: Song = {
      index: entries.indexOf(info),
      duration: info.duration,
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
  const [musicEntries, setMusicEntries] = useState<Song[]>([]);
  const [currentMusic, setCurrentMusic] = useState<Song>();
  const [currentDirectory, setCurrentDirectory] = useState<string>();

  function prev() {
    if (currentMusic) {
      if (currentMusic.index <= 0) {
        setCurrentMusic(musicEntries[musicEntries.length - 1]);
      } else {
        setCurrentMusic(musicEntries[currentMusic.index - 1]);
      }
    }
  }

  function next() {
    if (currentMusic) {
      if (currentMusic.index + 1 >= musicEntries.length) {
        setCurrentMusic(musicEntries[0]);
      } else {
        setCurrentMusic(musicEntries[currentMusic.index + 1]);
      }
    }
  }

  useEffect(() => {
    function beforeUnload() {
      if (currentDirectory) {
        localStorage.setItem("directory", currentDirectory);
        localStorage.setItem("index", String(currentMusic?.index));
      } else {
        localStorage.removeItem("directory");
        localStorage.removeItem("index");
      }
    }

    window.addEventListener("beforeunload", beforeUnload);

    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [currentMusic]);

  useMemo(() => {
    if (
      localStorage.getItem("index") &&
      currentDirectory === localStorage.getItem("directory") &&
      musicEntries[Number(localStorage.getItem("index"))]
    ) {
      setCurrentMusic(musicEntries[Number(localStorage.getItem("index"))]);
    } else {
      setCurrentMusic(musicEntries[0]);
    }
  }, [musicEntries]);

  useMemo(async () => {
    if (currentDirectory) {
      // user has selected a directory
      setMusicEntries(await searchDirectory(currentDirectory));
    } else {
      // try to use previously used directory
      const dir = localStorage.getItem("directory");

      if (dir && typeof dir === "string") {
        setCurrentDirectory(dir);
      }
    }
  }, [currentDirectory]);

  return (
    <div className="app">
      <Home
        musicEntries={musicEntries}
        currentMusic={currentMusic}
        getDirectory={async () => {
          let dir = await askForDirectory();

          if (dir) {
            setCurrentDirectory(dir);
          }
        }}
      ></Home>
      <Player music={currentMusic} audioApi={{ prev, next }}></Player>
    </div>
  );
}
