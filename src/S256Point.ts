import { FinitePoint } from './FinitePoint';
import { P, S256Field } from './S256Field';
import {
  encodeBase58Checksum,
  hash160,
  mod,
  pow,
  toBufferBE,
  toBufferLE,
} from './helper';
import { Signature } from './Signature';

const A = 0n;
const B = 7n;
export const N =
  0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;

export class S256Point extends FinitePoint {
  constructor(x: bigint | undefined, y: bigint | undefined) {
    super(
      x === undefined ? x : new S256Field(x),
      y === undefined ? y : new S256Field(y),
      new S256Field(A),
      new S256Field(B),
    );
  }

  toString(): string {
    if (this.isInfinity()) {
      return 'S256Point(infinity)';
    } else {
      return `S256Point(${this.x!.num}, ${this.y!.num})`;
    }
  }

  scalarMul(coefficient: bigint): S256Point {
    const coef = mod(coefficient, N);
    const finitePoint = super.scalarMul(coef);
    const x = finitePoint.x ? finitePoint.x.num : undefined;
    const y = finitePoint.y ? finitePoint.y.num : undefined;
    return new S256Point(x, y);
  }

  address(compressed: boolean = true, testnet: boolean = false): string {
    const sec = this.sec(compressed);
    const secHash160 = hash160(sec);

    let prefix: Buffer;
    if (testnet) {
      prefix = Buffer.alloc(1, 0x6f);
    } else {
      prefix = Buffer.alloc(1, 0x00);
    }

    return encodeBase58Checksum(Buffer.concat([prefix, secHash160]));
  }

  verify(z: bigint, sig: Signature): boolean {
    //        remember sig.r and sig.s are the main things we're checking
    //        remember 1/s = pow(s, -1, N)
    const sInv = pow(sig.s, N - 2n, N);
    //        u = z / s
    const u = (z * sInv) % N;
    //        v = r / s
    const v = (sig.r * sInv) % N;
    //        u*G + v*P should have as the x coordinate, r
    const total = G.scalarMul(u).add(this.scalarMul(v));
    return total.x!.num === sig.r;
  }

  sec(compressed: boolean = true): Buffer {
    if (compressed) {
      if (this.y!.num % 2n === 0n) {
        return Buffer.concat([
          Buffer.alloc(1, 0x02),
          toBufferBE(this.x!.num, 32),
        ]);
      } else {
        return Buffer.concat([
          Buffer.alloc(1, 0x03),
          toBufferBE(this.x!.num, 32),
        ]);
      }
    } else {
      return Buffer.concat([
        Buffer.alloc(1, 0x04),
        toBufferBE(this.x!.num, 32),
        toBufferBE(this.y!.num, 32),
      ]);
    }
  }

  static parse(sec: Buffer): S256Point {
    // compressed
    if (sec[0] === 4) {
      const xBuffer = sec.subarray(1, 33);
      const x = BigInt('0x' + xBuffer.toString('hex'));

      const yBuffer = sec.subarray(33);
      const y = BigInt('0x' + yBuffer.toString('hex'));

      return new S256Point(x, y);
    }

    const isEven = sec[0] === 2;
    const xBuffer = sec.subarray(1, 33);
    const x = BigInt('0x' + xBuffer.toString('hex'));
    const xField = new S256Field(x);
    // right side of the equation y^2 = x^3 + 7
    const alpha = new S256Field(xField.pow(3n).add(new S256Field(B)).num);
    // solve for left side
    const beta = alpha.sqrt();

    let even_beta: S256Field;
    let odd_beta: S256Field;
    if (beta.num % 2n === 0n) {
      even_beta = beta;
      odd_beta = new S256Field(P - beta.num);
    } else {
      even_beta = new S256Field(P - beta.num);
      odd_beta = beta;
    }

    if (isEven) {
      return new S256Point(xField.num, even_beta.num);
    } else {
      return new S256Point(xField.num, odd_beta.num);
    }
  }
}

export const G = new S256Point(
  0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
  0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n,
);
