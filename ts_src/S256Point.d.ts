/// <reference types="node" />
import { FinitePoint } from './FinitePoint';
import { Signature } from './Signature';
export declare const N = 115792089237316195423570985008687907852837564279074904382605163141518161494337n;
export declare class S256Point extends FinitePoint {
    constructor(x: bigint | undefined, y: bigint | undefined);
    toString(): string;
    scalarMul(coefficient: bigint): S256Point;
    address(compressed?: boolean, testnet?: boolean): string;
    verify(z: bigint, sig: Signature): boolean;
    sec(compressed?: boolean): Buffer;
    static parse(sec: Buffer): S256Point;
}
export declare const G: S256Point;
