import { useCallback, useEffect, useRef } from "react";

import { TETROMINOES } from "../resources";
import { RepeatingTuple, setCustomInterval } from "../utils";

import { Coord } from "./coord";
import { getDropInterval } from "./score";
import { useStore } from "./store";

export type TetrominoType = "I" | "J" | "L" | "O" | "S" | "T" | "Z";
export type TetrominoCoords = RepeatingTuple<Coord, 4>;
export type TetrominoCoordsState = {
  active: TetrominoCoords | [];
  ghost: TetrominoCoords | [];
  locked: Coord[];
};

export const MATRIX = {
  rows: 20,
  columns: 10,
};

/** Returns true if passed coord will collide with current locked coords. */
export function willCollide(lockedCoords: Coord[], coord: Coord): boolean {
  return coord.isIn(lockedCoords) || coord.x < 0 || coord.x > 9 || coord.y < 0;
}

/** Checks if current tetromino is at the right, left, or bottom bound. */
export function isAtBound(
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

export function useTetromino() {
  const currentLevel = useStore((s) => s.currentLevel);
  const gameOver = useStore((s) => s.gameOver);
  const tetrominoQueue = useStore((s) => s.tetrominoQueue);
  const tetrominoCoords = useStore((s) => s.tetrominoCoords);
  const setTetrominoCoords = useStore((s) => s.setTetrominoCoords);
  const dropInterval = useStore((s) => s.dropInterval);
  const setDropInterval = useStore((s) => s.setDropInterval);
  const setDropIntervalData = useStore((s) => s.setDropIntervalData);
  const setScore = useStore((s) => s.setScore);
  const isSoftDrop = useStore((s) => s.isSoftDrop);
  const isLockDown = useStore((s) => s.isLockDown);

  const resetTrigger = useRef(0);

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
  useEffect(() => {
    if (gameOver) return;

    setTetrominoCoords((curr) => ({
      ...curr,
      active: plotTetromino(tetrominoQueue.next),
    }));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setTetrominoCoords, gameOver, resetTrigger.current]);

  // Ghost tetromino
  useEffect(() => {
    if (gameOver) return;

    setTetrominoCoords((curr) => ({
      ...curr,
      ghost: curr.active.length === 0 ? [] : getDropPoint(curr.active, curr.locked),
    }));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gameOver,
    setTetrominoCoords,
    tetrominoCoords.active,
    tetrominoCoords.locked,
    resetTrigger.current,
  ]);

  // Drop interval
  useEffect(() => {
    if (gameOver || dropInterval === null) return;

    console.log("dropInterval", dropInterval);

    const intervalData = setCustomInterval(
      () => {
        moveTetromino({ y: -1 });

        if (isSoftDrop && !isLockDown) {
          // Soft drop score = n lines
          setScore((curr) => curr + 1);
        }
      },
      dropInterval,
      { delay: dropInterval }
    );

    setDropIntervalData(intervalData);

    return () => {
      intervalData.clear();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gameOver,
    moveTetromino,
    dropInterval,
    setDropIntervalData,
    tetrominoQueue.next,
    isSoftDrop,
    setScore,
    isLockDown,
    resetTrigger.current,
  ]);

  // Update drop interval on level change
  useEffect(() => {
    setDropInterval(getDropInterval(currentLevel));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setDropInterval, currentLevel, resetTrigger.current]);

  return {
    moveTetromino,
    resetTetromino: () => {
      resetTrigger.current += 1;
    },
  };
}
