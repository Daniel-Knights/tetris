import { useCallback, useEffect, useState } from "react";

import { Coord } from "../classes";
import { addCustomEventListener, setFrameSyncInterval } from "../utils";

import { getDropInterval } from "./score";
import { useStore } from "./store";

export function useTetromino() {
  const currentLevel = useStore((s) => s.currentLevel);
  const gameStatus = useStore((s) => s.gameStatus);
  const setActiveTetromino = useStore((s) => s.setActiveTetromino);
  const dropInterval = useStore((s) => s.dropInterval);
  const setDropInterval = useStore((s) => s.setDropInterval);
  const setScore = useStore((s) => s.setScore);

  const [remainingInterval, setRemainingInterval] = useState<number>();

  /** Moves the current tetromino in the passed direction. */
  const moveTetromino = useCallback(
    (coord: Partial<Coord>): void => {
      setActiveTetromino((curr, lockedCoords) => {
        if (!curr || curr.isAtBound(lockedCoords, coord)) {
          return curr;
        }

        return curr.clone().move(coord);
      });
    },
    [setActiveTetromino]
  );

  // Drop interval
  useEffect(() => {
    if (gameStatus.is("GAME_OVER", "PAUSED") || dropInterval === null) return;

    const intervalData = setFrameSyncInterval(
      () => {
        if (remainingInterval) {
          setRemainingInterval(undefined);
        }

        moveTetromino({ y: -1 });

        if (gameStatus.is("SOFT_DROP")) {
          // Soft drop score = n lines
          setScore((curr) => curr + 1);
        }
      },
      dropInterval,
      { delay: remainingInterval ?? dropInterval }
    );

    const removePauseListener = addCustomEventListener("gamestatuschange", (ev) => {
      if (!ev.detail.curr.is("PAUSED")) return;

      setRemainingInterval(intervalData.remainingMs);
    });

    return () => {
      intervalData.clear();
      removePauseListener();
    };
  }, [dropInterval, gameStatus, moveTetromino, setScore, remainingInterval]);

  // Update drop interval on level change
  useEffect(() => {
    setDropInterval(getDropInterval(currentLevel));
  }, [currentLevel, setDropInterval]);

  return {
    moveTetromino,
    resetTetromino: () => {
      setRemainingInterval(undefined);
    },
  };
}
