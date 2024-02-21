import { useCallback, useEffect, useRef, useState } from "react";

import { TETROMINOES, WALL_KICKS } from "../resources";
import { bagShuffle, RepeatingTuple, setCustomInterval, useInitRef } from "../utils";

import { Coord } from "./coord";

export type TetrominoType = "I" | "J" | "L" | "O" | "S" | "T" | "Z";
export type TetrominoCoords = RepeatingTuple<Coord, 4>;
export type TetrominoCoordsState = {
  active: TetrominoCoords | [];
  ghost: TetrominoCoords | [];
  locked: Coord[];
};

type RotationStage = 0 | 1 | 2 | 3;

const LOCK_DOWN_TIMEOUT = 500;

export const INTERVAL = {
  initialDrop: 1000,
  softDrop: 100,
  hardDrop: 0.1,
  leftRight: 50,
} as const;

/** Returns true if passed coord will collide with current locked coords. */
function willCollide(lockedCoords: Coord[], coord: Coord): boolean {
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

export function useTetromino(gameOver: { current: boolean }): {
  dropInterval: number | null;
  setDropInterval: (interval: number | null) => void;
  tetrominoCoords: TetrominoCoordsState;
  moveTetromino: (coord: Partial<Coord>) => void;
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
  const [tetrominoCoords, setTetrominoCoords] = useState<TetrominoCoordsState>({
    active: TETROMINOES[currentTetrominoType.current].coords.map((c) => {
      return c.clone().add({
        x: TETROMINOES[currentTetrominoType.current].startX,
        y: 19,
      });
    }) as TetrominoCoords,
    ghost: [],
    locked: [],
  });

  /** Sets new tetromino. */
  const newTetromino = useCallback((): TetrominoCoords => {
    currentTetrominoType.current = randomTetrominoGen.current.next().value;

    setRotationStage(0);

    return TETROMINOES[currentTetrominoType.current].coords.map((c) => {
      return c.clone().add({
        x: TETROMINOES[currentTetrominoType.current].startX,
        y: 19,
      });
    }) as TetrominoCoords;
  }, [currentTetrominoType, randomTetrominoGen]);

  /** Clears full lines and sets new tetromino. */
  const handleLineClears = useCallback(() => {
    const allTetrominoCoords = [
      ...tetrominoCoords.active,
      ...tetrominoCoords.locked,
    ].sort((a, b) => b.toIndex() - a.toIndex());
    const rows: Coord[][] = [];
    const linesToClear = new Set<number>();

    allTetrominoCoords.forEach((coord) => {
      const { row } = coord;
      const adjustedIndex = coord.clone().add({ y: -linesToClear.size });

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
            setTetrominoCoords((curr) => ({
              ...curr,
              active: [],
              locked: [...curr.active, ...curr.locked].filter((coord) => {
                const { x, row } = coord;

                // With each iteration we clear the two innermost minos
                return !linesToClear.has(row) || (x !== 4 - count && x !== 5 + count);
              }),
            }));

            return;
          }

          // Push rows down and set new tetromino
          setTetrominoCoords((curr) => ({
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
      setTetrominoCoords((curr) => ({
        ...curr,
        active: nextTetromino,
        locked: [...curr.active, ...curr.locked],
      }));
    }
  }, [tetrominoCoords, newTetromino]);

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

        handleLineClears();
      }

      if (instant) {
        commitLockDown();
      } else {
        lockDownTimeoutId.current = window.setTimeout(commitLockDown, LOCK_DOWN_TIMEOUT);
      }
    },
    [tetrominoCoords, handleLineClears]
  );

  /** Moves the current tetromino in the passed direction. */
  const moveTetromino = useCallback((coord: Partial<Coord>): void => {
    setTetrominoCoords((curr) => {
      if (isAtBound(curr.active, curr.locked, coord)) {
        return curr;
      }

      return {
        ...curr,
        active: curr.active.map((c) => c.clone().add(coord)) as TetrominoCoords,
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

      const newCoords: TetrominoCoords | [] = [...tetrominoCoords.active];

      const newPosWillCollide = tetrominoCoords.active.some((coord, i) => {
        const pivotCoord = tetrominoCoords.active[pivotIndex]!.clone();

        const rotatedDiff = new Coord({
          x: coord.x - pivotCoord.x,
          y: coord.y - pivotCoord.y,
        }).rotate();

        const newCoord = pivotCoord.add(rotatedDiff, adjustedWallKick);

        if (willCollide(tetrominoCoords.locked, newCoord)) {
          // Will collide, so we return and move on to the next wall kick
          return true;
        }

        newCoords[i] = newCoord;

        return false;
      });

      if (!newPosWillCollide) {
        setRotationStage(nextRotationStage);

        setTetrominoCoords((curr) => ({
          ...curr,
          active: newCoords,
        }));

        return;
      }
    }
  }

  // Tetromino has hit lower limit
  useEffect(() => {
    if (!isAtBound(tetrominoCoords.active, tetrominoCoords.locked, { y: -1 })) return;

    // GAME OVER
    if (tetrominoCoords.locked.some((c) => c.y >= 19)) {
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
  }, [tetrominoCoords, dropInterval, lockDown, gameOver]);

  // Re-initiate lock down if piece is moved
  useEffect(() => {
    if (gameOver.current || !lockDownTimeoutId.current) return;

    lockDown();
  }, [tetrominoCoords.active, lockDown, gameOver]);

  // Ghost tetromino
  useEffect(() => {
    setTetrominoCoords((curr) => {
      if (curr.active.length === 0) {
        return {
          ...curr,
          ghost: [],
        };
      }

      // Search each row until bottom bound is found
      const callLimit = 20;

      for (let i = 0; i <= callLimit; i += 1) {
        const nextCoords = curr.active.map((c) => {
          return c.clone().add({ y: -i });
        }) as TetrominoCoords;
        const isAtBottom = isAtBound(nextCoords, curr.locked, { y: -1 });

        if (isAtBottom) {
          return {
            ...curr,
            ghost: nextCoords,
          };
        }
      }

      return curr;
    });
  }, [tetrominoCoords.active, tetrominoCoords.locked]);

  // Drop interval
  useEffect(() => {
    if (dropInterval === null) return;

    dropIntervalId.current = window.setInterval(() => {
      moveTetromino({ y: -1 });
    }, dropInterval);

    return () => {
      window.clearInterval(dropIntervalId.current!);
    };
  }, [moveTetromino, dropInterval]);

  return {
    dropInterval,
    setDropInterval,
    tetrominoCoords,
    moveTetromino,
    rotateTetromino,
  };
}
