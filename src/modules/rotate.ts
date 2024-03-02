import { TETROMINOES, WALL_KICKS } from "../resources";

import { Coord } from "./coord";
import { useStore } from "./store";
import { TetrominoCoords, TetrominoType, willCollide } from "./tetromino";

export type RotationStage = 0 | 1 | 2 | 3;

/** Rotates the current tetromino. */
export function useRotate() {
  const tetrominoQueue = useStore((s) => s.tetrominoQueue);
  const tetrominoCoords = useStore((s) => s.tetrominoCoords);
  const setTetrominoCoords = useStore((s) => s.setTetrominoCoords);
  const rotationStage = useStore((s) => s.rotationStage);
  const setRotationStage = useStore((s) => s.setRotationStage);

  return () => {
    if (tetrominoQueue.next === "O") return;

    const nextRotationStage = ((rotationStage + 1) % 4) as RotationStage;
    const { pivotIndex } = TETROMINOES[tetrominoQueue.next];

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

      const newCoords: TetrominoCoords | [] = [...tetrominoCoords.active];

      const newPosWillCollide = tetrominoCoords.active.some((coord, i) => {
        const pivotCoord = tetrominoCoords.active[pivotIndex]!.clone();

        const rotatedDiff = new Coord({
          x: coord.x - pivotCoord.x,
          y: coord.y - pivotCoord.y,
        }).rotate();

        const newCoord = pivotCoord.add(rotatedDiff, adjustedWallKick);

        if (willCollide(tetrominoCoords.locked, newCoord)) {
          // Will collide, so we return and move on to the next wall kick
          return true;
        }

        newCoords[i] = newCoord;

        return false;
      });

      if (!newPosWillCollide) {
        setRotationStage(nextRotationStage);

        setTetrominoCoords((curr) => ({
          ...curr,
          active: newCoords,
        }));

        return;
      }
    }

    return tetrominoCoords.active;
  };
}
