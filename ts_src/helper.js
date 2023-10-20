"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomBigInt = exports.encodeVarint = exports.readVarint = exports.reverseBuffer = exports.toBufferBE = exports.toBufferLE = exports.toBigIntBE = exports.toBigIntLE = exports.decodeBase58 = exports.encodeBase58Checksum = exports.encodeBase58 = exports.hash256 = exports.hash160 = exports.mod = exports.pow = void 0;
const crypto = __importStar(require("crypto"));
function pow(base, exponent, modulus) {
    if (modulus === 1n)
        return 0n;
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
exports.pow = pow;
// bigint mod that produces a positive value
function mod(n, m) {
    return ((n % m) + m) % m;
}
exports.mod = mod;
function _sha256() {
    return crypto.createHash('sha256');
}
function _ripemd160() {
    return crypto.createHash('ripemd160');
}
function hash160(data) {
    const sha256Result = _sha256().update(data).digest();
    return _ripemd160().update(sha256Result).digest();
}
exports.hash160 = hash160;
function hash256(data) {
    const sha256Result = _sha256().update(data).digest();
    return _sha256().update(sha256Result).digest();
}
exports.hash256 = hash256;
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function encodeBase58(data) {
    let zeroCount = 0;
    for (const b of data) {
        if (b === 0) {
            zeroCount += 1;
        }
        else {
            break;
        }
    }
    let num = toBigIntBE(data);
    let result = '';
    const prefix = '1'.repeat(zeroCount);
    while (num > 0n) {
        const mod = num % 58n;
        num = num / 58n;
        result = BASE58_ALPHABET[Number(mod)] + result;
    }
    return prefix + result;
}
exports.encodeBase58 = encodeBase58;
function encodeBase58Checksum(data) {
    const checkSum = hash256(data).subarray(0, 4);
    return encodeBase58(Buffer.concat([data, checkSum]));
}
exports.encodeBase58Checksum = encodeBase58Checksum;
function decodeBase58(data) {
    let num = 0n;
    for (const b of data) {
        num *= 58n;
        num += BigInt(BASE58_ALPHABET.indexOf(b));
    }
    const combined = toBufferBE(num, 25);
    const checksum = combined.subarray(combined.length - 4);
    const calculatedCheckSum = hash256(combined.subarray(0, combined.length - 4));
    if (calculatedCheckSum.equals(checksum)) {
        throw Error('Invalid checksum');
    }
    return combined.subarray(1, combined.length - 4);
}
exports.decodeBase58 = decodeBase58;
function toBigInt(buffer, endian = 'be') {
    let total = 0n;
    for (let i = endian === 'le' ? buffer.byteLength - 1 : 0; endian === 'le' ? i >= 0 : i < buffer.byteLength; endian === 'le' ? i-- : i++) {
        total = total * 2n ** 8n + BigInt(buffer[i]);
    }
    return total;
}
function toBigIntLE(buffer) {
    return toBigInt(buffer, 'le');
}
exports.toBigIntLE = toBigIntLE;
function toBigIntBE(buffer) {
    return toBigInt(buffer, 'be');
}
exports.toBigIntBE = toBigIntBE;
function toBuffer(num, endian = 'be', byteLength) {
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
    const writeByte = (byte) => {
        if (endian === 'be') {
            buffer[length - 1] = byte;
        }
        else {
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
function toBufferLE(num, byteLength) {
    return toBuffer(num, 'le', byteLength);
}
exports.toBufferLE = toBufferLE;
function toBufferBE(num, byteLength) {
    return toBuffer(num, 'be', byteLength);
}
exports.toBufferBE = toBufferBE;
function bigintBytes(num) {
    let bytes = 0;
    while (num > 0) {
        bytes++;
        num = num >> 8n;
    }
    return bytes;
}
function reverseBuffer(buffer) {
    const reversed = Buffer.alloc(buffer.byteLength);
    for (const [i, byte] of buffer.entries()) {
        reversed[buffer.byteLength - i - 1] = byte;
    }
    return reversed;
}
exports.reverseBuffer = reverseBuffer;
function readVarint(buffer) {
    const i = buffer.readUInt8();
    if (i === 0xfd) {
        return toBigIntLE(buffer.readBuffer(2));
    }
    else if (i === 0xfe) {
        return toBigIntLE(buffer.readBuffer(4));
    }
    else if (i === 0xff) {
        return toBigIntLE(buffer.readBuffer(8));
    }
    else {
        return BigInt(i);
    }
}
exports.readVarint = readVarint;
function encodeVarint(num) {
    if (num < 0xfd) {
        // i < 253, encode as single byte
        return Buffer.from([num]);
    }
    else if (num < 0x10000) {
        // 253 < i < 2^16 - 1, start with 253 byte (fd), encode as 2 bytes (le)
        const buffer = Buffer.alloc(3, 0xfd);
        buffer.writeUInt16LE(num, 1);
        return buffer;
    }
    else if (num < 0x100000000) {
        // 2^16 < i < 2^32 - 1, start with 254 byte (fe), encode as 4 bytes (le)
        const buffer = Buffer.alloc(5, 0xfe);
        buffer.writeUInt32LE(num, 1);
        return buffer;
    }
    else if (num < 0x10000000000000000) {
        // 2^32 < i < 2^64 - 1, start with 255 byte (ff), encode as 8 bytes (le)
        return Buffer.concat([Buffer.from('ff', 'hex'), u64ToEndian(num, 'le')]);
    }
    else {
        throw new Error('number too large');
    }
}
exports.encodeVarint = encodeVarint;
function u64ToEndian(num, endian = 'be') {
    return endian === 'be'
        ? toBufferBE(BigInt(num), 8)
        : toBufferLE(BigInt(num), 8);
}
function randomBigInt(max) {
    const buf = Buffer.alloc(32);
    for (let i = 31; i >= 0; i--) {
        let randomByte = 0;
        for (let j = 0; j < 8; j++) {
            const randomBit = Math.round(Math.random());
            randomByte |= randomBit << j;
        }
        buf.fill(Buffer.alloc(1, randomByte), i, i + 1);
        if (toBigIntBE(buf) >= max) {
            buf.fill(Buffer.alloc(1, 0x0), i, i + 1);
            return toBigIntBE(buf);
        }
    }
    return toBigIntBE(buf);
}
exports.randomBigInt = randomBigInt;
