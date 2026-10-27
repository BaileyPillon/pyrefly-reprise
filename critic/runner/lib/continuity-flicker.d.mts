/** Types for `critic/runner/lib/continuity-flicker.mjs`, so the unit tests can import it. */
export interface FlickerSwap {
  id: number;
  figure: string;
  fromPose: string;
  toPose: string;
  tMs: number;
  notShowing?: boolean;
  counted?: boolean;
  ghost?: { frames: number };
  flicker?: { n: number; role: 'out' | 'back'; gapMs: number; pair: string };
}
export interface Flicker {
  n: number;
  figure: string;
  pair: string;
  gapMs: number;
  ids: [number, number];
  ghostFrames: number;
  counted: boolean;
}
export interface FlickerSummary {
  windowMs: number;
  pairs: string[];
  count: number;
  countedPairs: number;
  perMinute: number;
  ghostFrames: number;
  ghostShare: number;
  ghostFramesPerMinute: number;
  byPair: Record<string, number>;
  byFigure: Record<string, number>;
  medianGapMs: number | null;
}

type FlickerConfig = { flicker?: { windowMs?: number; pairs?: string[] } } | null | undefined;

export declare const FLICKER_WINDOW_MS: number;
export declare const FLICKER_PAIRS: readonly string[];
export declare function flickerWindowMs(cfg?: FlickerConfig): number;
export declare function flickerPairs(cfg?: FlickerConfig): string[];
export declare function tagFlickers(swaps: FlickerSwap[], windowMs?: number, pairs?: readonly string[]): Flicker[];
export declare function flickerSummary(flickers: Flicker[], o: { battleSeconds: number; totalGhostFrames: number; windowMs: number; pairs?: readonly string[] }): FlickerSummary;
