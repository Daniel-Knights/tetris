import { useEffect, useRef } from "react";

import {
  Coord,
  getDropInterval,
  getDropPoint,
  SOFT_DROP_SPEED_MULTIPLIER,
  useRotate,
  useStore,
} from "../modules";
import { setCustomInterval } from "../utils";

import GameOver from "./GameOver";
import Matrix from "./Matrix";

const KEYDOWN_DELAY = 300;
const LEFT_RIGHT_INTERVAL = 50;

function GameBoard({
  moveTetromino,
}: {
  moveTetromino: (coord: Partial<Coord>) => void;
}): JSX.Element {
  const currentLevel = useStore((state) => state.currentLevel);
  const gameOver = useStore((state) => state.gameOver);
  const tetrominoCoords = useStore((state) => state.tetrominoCoords);
  const dropInterval = useStore((state) => state.dropInterval);
  const setDropInterval = useStore((state) => state.setDropInterval);
  const setIsHardDrop = useStore((state) => state.setIsHardDrop);

  const rotateTetromino = useRotate();

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
      }, LEFT_RIGHT_INTERVAL).clear;
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

        setIsHardDrop(true);

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
    if (gameOver) return;

    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  });

  return (
    <div className="relative py-4 border-y-4 border-double border-primary/30">
      <Matrix
        dimensions={{ rows: 20, columns: 10 }}
        highlightedCoords={[...tetrominoCoords.active, ...tetrominoCoords.locked]}
        outlinedCoords={tetrominoCoords.ghost}
        bg
      />
      {gameOver && <GameOver />}
    </div>
  );
}

export default GameBoard;
