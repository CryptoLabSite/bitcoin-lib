/// <reference types="node" />
import { Script } from './Script';
import { SmartBuffer } from 'smart-buffer';
export declare class TxOut {
    amount: bigint;
    scriptPubKey: Script;
    constructor(amount: bigint, scriptPubKey: Script);
    static parse(s: SmartBuffer): TxOut;
    toString(): string;
    serialize(): Buffer;
}
