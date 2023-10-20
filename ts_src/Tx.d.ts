/// <reference types="node" />
import { TxIn } from './TxIn';
import { TxOut } from './TxOut';
export declare class Tx {
    version: number;
    txIns: TxIn[];
    txOuts: TxOut[];
    locktime: number;
    testnet: boolean;
    constructor(version: number, txIns: TxIn[], txOuts: TxOut[], locktime: number, testnet?: boolean);
    toString(): string;
    id(): string;
    hash(): Buffer;
    static parse(s: Buffer, testnet?: boolean): Tx;
    serialize(): Buffer;
    fee(testnet: boolean): Promise<bigint>;
}
