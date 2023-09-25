import { OP_CODE_NAMES, OpCode } from './Op';
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
