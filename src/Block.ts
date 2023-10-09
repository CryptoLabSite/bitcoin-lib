import { bitsToTarget, hash256, reverseBuffer, toBigIntLE } from './helper';

export class Block {
  constructor(
    public version: number,
    public prevBlock: Buffer,
    public merkleRoot: Buffer,
    public timestamp: number,
    public bits: Buffer,
    public nonce: Buffer,
  ) {}

  serialize(headerOnly: boolean): Buffer {
    // todo
    return Buffer.alloc(0);
  }

  hash(): Buffer {
    return reverseBuffer(hash256(this.serialize(true)));
  }

  bip9(): boolean {
    return this.version >> 29 === 0x001;
  }

  bip91(): boolean {
    return ((this.version >> 4) & 1) === 1;
  }

  bip141(): boolean {
    return ((this.version >> 1) & 1) === 1;
  }

  target(): bigint {
    return bitsToTarget(this.bits);
  }

  difficulty(): bigint {
    const target = this.target();
    return (0xffffn * 256n ** (0x1dn - 3n)) / target;
  }

  checkPow(): boolean {
    const proof = toBigIntLE(hash256(this.serialize(true)));
    return proof < this.target();
  }

  static parse(): Block {
    // todo
    return new Block(
      0,
      Buffer.alloc(32),
      Buffer.alloc(32),
      0,
      Buffer.alloc(4),
      Buffer.alloc(4),
    );
  }
}
