import { useEffect, useRef, useState } from "react";

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
  const dropIntervalData = useStore((s) => s.dropIntervalData);
  // const resetStore = useStore((s) => s.resetStore);

  const { scoreLineClear } = useScore();
  const { moveTetromino } = useTetromino();

  const [menuOpen, setMenuOpen] = useState(false);

  // Cache remaining time of the current running interval
  const remainingDropIntervalTime = useRef<number | undefined>(undefined);

  function reset() {
    // TODO
  }

  function closeMenu(isRestart?: boolean) {
    setMenuOpen(false);

    if (isRestart) return;

    // Resume after remaining interval time
    window.setTimeout(() => {
      moveTetromino({ y: -1 });

      setDropInterval(getDropInterval(currentLevel));
    }, remainingDropIntervalTime.current);
  }

  useLockdown(scoreLineClear);

  // Open menu on escape
  useEffect(() => {
    function handleKeyup(ev: KeyboardEvent) {
      if (ev.key !== "Escape") return;

      // Cache remaining time
      remainingDropIntervalTime.current = dropIntervalData?.remainingTime;

      setDropInterval(null);
      setMenuOpen(true);
    }

    window.addEventListener("keyup", handleKeyup);

    return () => {
      window.removeEventListener("keyup", handleKeyup);
    };
  }, [setDropInterval, remainingDropIntervalTime, dropIntervalData?.remainingTime]);

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
