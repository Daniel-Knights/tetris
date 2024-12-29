import { useEffect, useRef } from "react";

import { Coord } from "../classes";
import { addCustomEventListener, setFrameSyncInterval } from "../utils";

import { getDropInterval } from "./score";
import { useStore } from "./store";

export function useDrop(moveTetromino: (coord: Partial<Coord>) => void) {
  const currentLevel = useStore((s) => s.currentLevel);
  const gameStatus = useStore((s) => s.gameStatus);
  const dropInterval = useStore((s) => s.dropInterval);
  const setDropInterval = useStore((s) => s.setDropInterval);
  const setScore = useStore((s) => s.setScore);

  const remainingInterval = useRef<number | undefined>(undefined);

  // Drop interval
  useEffect(() => {
    if (dropInterval === null || gameStatus.is("GAME_OVER", "PAUSED")) return;

    const intervalData = setFrameSyncInterval(
      () => {
        if (remainingInterval.current) {
          remainingInterval.current = undefined;
        }

        moveTetromino({ y: -1 });

        if (gameStatus.is("SOFT_DROP")) {
          // Soft drop score = n lines
          setScore((curr) => curr + 1);
        }
      },
      dropInterval,
      {
        delay: remainingInterval.current ?? dropInterval,
      }
    );

    const removePauseListener = addCustomEventListener("gamestatuschange", (ev) => {
      if (!ev.detail.curr.is("PAUSED")) return;

      remainingInterval.current = intervalData.remainingMs;
    });

    return () => {
      intervalData.clear();
      removePauseListener();
    };
  }, [dropInterval, gameStatus, moveTetromino, setScore]);

  // Update drop interval on level change
  useEffect(() => {
    setDropInterval(getDropInterval(currentLevel));
  }, [currentLevel, setDropInterval]);

  return {
    resetTetromino: () => {
      remainingInterval.current = undefined;
    },
  };
}
