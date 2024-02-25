import { useCallback, useEffect, useRef, useState } from "react";

import { TETROMINOES, WALL_KICKS } from "../resources";
import { bagShuffle, RepeatingTuple, setCustomInterval, useInitRef } from "../utils";

import { Coord } from "./coord";
import { getDropInterval, useScore } from "./score";

export type TetrominoType = "I" | "J" | "L" | "O" | "S" | "T" | "Z";
export type TetrominoCoords = RepeatingTuple<Coord, 4>;
export type TetrominoCoordsState = {
  active: TetrominoCoords | [];
  ghost: TetrominoCoords | [];
  locked: Coord[];
};

type RotationStage = 0 | 1 | 2 | 3;

const LOCK_DOWN_TIMEOUT = 500;
const MATRIX = {
  rows: 20,
  columns: 10,
};

export const INTERVAL = {
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

export function useTetromino(
  gameOver: { current: boolean },
  currentLevel: ReturnType<typeof useScore>["currentLevel"],
  scoreLineClear: ReturnType<typeof useScore>["scoreLineClear"]
) {
  const dropIntervalId = useRef<number | null>(null);
  const lockDownTimeoutId = useRef<number | null>(null);

  const randomTetrominoGen = useInitRef(() => {
    return bagShuffle(Object.keys(TETROMINOES) as TetrominoType[]);
  });
  const currentTetrominoQueue = useInitRef(() => randomTetrominoGen.current.next().value);

  const [dropInterval, setDropInterval] = useState<number | null>(
    getDropInterval(currentLevel)
  );
  const [rotationStage, setRotationStage] = useState<RotationStage>(0);
  const [tetrominoCoords, setTetrominoCoords] = useState<TetrominoCoordsState>({
    active: TETROMINOES[currentTetrominoQueue.current.next].coords.map((c) => {
      return c.clone().add({
        x: TETROMINOES[currentTetrominoQueue.current.next].startX,
        y: MATRIX.rows - 1,
      });
    }) as TetrominoCoords,
    ghost: [],
    locked: [],
  });

  /** Sets new tetromino. */
  const newTetromino = useCallback((): TetrominoCoords => {
    currentTetrominoQueue.current = randomTetrominoGen.current.next().value;

    setRotationStage(0);

    return TETROMINOES[currentTetrominoQueue.current.next].coords.map((c) => {
      return c.clone().add({
        x: TETROMINOES[currentTetrominoQueue.current.next].startX,
        y: MATRIX.rows - 1,
      });
    }) as TetrominoCoords;
  }, [currentTetrominoQueue, randomTetrominoGen]);

  /** Clears full lines and sets new tetromino. */
  const handleLineClears = useCallback(() => {
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
            active: nextTetromino,
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
        active: nextTetromino,
        locked: [...curr.active, ...curr.locked],
      }));
    }
  }, [tetrominoCoords, newTetromino, scoreLineClear, currentLevel]);

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
    if (currentTetrominoQueue.current.next === "O") return;

    const nextRotationStage = ((rotationStage + 1) % 4) as RotationStage;
    const { pivotIndex } = TETROMINOES[currentTetrominoQueue.current.next];

    const wallKicks = WALL_KICKS.find((k) => {
      return (k.appliesTo as TetrominoType[]).includes(
        currentTetrominoQueue.current.next
      );
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
    if (tetrominoCoords.locked.some((c) => c.y >= MATRIX.rows - 1)) {
      gameOver.current = true;

      window.clearInterval(dropIntervalId.current!);

      console.log("GAME OVER");
      // Hard drop
    } else if (dropInterval === INTERVAL.hardDrop) {
      lockDown(true);
      setDropInterval(getDropInterval(currentLevel));
    } else {
      lockDown();
    }
  }, [tetrominoCoords, dropInterval, lockDown, gameOver, currentLevel]);

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
      for (let i = 0; i <= MATRIX.rows; i += 1) {
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

    console.log("dropInterval", dropInterval);

    dropIntervalId.current = window.setInterval(() => {
      moveTetromino({ y: -1 });
    }, dropInterval);

    return () => {
      window.clearInterval(dropIntervalId.current!);
    };
  }, [moveTetromino, dropInterval]);

  // Update drop interval on level change
  useEffect(() => {
    setDropInterval(getDropInterval(currentLevel));
  }, [currentLevel]);

  return {
    currentTetrominoQueue,
    dropInterval,
    setDropInterval,
    tetrominoCoords,
    moveTetromino,
    rotateTetromino,
  };
}
