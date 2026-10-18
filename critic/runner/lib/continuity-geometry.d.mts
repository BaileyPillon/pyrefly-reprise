/** Types for `critic/runner/lib/continuity-geometry.mjs`. */
export declare function unitSquareToQuad(q: ArrayLike<number>): number[];
export declare function applyH(H: number[], u: number, t: number): [number, number];
export declare function invertH(H: number[]): number[] | null;
export declare function polygonArea(pts: number[][]): number;
