import { useCallback, useEffect, useRef, useState } from "react";

// TODO: extended placement lockdown
// TODO: t-spin
// TODO: ghost tetromino
// TODO: prevent new tetromino collisions on game over
// TODO: replace hard coded rotations with formula
// TODO: line clears

type Coord = { x: number; y: number };

type Tetromino = "I" | "J" | "L" | "O" | "S" | "T" | "Z";
type TetrominoIndices = [number, number, number, number];

type GeneratorYield<T> = Generator<T, never, T[]>;

const KEYDOWN_DELAY = 300;
const LOCK_DOWN_TIMEOUT = 500;

const TETROMINOES = {
  I: {
    initialIndices: [3, 4, 5, 6],
    rotationDiffs: [
      [
        { x: 2, y: 1 },
        { x: 1, y: 0 },
        { x: 0, y: -1 },
        { x: -1, y: -2 },
      ],
      [
        { x: 1, y: -2 },
        { x: 0, y: -1 },
        { x: -1, y: 0 },
        { x: -2, y: 1 },
      ],
      [
        { x: -2, y: -1 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 2 },
      ],
      [
        { x: -1, y: 2 },
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: 2, y: -1 },
      ],
    ],
  },
  J: {
    initialIndices: [3, 13, 14, 15],
    rotationDiffs: [
      [
        { x: 2, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 0 },
        { x: -1, y: -1 },
      ],
      [
        { x: 0, y: -2 },
        { x: 1, y: -1 },
        { x: 0, y: 0 },
        { x: -1, y: 1 },
      ],
      [
        { x: -2, y: 0 },
        { x: -1, y: -1 },
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      [
        { x: 0, y: 2 },
        { x: -1, y: 1 },
        { x: 0, y: 0 },
        { x: 1, y: -1 },
      ],
    ],
  },
  L: {
    initialIndices: [5, 13, 14, 15],
    rotationDiffs: [
      [
        { x: 0, y: -2 },
        { x: 1, y: 1 },
        { x: 0, y: 0 },
        { x: -1, y: -1 },
      ],
      [
        { x: -2, y: 0 },
        { x: 1, y: -1 },
        { x: 0, y: 0 },
        { x: -1, y: 1 },
      ],
      [
        { x: 0, y: 2 },
        { x: -1, y: -1 },
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      [
        { x: 2, y: 0 },
        { x: -1, y: 1 },
        { x: 0, y: 0 },
        { x: 1, y: -1 },
      ],
    ],
  },
  O: {
    initialIndices: [4, 5, 14, 15],
    rotationDiffs: [],
  },
  S: {
    initialIndices: [4, 5, 13, 14],
    rotationDiffs: [
      [
        { x: 1, y: -1 },
        { x: 0, y: -2 },
        { x: 1, y: 1 },
        { x: 0, y: 0 },
      ],
      [
        { x: -1, y: -1 },
        { x: -2, y: 0 },
        { x: 1, y: -1 },
        { x: 0, y: 0 },
      ],
      [
        { x: -1, y: 1 },
        { x: 0, y: 2 },
        { x: -1, y: -1 },
        { x: 0, y: 0 },
      ],
      [
        { x: 1, y: 1 },
        { x: 2, y: 0 },
        { x: -1, y: 1 },
        { x: 0, y: 0 },
      ],
    ],
  },
  T: {
    initialIndices: [4, 13, 14, 15],
    rotationDiffs: [
      [
        { x: 1, y: -1 },
        { x: 1, y: 1 },
        { x: 0, y: 0 },
        { x: -1, y: -1 },
      ],
      [
        { x: -1, y: -1 },
        { x: 1, y: -1 },
        { x: 0, y: 0 },
        { x: -1, y: 1 },
      ],
      [
        { x: -1, y: 1 },
        { x: -1, y: -1 },
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      [
        { x: 1, y: 1 },
        { x: -1, y: 1 },
        { x: 0, y: 0 },
        { x: 1, y: -1 },
      ],
    ],
  },
  Z: {
    initialIndices: [3, 4, 14, 15],
    rotationDiffs: [
      [
        { x: 2, y: 0 },
        { x: 1, y: -1 },
        { x: 0, y: 0 },
        { x: -1, y: -1 },
      ],
      [
        { x: 0, y: -2 },
        { x: -1, y: -1 },
        { x: 0, y: 0 },
        { x: -1, y: 1 },
      ],
      [
        { x: -2, y: 0 },
        { x: -1, y: 1 },
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      [
        { x: 0, y: 2 },
        { x: 1, y: 1 },
        { x: 0, y: 0 },
        { x: 1, y: -1 },
      ],
    ],
  },
} satisfies Record<
  Tetromino,
  {
    initialIndices: TetrominoIndices;
    rotationDiffs: [Coord, Coord, Coord, Coord][];
  }
>;

const WALL_KICKS = [
  {
    appliesTo: ["J", "L", "S", "T", "Z"],
    kickDiffs: [
      [
        { x: -1, y: 0 },
        { x: -1, y: 1 },
        { x: 0, y: -2 },
        { x: -1, y: -2 },
      ],
      [
        { x: 1, y: 0 },
        { x: 1, y: -1 },
        { x: 0, y: 2 },
        { x: 1, y: 2 },
      ],
      [
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: -2 },
        { x: 1, y: -2 },
      ],
      [
        { x: -1, y: 0 },
        { x: -1, y: -1 },
        { x: 0, y: 2 },
        { x: -1, y: 2 },
      ],
    ],
  },
  {
    appliesTo: ["I"],
    kickDiffs: [
      [
        { x: -2, y: 0 },
        { x: 1, y: 0 },
        { x: -2, y: -1 },
        { x: 1, y: 2 },
      ],
      [
        { x: -1, y: 0 },
        { x: 2, y: 0 },
        { x: -1, y: 2 },
        { x: 2, y: -1 },
      ],
      [
        { x: 2, y: 0 },
        { x: -1, y: 0 },
        { x: 2, y: 1 },
        { x: -1, y: -2 },
      ],
      [
        { x: 1, y: 0 },
        { x: -2, y: 0 },
        { x: 1, y: -2 },
        { x: -2, y: 1 },
      ],
    ],
  },
] satisfies {
  appliesTo: Tetromino[];
  kickDiffs: [Coord, Coord, Coord, Coord][];
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

function shiftCoord(coord: Coord, ...diffs: Coord[]): Coord {
  return diffs.reduce(
    (acc, curr) => ({
      x: acc.x + curr.x,
      y: acc.y + curr.y,
    }),
    coord
  );
}

function useInitRef<T>(valueCb: () => T): React.MutableRefObject<T> {
  const ref = useRef<T>(null as T);

  if (ref.current === null) {
    ref.current = valueCb();
  }

  return ref;
}

function GameBoard(): JSX.Element {
  const leftRightTimeoutId = useRef<number | null>(null);
  const leftRightIntervalId = useRef<number | null>(null);
  const isLockingDown = useRef(false);
  const randomTetrominoGen = useInitRef(() => {
    return bagShuffle(Object.keys(TETROMINOES) as Tetromino[]);
  });
  const currentTetrominoType = useInitRef(() => randomTetrominoGen.current.next().value);
  const currentRotationStage = useRef<0 | 1 | 2 | 3>(0);

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

  /** Creates a new tetromino. */
  const newTetromino = useCallback(() => {
    setTetrominoIndices((curr) => {
      // Prevent floating pieces
      const hasHitBottomLimit = curr.active.some((i) => {
        return willCollide(curr.locked, getCoordFromIndex(i + MOVEMENT.down));
      });

      if (hasHitBottomLimit) {
        currentTetrominoType.current = randomTetrominoGen.current.next().value;
        currentRotationStage.current = 0;

        return {
          locked: [...curr.locked, ...curr.active],
          active: TETROMINOES[currentTetrominoType.current].initialIndices,
        };
      }

      return curr;
    });
  }, [randomTetrominoGen, currentTetrominoType, willCollide]);

  /** Checks if current tetromino is at the left, right, or bottom bound. */
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
    const currentTetromino = TETROMINOES[currentTetrominoType.current];
    const rotationStage = currentRotationStage.current;
    const currentRotation = currentTetromino.rotationDiffs[rotationStage];
    if (!currentRotation) return;

    const wallKicks = WALL_KICKS.find((k) => {
      return (k.appliesTo as Tetromino[]).includes(currentTetrominoType.current);
    })!;

    // Attempt initial rotation then try each wall kick until it doesn't collide
    for (let outerI = 0; outerI < wallKicks.kickDiffs.length + 1; outerI += 1) {
      const wallKick =
        outerI === 0 // 0 = unobstructed rotation
          ? { x: 0, y: 0 }
          : wallKicks.kickDiffs[rotationStage]![outerI - 1]!;
      const newIndices: TetrominoIndices = [...tetrominoIndices.active];

      const newPosWillCollide = currentRotation.some((diff, i) => {
        const currCoord = getCoordFromIndex(tetrominoIndices.active[i]!);
        const newCoord = shiftCoord(currCoord, diff, wallKick);
        const newIndex = getIndexFromCoord(newCoord);

        if (willCollide(tetrominoIndices.locked, newCoord)) {
          return true;
        }

        newIndices[i] = newIndex;

        return false;
      });

      if (!newPosWillCollide) {
        currentRotationStage.current =
          rotationStage < 3 ? ((rotationStage + 1) as 1 | 2 | 3) : 0;

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
  if (isAtBound(tetrominoIndices, "down") && !isLockingDown.current) {
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
  }

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
