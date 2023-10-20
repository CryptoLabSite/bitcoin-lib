import { FieldElement } from './FieldElement';
export declare const P: bigint;
export declare class S256Field extends FieldElement {
    constructor(num: bigint);
    hex(): string;
    toString(): string;
    sqrt(): S256Field;
}
