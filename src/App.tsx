import { useRef } from "react";

import GameBoard from "./components/GameBoard";
import QueueBoard from "./components/QueueBoard";
import StatBoard from "./components/StatBoard";
import { useTetromino } from "./modules/tetromino";

function App(): JSX.Element {
  const gameOver = useRef(false);

  const {
    dropInterval,
    setDropInterval,
    tetrominoIndices,
    moveTetromino,
    rotateTetromino,
  } = useTetromino(gameOver);

  return (
    <div className="flex justify-evenly items-center h-full w-full bg-secondary text-primary">
      <StatBoard />
      <GameBoard
        gameOver={gameOver}
        dropInterval={dropInterval}
        setDropInterval={setDropInterval}
        tetrominoIndices={tetrominoIndices}
        moveTetromino={moveTetromino}
        rotateTetromino={rotateTetromino}
      />
      <QueueBoard />
    </div>
  );
}

export default App;
