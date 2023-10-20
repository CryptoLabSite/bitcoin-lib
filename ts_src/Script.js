"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Script = void 0;
const Op_1 = require("./Op");
const smart_buffer_1 = require("smart-buffer");
const helper_1 = require("./helper");
class Script {
    constructor(cmds = []) {
        this.cmds = cmds;
    }
    toString() {
        const result = [];
        for (const cmd of this.cmds) {
            if (typeof cmd === 'number') {
                let name;
                if (Op_1.OP_CODE_NAMES[cmd]) {
                    name = Op_1.OP_CODE_NAMES[cmd];
                }
                else {
                    name = `OP_[${cmd}]`;
                }
                result.push(name);
            }
            else {
                result.push(cmd.data.toString('hex'));
            }
        }
        return result.join(' ');
    }
    add(other) {
        return new Script([...this.cmds, ...other.cmds]);
    }
    // reference: https://github.com/jimmysong/pb-exercises/blob/master/session6/script.py#L135
    evaluate(z) {
        const cmds = [...this.cmds];
        const stack = [];
        const altStack = [];
        while (cmds.length > 0) {
            const cmd = cmds.shift();
            if (typeof cmd === 'number') {
                const operation = Op_1.OP_CODE_FUNCTIONS[cmd];
                switch (cmd) {
                    case Op_1.OpCode.OP_IF:
                    case Op_1.OpCode.OP_NOTIF:
                        if (!operation(stack, cmds)) {
                            console.error(`bad op: ${Op_1.OP_CODE_NAMES[cmd]}`);
                            return false;
                        }
                        break;
                    case Op_1.OpCode.OP_TOALTSTACK:
                    case Op_1.OpCode.OP_FROMALTSTACK:
                        if (!operation(stack, altStack)) {
                            console.error(`bad op: ${Op_1.OP_CODE_NAMES[cmd]}`);
                            return false;
                        }
                        break;
                    case Op_1.OpCode.OP_CHECKSIG:
                    case Op_1.OpCode.OP_CHECKSIGVERIFY:
                    case Op_1.OpCode.OP_CHECKMULTISIG:
                    case Op_1.OpCode.OP_CHECKMULTISIGVERIFY:
                        if (!operation(stack, z)) {
                            console.error(`bad op: ${Op_1.OP_CODE_NAMES[cmd]}`);
                            return false;
                        }
                        break;
                    default:
                        if (!operation || !operation(stack)) {
                            console.error(`bad op: ${Op_1.OP_CODE_NAMES[cmd]}`);
                            return false;
                        }
                        break;
                }
            }
            else {
                stack.push(cmd.data);
            }
        }
        if (stack.length === 0) {
            return false;
        }
        return !Buffer.alloc(0).equals(stack.pop());
    }
    static parse(s) {
        const length = (0, helper_1.readVarint)(s);
        const cmds = [];
        let count = 0;
        while (count < length) {
            const current = s.readBuffer(1);
            count++;
            const currentByte = current[0];
            if (currentByte > Op_1.OpCode.OP_0 && currentByte < Op_1.OpCode.OP_PUSHDATA1) {
                const n = currentByte;
                const data = s.readBuffer(n);
                cmds.push({ data, dataLength: n });
                count += n;
            }
            else if (currentByte === Op_1.OpCode.OP_PUSHDATA1) {
                const dataLength = s.readUInt8();
                const data = s.readBuffer(dataLength);
                cmds.push({ data, dataLength });
                count += 1 + dataLength;
            }
            else if (currentByte === Op_1.OpCode.OP_PUSHDATA2) {
                const dataLength = s.readUInt16LE();
                const data = s.readBuffer(dataLength);
                cmds.push({ data, dataLength });
                count += 2 + dataLength;
            }
            else {
                const opCode = currentByte;
                cmds.push(opCode);
            }
        }
        if (count !== Number(length)) {
            throw new Error('parsing script failed');
        }
        return new Script(cmds);
    }
    rawSerialize() {
        const s = new smart_buffer_1.SmartBuffer();
        for (const cmd of this.cmds) {
            if (typeof cmd === 'number') {
                s.writeUInt8(cmd);
            }
            else {
                if (cmd.dataLength > 0 && cmd.dataLength <= 75) {
                    // little endian, 1 byte, so no need to reverse
                    s.writeBuffer(Buffer.concat([Buffer.alloc(1, cmd.dataLength), cmd.data]));
                }
                else if (cmd.dataLength > 75 && cmd.dataLength < 0x100) {
                    s.writeBuffer(Buffer.concat([
                        Buffer.alloc(1, 76),
                        Buffer.alloc(1, cmd.dataLength),
                        cmd.data,
                    ]));
                }
                else if (cmd.dataLength >= 0x100 && cmd.dataLength < 520) {
                    s.writeBuffer(Buffer.concat([
                        Buffer.alloc(1, 77),
                        (0, helper_1.toBufferLE)(BigInt(cmd.dataLength), 2),
                        cmd.data,
                    ]));
                }
                else {
                    throw new Error(`invalid cmd data length: ${cmd.dataLength}`);
                }
            }
        }
        return s.toBuffer();
    }
    serialize() {
        const result = this.rawSerialize();
        const total = result.length;
        return Buffer.concat([(0, helper_1.encodeVarint)(total), result]);
    }
}
exports.Script = Script;
