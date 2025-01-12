import { Coord } from "../classes";
import { RepeatingTuple } from "../utils";

export type TetrominoType = "I" | "J" | "L" | "O" | "S" | "T" | "Z";
export type TetrominoCoords = RepeatingTuple<Coord, 4>;

export const TETROMINOES = {
  I: {
    coords: [
      new Coord({ x: 0, y: 0 }),
      new Coord({ x: 1, y: 0 }),
      new Coord({ x: 2, y: 0 }),
      new Coord({ x: 3, y: 0 }),
    ],
    startX: 3,
    pivotIndex: 1,
  },
  J: {
    coords: [
      new Coord({ x: 0, y: 0 }),
      new Coord({ x: 0, y: -1 }),
      new Coord({ x: 1, y: -1 }),
      new Coord({ x: 2, y: -1 }),
    ],
    startX: 3,
    pivotIndex: 2,
  },
  L: {
    coords: [
      new Coord({ x: 2, y: 0 }),
      new Coord({ x: 0, y: -1 }),
      new Coord({ x: 1, y: -1 }),
      new Coord({ x: 2, y: -1 }),
    ],
    startX: 3,
    pivotIndex: 2,
  },
  O: {
    coords: [
      new Coord({ x: 0, y: 0 }),
      new Coord({ x: 1, y: 0 }),
      new Coord({ x: 0, y: -1 }),
      new Coord({ x: 1, y: -1 }),
    ],
    startX: 4,
    pivotIndex: 2,
  },
  S: {
    coords: [
      new Coord({ x: 1, y: 0 }),
      new Coord({ x: 2, y: 0 }),
      new Coord({ x: 0, y: -1 }),
      new Coord({ x: 1, y: -1 }),
    ],
    startX: 3,
    pivotIndex: 3,
  },
  T: {
    coords: [
      new Coord({ x: 1, y: 0 }),
      new Coord({ x: 0, y: -1 }),
      new Coord({ x: 1, y: -1 }),
      new Coord({ x: 2, y: -1 }),
    ],
    startX: 3,
    pivotIndex: 2,
  },
  Z: {
    coords: [
      new Coord({ x: 0, y: 0 }),
      new Coord({ x: 1, y: 0 }),
      new Coord({ x: 1, y: -1 }),
      new Coord({ x: 2, y: -1 }),
    ],
    startX: 3,
    pivotIndex: 2,
  },
} satisfies Record<
  TetrominoType,
  {
    coords: TetrominoCoords;
    /** Starting adjustment for the x-axis. */
    startX: number;
    /** Index of the coord to pivot around. */
    pivotIndex: 0 | 1 | 2 | 3;
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
  {
    appliesTo: ["O"],
    offsets: [
      [new Coord({ x: 0, y: 0 })],
      [new Coord({ x: 0, y: -1 })],
      [new Coord({ x: -1, y: -1 })],
      [new Coord({ x: -1, y: 0 })],
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
   * **Note:** the 'I' and 'O' tetrominoes have offsets for unobstructed rotations,
   * because their pivot points aren't aligned centrally.
   *
   * See here for more details: https://tetris.wiki/Super_Rotation_System
   */
  offsets: RepeatingTuple<Coord[], 4>;
}[];
