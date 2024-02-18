import { RepeatingTuple } from "../utils";

import { Coord } from "./coord";

export type TetrominoType = "I" | "J" | "L" | "O" | "S" | "T" | "Z";
export type TetrominoIndices = RepeatingTuple<number, 4>;

export type RotationStage = 0 | 1 | 2 | 3;

export const TETROMINOES = {
  I: {
    initialIndices: [3, 4, 5, 6],
    pivotIndex: 1,
  },
  J: {
    initialIndices: [3, 13, 14, 15],
    pivotIndex: 2,
  },
  L: {
    initialIndices: [5, 13, 14, 15],
    pivotIndex: 2,
  },
  O: {
    initialIndices: [4, 5, 14, 15],
    pivotIndex: 2,
  },
  S: {
    initialIndices: [4, 5, 13, 14],
    pivotIndex: 3,
  },
  T: {
    initialIndices: [4, 13, 14, 15],
    pivotIndex: 2,
  },
  Z: {
    initialIndices: [3, 4, 14, 15],
    pivotIndex: 2,
  },
} satisfies Record<
  TetrominoType,
  {
    initialIndices: TetrominoIndices;
    pivotIndex: number;
  }
>;

export const WALL_KICKS = [
  {
    appliesTo: ["J", "L", "S", "T", "Z"],
    offsets: [
      [
        new Coord({ x: 0, y: 0 }),
        new Coord({ x: 0, y: 0 }),
        new Coord({ x: 0, y: 0 }),
        new Coord({ x: 0, y: 0 }),
        new Coord({ x: 0, y: 0 }),
      ],
      [
        new Coord({ x: 0, y: 0 }),
        new Coord({ x: 1, y: 0 }),
        new Coord({ x: 1, y: -1 }),
        new Coord({ x: 0, y: 2 }),
        new Coord({ x: 1, y: 2 }),
      ],
      [
        new Coord({ x: 0, y: 0 }),
        new Coord({ x: 0, y: 0 }),
        new Coord({ x: 0, y: 0 }),
        new Coord({ x: 0, y: 0 }),
        new Coord({ x: 0, y: 0 }),
      ],
      [
        new Coord({ x: 0, y: 0 }),
        new Coord({ x: -1, y: 0 }),
        new Coord({ x: -1, y: -1 }),
        new Coord({ x: 0, y: 2 }),
        new Coord({ x: -1, y: 2 }),
      ],
    ],
  },
  {
    appliesTo: ["I"],
    offsets: [
      [
        new Coord({ x: 0, y: 0 }),
        new Coord({ x: -1, y: 0 }),
        new Coord({ x: 2, y: 0 }),
        new Coord({ x: -1, y: 0 }),
        new Coord({ x: 2, y: 0 }),
      ],
      [
        new Coord({ x: -1, y: 0 }),
        new Coord({ x: 0, y: 0 }),
        new Coord({ x: 0, y: 0 }),
        new Coord({ x: 0, y: 1 }),
        new Coord({ x: 0, y: -2 }),
      ],
      [
        new Coord({ x: -1, y: 1 }),
        new Coord({ x: 1, y: 1 }),
        new Coord({ x: -2, y: 1 }),
        new Coord({ x: 1, y: 0 }),
        new Coord({ x: -2, y: 0 }),
      ],
      [
        new Coord({ x: 0, y: 1 }),
        new Coord({ x: 0, y: 1 }),
        new Coord({ x: 0, y: 1 }),
        new Coord({ x: 0, y: -1 }),
        new Coord({ x: 0, y: 2 }),
      ],
    ],
  },
] satisfies {
  appliesTo: TetrominoType[];
  /**
   * Each coord array represents a stage of the rotation and each coord represents a
   * wall kick offset, with the zeroth coord being unobstructed rotation.
   *
   * Wall kicks are calculated by subtracting 'b' from 'a', where 'a' is the coord from
   * the current rotation stage, and 'b' is the same indexed coord for the next
   * rotation stage. For counter-clockwise rotations, subtracting 'a' from 'b' should
   * be equivalent.
   *
   * **Note:** the 'I' tetromino has offsets for unobstructed rotations, because its
   * pivot point isn't aligned centrally. Same with the 'O' tetromino, but, as rotating
   * it doesn't make a difference visually, we ignore it.
   *
   * See here for more details: https://tetris.wiki/Super_Rotation_System
   */
  offsets: RepeatingTuple<Coord[], 4>;
}[];
