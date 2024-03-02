import { create } from "zustand";

import { TETROMINOES } from "../resources";
import { bagShuffle } from "../utils";

import { RotationStage } from "./rotate";
import { getDropInterval } from "./score";
import { TetrominoCoordsState, TetrominoType } from "./tetromino";

type TetrominoQueue = {
  bag: TetrominoType[];
  next: TetrominoType;
  reset: () => void;
};

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

  tetrominoQueue: TetrominoQueue;
  nextTetromino: () => TetrominoQueue;

  tetrominoCoords: TetrominoCoordsState;
  setTetrominoCoords: (
    cb: (tetrominoCoords: TetrominoCoordsState) => TetrominoCoordsState
  ) => void;

  rotationStage: number;
  setRotationStage: (rotationStage: RotationStage) => void;

  dropInterval: number | null;
  setDropInterval: (dropInterval: number | null) => void;

  dropIntervalId: number | null;
  setDropIntervalId: (dropIntervalId: number | null) => void;

  isHardDrop: boolean;
  setIsHardDrop: (isHardDrop: boolean) => void;
};

const INITIAL_LEVEL = 1;

export const randomTetrominoGen = bagShuffle(Object.keys(TETROMINOES) as TetrominoType[]);

export const useStore = create<GameState>((set, get) => ({
  currentLevel: INITIAL_LEVEL,
  setCurrentLevel: (currentLevel) => set({ currentLevel }),

  currentScore: 0,
  highScore: Number(localStorage.getItem("highScore")) || 0,
  setScore: (currentScore) => {
    set({ currentScore });

    if (currentScore > get().highScore) {
      set({ highScore: currentScore });

      localStorage.setItem("highScore", currentScore.toString());
    }
  },

  lineClearCount: 0,
  setLineClearCount: (lineClearCount) => set({ lineClearCount }),

  gameOver: false,
  setGameOver: (gameOver) => set({ gameOver }),

  tetrominoQueue: randomTetrominoGen.next().value,
  nextTetromino: () => {
    const tetrominoQueue = randomTetrominoGen.next().value;

    set({ tetrominoQueue });

    return tetrominoQueue;
  },

  tetrominoCoords: {
    active: [],
    ghost: [],
    locked: [],
  },
  setTetrominoCoords: (cb) => {
    set((state) => ({ tetrominoCoords: cb(state.tetrominoCoords) }));
  },

  rotationStage: 0,
  setRotationStage: (rotationStage) => set({ rotationStage }),

  dropInterval: getDropInterval(INITIAL_LEVEL),
  setDropInterval: (dropInterval) => set({ dropInterval }),

  dropIntervalId: null,
  setDropIntervalId: (dropIntervalId) => set({ dropIntervalId }),

  isHardDrop: false,
  setIsHardDrop: (isHardDrop) => set({ isHardDrop }),
}));
