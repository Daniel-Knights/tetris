import { useCallback, useEffect, useRef } from "react";

import { Coord } from "../classes";
import {
  getDropInterval,
  SOFT_DROP_SPEED_MULTIPLIER,
  useRotate,
  useStore,
} from "../hooks";
import { setFrameSyncInterval } from "../utils";

import GameOver from "./GameOver";
import Matrix from "./Matrix";

export const MATRIX = {
  rows: 20,
  columns: 10,
};

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
  const activeTetromino = useStore((s) => s.activeTetromino);
  const lockedCoords = useStore((s) => s.lockedCoords);
  const setDropInterval = useStore((s) => s.setDropInterval);
  const isSoftDrop = useStore((s) => s.isSoftDrop);
  const setIsSoftDrop = useStore((s) => s.setIsSoftDrop);
  const setIsHardDrop = useStore((s) => s.setIsHardDrop);
  const setScore = useStore((s) => s.setScore);
  const isLockDown = useStore((s) => s.isLockDown);

  const rotateTetromino = useRotate();

  const leftRightIntervalClear = useRef<(() => void) | null>(null);

  /** Event handler for resetting drop interval after soft drop. */
  const softDropEndListener = useCallback(
    (keyupEv: KeyboardEvent) => {
      if (keyupEv.key !== "ArrowDown") return;

      setIsSoftDrop(false);
      setDropInterval(getDropInterval(currentLevel));

      window.removeEventListener("keyup", softDropEndListener);
    },
    [currentLevel, setIsSoftDrop, setDropInterval]
  );

  /** Clear timers on keyup. */
  const leftRightEndListener = useCallback((keyupEv: KeyboardEvent) => {
    if (!/Arrow(Left|Right)/.test(keyupEv.key)) return;

    leftRightIntervalClear.current?.();

    window.removeEventListener("keyup", leftRightEndListener);
  }, []);

  /** Event handler for moving the current tetromino left or right. */
  function keyLeftRight(ev: KeyboardEvent) {
    // Overwrite existing left/right keydown interval
    leftRightIntervalClear.current?.();

    window.addEventListener("keyup", leftRightEndListener);

    // Move
    const x = ev.key === "ArrowLeft" ? -1 : 1;

    moveTetromino({ x });

    leftRightIntervalClear.current = setFrameSyncInterval(
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
    if (/Arrow(Left|Right)/.test(ev.key)) {
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
        if (!activeTetromino) return;

        const droppedTetromino = activeTetromino.clone().moveToDropPoint(lockedCoords);
        const yDiff = activeTetromino.coords[0]!.y - droppedTetromino.coords[0]!.y;

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

  // Clear timers on game over
  useEffect(() => {
    if (!gameOver) return;

    leftRightIntervalClear.current?.();

    window.removeEventListener("keyup", leftRightEndListener);
    window.removeEventListener("keyup", softDropEndListener);
  }, [gameOver, leftRightEndListener, softDropEndListener]);

  return (
    <div className="relative py-4 border-y-4 border-double border-primary/30">
      <Matrix
        dimensions={MATRIX}
        highlightedCoords={[...(activeTetromino?.coords ?? []), ...lockedCoords]}
        // Ghost tetromino
        outlinedCoords={activeTetromino?.clone().moveToDropPoint(lockedCoords).coords}
        bg
      />
      {gameOver && <GameOver onRestart={onRestart} />}
    </div>
  );
}

export default GameBoard;
