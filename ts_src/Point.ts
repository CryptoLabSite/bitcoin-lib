type PointFields = {
  x?: bigint;
  y?: bigint;
  a: bigint;
  b: bigint;
};

export class Point {
  x?: bigint;
  y?: bigint;
  a: bigint;
  b: bigint;

  constructor({ x, y, a, b }: PointFields) {
    this.x = x;
    this.y = y;
    this.a = a;
    this.b = b;

    // x and y being None represents the point at infinity
    // Check for that here since the equation below won't make sense
    // with None values for both.
    if (
      (this.x === undefined || this.x === null) &&
      (this.y === undefined || this.y === null)
    ) {
      return;
    }

    if (this.x === undefined || this.x === null) {
      throw new Error(`Invalid point.`);
    }

    if (this.y === undefined || this.y === null) {
      throw new Error(`Invalid point.`);
    }

    if (this.y ** 2n !== this.x ** 3n + this.a * this.x + this.b) {
      throw new Error(`(${this.x}, ${this.y}) is not on the curve.`);
    }
  }

  equals(other: Point): boolean {
    return (
      this.x === other.x &&
      this.y === other.y &&
      this.a === other.a &&
      this.b === other.b
    );
  }

  nonEquals(other: Point): boolean {
    return !this.equals(other);
  }

  toString() {
    if (this.x === undefined || this.x === null) {
      return 'Point(infinity)';
    } else {
      return `Point(${this.x},${this.y})_${this.a}_${this.b}`;
    }
  }

  add(other: Point): Point {
    if (this.a !== other.a || this.b !== other.b) {
      throw new Error(
        `Points ${toString()}, ${other.toString()} are not on the same curve'`,
      );
    }

    // Case 0.0: this is the point at infinity, return other
    if (this.x === undefined || this.x === null) {
      return other;
    }

    // Case 0.1: other is the point at infinity, return this
    if (other.x === undefined || other.x === null) {
      return this;
    }

    // Case 1: self.x == other.x, self.y != other.y
    // Result is point at infinity
    if (this.x === other.x && this.y !== other.y) {
      return new Point({ a: this.a, b: this.b });
    }

    // Case 2: this.x !== other.x
    if (this.x !== other.x) {
      // Formula: (x3, y3) == (x1, y1) + (x2, y2)
      // s=(y2-y1)/(x2-x1)
      const s = (other.y! - this.y!) / (other.x - this.x);
      // x3=x**2-x1-x2
      const x = s ** 2n - this.x - other.x;
      // y3=s*(x1-x3)-y1
      const y = s * (this.x - x) - this.y!;
      return new Point({ x, y, a: this.a, b: this.b });
    }

    // Case 4: if we are tangent to the vertical line,
    // we return the point at infinity
    // note instead of figuring out what 0 is for each type
    // we just use 0 * this.x
    if (this.equals(other) && this.y === 0n) {
      return new Point({ a: this.a, b: this.b });
    }

    // Case 3: this === other
    // Formula (x3,y3)=(x1,y1)+(x1,y1)
    // s=(3*x1**2+a)/(2*y1)
    // x3=s**2-2*x1
    // y3=s*(x1-x3)-y1
    if (this.equals(other)) {
      const s = (3n * this.x ** 2n + this.a) / (2n * this.y!);
      const x = s ** 2n - 2n * this.x;
      const y = s * (this.x - x) - this.y!;
      return new Point({ x, y, a: this.a, b: this.b });
    }

    throw Error('Invalid addition.');
  }
}
