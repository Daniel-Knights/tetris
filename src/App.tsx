import { useCallback, useState } from "react";

import GameBoard from "./components/GameBoard";
import StatBoard from "./components/StatBoard";
import { TETROMINOES, TetrominoType } from "./modules";
import { RotationStage } from "./modules/tetromino";
import { bagShuffle, useInitRef } from "./utils";

function App(): JSX.Element {
  const randomTetrominoGen = useInitRef(() => {
    return bagShuffle(Object.keys(TETROMINOES) as TetrominoType[]);
  });
  const currentTetrominoType = useInitRef(() => randomTetrominoGen.current.next().value);

  const [rotationStage, setRotationStage] = useState<RotationStage>(0);

  /** Sets new tetromino. */
  const newTetromino = useCallback(() => {
    currentTetrominoType.current = randomTetrominoGen.current.next().value;

    setRotationStage(0);

    return TETROMINOES[currentTetrominoType.current].initialIndices;
  }, [currentTetrominoType, randomTetrominoGen]);

  return (
    <div className="grid grid-cols-[2fr_1fr] items-center justify-items-center h-full w-full bg-secondary text-primary">
      <GameBoard
        currentTetrominoType={currentTetrominoType.current}
        rotationStage={rotationStage}
        setRotationStage={setRotationStage}
        newTetromino={newTetromino}
      />
      <StatBoard />
    </div>
  );
}

export default App;
