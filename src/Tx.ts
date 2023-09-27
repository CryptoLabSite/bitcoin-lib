import { TxIn } from './TxIn';
import { TxOut } from './TxOut';
import { SmartBuffer } from 'smart-buffer';
import { encodeVarint, hash256, readVarint, reverseBuffer } from './helper';
import { Script } from "./Script";

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
  sigHash(inputIndex: number, redeemScript?: Script): bigint {
    return 0n;
  }

  //   def sig_hash(self, input_index, redeem_script=None):
//         """Returns the integer representation of the hash that needs to get
//         signed for index input_index"""
//         # create the serialization per spec
//         # start with version: int_to_little_endian in 4 bytes
//         s = int_to_little_endian(self.version, 4)
//         # next, how many inputs there are: encode_varint
//         s += encode_varint(len(self.tx_ins))
//         # loop through each input: for i, tx_in in enumerate(self.tx_ins)
//         for i, tx_in in enumerate(self.tx_ins):
//             # if the input index is the one we're signing
//             if i == input_index:
//                 # if the RedeemScript was passed in, that's the ScriptSig
//                 if redeem_script:
//                     script_sig = redeem_script
//                 # otherwise the previous tx's ScriptPubkey is the ScriptSig
//                 else:
//                     script_sig = tx_in.script_pubkey(self.network)
//             # Otherwise, the ScriptSig is empty
//             else:
//                 script_sig = None
//             # create a new TxIn with the same parameters
//             #  as tx_in, but change the script_sig
//             new_tx_in = TxIn(
//                 prev_tx=tx_in.prev_tx,
//                 prev_index=tx_in.prev_index,
//                 script_sig=script_sig,
//                 sequence=tx_in.sequence,
//             )
//             # add the serialization of the new TxIn
//             s += new_tx_in.serialize()
//         # add how many outputs there are using encode_varint
//         s += encode_varint(len(self.tx_outs))
//         # add the serialization of each output
//         for tx_out in self.tx_outs:
//             s += tx_out.serialize()
//         # add the locktime using int_to_little_endian in 4 bytes
//         s += int_to_little_endian(self.locktime, 4)
//         # add SIGHASH_ALL using int_to_little_endian in 4 bytes
//         s += int_to_little_endian(SIGHASH_ALL, 4)
//         # hash256 the serialization
//         h256 = hash256(s)
//         # convert the result to an integer using int.from_bytes(x, 'big')
//         return int.from_bytes(h256, "big")
}
