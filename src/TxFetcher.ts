import { Tx } from './Tx';
import axios from 'axios';

export class TxFetcher {
  static getUrl(testnet = false): string {
    if (testnet) {
      return 'https://blockstream.info/testnet/api';
    } else {
      return 'https://blockstream.info/api';
    }
  }

  static async fetch(txId: string, testnet = false): Promise<Tx> {
    const url = `${TxFetcher.getUrl(testnet)}/tx/${txId}/hex`;
    const response = await axios.get(url);
    if (response.status !== 200) {
      throw Error(`Error fetching tx: ${txId}`);
    }

    const rawTx = await response.data;
    let raw = Buffer.from(rawTx, 'hex');
    let tx: Tx;
    // todo: what is raw[4] means?
    if (raw[4] === 0) {
      raw = Buffer.concat([raw.subarray(0, 4), raw.subarray(6)]);
      tx = Tx.parse(raw, testnet);
      tx.locktime = raw.subarray(raw.length - 4).readUInt32LE(0);
    } else {
      tx = Tx.parse(raw, testnet);
    }

    return tx;
  }
}
