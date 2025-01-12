import { TetrominoType, WALL_KICKS } from "../resources";

import { useStore } from "./store";

export type RotationStage = 0 | 1 | 2 | 3;

/** Rotates the current tetromino. */
export function useRotate() {
  const tetrominoQueue = useStore((s) => s.tetrominoQueue);
  const activeTetromino = useStore((s) => s.activeTetromino);
  const setActiveTetromino = useStore((s) => s.setActiveTetromino);
  const lockedCoords = useStore((s) => s.lockedCoords);

  return () => {
    if (!activeTetromino) return;

    const { rotationStage } = activeTetromino;
    const nextRotationStage = ((rotationStage + 1) % 4) as RotationStage;

    const wallKicks = WALL_KICKS.find((k) => {
      return (k.appliesTo as TetrominoType[]).includes(tetrominoQueue.next);
    })!;

    // Attempt initial rotation then try each wall kick until it doesn't collide
    for (let kickI = 0; kickI < wallKicks.offsets.length + 1; kickI += 1) {
      /** See {@link WALL_KICKS} type definition for how this works. */
      const wallKickClone = wallKicks.offsets[rotationStage]![kickI]!.clone();
      const adjustedWallKick = wallKickClone.subtract(
        wallKicks.offsets[nextRotationStage]![kickI]!
      );

      const rotatedTetromino = activeTetromino!.clone().rotate().move(adjustedWallKick);

      if (!rotatedTetromino.isAtBound(lockedCoords)) {
        setActiveTetromino(() => rotatedTetromino);

        return;
      }
    }
  };
}
