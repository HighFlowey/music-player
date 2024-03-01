import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

document.addEventListener("mousedown", (event: MouseEvent) => {
  if (
    event.target instanceof HTMLElement &&
    event.target.nodeName === "BUTTON"
  ) {
    event.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />
);
