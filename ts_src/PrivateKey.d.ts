import { S256Point } from './S256Point';
import { Signature } from './Signature';
export declare class PrivateKey {
    secret: bigint;
    point: S256Point;
    constructor(secret: bigint);
    hex(): string;
    sign(z: bigint): Signature;
    deterministicK(z: bigint): bigint;
    wif(compressed?: boolean, testnet?: boolean): string;
}
