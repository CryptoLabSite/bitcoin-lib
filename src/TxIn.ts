import { Script } from './Script';
import { reverseBuffer } from './helper';
import { SmartBuffer } from 'smart-buffer';
import { TxFetcher } from './TxFetcher';
import { Tx } from './Tx';

export class TxIn {
  constructor(
    public prevTx: Buffer,
    public prevIndex: number,
    public scriptSig: Script = new Script(),
    public sequence: number = 0xffffffff,
    public witness: Buffer[] = [],
  ) {}

  toString(): string {
    return `${this.prevTx.toString('hex')}:${this.prevIndex}`;
  }

  static parse(s: SmartBuffer): TxIn {
    const prevTx = reverseBuffer(s.readBuffer(32));
    const prevIndex = s.readUInt32LE();
    const scriptSig = Script.parse(s);
    const sequence = s.readUInt32LE();
    return new TxIn(prevTx, prevIndex, scriptSig, sequence);
  }

  serialize(): Buffer {
    const s = new SmartBuffer();
    // prevTx is little endian, so we need to reverse it
    s.writeBuffer(reverseBuffer(this.prevTx));
    s.writeUInt32LE(this.prevIndex);
    s.writeBuffer(this.scriptSig.serialize());
    s.writeUInt32LE(this.sequence);
    return s.toBuffer();
  }

  async fetchTx(testnet = false): Promise<Tx> {
    return await TxFetcher.fetch(this.prevTx.toString('hex'), testnet);
  }

  async value(testnet = false): Promise<bigint> {
    const tx = await this.fetchTx(testnet);
    return tx.txOuts[this.prevIndex].amount;
  }

  async scriptPubkey(testnet = false): Promise<Script> {
    const tx = await this.fetchTx(testnet);
    return tx.txOuts[this.prevIndex].scriptPubKey;
  }
}
