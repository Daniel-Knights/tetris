import { MATRIX_DIMENSIONS } from "../constant";
import { useStore } from "../hooks";

import GameOver from "./GameOver";
import Matrix from "./Matrix";

function GameBoard({ onRestart }: { onRestart: () => void }) {
  const gameStatus = useStore((s) => s.gameStatus);
  const activeTetromino = useStore((s) => s.activeTetromino);
  const lockedCoords = useStore((s) => s.lockedCoords);

  return (
    <div className="relative py-4 border-y-4 border-double border-primary/30">
      <Matrix
        dimensions={{ rows: MATRIX_DIMENSIONS.ROWS, columns: MATRIX_DIMENSIONS.COLUMNS }}
        highlightedCoords={[...(activeTetromino?.coords ?? []), ...lockedCoords]}
        // Ghost tetromino
        outlinedCoords={activeTetromino?.clone().moveToDropPoint(lockedCoords).coords}
        bg
      />
      {gameStatus.is("GAME_OVER") && <GameOver onRestart={onRestart} />}
    </div>
  );
}

export default GameBoard;
