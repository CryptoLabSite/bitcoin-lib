import * as crypto from "crypto";

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

function toBigInt(buffer, endian = "be") {
    let total = 0n;
    for (
        let i = endian === "le" ? buffer.byteLength - 1 : 0;
        endian === "le" ? i >= 0 : i < buffer.byteLength;
        endian === "le" ? i-- : i++
    ) {
        total = total * 2n ** 8n + BigInt(buffer[i]);
    }
    return total;
}

function toBigIntLE(buffer) {
    return toBigInt(buffer, "le");
}

function toBigIntBE(buffer) {
    return toBigInt(buffer, "be");
}


