import { useCallback, useEffect, useRef } from "react";

import { TETROMINOES } from "../resources";
import { RepeatingTuple } from "../utils";

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
  const currentLevel = useStore((state) => state.currentLevel);
  const gameOver = useStore((state) => state.gameOver);
  const tetrominoQueue = useStore((state) => state.tetrominoQueue);
  const tetrominoCoords = useStore((state) => state.tetrominoCoords);
  const setTetrominoCoords = useStore((state) => state.setTetrominoCoords);
  const dropInterval = useStore((state) => state.dropInterval);
  const setDropInterval = useStore((state) => state.setDropInterval);
  const setDropIntervalId = useStore((state) => state.setDropIntervalId);

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
    if (gameOver) return;

    setTetrominoCoords((curr) => ({
      ...curr,
      active: plotTetromino(initialTetromino.current),
    }));
  }, [setTetrominoCoords, gameOver]);

  // Ghost tetromino
  useEffect(() => {
    if (gameOver) return;

    setTetrominoCoords((curr) => ({
      ...curr,
      ghost: curr.active.length === 0 ? [] : getDropPoint(curr.active, curr.locked),
    }));
  }, [gameOver, setTetrominoCoords, tetrominoCoords.active, tetrominoCoords.locked]);

  // Drop interval
  useEffect(() => {
    if (gameOver || dropInterval === null) return;

    console.log("dropInterval", dropInterval);

    const intervalId = window.setInterval(() => {
      moveTetromino({ y: -1 });
    }, dropInterval);

    setDropIntervalId(intervalId);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [gameOver, moveTetromino, dropInterval, setDropIntervalId, tetrominoQueue.next]);

  // Update drop interval on level change
  useEffect(() => {
    setDropInterval(getDropInterval(currentLevel));
  }, [setDropInterval, currentLevel]);

  return {
    moveTetromino,
  };
}
