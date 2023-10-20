/// <reference types="node" />
export declare class Signature {
    r: bigint;
    s: bigint;
    constructor(r: bigint, s: bigint);
    toString(): string;
    der(): Buffer;
    static parse(signature: Buffer): Signature;
}
