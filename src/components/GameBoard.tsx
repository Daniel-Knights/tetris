import { useCallback, useEffect, useRef } from "react";

import { Coord } from "../classes";
import { getDropInterval, MATRIX_DIMENSIONS, useRotate, useStore } from "../hooks";
import { setFrameSyncInterval } from "../utils";

import GameOver from "./GameOver";
import Matrix from "./Matrix";

const LEFT_RIGHT_DELAY = 300;
const LEFT_RIGHT_INTERVAL = 50;
const SOFT_DROP_SPEED_MULTIPLIER = 20;

function GameBoard({
  moveTetromino,
  onRestart,
}: {
  moveTetromino: (coord: Partial<Coord>) => void;
  onRestart: () => void;
}) {
  const currentLevel = useStore((s) => s.currentLevel);
  const gameStatus = useStore((s) => s.gameStatus);
  const setGameStatus = useStore((s) => s.setGameStatus);
  const activeTetromino = useStore((s) => s.activeTetromino);
  const lockedCoords = useStore((s) => s.lockedCoords);
  const setDropInterval = useStore((s) => s.setDropInterval);
  const setScore = useStore((s) => s.setScore);

  const rotateTetromino = useRotate();

  const leftRightIntervalClear = useRef<(() => void) | null>(null);

  /** Event handler for resetting drop interval after soft drop. */
  const softDropEndListener = useCallback(
    (keyupEv: KeyboardEvent) => {
      if (keyupEv.key !== "ArrowDown") return;

      if (!useStore.getState().gameStatus.is("PAUSED")) {
        setGameStatus("PLAYING");
      }

      setDropInterval(getDropInterval(currentLevel));

      window.removeEventListener("keyup", softDropEndListener);
    },
    [setDropInterval, currentLevel, setGameStatus]
  );

  /** Clear timers on keyup. */
  const leftRightEndListener = useCallback((keyupEv: KeyboardEvent) => {
    if (!/Arrow(Left|Right)/.test(keyupEv.key)) return;

    leftRightIntervalClear.current?.();

    window.removeEventListener("keyup", leftRightEndListener);
  }, []);

  /** Event handler for moving the current tetromino left or right. */
  function keyLeftRight(ev: KeyboardEvent) {
    if (!gameStatus.is("PLAYING", "SOFT_DROP", "LOCK_DOWN")) {
      return;
    }

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
        delay: LEFT_RIGHT_DELAY,
      }
    ).clear;
  }

  // Keydown
  function handleKeydown(ev: KeyboardEvent) {
    if (ev.repeat) return; // Ignore held key in favour of our interval solution
    if (gameStatus.is("GAME_OVER", "PAUSED")) return;

    // Overwrite existing left/right keydown interval
    if (/Arrow(Left|Right)/.test(ev.key)) {
      keyLeftRight(ev);

      return;
    }

    switch (ev.key) {
      // Soft drop
      case "ArrowDown": {
        if (!gameStatus.is("PLAYING")) return;

        const softDropInterval =
          getDropInterval(currentLevel) / SOFT_DROP_SPEED_MULTIPLIER;

        setGameStatus("SOFT_DROP");
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

        setGameStatus("HARD_DROP");
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
    if (gameStatus.is("GAME_OVER")) return;

    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  });

  // Clear timers on game over
  useEffect(() => {
    if (!gameStatus.is("GAME_OVER")) return;

    leftRightIntervalClear.current?.();

    window.removeEventListener("keyup", leftRightEndListener);
    window.removeEventListener("keyup", softDropEndListener);
  }, [gameStatus, leftRightEndListener, softDropEndListener]);

  return (
    <div className="relative py-4 border-y-4 border-double border-primary/30">
      <Matrix
        dimensions={MATRIX_DIMENSIONS}
        highlightedCoords={[...(activeTetromino?.coords ?? []), ...lockedCoords]}
        // Ghost tetromino
        outlinedCoords={activeTetromino?.clone().moveToDropPoint(lockedCoords).coords}
        bg
      />
      {gameStatus.is("GAME_OVER") && <GameOver onRestart={onRestart} />}
    </div>
  );
}

export default GameBoard;
