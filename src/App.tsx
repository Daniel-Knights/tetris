import { useRef } from "react";

import GameBoard from "./components/GameBoard";
import QueueBoard from "./components/QueueBoard";
import StatBoard from "./components/StatBoard";
import { useScore } from "./modules";
import { useTetromino } from "./modules/tetromino";

function App(): JSX.Element {
  const gameOver = useRef(false);

  const { currentLevel, currentScore, lineClearCount, scoreLineClear } = useScore();
  const {
    currentTetrominoQueue,
    dropInterval,
    setDropInterval,
    tetrominoCoords,
    moveTetromino,
    rotateTetromino,
  } = useTetromino(gameOver, currentLevel, scoreLineClear);

  return (
    <div className="flex justify-evenly items-center h-full w-full bg-secondary text-primary">
      <GameBoard
        gameOver={gameOver}
        currentLevel={currentLevel}
        dropInterval={dropInterval}
        setDropInterval={setDropInterval}
        tetrominoCoords={tetrominoCoords}
        moveTetromino={moveTetromino}
        rotateTetromino={rotateTetromino}
      />
      <div className="flex flex-col justify-between py-16 h-full">
        <StatBoard
          currentLevel={currentLevel}
          currentScore={currentScore}
          lineClearCount={lineClearCount}
        />
        <QueueBoard queue={currentTetrominoQueue.current.bag} />
      </div>
    </div>
  );
}

export default App;
