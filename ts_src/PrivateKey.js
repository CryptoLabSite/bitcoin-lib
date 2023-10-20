"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivateKey = void 0;
const crypto_1 = __importDefault(require("crypto"));
const S256Point_1 = require("./S256Point");
const Signature_1 = require("./Signature");
const helper_1 = require("./helper");
class PrivateKey {
    constructor(secret) {
        this.secret = secret;
        this.secret = secret;
        this.point = S256Point_1.G.scalarMul(secret);
    }
    hex() {
        return this.secret.toString(16).padStart(64, '0');
    }
    sign(z) {
        //        we need a random number k
        const k = this.deterministicK(z);
        //        r is the x coordinate of the resulting point k*G
        const r = S256Point_1.G.scalarMul(k).x.num;
        //        remember 1/k = pow(k, -1, N)
        const kInv = (0, helper_1.pow)(k, S256Point_1.N - 2n, S256Point_1.N);
        let s = ((z + r * this.secret) * kInv) % S256Point_1.N;
        if (s > S256Point_1.N / 2n) {
            s = S256Point_1.N - s;
        }
        return new Signature_1.Signature(r, s);
    }
    deterministicK(z) {
        // reference:
        //   - https://tools.ietf.org/html/rfc6979#section-3.2
        //   - https://github.com/jimmysong/programmingbitcoin/blob/master/code-ch13/ecc.py#L611
        let k = Buffer.alloc(32, 0x00);
        let v = Buffer.alloc(32, 0x01);
        if (z > S256Point_1.N) {
            z -= S256Point_1.N;
        }
        const zBytes = (0, helper_1.toBufferBE)(z, 32);
        const secretBytes = (0, helper_1.toBufferBE)(this.secret, 32);
        k = crypto_1.default
            .createHmac('sha256', k)
            .update(Buffer.concat([v, Buffer.from([0]), secretBytes, zBytes]))
            .digest();
        v = crypto_1.default.createHmac('sha256', k).update(v).digest();
        k = crypto_1.default
            .createHmac('sha256', k)
            .update(Buffer.concat([v, Buffer.from([1]), secretBytes, zBytes]))
            .digest();
        v = crypto_1.default.createHmac('sha256', k).update(v).digest();
        while (true) {
            v = crypto_1.default.createHmac('sha256', k).update(v).digest();
            const candidate = (0, helper_1.toBigIntBE)(v);
            if (candidate >= 1n && candidate < S256Point_1.N) {
                return candidate;
            }
            k = crypto_1.default
                .createHmac('sha256', k)
                .update(Buffer.concat([v, Buffer.from([0])]))
                .digest();
            v = crypto_1.default.createHmac('sha256', k).update(v).digest();
        }
    }
    wif(compressed = true, testnet = false) {
        const secretBytes = (0, helper_1.toBufferBE)(this.secret, 32);
        let prefix, suffix;
        if (testnet) {
            prefix = Buffer.from([0xef]);
        }
        else {
            prefix = Buffer.from([0x80]);
        }
        if (compressed) {
            suffix = Buffer.from([0x01]);
        }
        else {
            suffix = Buffer.alloc(0);
        }
        const wifBytes = Buffer.concat([prefix, secretBytes, suffix]);
        return (0, helper_1.encodeBase58Checksum)(wifBytes);
    }
}
exports.PrivateKey = PrivateKey;
