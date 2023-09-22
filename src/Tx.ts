import { TxIn } from './TxIn';
import { TxOut } from './TxOut';
import { SmartBuffer } from 'smart-buffer';
import { encodeVarint, hash256, readVarint, reverseBuffer } from "./helper";

export class Tx {
  constructor(
    public version: number,
    public txIns: TxIn[],
    public txOuts: TxOut[],
    public locktime: number,
    public testnet: boolean = false,
  ) {}

  toString(): string {
    let txIns = '';
    for (const txIn of this.txIns) {
      txIns += `${txIn}\n`;
    }
    let txOuts = '';
    for (const txOut of this.txOuts) {
      txOuts += `${txOut}\n`;
    }
    return `tx: ${this.id()}\nversion: ${
      this.version
    }\ntx_ins:\n${txIns}tx_outs:\n${txOuts}locktime: ${this.locktime}`;
  }

  id(): string {
    return this.hash().toString('hex');
  }

  hash(): Buffer {
    return reverseBuffer(hash256(this.serialize()));
  }

  static parse(s: Buffer, testnet = false): Tx {
    const sb = SmartBuffer.fromBuffer(s);
    const version = s.readUInt32LE();
    const numInputs = readVarint(sb);
    const inputs = [];
    for (let i = 0; i < numInputs; i++) {
      inputs.push(TxIn.parse(sb));
    }
    const numOutputs = readVarint(sb);
    const outputs = [];
    for (let i = 0; i < numOutputs; i++) {
      outputs.push(TxOut.parse(sb));
    }
    const locktime = s.readUInt32LE();
    return new Tx(version, inputs, outputs, locktime, testnet);
  }

  serialize(): Buffer {
    const s = new SmartBuffer();
    s.writeUInt32LE(this.version);
    s.writeBuffer(encodeVarint(this.txIns.length));
    for (const txIn of this.txIns) {
      s.writeBuffer(txIn.serialize());
    }
    s.writeBuffer(encodeVarint(this.txOuts.length));
    for (const txOut of this.txOuts) {
      s.writeBuffer(txOut.serialize());
    }
    s.writeUInt32LE(this.locktime);
    return s.toBuffer();
  }

  async fee(testnet: boolean): Promise<bigint> {
    let inputSum = 0n;
    let outputSum = 0n;
    for (const txIn of this.txIns) {
      inputSum += await txIn.value(testnet);
    }
    for (const txOut of this.txOuts) {
      outputSum += txOut.amount;
    }
    return inputSum - outputSum;
  }
}
