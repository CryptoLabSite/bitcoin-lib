/// <reference types="node" />
import { Script } from './Script';
import { SmartBuffer } from 'smart-buffer';
import { Tx } from './Tx';
export declare class TxIn {
    prevTx: Buffer;
    prevIndex: number;
    scriptSig: Script;
    sequence: number;
    constructor(prevTx: Buffer, prevIndex: number, scriptSig?: Script, sequence?: number);
    toString(): string;
    static parse(s: SmartBuffer): TxIn;
    serialize(): Buffer;
    fetchTx(testnet?: boolean): Promise<Tx>;
    value(testnet?: boolean): Promise<bigint>;
    scriptPubkey(testnet?: boolean): Promise<Script>;
}
