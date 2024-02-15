import { useCallback, useEffect, useRef, useState } from "react";

import { Coord, TETROMINOES, WALL_KICKS } from "../modules";
import type { TetrominoIndices, TetrominoType } from "../modules";
import { bagShuffle, setInstantInterval, useInitRef } from "../utils";

type RotationStage = 0 | 1 | 2 | 3;

const KEYDOWN_DELAY = 300;
const LOCK_DOWN_TIMEOUT = 500;

const INTERVAL = {
  initialDrop: 1000,
  softDrop: 100,
  hardDrop: 0.1,
  leftRight: 50,
} as const;

const MOVEMENT = {
  left: -1,
  right: 1,
  down: 10,
} as const;

function GameBoard(): JSX.Element {
  const randomTetrominoGen = useInitRef(() => {
    return bagShuffle(Object.keys(TETROMINOES) as TetrominoType[]);
  });
  const currentTetrominoType = useInitRef(() => randomTetrominoGen.current.next().value);
  const currentRotationStage = useRef<RotationStage>(0);
  const dropIntervalId = useRef<number | null>(null);
  const leftRightTimeoutId = useRef<number | null>(null);
  const leftRightIntervalId = useRef<number | null>(null);
  const lockDownTimeoutId = useRef<number | null>(null);
  const gameOver = useRef(false);

  const [dropInterval, setDropInterval] = useState<number>(INTERVAL.initialDrop);
  const [tetrominoIndices, setTetrominoIndices] = useState<{
    active: TetrominoIndices;
    locked: number[];
  }>({
    active: TETROMINOES[currentTetrominoType.current].initialIndices,
    locked: [],
  });

  /** Returns true if passed coords will collide with current locked indices. */
  const willCollide = useCallback((lockedIndices: number[], coord: Coord): boolean => {
    return (
      lockedIndices.includes(coord.toIndex()) || coord.x < 0 || coord.x > 9 || coord.y < 0
    );
  }, []);

  /** Checks if current tetromino is at the right, left, or bottom bound. */
  const isAtBound = useCallback(
    (curr: typeof tetrominoIndices, direction: keyof typeof MOVEMENT): boolean => {
      return curr.active.some((i) => {
        const newCoord = Coord.fromIndex(i);

        if (direction === "down") {
          newCoord.y += -(MOVEMENT[direction] / 10);
        } else {
          newCoord.x += MOVEMENT[direction];
        }

        return willCollide(curr.locked, newCoord);
      });
    },
    [willCollide]
  );

  /** Creates a new tetromino. */
  const newTetromino = useCallback(() => {
    currentTetrominoType.current = randomTetrominoGen.current.next().value;
    currentRotationStage.current = 0;

    setTetrominoIndices((curr) => ({
      locked: [...curr.locked, ...curr.active],
      active: TETROMINOES[currentTetrominoType.current].initialIndices,
    }));
  }, [currentTetrominoType, randomTetrominoGen]);

  /** Moves the current tetromino in the passed direction. */
  const moveTetromino = useCallback(
    (direction: keyof typeof MOVEMENT): void => {
      setTetrominoIndices((curr) => {
        if (isAtBound(curr, direction)) {
          return curr;
        }

        return {
          ...curr,
          active: curr.active.map((i) => i + MOVEMENT[direction]) as TetrominoIndices,
        };
      });
    },
    [isAtBound]
  );

  /** Locks down active tetromino after timeout. */
  const lockDown = useCallback(() => {
    if (lockDownTimeoutId.current) {
      window.clearTimeout(lockDownTimeoutId.current);
    }

    lockDownTimeoutId.current = window.setTimeout(() => {
      lockDownTimeoutId.current = null;

      // Prevent floating tetrominoes
      if (!isAtBound(tetrominoIndices, "down")) return;

      newTetromino();
    }, LOCK_DOWN_TIMEOUT);
  }, [newTetromino, isAtBound, tetrominoIndices]);

  /** Rotates the current tetromino. */
  function rotateTetromino() {
    if (currentTetrominoType.current === "O") return;

    const rotationStage = currentRotationStage.current;
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

      const newIndices: TetrominoIndices = [...tetrominoIndices.active];

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
        currentRotationStage.current = nextRotationStage;

        setTetrominoIndices((curr) => ({
          ...curr,
          active: newIndices,
        }));

        return;
      }
    }
  }

  /** Event handler for moving the current tetromino left or right. */
  function moveLeftRight(ev: KeyboardEvent) {
    const direction = {
      ArrowLeft: "left",
      ArrowRight: "right",
    }[ev.key] as "left" | "right" | undefined;

    if (!direction) return;

    /** Clears left/right keydown timers. */
    function clearLeftRightTimers() {
      if (leftRightTimeoutId.current) {
        window.clearTimeout(leftRightTimeoutId.current);

        leftRightTimeoutId.current = null;
      }

      if (leftRightIntervalId.current) {
        window.clearInterval(leftRightIntervalId.current);

        leftRightIntervalId.current = null;
      }
    }

    /** Clear timers on keyup. */
    function leftRightEndListener(keyupEv: KeyboardEvent) {
      if (!/Arrow(?:Left|Right)/.test(keyupEv.key)) return;

      clearLeftRightTimers();

      window.removeEventListener("keyup", leftRightEndListener);
    }

    // Overwrite existing left/right keydown interval
    clearLeftRightTimers();

    window.addEventListener("keyup", leftRightEndListener);

    // Move
    moveTetromino(direction);

    leftRightTimeoutId.current = window.setTimeout(() => {
      leftRightIntervalId.current = setInstantInterval(() => {
        moveTetromino(direction);
      }, INTERVAL.leftRight);
    }, KEYDOWN_DELAY);
  }

  /** Event handler for resetting drop interval after soft drop. */
  function softDropEndListener(keyupEv: KeyboardEvent) {
    if (keyupEv.key !== "ArrowDown") return;

    setDropInterval(INTERVAL.initialDrop);

    window.removeEventListener("keyup", softDropEndListener);
  }

  // Keydown
  function handleKeydown(ev: KeyboardEvent) {
    if (ev.repeat) return; // Ignore held key in favour of our interval solution

    // Overwrite existing left/right keydown interval
    if (/Arrow(?:Left|Right)/.test(ev.key)) {
      moveLeftRight(ev);

      return;
    }

    switch (ev.key) {
      case "ArrowDown": {
        if (dropInterval === INTERVAL.softDrop) return;

        setDropInterval(INTERVAL.softDrop);
        moveTetromino("down");

        window.addEventListener("keyup", softDropEndListener);

        break;
      }
      case " ": {
        if (dropInterval === INTERVAL.hardDrop) return;

        setDropInterval(INTERVAL.hardDrop);
        moveTetromino("down");

        break;
      }
      case "ArrowUp": {
        rotateTetromino();

        break;
      }
    }
  }

  // Tetromino has hit lower limit
  useEffect(() => {
    if (!isAtBound(tetrominoIndices, "down")) return;

    // GAME OVER
    if (tetrominoIndices.locked.some((i) => i <= 9)) {
      gameOver.current = true;

      window.clearInterval(dropIntervalId.current!);

      console.log("GAME OVER");
      // Hard drop
    } else if (dropInterval === INTERVAL.hardDrop) {
      setDropInterval(INTERVAL.initialDrop);

      newTetromino();
    } else {
      lockDown();
    }
  }, [tetrominoIndices, isAtBound, newTetromino, dropInterval, lockDown]);

  // Re-initiate lock down if piece is moved
  useEffect(() => {
    if (gameOver.current) return;

    lockDown();
  }, [tetrominoIndices.active, lockDown]);

  // Drop interval
  useEffect(() => {
    dropIntervalId.current = window.setInterval(() => {
      moveTetromino("down");
    }, dropInterval);

    return () => {
      window.clearInterval(dropIntervalId.current!);
    };
  }, [moveTetromino, dropInterval]);

  // External listeners
  useEffect(() => {
    if (gameOver.current) return;

    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  });

  return (
    <div className="grid grid-cols-[repeat(10,20px)] grid-rows-[repeat(20,20px)] gap-1 py-4 border-y border-primary">
      {Array(200)
        .fill(null)
        .map((_, i) => (
          <span
            key={window.crypto.randomUUID()}
            className={`inline-flex justify-center items-center border border-primary before:h-[10px] before:w-[10px] before:bg-primary ${
              tetrominoIndices.active.includes(i) || tetrominoIndices.locked.includes(i)
                ? ""
                : "opacity-20"
            }`}
          />
        ))}
    </div>
  );
}

export default GameBoard;
