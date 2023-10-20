"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tx = void 0;
const TxIn_1 = require("./TxIn");
const TxOut_1 = require("./TxOut");
const smart_buffer_1 = require("smart-buffer");
const helper_1 = require("./helper");
class Tx {
    constructor(version, txIns, txOuts, locktime, testnet = false) {
        this.version = version;
        this.txIns = txIns;
        this.txOuts = txOuts;
        this.locktime = locktime;
        this.testnet = testnet;
    }
    toString() {
        let txIns = '';
        for (const txIn of this.txIns) {
            txIns += `${txIn}\n`;
        }
        let txOuts = '';
        for (const txOut of this.txOuts) {
            txOuts += `${txOut}\n`;
        }
        return `tx: ${this.id()}\nversion: ${this.version}\ntx_ins:\n${txIns}tx_outs:\n${txOuts}locktime: ${this.locktime}`;
    }
    id() {
        return this.hash().toString('hex');
    }
    hash() {
        return (0, helper_1.reverseBuffer)((0, helper_1.hash256)(this.serialize()));
    }
    static parse(s, testnet = false) {
        const sb = smart_buffer_1.SmartBuffer.fromBuffer(s);
        const version = s.readUInt32LE();
        const numInputs = (0, helper_1.readVarint)(sb);
        const inputs = [];
        for (let i = 0; i < numInputs; i++) {
            inputs.push(TxIn_1.TxIn.parse(sb));
        }
        const numOutputs = (0, helper_1.readVarint)(sb);
        const outputs = [];
        for (let i = 0; i < numOutputs; i++) {
            outputs.push(TxOut_1.TxOut.parse(sb));
        }
        const locktime = s.readUInt32LE();
        return new Tx(version, inputs, outputs, locktime, testnet);
    }
    serialize() {
        const s = new smart_buffer_1.SmartBuffer();
        s.writeUInt32LE(this.version);
        s.writeBuffer((0, helper_1.encodeVarint)(this.txIns.length));
        for (const txIn of this.txIns) {
            s.writeBuffer(txIn.serialize());
        }
        s.writeBuffer((0, helper_1.encodeVarint)(this.txOuts.length));
        for (const txOut of this.txOuts) {
            s.writeBuffer(txOut.serialize());
        }
        s.writeUInt32LE(this.locktime);
        return s.toBuffer();
    }
    async fee(testnet) {
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
exports.Tx = Tx;
