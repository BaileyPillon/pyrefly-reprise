import type { RuleResult } from './pose-rule.mjs';

export { RULE_BY, RULE_ID, ruleSize, virtualHeadBox } from './pose-rule.mjs';
export interface RuledPose {
  subject: string;
  pose: string;
  game: string;
  cls: 'standing' | 'low';
  basis: 'box' | 'body';
  head: number;
  height: number;
  mean: number;
  scale: number;
  lift: RuleResult['lift'];
  held: boolean;
  headRatio: number;
  stature: number;
  was: { scale: number | null; src: string | undefined };
}
export function ruleRecords(o?: {
  root?: string;
  artDir?: string;
  records?: object;
  rows?: object;
  subjects?: string[];
  onSubject?: (s: string) => void;
}): Promise<{ rules: RuledPose[]; patches: Record<string, Record<string, Record<string, unknown>>> }>;
export function applyPatch(rec: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown>;
export function diffRecords(records: { subjects: Record<string, any> }, rules: RuledPose[]): string[];
