import { toBigIntLE, toBufferLE } from './helper';
import { Script } from './Script';
import { SmartBuffer } from 'smart-buffer';

export class TxOut {
  constructor(public amount: bigint, public scriptPubKey: Script) {}

  static parse(s: SmartBuffer): TxOut {
    const amount = toBigIntLE(s.readBuffer(8));
    const scriptPubkey = Script.parse(s);
    return new TxOut(amount, scriptPubkey);
  }

  toString(): string {
    return `${this.amount}:${this.scriptPubKey}`;
  }

  serialize(): Buffer {
    const amount = toBufferLE(this.amount, 8);
    const scriptPubKey = this.scriptPubKey.serialize();
    return Buffer.concat([amount, scriptPubKey]);
  }
}
