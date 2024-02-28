import { useCallback, useEffect, useRef, useState } from "react";

import { TETROMINOES } from "../resources";
import { useStore } from "../store";
import { RepeatingTuple, setCustomInterval } from "../utils";

import { Coord } from "./coord";
import { getDropInterval, useScore } from "./score";

export type TetrominoType = "I" | "J" | "L" | "O" | "S" | "T" | "Z";
export type TetrominoCoords = RepeatingTuple<Coord, 4>;
export type TetrominoCoordsState = {
  active: TetrominoCoords | [];
  ghost: TetrominoCoords | [];
  locked: Coord[];
};

const LOCK_DOWN_TIMEOUT = 500;
const MATRIX = {
  rows: 20,
  columns: 10,
};

/** Returns true if passed coord will collide with current locked coords. */
export function willCollide(lockedCoords: Coord[], coord: Coord): boolean {
  return coord.isIn(lockedCoords) || coord.x < 0 || coord.x > 9 || coord.y < 0;
}

/** Checks if current tetromino is at the right, left, or bottom bound. */
function isAtBound(
  active: TetrominoCoordsState["active"],
  locked: TetrominoCoordsState["locked"],
  coord: Partial<Coord>
): boolean {
  return active.some((c) => {
    return willCollide(locked, c.clone().add(coord));
  });
}

/**
 * Checks each row, top to bottom, and returns the lowest point the passed coords
 * can sit without colliding.
 */
export function getDropPoint(coords: TetrominoCoords, lockedCoords: Coord[]) {
  for (let i = 0; i <= MATRIX.rows; i += 1) {
    const nextCoords = coords.map((c) => {
      return c.clone().add({ y: -i });
    }) as TetrominoCoords;
    const isAtBottom = isAtBound(nextCoords, lockedCoords, { y: -1 });

    if (isAtBottom) {
      return nextCoords;
    }
  }

  return coords;
}

/** Plots the passed tetromino at the top of the matrix. */
export function plotTetromino(tetromino: TetrominoType) {
  return TETROMINOES[tetromino].coords.map((c) => {
    return c.clone().add({
      x: TETROMINOES[tetromino].startX,
      y: MATRIX.rows - 1,
    });
  }) as TetrominoCoords;
}

export function useTetromino(
  scoreLineClear: ReturnType<typeof useScore>["scoreLineClear"]
) {
  const currentLevel = useStore((state) => state.currentLevel);
  const gameOver = useStore((state) => state.gameOver);
  const setGameOver = useStore((state) => state.setGameOver);
  const tetrominoQueue = useStore((state) => state.tetrominoQueue);
  const nextTetromino = useStore((state) => state.nextTetromino);
  const tetrominoCoords = useStore((state) => state.tetrominoCoords);
  const setTetrominoCoords = useStore((state) => state.setTetrominoCoords);
  const setRotationStage = useStore((state) => state.setRotationStage);

  const dropIntervalId = useRef<number | null>(null);
  const lockDownTimeoutId = useRef<number | null>(null);
  const isHardDrop = useRef(false);

  const [dropInterval, setDropInterval] = useState<number | null>(
    getDropInterval(currentLevel)
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
    [tetrominoCoords, scoreLineClear, currentLevel, setTetrominoCoords]
  );

  /** Locks down active tetromino. */
  const lockDown = useCallback(
    (instant?: boolean) => {
      if (lockDownTimeoutId.current) {
        window.clearTimeout(lockDownTimeoutId.current);
      }

      function commitLockDown() {
        lockDownTimeoutId.current = null;

        // Prevent floating tetrominoes
        if (!isAtBound(tetrominoCoords.active, tetrominoCoords.locked, { y: -1 })) return;

        const { next } = nextTetromino();

        setRotationStage(0);
        handleLineClears(next);
      }

      if (instant) {
        commitLockDown();
      } else {
        lockDownTimeoutId.current = window.setTimeout(commitLockDown, LOCK_DOWN_TIMEOUT);
      }
    },
    [tetrominoCoords, nextTetromino, setRotationStage, handleLineClears]
  );

  /** Moves the current tetromino in the passed direction. */
  const moveTetromino = useCallback(
    (coord: Partial<Coord>): void => {
      setTetrominoCoords((curr) => {
        if (isAtBound(curr.active, curr.locked, coord)) {
          return curr;
        }

        return {
          ...curr,
          active: curr.active.map((c) => c.clone().add(coord)) as TetrominoCoords,
        };
      });
    },
    [setTetrominoCoords]
  );

  // Plot initial tetromino
  const initialTetromino = useRef(tetrominoQueue.next);

  useEffect(() => {
    setTetrominoCoords((curr) => ({
      ...curr,
      active: plotTetromino(initialTetromino.current),
    }));
  }, [setTetrominoCoords]);

  // Tetromino has hit lower limit
  useEffect(() => {
    if (!isAtBound(tetrominoCoords.active, tetrominoCoords.locked, { y: -1 })) return;

    const allCoords = [...tetrominoCoords.active, ...tetrominoCoords.locked];

    // GAME OVER
    if (allCoords.some((c) => c.y >= MATRIX.rows - 1)) {
      setGameOver(true);

      window.clearInterval(dropIntervalId.current!);

      console.log("GAME OVER");
    } else if (isHardDrop.current) {
      lockDown(true);

      isHardDrop.current = false;
    } else {
      lockDown();
    }
  }, [tetrominoCoords, lockDown, setGameOver]);

  // Re-initiate lock down if piece is moved
  useEffect(() => {
    if (gameOver || !lockDownTimeoutId.current) return;

    lockDown();
  }, [tetrominoCoords.active, lockDown, gameOver]);

  // Ghost tetromino
  useEffect(() => {
    setTetrominoCoords((curr) => ({
      ...curr,
      ghost: curr.active.length === 0 ? [] : getDropPoint(curr.active, curr.locked),
    }));
  }, [setTetrominoCoords, tetrominoCoords.active, tetrominoCoords.locked]);

  // Drop interval
  useEffect(() => {
    if (dropInterval === null) return;

    console.log("dropInterval", dropInterval);

    dropIntervalId.current = window.setInterval(() => {
      moveTetromino({ y: -1 });
    }, dropInterval);

    return () => {
      window.clearInterval(dropIntervalId.current!);
    };
  }, [moveTetromino, dropInterval, tetrominoQueue.next]);

  // Update drop interval on level change
  useEffect(() => {
    setDropInterval(getDropInterval(currentLevel));
  }, [currentLevel]);

  return {
    isHardDrop,
    dropInterval,
    setDropInterval,
    moveTetromino,
  };
}
