import { useEffect, useRef } from "react";
import { Song } from "../App";
import { toReadable } from "./Player";
import "./PlaylistItem.css";

interface Props {
  isPlaying: boolean;
  music: Song;
}

export default function PlaylistItem(props: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && props.isPlaying) {
      ref.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });

  return (
    <div
      ref={ref}
      className={props.isPlaying ? "playlistItem selected" : "playlistItem"}
    >
      <h3 className="artist">{props.music.artist}</h3>
      <h3 className="name">{props.music.name}</h3>
      <p className="duration">Duration: {toReadable(props.music.duration)}</p>
    </div>
  );
}
