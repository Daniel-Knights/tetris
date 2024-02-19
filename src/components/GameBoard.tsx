import { useEffect, useRef } from "react";

import { INTERVAL, MOVEMENT, TetrominoIndicesState } from "../modules/tetromino";
import { setCustomInterval } from "../utils";

import Matrix from "./Matrix";

const KEYDOWN_DELAY = 300;

function GameBoard({
  gameOver,
  dropInterval,
  setDropInterval,
  tetrominoIndices,
  moveTetromino,
  rotateTetromino,
}: {
  gameOver: { current: boolean };
  dropInterval: number | null;
  setDropInterval: (interval: number | null) => void;
  tetrominoIndices: TetrominoIndicesState;
  moveTetromino: (direction: keyof typeof MOVEMENT) => void;
  rotateTetromino: () => void;
}): JSX.Element {
  const leftRightTimeoutId = useRef<number | null>(null);
  const leftRightIntervalClear = useRef<(() => void) | null>(null);

  /** Event handler for resetting drop interval after soft drop. */
  function softDropEndListener(keyupEv: KeyboardEvent) {
    if (keyupEv.key !== "ArrowDown") return;

    setDropInterval(INTERVAL.initialDrop);

    window.removeEventListener("keyup", softDropEndListener);
  }

  /** Event handler for moving the current tetromino left or right. */
  function keyLeftRight(ev: KeyboardEvent) {
    const direction = {
      ArrowLeft: "left",
      ArrowRight: "right",
    }[ev.key] as "left" | "right" | undefined;

    if (!direction) return;

    /** Clears left/right keydown timers. */
    function clearLeftRightTimers() {
      if (leftRightTimeoutId.current) {
        window.clearTimeout(leftRightTimeoutId.current);

        leftRightTimeoutId.current = null;
      }

      leftRightIntervalClear.current?.();
      leftRightIntervalClear.current = null;
    }

    /** Clear timers on keyup. */
    function leftRightEndListener(keyupEv: KeyboardEvent) {
      if (!/Arrow(?:Left|Right)/.test(keyupEv.key)) return;

      clearLeftRightTimers();

      window.removeEventListener("keyup", leftRightEndListener);
    }

    // Overwrite existing left/right keydown interval
    clearLeftRightTimers();

    window.addEventListener("keyup", leftRightEndListener);

    // Move
    moveTetromino(direction);

    leftRightTimeoutId.current = window.setTimeout(() => {
      leftRightIntervalClear.current = setCustomInterval(() => {
        moveTetromino(direction);
      }, INTERVAL.leftRight).clear;
    }, KEYDOWN_DELAY);
  }

  // Keydown
  function handleKeydown(ev: KeyboardEvent) {
    if (ev.repeat) return; // Ignore held key in favour of our interval solution

    // Overwrite existing left/right keydown interval
    if (/Arrow(?:Left|Right)/.test(ev.key)) {
      keyLeftRight(ev);

      return;
    }

    switch (ev.key) {
      case "ArrowDown": {
        if (dropInterval === INTERVAL.softDrop) return;

        setDropInterval(INTERVAL.softDrop);
        moveTetromino("down");

        window.addEventListener("keyup", softDropEndListener);

        break;
      }
      case " ": {
        if (dropInterval === INTERVAL.hardDrop) return;

        setDropInterval(INTERVAL.hardDrop);
        moveTetromino("down");

        break;
      }
      case "ArrowUp": {
        rotateTetromino();

        break;
      }
    }
  }

  // External listeners
  useEffect(() => {
    if (gameOver.current) return;

    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  });

  return (
    <Matrix
      rows={20}
      columns={10}
      highlightedIndices={[...tetrominoIndices.active, ...tetrominoIndices.locked]}
      outlinedIndices={tetrominoIndices.ghost}
    />
  );
}

export default GameBoard;
