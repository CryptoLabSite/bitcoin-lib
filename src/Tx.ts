import { TxIn } from './TxIn';
import { TxOut } from './TxOut';
import { SmartBuffer } from 'smart-buffer';
import {
  encodeVarint,
  hash256,
  readVarint,
  reverseBuffer,
  SIGHASH_ALL,
  toBigIntBE,
} from './helper';
import { Script } from './Script';
import { PrivateKey } from './PrivateKey';

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

  // hash of the modified tx that needs to get signed
  // 1. replace the ScriptSig of the input we're signing with the ScriptPubkey of the corresponding output
  // 2. append hash type as 4 bytes little endian to the end of the modified tx serialization
  // 3. hash256 the result as the return value
  async sigHash(inputIndex: number, redeemScript?: Script): Promise<bigint> {
    const s = new SmartBuffer();
    s.writeUInt32LE(this.version);
    s.writeBuffer(encodeVarint(this.txIns.length));

    for (const [i, txIn] of this.txIns.entries()) {
      let scriptSig = undefined;
      if (i === inputIndex) {
        scriptSig = redeemScript || (await txIn.scriptPubkey(this.testnet));
      }
      s.writeBuffer(
        new TxIn(
          txIn.prevTx,
          txIn.prevIndex,
          scriptSig,
          txIn.sequence,
        ).serialize(),
      );
    }

    s.writeBuffer(encodeVarint(this.txOuts.length));
    for (const txOut of this.txOuts) {
      s.writeBuffer(txOut.serialize());
    }
    s.writeUInt32LE(this.locktime);
    s.writeUInt32LE(SIGHASH_ALL);
    const h256 = hash256(s.toBuffer());
    return toBigIntBE(h256);
  }

  // verify if the scriptSig can unlock the scriptPubkey
  async verifyInput(inputIndex: number): Promise<boolean> {
    const txIn = this.txIns[inputIndex];
    const scriptPubkey = await txIn.scriptPubkey(this.testnet);
    let redeemScript: Script | undefined;
    let z: bigint;
    if (scriptPubkey.isP2SHScriptPubkey()) {
    } else {
      if (scriptPubkey.isP2WPKHScriptPubkey()) {
      } else if (scriptPubkey.isP2WSHScriptPubkey()) {
      } else if (scriptPubkey.isP2TaprootScriptPubkey()) {

      } else {
        z = await this.sigHash(inputIndex);
      }
    }

    const combine = txIn.scriptSig.add(scriptPubkey);
    return combine.evaluate(z, []);
  }

  async verify(): Promise<boolean> {
    if ((await this.fee(this.testnet)) < 0n) {
      return false;
    }

    for (let i = 0; i < this.txIns.length; i++) {
      if (!(await this.verifyInput(i))) {
        return false;
      }
    }

    return true;
  }

  async signInput(
    inputIndex: number,
    privateKey: PrivateKey,
  ): Promise<boolean> {
    const z = await this.sigHash(inputIndex);
    const der = privateKey.sign(z).der();
    const sig = Buffer.concat([der, Buffer.alloc(1, SIGHASH_ALL)]);
    const sec = privateKey.point.sec();
    this.txIns[inputIndex].scriptSig = new Script([
      { data: sig, dataLength: sig.length },
      { data: sec, dataLength: sec.length },
    ]);

    return this.verifyInput(inputIndex);
  }
}
