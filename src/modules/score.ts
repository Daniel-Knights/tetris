import { useStore } from "./store";

export const MAX_LEVEL = 15;
export const SOFT_DROP_SPEED_MULTIPLIER = 20;

const SCORES = {
  // Single
  1: 100,
  // Double
  2: 300,
  // Triple
  3: 500,
  // Tetris
  4: 800,
} as const;

/** Calculates and returns the drop interval for the passed level in milliseconds. */
export function getDropInterval(level: number): number {
  return (0.8 - (level - 1) * 0.007) ** (level - 1) * 1000;
}

export function useScore() {
  const currentLevel = useStore((state) => state.currentLevel);
  const setCurrentLevel = useStore((state) => state.setCurrentLevel);
  const currentScore = useStore((state) => state.currentScore);
  const setScore = useStore((state) => state.setScore);
  const lineClearCount = useStore((state) => state.lineClearCount);
  const setLineClearCount = useStore((state) => state.setLineClearCount);

  /** Updates score and level based on passed line clear count. */
  function scoreLineClear(clearCount: keyof typeof SCORES) {
    const newLineClearCount = lineClearCount + clearCount;

    setLineClearCount(newLineClearCount);
    setScore(currentScore + SCORES[clearCount] * currentLevel);

    if (newLineClearCount >= currentLevel * 10 && currentLevel < MAX_LEVEL) {
      setCurrentLevel(currentLevel + 1);
    }
  }

  return {
    scoreLineClear,
  };
}
