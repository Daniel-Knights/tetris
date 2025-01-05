import { JSX } from "react";

import { KeyboardKey } from "./KeyboardKey";

const GAP = "gap-0.5";

export function Keyboard(props: JSX.IntrinsicElements["div"]) {
  return (
    <div
      {...props}
      className={`flex justify-center ${GAP} px-4 w-full ${props.className ?? ""}`}
      onContextMenu={(ev) => ev.preventDefault()} // Prevent iOS magnifier
    >
      <KeyboardKey eventKey={"Escape"}>esc</KeyboardKey>
      <KeyboardKey eventKey={" "} className="grow max-w-48">
        space
      </KeyboardKey>
      <div className={`flex flex-col ${GAP}`}>
        <KeyboardKey eventKey={"ArrowUp"}>▲</KeyboardKey>
        <div className={`flex ${GAP}`}>
          <KeyboardKey eventKey={"ArrowLeft"} className="self-end py-7 px-8">
            ◀
          </KeyboardKey>
          <KeyboardKey eventKey={"ArrowRight"} className="self-end py-7 px-8">
            ▶
          </KeyboardKey>
        </div>
        <KeyboardKey eventKey={"ArrowDown"}>▼</KeyboardKey>
      </div>
    </div>
  );
}
