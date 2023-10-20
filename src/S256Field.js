"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S256Field = exports.P = void 0;
const FieldElement_1 = require("./FieldElement");
exports.P = 2n ** 256n - 2n ** 32n - 977n;
class S256Field extends FieldElement_1.FieldElement {
    constructor(num) {
        super(num, exports.P);
    }
    hex() {
        return this.num.toString(16).padStart(64, '0');
    }
    toString() {
        return this.hex();
    }
    sqrt() {
        const field = this.pow((exports.P + 1n) / 4n);
        return new S256Field(field.num);
    }
}
exports.S256Field = S256Field;
