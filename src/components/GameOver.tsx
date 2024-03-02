import { useEffect } from "react";

import { plotTetromino, useStore } from "../modules";

function GameOver() {
  function playAgain() {
    const initialState = useStore.getInitialState();

    useStore.setState(initialState);
    initialState.tetrominoQueue.reset();

    const newTetromino = initialState.nextTetromino().next;

    initialState.setTetrominoCoords((curr) => ({
      ...curr,
      active: plotTetromino(newTetromino),
    }));
  }

  // Play again on enter
  useEffect(() => {
    function handleKeyup(ev: KeyboardEvent) {
      if (ev.key === "Enter") {
        playAgain();
      }
    }

    window.addEventListener("keyup", handleKeyup);

    return () => {
      window.removeEventListener("keyup", handleKeyup);
    };
  }, []);

  return (
    <div
      className="cursor-pointer flex justify-center items-center absolute top-0 h-full w-full bg-primary/25"
      onClick={playAgain}
    >
      <div className="py-4 w-full text-6xl font-bold text-center tracking-wider text-secondary bg-primary">
        GAME OVER
      </div>
    </div>
  );
}

export default GameOver;
