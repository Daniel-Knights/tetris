import { useCallback, useEffect, useRef } from "react";

import { setFrameSyncInterval } from "../utils";

import { Coord } from "./coord";
import { getDropInterval, useScore } from "./score";
import { useStore } from "./store";
import {
  isAtBound,
  MATRIX,
  plotTetromino,
  TetrominoCoords,
  TetrominoType,
} from "./tetromino";

const LOCKDOWN_TIMEOUT = 500;

export function useLockdown(
  scoreLineClear: ReturnType<typeof useScore>["scoreLineClear"]
) {
  const currentLevel = useStore((s) => s.currentLevel);
  const gameOver = useStore((s) => s.gameOver);
  const setGameOver = useStore((s) => s.setGameOver);
  const setRotationStage = useStore((s) => s.setRotationStage);
  const nextTetromino = useStore((s) => s.nextTetromino);
  const tetrominoCoords = useStore((s) => s.tetrominoCoords);
  const setTetrominoCoords = useStore((s) => s.setTetrominoCoords);
  const setDropInterval = useStore((s) => s.setDropInterval);
  const isHardDrop = useStore((s) => s.isHardDrop);
  const setIsHardDrop = useStore((s) => s.setIsHardDrop);
  const isLockDown = useStore((s) => s.isLockDown);
  const setIsLockDown = useStore((s) => s.setIsLockDown);
  const dropIntervalData = useStore((s) => s.dropIntervalData);

  const lockdownTimeoutId = useRef<number | null>(null);

  /** Checks if game over and adjusts coords to avoid collision. */
  const handleGameOver = useCallback(
    (nextCoords: TetrominoCoords) => {
      const lockedCoords = [...tetrominoCoords.active, ...tetrominoCoords.locked];

      let isGameOver = false;
      let nextYAdjustment = 0;

      nextCoords.forEach((c) => {
        // Can only ever be pushed up by a max of 2 rows
        if (nextYAdjustment === 2) return;

        if (c.isIn(lockedCoords)) {
          isGameOver = true;
          nextYAdjustment = 1;
        }

        if (c.clone().add({ y: 1 }).isIn(lockedCoords)) {
          nextYAdjustment = 2;
        }
      });

      if (isGameOver) {
        setGameOver(true);

        dropIntervalData?.clear();
      }

      if (nextYAdjustment > 0) {
        return nextCoords.map((c) => {
          return c.clone().add({ y: nextYAdjustment });
        }) as TetrominoCoords;
      }

      return nextCoords;
    },
    [dropIntervalData, setGameOver, tetrominoCoords.active, tetrominoCoords.locked]
  );

  /** Clears full lines and sets new tetromino. */
  const handleLineClears = useCallback(
    (nextTetrominoType: TetrominoType) => {
      const allTetrominoCoords = [
        ...tetrominoCoords.active,
        ...tetrominoCoords.locked,
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

      const nextTetrominoCoords = plotTetromino(nextTetrominoType);

      // Clear lines
      if (linesToClear.size > 0) {
        // Prevent drop interval running during animation
        setDropInterval(null);

        setFrameSyncInterval(
          ({ count }) => {
            // Clear animation
            if (count < 6) {
              setTetrominoCoords((curr) => ({
                ...curr,
                active: [],
                locked: [...curr.active, ...curr.locked].filter((coord) => {
                  const { x } = coord;

                  // With each iteration we clear the two innermost minos
                  return (
                    !linesToClear.has(coord.getRow(MATRIX.rows)) ||
                    (x !== 5 - count && x !== 4 + count)
                  );
                }),
              }));

              return;
            }

            // Push rows down and set new tetromino
            setTetrominoCoords((curr) => ({
              ...curr,
              active: nextTetrominoCoords,
              locked: rows.flat(),
            }));

            scoreLineClear(linesToClear.size as 1 | 2 | 3 | 4);
            setDropInterval(getDropInterval(currentLevel));
          },
          60,
          { limit: 6 }
        );
      } else {
        setTetrominoCoords((curr) => ({
          ...curr,
          active: handleGameOver(nextTetrominoCoords),
          locked: [...curr.active, ...curr.locked],
        }));
      }
    },
    [
      currentLevel,
      handleGameOver,
      scoreLineClear,
      setDropInterval,
      setTetrominoCoords,
      tetrominoCoords.active,
      tetrominoCoords.locked,
    ]
  );

  /** Locks down active tetromino. */
  const lockdown = useCallback(
    (instant?: boolean) => {
      if (isLockDown) return;

      setIsLockDown(true);

      if (lockdownTimeoutId.current) {
        window.clearTimeout(lockdownTimeoutId.current);
      }

      function commitLockDown() {
        lockdownTimeoutId.current = null;

        setIsLockDown(false);

        // Prevent floating tetrominoes
        if (!isAtBound(tetrominoCoords.active, tetrominoCoords.locked, { y: -1 })) return;

        const { next } = nextTetromino();

        setRotationStage(0);
        handleLineClears(next);
      }

      if (instant) {
        commitLockDown();
      } else {
        lockdownTimeoutId.current = window.setTimeout(commitLockDown, LOCKDOWN_TIMEOUT);
      }
    },
    [
      handleLineClears,
      isLockDown,
      nextTetromino,
      setIsLockDown,
      setRotationStage,
      tetrominoCoords.active,
      tetrominoCoords.locked,
    ]
  );

  // Tetromino has hit lower limit
  useEffect(() => {
    if (
      gameOver ||
      !isAtBound(tetrominoCoords.active, tetrominoCoords.locked, { y: -1 })
    ) {
      return;
    }

    if (isHardDrop) {
      lockdown(true);
      setIsHardDrop(false);
    } else {
      lockdown();
    }
  }, [
    gameOver,
    isHardDrop,
    lockdown,
    setIsHardDrop,
    tetrominoCoords.active,
    tetrominoCoords.locked,
  ]);

  // Re-initiate lock down if piece is moved
  useEffect(() => {
    if (gameOver) return;

    window.clearTimeout(lockdownTimeoutId.current!);
    setIsLockDown(false);
  }, [tetrominoCoords.active, gameOver, setIsLockDown]);
}
