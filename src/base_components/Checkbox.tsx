import { createRef } from "react";

interface CheckboxWithTitleProps {
  children: string;
  stateApi: [boolean, (v: boolean) => void];
}

export function CheckboxWithTitle(props: CheckboxWithTitleProps) {
  const [get, set] = props.stateApi;
  let div = createRef<HTMLDivElement>();

  function mouseEnter() {
    if (!div.current) {
      return;
    }

    div.current.style.opacity = "0.85";
  }

  function mouseLeave() {
    if (!div.current) {
      return;
    }

    div.current.style.opacity = "1";
  }

  return (
    <div
      ref={div}
      onClick={() => set(!get)}
      onMouseEnter={mouseEnter}
      onMouseLeave={mouseLeave}
      className="checkboxWithTitle"
    >
      <input
        type="checkbox"
        checked={get}
        onChange={(e) => {
          set(e.currentTarget.checked);
        }}
        onClick={() => set(!get)}
        className="showPreviousPlaylistItems"
      />
      <p>{props.children}</p>
    </div>
  );
}
