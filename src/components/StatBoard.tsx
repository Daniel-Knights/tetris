import { useStore } from "../hooks";

export function StatBoard() {
  const currentLevel = useStore((s) => s.currentLevel);
  const currentScore = useStore((s) => s.currentScore);
  const highScore = useStore((s) => s.highScore);
  const lineClearCount = useStore((s) => s.lineClearCount);

  return (
    <dl className="w-full text-xs sm:text-sm">
      <dt>Level:</dt>
      <dd className="pl-4 font-bold">{currentLevel}</dd>
      <dt>Score:</dt>
      <dd className="pl-4 font-bold">{currentScore}</dd>
      <dt>High Score:</dt>
      <dd className="pl-4 font-bold">{highScore}</dd>
      <dt>Lines Cleared:</dt>
      <dd className="pl-4 font-bold">{lineClearCount}</dd>
    </dl>
  );
}
