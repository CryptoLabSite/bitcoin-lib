/// <reference types="node" />
import { OpCode } from './Op';
import { SmartBuffer } from 'smart-buffer';
type Element = {
    data: Buffer;
    dataLength: number;
};
type Cmd = OpCode | Element;
export declare class Script {
    cmds: Cmd[];
    constructor(cmds?: Cmd[]);
    toString(): string;
    add(other: Script): Script;
    evaluate(z: bigint): boolean;
    static parse(s: SmartBuffer): Script;
    rawSerialize(): Buffer;
    serialize(): Buffer;
}
export {};
