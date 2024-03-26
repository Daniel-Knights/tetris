import { useEffect } from "react";

function GameOver({ onRestart }: { onRestart: () => void }) {
  // Play again on enter
  useEffect(() => {
    function handleKeyup(ev: KeyboardEvent) {
      if (ev.key === "Enter") {
        onRestart();
      }
    }

    window.addEventListener("keyup", handleKeyup);

    return () => {
      window.removeEventListener("keyup", handleKeyup);
    };
  }, [onRestart]);

  return (
    <button
      className="cursor-pointer flex justify-center items-center absolute top-0 h-full w-full bg-primary/25"
      onClick={onRestart}
      type="button"
    >
      <div className="py-4 w-full text-6xl font-bold text-center tracking-wider text-secondary bg-primary">
        GAME OVER
      </div>
    </button>
  );
}

export default GameOver;
