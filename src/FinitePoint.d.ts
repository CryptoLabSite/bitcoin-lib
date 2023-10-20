import { FieldElement } from './FieldElement';
export declare class FinitePoint {
    x: FieldElement | undefined;
    y: FieldElement | undefined;
    a: FieldElement;
    b: FieldElement;
    constructor(x: FieldElement | undefined, y: FieldElement | undefined, a: FieldElement, b: FieldElement);
    equals(other: FinitePoint): boolean;
    toString(): string;
    add(other: FinitePoint): FinitePoint;
    scalarMul(coefficient: bigint): FinitePoint;
    isInfinity(): boolean;
    ofInfinity(): FinitePoint;
}
