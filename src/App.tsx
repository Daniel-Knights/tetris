import GameBoard from "./components/GameBoard";
import QueueBoard from "./components/QueueBoard";
import StatBoard from "./components/StatBoard";
import { useScore } from "./modules";
import { useTetromino } from "./modules/tetromino";

function App(): JSX.Element {
  const { currentScore, lineClearCount, scoreLineClear } = useScore();
  const {
    isHardDrop,
    currentTetrominoQueue,
    dropInterval,
    setDropInterval,
    tetrominoCoords,
    moveTetromino,
    rotateTetromino,
  } = useTetromino(scoreLineClear);

  return (
    <div className="flex justify-evenly items-center h-full w-full bg-secondary text-primary">
      <GameBoard
        isHardDrop={isHardDrop}
        dropInterval={dropInterval}
        setDropInterval={setDropInterval}
        tetrominoCoords={tetrominoCoords}
        moveTetromino={moveTetromino}
        rotateTetromino={rotateTetromino}
      />
      <div className="flex flex-col justify-between py-16 h-full">
        <StatBoard currentScore={currentScore} lineClearCount={lineClearCount} />
        <QueueBoard queue={currentTetrominoQueue.current.bag} />
      </div>
    </div>
  );
}

export default App;
