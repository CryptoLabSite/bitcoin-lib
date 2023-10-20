"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldElement = void 0;
const helper_1 = require("./helper");
class FieldElement {
    constructor(num, prime) {
        this.num = num;
        this.prime = prime;
        if (num >= prime || num < 0n) {
            throw new Error(`Num ${num} not in field range 0 to ${prime - 1n}`);
        }
    }
    toString() {
        return `FieldElement_${this.prime}(${this.num})`;
    }
    equals(other) {
        if (!other) {
            return false;
        }
        return this.num === other.num && this.prime === other.prime;
    }
    nonEquals(other) {
        return !this.equals(other);
    }
    add(other) {
        if (this.prime !== other.prime) {
            throw new Error('Cannot add two numbers in different Fields');
        }
        const num = (this.num + other.num) % this.prime;
        return new FieldElement(num, this.prime);
    }
    sub(other) {
        if (this.prime !== other.prime) {
            throw new Error('Cannot subtract two numbers in different Fields');
        }
        const num = (0, helper_1.mod)(this.num - other.num, this.prime);
        return new FieldElement(num, this.prime);
    }
    mul(other) {
        if (this.prime !== other.prime) {
            throw new Error('Cannot multiply two numbers in different Fields');
        }
        const num = (this.num * other.num) % this.prime;
        return new FieldElement(num, this.prime);
    }
    div(other) {
        if (this.prime !== other.prime) {
            throw new Error('Cannot divide two numbers in different Fields');
        }
        const num = (this.num * (0, helper_1.pow)(other.num, this.prime - 2n, this.prime)) % this.prime;
        return new FieldElement(num, this.prime);
    }
    pow(exponent) {
        const n = (0, helper_1.mod)(exponent, this.prime - 1n);
        const num = (0, helper_1.pow)(this.num, n, this.prime);
        return new FieldElement(num, this.prime);
    }
    scalarMul(scalar) {
        if (scalar <= 0n) {
            throw new Error('scalar must be > 0');
        }
        const num = (this.num * scalar) % this.prime;
        return new FieldElement(num, this.prime);
    }
}
exports.FieldElement = FieldElement;
