import { OP_CODE_FUNCTIONS, OP_CODE_NAMES, OpCode, Stack } from './Op';
import { SmartBuffer } from 'smart-buffer';
import { encodeVarint, readVarint, toBufferLE } from './helper';

type Element = {
  data: Buffer;
  dataLength: number;
};

type Cmd = OpCode | Element;

export class Script {
  constructor(public cmds: Cmd[] = []) {}

  toString() {
    const result = [];
    for (const cmd of this.cmds) {
      if (typeof cmd === 'number') {
        let name: string;
        if (OP_CODE_NAMES[cmd]) {
          name = OP_CODE_NAMES[cmd];
        } else {
          name = `OP_[${cmd}]`;
        }
        result.push(name);
      } else {
        result.push(cmd.data.toString('hex'));
      }
    }

    return result.join(' ');
  }

  add(other: Script): Script {
    return new Script([...this.cmds, ...other.cmds]);
  }

  // reference: https://github.com/jimmysong/pb-exercises/blob/master/session6/script.py#L135
  evaluate(z: bigint): boolean {
    const cmds = [...this.cmds];
    const stack: Stack = [];
    const altStack: Stack = [];
    while (cmds.length > 0) {
      const cmd = cmds.shift()!;
      if (typeof cmd === 'number') {
        const operation = OP_CODE_FUNCTIONS[cmd];
        switch (cmd) {
          case OpCode.OP_IF:
          case OpCode.OP_NOTIF:
            if (!operation(stack, cmds)) {
              console.error(`bad op: ${OP_CODE_NAMES[cmd]}`);
              return false;
            }
            break;
          case OpCode.OP_TOALTSTACK:
          case OpCode.OP_FROMALTSTACK:
            if (!operation(stack, altStack)) {
              console.error(`bad op: ${OP_CODE_NAMES[cmd]}`);
              return false;
            }
            break;
          case OpCode.OP_CHECKSIG:
          case OpCode.OP_CHECKSIGVERIFY:
          case OpCode.OP_CHECKMULTISIG:
          case OpCode.OP_CHECKMULTISIGVERIFY:
            if (!operation(stack, z)) {
              console.error(`bad op: ${OP_CODE_NAMES[cmd]}`);
              return false;
            }
            break;
          default:
            if (!operation || !operation(stack)) {
              console.error(`bad op: ${OP_CODE_NAMES[cmd]}`);
              return false;
            }
            break;
        }
      } else {
        stack.push(cmd.data);
      }
    }

    if (stack.length === 0) {
      return false;
    }

    return !Buffer.alloc(0).equals(stack.pop()!);
  }

  static parse(s: SmartBuffer): Script {
    const length = readVarint(s);
    const cmds: Cmd[] = [];
    let count = 0;
    while (count < length) {
      const current = s.readBuffer(1);
      count++;
      const currentByte = current[0];
      if (currentByte > OpCode.OP_0 && currentByte < OpCode.OP_PUSHDATA1) {
        const n = currentByte;
        const data = s.readBuffer(n);
        cmds.push({ data, dataLength: n });
        count += n;
      } else if (currentByte === OpCode.OP_PUSHDATA1) {
        const dataLength = s.readUInt8();
        const data = s.readBuffer(dataLength);
        cmds.push({ data, dataLength });
        count += 1 + dataLength;
      } else if (currentByte === OpCode.OP_PUSHDATA2) {
        const dataLength = s.readUInt16LE();
        const data = s.readBuffer(dataLength);
        cmds.push({ data, dataLength });
        count += 2 + dataLength;
      } else {
        const opCode = currentByte;
        cmds.push(opCode);
      }
    }

    if (count !== Number(length)) {
      throw new Error('parsing script failed');
    }

    return new Script(cmds);
  }

  rawSerialize(): Buffer {
    const s = new SmartBuffer();
    for (const cmd of this.cmds) {
      if (typeof cmd === 'number') {
        s.writeUInt8(cmd);
      } else {
        if (cmd.dataLength > 0 && cmd.dataLength <= 75) {
          // little endian, 1 byte, so no need to reverse
          s.writeBuffer(
            Buffer.concat([Buffer.alloc(1, cmd.dataLength), cmd.data]),
          );
        } else if (cmd.dataLength > 75 && cmd.dataLength < 0x100) {
          s.writeBuffer(
            Buffer.concat([
              Buffer.alloc(1, 76),
              Buffer.alloc(1, cmd.dataLength),
              cmd.data,
            ]),
          );
        } else if (cmd.dataLength >= 0x100 && cmd.dataLength < 520) {
          s.writeBuffer(
            Buffer.concat([
              Buffer.alloc(1, 77),
              toBufferLE(BigInt(cmd.dataLength), 2),
              cmd.data,
            ]),
          );
        } else {
          throw new Error(`invalid cmd data length: ${cmd.dataLength}`);
        }
      }
    }

    return s.toBuffer();
  }

  serialize(): Buffer {
    const result = this.rawSerialize();
    const total = result.length;
    return Buffer.concat([encodeVarint(total), result]);
  }



  verifyInput = async (inputIndex: number): Promise<boolean> => {
    const txIn = this.txIns[inputIndex];
    const scriptPubkey = await txIn.scriptPubkey(this.testnet);
    let redeemScript: Script | undefined;
    let z: bigint;
    let witness: Buffer[] | undefined;
    if (scriptPubkey.isP2SH()) {
      // last cmd of p2sh will be the redeem script
      const cmd = (txIn.scriptSig.cmds[
      txIn.scriptSig.cmds.length - 1
        ] as PushDataOpcode).data;
      // turn redeem script into valid script by appending varint of its length
      const rawRedeem = Buffer.concat([encodeVarint(cmd.byteLength), cmd]);
      redeemScript = Script.parse(SmartBuffer.fromBuffer(rawRedeem));
      if (redeemScript.isP2WPKH()) {
        z = await this.sigHashBIP143(inputIndex, redeemScript);
        witness = txIn.witness;
      } else if (redeemScript.isP2WSH()) {
        // last item of witness field contains witnessScript
        const cmd = txIn.witness[txIn.witness.length - 1];
        const rawWitness = Buffer.concat([encodeVarint(cmd.byteLength), cmd]);
        const witnessScript = Script.parse(SmartBuffer.fromBuffer(rawWitness));
        z = await this.sigHashBIP143(inputIndex, undefined, witnessScript);
        witness = txIn.witness;
      } else {
        z = await this.sigHash(inputIndex, redeemScript);
      }
    } else {
      if (scriptPubkey.isP2WPKH()) {
        z = await this.sigHashBIP143(inputIndex);
        witness = txIn.witness;
      } else if (scriptPubkey.isP2WSH()) {
        // last item of witness field contains witnessScript
        const cmd = txIn.witness[txIn.witness.length - 1];
        const rawWitness = Buffer.concat([encodeVarint(cmd.byteLength), cmd]);
        const witnessScript = Script.parse(SmartBuffer.fromBuffer(rawWitness));
        z = await this.sigHashBIP143(inputIndex, undefined, witnessScript);
        witness = txIn.witness;
      } else if (scriptPubkey.isP2Taproot()) {
        z = await this.sigHashSchnorr(inputIndex);
        witness = txIn.witness;
      } else {
        z = await this.sigHash(inputIndex);
      }
    }
    const combinedScript = txIn.scriptSig.add(scriptPubkey);
    return combinedScript.evaluate(z, witness || []);
  };


//       def verify_input(self, input_index):
//         """Returns whether the input has a valid signature"""
//         # get the relevant input
//         tx_in = self.tx_ins[input_index]
//         # get the script_pubkey of the input
//         script_pubkey = tx_in.script_pubkey(network=self.network)
//         # check to see if the script_pubkey is a p2sh
//         if script_pubkey.is_p2sh_script_pubkey():
//             # the last command has to be the redeem script to trigger
//             command = tx_in.script_sig.commands[-1]
//             # parse the redeem script
//             raw_redeem = int_to_little_endian(len(command), 1) + command
//             redeem_script = Script.parse(BytesIO(raw_redeem))
//         else:
//             redeem_script = None
//         # get the sig_hash (z)
//         z = self.sig_hash(input_index, redeem_script)
//         # combine the scripts
//         combined_script = tx_in.script_sig + tx_in.script_pubkey(self.network)
//         # evaluate the combined script
//         return combined_script.evaluate(z)


}
