/** Types for `critic/runner/lib/pace-causes.mjs`, so the unit tests can import it. */
import type { PaceDump, PaceRow } from './pace-pure.mjs';

export declare function callTotals(gl: Array<{ t: number; name: string; dur: number }>, t0: number, t1: number): { link: number; tex: number; readback: number; draw2d: number; buf: number };
export declare function dominantOf(r: PaceRow, c: { link: number; tex: number; readback: number; draw2d: number; buf: number }, harness: string[]): string;
export declare function classifyLongFrames(o: { dump: PaceDump; meta?: { screenshots?: Array<[number, number]> }; longMs?: number }): { longMs: number; frames: Array<Record<string, unknown> & { dominant: string; interval: number | null }>; byCause: Record<string, { n: number; ms: number | null }> };
