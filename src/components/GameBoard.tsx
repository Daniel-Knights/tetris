import { useEffect, useRef, useState } from "react";

type Tetromino = "I" | "J" | "L" | "O" | "S" | "T" | "Z";
type TetrominoIndices = [number, number, number, number];

const KEYDOWN_INTERVAL = 100;
const LOCKDOWN_TIMEOUT = 500;

const TETROMINOES = {
  I: {
    initialIndices: [3, 4, 5, 6],
    rotations: {
      1: [],
      2: [],
      3: [],
      4: [],
    },
  },
  J: {
    initialIndices: [4, 5, 6, 16],
    rotations: {
      1: [],
      2: [],
      3: [],
      4: [],
    },
  },
  L: {
    initialIndices: [4, 5, 6, 14],
    rotations: {
      1: [],
      2: [],
      3: [],
      4: [],
    },
  },
  O: {
    initialIndices: [4, 5, 14, 15],
    rotations: {
      1: [],
      2: [],
      3: [],
      4: [],
    },
  },
  S: {
    initialIndices: [5, 6, 14, 15],
    rotations: {
      1: [],
      2: [],
      3: [],
      4: [],
    },
  },
  T: {
    initialIndices: [4, 5, 6, 15],
    rotations: {
      1: [],
      2: [],
      3: [],
      4: [],
    },
  },
  Z: {
    initialIndices: [4, 5, 15, 16],
    rotations: {
      1: [],
      2: [],
      3: [],
      4: [],
    },
  },
} satisfies Record<
  Tetromino,
  {
    initialIndices: TetrominoIndices;
    /**
     * 4 stages, each stage has a stack of possible rotations based on what's around the tetromino,
     * in preference order from first to last. For example, if there is nothing blocking the first
     * rotation, use that, otherwise, try the next entry in the stack, and so on.
     *
     * Each entry in the stack is an array of the index differences for each mino from the current
     * position to the next.
     */
    rotations: Record<1 | 2 | 3 | 4, TetrominoIndices[]>;
  }
>;

const MOVEMENTS = {
  left: {
    indexChange: -1,
    boundCondition: (i: number) => i % 10 === 0,
  },
  right: {
    indexChange: 1,
    boundCondition: (i: number) => i % 10 === 9,
  },
  down: {
    indexChange: 10,
    boundCondition: (i: number) => i >= 190,
  },
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
function* bagShuffle<T>(passedArr: T[]): Generator<T, never, T[]> {
  const memoArr = [...passedArr];
  const arr = shuffle(memoArr);

  while (true) {
    if (!arr.length) {
      arr.push(...shuffle(memoArr));
    }

    yield arr.pop()!;
  }
}

/** Runs callback instantly as well as at intervals. */
function setInstantInterval(cb: () => void, interval: number): number {
  cb();

  return window.setInterval(cb, interval);
}

const randomTetrominoGen = bagShuffle(Object.keys(TETROMINOES) as Tetromino[]);

function GameBoard(): JSX.Element {
  const [currentTetrominoIndices, setCurrentTetrominoIndices] = useState(
    TETROMINOES[randomTetrominoGen.next().value!].initialIndices
  );

  const dropIntervalId = useRef<number | null>(null);
  const leftRightIntervalId = useRef<number | null>(null);
  const downIntervalId = useRef<number | null>(null);
  const heldKey = useRef<string | null>(null);
  const isLockingDown = useRef(false);

  const activeIndices = useRef<number[]>([]);

  // Move the current tetromino
  function moveTetromino(direction: keyof typeof MOVEMENTS) {
    setCurrentTetrominoIndices((indices) => {
      const movement = MOVEMENTS[direction];
      const isAtBound = indices.some((i) => {
        const newI = i + movement.indexChange;

        return (
          movement.boundCondition?.(i) ||
          (!indices.includes(newI) && activeIndices.current.includes(newI))
        );
      });

      if (isAtBound) {
        // Tetromino has hit lower limit
        if (direction === "down" && !isLockingDown.current) {
          // GAME OVER
          if (indices.some((i) => i <= 9)) {
            console.log("GAME OVER");
            window.clearInterval(dropIntervalId.current!);

            return indices;
          }

          // Lock down
          isLockingDown.current = true;

          setTimeout(() => {
            isLockingDown.current = false;

            activeIndices.current.push(...indices);

            // Set a new tetromino
            setCurrentTetrominoIndices(
              TETROMINOES[randomTetrominoGen.next().value!].initialIndices
            );
          }, LOCKDOWN_TIMEOUT);
        }

        return indices;
      }

      return indices.map((i) => i + movement.indexChange) as TetrominoIndices;
    });
  }

  function rotateTetromino() {
    setCurrentTetrominoIndices((indices) => {
      // TODO: Implement rotation
      return indices;
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
        downIntervalId.current = setInstantInterval(() => {
          rotateTetromino();
        }, KEYDOWN_INTERVAL);

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
  }, []);

  return (
    <div className="grid grid-cols-[repeat(10,20px)] grid-rows-[repeat(20,20px)] gap-1 py-4 border-y border-[#1e2424]">
      {Array(200)
        .fill(null)
        .map((_, i) => (
          <span
            key={window.crypto.randomUUID()}
            className={`inline-flex justify-center items-center border border-[#1e2424] before:h-[10px] before:w-[10px] before:bg-[#1e2424] ${
              activeIndices.current.includes(i) || currentTetrominoIndices.includes(i)
                ? ""
                : "opacity-20"
            }`}
          />
        ))}
    </div>
  );
}

export default GameBoard;
