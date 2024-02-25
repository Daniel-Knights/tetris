import { MutableRefObject, useEffect, useRef } from "react";

import { Coord, getDropInterval, SOFT_DROP_SPEED_MULTIPLIER } from "../modules";
import { getDropPoint, INTERVAL, TetrominoCoordsState } from "../modules/tetromino";
import { setCustomInterval } from "../utils";

import Matrix from "./Matrix";

const KEYDOWN_DELAY = 300;

function GameBoard({
  gameOver,
  isHardDrop,
  currentLevel,
  dropInterval,
  setDropInterval,
  tetrominoCoords,
  moveTetromino,
  rotateTetromino,
}: {
  gameOver: { current: boolean };
  isHardDrop: MutableRefObject<boolean>;
  currentLevel: number;
  dropInterval: number | null;
  setDropInterval: (interval: number | null) => void;
  tetrominoCoords: TetrominoCoordsState;
  moveTetromino: (coord: Partial<Coord>) => void;
  rotateTetromino: () => void;
}): JSX.Element {
  const leftRightTimeoutId = useRef<number | null>(null);
  const leftRightIntervalClear = useRef<(() => void) | null>(null);

  /** Event handler for resetting drop interval after soft drop. */
  function softDropEndListener(keyupEv: KeyboardEvent) {
    if (keyupEv.key !== "ArrowDown") return;

    setDropInterval(getDropInterval(currentLevel));

    window.removeEventListener("keyup", softDropEndListener);
  }

  /** Event handler for moving the current tetromino left or right. */
  function keyLeftRight(ev: KeyboardEvent) {
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
    const x = ev.key === "ArrowLeft" ? -1 : 1;

    moveTetromino({ x });

    leftRightTimeoutId.current = window.setTimeout(() => {
      leftRightIntervalClear.current = setCustomInterval(() => {
        moveTetromino({ x });
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
      // Soft drop
      case "ArrowDown": {
        const softDropInterval =
          getDropInterval(currentLevel) / SOFT_DROP_SPEED_MULTIPLIER;

        if (dropInterval === softDropInterval) return;

        setDropInterval(softDropInterval);
        moveTetromino({ y: -1 });

        window.addEventListener("keyup", softDropEndListener);

        break;
      }
      // Hard drop
      case " ": {
        if (tetrominoCoords.active.length === 0) return;

        isHardDrop.current = true;

        const dropPoint = getDropPoint(tetrominoCoords.active, tetrominoCoords.locked);
        const y = -(tetrominoCoords.active[0].y - dropPoint[0].y);

        moveTetromino({ y });

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
    <div className="py-4 border-y-4 border-double border-primary/30">
      <Matrix
        dimensions={{ rows: 20, columns: 10 }}
        highlightedCoords={[...tetrominoCoords.active, ...tetrominoCoords.locked]}
        outlinedCoords={tetrominoCoords.ghost}
        bg
      />
    </div>
  );
}

export default GameBoard;
