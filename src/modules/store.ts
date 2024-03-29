import { create } from "zustand";

import { TETROMINOES } from "../resources";
import { bagShuffle, BagShuffleYield, IntervalData, PropertiesOnly } from "../utils";

import { RotationStage } from "./rotate";
import { getDropInterval } from "./score";
import { TetrominoCoordsState, TetrominoType } from "./tetromino";

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
  nextTetromino: () => BagShuffleYield<TetrominoType>;

  tetrominoCoords: TetrominoCoordsState;
  setTetrominoCoords: (cb: (curr: TetrominoCoordsState) => TetrominoCoordsState) => void;

  rotationStage: number;
  setRotationStage: (rotationStage: RotationStage) => void;

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

const initialState = {
  currentLevel: INITIAL_LEVEL,
  currentScore: 0,
  highScore: Number(localStorage.getItem("highScore")) || 0,
  lineClearCount: 0,
  gameOver: false,
  tetrominoQueue: randomTetrominoGen.next().value,
  tetrominoCoords: {
    active: [],
    ghost: [],
    locked: [],
  },
  rotationStage: 0,
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
  setRotationStage: (rotationStage) => set({ rotationStage }),
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

  nextTetromino: () => {
    const tetrominoQueue = randomTetrominoGen.next().value;

    set({ tetrominoQueue });

    return tetrominoQueue;
  },

  setTetrominoCoords: (cb) => {
    set((s) => ({ tetrominoCoords: cb(s.tetrominoCoords) }));
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
