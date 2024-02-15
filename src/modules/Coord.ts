export class Coord {
  x;
  y;

  constructor({ x, y }: { x: number; y: number }) {
    this.x = x;
    this.y = y;
  }

  static fromIndex(index: number): Coord {
    return new this({
      x: index > -1 ? index % 10 : 10 + (index % 10),
      y: 19 - Math.floor(index / 10),
    });
  }

  toIndex(): number {
    return (19 - this.y) * 10 + this.x;
  }

  clone(): Coord {
    return new Coord({ x: this.x, y: this.y });
  }

  add(...coords: Coord[]): Coord {
    this.x += coords.reduce((acc, curr) => acc + curr.x, 0);
    this.y += coords.reduce((acc, curr) => acc + curr.y, 0);

    return this;
  }

  subtract(...coords: Coord[]): Coord {
    this.x += coords.reduce((acc, curr) => acc - curr.x, 0);
    this.y += coords.reduce((acc, curr) => acc - curr.y, 0);

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
