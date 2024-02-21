import { Coord, TetrominoCoords, TetrominoType } from "../modules";
import { RepeatingTuple } from "../utils";

export const TETROMINOES = {
  I: {
    coords: [
      new Coord({ x: 0, y: 0 }),
      new Coord({ x: 1, y: 0 }),
      new Coord({ x: 2, y: 0 }),
      new Coord({ x: 3, y: 0 }),
    ],
    pivotIndex: 1,
  },
  J: {
    coords: [
      new Coord({ x: 0, y: 0 }),
      new Coord({ x: 0, y: -1 }),
      new Coord({ x: 1, y: -1 }),
      new Coord({ x: 2, y: -1 }),
    ],
    pivotIndex: 2,
  },
  L: {
    coords: [
      new Coord({ x: 2, y: 0 }),
      new Coord({ x: 0, y: -1 }),
      new Coord({ x: 1, y: -1 }),
      new Coord({ x: 2, y: -1 }),
    ],
    pivotIndex: 2,
  },
  O: {
    coords: [
      new Coord({ x: 0, y: 0 }),
      new Coord({ x: 1, y: 0 }),
      new Coord({ x: 0, y: -1 }),
      new Coord({ x: 1, y: -1 }),
    ],
    pivotIndex: 2,
  },
  S: {
    coords: [
      new Coord({ x: 1, y: 0 }),
      new Coord({ x: 2, y: 0 }),
      new Coord({ x: 0, y: -1 }),
      new Coord({ x: 1, y: -1 }),
    ],
    pivotIndex: 3,
  },
  T: {
    coords: [
      new Coord({ x: 1, y: 0 }),
      new Coord({ x: 0, y: -1 }),
      new Coord({ x: 1, y: -1 }),
      new Coord({ x: 2, y: -1 }),
    ],
    pivotIndex: 2,
  },
  Z: {
    coords: [
      new Coord({ x: 0, y: 0 }),
      new Coord({ x: 1, y: 0 }),
      new Coord({ x: 1, y: -1 }),
      new Coord({ x: 2, y: -1 }),
    ],
    pivotIndex: 2,
  },
} satisfies Record<
  TetrominoType,
  {
    coords: TetrominoCoords;
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
