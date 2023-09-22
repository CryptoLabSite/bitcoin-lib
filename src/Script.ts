import { OP_CODE_NAMES } from './Op';
import { SmartBuffer } from 'smart-buffer';

type Element = {
  data: Buffer;
  originalLength: number;
};
type Operation = {
  code: number;
};
type Cmd = Element | Operation;

export class Script {
  constructor(public cmds: Cmd[] = []) {}

  toString() {
    const result = [];
    for (const cmd of this.cmds) {
      if ('code' in cmd) {
        let name: string;
        if (OP_CODE_NAMES[cmd.code]) {
          name = OP_CODE_NAMES[cmd.code];
        } else {
          name = `OP_[${cmd.code}]`;
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
    return new Script();
  }

  rawSerialize(): Buffer {
    // todo
    return Buffer.from([]);
  }

  serialize(): Buffer {
    // todo
    return Buffer.from([]);
  }
}
