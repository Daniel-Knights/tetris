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
  setScore: (score: number) => void;

  lineClearCount: number;
  setLineClearCount: (lineClearCount: number) => void;

  gameOver: boolean;
  setGameOver: (gameOver: boolean) => void;

  tetrominoQueue: BagShuffleYield<TetrominoType>;
  nextTetromino: () => BagShuffleYield<TetrominoType>;

  tetrominoCoords: TetrominoCoordsState;
  setTetrominoCoords: (
    cb: (tetrominoCoords: TetrominoCoordsState) => TetrominoCoordsState
  ) => void;

  rotationStage: number;
  setRotationStage: (rotationStage: RotationStage) => void;

  dropInterval: number | null;
  setDropInterval: (dropInterval: number | null) => void;

  dropIntervalData: IntervalData | null;
  setDropIntervalData: (dropIntervalData: IntervalData | null) => void;

  isHardDrop: boolean;
  setIsHardDrop: (isHardDrop: boolean) => void;

  resetStore: () => BagShuffleYield<TetrominoType>;
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
  isHardDrop: false,
} satisfies PropertiesOnly<GameState>;

export const useStore = create<GameState>((set, get) => ({
  ...initialState,

  setCurrentLevel: (currentLevel) => set({ currentLevel }),
  setLineClearCount: (lineClearCount) => set({ lineClearCount }),
  setGameOver: (gameOver) => set({ gameOver }),
  setRotationStage: (rotationStage) => set({ rotationStage }),
  setDropInterval: (dropInterval) => set({ dropInterval }),
  setDropIntervalData: (dropIntervalData) => set({ dropIntervalData }),
  setIsHardDrop: (isHardDrop) => set({ isHardDrop }),

  setScore: (currentScore) => {
    set({ currentScore });

    if (currentScore > get().highScore) {
      set({ highScore: currentScore });

      localStorage.setItem("highScore", currentScore.toString());
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
    const nextTetrominoQueue = randomTetrominoGen.next().value;

    nextTetrominoQueue.refresh();

    set({
      ...initialState,
      tetrominoQueue: nextTetrominoQueue,
      highScore: Number(localStorage.getItem("highScore")),
    });

    return nextTetrominoQueue;
  },
}));
