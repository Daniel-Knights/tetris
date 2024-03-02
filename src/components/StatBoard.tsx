import { useStore } from "../modules";

function StatBoard({ lineClearCount }: { lineClearCount: number }): JSX.Element {
  const currentLevel = useStore((state) => state.currentLevel);
  const currentScore = useStore((state) => state.currentScore);
  const highScore = useStore((state) => state.highScore);

  return (
    <dl className="w-full text-sm">
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

export default StatBoard;
