const {pow, mod} = import('./helper');

export class FieldElement {
    constructor(public num: bigint, public prime: bigint) {
        if (num >= prime || num < 0n) {
            throw new Error(`Num ${num} not in field range 0 to ${prime - 1n}`);
        }
    }

    toString() {
        return `FieldElement_${this.prime}(${this.num})`;
    }

    equals(other: FieldElement): boolean {
        if (!other) {
            return false;
        }

        return this.num === other.num && this.prime === other.prime;
    }

    nonEquals(other: FieldElement): boolean {
        return !this.equals(other);
    }

    add(other: FieldElement): FieldElement {
        if (this.prime !== other.prime) {
            throw new Error('Cannot add two numbers in different Fields');
        }

        const num = (this.num + other.num) % this.prime;
        return new FieldElement(num, this.prime);
    }

    subtract(other: FieldElement): FieldElement {
        if (this.prime !== other.prime) {
            throw new Error('Cannot subtract two numbers in different Fields');
        }

        const num = mod(this.num - other.num, this.prime);
        return new FieldElement(num, this.prime);
    }

    multiply(other: FieldElement): FieldElement {
        if (this.prime !== other.prime) {
            throw new Error('Cannot multiply two numbers in different Fields');
        }

        const num = (this.num * other.num) % this.prime;
        return new FieldElement(num, this.prime);
    }

    div(other: FieldElement) {
        if (this.prime !== other.prime) {
            throw new Error('Cannot divide two numbers in different Fields');
        }

        const num = (this.num * pow(other.num, this.prime - 2n, this.prime)) % this.prime;

        return new FieldElement(num, this.prime);
    }

    pow(exponent: bigint): FieldElement {
        const n = mod(exponent, this.prime - 1n);
        const num = pow(this.num, n, this.prime);
        return new FieldElement(num, this.prime);
    }

    rmul(coefficient: bigint) {
        const num = (this.num * coefficient) % this.prime;
        return new FieldElement(num, this.prime);
    }
}