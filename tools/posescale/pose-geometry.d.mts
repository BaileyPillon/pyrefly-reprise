export const clamp: (v: number, lo: number, hi: number) => number;
export const PRONE_ASPECT: number;
export const HEAD_LOCK_BAND: number[];
export const EXTENT: { max: number; min: number };

export interface Measured {
  pose: string;
  W: number;
  H: number;
  engineBase: number | null;
  engineBox: { x0: number; x1: number; y0: number; y1: number } | null;
  stance: { x: number; row: number } | null;
  sidecar: Record<string, any>;
  [k: string]: unknown;
}
type Row = Record<string, any>;
export function poseScaleOf(m: Measured, row: Row | undefined, koScale: Record<string, number>, subject: string): { scale: number | null; src: 'reg' | 'ko-table' | 'sidecar' | 'none' };
export function anchorOf(m: Measured, row: Row | undefined): { anchor: number; src: 'feetRow' | 'sidecar-anchorY' | 'baseline' };

export interface Ref {
  subject: string;
  refName: string;
  M: Measured;
  upp: number;
  anchor: number;
  figH: number;
  mirror: number;
  stanceMeasured: number | null;
  [k: string]: any;
}
export function makeRef(o: {
  subject: string;
  refName: string;
  ref: Measured;
  reg: Record<string, Row>;
  koScale: Record<string, number>;
  want: number;
  facingOf: (m: any) => string | null;
  mirrorFor: (facing: string | null, want: number) => number;
}): Ref;
export function placePose(
  R: Ref,
  m: Measured,
  o: { row?: Row; rec?: Row; koScale: Record<string, number>; facingOf: (m: any) => string | null; mirrorFor: (facing: string | null, want: number) => number },
): {
  isRef: boolean; prone: boolean; clamped: boolean; facing: string | null; mirror: number;
  scale: number | null; scaleSrc: string; anchor: number; anchorSrc: string; upp: number; uppEff: number; lock: number | null; shift: number;
  statureTable: number | null; stature: number | null; bodyStature: number | null; lengthRatio: number | null; headTable: number | null; headEff: number | null; headReal: number | null;
  held: boolean; heldHeadRatio: number | null; ruled: boolean; realHeadRatio: number | null; hasRow: boolean; hasHead: boolean; hasStance: boolean; stanceRegistered: number | null; stanceDiffPx: number | null;
  feetDx: number | null; feetDy: number | null; feetRowGap: number; sinkIdle: number | null;
  drawn: { upp: number; anchor: number; shift: number; mirror: number };
};
