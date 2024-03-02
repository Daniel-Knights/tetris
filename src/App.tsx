import GameBoard from "./components/GameBoard";
import QueueBoard from "./components/QueueBoard";
import StatBoard from "./components/StatBoard";
import { useLockdown, useScore, useTetromino } from "./modules";

function App(): JSX.Element {
  const { lineClearCount, scoreLineClear } = useScore();
  const { moveTetromino } = useTetromino();

  useLockdown(scoreLineClear);

  return (
    <div className="flex justify-evenly items-center h-full w-full bg-secondary text-primary">
      <GameBoard moveTetromino={moveTetromino} />
      <div className="flex flex-col justify-between items-center py-16 h-full">
        <StatBoard lineClearCount={lineClearCount} />
        <QueueBoard />
      </div>
    </div>
  );
}

export default App;
