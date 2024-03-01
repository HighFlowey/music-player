import { useEffect, useMemo, useRef, useState } from "react";
import { Song } from "../App";
import covers from "../assets/covers";
import "./Player.css";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";

interface Props {
  musicEntries: Song[];
  song: Song | undefined;
  musicIndex: number;
  setMusicIndex: (index: number) => void;
}

function uint8ArrayToBase64(data: Uint8Array) {
  let binary = "";
  const len = data.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return window.btoa(binary);
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

export default function Player(props: Props) {
  const [musicTime, setMusicTime] = useState<number>(0);
  const [musicVolume, setMusicVolume] = useState<number>(0);
  const [musicDuration, setMusicDuration] = useState<number>(0);
  const [musicCover, setMusicCover] = useState<string>();

  const volume = useRef<HTMLInputElement>(null);
  const music = useRef<HTMLAudioElement>(null);
  const time = useRef<HTMLInputElement>(null);

  useEffect(() => {
    music.current?.play();
  }, [props.song]);

  useMemo(async () => {
    if (props.song) {
      let path = props.song.path;
      invoke("get_mp3_cover", {
        path,
      });

      const unlisten = await listen<number[]>("mp3_cover", async (event) => {
        const potentialCoverBuffer = event.payload;

        console.log("albumCover.buffer.length ->", potentialCoverBuffer.length);

        unlisten();

        if (
          potentialCoverBuffer &&
          Array.isArray(potentialCoverBuffer) &&
          potentialCoverBuffer.length !== 0
        ) {
          try {
            const base64 = uint8ArrayToBase64(
              new Uint8Array(potentialCoverBuffer)
            );

            const image = `data:content-type;base64,${base64}`;

            setMusicCover(image);
          } catch (err) {
            setMusicCover(undefined);
            console.error(err);
          }
        }
      });
    }
  }, [props.song]);

  const info = (
    <div className="info">
      {musicCover ? (
        <img src={musicCover} className="cover"></img>
      ) : (
        <img src={covers.galaxy} className="cover"></img>
      )}
      <div className="text">
        <h1 className="artist">{props.song?.artist || "Unknown Artist"}</h1>
        <h1 className="name">{props.song?.name || "Artist - Song"}</h1>
        <h1 className="time">
          {toReadable(musicTime) + "|" + props.song?.duration}
        </h1>
      </div>
    </div>
  );

  const inputs = (
    <div className="inputs">
      <div className="row2">
        <button
          onClick={function () {
            if (!music.current) {
              return;
            }

            if (music.current.paused) {
              music.current.play();
            } else {
              music.current.pause();
            }
          }}
        >
          {music.current?.paused ? "Play" : "Pause"}
        </button>
        <button
          onClick={function () {
            if (props.musicIndex - 1 < 0) {
              props.setMusicIndex(props.musicEntries.length - 1);
            } else {
              props.setMusicIndex(props.musicIndex - 1);
            }
          }}
        >
          Previous
        </button>
        <button
          onClick={function () {
            if (props.musicIndex + 1 >= props.musicEntries.length) {
              props.setMusicIndex(0);
            } else {
              props.setMusicIndex(props.musicIndex + 1);
            }
          }}
        >
          Next
        </button>
        <input
          ref={volume}
          value={musicVolume * 100}
          onChange={function (event) {
            if (!music.current || !event.currentTarget) {
              return;
            }

            const newVolume = Number(event.currentTarget.value) / 100;
            music.current.volume = newVolume;
          }}
          type="range"
        ></input>
      </div>
      <input
        ref={time}
        value={(musicTime / musicDuration) * 100}
        onChange={function (event) {
          if (!music.current || !event.currentTarget) {
            return;
          }

          const newTime =
            (Number(event.currentTarget.value) / 100) * music.current.duration;
          music.current.currentTime = newTime;
        }}
        type="range"
        style={{ width: 350 }}
      ></input>
    </div>
  );

  return (
    <div className="player">
      {info} {inputs}
      <audio
        ref={music}
        onTimeUpdate={function () {
          if (!music.current) {
            return;
          }

          setMusicTime(music.current.currentTime);
        }}
        onVolumeChange={function () {
          if (!music.current) {
            return;
          }

          setMusicVolume(music.current.volume);
        }}
        onCanPlay={function () {
          if (!music.current) {
            return;
          }

          setMusicDuration(music.current.duration);
          setMusicVolume(music.current.volume);
        }}
        onEnded={function () {
          if (props.musicIndex + 1 >= props.musicEntries.length) {
            props.setMusicIndex(0);
          } else {
            props.setMusicIndex(props.musicIndex + 1);
          }
        }}
        src={props.song?.url}
      ></audio>
    </div>
  );
}
