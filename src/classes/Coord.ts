export class Coord {
  x;
  y;

  constructor({ x, y }: { x: number; y: number }) {
    this.x = x;
    this.y = y;
  }

  static fromIndex(
    index: number,
    { rows, columns }: { rows: number; columns: number }
  ): Coord {
    return new this({
      x: ((index % columns) + columns) % columns,
      y: rows - 1 - Math.floor(index / columns),
    });
  }

  getRow(rows: number): number {
    return rows - 1 - this.y;
  }

  toIndex({ rows, columns }: { rows: number; columns: number }): number {
    return (rows - 1 - this.y) * columns + this.x;
  }

  isEqual(coord: Coord): boolean {
    return this.x === coord.x && this.y === coord.y;
  }

  isIn(coords: Coord[]): boolean {
    return coords.some((c) => c.isEqual(this));
  }

  clone(): Coord {
    return new Coord({ x: this.x, y: this.y });
  }

  add(...coords: Partial<Coord>[]): Coord {
    this.x += coords.reduce((acc, curr) => acc + (curr.x ?? 0), 0);
    this.y += coords.reduce((acc, curr) => acc + (curr.y ?? 0), 0);

    return this;
  }

  subtract(...coords: Partial<Coord>[]): Coord {
    this.x += coords.reduce((acc, curr) => acc - (curr.x ?? 0), 0);
    this.y += coords.reduce((acc, curr) => acc - (curr.y ?? 0), 0);

    return this;
  }

  /** Rotates coord clockwise 90deg. */
  rotate(): Coord {
    // 0 = cos(90deg)
    // 1 = sin(90deg)
    const newX = 0 * this.x + 1 * this.y;
    const newY = -1 * this.x + 0 * this.y;

    this.x = newX;
    this.y = newY;

    return this;
  }
}
