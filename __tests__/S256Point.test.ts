import {G, S256Point} from "../src/S256Point";
import {Signature} from "../src/Signature";

describe('S256PointTest', () => {
    test('sec', () => {
        let coefficient: bigint = 999n ** 3n;
        let uncompressed: Buffer = Buffer.from('049d5ca49670cbe4c3bfa84c96a8c87df086c6ea6a24ba6b809c9de234496808d56fa15cc7f3d38cda98dee2419f415b7513dde1301f8643cd9245aea7f3f911f9', 'hex');
        let compressed: Buffer = Buffer.from('039d5ca49670cbe4c3bfa84c96a8c87df086c6ea6a24ba6b809c9de234496808d5', 'hex');
        let point: S256Point = G.scalarMul(coefficient);
        expect(point.sec(false).equals(uncompressed)).toBeTruthy();
        expect(point.sec(true).equals(compressed)).toBeTruthy();

        coefficient = 123n;
        uncompressed = Buffer.from('04a598a8030da6d86c6bc7f2f5144ea549d28211ea58faa70ebf4c1e665c1fe9b5204b5d6f84822c307e4b4a7140737aec23fc63b65b35f86a10026dbd2d864e6b', 'hex');
        compressed = Buffer.from('03a598a8030da6d86c6bc7f2f5144ea549d28211ea58faa70ebf4c1e665c1fe9b5', 'hex');
        point = G.scalarMul(coefficient);
        expect(point.sec(false).equals(uncompressed)).toBeTruthy();
        expect(point.sec(true).equals(compressed)).toBeTruthy();

        coefficient = 42424242n;
        uncompressed = Buffer.from('04aee2e7d843f7430097859e2bc603abcc3274ff8169c1a469fee0f20614066f8e21ec53f40efac47ac1c5211b2123527e0e9b57ede790c4da1e72c91fb7da54a3', 'hex');
        compressed = Buffer.from('03aee2e7d843f7430097859e2bc603abcc3274ff8169c1a469fee0f20614066f8e', 'hex');
        point = G.scalarMul(coefficient);
        expect(point.sec(false).equals(uncompressed)).toBeTruthy();
        expect(point.sec(true).equals(compressed)).toBeTruthy();
    });

    test('parse', () => {
        let coefficient: bigint = 999n ** 3n;
        let point: S256Point = G.scalarMul(coefficient);
        let uncompressed = Buffer.from(
            '049d5ca49670cbe4c3bfa84c96a8c87df086c6ea6a24ba6b809c9de234496808d56fa15cc7f3d38cda98dee2419f415b7513dde1301f8643cd9245aea7f3f911f9',
            'hex'
        );
        let compressed = Buffer.from(
            '039d5ca49670cbe4c3bfa84c96a8c87df086c6ea6a24ba6b809c9de234496808d5',
            'hex'
        );
        expect(S256Point.parse(uncompressed).equals(point)).toBeTruthy();
        expect(S256Point.parse(compressed).equals(point)).toBeTruthy();


        coefficient = 123n;
        point = G.scalarMul(coefficient);
        uncompressed = Buffer.from(
            '04a598a8030da6d86c6bc7f2f5144ea549d28211ea58faa70ebf4c1e665c1fe9b5204b5d6f84822c307e4b4a7140737aec23fc63b65b35f86a10026dbd2d864e6b',
            'hex'
        );
        compressed = Buffer.from(
            '03a598a8030da6d86c6bc7f2f5144ea549d28211ea58faa70ebf4c1e665c1fe9b5',
            'hex'
        );
        expect(S256Point.parse(uncompressed).equals(point)).toBeTruthy();
        expect(S256Point.parse(compressed).equals(point)).toBeTruthy();


        coefficient = 42424242n;
        point = G.scalarMul(coefficient);
        uncompressed = Buffer.from(
            '04aee2e7d843f7430097859e2bc603abcc3274ff8169c1a469fee0f20614066f8e21ec53f40efac47ac1c5211b2123527e0e9b57ede790c4da1e72c91fb7da54a3',
            'hex'
        );
        compressed = Buffer.from(
            '03aee2e7d843f7430097859e2bc603abcc3274ff8169c1a469fee0f20614066f8e',
            'hex'
        );
        expect(S256Point.parse(uncompressed).equals(point)).toBeTruthy();
        expect(S256Point.parse(compressed).equals(point)).toBeTruthy();
    });

    test('verify', () => {
        let point = new S256Point(
            0x887387e452b8eacc4acfde10d9aaf7f6d9a0f975aabb10d006e4da568744d06cn,
            0x61de6d95231cd89026e286df3b6ae4a894a3378e393e93a0f45b666329a0ae34n
        );


        let z = 0xec208baa0fc1c19f708a9ca96fdeff3ac3f230bb4a7ba4aede4942ad003c0f60n;
        let r = 0xac8d1c87e51d0d441be8b3dd5b05c8795b48875dffe00b7ffcfac23010d3a395n;
        let s = 0x68342ceff8935ededd102dd876ffd6ba72d6a427a3edb13d26eb0781cb423c4n;
        expect(point.verify(z, new Signature(r, s))).toBeTruthy();

        z = 0x7c076ff316692a3d7eb3c3bb0f8b1488cf72e1afcd929e29307032997a838a3dn;
        r = 0xeff69ef2b1bd93a66ed5219add4fb51e11a840f404876325a1e8ffe0529a2cn;
        s = 0xc7207fee197d27c618aea621406f6bf5ef6fca38681d82b2f06fddbdce6feab6n;
        expect(point.verify(z, new Signature(r, s))).toBeTruthy();
    });

    test('address', () => {
        let secret = 888n ** 3n;
        let mainnetAddress = "148dY81A9BmdpMhvYEVznrM45kWN32vSCN";
        let testnetAddress = "mieaqB68xDCtbUBYFoUNcmZNwk74xcBfTP";
        let point = G.scalarMul(secret);
        expect(point.address(true, false)).toBe(mainnetAddress);
        expect(point.address(true, true)).toBe(testnetAddress);
        secret = 321n;
        mainnetAddress = "1S6g2xBJSED7Qr9CYZib5f4PYVhHZiVfj";
        testnetAddress = "mfx3y63A7TfTtXKkv7Y6QzsPFY6QCBCXiP";
        point = G.scalarMul(secret);
        expect(point.address(false, false)).toBe(mainnetAddress);
        expect(point.address(false, true)).toBe(testnetAddress);
        secret = 4242424242n;
        mainnetAddress = "1226JSptcStqn4Yq9aAmNXdwdc2ixuH9nb";
        testnetAddress = "mgY3bVusRUL6ZB2Ss999CSrGVbdRwVpM8s";
        point = G.scalarMul(secret);
        expect(point.address(false, false)).toBe(mainnetAddress);
        expect(point.address(false, true)).toBe(testnetAddress);
    });
});
