import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useState } from "react";

import GameBoard from "./components/GameBoard";
import Menu from "./components/Menu";
import QueueBoard from "./components/QueueBoard";
import StatBoard from "./components/StatBoard";
import {
  getDropInterval,
  useControls,
  useDrop,
  useLockdown,
  useScore,
  useStore,
} from "./hooks";

function App() {
  const currentLevel = useStore((s) => s.currentLevel);
  const setGameStatus = useStore((s) => s.setGameStatus);
  const setDropInterval = useStore((s) => s.setDropInterval);
  const resetStore = useStore((s) => s.resetStore);

  const { scoreLineClear } = useScore();
  const { moveTetromino } = useControls();
  const { resetTetromino } = useDrop(moveTetromino);
  useLockdown(scoreLineClear);

  const [menuOpen, setMenuOpen] = useState(false);

  const pause = useCallback(() => {
    setDropInterval(null);
    setMenuOpen(true);
    setGameStatus("PAUSED");
  }, [setDropInterval, setGameStatus]);

  function restart() {
    resetStore();
    resetTetromino();
    setMenuOpen(false);
  }

  function resume() {
    setMenuOpen(false);
    setDropInterval(getDropInterval(currentLevel));
    setGameStatus("PLAYING");
  }

  useEffect(() => {
    const unlistenPromise = listen("pause", () => pause());

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [pause]);

  // Pause on escape
  useEffect(() => {
    function handleKeyup(ev: KeyboardEvent) {
      if (ev.key !== "Escape" || menuOpen) return;

      pause();
    }

    window.addEventListener("keyup", handleKeyup);

    return () => {
      window.removeEventListener("keyup", handleKeyup);
    };
  }, [menuOpen, pause]);

  return (
    <>
      <div className="flex justify-evenly items-center h-full w-full bg-secondary text-primary">
        <GameBoard onRestart={() => restart()} />
        <div className="flex flex-col justify-center items-center gap-8 h-full">
          <StatBoard />
          <QueueBoard />
        </div>
      </div>
      {menuOpen && <Menu onResume={() => resume()} onRestart={() => restart()} />}
    </>
  );
}

export default App;
