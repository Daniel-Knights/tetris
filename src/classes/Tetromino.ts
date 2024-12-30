import { MATRIX_DIMENSIONS } from "../constant";
import { RotationStage } from "../hooks";
import { TetrominoCoords, TETROMINOES, TetrominoType } from "../resources";
import { Nullish } from "../utils";

import { Coord } from "./Coord";

export class Tetromino {
  type;
  coords;
  startX;
  pivotIndex;
  rotationStage;

  isPlotted = false;

  constructor({
    type,
    rotationStage,
  }: {
    type: TetrominoType;
    rotationStage?: RotationStage;
  }) {
    this.type = type;
    this.coords = TETROMINOES[type].coords.map((c) => c.clone()) as TetrominoCoords;
    this.startX = TETROMINOES[type].startX;
    this.pivotIndex = TETROMINOES[type].pivotIndex;
    this.rotationStage = rotationStage ?? 0;
  }

  clone() {
    const clonedTetromino = new Tetromino({
      type: this.type,
      rotationStage: this.rotationStage,
    });

    clonedTetromino.coords = this.coords.map((c) => c.clone()) as TetrominoCoords;

    return clonedTetromino;
  }

  /** Plots the tetromino at the top of the matrix. */
  plot() {
    if (!this.isPlotted) {
      this.coords.forEach((c) => {
        c.add({
          x: this.startX,
          y: MATRIX_DIMENSIONS.ROWS - 1,
        });
      });

      this.isPlotted = true;
    } else {
      console.warn("Tetromino already plotted.");
    }

    return this;
  }

  rotate() {
    const pivotCoord = this.coords[this.pivotIndex]!;

    this.coords = this.coords.map((c) => {
      const rotatedDiff = c.clone().subtract(pivotCoord).rotate();

      return pivotCoord.clone().add(rotatedDiff);
    }) as TetrominoCoords;

    this.rotationStage = ((this.rotationStage + 1) % 4) as RotationStage;

    return this;
  }

  move(coord: Partial<Coord>) {
    this.coords.forEach((c) => c.add(coord));

    return this;
  }

  /**
   * Moves the tetromino to the lowest point it can sit without colliding.
   */
  moveToDropPoint(lockedCoords: Coord[]) {
    if (this.isAtBound(lockedCoords)) {
      while (this.isAtBound(lockedCoords, { y: 1 })) {
        this.move({ y: 1 });
      }
    } else {
      while (!this.isAtBound(lockedCoords, { y: -1 })) {
        this.move({ y: -1 });
      }
    }

    return this;
  }

  /**
   * Returns true if passed coord will collide with current locked coords or game board boundaries.
   */
  isAtBound(lockedCoords: Coord[], shiftCoord?: Partial<Coord>) {
    return this.coords.some((coord) => {
      const nextCoord = shiftCoord ? coord.clone().add(shiftCoord) : coord;

      return (
        nextCoord.isIn(lockedCoords) ||
        nextCoord.x < 0 ||
        nextCoord.x > MATRIX_DIMENSIONS.COLUMNS - 1 ||
        nextCoord.y < 0
      );
    });
  }

  /**
   * Returns the coordinate difference between current and passed tetromino.
   * Returns `undefined` if the tetromino types or rotation stages are different.
   */
  difference(tetromino: Tetromino | Nullish) {
    if (this.type !== tetromino?.type) return;
    if (this.rotationStage !== tetromino.rotationStage) return;

    return this.coords[0].clone().subtract(tetromino.coords[0]);
  }
}
