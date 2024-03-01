import { Song } from "../App";
import "./Home.css";
import PlaylistItem from "./PlaylistItem";

interface Props {
  musicEntries: Song[];
  currentMusic: Song | undefined;
  getDirectory: () => void;
}

export default function Home(props: Props) {
  return (
    <div className="home">
      <button onClick={props.getDirectory}>Load Directory</button>
      <ul className="playlist">
        {props.musicEntries.map((entry, i) => {
          return (
            <PlaylistItem
              isPlaying={props.currentMusic?.index === i}
              music={entry}
              key={i}
            ></PlaylistItem>
          );
        })}
      </ul>
    </div>
  );
}
