import { useCallback, useEffect, useRef } from "react";

import { Coord, Tetromino } from "../classes";
import { addCustomEventListener, setFrameSyncInterval } from "../utils";

import { getDropInterval, useScore } from "./score";
import { useStore } from "./store";
import { MATRIX_DIMENSIONS } from "./tetromino";

const LOCKDOWN_TIMEOUT = 500;

export function useLockdown(
  scoreLineClear: ReturnType<typeof useScore>["scoreLineClear"]
) {
  const currentLevel = useStore((s) => s.currentLevel);
  const gameStatus = useStore((s) => s.gameStatus);
  const setGameStatus = useStore((s) => s.setGameStatus);
  const setNextTetromino = useStore((s) => s.setNextTetromino);
  const activeTetromino = useStore((s) => s.activeTetromino);
  const setActiveTetromino = useStore((s) => s.setActiveTetromino);
  const lockedCoords = useStore((s) => s.lockedCoords);
  const setLockedCoords = useStore((s) => s.setLockedCoords);
  const setDropInterval = useStore((s) => s.setDropInterval);
  const dropIntervalData = useStore((s) => s.dropIntervalData);

  const lockdownTimeoutId = useRef<number | null>(null);

  /** Checks if game over and adjusts coords to avoid collision. */
  const handleNewTetromino = useCallback(
    (nextTetromino: Tetromino) => {
      // Avoid stale closures
      const currActiveTetromino = useStore.getState().activeTetromino;
      const currLockedCoords = useStore.getState().lockedCoords;
      const allTetrominoCoords = [
        ...(currActiveTetromino?.coords ?? []),
        ...currLockedCoords,
      ];

      let isGameOver = false;
      let nextYAdjustment = 0;

      nextTetromino.coords.forEach((c) => {
        // Can only ever be pushed up by a max of 2 rows
        if (nextYAdjustment === 2) return;

        if (c.isIn(allTetrominoCoords)) {
          isGameOver = true;
          nextYAdjustment = 1;
        }

        if (c.clone().add({ y: 1 }).isIn(allTetrominoCoords)) {
          nextYAdjustment = 2;
        }
      });

      if (isGameOver) {
        setGameStatus("GAME_OVER");

        dropIntervalData?.clear();
      }

      setLockedCoords((curr, currActive) => [...(currActive?.coords ?? []), ...curr]);
      setActiveTetromino(() => {
        return nextYAdjustment > 0
          ? nextTetromino.move({ y: nextYAdjustment })
          : nextTetromino;
      });
    },
    [dropIntervalData, setActiveTetromino, setGameStatus, setLockedCoords]
  );

  /** Clears full lines and sets new tetromino. */
  const handleLineClears = useCallback(() => {
    // Avoid stale closures
    const currActiveTetromino = useStore.getState().activeTetromino;
    const currLockedCoords = useStore.getState().lockedCoords;

    // Prevent floating tetrominoes
    if (!currActiveTetromino?.isAtBound(currLockedCoords, { y: -1 })) {
      return;
    }

    const allTetrominoCoords = [
      ...(currActiveTetromino?.coords ?? []),
      ...currLockedCoords,
    ];

    allTetrominoCoords.sort(
      (a, b) => b.toIndex(MATRIX_DIMENSIONS) - a.toIndex(MATRIX_DIMENSIONS)
    );

    const rows: Coord[][] = [];
    const linesToClear = new Set<number>();

    allTetrominoCoords.forEach((coord) => {
      const rowNumber = coord.getRow(MATRIX_DIMENSIONS.rows);
      const rowCoords = rows[rowNumber];
      const adjustedIndex = coord.clone().add({ y: -linesToClear.size });

      if (rowCoords) {
        rowCoords.push(adjustedIndex);

        if (rowCoords.length === MATRIX_DIMENSIONS.columns) {
          rows.splice(rowNumber, 1);
          linesToClear.add(rowNumber);
        }
      } else {
        rows[rowNumber] = [adjustedIndex];
      }
    });

    const { next } = setNextTetromino();
    const nextTetromino = new Tetromino({ type: next }).plot();

    // Clear lines
    if (linesToClear.size > 0) {
      setGameStatus("LINE_CLEAR");

      // Prevent drop interval running during animation
      setDropInterval(null);

      setFrameSyncInterval(
        ({ count }) => {
          // Clear animation
          if (count < 6) {
            setLockedCoords((curr, currActive) => {
              return [...(currActive?.coords ?? []), ...curr].filter((coord) => {
                const { x } = coord;

                // With each iteration we clear the two innermost minos
                return (
                  !linesToClear.has(coord.getRow(MATRIX_DIMENSIONS.rows)) ||
                  (x !== 5 - count && x !== 4 + count)
                );
              });
            });

            setActiveTetromino(() => null);

            return;
          }

          // Push rows down and set new tetromino
          setLockedCoords(() => rows.flat());
          setActiveTetromino(() => nextTetromino);
          scoreLineClear(linesToClear.size as 1 | 2 | 3 | 4);
          setDropInterval(getDropInterval(currentLevel));
          setGameStatus("PLAYING");
        },
        60,
        { limit: 6 }
      );
    } else {
      handleNewTetromino(nextTetromino);
      setGameStatus("PLAYING");
    }
  }, [
    currentLevel,
    handleNewTetromino,
    scoreLineClear,
    setActiveTetromino,
    setDropInterval,
    setGameStatus,
    setLockedCoords,
    setNextTetromino,
  ]);

  /** Locks down active tetromino. */
  const lockDown = useCallback(
    (instant?: boolean) => {
      setGameStatus("LOCK_DOWN");

      if (lockdownTimeoutId.current) {
        window.clearTimeout(lockdownTimeoutId.current);
      }

      function commitLockDown() {
        lockdownTimeoutId.current = null;

        handleLineClears();
      }

      if (instant) {
        commitLockDown();
      } else {
        // If game is paused, re-initiate lockdown on resume
        const removePauseListener = addCustomEventListener(
          "gamestatuschange",
          (ev, remove) => {
            switch (ev.detail.curr.toString()) {
              case "PAUSED":
                window.clearTimeout(lockdownTimeoutId.current!);

                break;
              case "PLAYING":
                if (!ev.detail.prev.is("PAUSED")) return;

                remove();
                commitLockDown();

                break;
            }
          }
        );

        lockdownTimeoutId.current = window.setTimeout(() => {
          removePauseListener();
          commitLockDown();
        }, LOCKDOWN_TIMEOUT);
      }
    },
    [handleLineClears, setGameStatus]
  );

  // Tetromino has hit lower limit
  useEffect(() => {
    if (
      !gameStatus.is("PLAYING", "SOFT_DROP", "HARD_DROP") ||
      !activeTetromino?.isAtBound(lockedCoords, { y: -1 })
    ) {
      return;
    }

    const instantLockDown = gameStatus.is("HARD_DROP");

    lockDown(instantLockDown);
  }, [activeTetromino, gameStatus, lockDown, lockedCoords]);

  // Re-initiate lock down if piece is moved
  useEffect(() => {
    function handler(ev: KeyboardEvent) {
      if (!gameStatus.is("LOCK_DOWN") || !/Arrow(Up|Left|Right)/.test(ev.key)) {
        return;
      }

      window.clearTimeout(lockdownTimeoutId.current!);
      setGameStatus("PLAYING");
    }

    window.addEventListener("keyup", handler);

    return () => {
      window.removeEventListener("keyup", handler);
    };
  }, [activeTetromino, gameStatus, setGameStatus]);
}
