import { useEffect, useRef, useState } from "react";

const KEYDOWN_INTERVAL = 100;

const TETROMINOES = {
  I: [3, 4, 5, 6],
  J: [4, 5, 6, 16],
  L: [4, 5, 6, 14],
  O: [4, 5, 14, 15],
  S: [5, 6, 14, 15],
  T: [4, 5, 6, 15],
  Z: [4, 5, 15, 16],
} as const;

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

type Tetromino = keyof typeof TETROMINOES;
type TetrominoIndices = [number, number, number, number];

/** Gets a random tetromino and returns its starting indices. */
function getRandomTetromino(): TetrominoIndices {
  const randomKey = Object.keys(TETROMINOES)[
    Math.floor(Math.random() * Object.keys(TETROMINOES).length)
  ] as Tetromino;

  return TETROMINOES[randomKey] as TetrominoIndices;
}

/** Runs callback instantly as well as at intervals. */
function setInstantInterval(cb: () => void, interval: number): number {
  cb();

  return window.setInterval(cb, interval);
}

function GameBoard(): JSX.Element {
  const [currentTetrominoIndices, setCurrentTetrominoIndices] =
    useState(getRandomTetromino());

  const leftRightIntervalId = useRef<number | null>(null);
  const downIntervalId = useRef<number | null>(null);
  const heldKey = useRef<string | null>(null);

  const activeIndices = useRef<number[]>([]);

  // Move the current tetromino
  function moveTetromino(direction: keyof typeof MOVEMENTS) {
    const movement = MOVEMENTS[direction];

    setCurrentTetrominoIndices((indices) => {
      const isAtBound = indices.some((i) => {
        const newI = i + movement.indexChange;

        return (
          movement.boundCondition?.(i) ||
          (!indices.includes(newI) && activeIndices.current.includes(newI))
        );
      });

      if (isAtBound) {
        // Tetromino has hit lower limit
        if (direction === "down") {
          // GAME OVER
          if (indices.some((i) => i <= 9)) {
            console.log("GAME OVER");
          }

          activeIndices.current.push(...indices);

          // Get a new tetromino
          return getRandomTetromino();
        }

        return indices;
      }

      return indices.map((i) => i + movement.indexChange) as TetrominoIndices;
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
    const intervalId = setInterval(() => {
      if (heldKey.current === "ArrowDown") return;

      moveTetromino("down");
    }, 1000);

    return () => window.clearInterval(intervalId);
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
