import { useCallback, useEffect, useRef } from "react";

import { useStore } from "../store";
import { setCustomInterval } from "../utils";

import { Coord } from "./coord";
import { getDropInterval, useScore } from "./score";
import { isAtBound, MATRIX, plotTetromino, TetrominoType } from "./tetromino";

const LOCKDOWN_TIMEOUT = 500;

export function useLockdown(
  scoreLineClear: ReturnType<typeof useScore>["scoreLineClear"]
) {
  const currentLevel = useStore((state) => state.currentLevel);
  const gameOver = useStore((state) => state.gameOver);
  const setGameOver = useStore((state) => state.setGameOver);
  const setRotationStage = useStore((state) => state.setRotationStage);
  const nextTetromino = useStore((state) => state.nextTetromino);
  const tetrominoCoords = useStore((state) => state.tetrominoCoords);
  const setTetrominoCoords = useStore((state) => state.setTetrominoCoords);
  const setDropInterval = useStore((state) => state.setDropInterval);
  const dropIntervalId = useStore((state) => state.dropIntervalId);
  const isHardDrop = useStore((state) => state.isHardDrop);
  const setIsHardDrop = useStore((state) => state.setIsHardDrop);

  const lockdownTimeoutId = useRef<number | null>(null);

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

        setCustomInterval(
          ({ count }) => {
            // Clear animation
            if (count < 5) {
              setTetrominoCoords((curr) => ({
                ...curr,
                active: [],
                locked: [...curr.active, ...curr.locked].filter((coord) => {
                  const { x } = coord;

                  // With each iteration we clear the two innermost minos
                  return (
                    !linesToClear.has(coord.getRow(MATRIX.rows)) ||
                    (x !== 4 - count && x !== 5 + count)
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
          { limit: 5 }
        );
      } else {
        setTetrominoCoords((curr) => ({
          ...curr,
          active: nextTetrominoCoords,
          locked: [...curr.active, ...curr.locked],
        }));
      }
    },
    [tetrominoCoords, scoreLineClear, currentLevel, setTetrominoCoords, setDropInterval]
  );

  /** Locks down active tetromino. */
  const lockdown = useCallback(
    (instant?: boolean) => {
      if (lockdownTimeoutId.current) {
        window.clearTimeout(lockdownTimeoutId.current);
      }

      function commitLockDown() {
        lockdownTimeoutId.current = null;

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
    [tetrominoCoords, nextTetromino, setRotationStage, handleLineClears]
  );

  // Tetromino has hit lower limit
  useEffect(() => {
    if (!isAtBound(tetrominoCoords.active, tetrominoCoords.locked, { y: -1 })) return;

    const allCoords = [...tetrominoCoords.active, ...tetrominoCoords.locked];

    // GAME OVER
    if (allCoords.some((c) => c.y >= MATRIX.rows - 1)) {
      setGameOver(true);

      window.clearInterval(dropIntervalId!);

      console.log("GAME OVER");
    } else if (isHardDrop) {
      lockdown(true);
      setIsHardDrop(false);
    } else {
      lockdown();
    }
  }, [tetrominoCoords, lockdown, setGameOver, dropIntervalId, isHardDrop, setIsHardDrop]);

  // Re-initiate lock down if piece is moved
  useEffect(() => {
    if (gameOver || !lockdownTimeoutId.current) return;

    lockdown();
  }, [tetrominoCoords.active, lockdown, gameOver]);
}