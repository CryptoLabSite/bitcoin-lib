import {Point} from "../src/Point";

describe('PointTest', () => {
    test('ne', () => {
        const a = new Point({x: 3n, y: -7n, a: 5n, b: 7n});
        const b = new Point({x: 18n, y: 77n, a: 5n, b: 7n});
        expect(a.nonEquals(b)).toBeTruthy();
        expect(a.nonEquals(a)).toBeFalsy();
    });

    test('on_curve', () => {
        expect(() => {
            new Point({x: -2n, y: 4n, a: 5n, b: 7n})
        }).toThrow(Error);
        new Point({x: 3n, y: -7n, a: 5n, b: 7n});
        new Point({x: 18n, y: 77n, a: 5n, b: 7n});
    });

    test('add0', () => {
        const a = new Point({a: 5n, b: 7n});
        const b = new Point({x: 2n, y: 5n, a: 5n, b: 7n});
        const c = new Point({x: 2n, y: -5n, a: 5n, b: 7n});
        expect(a.add(b).equals(b)).toBeTruthy();
        expect(b.add(a).equals(b)).toBeTruthy();
        expect(b.add(c).equals(a)).toBeTruthy();
    });

    test('add1', () => {
        const a = new Point({x: 3n, y: 7n, a: 5n, b: 7n});
        const b = new Point({x: -1n, y: -1n, a: 5n, b: 7n});
        expect(a.add(b).equals(new Point({x: 2n, y: -5n, a: 5n, b: 7n}))).toBeTruthy();
    });

    test('add2', () => {
        const a = new Point({x: -1n, y: 1n, a: 5n, b: 7n})
        expect(a.add(a).equals(new Point({x: 18n, y: -77n, a: 5n, b: 7n}))).toBeTruthy();
    });
});
