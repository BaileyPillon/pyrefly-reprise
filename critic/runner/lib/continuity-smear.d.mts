/** Types for `critic/runner/lib/continuity-smear.mjs`, so the unit tests can import it. */
import type { ContinuityConfig, Jerk } from './continuity-pure.mjs';

export interface SmearPolicy { excuse: boolean; slackMs: number; maxJerkPx: number; maxJerkShare: number; elastic: boolean; bigOverlap: number; bigAnchor: number; glideFeet: boolean; glideSlackShare: number }
/** One planned smear as the probe hands it over (`meta.smears`): the engine's log entry with `at` and `cutAt` in the probe's clock (ms). */
export interface LoggedSmear {
  actor: string; from: string; to: string; style?: 'paint' | 'blur'; kind?: 'plane' | 'rig'; at: number; cutAt?: number; cutMs: number; moveMs?: number;
  overlap?: number | null; anchorDistance?: number | null; speed?: number; strength?: number; flash?: boolean; big?: boolean;
  /** MF-06: the class of swap that asked for the cut. */ cause?: string;
  /** MF-18: the cut was anchored: the incoming plane was drawn back by `share` of the figure's height and eased home over `ms`. */ glide?: { share: number; ms: number };
}
export interface SmearSwapLike { figure?: string; fromPose?: string; toPose?: string; tMs?: number; stallMs?: number; figurePx?: number | null; snap?: boolean; id?: number; smear?: unknown; snapSmear?: boolean }
export interface SmearTally { planned: number; matched: number; unmatched: number; snapsExcused: number }
export declare const SMEAR_DEFAULTS: Readonly<SmearPolicy>;
export declare function smearPolicy(cfg: Partial<ContinuityConfig> | { smear?: Partial<SmearPolicy> } | null | undefined): SmearPolicy;
export declare function loggedAsBig(e: Pick<LoggedSmear, 'kind' | 'overlap' | 'anchorDistance' | 'big'>, policy: Pick<SmearPolicy, 'bigOverlap' | 'bigAnchor'>): boolean;
export declare function matchSmear(swap: SmearSwapLike, smears: LoggedSmear[], policy: SmearPolicy, frameMs?: number, used?: Set<number>): { index: number; entry: LoggedSmear } | null;
export declare function tagSmears(swaps: SmearSwapLike[], smears: LoggedSmear[] | undefined, policy: SmearPolicy, frameMs?: number): SmearTally;
export declare function smearCapPx(swap: SmearSwapLike | undefined, policy: SmearPolicy): number;
export declare function smearedJerk(jerk: Pick<Jerk, 'px'>, swap: SmearSwapLike | undefined, policy: SmearPolicy): { style: unknown; kind: unknown; swap: number | undefined; share?: number } | null;
export declare function figureHeightPx(frames: Array<{ fig: { s?: unknown[] } } | null | undefined>, k1600: number): number | null;
export interface GlideTally { cuts: number; feetExcused: number; feetSilExcused: number; worstPx: number; worstShare: number }
export declare function excuseGlideFeet(swaps: object[], policy: SmearPolicy, size?: { feetTolerancePx?: number; feetTolerancePxCoarse?: number }): GlideTally;
export declare function smearReport(o: { tally: SmearTally; jerks: Array<{ smeared?: unknown; px: number }>; policy: SmearPolicy; smears?: LoggedSmear[]; glide?: GlideTally }): Record<string, unknown>;
