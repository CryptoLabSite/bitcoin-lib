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
import { Element, Script } from "./Script";
import { PrivateKey, taggedHash } from "./PrivateKey";

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

  async sigHashBIP143(
    inputIndex: number,
    redeemScript?: Script,
    witnessScript?: Script
  ): Promise<bigint> {
    const txIn = this.txIns[inputIndex];
    const s = new SmartBuffer();
    s.writeUInt32LE(this.version);
    s.writeBuffer(this.hashPrevouts());
    s.writeBuffer(this.hashSequence());
    s.writeBuffer(reverseBuffer(txIn.prevTx));
    s.writeUInt32LE(txIn.prevIndex);
    let scriptCode: Buffer;
    if (witnessScript) {
      scriptCode = witnessScript.serialize();
    } else if (redeemScript) {
      scriptCode = p2pkhScript(
        (redeemScript.cmds[1] as PushDataOpcode).data
      ).serialize();
    } else {
      const scriptPubkey = await txIn.scriptPubkey(this.testnet);
      scriptCode = p2pkhScript(
        (scriptPubkey.cmds[1] as PushDataOpcode).data
      ).serialize();
    }
    s.writeBuffer(scriptCode);
    s.writeBuffer(toBufferLE(await txIn.value(), 8));
    s.writeUInt32LE(txIn.sequence);
    s.writeBuffer(this.hashOutputs());
    s.writeUInt32LE(this.locktime);
    s.writeUInt32LE(SIGHASH_ALL);
    return toBigIntBE(hash256(s.toBuffer()));
  };

  async sigHashSchnorr (inputIndex: number): Promise<bigint> {
    const sigMsg = await this.sigMsg(inputIndex)
    return toBigIntBE(taggedHash("TapSighash", sigMsg));
  }

  async sigMsg(inputIndex: number): Promise<Buffer> {
    const s = new SmartBuffer();
    s.writeUInt8(0) // EPOCH always 0
    s.writeUInt8(0); // SIGHASH_ALL
    s.writeUInt32LE(this.version);
    s.writeUInt32LE(this.locktime);
    s.writeBuffer(this.hashPrevouts(false));
    s.writeBuffer(await this.hashAmounts(false));
    s.writeBuffer(await this.hashScriptPubkeys(false));
    s.writeBuffer(this.hashSequence(false));
    s.writeBuffer(this.hashOutputs(false)); // Assume SIGHASH_ALL
    s.writeUInt8(0); // spend type = taproot(0) + no annex(0) = 0
    s.writeUInt32LE(inputIndex);
    return s.toBuffer()
  }

  hashPrevouts = (double: boolean = true): Buffer => {
    if (!this._hashPrevouts) {
      const allPrevouts = new SmartBuffer();
      const allSequence = new SmartBuffer();
      for (const txIn of this.txIns) {
        allPrevouts.writeBuffer(reverseBuffer(txIn.prevTx));
        allPrevouts.writeUInt32LE(txIn.prevIndex);
        allSequence.writeUInt32LE(txIn.sequence);
      }
      this._hashPrevouts = sha256(allPrevouts.toBuffer());
      this._hashSequence = sha256(allSequence.toBuffer());
    }
    if (double) {
      return sha256(this._hashPrevouts);
    } else {
      return this._hashPrevouts;
    }
  };

  hashSequence = (double: boolean = true): Buffer => {
    if (!this._hashSequence) {
      this.hashPrevouts(); // will also calculate hashSequence
    }
    if (double) {
      return sha256(this._hashSequence!);
    } else {
      return this._hashSequence!;
    }
  };

  hashOutputs = (double: boolean = true): Buffer => {
    if (!this._hashOutputs) {
      const allOutputs = new SmartBuffer();
      for (const txOut of this.txOuts) {
        allOutputs.writeBuffer(txOut.serialize());
      }
      this._hashOutputs = sha256(allOutputs.toBuffer());
    }
    if (double) {
      return sha256(this._hashOutputs);
    } else {
      return this._hashOutputs;
    }
  };

  hashAmounts = async (double: boolean = true): Promise<Buffer> => {
    if (!this._hashAmounts) {
      const allAmounts = new SmartBuffer();
      for (const [index, txIn] of this.txIns.entries()) {
        let amount
        if (this._previousOutputs) {
          amount = this._previousOutputs[index].amount;
        } else {
          amount = await txIn.value(this.testnet);
        }
        allAmounts.writeBuffer(toBufferLE(amount, 8));
      }
      this._hashAmounts = sha256(allAmounts.toBuffer());
    }
    if (double) {
      return sha256(this._hashAmounts);
    } else {
      return this._hashAmounts;
    }
  }

  async hashScriptPubkeys(double: boolean = true): Promise<Buffer> {
    if (!this._hashScriptPubkeys) {
      const allScriptPubkeys = new SmartBuffer();
      for (const [index, txIn] of this.txIns.entries()) {
        let scriptPubkey;
        if (this._previousOutputs) {
          scriptPubkey = this._previousOutputs[index].scriptPubkey;
        } else {
          scriptPubkey = await txIn.scriptPubkey(this.testnet);
        }
        allScriptPubkeys.writeBuffer(scriptPubkey.serialize());
      }
      this._hashScriptPubkeys = sha256(allScriptPubkeys.toBuffer());
    }
    if (double) {
      return sha256(this._hashScriptPubkeys);
    } else {
      return this._hashScriptPubkeys;
    }
  }

  // verify if the scriptSig can unlock the scriptPubkey
  async verifyInput(inputIndex: number): Promise<boolean> {
    const txIn = this.txIns[inputIndex];
    const scriptPubkey = await txIn.scriptPubkey(this.testnet);
    let redeemScript: Script | undefined;
    let z: bigint;
    let witness: Buffer[] | undefined;
    if (scriptPubkey.isP2SHScriptPubkey()) {
      // the last cmd has to be the RedeemScript to trigger
      const cmd = (txIn.scriptSig.cmds[txIn.scriptSig.cmds.length - 1] as Element).data;
      // parse the RedeemScript
      const rawRedeem = Buffer.concat([encodeVarint(cmd.byteLength), cmd]);
      redeemScript = Script.parse(SmartBuffer.fromBuffer(rawRedeem));

      // the RedeemScript might be p2wpkh or p2wsh
      if (redeemScript.isP2WPKHScriptPubkey()) {
        z = await this.sigHashBIP143(inputIndex, redeemScript);
        witness = txIn.witness;
      } else if (redeemScript.isP2WSHScriptPubkey()) {
        const cmd = txIn.witness[txIn.witness.length - 1];
        const rawWitness = Buffer.concat([encodeVarint(cmd.byteLength), cmd]);
        const witnessScript = Script.parse(SmartBuffer.fromBuffer(rawWitness));
        z = await this.sigHashBIP143(inputIndex, witnessScript);
        witness = txIn.witness;
      } else {
        z = await this.sigHash(inputIndex, redeemScript);
      }
    } else {
      if (scriptPubkey.isP2WPKHScriptPubkey()) {
        z = await this.sigHashBIP143(inputIndex);
        witness = txIn.witness;
      } else if (scriptPubkey.isP2WSHScriptPubkey()) {
        const cmd = txIn.witness[txIn.witness.length - 1];
        const rawWitness = Buffer.concat([encodeVarint(cmd.byteLength), cmd]);
        const witnessScript = Script.parse(SmartBuffer.fromBuffer(rawWitness));
        z = await this.sigHashBIP143(inputIndex, witnessScript);
        witness = txIn.witness;
      } else if (scriptPubkey.isP2TaprootScriptPubkey()) {
        z = await this.sigHashSchnorr(inputIndex);
        witness = txIn.witness;
      } else {
        z = await this.sigHash(inputIndex);
      }
    }

    const combine = txIn.scriptSig.add(scriptPubkey);
    return combine.evaluate(z, witness || []);
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
