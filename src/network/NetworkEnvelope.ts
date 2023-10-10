import { hash256, toBufferLE } from "../helper";

const NETWORK_MAGIC = Buffer.from('f9beb4d9', 'hex');
const TESTNET_NETWORK_MAGIC = Buffer.from('0b110907', 'hex');

export class NetworkEnvelope {
  public magic: Buffer;

  constructor(
    public command: Buffer,
    public payload: Buffer,
    testnet: boolean = false
  ) {
    this.magic = testnet ? TESTNET_NETWORK_MAGIC : NETWORK_MAGIC;
  }

  toString() {
    return `${this.command.toString('ascii')}: ${this.payload.toString('hex')}`
  }

  serialize(): Buffer {
    return Buffer.concat([
      this.magic,
      // command is 12 bytes, so we need to pad with 0s
      this.command,
      Buffer.alloc(12 - this.command.length),
      // payload length is 4 bytes in little endian
      toBufferLE(BigInt(this.payload.length), 4),
      hash256(this.payload).subarray(0, 4),
      this.payload
    ]);
  }

  static parse(message: Buffer): NetworkEnvelope {
    return new NetworkEnvelope();
  }
}