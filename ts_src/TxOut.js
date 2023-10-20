"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TxOut = void 0;
const helper_1 = require("./helper");
const Script_1 = require("./Script");
class TxOut {
    constructor(amount, scriptPubKey) {
        this.amount = amount;
        this.scriptPubKey = scriptPubKey;
    }
    static parse(s) {
        const amount = (0, helper_1.toBigIntLE)(s.readBuffer(8));
        const scriptPubkey = Script_1.Script.parse(s);
        return new TxOut(amount, scriptPubkey);
    }
    toString() {
        return `${this.amount}:${this.scriptPubKey}`;
    }
    serialize() {
        const amount = (0, helper_1.toBufferLE)(this.amount, 8);
        const scriptPubKey = this.scriptPubKey.serialize();
        return Buffer.concat([amount, scriptPubKey]);
    }
}
exports.TxOut = TxOut;
