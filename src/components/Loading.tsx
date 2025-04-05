import icon from "../images/icon.svg";

export function Loading() {
  return (
    <div className="motion-safe:animate-pulse">
      <img src={icon} alt="Tetris" />
    </div>
  );
}
