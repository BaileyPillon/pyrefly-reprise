/** Types for `tools/anime/glbkit.mjs`: a small GLB reader and writer for the anime chapter's proportion and retarget passes. */
export interface Glb {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any;
  bin: Buffer;
}
export declare function readGlb(file: string): Glb;
export declare function writeGlb(file: string, json: unknown, bin: Buffer): void;
/** Read an accessor to flat numbers (normalised integers scaled), honouring byteStride. */
export declare function readAccessor(g: Glb, accessorIndex: number): { data: Float64Array; count: number; ncomp: number };
/** Write values back into an existing FLOAT accessor in place (same count and type); min and max follow. */
export declare function writeAccessorFloat(g: Glb, accessorIndex: number, data: ArrayLike<number>): void;
/** Append a float accessor (its own packed bufferView) to the BIN; returns its index. */
export declare function addAccessorFloat(g: Glb, data: ArrayLike<number>, type: string, withMinMax?: boolean): number;
export declare function nodeIndexByName(g: Glb): Map<string, number>;
export declare const qmul: (a: number[], b: number[]) => number[];
export declare const qinv: (a: number[]) => number[];
export declare const qnorm: (a: number[]) => number[];
export declare function qrot(q: number[], v: number[]): number[];
export declare const mat4Identity: () => number[];
export declare function mat4Mul(a: number[], b: number[]): number[];
export declare function mat4FromTRS(t: number[], q: number[], s: number[]): number[];
export declare function mat4Inv(m: number[]): number[];
/** Node world matrices from the local TRS in the JSON (the bind pose), and each node's parent (-1 for a root). */
export declare function worldMatrices(g: Glb): { world: number[][]; parent: number[] };
/** Repack the BIN keeping only referenced bufferViews; returns the bytes freed. */
export declare function compactGlb(g: Glb): number;
/** Replace an embedded image's bytes (a new bufferView at the end of the BIN). */
export declare function replaceImage(g: Glb, index: number, bytes: Buffer, mimeType?: string): void;
