/// <reference types="node" />
import { SmartBuffer } from 'smart-buffer';
export declare function pow(base: bigint, exponent: bigint, modulus: bigint): bigint;
export declare function mod(n: bigint, m: bigint): bigint;
export declare function hash160(data: Buffer | string): Buffer;
export declare function hash256(data: Buffer | string): Buffer;
export declare function encodeBase58(data: Buffer): string;
export declare function encodeBase58Checksum(data: Buffer): string;
export declare function decodeBase58(data: string): Buffer;
export declare function toBigIntLE(buffer: Buffer): bigint;
export declare function toBigIntBE(buffer: Buffer): bigint;
export declare function toBufferLE(num: bigint, byteLength: number): Buffer;
export declare function toBufferBE(num: bigint, byteLength: number): Buffer;
export declare function reverseBuffer(buffer: Buffer): Buffer;
export declare function readVarint(buffer: SmartBuffer): bigint;
export declare function encodeVarint(num: number): Buffer;
export declare function randomBigInt(max: bigint): bigint;
