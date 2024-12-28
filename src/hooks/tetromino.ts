import { useCallback, useEffect, useRef } from "react";

import { Coord, Tetromino } from "../classes";
import { setFrameSyncInterval } from "../utils";

import { getDropInterval } from "./score";
import { useStore } from "./store";

export function useTetromino() {
  const currentLevel = useStore((s) => s.currentLevel);
  const gameStatus = useStore((s) => s.gameStatus);
  const tetrominoQueue = useStore((s) => s.tetrominoQueue);
  const setActiveTetromino = useStore((s) => s.setActiveTetromino);
  const dropInterval = useStore((s) => s.dropInterval);
  const setDropInterval = useStore((s) => s.setDropInterval);
  const setScore = useStore((s) => s.setScore);

  const resetTrigger = useRef(0);

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

  // Plot initial tetromino
  useEffect(() => {
    const initialTetromino = new Tetromino({ type: tetrominoQueue.next }).plot();

    setActiveTetromino(() => initialTetromino);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setActiveTetromino, resetTrigger.current]);

  // Drop interval
  useEffect(() => {
    if (gameStatus.is("GAME_OVER") || dropInterval === null) return;

    const intervalData = setFrameSyncInterval(
      () => {
        moveTetromino({ y: -1 });

        if (gameStatus.is("SOFT_DROP")) {
          // Soft drop score = n lines
          setScore((curr) => curr + 1);
        }
      },
      dropInterval,
      { delay: dropInterval }
    );

    return () => {
      intervalData.clear();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dropInterval,
    gameStatus,
    moveTetromino,
    setScore,
    resetTrigger.current,
  ]);

  // Update drop interval on level change
  useEffect(() => {
    setDropInterval(getDropInterval(currentLevel));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevel, setDropInterval, resetTrigger.current]);

  return {
    moveTetromino,
    resetTetromino: () => {
      resetTrigger.current += 1;
    },
  };
}
