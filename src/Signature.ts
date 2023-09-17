import {SmartBuffer} from "smart-buffer";
import {toBigIntBE} from "./helper";

export class Signature {
    constructor(public r: bigint, public s: bigint) {
    }

    toString(): string {
        return `Signature(${this.r}, ${this.s})`;
    }

    der(): Buffer {
        let result;

        // convert the r part to bytes
        let rBin = this.r.toString(16).padStart(64, '0');
        let rBinBuffer = Buffer.from(rBin, 'hex');
        // if rbin has a high bit, add a 00
        if (rBinBuffer[0] >= 128) {
            rBinBuffer = Buffer.concat([Buffer.from([0]), rBinBuffer]);
        }

        result = Buffer.concat([Buffer.from([2]), Buffer.from([rBinBuffer.length]), rBinBuffer]);

        let sBin = this.s.toString(16).padStart(64, '0');
        let sBinBuffer = Buffer.from(sBin, 'hex');
        if (sBinBuffer[0] >= 128) {
            sBinBuffer = Buffer.concat([Buffer.from([0]), sBinBuffer]);
        }
        result = Buffer.concat([result, Buffer.from([2]), Buffer.from([sBinBuffer.length]), sBinBuffer]);

        return Buffer.concat([Buffer.alloc(1, 0x30), Buffer.from([result.length]), result]);
    }

    static parse(signature: Buffer) {
        const sig = SmartBuffer.fromBuffer(signature);
        const compound = sig.readUInt8();
        if (compound !== 0x30) {
            throw Error("Bad Signature compound");
        }
        const length = sig.readUInt8();
        if (length + 2 !== signature.length) {
            throw Error("Bad Signature Length");
        }
        let marker = sig.readUInt8();
        if (marker !== 0x02) {
            throw Error("Bad Signature marker");
        }
        const rlength = sig.readUInt8();
        const r = toBigIntBE(sig.readBuffer(rlength));
        marker = sig.readUInt8();
        if (marker !== 0x02) {
            throw Error("Bad Signature marker");
        }
        const slength = sig.readUInt8();
        const s = toBigIntBE(sig.readBuffer(slength));
        if (signature.length !== 6 + rlength + slength) {
            throw Error("Signature too long");
        }
        return new Signature(r, s);
    }
}