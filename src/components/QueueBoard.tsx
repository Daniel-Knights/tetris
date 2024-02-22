import { TetrominoType } from "../modules";
import { TETROMINOES } from "../resources";

import Matrix from "./Matrix";

const MATRIX = {
  rows: 8,
  columns: 4,
};

function QueueBoard({ queue }: { queue: TetrominoType[] }): JSX.Element {
  const highlightedCoords = queue
    .slice(0, 3)
    .map((tetrominoType, i) => {
      return TETROMINOES[tetrominoType].coords.map((coord) => {
        return coord.clone().add({
          y: MATRIX.rows - 1 - i * 3,
        });
      });
    })
    .flat();

  return (
    <div>
      <Matrix
        rows={MATRIX.rows}
        columns={MATRIX.columns}
        highlightedCoords={highlightedCoords}
      />
    </div>
  );
}

export default QueueBoard;
