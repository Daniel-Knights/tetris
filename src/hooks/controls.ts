import { useCallback, useEffect, useRef } from "react";

import { Coord } from "../classes";
import { IntervalData, setFrameSyncInterval } from "../utils";

import { useRotate } from "./rotate";
import { getDropInterval } from "./score";
import { useStore } from "./store";

const LEFT_RIGHT_DELAY = 300;
const LEFT_RIGHT_INTERVAL = 50;
const SOFT_DROP_SPEED_MULTIPLIER = 20;

export function useControls() {
  const currentLevel = useStore((s) => s.currentLevel);
  const gameStatus = useStore((s) => s.gameStatus);
  const setGameStatus = useStore((s) => s.setGameStatus);
  const activeTetromino = useStore((s) => s.activeTetromino);
  const setActiveTetromino = useStore((s) => s.setActiveTetromino);
  const lockedCoords = useStore((s) => s.lockedCoords);
  const setDropInterval = useStore((s) => s.setDropInterval);
  const setScore = useStore((s) => s.setScore);

  const rotateTetromino = useRotate();

  const leftRightIntervalData = useRef<IntervalData>(null);
  const currentKey = useRef<string | null>(null);

  /** Moves the current tetromino in the passed direction. */
  const moveTetromino = useCallback(
    (coord: Partial<Coord>): void => {
      setActiveTetromino((curr, locked) => {
        if (!curr || curr.isAtBound(locked, coord)) {
          return curr;
        }

        return curr.clone().move(coord);
      });
    },
    [setActiveTetromino]
  );

  /** Event handler for resetting drop interval after soft drop. */
  const handleSoftDropEnd = useCallback(
    (keyupEv: KeyboardEvent) => {
      if (keyupEv.key !== "ArrowDown") return;

      if (!useStore.getState().gameStatus.is("PAUSED")) {
        setGameStatus("PLAYING");
      }

      setDropInterval(getDropInterval(currentLevel));

      window.removeEventListener("keyup", handleSoftDropEnd);
    },
    [setDropInterval, currentLevel, setGameStatus]
  );

  /** Clear timers on keyup. */
  const handleLeftRightEnd = useCallback((ev: KeyboardEvent) => {
    if (ev.key !== currentKey.current) return;

    leftRightIntervalData.current?.clear();

    window.removeEventListener("keyup", handleLeftRightEnd);
  }, []);

  /** Event handler for moving the current tetromino left or right. */
  function handleKeyLeftRight(ev: KeyboardEvent) {
    if (!gameStatus.is("PLAYING", "SOFT_DROP", "LOCK_DOWN")) {
      return;
    }

    currentKey.current = ev.key;

    // Clear existing left/right keydown interval
    leftRightIntervalData.current?.clear();

    window.addEventListener("keyup", handleLeftRightEnd);

    // Move
    const x = ev.key === "ArrowLeft" ? -1 : 1;

    moveTetromino({ x });

    leftRightIntervalData.current = setFrameSyncInterval(
      () => {
        moveTetromino({ x });
      },
      LEFT_RIGHT_INTERVAL,
      {
        delay: LEFT_RIGHT_DELAY,
      }
    );
  }

  // Keydown
  function handleKeydown(ev: KeyboardEvent) {
    if (ev.repeat) return; // Ignore held key in favour of our interval solution

    switch (ev.key) {
      case "ArrowLeft":
      case "ArrowRight":
        handleKeyLeftRight(ev);

        break;
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

        window.addEventListener("keyup", handleSoftDropEnd);

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
    if (gameStatus.is("GAME_OVER", "PAUSED")) return;

    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  });

  // Clear timers on game over
  useEffect(() => {
    if (!gameStatus.is("GAME_OVER")) return;

    leftRightIntervalData.current?.clear();

    window.removeEventListener("keyup", handleLeftRightEnd);
    window.removeEventListener("keyup", handleSoftDropEnd);
  }, [gameStatus, handleLeftRightEnd, handleSoftDropEnd]);

  return {
    moveTetromino,
  };
}
