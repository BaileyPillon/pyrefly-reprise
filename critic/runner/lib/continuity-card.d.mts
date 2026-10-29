import type { Anchors, FigRec } from './continuity-pure.mjs';

export declare const LOCK_BAND: readonly [number, number];
export declare const LOCK_EDGE: number;
export type HeadClass = 'ok' | 'lock' | 'camera' | 'lock-band' | 'registration';
export declare function planeExt(fig: FigRec | null | undefined, k: number): { wx: number; wy: number; lock: number } | null;
export declare function cardHeadSize(ext: { wx: number; wy: number }, head: { u0: number; t0: number; u1: number; t1: number }): number;
export declare function headClassOf(o: { projected: number; card: number; tolerancePct: number; lockFrom: number; lockTo: number }): HeadClass;
export declare function readCardHead(o: { fig: FigRec; kFrom: number; kTo: number; aFrom: Pick<Anchors, 'head'> | null; aTo: Pick<Anchors, 'head'> | null; projected: number; tolerancePct: number }): { fromWorld: number; toWorld: number; ratio: number; lockFrom: number; lockTo: number; class: HeadClass } | null;
