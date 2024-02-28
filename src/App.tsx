import GameBoard from "./components/GameBoard";
import QueueBoard from "./components/QueueBoard";
import StatBoard from "./components/StatBoard";
import { useScore, useTetromino } from "./modules";

function App(): JSX.Element {
  const { currentScore, lineClearCount, scoreLineClear } = useScore();
  const { isHardDrop, dropInterval, setDropInterval, moveTetromino } =
    useTetromino(scoreLineClear);

  return (
    <div className="flex justify-evenly items-center h-full w-full bg-secondary text-primary">
      <GameBoard
        isHardDrop={isHardDrop}
        dropInterval={dropInterval}
        setDropInterval={setDropInterval}
        moveTetromino={moveTetromino}
      />
      <div className="flex flex-col justify-between py-16 h-full">
        <StatBoard currentScore={currentScore} lineClearCount={lineClearCount} />
        <QueueBoard />
      </div>
    </div>
  );
}

export default App;
