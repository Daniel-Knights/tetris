import { useState } from "react";

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
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentScore, setCurrentScore] = useState(0);
  const [lineClearCount, setLineClearCount] = useState(0);

  /** Updates score and level based on passed line clear count. */
  function scoreLineClear(clearCount: keyof typeof SCORES) {
    const newLineClearCount = lineClearCount + clearCount;

    setLineClearCount(newLineClearCount);
    setCurrentScore(currentScore + SCORES[clearCount] * currentLevel);

    if (newLineClearCount >= currentLevel * 10 && currentLevel < MAX_LEVEL) {
      setCurrentLevel(currentLevel + 1);
    }
  }

  return {
    currentLevel,
    currentScore,
    lineClearCount,
    scoreLineClear,
  };
}
