import type { FigRec } from './continuity-pure.mjs';

export interface DissolvePolicy { minBlendFrames: number; maxShareStep: number; maxPx: number }
export declare function shareStepAt(frames: { n: number; fig: FigRec }[], n: number, from: number, to: number): number | null;
export declare function dissolvePolicy(cfg: { jerks?: { dissolveTravel?: Partial<DissolvePolicy> } } | null | undefined): DissolvePolicy;
export declare function dissolveTravel(o: { jerk: { n: number; px: number }; swap: { from: number; to: number; hardCut: boolean; blendFrames: number } | undefined | null; frames: { n: number; fig: FigRec }[]; policy: DissolvePolicy }): { shareStep: number; blendFrames: number } | null;
