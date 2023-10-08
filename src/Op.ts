import { reverseBuffer } from './helper';
import { S256Point } from './S256Point';
import { Signature } from './Signature';

export type Stack = Buffer[];

export function op0(stack: Stack): boolean {
  // stack.push(encodeNum(0));
  return true;
}

export function unsupportedFunc() {
  throw new Error('unsupported operation');
}

export function opCheckMultisig(stack: Stack, z: bigint): boolean {
  if (stack.length < 1) {
    return false;
  }

  const n = decodeNum(stack.pop()!);
  if (stack.length < n + 1) {
    return false;
  }
  const secPubkeys: Buffer[] = [];
  for (let i = 0; i < n; i++) {
    secPubkeys.push(stack.pop()!);
  }

  const m = decodeNum(stack.pop()!);
  if (stack.length < m + 1) {
    return false;
  }
  const derSignatures: Buffer[] = [];
  for (let i = 0; i < m; i++) {
    // signature is assumed to be using SIGHASH_ALL
    let derSignature = stack.pop()!;
    derSignature = derSignature.subarray(0, derSignature.length - 1);
    derSignatures.push(derSignature);
  }
  // OP_CHECKMULTISIG bug
  stack.pop();

  try {
    const points: S256Point[] = secPubkeys.map((secPubkey) =>
      S256Point.parse(secPubkey),
    );

    const signatures: Signature[] = derSignatures.map((derSignature) =>
      Signature.parse(derSignature),
    );

    for (const signature of signatures) {
      if (points.length === 0) {
        return false;
      }

      while (points.length > 0) {
        const point = points.shift()!;
        if (point.verify(z, signature)) {
          break;
        }
      }

      stack.push(encodeNum(1));
    }
  } catch (e) {
    return false;
  }

  return true;
}

export function encodeNum(num: number): Buffer {
  if (num === 0) {
    return Buffer.alloc(0);
  }

  let absNum = Math.abs(num);
  const negative = num < 0;
  const result = [];
  while (absNum) {
    result.push(absNum & 0xff);
    absNum >>= 8;
  }
  if (result[result.length - 1] & 0x80) {
    if (negative) {
      result.push(0x80);
    } else {
      result.push(0);
    }
  } else if (negative) {
    result[result.length - 1] |= 0x80;
  }

  return Buffer.from(result);
}

export function decodeNum(element: Buffer): number {
  if (element.equals(Buffer.alloc(0))) {
    return 0;
  }

  const bigEndian = reverseBuffer(element);
  let negative: boolean;
  let result: number;
  if (bigEndian[0] & 0x80) {
    negative = true;
    result = bigEndian[0] & 0x7f;
  } else {
    negative = false;
    result = bigEndian[0];
  }
  for (const c of bigEndian.slice(1)) {
    result <<= 8;
    result += c;
  }
  if (negative) {
    return -result;
  } else {
    return result;
  }
}

// you can see more operations here: https://en.bitcoin.it/wiki/Script
export enum OpCode {
  'OP_0' = 0,
  'OP_PUSHDATA1' = 76,
  'OP_PUSHDATA2' = 77,
  'OP_PUSHDATA4' = 78,
  'OP_1NEGATE' = 79,
  'OP_1' = 81,
  'OP_2' = 82,
  'OP_3' = 83,
  'OP_4' = 84,
  'OP_5' = 85,
  'OP_6' = 86,
  'OP_7' = 87,
  'OP_8' = 88,
  'OP_9' = 89,
  'OP_10' = 90,
  'OP_11' = 91,
  'OP_12' = 92,
  'OP_13' = 93,
  'OP_14' = 94,
  'OP_15' = 95,
  'OP_16' = 96,
  'OP_NOP' = 97,
  'OP_IF' = 99,
  'OP_NOTIF' = 100,
  'OP_ELSE' = 103,
  'OP_ENDIF' = 104,
  'OP_VERIFY' = 105,
  'OP_RETURN' = 106,
  'OP_TOALTSTACK' = 107,
  'OP_FROMALTSTACK' = 108,
  'OP_2DROP' = 109,
  'OP_2DUP' = 110,
  'OP_3DUP' = 111,
  'OP_2OVER' = 112,
  'OP_2ROT' = 113,
  'OP_2SWAP' = 114,
  'OP_IFDUP' = 115,
  'OP_DEPTH' = 116,
  'OP_DROP' = 117,
  'OP_DUP' = 118,
  'OP_NIP' = 119,
  'OP_OVER' = 120,
  'OP_PICK' = 121,
  'OP_ROLL' = 122,
  'OP_ROT' = 123,
  'OP_SWAP' = 124,
  'OP_TUCK' = 125,
  'OP_SIZE' = 130,
  'OP_EQUAL' = 135,
  'OP_EQUALVERIFY' = 136,
  'OP_1ADD' = 139,
  'OP_1SUB' = 140,
  'OP_NEGATE' = 143,
  'OP_ABS' = 144,
  'OP_NOT' = 145,
  'OP_0NOTEQUAL' = 146,
  'OP_ADD' = 147,
  'OP_SUB' = 148,
  'OP_BOOLAND' = 154,
  'OP_BOOLOR' = 155,
  'OP_NUMEQUAL' = 156,
  'OP_NUMEQUALVERIFY' = 157,
  'OP_NUMNOTEQUAL' = 158,
  'OP_LESSTHAN' = 159,
  'OP_GREATERTHAN' = 160,
  'OP_LESSTHANOREQUAL' = 161,
  'OP_GREATERTHANOREQUAL' = 162,
  'OP_MIN' = 163,
  'OP_MAX' = 164,
  'OP_WITHIN' = 165,
  'OP_RIPEMD160' = 166,
  'OP_SHA1' = 167,
  'OP_SHA256' = 168,
  'OP_HASH160' = 169,
  'OP_HASH256' = 170,
  'OP_CODESEPARATOR' = 171,
  'OP_CHECKSIG' = 172,
  'OP_CHECKSIGVERIFY' = 173,
  'OP_CHECKMULTISIG' = 174,
  'OP_CHECKMULTISIGVERIFY' = 175,
  'OP_NOP1' = 176,
  'OP_CHECKLOCKTIMEVERIFY' = 177,
  'OP_CHECKSEQUENCEVERIFY' = 178,
  'OP_NOP4' = 179,
  'OP_NOP5' = 180,
  'OP_NOP6' = 181,
  'OP_NOP7' = 182,
  'OP_NOP8' = 183,
  'OP_NOP9' = 184,
  'OP_NOP10' = 185,
}

type OpCodeFunctions = {
  [key in OpCode]: Function;
  // [key: number]: Function
};
export const OP_CODE_FUNCTIONS: OpCodeFunctions = {
  [OpCode.OP_0]: op0,
  [OpCode.OP_PUSHDATA1]: unsupportedFunc,
  [OpCode.OP_PUSHDATA2]: unsupportedFunc,
  [OpCode.OP_PUSHDATA4]: unsupportedFunc,
  [OpCode.OP_1NEGATE]: unsupportedFunc,
  [OpCode.OP_1]: unsupportedFunc,
  [OpCode.OP_2]: unsupportedFunc,
  [OpCode.OP_3]: unsupportedFunc,
  [OpCode.OP_4]: unsupportedFunc,
  [OpCode.OP_5]: unsupportedFunc,
  [OpCode.OP_6]: unsupportedFunc,
  [OpCode.OP_7]: unsupportedFunc,
  [OpCode.OP_8]: unsupportedFunc,
  [OpCode.OP_9]: unsupportedFunc,
  [OpCode.OP_10]: unsupportedFunc,
  [OpCode.OP_11]: unsupportedFunc,
  [OpCode.OP_12]: unsupportedFunc,
  [OpCode.OP_13]: unsupportedFunc,
  [OpCode.OP_14]: unsupportedFunc,
  [OpCode.OP_15]: unsupportedFunc,
  [OpCode.OP_16]: unsupportedFunc,
  [OpCode.OP_NOP]: unsupportedFunc,
  [OpCode.OP_IF]: unsupportedFunc,
  [OpCode.OP_NOTIF]: unsupportedFunc,
  [OpCode.OP_ELSE]: unsupportedFunc,
  [OpCode.OP_ENDIF]: unsupportedFunc,
  [OpCode.OP_VERIFY]: unsupportedFunc,
  [OpCode.OP_RETURN]: unsupportedFunc,
  [OpCode.OP_TOALTSTACK]: unsupportedFunc,
  [OpCode.OP_FROMALTSTACK]: unsupportedFunc,
  [OpCode.OP_2DROP]: unsupportedFunc,
  [OpCode.OP_2DUP]: unsupportedFunc,
  [OpCode.OP_3DUP]: unsupportedFunc,
  [OpCode.OP_2OVER]: unsupportedFunc,
  [OpCode.OP_2ROT]: unsupportedFunc,
  [OpCode.OP_2SWAP]: unsupportedFunc,
  [OpCode.OP_IFDUP]: unsupportedFunc,
  [OpCode.OP_DEPTH]: unsupportedFunc,
  [OpCode.OP_DROP]: unsupportedFunc,
  [OpCode.OP_DUP]: unsupportedFunc,
  [OpCode.OP_NIP]: unsupportedFunc,
  [OpCode.OP_OVER]: unsupportedFunc,
  [OpCode.OP_PICK]: unsupportedFunc,
  [OpCode.OP_ROLL]: unsupportedFunc,
  [OpCode.OP_ROT]: unsupportedFunc,
  [OpCode.OP_SWAP]: unsupportedFunc,
  [OpCode.OP_TUCK]: unsupportedFunc,
  [OpCode.OP_SIZE]: unsupportedFunc,
  [OpCode.OP_EQUAL]: unsupportedFunc,
  [OpCode.OP_EQUALVERIFY]: unsupportedFunc,
  [OpCode.OP_1ADD]: unsupportedFunc,
  [OpCode.OP_1SUB]: unsupportedFunc,
  [OpCode.OP_NEGATE]: unsupportedFunc,
  [OpCode.OP_ABS]: unsupportedFunc,
  [OpCode.OP_NOT]: unsupportedFunc,
  [OpCode.OP_0NOTEQUAL]: unsupportedFunc,
  [OpCode.OP_ADD]: unsupportedFunc,
  [OpCode.OP_SUB]: unsupportedFunc,
  [OpCode.OP_BOOLAND]: unsupportedFunc,
  [OpCode.OP_BOOLOR]: unsupportedFunc,
  [OpCode.OP_NUMEQUAL]: unsupportedFunc,
  [OpCode.OP_NUMEQUALVERIFY]: unsupportedFunc,
  [OpCode.OP_NUMNOTEQUAL]: unsupportedFunc,
  [OpCode.OP_LESSTHAN]: unsupportedFunc,
  [OpCode.OP_GREATERTHAN]: unsupportedFunc,
  [OpCode.OP_LESSTHANOREQUAL]: unsupportedFunc,
  [OpCode.OP_GREATERTHANOREQUAL]: unsupportedFunc,
  [OpCode.OP_MIN]: unsupportedFunc,
  [OpCode.OP_MAX]: unsupportedFunc,
  [OpCode.OP_WITHIN]: unsupportedFunc,
  [OpCode.OP_RIPEMD160]: unsupportedFunc,
  [OpCode.OP_SHA1]: unsupportedFunc,
  [OpCode.OP_SHA256]: unsupportedFunc,
  [OpCode.OP_HASH160]: unsupportedFunc,
  [OpCode.OP_HASH256]: unsupportedFunc,
  [OpCode.OP_CODESEPARATOR]: unsupportedFunc,
  [OpCode.OP_CHECKSIG]: unsupportedFunc,
  [OpCode.OP_CHECKSIGVERIFY]: unsupportedFunc,
  [OpCode.OP_CHECKMULTISIG]: opCheckMultisig,
  [OpCode.OP_CHECKMULTISIGVERIFY]: unsupportedFunc,
  [OpCode.OP_NOP1]: unsupportedFunc,
  [OpCode.OP_CHECKLOCKTIMEVERIFY]: unsupportedFunc,
  [OpCode.OP_CHECKSEQUENCEVERIFY]: unsupportedFunc,
  [OpCode.OP_NOP4]: unsupportedFunc,
  [OpCode.OP_NOP5]: unsupportedFunc,
  [OpCode.OP_NOP6]: unsupportedFunc,
  [OpCode.OP_NOP7]: unsupportedFunc,
  [OpCode.OP_NOP8]: unsupportedFunc,
  [OpCode.OP_NOP9]: unsupportedFunc,
  [OpCode.OP_NOP10]: unsupportedFunc,
};

type OpCodeNames = {
  [key in OpCode]: string;
};
export const OP_CODE_NAMES: OpCodeNames = {
  [OpCode.OP_0]: 'OP_0',
  [OpCode.OP_PUSHDATA1]: 'OP_PUSHDATA1',
  [OpCode.OP_PUSHDATA2]: 'OP_PUSHDATA2',
  [OpCode.OP_PUSHDATA4]: 'OP_PUSHDATA4',
  [OpCode.OP_1NEGATE]: 'OP_1NEGATE',
  [OpCode.OP_1]: 'OP_1',
  [OpCode.OP_2]: 'OP_2',
  [OpCode.OP_3]: 'OP_3',
  [OpCode.OP_4]: 'OP_4',
  [OpCode.OP_5]: 'OP_5',
  [OpCode.OP_6]: 'OP_6',
  [OpCode.OP_7]: 'OP_7',
  [OpCode.OP_8]: 'OP_8',
  [OpCode.OP_9]: 'OP_9',
  [OpCode.OP_10]: 'OP_10',
  [OpCode.OP_11]: 'OP_11',
  [OpCode.OP_12]: 'OP_12',
  [OpCode.OP_13]: 'OP_13',
  [OpCode.OP_14]: 'OP_14',
  [OpCode.OP_15]: 'OP_15',
  [OpCode.OP_16]: 'OP_16',
  [OpCode.OP_NOP]: 'OP_NOP',
  [OpCode.OP_IF]: 'OP_IF',
  [OpCode.OP_NOTIF]: 'OP_NOTIF',
  [OpCode.OP_ELSE]: 'OP_ELSE',
  [OpCode.OP_ENDIF]: 'OP_ENDIF',
  [OpCode.OP_VERIFY]: 'OP_VERIFY',
  [OpCode.OP_RETURN]: 'OP_RETURN',
  [OpCode.OP_TOALTSTACK]: 'OP_TOALTSTACK',
  [OpCode.OP_FROMALTSTACK]: 'OP_FROMALTSTACK',
  [OpCode.OP_2DROP]: 'OP_2DROP',
  [OpCode.OP_2DUP]: 'OP_2DUP',
  [OpCode.OP_3DUP]: 'OP_3DUP',
  [OpCode.OP_2OVER]: 'OP_2OVER',
  [OpCode.OP_2ROT]: 'OP_2ROT',
  [OpCode.OP_2SWAP]: 'OP_2SWAP',
  [OpCode.OP_IFDUP]: 'OP_IFDUP',
  [OpCode.OP_DEPTH]: 'OP_DEPTH',
  [OpCode.OP_DROP]: 'OP_DROP',
  [OpCode.OP_DUP]: 'OP_DUP',
  [OpCode.OP_NIP]: 'OP_NIP',
  [OpCode.OP_OVER]: 'OP_OVER',
  [OpCode.OP_PICK]: 'OP_PICK',
  [OpCode.OP_ROLL]: 'OP_ROLL',
  [OpCode.OP_ROT]: 'OP_ROT',
  [OpCode.OP_SWAP]: 'OP_SWAP',
  [OpCode.OP_TUCK]: 'OP_TUCK',
  [OpCode.OP_SIZE]: 'OP_SIZE',
  [OpCode.OP_EQUAL]: 'OP_EQUAL',
  [OpCode.OP_EQUALVERIFY]: 'OP_EQUALVERIFY',
  [OpCode.OP_1ADD]: 'OP_1ADD',
  [OpCode.OP_1SUB]: 'OP_1SUB',
  [OpCode.OP_NEGATE]: 'OP_NEGATE',
  [OpCode.OP_ABS]: 'OP_ABS',
  [OpCode.OP_NOT]: 'OP_NOT',
  [OpCode.OP_0NOTEQUAL]: 'OP_0NOTEQUAL',
  [OpCode.OP_ADD]: 'OP_ADD',
  [OpCode.OP_SUB]: 'OP_SUB',
  [OpCode.OP_BOOLAND]: 'OP_BOOLAND',
  [OpCode.OP_BOOLOR]: 'OP_BOOLOR',
  [OpCode.OP_NUMEQUAL]: 'OP_NUMEQUAL',
  [OpCode.OP_NUMEQUALVERIFY]: 'OP_NUMEQUALVERIFY',
  [OpCode.OP_NUMNOTEQUAL]: 'OP_NUMNOTEQUAL',
  [OpCode.OP_LESSTHAN]: 'OP_LESSTHAN',
  [OpCode.OP_GREATERTHAN]: 'OP_GREATERTHAN',
  [OpCode.OP_LESSTHANOREQUAL]: 'OP_LESSTHANOREQUAL',
  [OpCode.OP_GREATERTHANOREQUAL]: 'OP_GREATERTHANOREQUAL',
  [OpCode.OP_MIN]: 'OP_MIN',
  [OpCode.OP_MAX]: 'OP_MAX',
  [OpCode.OP_WITHIN]: 'OP_WITHIN',
  [OpCode.OP_RIPEMD160]: 'OP_RIPEMD160',
  [OpCode.OP_SHA1]: 'OP_SHA1',
  [OpCode.OP_SHA256]: 'OP_SHA256',
  [OpCode.OP_HASH160]: 'OP_HASH160',
  [OpCode.OP_HASH256]: 'OP_HASH256',
  [OpCode.OP_CODESEPARATOR]: 'OP_CODESEPARATOR',
  [OpCode.OP_CHECKSIG]: 'OP_CHECKSIG',
  [OpCode.OP_CHECKSIGVERIFY]: 'OP_CHECKSIGVERIFY',
  [OpCode.OP_CHECKMULTISIG]: 'OP_CHECKMULTISIG',
  [OpCode.OP_CHECKMULTISIGVERIFY]: 'OP_CHECKMULTISIGVERIFY',
  [OpCode.OP_NOP1]: 'OP_NOP1',
  [OpCode.OP_CHECKLOCKTIMEVERIFY]: 'OP_CHECKLOCKTIMEVERIFY',
  [OpCode.OP_CHECKSEQUENCEVERIFY]: 'OP_CHECKSEQUENCEVERIFY',
  [OpCode.OP_NOP4]: 'OP_NOP4',
  [OpCode.OP_NOP5]: 'OP_NOP5',
  [OpCode.OP_NOP6]: 'OP_NOP6',
  [OpCode.OP_NOP7]: 'OP_NOP7',
  [OpCode.OP_NOP8]: 'OP_NOP8',
  [OpCode.OP_NOP9]: 'OP_NOP9',
  [OpCode.OP_NOP10]: 'OP_NOP10',
};
