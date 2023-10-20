"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TxFetcher = void 0;
const Tx_1 = require("./Tx");
const axios_1 = __importDefault(require("axios"));
class TxFetcher {
    static getUrl(testnet = false) {
        if (testnet) {
            return 'https://blockstream.info/testnet/api';
        }
        else {
            return 'https://blockstream.info/api';
        }
    }
    static async fetch(txId, testnet = false) {
        const url = `${TxFetcher.getUrl(testnet)}/tx/${txId}/hex`;
        const response = await axios_1.default.get(url);
        if (response.status !== 200) {
            throw Error(`Error fetching tx: ${txId}`);
        }
        const rawTx = await response.data;
        let raw = Buffer.from(rawTx, 'hex');
        let tx;
        // todo: what is raw[4] means?
        if (raw[4] === 0) {
            raw = Buffer.concat([raw.subarray(0, 4), raw.subarray(6)]);
            tx = Tx_1.Tx.parse(raw, testnet);
            tx.locktime = raw.subarray(raw.length - 4).readUInt32LE(0);
        }
        else {
            tx = Tx_1.Tx.parse(raw, testnet);
        }
        return tx;
    }
}
exports.TxFetcher = TxFetcher;
