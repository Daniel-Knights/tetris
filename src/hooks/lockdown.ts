import { useCallback, useEffect, useRef } from "react";

import { Coord, Tetromino } from "../classes";
import { MATRIX_DIMENSIONS } from "../constant";
import { addCustomEventListener, Nullish, setFrameSyncInterval } from "../utils";

import { getDropInterval, useScore } from "./score";
import { useStore } from "./store";

const LOCKDOWN_TIMEOUT = 500;
const MAX_MOVE_COUNT = 15;

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

  const lockdownTimeoutId = useRef<number | null>(null);
  const lowestY = useRef<number | Nullish>(null);
  const moveCount = useRef(0);

  /** Checks if game over and adjusts coords to avoid collision. */
  const handleNewTetromino = useCallback(
    (nextTetromino: Tetromino) => {
      // Avoid stale closures
      const currState = useStore.getState();

      const allTetrominoCoords = [
        ...(currState.activeTetromino?.coords ?? []),
        ...currState.lockedCoords,
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
      }

      setLockedCoords((curr, currActive) => [...(currActive?.coords ?? []), ...curr]);
      setActiveTetromino(() => {
        return nextYAdjustment > 0
          ? nextTetromino.move({ y: nextYAdjustment })
          : nextTetromino;
      });
    },
    [setActiveTetromino, setGameStatus, setLockedCoords]
  );

  /** Clears full lines and sets new tetromino. */
  const handleLineClears = useCallback(() => {
    // Avoid stale closures
    const currState = useStore.getState();

    const allTetrominoCoords = [
      ...(currState.activeTetromino?.coords ?? []),
      ...currState.lockedCoords,
    ];

    const matrixDimensions = {
      rows: MATRIX_DIMENSIONS.ROWS,
      columns: MATRIX_DIMENSIONS.COLUMNS,
    };

    allTetrominoCoords.sort(
      (a, b) => b.toIndex(matrixDimensions) - a.toIndex(matrixDimensions)
    );

    const rows: Coord[][] = [];
    const linesToClear = new Set<number>();

    allTetrominoCoords.forEach((coord) => {
      const rowNumber = coord.getRow(MATRIX_DIMENSIONS.ROWS);
      const rowCoords = rows[rowNumber];
      const adjustedIndex = coord.clone().add({ y: -linesToClear.size });

      if (rowCoords) {
        rowCoords.push(adjustedIndex);

        if (rowCoords.length === MATRIX_DIMENSIONS.COLUMNS) {
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
                  !linesToClear.has(coord.getRow(MATRIX_DIMENSIONS.ROWS)) ||
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
  const lockdown = useCallback(
    (instant?: boolean) => {
      setGameStatus("LOCK_DOWN");

      if (lockdownTimeoutId.current) {
        window.clearTimeout(lockdownTimeoutId.current);
      }

      function commitLockdown() {
        lockdownTimeoutId.current = null;

        // Avoid stale closures
        const currState = useStore.getState();

        // Prevent floating tetrominoes
        if (!currState.activeTetromino?.isAtBound(currState.lockedCoords, { y: -1 })) {
          setGameStatus("PLAYING");

          return;
        }

        moveCount.current = 0;
        lowestY.current = null;

        handleLineClears();
      }

      if (instant) {
        commitLockdown();
      } else {
        // If game is paused, commit lockdown on resume
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
                commitLockdown();

                break;
            }
          }
        );

        lockdownTimeoutId.current = window.setTimeout(() => {
          removePauseListener();
          commitLockdown();
        }, LOCKDOWN_TIMEOUT);
      }
    },
    [handleLineClears, setGameStatus]
  );

  // Lockdown triggering logic
  useEffect(() => {
    if (!activeTetromino) return;

    if (gameStatus.is("HARD_DROP")) {
      lockdown(true);

      return;
    }

    const isAtBound = activeTetromino.isAtBound(lockedCoords, { y: -1 });

    switch (gameStatus.toString()) {
      case "PLAYING":
      case "SOFT_DROP":
        if (isAtBound) {
          if (moveCount.current >= MAX_MOVE_COUNT) {
            lockdown(true);
          } else {
            lockdown();
          }
        } else if (moveCount.current > 0) {
          if (activeTetromino.coords.some((c) => c.y < lowestY.current!)) {
            moveCount.current = 0;
            lowestY.current = null;
          } else if (moveCount.current < MAX_MOVE_COUNT) {
            moveCount.current += 1;
          }
        }

        break;
      case "LOCK_DOWN":
        if (isAtBound) {
          if (moveCount.current >= MAX_MOVE_COUNT) {
            lockdown(true);
          } else {
            lockdown();

            moveCount.current += 1;
          }
        } else {
          setGameStatus("PLAYING");
          window.clearTimeout(lockdownTimeoutId.current!);
          lockdownTimeoutId.current = null;
        }

        break;
    }

    if (isAtBound) {
      // Lowest at-bound coord
      lowestY.current = Math.min(
        lowestY.current ?? Infinity,
        ...activeTetromino.coords
          .filter((c) => c.y <= 0 || c.clone().subtract({ y: 1 }).isIn(lockedCoords))
          .map((c) => c.y)
      );
    }
  }, [activeTetromino, gameStatus, lockdown, lockedCoords, setGameStatus]);
}
