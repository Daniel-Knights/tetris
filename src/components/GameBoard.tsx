import { useCallback, useEffect, useRef, useState } from "react";

// TODO: rotate/move/interval race conditions
// TODO: wall kicks
// TODO: convert all indices to coords?

type Coord = { x: number; y: number };

type Tetromino = "I" | "J" | "L" | "O" | "S" | "T" | "Z";
type TetrominoIndices = [number, number, number, number];

type GeneratorYield<T> = Generator<T, never, T[]>;

const KEYDOWN_INTERVAL = 100;
const LOCKDOWN_TIMEOUT = 500;

const TETROMINOES = {
  I: {
    initialIndices: [3, 4, 5, 6],
    rotations: [
      {
        diffCoords: [
          { x: 2, y: 1 },
          { x: 1, y: 0 },
          { x: 0, y: -1 },
          { x: -1, y: -2 },
        ],
        wallKicks: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
      },
      {
        diffCoords: [
          { x: 1, y: -2 },
          { x: 0, y: -1 },
          { x: -1, y: 0 },
          { x: -2, y: 1 },
        ],
        wallKicks: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
      },
      {
        diffCoords: [
          { x: -2, y: -1 },
          { x: -1, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 2 },
        ],
        wallKicks: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
      },
      {
        diffCoords: [
          { x: -1, y: 2 },
          { x: 0, y: 1 },
          { x: 1, y: 0 },
          { x: 2, y: -1 },
        ],
        wallKicks: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
      },
    ],
  },
  J: {
    initialIndices: [3, 13, 14, 15],
    rotations: [
      {
        diffCoords: [
          { x: 2, y: 0 },
          { x: 1, y: 1 },
          { x: 0, y: 0 },
          { x: -1, y: -1 },
        ],
        wallKicks: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
      },
      {
        diffCoords: [
          { x: 0, y: -2 },
          { x: 1, y: -1 },
          { x: 0, y: 0 },
          { x: -1, y: 1 },
        ],
        wallKicks: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
      },
      {
        diffCoords: [
          { x: -2, y: 0 },
          { x: -1, y: -1 },
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
        wallKicks: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
      },
      {
        diffCoords: [
          { x: 0, y: 2 },
          { x: -1, y: 1 },
          { x: 0, y: 0 },
          { x: 1, y: -1 },
        ],
        wallKicks: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
      },
    ],
  },
  L: {
    initialIndices: [5, 13, 14, 15],
    rotations: [
      {
        diffCoords: [
          { x: 0, y: -2 },
          { x: 1, y: 1 },
          { x: 0, y: 0 },
          { x: -1, y: -1 },
        ],
        wallKicks: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
      },
      {
        diffCoords: [
          { x: -2, y: 0 },
          { x: 1, y: -1 },
          { x: 0, y: 0 },
          { x: -1, y: 1 },
        ],
        wallKicks: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
      },
      {
        diffCoords: [
          { x: 0, y: 2 },
          { x: -1, y: -1 },
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
        wallKicks: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
      },
      {
        diffCoords: [
          { x: 2, y: 0 },
          { x: -1, y: 1 },
          { x: 0, y: 0 },
          { x: 1, y: -1 },
        ],
        wallKicks: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
      },
    ],
  },
  O: {
    initialIndices: [4, 5, 14, 15],
    rotations: [],
  },
  S: {
    initialIndices: [4, 5, 13, 14],
    rotations: [
      {
        diffCoords: [
          { x: 1, y: -1 },
          { x: 0, y: -2 },
          { x: 1, y: 1 },
          { x: 0, y: 0 },
        ],
        wallKicks: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
      },
      {
        diffCoords: [
          { x: -1, y: -1 },
          { x: -2, y: 0 },
          { x: 1, y: -1 },
          { x: 0, y: 0 },
        ],
        wallKicks: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
      },
      {
        diffCoords: [
          { x: -1, y: 1 },
          { x: 0, y: 2 },
          { x: -1, y: -1 },
          { x: 0, y: 0 },
        ],
        wallKicks: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
      },
      {
        diffCoords: [
          { x: 1, y: 1 },
          { x: 2, y: 0 },
          { x: -1, y: 1 },
          { x: 0, y: 0 },
        ],
        wallKicks: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
      },
    ],
  },
  T: {
    initialIndices: [4, 13, 14, 15],
    rotations: [
      {
        diffCoords: [
          { x: 1, y: -1 },
          { x: 1, y: 1 },
          { x: 0, y: 0 },
          { x: -1, y: -1 },
        ],
        wallKicks: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
      },
      {
        diffCoords: [
          { x: -1, y: -1 },
          { x: 1, y: -1 },
          { x: 0, y: 0 },
          { x: -1, y: 1 },
        ],
        wallKicks: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
      },
      {
        diffCoords: [
          { x: -1, y: 1 },
          { x: -1, y: -1 },
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
        wallKicks: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
      },
      {
        diffCoords: [
          { x: 1, y: 1 },
          { x: -1, y: 1 },
          { x: 0, y: 0 },
          { x: 1, y: -1 },
        ],
        wallKicks: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
      },
    ],
  },
  Z: {
    initialIndices: [3, 4, 14, 15],
    rotations: [
      {
        diffCoords: [
          { x: 2, y: 0 },
          { x: 1, y: -1 },
          { x: 0, y: 0 },
          { x: -1, y: -1 },
        ],
        wallKicks: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
      },
      {
        diffCoords: [
          { x: 0, y: -2 },
          { x: -1, y: -1 },
          { x: 0, y: 0 },
          { x: -1, y: 1 },
        ],
        wallKicks: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
      },
      {
        diffCoords: [
          { x: -2, y: 0 },
          { x: -1, y: 1 },
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
        wallKicks: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
      },
      {
        diffCoords: [
          { x: 0, y: 2 },
          { x: 1, y: 1 },
          { x: 0, y: 0 },
          { x: 1, y: -1 },
        ],
        wallKicks: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
      },
    ],
  },
} satisfies Record<
  Tetromino,
  {
    initialIndices: TetrominoIndices;
    rotations: {
      diffCoords: [Coord, Coord, Coord, Coord];
      wallKicks: Coord[];
    }[];
  }
>;

const MOVEMENTS = {
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
  const dropIntervalId = useRef<number | null>(null);
  const leftRightIntervalId = useRef<number | null>(null);
  const downIntervalId = useRef<number | null>(null);
  const heldKey = useRef<string | null>(null);
  const isLockingDown = useRef(false);
  const randomTetrominoGen = useInitRef(() => {
    return bagShuffle(Object.keys(TETROMINOES) as Tetromino[]);
  });
  const currentTetrominoType = useInitRef(() => randomTetrominoGen.current.next().value);
  const currentRotationStage = useRef<0 | 1 | 2 | 3>(0);

  const [tetrominoIndices, setTetrominoIndices] = useState<{
    active: TetrominoIndices;
    locked: number[];
  }>({
    active: TETROMINOES[currentTetrominoType.current].initialIndices,
    locked: [],
  });

  const newTetromino = useCallback(
    (lockedIndices: number[]) => {
      currentTetrominoType.current = randomTetrominoGen.current.next().value;
      currentRotationStage.current = 0;

      setTetrominoIndices({
        locked: lockedIndices,
        active: TETROMINOES[currentTetrominoType.current].initialIndices,
      });
    },
    [randomTetrominoGen, currentTetrominoType]
  );

  const willCollide = useCallback((lockedIndices: number[], coord: Coord): boolean => {
    return (
      lockedIndices.includes(getIndexFromCoord(coord)) ||
      coord.x < 0 ||
      coord.x > 9 ||
      coord.y < 0
    );
  }, []);

  // Move the current tetromino
  const moveTetromino = useCallback(
    (direction: keyof typeof MOVEMENTS): void => {
      if (direction === "down" && isLockingDown.current) {
        return;
      }

      const indexDiff = MOVEMENTS[direction];

      setTetrominoIndices((curr) => {
        const isAtBound = curr.active.some((i) => {
          const newCoord = getCoordFromIndex(i);

          if (direction === "down") {
            newCoord.y += -(indexDiff / 10);
          } else {
            newCoord.x += indexDiff;
          }

          return willCollide(curr.locked, newCoord);
        });

        if (isAtBound) {
          // Tetromino has hit lower limit
          if (direction === "down" && !isLockingDown.current) {
            // GAME OVER
            if (curr.locked.some((i) => i <= 9)) {
              console.log("GAME OVER");
              window.clearInterval(dropIntervalId.current!);

              return curr;
            }

            // Lock down
            isLockingDown.current = true;

            setTimeout(() => {
              isLockingDown.current = false;

              // Set a new tetromino
              newTetromino([...curr.locked, ...curr.active]);
            }, LOCKDOWN_TIMEOUT);
          }

          return curr;
        }

        return {
          ...curr,
          active: curr.active.map((i) => i + indexDiff) as TetrominoIndices,
        };
      });
    },
    [newTetromino, willCollide]
  );

  function rotateTetromino() {
    const currentTetromino = TETROMINOES[currentTetrominoType.current];
    const currentRotation = currentTetromino.rotations[currentRotationStage.current];
    const memoRotationStage = currentRotationStage.current;

    if (!currentRotation) return;

    setTetrominoIndices((curr) => {
      for (let outerI = 0; outerI < currentRotation.wallKicks.length; outerI += 1) {
        const wallKick =
          outerI === 0 ? { x: 0, y: 0 } : currentRotation.wallKicks[outerI]!;

        const newIndices: TetrominoIndices = [...curr.active];

        const newPosWillCollide = currentRotation.diffCoords.some((diff, i) => {
          const currCoord = getCoordFromIndex(curr.active[i]!);
          const newCoord = shiftCoord(currCoord, diff, wallKick);
          const newIndex = getIndexFromCoord(newCoord);

          if (willCollide(curr.locked, newCoord)) {
            return true;
          }

          newIndices[i] = newIndex;

          return false;
        });

        if (!newPosWillCollide) {
          currentRotationStage.current =
            memoRotationStage < 3 ? ((memoRotationStage + 1) as 1 | 2 | 3) : 0;

          return {
            ...curr,
            active: newIndices,
          };
        }
      }

      return curr;
    });
  }

  // Keydown
  function handleKeydown(ev: KeyboardEvent) {
    if (ev.repeat) return; // Ignore held key in favour of our interval solution

    heldKey.current = ev.key;

    // Overwrite existing left/right keydown interval
    if (/Arrow(?:Left|Right)/.test(ev.key) && leftRightIntervalId.current) {
      window.clearInterval(leftRightIntervalId.current);

      leftRightIntervalId.current = null;
    }

    switch (ev.key) {
      case "ArrowLeft": {
        leftRightIntervalId.current = setInstantInterval(() => {
          moveTetromino("left");
        }, KEYDOWN_INTERVAL);

        break;
      }
      case "ArrowRight": {
        leftRightIntervalId.current = setInstantInterval(() => {
          moveTetromino("right");
        }, KEYDOWN_INTERVAL);

        break;
      }
      case "ArrowDown": {
        downIntervalId.current = setInstantInterval(() => {
          moveTetromino("down");
        }, KEYDOWN_INTERVAL);

        break;
      }
      case "ArrowUp": {
        rotateTetromino();

        break;
      }
    }
  }

  // Keyup
  function handleKeyUp(ev: KeyboardEvent) {
    if (ev.key === heldKey.current) {
      heldKey.current = null;
    }

    // Clear intervals
    if (/Arrow(?:Left|Right)/.test(ev.key) && leftRightIntervalId.current) {
      window.clearInterval(leftRightIntervalId.current);

      leftRightIntervalId.current = null;
    } else if (ev.key === "ArrowDown" && downIntervalId.current) {
      window.clearInterval(downIntervalId.current);

      downIntervalId.current = null;
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  });

  // Move the tetromino down at regular intervals
  useEffect(() => {
    dropIntervalId.current = window.setInterval(() => {
      if (heldKey.current === "ArrowDown") return;

      moveTetromino("down");
    }, 1000);

    return () => window.clearInterval(dropIntervalId.current!);
  }, [moveTetromino]);

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
