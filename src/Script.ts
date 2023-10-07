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
}

export function p2pkhScript(h160: Buffer): Script {
  return new Script([
    OpCode.OP_DUP,
    OpCode.OP_HASH160,
    { data: h160, dataLength: h160.length },
    OpCode.OP_EQUALVERIFY,
    OpCode.OP_CHECKSIG,
  ]);
}
