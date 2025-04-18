import { useCallback } from "react";

import { useStore } from "./store";

const MAX_LEVEL = 15;

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
  const currentLevel = useStore((s) => s.currentLevel);
  const setCurrentLevel = useStore((s) => s.setCurrentLevel);
  const setScore = useStore((s) => s.setScore);
  const lineClearCount = useStore((s) => s.lineClearCount);
  const setLineClearCount = useStore((s) => s.setLineClearCount);

  /** Updates score and level based on passed line clear count. */
  const scoreLineClear = useCallback(
    (clearCount: keyof typeof SCORES) => {
      const newLineClearCount = lineClearCount + clearCount;

      setLineClearCount(newLineClearCount);
      setScore((curr) => curr + SCORES[clearCount] * currentLevel);

      if (newLineClearCount >= currentLevel * 10 && currentLevel < MAX_LEVEL) {
        setCurrentLevel(currentLevel + 1);
      }
    },
    [currentLevel, lineClearCount, setCurrentLevel, setLineClearCount, setScore]
  );

  return {
    scoreLineClear,
  };
}
