import { create } from "zustand";

import { Coord, Tetromino } from "../classes";
import { TETROMINOES, TetrominoType } from "../resources";
import { bagShuffle, BagShuffleYield, IntervalData, PropertiesOnly } from "../utils";

import { getDropInterval } from "./score";

type GameState = {
  currentLevel: number;
  setCurrentLevel: (level: number) => void;

  currentScore: number;
  highScore: number;
  setScore: (cb: (curr: number) => number) => void;

  lineClearCount: number;
  setLineClearCount: (lineClearCount: number) => void;

  gameOver: boolean;
  setGameOver: (gameOver: boolean) => void;

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

  dropIntervalData: IntervalData | null;
  setDropIntervalData: (dropIntervalData: IntervalData | null) => void;

  isSoftDrop: boolean;
  setIsSoftDrop: (isSoftDrop: boolean) => void;

  isHardDrop: boolean;
  setIsHardDrop: (isHardDrop: boolean) => void;

  isLockDown: boolean;
  setIsLockDown: (isLockDown: boolean) => void;

  resetStore: () => void;
};

const INITIAL_LEVEL = 1;

export const randomTetrominoGen = bagShuffle(Object.keys(TETROMINOES) as TetrominoType[]);

const initialTetrominoQueue = randomTetrominoGen.next().value;
const initialState = {
  currentLevel: INITIAL_LEVEL,
  currentScore: 0,
  highScore: Number(localStorage.getItem("highScore")) || 0,
  lineClearCount: 0,
  gameOver: false,
  tetrominoQueue: initialTetrominoQueue,
  activeTetromino: null,
  lockedCoords: [],
  dropInterval: getDropInterval(INITIAL_LEVEL),
  dropIntervalData: null,
  isSoftDrop: false,
  isHardDrop: false,
  isLockDown: false,
} satisfies PropertiesOnly<GameState>;

export const useStore = create<GameState>((set, get) => ({
  ...initialState,

  setCurrentLevel: (currentLevel) => set({ currentLevel }),
  setLineClearCount: (lineClearCount) => set({ lineClearCount }),
  setGameOver: (gameOver) => set({ gameOver }),
  setDropInterval: (dropInterval) => set({ dropInterval }),
  setDropIntervalData: (dropIntervalData) => set({ dropIntervalData }),
  setIsSoftDrop: (isSoftDrop) => set({ isSoftDrop }),
  setIsHardDrop: (isHardDrop) => set({ isHardDrop }),
  setIsLockDown: (isLockDown) => set({ isLockDown }),

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
