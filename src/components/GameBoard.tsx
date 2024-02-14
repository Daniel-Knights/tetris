import { useCallback, useEffect, useRef, useState } from "react";

// TODO: extended placement lockdown
// TODO: t-spin
// TODO: ghost tetromino
// TODO: prevent new tetromino collisions on game over
// TODO: line clears

type Coord = { x: number; y: number };

type RotationStage = 0 | 1 | 2 | 3;

type Tetromino = "I" | "J" | "L" | "O" | "S" | "T" | "Z";
type TetrominoIndices = [number, number, number, number];

type GeneratorYield<T> = Generator<T, never, T[]>;

const KEYDOWN_DELAY = 300;
const LOCK_DOWN_TIMEOUT = 500;

const TETROMINOES = {
  I: {
    initialIndices: [3, 4, 5, 6],
    pivotIndex: 1,
  },
  J: {
    initialIndices: [3, 13, 14, 15],
    pivotIndex: 2,
  },
  L: {
    initialIndices: [5, 13, 14, 15],
    pivotIndex: 2,
  },
  O: {
    initialIndices: [4, 5, 14, 15],
    pivotIndex: 2,
  },
  S: {
    initialIndices: [4, 5, 13, 14],
    pivotIndex: 3,
  },
  T: {
    initialIndices: [4, 13, 14, 15],
    pivotIndex: 2,
  },
  Z: {
    initialIndices: [3, 4, 14, 15],
    pivotIndex: 2,
  },
} satisfies Record<
  Tetromino,
  {
    initialIndices: TetrominoIndices;
    pivotIndex: number;
  }
>;

const WALL_KICKS = [
  {
    appliesTo: ["J", "L", "S", "T", "Z"],
    offsets: [
      [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ],
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: -1 },
        { x: 0, y: 2 },
        { x: 1, y: 2 },
      ],
      [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ],
      [
        { x: 0, y: 0 },
        { x: -1, y: 0 },
        { x: -1, y: -1 },
        { x: 0, y: 2 },
        { x: -1, y: 2 },
      ],
    ],
  },
  {
    appliesTo: ["I"],
    offsets: [
      [
        { x: 0, y: 0 },
        { x: -1, y: 0 },
        { x: 2, y: 0 },
        { x: -1, y: 0 },
        { x: 2, y: 0 },
      ],
      [
        { x: -1, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -2 },
      ],
      [
        { x: -1, y: 1 },
        { x: 1, y: 1 },
        { x: -2, y: 1 },
        { x: 1, y: 0 },
        { x: -2, y: 0 },
      ],
      [
        { x: 0, y: 1 },
        { x: 0, y: 1 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
        { x: 0, y: 2 },
      ],
    ],
  },
] satisfies {
  appliesTo: Tetromino[];
  /**
   * Each coord array represents a stage of the rotation and each coord represents a
   * wall kick offset, with the zeroth coord being unobstructed rotation.
   *
   * Wall kicks are calculated by subtracting 'b' from 'a', where 'a' is the coord from
   * the current rotation stage, and 'b' is the same indexed coord for the next
   * rotation stage. For counter-clockwise rotations, subtracting 'a' from 'b' should
   * be equivalent.
   *
   * **Note:** the 'I' tetromino has offsets for unobstructed rotations, because its
   * pivot point isn't aligned centrally. Same with the 'O' tetromino, but, as rotating
   * it doesn't make a difference visually, we ignore it.
   *
   * See here for more details: https://tetris.wiki/Super_Rotation_System
   */
  offsets: [Coord[], Coord[], Coord[], Coord[]];
}[];

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

/**
 * Fisher-Yates shuffle. Modifies in place.
 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    [arr[i], arr[randomIndex]] = [arr[randomIndex]!, arr[i]!];
  }

  return arr;
}

/**
 * Yields items from passed array in random order.
 */
function* bagShuffle<T>(passedArr: T[]): GeneratorYield<T> {
  const memoArr = [...passedArr];
  const arr = shuffle([...memoArr]);

  while (true) {
    if (!arr.length) {
      arr.push(...shuffle([...memoArr]));
    }

    yield arr.pop()!;
  }
}

/** Runs callback instantly as well as at intervals. */
function setInstantInterval(cb: () => void, interval: number): number {
  cb();

  return window.setInterval(cb, interval);
}

function getIndexFromCoord({ x, y }: Coord): number {
  return (19 - y) * 10 + x;
}

function getCoordFromIndex(index: number): Coord {
  return {
    x: index > -1 ? index % 10 : 10 + (index % 10),
    y: 19 - Math.floor(index / 10),
  };
}

function addCoords(baseCoord: Coord, ...coords: Coord[]): Coord {
  return coords.reduce(
    (acc, curr) => ({
      x: acc.x + curr.x,
      y: acc.y + curr.y,
    }),
    baseCoord
  );
}

function subtractCoords(baseCoord: Coord, ...coords: Coord[]): Coord {
  return coords.reduce(
    (acc, curr) => ({
      x: acc.x - curr.x,
      y: acc.y - curr.y,
    }),
    baseCoord
  );
}

/** Rotates coord clockwise 90deg. */
function rotateCoord(coord: Coord): Coord {
  // 0 = cos(90deg)
  // 1 = sin(90deg)
  return {
    x: 0 * coord.x + 1 * coord.y,
    y: -1 * coord.x + 0 * coord.y,
  };
}

function useInitRef<T>(valueCb: () => T): React.MutableRefObject<T> {
  const ref = useRef<T>(null as T);

  if (ref.current === null) {
    ref.current = valueCb();
  }

  return ref;
}

function GameBoard(): JSX.Element {
  const randomTetrominoGen = useInitRef(() => {
    return bagShuffle(Object.keys(TETROMINOES) as Tetromino[]);
  });
  const currentTetrominoType = useInitRef(() => randomTetrominoGen.current.next().value);
  const currentRotationStage = useRef<RotationStage>(0);
  const leftRightTimeoutId = useRef<number | null>(null);
  const leftRightIntervalId = useRef<number | null>(null);
  const isLockingDown = useRef(false);

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
      lockedIndices.includes(getIndexFromCoord(coord)) ||
      coord.x < 0 ||
      coord.x > 9 ||
      coord.y < 0
    );
  }, []);

  /** Checks if current tetromino is at the right, left, or bottom bound. */
  const isAtBound = useCallback(
    (curr: typeof tetrominoIndices, direction: keyof typeof MOVEMENT): boolean => {
      return curr.active.some((i) => {
        const newCoord = getCoordFromIndex(i);

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
    // Prevent floating pieces
    if (!isAtBound(tetrominoIndices, "down")) return;

    currentTetrominoType.current = randomTetrominoGen.current.next().value;
    currentRotationStage.current = 0;

    setTetrominoIndices((curr) => ({
      locked: [...curr.locked, ...curr.active],
      active: TETROMINOES[currentTetrominoType.current].initialIndices,
    }));
  }, [currentTetrominoType, isAtBound, tetrominoIndices, randomTetrominoGen]);

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

  /** Rotates the current tetromino. */
  function rotateTetromino() {
    if (currentTetrominoType.current === "O") return;

    const rotationStage = currentRotationStage.current;
    const nextRotationStage = ((rotationStage + 1) % 4) as RotationStage;
    const { pivotIndex } = TETROMINOES[currentTetrominoType.current];

    const wallKicks = WALL_KICKS.find((k) => {
      return (k.appliesTo as Tetromino[]).includes(currentTetrominoType.current);
    })!;

    // Attempt initial rotation then try each wall kick until it doesn't collide
    for (let kickI = 0; kickI < wallKicks.offsets.length + 1; kickI += 1) {
      /** See {@link WALL_KICKS} type definition for how this works. */
      const wallKick = subtractCoords(
        wallKicks.offsets[rotationStage]![kickI]!,
        wallKicks.offsets[nextRotationStage]![kickI]!
      );

      const newIndices: TetrominoIndices = [...tetrominoIndices.active];

      const newPosWillCollide = tetrominoIndices.active.some((tetIndex, i) => {
        const currCoord = getCoordFromIndex(tetIndex);
        const pivotCoord = getCoordFromIndex(tetrominoIndices.active[pivotIndex]!);

        const rotatedDiff = rotateCoord({
          x: currCoord.x - pivotCoord.x,
          y: currCoord.y - pivotCoord.y,
        });

        const newCoord = addCoords(pivotCoord, rotatedDiff, wallKick);

        if (willCollide(tetrominoIndices.locked, newCoord)) {
          // Will collide, so we return and move on to the next wall kick
          return true;
        }

        newIndices[i] = getIndexFromCoord(newCoord);

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
    if (!isAtBound(tetrominoIndices, "down") || isLockingDown.current) return;

    // GAME OVER
    if (tetrominoIndices.locked.some((i) => i <= 9)) {
      window.clearInterval(dropInterval);

      console.log("GAME OVER");
      // Hard drop
    } else if (dropInterval === INTERVAL.hardDrop) {
      setDropInterval(INTERVAL.initialDrop);

      newTetromino();
    } else {
      // Lock down
      isLockingDown.current = true;

      setTimeout(() => {
        isLockingDown.current = false;

        newTetromino();
      }, LOCK_DOWN_TIMEOUT);
    }
  }, [tetrominoIndices, isAtBound, newTetromino, dropInterval]);

  // Drop interval
  useEffect(() => {
    const id = window.setInterval(() => {
      moveTetromino("down");
    }, dropInterval);

    return () => window.clearInterval(id);
  }, [moveTetromino, dropInterval]);

  // External listeners
  useEffect(() => {
    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  });

  return (
    <div className="grid grid-cols-[repeat(10,20px)] grid-rows-[repeat(20,20px)] gap-1 py-4 border-y border-[#1e2424]">
      {Array(200)
        .fill(null)
        .map((_, i) => (
          <span
            key={window.crypto.randomUUID()}
            className={`inline-flex justify-center items-center border border-[#1e2424] before:h-[10px] before:w-[10px] before:bg-[#1e2424] ${
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
