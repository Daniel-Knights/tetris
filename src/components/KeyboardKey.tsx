import { JSX, ReactNode, PointerEvent as ReactPointerEvent } from "react";

export function KeyboardKey({
  children,
  eventKey,
  ...restProps
}: {
  children: ReactNode;
  eventKey: EventKey;
} & JSX.IntrinsicElements["button"]) {
  return (
    <button
      {...restProps}
      className={`cursor-pointer py-2 px-4 bg-primary/75 ${restProps.className ?? ""}`}
      onPointerDown={(ev) => dispatchKey(ev, "keydown", eventKey)}
      onPointerUp={(ev) => dispatchKey(ev, "keyup", eventKey)}
    >
      <kbd className="text-secondary text-center leading-none">{children}</kbd>
    </button>
  );
}

function dispatchKey(
  pointerEv: ReactPointerEvent<HTMLButtonElement>,
  type: "keyup" | "keydown",
  key: EventKey
) {
  pointerEv.preventDefault();

  window.dispatchEvent(new KeyboardEvent(type, { key }));
}

type EventKey = "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown" | " " | "Escape";
