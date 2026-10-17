export const RULE_ID: string;
export const RULE_BY: string;
export const r3: (v: number) => number;
export interface RuleResult {
  /** The table's scale (three decimals). */
  scale: number;
  /** The unrounded geometric mean of the head and height scales. */
  mean: number;
  /** What the stature band moved: the floor, the ceiling, or `refused` (no single size is in band, the mean stands); null when the mean stood as it was. */
  lift: 'floor' | 'ceiling' | 'refused' | null;
  /** The head cost is recorded as a hold (stature lifted, or the head outside 0.85 to 1.15 and inside 0.80 to 1.45). */
  held: boolean;
  /** The head the player sees over the idle's: the applied scale over the head scale. */
  headRatio: number;
  /** The judged stature (box, or head to soles for a props-out pose): the applied scale over the height scale. */
  stature: number;
}
export function ruleSize(o: { head: number; height: number; floor: number; ceiling?: number }): RuleResult;
export function virtualHeadBox(o: { anchor: number[]; idleHead: number[]; scale: number }): [number, number, number, number];
