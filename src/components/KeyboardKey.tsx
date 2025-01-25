import { JSX, ReactNode, PointerEvent as ReactPointerEvent, useRef } from "react";

export function KeyboardKey({
  children,
  eventKey,
  ...restProps
}: {
  children: ReactNode;
  eventKey: EventKey;
} & JSX.IntrinsicElements["button"]) {
  const isHolding = useRef(false);

  function handlePointerDown(ev: ReactPointerEvent<HTMLButtonElement>) {
    isHolding.current = true;

    dispatchKey(ev, "keydown", eventKey);
  }

  function handlePointerUp(ev: ReactPointerEvent<HTMLButtonElement>) {
    if (!isHolding.current) return;

    isHolding.current = false;

    dispatchKey(ev, "keyup", eventKey);
  }

  return (
    <button
      {...restProps}
      className={`cursor-pointer py-2 px-4 bg-primary/75 ${restProps.className ?? ""}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerOut={handlePointerUp}
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
