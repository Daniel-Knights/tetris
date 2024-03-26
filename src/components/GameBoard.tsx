import { useEffect, useRef } from "react";

import {
  Coord,
  getDropInterval,
  getDropPoint,
  MATRIX,
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
  onRestart,
}: {
  moveTetromino: (coord: Partial<Coord>) => void;
  onRestart: () => void;
}): JSX.Element {
  const currentLevel = useStore((s) => s.currentLevel);
  const gameOver = useStore((s) => s.gameOver);
  const tetrominoCoords = useStore((s) => s.tetrominoCoords);
  const setDropInterval = useStore((s) => s.setDropInterval);
  const isSoftDrop = useStore((s) => s.isSoftDrop);
  const setIsSoftDrop = useStore((s) => s.setIsSoftDrop);
  const setIsHardDrop = useStore((s) => s.setIsHardDrop);
  const setScore = useStore((s) => s.setScore);
  const isLockDown = useStore((s) => s.isLockDown);

  const rotateTetromino = useRotate();

  const leftRightIntervalClear = useRef<(() => void) | null>(null);

  /** Event handler for resetting drop interval after soft drop. */
  function softDropEndListener(keyupEv: KeyboardEvent) {
    if (keyupEv.key !== "ArrowDown") return;

    setIsSoftDrop(false);
    setDropInterval(getDropInterval(currentLevel));

    window.removeEventListener("keyup", softDropEndListener);
  }

  /** Event handler for moving the current tetromino left or right. */
  function keyLeftRight(ev: KeyboardEvent) {
    /** Clear timers on keyup. */
    function leftRightEndListener(keyupEv: KeyboardEvent) {
      if (!/Arrow(?:Left|Right)/.test(keyupEv.key)) return;

      leftRightIntervalClear.current?.();

      window.removeEventListener("keyup", leftRightEndListener);
    }

    // Overwrite existing left/right keydown interval
    leftRightIntervalClear.current?.();

    window.addEventListener("keyup", leftRightEndListener);

    // Move
    const x = ev.key === "ArrowLeft" ? -1 : 1;

    moveTetromino({ x });

    leftRightIntervalClear.current = setCustomInterval(
      () => {
        moveTetromino({ x });
      },
      LEFT_RIGHT_INTERVAL,
      {
        delay: KEYDOWN_DELAY,
      }
    ).clear;
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
        if (isSoftDrop || isLockDown) return;

        const softDropInterval =
          getDropInterval(currentLevel) / SOFT_DROP_SPEED_MULTIPLIER;

        setIsSoftDrop(true);
        setDropInterval(softDropInterval);

        // Manually move and set score once, drop interval handles subsequent until keyup
        moveTetromino({ y: -1 });
        setScore((curr) => curr + 1);

        window.addEventListener("keyup", softDropEndListener);

        break;
      }
      // Hard drop
      case " ": {
        if (tetrominoCoords.active.length === 0) return;

        const dropPoint = getDropPoint(tetrominoCoords.active, tetrominoCoords.locked);
        const yDiff = tetrominoCoords.active[0].y - dropPoint[0].y;

        setIsHardDrop(true);
        moveTetromino({ y: -yDiff });
        setScore((curr) => curr + yDiff * 2); // Hard drop score = n lines * 2

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
        dimensions={MATRIX}
        highlightedCoords={[...tetrominoCoords.active, ...tetrominoCoords.locked]}
        outlinedCoords={tetrominoCoords.ghost}
        bg
      />
      {gameOver && <GameOver onRestart={onRestart} />}
    </div>
  );
}

export default GameBoard;
