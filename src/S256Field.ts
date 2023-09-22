import { FieldElement } from './FieldElement';

export const P = 2n ** 256n - 2n ** 32n - 977n;

export class S256Field extends FieldElement {
  constructor(num: bigint) {
    super(num, P);
  }

  hex() {
    return this.num.toString(16).padStart(64, '0');
  }

  toString() {
    return this.hex();
  }

  sqrt() {
    const field = this.pow((P + 1n) / 4n);
    return new S256Field(field.num);
  }
}
