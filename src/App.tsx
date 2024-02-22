import { useRef } from "react";

import GameBoard from "./components/GameBoard";
import QueueBoard from "./components/QueueBoard";
import StatBoard from "./components/StatBoard";
import { useTetromino } from "./modules/tetromino";

function App(): JSX.Element {
  const gameOver = useRef(false);

  const {
    currentTetrominoQueue,
    dropInterval,
    setDropInterval,
    tetrominoCoords,
    moveTetromino,
    rotateTetromino,
  } = useTetromino(gameOver);

  return (
    <div className="grid grid-cols-3 place-items-center h-full w-full bg-secondary text-primary">
      <StatBoard />
      <GameBoard
        gameOver={gameOver}
        dropInterval={dropInterval}
        setDropInterval={setDropInterval}
        tetrominoCoords={tetrominoCoords}
        moveTetromino={moveTetromino}
        rotateTetromino={rotateTetromino}
      />
      <QueueBoard queue={currentTetrominoQueue.current.bag} />
    </div>
  );
}

export default App;
