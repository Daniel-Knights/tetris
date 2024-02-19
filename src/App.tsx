import { useRef } from "react";

import GameBoard from "./components/GameBoard";
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
    <div className="grid grid-cols-[2fr_1fr] items-center justify-items-center h-full w-full bg-secondary text-primary">
      <GameBoard
        gameOver={gameOver}
        dropInterval={dropInterval}
        setDropInterval={setDropInterval}
        tetrominoIndices={tetrominoIndices}
        moveTetromino={moveTetromino}
        rotateTetromino={rotateTetromino}
      />
      <StatBoard />
    </div>
  );
}

export default App;
