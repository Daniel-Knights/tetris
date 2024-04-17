import { useCallback, useEffect, useRef } from "react";

import { Coord, Tetromino } from "../classes";
import { MATRIX } from "../components/GameBoard";
import { setFrameSyncInterval } from "../utils";

import { getDropInterval, useScore } from "./score";
import { useStore } from "./store";

const LOCKDOWN_TIMEOUT = 500;

export function useLockdown(
  scoreLineClear: ReturnType<typeof useScore>["scoreLineClear"]
) {
  const currentLevel = useStore((s) => s.currentLevel);
  const gameOver = useStore((s) => s.gameOver);
  const setGameOver = useStore((s) => s.setGameOver);
  const setNextTetromino = useStore((s) => s.setNextTetromino);
  const activeTetromino = useStore((s) => s.activeTetromino);
  const setActiveTetromino = useStore((s) => s.setActiveTetromino);
  const lockedCoords = useStore((s) => s.lockedCoords);
  const setLockedCoords = useStore((s) => s.setLockedCoords);
  const setDropInterval = useStore((s) => s.setDropInterval);
  const isHardDrop = useStore((s) => s.isHardDrop);
  const setIsHardDrop = useStore((s) => s.setIsHardDrop);
  const isLockDown = useStore((s) => s.isLockDown);
  const setIsLockDown = useStore((s) => s.setIsLockDown);
  const dropIntervalData = useStore((s) => s.dropIntervalData);

  const lockdownTimeoutId = useRef<number | null>(null);

  /** Checks if game over and adjusts coords to avoid collision. */
  const handleNewTetromino = useCallback(
    (nextTetromino: Tetromino) => {
      // Avoid stale closures
      const currActiveTetromino = useStore.getState().activeTetromino;
      const allTetrominoCoords = [
        ...(currActiveTetromino?.coords ?? []),
        ...lockedCoords,
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
        setGameOver(true);

        dropIntervalData?.clear();
      }

      setLockedCoords((curr, currActive) => [...(currActive?.coords ?? []), ...curr]);
      setActiveTetromino(() => {
        return nextYAdjustment > 0
          ? nextTetromino.move({ y: nextYAdjustment })
          : nextTetromino;
      });
    },
    [dropIntervalData, lockedCoords, setActiveTetromino, setGameOver, setLockedCoords]
  );

  /** Clears full lines and sets new tetromino. */
  const handleLineClears = useCallback(() => {
    // Avoid stale closures
    const currActiveTetromino = useStore.getState().activeTetromino;

    // Prevent floating tetrominoes
    if (!currActiveTetromino?.isAtBound(lockedCoords, { y: -1 })) {
      return;
    }

    const allTetrominoCoords = [
      ...(currActiveTetromino?.coords ?? []),
      ...lockedCoords,
    ].sort((a, b) => b.toIndex(MATRIX) - a.toIndex(MATRIX));
    const rows: Coord[][] = [];
    const linesToClear = new Set<number>();

    allTetrominoCoords.forEach((coord) => {
      const row = coord.getRow(MATRIX.rows);
      const adjustedIndex = coord.clone().add({ y: -linesToClear.size });

      if (rows[row]) {
        rows[row]!.push(adjustedIndex);

        if (rows[row]!.length === MATRIX.columns) {
          rows.splice(row, 1);
          linesToClear.add(row);
        }
      } else {
        rows[row] = [adjustedIndex];
      }
    });

    const { next } = setNextTetromino();
    const nextTetromino = new Tetromino({ type: next }).plot();

    // Clear lines
    if (linesToClear.size > 0) {
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
                  !linesToClear.has(coord.getRow(MATRIX.rows)) ||
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
        },
        60,
        { limit: 6 }
      );
    } else {
      handleNewTetromino(nextTetromino);
    }
  }, [
    currentLevel,
    handleNewTetromino,
    lockedCoords,
    scoreLineClear,
    setActiveTetromino,
    setDropInterval,
    setLockedCoords,
    setNextTetromino,
  ]);

  /** Locks down active tetromino. */
  const lockDown = useCallback(
    (instant?: boolean) => {
      if (isLockDown) return;

      setIsLockDown(true);

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
        lockdownTimeoutId.current = window.setTimeout(commitLockDown, LOCKDOWN_TIMEOUT);
      }
    },
    [handleLineClears, isLockDown, setIsLockDown]
  );

  // Tetromino has hit lower limit
  useEffect(() => {
    if (gameOver || !activeTetromino?.isAtBound(lockedCoords, { y: -1 })) {
      return;
    }

    if (isHardDrop) {
      lockDown(true);
      setIsHardDrop(false);
    } else {
      lockDown();
    }
  }, [activeTetromino, gameOver, isHardDrop, lockDown, lockedCoords, setIsHardDrop]);

  // Re-initiate lock down if piece is moved
  useEffect(() => {
    function handler(ev: KeyboardEvent) {
      if (!isLockDown || !/Arrow(Up|Left|Right)/.test(ev.key)) {
        return;
      }

      window.clearTimeout(lockdownTimeoutId.current!);
      setIsLockDown(false);
    }

    window.addEventListener("keyup", handler);

    return () => {
      window.removeEventListener("keyup", handler);
    };
  }, [activeTetromino, isLockDown, setIsLockDown]);
}
