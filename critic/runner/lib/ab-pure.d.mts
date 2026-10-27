/** Types for `critic/runner/lib/ab-pure.mjs`, so the unit tests can import it. */
export declare const PANEL: Readonly<{ w: number; h: number }>;
export declare const CARD: Readonly<{ w: number; h: number }>;
export declare const STILL_W: number;
export declare const BUDGET: Readonly<{ maxBytes: number; maxSeconds: number; crf: number; crfStep: number; crfMax: number }>;
export declare const LETTERS: string;
export declare function seeded(seed: number): () => number;
export declare function seedOf(s: string): number;
export interface VariantRef { id: string; name?: string }
export declare function blindOrder<T extends VariantRef>(variants: T[], seed: string | number): { order: Array<T & { letter: string }>; key: Record<string, VariantRef> };
export interface Crop { x: number; y: number; w: number; h: number }
export declare function cropRegion(points: Array<{ x: number; y: number }>, viewport: { w: number; h: number }, o?: { margin?: number; minW?: number; minH?: number }): Crop;
export declare function trackPoints(frames: Array<{ actors?: Record<string, Record<string, any>> }>, focus: string[], i0: number, i1: number): Array<{ x: number; y: number }>;
export interface MomentWindow { i0: number; i1: number; startMs: number; endMs: number; lengthMs: number; truncated: boolean; around?: boolean }
export interface EventWant { event?: string; type?: string; who?: string | null; ordinal?: number }
export interface BeatWant { actor: string; kind: 'shake' | 'pose'; pose?: string; ordinal?: number }
export declare function findBeatFrame(frames: Array<{ actors?: Record<string, { shL?: number; pose?: string | null }> }>, want: BeatWant | null | undefined, from?: number): number;
export declare function isActing(f: { phase?: string | null; playing?: boolean; menu?: boolean } | null | undefined): boolean;
export declare function findEvent<T extends { type: string }>(events: T[] | undefined, want: EventWant | null | undefined): T | null;
export declare function windowOf(frames: Array<{ vt: number; playing?: boolean; menu?: boolean; phase?: string | null }>, events: Array<{ vt: number }> | undefined, o?: { t0: number; leadMs?: number; settleMs?: number; maxMs?: number; around?: (EventWant & { beforeMs?: number; afterMs?: number }) | null }): MomentWindow | null;
export declare function speedTrace(frames: Array<{ vt: number; actors?: Record<string, Record<string, any>> }>, actorId: string, i0: number, i1: number, o?: { pxPerUnit?: number; scale?: number }): Array<{ t: number; v: number; vx: number }>;
export declare function stripIndexes(n: number, count?: number): number[];
export declare function joinQuery(base?: string, own?: string): string;
export declare function checkSpec(spec: unknown): string[];
export declare function clipName(o: { chapter: string; move: string; hz: number; slow?: boolean; ext?: string }): string;
export declare function nextCrf(crf: number, bytes: number, budget?: { maxBytes: number; crfStep: number; crfMax: number }): number | null;
export declare function clipFps(hz: number, slow?: boolean): number;
export declare function nearestFrame(frames: Array<{ vt: number }>, t: number): number;
