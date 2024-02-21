export class Coord {
  x;
  y;

  get row(): number {
    return 19 - this.y;
  }

  constructor({ x, y }: { x: number; y: number }) {
    this.x = x;
    this.y = y;
  }

  static fromIndex(index: number): Coord {
    return new this({
      x: ((index % 10) + 10) % 10,
      y: 19 - Math.floor(index / 10),
    });
  }

  toIndex(): number {
    return (19 - this.y) * 10 + this.x;
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
