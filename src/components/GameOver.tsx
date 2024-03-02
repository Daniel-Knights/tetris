import { useEffect } from "react";

import { useStore } from "../modules";

function GameOver() {
  const resetStore = useStore((state) => state.resetStore);

  // Play again on enter
  useEffect(() => {
    function handleKeyup(ev: KeyboardEvent) {
      if (ev.key === "Enter") {
        resetStore();
      }
    }

    window.addEventListener("keyup", handleKeyup);

    return () => {
      window.removeEventListener("keyup", handleKeyup);
    };
  }, [resetStore]);

  return (
    <button
      className="cursor-pointer flex justify-center items-center absolute top-0 h-full w-full bg-primary/25"
      onClick={resetStore}
      type="button"
    >
      <div className="py-4 w-full text-6xl font-bold text-center tracking-wider text-secondary bg-primary">
        GAME OVER
      </div>
    </button>
  );
}

export default GameOver;
