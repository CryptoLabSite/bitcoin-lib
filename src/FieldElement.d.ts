export declare class FieldElement {
    num: bigint;
    prime: bigint;
    constructor(num: bigint, prime: bigint);
    toString(): string;
    equals(other: FieldElement): boolean;
    nonEquals(other: FieldElement): boolean;
    add(other: FieldElement): FieldElement;
    sub(other: FieldElement): FieldElement;
    mul(other: FieldElement): FieldElement;
    div(other: FieldElement): FieldElement;
    pow(exponent: bigint): FieldElement;
    scalarMul(scalar: bigint): FieldElement;
}
