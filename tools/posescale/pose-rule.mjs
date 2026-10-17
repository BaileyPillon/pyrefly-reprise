/**
 * **The W3 sizing rule, on numbers** (pose continuity, W3; both games): `ruleSize` turns a pose's head scale and height scale into the scale it is drawn at, and `virtualHeadBox`
 * the head box the table registers for it. Pure: no file, no pixel, no `sharp` (`pose-ruler.mjs` reads the paintings and calls this; `tools/pose-scale-check.mjs` re-derives a
 * record's scale from it). The rule and why it is this one: the header of `pose-ruler.mjs`.
 */
import { BANDS, SLACK, STATURE_CEILING } from './pose-bands.mjs';

export const r3 = (v) => Math.round(v * 1000) / 1000;
const r1 = (v) => Math.round(v * 10) / 10;
/** To the table's thousandth, a hair toward the band: a lift to the floor never lands under it, a hold to the ceiling never over it. */
const up3 = (v) => Math.ceil(v * 1000 - 1e-9) / 1000;
const down3 = (v) => Math.floor(v * 1000 + 1e-9) / 1000;
const within = (v, [lo, hi]) => v >= lo - SLACK && v <= hi + SLACK;

/** The rule's name in the records (`ruled.rule`); a change of rule changes it, and every record that carries another is stale. */
export const RULE_ID = 'geomean/1';

/** Whose word the rule is, written into every recorded hold (`held.by`). */
export const RULE_BY = 'the W3 sizing rule (pick 89e, the release driver), under Bailey 2026-10-16: "pose continuity is the strongest recurring issue we need a permanent fix for this please." and his standing "I\'ll go with all of your recommendations"';

/**
 * The rule, on two numbers. Pure.
 * @param {{head: number, height: number, floor: number, ceiling?: number}} o `head`: the scale that makes the pose's head the idle's; `height`: the scale that makes its (judged) stature 1.0
 * @returns {{scale: number, mean: number, lift: 'floor'|'ceiling'|'refused'|null, held: boolean, headRatio: number, stature: number}}
 *   `scale`: the table's scale (three decimals); `mean`: the unrounded geometric mean; `lift`: what the stature band moved (`refused`: no single size is in band, the mean stands);
 *   `held`: the head cost is recorded (the head is outside 0.85 to 1.15 and inside 0.80 to 1.45); `headRatio`: the head the player sees over the idle's; `stature`: the judged stature.
 */
export function ruleSize({ head, height, floor, ceiling = STATURE_CEILING }) {
  if (!(head > 0) || !(height > 0)) throw new Error(`ruleSize: head ${head} and height ${height} must be positive scales`);
  const mean = Math.sqrt(head * height);
  const statureAt = (s) => s / height;
  let scale = r3(mean);
  let lift = null;
  if (statureAt(mean) < floor - 1e-9) { scale = up3(floor * height); lift = 'floor'; }
  else if (statureAt(mean) > ceiling + 1e-9) { scale = down3(ceiling * height); lift = 'ceiling'; }
  let headRatio = scale / head;
  if (!within(headRatio, BANDS.heldHead)) {
    // no single size puts the pose in band: the mean stands, the pose keeps its waiver and goes to repaint
    scale = r3(mean);
    headRatio = scale / head;
    return { scale, mean, lift: 'refused', held: false, headRatio, stature: statureAt(scale) };
  }
  const held = lift !== null || !within(headRatio, BANDS.standing.head);
  return { scale, mean, lift, held, headRatio, stature: statureAt(scale) };
}

/** The virtual head box (px of the pose's painting) the table registers for a size: the idle's head box over the applied scale, centred on the head. */
export function virtualHeadBox({ anchor, idleHead, scale }) {
  const bw = idleHead[2] - idleHead[0];
  const bh = idleHead[3] - idleHead[1];
  return [r1(anchor[0] - bw / scale / 2), r1(anchor[1] - bh / scale / 2), r1(anchor[0] + bw / scale / 2), r1(anchor[1] + bh / scale / 2)];
}

