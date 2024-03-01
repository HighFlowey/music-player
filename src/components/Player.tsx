import React, { useEffect, useMemo, useRef, useState } from "react";
import { Song } from "../App";
import covers from "../assets/covers";
import "./Player.css";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";

interface Props {
  music: Song | undefined;
  audioApi: { prev: () => void; next: () => void };
}

export function toReadable(x: number) {
  let minutes = Math.floor((((x % 31536000) % 86400) % 3600) / 60).toFixed();
  let seconds = ((((x % 31536000) % 86400) % 3600) % 60).toFixed();

  if (minutes.length === 1) {
    minutes = "0" + minutes;
  }

  if (seconds.length === 1) {
    seconds = "0" + seconds;
  }

  return minutes + ":" + seconds;
}

function uint8ArrayToBase64(data: Uint8Array) {
  let binary = "";
  const len = data.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return window.btoa(binary);
}

function getAlbumCover(songPath: string) {
  return new Promise<string>((res) => {
    invoke("get_mp3_cover", {
      path: songPath,
    });

    listen<number[]>("mp3_cover", async (event) => {
      const potentialCoverBuffer = event.payload;

      if (
        potentialCoverBuffer &&
        Array.isArray(potentialCoverBuffer) &&
        potentialCoverBuffer.length !== 0
      ) {
        const base64 = uint8ArrayToBase64(new Uint8Array(potentialCoverBuffer));

        res(`data:content-type;base64,${base64}`);
      } else {
        res(covers.redmooncity);
      }
    }).then((unlisten) => {
      unlisten();
    });
  });
}

function PlayerInfo(props: { music: Song; currentTime: number }) {
  const [albumCover, setAlbumCover] = useState<string>(covers.redmooncity);

  useMemo(async () => {
    if (props.music) {
      setAlbumCover(await getAlbumCover(props.music.path));
    } else {
      setAlbumCover(covers.galaxy);
    }
  }, [props.music]);

  return (
    <div className="info">
      <img src={albumCover} className="cover"></img>
      <div className="text">
        <h1 className="artist">{props.music.artist}</h1>
        <h1 className="name">{props.music.name}</h1>
        <h1 className="time">
          {toReadable(props.currentTime) +
            "|" +
            toReadable(props.music.duration)}
        </h1>
      </div>
    </div>
  );
}

function PlayerInputs(props: {
  music: Song;
  audio: React.RefObject<HTMLAudioElement>;
  audioApi: { prev: () => void; next: () => void };
  volumeApi: [number, (v: number) => void];
}) {
  function toggle() {
    if (props.audio.current) {
      if (props.audio.current.paused) {
        props.audio.current.play();
      } else {
        props.audio.current.pause();
      }
    }
  }

  useEffect(() => {
    function handleInput(e: KeyboardEvent) {
      switch (e.key) {
        case " ":
          toggle();
          e.preventDefault();
          break;
        case "ArrowUp":
          props.audioApi.prev();
          e.preventDefault();
          break;
        case "ArrowDown":
          props.audioApi.next();
          e.preventDefault();
          break;
        case "ArrowLeft":
          props.audioApi.prev();
          e.preventDefault();
          break;
        case "ArrowRight":
          props.audioApi.next();
          e.preventDefault();
          break;
      }
    }

    window.addEventListener("keydown", handleInput);

    return () => {
      window.removeEventListener("keydown", handleInput);
    };
  }, [props.music]);

  return (
    <div className="inputs">
      <div className="row2">
        <button tabIndex={-1} onClick={toggle}>
          {props.audio.current?.paused ? "Play" : "Pause"}
        </button>
        <button tabIndex={-1} onClick={props.audioApi.prev}>
          Previous
        </button>
        <button tabIndex={-1} onClick={props.audioApi.next}>
          Next
        </button>
        <input
          defaultValue={props.volumeApi[0]}
          onInput={(e) => {
            props.volumeApi[1](Number(e.currentTarget.value));
          }}
          tabIndex={-1}
          type="range"
        ></input>
      </div>
      <input tabIndex={-1} type="range" style={{ width: 350 }}></input>
    </div>
  );
}

export default function Player(props: Props) {
  const [currentTime, setCurrentTime] = useState(0);
  const volumeApi = useState(
    localStorage.getItem("volume") ? Number(localStorage.getItem("volume")) : 50
  );
  const audio = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audio.current) {
      audio.current.play();
      audio.current.onended = () => {
        props.audioApi.next();
      };
    }
  }, [props.music]);

  useEffect(() => {
    if (audio.current) {
      audio.current.volume = volumeApi[0] / 100;
    }
  }, [volumeApi[0]]);

  useEffect(() => {
    function beforeUnload() {
      localStorage.setItem("volume", String(volumeApi[0]));
    }

    window.addEventListener("beforeunload", beforeUnload);

    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [volumeApi[0]]);

  return (
    <div className="player">
      {props.music && (
        <PlayerInfo music={props.music} currentTime={currentTime}></PlayerInfo>
      )}
      {props.music && (
        <PlayerInputs
          music={props.music}
          audio={audio}
          audioApi={props.audioApi}
          volumeApi={volumeApi}
        ></PlayerInputs>
      )}
      <audio
        ref={audio}
        src={props.music?.url}
        onTimeUpdate={(e) => {
          setCurrentTime(e.currentTarget.currentTime);
        }}
      ></audio>
    </div>
  );
}
