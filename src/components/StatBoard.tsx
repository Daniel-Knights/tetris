function StatBoard({
  currentLevel,
  currentScore,
  lineClearCount,
}: {
  currentLevel: number;
  currentScore: number;
  lineClearCount: number;
}): JSX.Element {
  return (
    <dl>
      <dt>Level:</dt>
      <dd className="pl-4 font-bold">{currentLevel}</dd>
      <dt>Score:</dt>
      <dd className="pl-4 font-bold">{currentScore}</dd>
      <dt>Lines Cleared:</dt>
      <dd className="pl-4 font-bold">{lineClearCount}</dd>
    </dl>
  );
}

export default StatBoard;
