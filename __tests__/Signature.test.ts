import {randomBigInt} from "../src/helper";
import {Signature} from "../src/Signature";

describe('SignatureTest', () => {
    test('der', () => {
        const testcases = [
            [1n, 2n],
            [randomBigInt(2n ** 256n), randomBigInt(2n ** 255n)],
            [randomBigInt(2n ** 256n), randomBigInt(2n ** 255n)]
        ];

        for (const [r, s] of testcases) {
            const sig = new Signature(r, s);
            const der = sig.der();
            const sig2 = Signature.parse(der);
            expect(sig2.r).toEqual(r);
            expect(sig2.s).toEqual(s);
        }
    });
});