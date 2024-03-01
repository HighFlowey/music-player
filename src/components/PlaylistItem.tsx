import "./PlaylistItem.css";

interface Props {
  selected?: boolean;
  title: string;
  duration: string;
  key?: string;
}

export default function PlaylistItem(props: Props) {
  return (
    <div
      key={props.key}
      className={
        props.selected === true ? "playlistItem selected" : "playlistItem"
      }
    >
      <h3>{props.title}</h3>
      <p>Duration: {props.duration}</p>
    </div>
  );
}
