import * as crypto from "crypto";
import {SmartBuffer} from "smart-buffer";

export function pow(base: bigint, exponent: number, modulus: bigint): bigint {
    if (modulus === 1n) return 0n;
    let result = 1n;
    base = mod(base, modulus);
    let exponentBI = BigInt(exponent);
    while (exponentBI > 0n) {
        if (exponentBI & 1n) {
            result = mod(result * base, modulus);
        }
        exponentBI = exponentBI >> 1n;
        base = mod(base * base, modulus);
    }
    return result;
}

// bigint mod that produces a positive value
function mod(n: bigint, m: bigint): bigint {
    return ((n % m) + m) % m;
}

function _sha256() {
    return crypto.createHash('sha256');
}

function _ripemd160() {
    return crypto.createHash('ripemd160');
}

export function hash160(data: Buffer | string) {
    const sha256Result = _sha256().update(data).digest();
    return _ripemd160().update(sha256Result).digest();
}

export function hash256(data: Buffer | string) {
    const sha256Result = _sha256().update(data).digest();
    return _sha256().update(sha256Result).digest();
}

const BASE58_ALPHABET: string = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export function encodeBase58(data: Buffer): string {
    let zeroCount = 0;
    for (const b of data) {
        if (b === 0) {
            zeroCount += 1;
        } else {
            break;
        }
    }

    let num = toBigIntBE(data);
    let result = '';
    let prefix = '1'.repeat(zeroCount);
    while (num > 0n) {
        const mod = num % 58n;
        num = num / 58n;
        result = BASE58_ALPHABET[Number(mod)] + result;
    }

    return prefix + result;
}

export function encodeBase58Checksum(data: Buffer): string {
    const checkSum = hash256(data).subarray(0, 4);
    return encodeBase58(Buffer.concat([data, checkSum]));
}

export function decodeBase58(data: string): Buffer {
    let num = 0n;
    for (const b of data) {
        num *= 58n;
        num += BigInt(BASE58_ALPHABET.indexOf(b));
    }
    let combined = toBufferBE(num, 25);
    const checksum = combined.subarray(combined.length - 4);
    const calculatedCheckSum = hash256(combined.subarray(0, combined.length - 4));
    if (calculatedCheckSum.equals(checksum)) {
        throw Error('Invalid checksum');
    }

    return combined.subarray(1, combined.length - 4);
}

function toBigInt(buffer: Buffer, endian = 'be'): bigint {
    let total = 0n;
    for (
        let i = endian === 'le' ? buffer.byteLength - 1 : 0;
        endian === 'le' ? i >= 0 : i < buffer.byteLength;
        endian === 'le' ? i-- : i++
    ) {
        total = total * 2n ** 8n + BigInt(buffer[i]);
    }
    return total;
}

export function toBigIntLE(buffer: Buffer): bigint {
    return toBigInt(buffer, 'le');
}

export function toBigIntBE(buffer: Buffer): bigint {
    return toBigInt(buffer, 'be');
}

function toBuffer(num: bigint, endian = 'be', byteLength: number): Buffer {
    let length = byteLength || bigintBytes(num);
    if (length === 0) {
        return Buffer.alloc(0);
    }

    const bits = [];
    while (num > 0) {
        const remainder = num % 2n;
        bits.push(remainder);
        num = num / 2n;
    }

    let counter = 0;
    let total = 0;
    const buffer = Buffer.alloc(length, 0x0);

    const writeByte = (byte: number) => {
        if (endian === 'be') {
            buffer[length - 1] = byte;
        } else {
            buffer[buffer.byteLength - length] = byte;
        }
    };

    for (const bit of bits) {
        if (counter % 8 === 0 && counter > 0) {
            writeByte(total);
            total = 0;
            counter = 0;
            length--;
        }

        if (bit) {
            total += Math.pow(2, counter);
        }
        counter++;
    }
    writeByte(total);

    return buffer;
}

export function toBufferLE(num: bigint, byteLength: number) {
    return toBuffer(num, 'le', byteLength);
}

export function toBufferBE(num: bigint, byteLength: number) {
    return toBuffer(num, 'be', byteLength);
}

function bigintBytes(num: bigint): number {
    let bytes = 0;
    while (num > 0) {
        bytes++;
        num = num >> 8n;
    }
    return bytes;
}

function reverseBuffer(buffer: Buffer): Buffer {
    const reversed = Buffer.alloc(buffer.byteLength);
    for (const [i, byte] of buffer.entries()) {
        reversed[buffer.byteLength - i - 1] = byte;
    }
    return reversed;
}

export function readVarint(buffer: SmartBuffer) {
    const i = buffer.readUInt8();
    if (i === 0xfd) {
        return toBigIntLE(buffer.readBuffer(2));
    } else if (i === 0xfe) {
        return toBigIntLE(buffer.readBuffer(4));
    } else if (i === 0xff) {
        return toBigIntLE(buffer.readBuffer(8));
    } else {
        return BigInt(i);
    }
}

export function encodeVarint(num: number) {
    if (num < 0xfd) {
        // i < 253, encode as single byte
        return Buffer.from([num]);
    } else if (num < 0x10000) {
        // 253 < i < 2^16 - 1, start with 253 byte (fd), encode as 2 bytes (le)
        const buffer = Buffer.alloc(3, 0xfd);
        buffer.writeUInt16LE(num, 1);
        return buffer;
    } else if (num < 0x100000000) {
        // 2^16 < i < 2^32 - 1, start with 254 byte (fe), encode as 4 bytes (le)
        const buffer = Buffer.alloc(5, 0xfe);
        buffer.writeUInt32LE(num, 1);
        return buffer;
    } else if (num < 0x10000000000000000) {
        // 2^32 < i < 2^64 - 1, start with 255 byte (ff), encode as 8 bytes (le)
        return Buffer.concat([Buffer.from('ff', 'hex'), u64ToEndian(num, 'le')]);
    } else {
        throw new Error('number too large');
    }
}

function u64ToEndian(num: number, endian = 'be') {
    return endian === 'be'
        ? toBufferBE(BigInt(num), 8)
        : toBufferLE(BigInt(num), 8);
}
