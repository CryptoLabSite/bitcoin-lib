import crypto from 'crypto';
import { G, N, S256Point } from './S256Point';
import { Signature } from './Signature';
import { encodeBase58Checksum, pow, toBigIntBE, toBufferBE } from './helper';

export class PrivateKey {
  public point: S256Point;

  constructor(public secret: bigint) {
    this.secret = secret;
    this.point = G.scalarMul(secret);
  }

  hex(): string {
    return this.secret.toString(16).padStart(64, '0');
  }

  sign(z: bigint): Signature {
    //        we need a random number k
    const k = this.deterministicK(z);
    //        r is the x coordinate of the resulting point k*G
    const r = G.scalarMul(k).x!.num;
    //        remember 1/k = pow(k, -1, N)
    const kInv = pow(k, N - 2n, N);
    let s = ((z + r * this.secret) * kInv) % N;
    if (s > N / 2n) {
      s = N - s;
    }
    return new Signature(r, s);
  }

  deterministicK(z: bigint): bigint {
    // reference:
    //   - https://tools.ietf.org/html/rfc6979#section-3.2
    //   - https://github.com/jimmysong/programmingbitcoin/blob/master/code-ch13/ecc.py#L611
    let k = Buffer.alloc(32, 0x00);
    let v = Buffer.alloc(32, 0x01);
    if (z > N) {
      z -= N;
    }

    const zBytes = toBufferBE(z, 32);
    const secretBytes = toBufferBE(this.secret, 32);

    k = crypto
      .createHmac('sha256', k)
      .update(Buffer.concat([v, Buffer.from([0]), secretBytes, zBytes]))
      .digest();
    v = crypto.createHmac('sha256', k).update(v).digest();
    k = crypto
      .createHmac('sha256', k)
      .update(Buffer.concat([v, Buffer.from([1]), secretBytes, zBytes]))
      .digest();
    v = crypto.createHmac('sha256', k).update(v).digest();

    while (true) {
      v = crypto.createHmac('sha256', k).update(v).digest();
      const candidate = toBigIntBE(v);
      if (candidate >= 1n && candidate < N) {
        return candidate;
      }
      k = crypto
        .createHmac('sha256', k)
        .update(Buffer.concat([v, Buffer.from([0])]))
        .digest();
      v = crypto.createHmac('sha256', k).update(v).digest();
    }
  }

  wif(compressed: boolean = true, testnet: boolean = false): string {
    const secretBytes = toBufferBE(this.secret, 32);

    let prefix, suffix;
    if (testnet) {
      prefix = Buffer.from([0xef]);
    } else {
      prefix = Buffer.from([0x80]);
    }

    if (compressed) {
      suffix = Buffer.from([0x01]);
    } else {
      suffix = Buffer.alloc(0);
    }

    const wifBytes = Buffer.concat([prefix, secretBytes, suffix]);
    return encodeBase58Checksum(wifBytes);
  }
}
