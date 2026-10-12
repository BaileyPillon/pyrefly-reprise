export type Quality = 'V0' | 'q3' | 'q5';

export const RATE_BPS: Readonly<Record<Quality, number>>;
export const GAP_SECONDS: number;
export const PACK_GATE_BYTES: number;
export function packBytes(seconds: number, cues: number, quality: Quality): number;

export interface LayoutRow {
  id: string;
  /** The pack the row's cue ships in. */
  pack: string;
  /** Length of the cue in seconds (the row's requested length; the mastered cue lands within 20 percent). */
  secs: number;
  /** `both`: a menu asset both games share, which each game's core pack carries a copy of. */
  game: 'ffx' | 'ffx2' | 'both';
}

export interface LayoutInput {
  rows: readonly LayoutRow[];
  /** `AUDIO_BUDGET_BYTES`. */
  budgetBytes: number;
  /** Everything already shipped except the parity packs: music, the two sprites, the manifest. */
  shippedBytes: number;
  /** Bytes the v2 repack gives back; 0 until cues retire. */
  repackSavingBytes?: number;
  /** Free space to keep under the budget for the next music or fix; default 0. */
  reserveBytes?: number;
  /** Packs that count as core (loaded in every chapter of their game); the rest are boss packs. */
  isCore?: (pack: string) => boolean;
}

export interface PackPlan {
  pack: string;
  kind: 'core' | 'boss';
  quality: Quality;
  cues: number;
  seconds: number;
  bytes: number;
}

export interface Lever {
  /** Which lever (0 to 3), or `x` for the two beyond the spec's list. */
  lever: 0 | 1 | 2 | 3 | 'x';
  what: string;
  /** Bytes this step saved (0 for a report). */
  savedBytes: number;
  /** Beyond the spec's list: needs Bailey's yes before anyone applies it. */
  needsYes?: boolean;
}

export interface TrimCandidate {
  row: string;
  pack: string;
  secs: number;
  savedBytes: number;
  cutTo: number;
}

export interface LayoutPlan {
  packs: PackPlan[];
  packBytes: number;
  allowanceBytes: number;
  headroomBytes: number;
  fits: boolean;
  levers: Lever[];
  trimCandidates: TrimCandidate[];
  problems: string[];
}

export function groupRows(rows: readonly LayoutRow[]): Map<string, { rows: LayoutRow[]; seconds: number }>;
export function planLayout(input: LayoutInput): LayoutPlan;
