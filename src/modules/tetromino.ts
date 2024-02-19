import { useCallback, useEffect, useRef, useState } from "react";

import { TETROMINOES, WALL_KICKS } from "../resources";
import { bagShuffle, RepeatingTuple, setCustomInterval, useInitRef } from "../utils";

import { Coord } from "./coord";

export type TetrominoType = "I" | "J" | "L" | "O" | "S" | "T" | "Z";
export type TetrominoIndices = RepeatingTuple<number, 4>;
export type TetrominoIndicesState = {
  active: TetrominoIndices | [];
  ghost: TetrominoIndices | [];
  locked: number[];
};

type RotationStage = 0 | 1 | 2 | 3;

const LOCK_DOWN_TIMEOUT = 500;

export const INTERVAL = {
  initialDrop: 1000,
  softDrop: 100,
  hardDrop: 0.1,
  leftRight: 50,
} as const;

export const MOVEMENT = {
  left: -1,
  right: 1,
  down: 10,
} as const;

/** Returns true if passed coords will collide with current locked indices. */
function willCollide(lockedIndices: number[], coord: Coord): boolean {
  return (
    lockedIndices.includes(coord.toIndex()) || coord.x < 0 || coord.x > 9 || coord.y < 0
  );
}

/** Checks if current tetromino is at the right, left, or bottom bound. */
function isAtBound(
  active: TetrominoIndicesState["active"],
  locked: TetrominoIndicesState["locked"],
  direction: keyof typeof MOVEMENT
): boolean {
  return active.some((i) => {
    const newCoord = Coord.fromIndex(i);

    if (direction === "down") {
      newCoord.y += -(MOVEMENT[direction] / 10);
    } else {
      newCoord.x += MOVEMENT[direction];
    }

    return willCollide(locked, newCoord);
  });
}

export function useTetromino(gameOver: { current: boolean }): {
  dropInterval: number | null;
  setDropInterval: (interval: number | null) => void;
  tetrominoIndices: TetrominoIndicesState;
  moveTetromino: (direction: keyof typeof MOVEMENT) => void;
  rotateTetromino: () => void;
} {
  const dropIntervalId = useRef<number | null>(null);
  const lockDownTimeoutId = useRef<number | null>(null);

  const randomTetrominoGen = useInitRef(() => {
    return bagShuffle(Object.keys(TETROMINOES) as TetrominoType[]);
  });
  const currentTetrominoType = useInitRef(() => randomTetrominoGen.current.next().value);

  const [dropInterval, setDropInterval] = useState<number | null>(INTERVAL.initialDrop);
  const [rotationStage, setRotationStage] = useState<RotationStage>(0);
  const [tetrominoIndices, setTetrominoIndices] = useState<TetrominoIndicesState>({
    active: TETROMINOES[currentTetrominoType.current].initialIndices,
    ghost: [],
    locked: [],
  });

  /** Sets new tetromino. */
  const newTetromino = useCallback(() => {
    currentTetrominoType.current = randomTetrominoGen.current.next().value;

    setRotationStage(0);

    return TETROMINOES[currentTetrominoType.current].initialIndices;
  }, [currentTetrominoType, randomTetrominoGen]);

  /** Clears full lines and sets new tetromino. */
  const handleLineClears = useCallback(() => {
    const allTetrominoIndices = [
      ...tetrominoIndices.active,
      ...tetrominoIndices.locked,
    ].sort((a, b) => b - a);
    const rows: number[][] = [];
    const linesToClear = new Set<number>();

    allTetrominoIndices.forEach((tetIndex) => {
      const row = Math.floor(tetIndex / 10);
      const adjustedIndex = tetIndex + linesToClear.size * 10;

      if (rows[row]) {
        rows[row]!.push(adjustedIndex);

        if (rows[row]!.length === 10) {
          rows.splice(row, 1);
          linesToClear.add(row);
        }
      } else {
        rows[row] = [adjustedIndex];
      }
    });

    const nextTetromino = newTetromino();

    // Clear lines
    if (linesToClear.size > 0) {
      // Prevent drop interval running during animation
      setDropInterval(null);

      setCustomInterval(
        ({ count }) => {
          // Clear animation
          if (count < 5) {
            setTetrominoIndices((curr) => ({
              ...curr,
              active: [],
              locked: [...curr.active, ...curr.locked].filter((i) => {
                const { x, row } = Coord.fromIndex(i);

                // With each iteration we clear the two innermost minos
                return !linesToClear.has(row) || (x !== 4 - count && x !== 5 + count);
              }),
            }));

            return;
          }

          // Push rows down and set new tetromino
          setTetrominoIndices((curr) => ({
            ...curr,
            active: nextTetromino,
            locked: rows.flat(),
          }));

          // Reset drop interval
          setDropInterval(INTERVAL.initialDrop);
        },
        60,
        { limit: 5 }
      );
    } else {
      setTetrominoIndices((curr) => ({
        ...curr,
        active: nextTetromino,
        locked: [...curr.active, ...curr.locked],
      }));
    }
  }, [tetrominoIndices, newTetromino]);

  /** Locks down active tetromino. */
  const lockDown = useCallback(
    (instant?: boolean) => {
      if (lockDownTimeoutId.current) {
        window.clearTimeout(lockDownTimeoutId.current);
      }

      function commitLockDown() {
        lockDownTimeoutId.current = null;

        // Prevent floating tetrominoes
        if (!isAtBound(tetrominoIndices.active, tetrominoIndices.locked, "down")) return;

        handleLineClears();
      }

      if (instant) {
        commitLockDown();
      } else {
        lockDownTimeoutId.current = window.setTimeout(commitLockDown, LOCK_DOWN_TIMEOUT);
      }
    },
    [tetrominoIndices, handleLineClears]
  );

  /** Moves the current tetromino in the passed direction. */
  const moveTetromino = useCallback((direction: keyof typeof MOVEMENT): void => {
    setTetrominoIndices((curr) => {
      if (isAtBound(curr.active, curr.locked, direction)) {
        return curr;
      }

      return {
        ...curr,
        active: curr.active.map((i) => i + MOVEMENT[direction]) as TetrominoIndices,
      };
    });
  }, []);

  /** Rotates the current tetromino. */
  function rotateTetromino() {
    if (currentTetrominoType.current === "O") return;

    const nextRotationStage = ((rotationStage + 1) % 4) as RotationStage;
    const { pivotIndex } = TETROMINOES[currentTetrominoType.current];

    const wallKicks = WALL_KICKS.find((k) => {
      return (k.appliesTo as TetrominoType[]).includes(currentTetrominoType.current);
    })!;

    // Attempt initial rotation then try each wall kick until it doesn't collide
    for (let kickI = 0; kickI < wallKicks.offsets.length + 1; kickI += 1) {
      /** See {@link WALL_KICKS} type definition for how this works. */
      const wallKickClone = wallKicks.offsets[rotationStage]![kickI]!.clone();
      const adjustedWallKick = wallKickClone.subtract(
        wallKicks.offsets[nextRotationStage]![kickI]!
      );

      const newIndices: TetrominoIndices | [] = [...tetrominoIndices.active];

      const newPosWillCollide = tetrominoIndices.active.some((tetIndex, i) => {
        const currCoord = Coord.fromIndex(tetIndex);
        const pivotCoord = Coord.fromIndex(tetrominoIndices.active[pivotIndex]!);

        const rotatedDiff = new Coord({
          x: currCoord.x - pivotCoord.x,
          y: currCoord.y - pivotCoord.y,
        }).rotate();

        const newCoord = pivotCoord.add(rotatedDiff, adjustedWallKick);

        if (willCollide(tetrominoIndices.locked, newCoord)) {
          // Will collide, so we return and move on to the next wall kick
          return true;
        }

        newIndices[i] = newCoord.toIndex();

        return false;
      });

      if (!newPosWillCollide) {
        setRotationStage(nextRotationStage);

        setTetrominoIndices((curr) => ({
          ...curr,
          active: newIndices,
        }));

        return;
      }
    }
  }

  // Tetromino has hit lower limit
  useEffect(() => {
    if (!isAtBound(tetrominoIndices.active, tetrominoIndices.locked, "down")) return;

    // GAME OVER
    if (tetrominoIndices.locked.some((i) => i <= 9)) {
      gameOver.current = true;

      window.clearInterval(dropIntervalId.current!);

      console.log("GAME OVER");
      // Hard drop
    } else if (dropInterval === INTERVAL.hardDrop) {
      setDropInterval(INTERVAL.initialDrop);
      lockDown(true);
    } else {
      lockDown();
    }
  }, [tetrominoIndices, dropInterval, lockDown, gameOver]);

  // Re-initiate lock down if piece is moved
  useEffect(() => {
    if (gameOver.current || !lockDownTimeoutId.current) return;

    lockDown();
  }, [tetrominoIndices.active, lockDown, gameOver]);

  // Ghost tetromino
  useEffect(() => {
    setTetrominoIndices((curr) => {
      if (curr.active.length === 0) {
        return {
          ...curr,
          ghost: [],
        };
      }

      // Search each row until bottom bound is found
      const callLimit = 20;

      for (let i = 0; i <= callLimit; i += 1) {
        const isAtBottom = isAtBound(
          curr.active.map((j) => j + i * 10) as TetrominoIndices,
          curr.locked,
          "down"
        );

        if (isAtBottom) {
          return {
            ...curr,
            ghost: curr.active.map((j) => j + i * 10) as TetrominoIndices,
          };
        }
      }

      return curr;
    });
  }, [tetrominoIndices.active, tetrominoIndices.locked]);

  // Drop interval
  useEffect(() => {
    if (dropInterval === null) return;

    dropIntervalId.current = window.setInterval(() => {
      moveTetromino("down");
    }, dropInterval);

    return () => {
      window.clearInterval(dropIntervalId.current!);
    };
  }, [moveTetromino, dropInterval]);

  return {
    dropInterval,
    setDropInterval,
    tetrominoIndices,
    moveTetromino,
    rotateTetromino,
  };
}
