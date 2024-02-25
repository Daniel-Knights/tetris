import { create } from "zustand";

type GameState = {
  currentLevel: number;
  setCurrentLevel: (level: number) => void;

  gameOver: boolean;
  setGameOver: (gameOver: boolean) => void;
};

export const useStore = create<GameState>((set) => ({
  currentLevel: 1,
  setCurrentLevel: (currentLevel: number) => set({ currentLevel }),

  gameOver: false,
  setGameOver: (gameOver: boolean) => set({ gameOver }),
}));
