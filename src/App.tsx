import { useEffect, useState } from "react";

import GameBoard from "./components/GameBoard";
import Menu from "./components/Menu";
import QueueBoard from "./components/QueueBoard";
import StatBoard from "./components/StatBoard";
import {
  getDropInterval,
  useLockdown,
  useScore,
  useStore,
  useTetromino,
} from "./modules";

function App(): JSX.Element {
  const currentLevel = useStore((s) => s.currentLevel);
  const setDropInterval = useStore((s) => s.setDropInterval);
  // const resetStore = useStore((s) => s.resetStore);

  const { scoreLineClear } = useScore();
  const { moveTetromino } = useTetromino();

  const [menuOpen, setMenuOpen] = useState(false);

  function reset() {
    // TODO
  }

  function closeMenu(isRestart?: boolean) {
    setMenuOpen(false);

    if (isRestart) return;

    setDropInterval(getDropInterval(currentLevel));
  }

  useLockdown(scoreLineClear);

  // Open menu on escape
  useEffect(() => {
    function handleKeyup(ev: KeyboardEvent) {
      if (ev.key !== "Escape" || menuOpen) return;

      setDropInterval(null);
      setMenuOpen(true);
    }

    window.addEventListener("keyup", handleKeyup);

    return () => {
      window.removeEventListener("keyup", handleKeyup);
    };
  }, [setDropInterval, menuOpen]);

  return (
    <>
      <div className="flex justify-evenly items-center h-full w-full bg-secondary text-primary">
        <GameBoard moveTetromino={moveTetromino} />
        <div className="flex flex-col justify-center items-center gap-8 h-full">
          <StatBoard />
          <QueueBoard />
        </div>
      </div>
      {menuOpen && (
        <Menu onClose={(isRestart) => closeMenu(isRestart)} onRestart={() => reset()} />
      )}
    </>
  );
}

export default App;
