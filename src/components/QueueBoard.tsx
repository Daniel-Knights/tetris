import { TetrominoType } from "../modules";
import { TETROMINOES } from "../resources";

import Matrix from "./Matrix";

function QueueBoard({ queue }: { queue: TetrominoType[] }): JSX.Element {
  return (
    <div className="grid gap-12 justify-items-center content-center w-36 h-72 bg-primary/5">
      {queue.slice(0, 3).map((tetrominoType) => {
        return (
          <Matrix
            key={crypto.randomUUID()}
            highlightedCoords={TETROMINOES[tetrominoType].coords}
          />
        );
      })}
    </div>
  );
}

export default QueueBoard;
