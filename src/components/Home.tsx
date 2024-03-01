import { Song } from "../App";
import "./Home.css";
import PlaylistItem from "./PlaylistItem";

interface Props {
  getDirectory: () => void;
  musicEntries: Song[];
  musicIndex: number;
}

export default function Home(props: Props) {
  return (
    <div className="home">
      <button onClick={props.getDirectory}>Load Directory</button>
      <ul className="playlist">
        {props.musicEntries.map((v, i) => {
          if (i >= props.musicIndex) {
            return PlaylistItem({
              selected: i === props.musicIndex,
              duration: v.duration,
              title: v.name,
              key: String(i),
            });
          }
        })}
      </ul>
    </div>
  );
}
