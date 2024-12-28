import { create } from "zustand";

import { Coord, GameStatus, GameStatusType, Tetromino } from "../classes";
import { TETROMINOES, TetrominoType } from "../resources";
import {
  bagShuffle,
  BagShuffleYield,
  dispatchCustomEvent,
  PropertiesOnly,
} from "../utils";

import { getDropInterval } from "./score";

type GameState = {
  currentLevel: number;
  setCurrentLevel: (level: number) => void;

  currentScore: number;
  highScore: number;
  setScore: (cb: (curr: number) => number) => void;

  lineClearCount: number;
  setLineClearCount: (lineClearCount: number) => void;

  gameStatus: GameStatus;
  setGameStatus: (gameStatus: GameStatusType) => void;

  tetrominoQueue: BagShuffleYield<TetrominoType>;
  setNextTetromino: () => BagShuffleYield<TetrominoType>;

  activeTetromino: Tetromino | null;
  setActiveTetromino: (
    cb: (curr: Tetromino | null, lockedCoords: Coord[]) => Tetromino | null
  ) => void;

  lockedCoords: Coord[];
  setLockedCoords: (
    cb: (curr: Coord[], currActiveTetromino: Tetromino | null) => Coord[]
  ) => void;

  dropInterval: number | null;
  setDropInterval: (dropInterval: number | null) => void;

  resetStore: () => void;
};

const INITIAL_LEVEL = 15;

export const randomTetrominoGen = bagShuffle(Object.keys(TETROMINOES) as TetrominoType[]);

const initialTetrominoQueue = randomTetrominoGen.next().value;
const initialState = {
  currentLevel: INITIAL_LEVEL,
  currentScore: 0,
  highScore: Number(localStorage.getItem("highScore")) || 0,
  lineClearCount: 0,
  gameStatus: new GameStatus("PLAYING"),
  tetrominoQueue: initialTetrominoQueue,
  activeTetromino: null,
  lockedCoords: [],
  dropInterval: getDropInterval(INITIAL_LEVEL),
} satisfies PropertiesOnly<GameState>;

export const useStore = create<GameState>((set, get) => ({
  ...initialState,

  setCurrentLevel: (currentLevel) => set({ currentLevel }),
  setLineClearCount: (lineClearCount) => set({ lineClearCount }),
  setDropInterval: (dropInterval) => set({ dropInterval }),

  setGameStatus: (gameStatusValue) => {
    const gameStatus = new GameStatus(gameStatusValue);
    const currGameStatus = get().gameStatus;

    // If game over, can only be reset by resetting the entire store
    if (currGameStatus.is("GAME_OVER")) return;

    set({ gameStatus });

    dispatchCustomEvent("gamestatuschange", {
      curr: gameStatus,
      prev: currGameStatus,
    });
  },

  setScore: (cb) => {
    const { currentScore, highScore } = get();
    const newScore = cb(currentScore);

    set({ currentScore: newScore });

    if (newScore > highScore) {
      set({ highScore: newScore });

      localStorage.setItem("highScore", newScore.toString());
    }
  },

  setNextTetromino: () => {
    const tetrominoQueue = randomTetrominoGen.next().value;

    set({ tetrominoQueue });

    return tetrominoQueue;
  },

  setActiveTetromino: (cb) => {
    set((s) => {
      return { activeTetromino: cb(s.activeTetromino, s.lockedCoords) };
    });
  },

  setLockedCoords: (cb) => {
    set((s) => {
      return { lockedCoords: cb(s.lockedCoords, s.activeTetromino) };
    });
  },

  resetStore: () => {
    get().tetrominoQueue.refresh();

    set({
      ...initialState,
      tetrominoQueue: randomTetrominoGen.next().value,
      highScore: Number(localStorage.getItem("highScore")),
    });
  },
}));
