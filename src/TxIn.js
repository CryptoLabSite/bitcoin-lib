"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TxIn = void 0;
const Script_1 = require("./Script");
const helper_1 = require("./helper");
const smart_buffer_1 = require("smart-buffer");
const TxFetcher_1 = require("./TxFetcher");
class TxIn {
    constructor(prevTx, prevIndex, scriptSig = new Script_1.Script(), sequence = 0xffffffff) {
        this.prevTx = prevTx;
        this.prevIndex = prevIndex;
        this.scriptSig = scriptSig;
        this.sequence = sequence;
    }
    toString() {
        return `${this.prevTx.toString('hex')}:${this.prevIndex}`;
    }
    static parse(s) {
        const prevTx = (0, helper_1.reverseBuffer)(s.readBuffer(32));
        const prevIndex = s.readUInt32LE();
        const scriptSig = Script_1.Script.parse(s);
        const sequence = s.readUInt32LE();
        return new TxIn(prevTx, prevIndex, scriptSig, sequence);
    }
    serialize() {
        const s = new smart_buffer_1.SmartBuffer();
        // prevTx is little endian, so we need to reverse it
        s.writeBuffer((0, helper_1.reverseBuffer)(this.prevTx));
        s.writeUInt32LE(this.prevIndex);
        s.writeBuffer(this.scriptSig.serialize());
        s.writeUInt32LE(this.sequence);
        return s.toBuffer();
    }
    async fetchTx(testnet = false) {
        return await TxFetcher_1.TxFetcher.fetch(this.prevTx.toString('hex'), testnet);
    }
    async value(testnet = false) {
        const tx = await this.fetchTx(testnet);
        return tx.txOuts[this.prevIndex].amount;
    }
    async scriptPubkey(testnet = false) {
        const tx = await this.fetchTx(testnet);
        return tx.txOuts[this.prevIndex].scriptPubKey;
    }
}
exports.TxIn = TxIn;
