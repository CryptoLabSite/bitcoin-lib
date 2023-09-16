import {FieldElement} from "./FieldElement";

export class FinitePoint {
    constructor(
        public x: FieldElement | undefined,
        public y: FieldElement | undefined,
        public a: FieldElement,
        public b: FieldElement
    ) {
        if (this.x === undefined && this.y === undefined) {
            return;
        }

        if (this.x === undefined || this.y === undefined) {
            throw new Error(`Invalid point.`);
        }

        if (this.y.pow(2n).nonEquals(this.x.pow(3n).add(this.a.mul(this.x)).add(this.b))) {
            throw new Error(`(${this.x}, ${this.y}) is not on the curve`);
        }
    }

    equals(other: FinitePoint): boolean {
        if (this.isInfinity()) {
            return other.isInfinity();
        }

        return this.x!.equals(other.x!)
            && this.y!.equals(other.y!)
            && this.a.equals(other.a)
            && this.b.equals(other.b);
    }

    toString() {
        if (this.isInfinity()) {
            return 'FinitePoint(infinity)';
        }

        return `FinitePoint(${this.x!.num},${this.y!.num})_${this.a.num}_${this.b.num}`;
    }

    add(other: FinitePoint): FinitePoint {
        if (this.a.nonEquals(other.a) || this.b.nonEquals(other.b)) {
            throw new Error(`FinitePoint ${toString()}, ${other.toString()} are not on the same curve.`);
        }

        // Case 0.0: this is the point at infinity, return other
        if (this.x === undefined) {
            return other;
        }

        // Case 0.1: other is the point at infinity, return this
        if (other.x === undefined) {
            return this;
        }

        // Case 1: this.x == other.x, this.y != other.y
        // Result is point at infinity
        if (this.x.equals(other.x) && this.y!.nonEquals(other.y!)) {
            return this.ofInfinity();
        }

        // Case 2: this.x !== other.x
        if (this.x.nonEquals(other.x)) {
            // Formula: (x3, y3) == (x1, y1) + (x2, y2)
            // s=(y2-y1)/(x2-x1)
            const s = other.y!.sub(this.y!).div(other.x.sub(this.x));
            // x3=x**2-x1-x2
            const x = s.pow(2n).sub(this.x).sub(other.x);
            // y3=s*(x1-x3)-y1
            const y = s.mul(this.x.sub(x)).sub(this.y!);
            return new FinitePoint(x, y, this.a, this.b);
        } else {
            // Case 3: this === other
            // Formula (x3,y3)=(x1,y1)+(x1,y1)
            // s=(3*x1**2+a)/(2*y1)
            const s = this.x.pow(2n).scalarMul(3n).div(this.y!.scalarMul(2n));
            // const s = (this.x.pow(2n).multiply(3n)).div();
            // x3=s**2-2*x1
            const x = s.pow(2n).sub(this.x.scalarMul(2n));
            // y3=s*(x1-x3)-y1
            const y = s.mul(this.x.sub(x)).sub(this.y!);
            return new FinitePoint(x, y, this.a, this.b);
        }
    }

    scalarMul(coefficient: bigint): FinitePoint {
        let coef = coefficient;
        let current: FinitePoint = this;
        // rmul calculates coefficient * this
        let result = this.ofInfinity();

        while (coef) {
            if (coef & 1n) {
                result = result.add(current);
            }

            current = current.add(current);
            coef >>= 1n;
        }

        return result;
    }

    isInfinity(): boolean {
        return this.x === undefined && this.y === undefined;
    }

    ofInfinity(): FinitePoint {
        return new FinitePoint(undefined, undefined, this.a, this.b);
    }
}
