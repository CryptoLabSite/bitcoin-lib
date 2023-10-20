type PointFields = {
    x?: bigint;
    y?: bigint;
    a: bigint;
    b: bigint;
};
export declare class Point {
    x?: bigint;
    y?: bigint;
    a: bigint;
    b: bigint;
    constructor({ x, y, a, b }: PointFields);
    equals(other: Point): boolean;
    nonEquals(other: Point): boolean;
    toString(): string;
    add(other: Point): Point;
}
export {};
