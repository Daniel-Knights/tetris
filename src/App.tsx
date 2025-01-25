import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useState } from "react";

import { GameBoard } from "./components/GameBoard";
import { Keyboard } from "./components/Keyboard";
import { PauseMenu } from "./components/PauseMenu";
import { QueueBoard } from "./components/QueueBoard";
import { StatBoard } from "./components/StatBoard";
import {
  getDropInterval,
  useControls,
  useDrop,
  useLockdown,
  useScore,
  useStore,
} from "./hooks";
import { isDesktop, isWeb } from "./utils/env";

export function App() {
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

  // Pause on blur
  useEffect(() => {
    if (isDesktop()) {
      const unlistenPromise = listen("tauri://blur", () => pause());

      return () => {
        unlistenPromise.then((unlisten) => unlisten());
      };
    }

    window.addEventListener("blur", pause);

    return () => {
      window.removeEventListener("blur", pause);
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
      <div className="flex flex-col justify-center h-full w-full bg-secondary text-primary select-none">
        <div
          className={`flex ${isDesktop() ? "justify-evenly" : "justify-center gap-4"} items-center`}
        >
          <GameBoard onRestart={() => restart()} />
          <div className="flex flex-col justify-center items-center gap-4 h-full sm:gap-8">
            <StatBoard />
            <QueueBoard />
          </div>
        </div>
        {isWeb() && <Keyboard className="mt-4" />}
      </div>
      {menuOpen && <PauseMenu onResume={() => resume()} onRestart={() => restart()} />}
    </>
  );
}
