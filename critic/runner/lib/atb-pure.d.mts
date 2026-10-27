/** Types for `critic/runner/lib/atb-pure.mjs`, so the unit tests can import it. */
export interface ShimmerLife { uid: string | null; firstT: number; lastT: number; maxCur: number; frames: number }
export interface ShimmerVerdict { verdict: 'persists' | 'restarts-with-rebuild' | 'inconclusive'; why: string; distinctElements: number; longestLifeMs: number; rebuildsPerSecond: number | null; expectedRestarts: number | null }
export declare function shimmerVerdict(d: { lives: ShimmerLife[]; mutations: number; windowMs: number }): ShimmerVerdict;
export interface HeapNode { callFrame?: { functionName: string; url: string; lineNumber: number; columnNumber: number }; selfSize?: number; children?: HeapNode[] }
export interface AllocationRow { functionName: string; script: string; line: number; column: number; bytes: number; share: number; kbPerSecond: number | null; bytesPerFrame: number | null }
export declare function aggregateAllocations(profile: { head?: HeapNode } | null | undefined, o: { seconds: number; frames: number; top?: number }): { totalBytes: number; seconds: number; frames: number; mbPerSecond: number | null; kbPerFrame: number | null; functionsSeen: number; top: AllocationRow[]; topThreeShare: number };
