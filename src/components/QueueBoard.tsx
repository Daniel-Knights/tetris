import { useStore } from "../hooks";
import { TETROMINOES } from "../resources";

import { Matrix } from "./Matrix";

export function QueueBoard() {
  const tetrominoQueue = useStore((s) => s.tetrominoQueue).bag;

  return (
    <div className="grid gap-6 justify-items-center content-center w-24 h-52 bg-primary/5 sm:gap-12 sm:w-36 sm:h-72">
      {tetrominoQueue.slice(0, 3).map((tetrominoType) => {
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
