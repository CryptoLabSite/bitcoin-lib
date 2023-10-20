import { Tx } from './Tx';
export declare class TxFetcher {
    static getUrl(testnet?: boolean): string;
    static fetch(txId: string, testnet?: boolean): Promise<Tx>;
}
