"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("../src/helper");
describe('HelperTest', () => {
    test('toBigIntLE', () => {
        let h = Buffer.from('99c3980000000000', 'hex');
        let want = 10011545n;
        expect((0, helper_1.toBigIntLE)(h)).toBe(want);
        h = Buffer.from('a135ef0100000000', 'hex');
        want = 32454049n;
        expect((0, helper_1.toBigIntLE)(h)).toBe(want);
    });
    test('toBigIntBE', () => {
        let n = 1n;
        let want = Buffer.from('01000000', 'hex');
        expect((0, helper_1.toBufferLE)(n, 4)).toEqual(want);
        n = 10011545n;
        want = Buffer.from('99c3980000000000', 'hex');
        expect((0, helper_1.toBufferLE)(n, 8)).toEqual(want);
    });
});
