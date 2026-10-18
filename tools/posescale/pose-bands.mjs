/**
 * **The bands a painting is judged in** (pose continuity, W1; both games). One place for the numbers, so the gate (`tools/pose-gate.mjs`), the static census and
 * the critic's checks (CHK-026) read the same ones. From the paper preflight `docs/plans/pose-continuity-review.md` section 1 and the release driver's
 * decisions of 2026-10-16 (Bailey: "pose continuity is the strongest recurring issue we need a permanent fix for this please."):
 *
 *   standing (strike, hurt, ready ...)   stature 0.90 to 1.10 of the idle's height, real head 0.85 to 1.15, feet within 2 percent
 *   low (critical, sleep, kneel)         stature 0.75 to 1.10 (the plan's parenthesis allows 0.70 for sleep and kneel: `LOW_STATURE_MIN`), head and feet as above
 *   a recorded hold                      widens the real head to 0.80 to 1.45 (r50.1, `tools/pose-scale-check.mjs`), nothing else
 *   ko                                   head only; the LENGTH 0.70 to 1.30 is REPORT-ONLY (undecided: Lulu's is 0.42)
 *   part (hull, fin, limb)               stance only
 *   wide (laid down, not a KO)           no stance, no height: the engine lays it down; accepted only where the idle is wide too (a hull), else `wide-pose`
 *   staged (FFX-2 twirl-*)               exempt, as today; FF7 stills exempt too (a painting with nothing opaque in it is `empty`, exempt or not)
 *
 * Degenerate paintings (the verifier's holes of 2026-10-17: a transparent painting, an opaque slab, one 14 px bar and a figure holding a full-height pole all read
 * `ok`, because the stature is the alpha bounding box only): a standing or low pose must also hold a figure's MASS (`BANDS.massGate`), a readable stance, some
 * overlap with its idle (`BANDS.iouFail`), a silhouette that is not a solid rectangle (`BANDS.solidityMax`), a body that is more than half of the height it claims (`BANDS.bodyOverStature`: a small figure holding a full-height pole)
 * and a head box that sits on the head (`BANDS.headBox`, only where the table registers one).
 *
 * The decision to rule the ruler per class (W3: head, height or their mean) is Bailey's; none of it is decided here. The readings come from
 * `pose-model.mjs`; nothing here reads a file.
 */

/** The model's own error: a hold's 0.90 reads 0.901, so a band edge gets half a percent of slack. */
export const SLACK = 0.005;

/**
 * What a stature read off the SCREEN (the critic's HEIGHT reading: the plane's quad through the camera and a resample of the alpha) may differ from the model's by,
 * on top of {@link SLACK}. The model and the screen agree to about half a percent; x2-ixion's hurt, stored 1.103 by the gate, reads 1.107 in play, and the band's edge
 * with the gate's slack is 1.105: without this the gate says ok and CHK-026 fails the same painting. Used by the critic only; the gate judges the model.
 */
export const READ_SLACK = 0.01;

/** Stature floors of the low class by pose. The driver's decision names 0.75 for the three; plan section 1 reads 0.70 for sleep and kneel. */
export const LOW_STATURE_MIN = Object.freeze({ critical: 0.75, sleep: 0.75, kneel: 0.75, weak: 0.75, low: 0.75 });

export const BANDS = Object.freeze({
  standing: { stature: [0.9, 1.1], head: [0.85, 1.15] },
  low: { stature: [0.75, 1.1], head: [0.85, 1.15] },
  ko: { head: [0.85, 1.15], length: [0.7, 1.3] },
  heldHead: [0.8, 1.45],
  /** The stance may sit this far (in idle heights) from the idle's. */
  feet: 0.02,
  /** A registered `feetRow` more than this fraction of the painting's height above its alpha baseline sinks the boots under the floor (the Lady Luck defect). */
  feetRowGap: 0.02,
  /** CHK-027's double image: overlap with the idle at or under `fail` is two figures at a 50/50 blend; under `watch` is a watch. */
  ghost: { fail: 0.2, watch: 0.3 },
  mass: [0.7, 1.3],
  /** A standing or low pose whose mass (square root of its opened area, over the idle's, at the size it is drawn) is outside this is not a figure of the idle's size: r50 reads 0.55 to 1.42. */
  massGate: [0.5, 1.7],
  /** A standing or low pose that overlaps its idle by less than this has nothing in common with it (r50's least is 0.054). */
  iouFail: 0.04,
  /** Where a registered head box sits on the painting: its centre no lower than this share of the figure's height from the top (r50: 0.54), and at least this share of it painted (r50: one box in 435 is under 0.15). */
  headBox: { cyMax: 0.62, coverageMin: 0.1 },
  /** A painting that fills this much of its own bounding box is a slab, not a figure (a rectangle fills it all; r50's most is 0.91, a boss that is a column, then 0.79). */
  solidityMax: 0.95,
  /** A standing or low pose whose body (head to soles) is under this share of the height its silhouette claims is a small figure holding something tall (r50's least is 0.59). */
  bodyOverStature: 0.5,
  /** A recorded hold's `headRatio` must equal its applied scale over its ruler reading (`held.reading`), to this much: the ratio is not free to type. */
  heldHeadGap: 0.02,
});

const outside = (v, [lo, hi], slack = SLACK) => v !== null && v !== undefined && Number.isFinite(v) && (v < lo - slack || v > hi + slack);

/** Classes no band judges. */
export const EXEMPT_CLASSES = Object.freeze(['staged']);

/** True when nothing about this reading is judged: a staged twirl painting, an FF7 still. */
export function isExempt(reading) {
  return EXEMPT_CLASSES.includes(reading.class) || reading.kind === 'ff7';
}

/**
 * Judge one reading (`readPose`) against its class's bands.
 * @returns {{exempt: boolean, flags: string[], report: string[], judged: string[]}}
 *   `flags` fail the gate unless the pose is waived: `empty`, `unregistered`, `stature-low|high`, `head-small|big`, `feet-x|y`, `feet-sunk`, `mass-low|high`,
 *   `no-stance`, `no-overlap`, `props-only`, `slab`, `head-off`, `no-head`, `held-head`, `wide-pose`;
 *   `report` never fails: `ko-short|long`, `ghost-fail|watch`, `mass`; `judged` names the axes that had a reading.
 */
export function bandVerdict(reading) {
  const flags = [];
  const report = [];
  const judged = [];
  if (reading.empty) return { exempt: false, flags: ['empty'], report, judged }; // nothing opaque: not a painting, and no exemption covers that
  const slab = Number.isFinite(reading.solidity) && reading.solidity > BANDS.solidityMax;
  if (slab && isExempt(reading)) return { exempt: false, flags: ['slab'], report, judged }; // exempt means not banded, never not read: a slab is no costume change
  if (isExempt(reading)) return { exempt: true, flags, report, judged };
  const cls = reading.class;
  if (!reading.hasRow) flags.push('unregistered');
  const headBand = reading.held ? BANDS.heldHead : (BANDS[cls]?.head ?? BANDS.standing.head);
  const judgeHead = () => {
    if (reading.headReal === null || reading.headReal === undefined) return;
    judged.push('head');
    if (outside(reading.headReal, headBand)) flags.push(reading.headReal < headBand[0] ? 'head-small' : 'head-big');
  };
  const judgeFeet = () => {
    for (const [v, tag] of [[reading.feet?.dy, 'feet-y'], [reading.feet?.dx, 'feet-x']]) {
      if (v === null || v === undefined) continue;
      judged.push(tag);
      if (Math.abs(v) > BANDS.feet) flags.push(tag);
    }
    judged.push('feet-sunk');
    if (reading.feetRowGap > BANDS.feetRowGap) flags.push('feet-sunk');
  };
  // a head box that is not on the head (its size is read from the table; this is the pixel check on where it sits), and a hold whose ratio was typed
  if (reading.headBox && cls !== 'part') {
    judged.push('head-box');
    const { cy, coverage } = reading.headBox;
    const standing = cls === 'standing' || cls === 'low';
    if (coverage < BANDS.headBox.coverageMin || (standing && cy > BANDS.headBox.cyMax)) flags.push('head-off');
  }
  if (reading.heldGap !== null && reading.heldGap !== undefined && reading.heldGap > BANDS.heldHeadGap) flags.push('held-head');
  if (slab) flags.push('slab');
  if (cls === 'wide' && !reading.refWide) flags.push('wide-pose');
  if (cls === 'standing' || cls === 'low') {
    if (reading.refHasHead && !reading.hasHead) flags.push('no-head');
    if (outside(reading.massRatio, BANDS.massGate, 0)) flags.push(reading.massRatio < BANDS.massGate[0] ? 'mass-low' : 'mass-high');
    if (reading.feetPx === null) flags.push('no-stance');
    if (reading.iou !== null && reading.iou !== undefined && reading.iou < BANDS.iouFail) flags.push('no-overlap');
    if (Number.isFinite(reading.bodyStature) && Number.isFinite(reading.stature) && reading.stature > 0 && reading.bodyStature / reading.stature < BANDS.bodyOverStature) flags.push('props-only');
    const floor = cls === 'low' ? (LOW_STATURE_MIN[reading.pose] ?? BANDS.low.stature[0]) : BANDS.standing.stature[0];
    const band = [floor, BANDS[cls].stature[1]];
    if (reading.stature !== null && reading.stature !== undefined) {
      judged.push('stature');
      if (outside(reading.stature, band)) flags.push(reading.stature < band[0] ? 'stature-low' : 'stature-high');
    }
    judgeHead();
    judgeFeet();
    if (!judged.includes('head') && outside(reading.massRatio, BANDS.mass, 0)) report.push('mass');
  } else if (cls === 'ko') {
    judgeHead();
    if (outside(reading.lengthRatio, BANDS.ko.length, 0)) report.push(reading.lengthRatio < BANDS.ko.length[0] ? 'ko-short' : 'ko-long');
  } else if (cls === 'part') {
    judgeFeet();
  }
  if (cls === 'standing' || cls === 'low') {
    const iou = reading.iou;
    if (iou !== null && iou !== undefined) {
      if (iou <= BANDS.ghost.fail) report.push('ghost-fail');
      else if (iou < BANDS.ghost.watch) report.push('ghost-watch');
    }
  }
  return { exempt: false, flags, report, judged };
}

/**
 * The status the installer writes for a reading: `held` when the pose rides a recorded hold and is in band, `ok` when it is in band, `waived` when the ledger
 * says so, `blocked` otherwise; `null` for what no band judges (a staged twirl painting, an FF7 still), which needs no row.
 * (`waived` comes from `docs/target/pose-waivers.json`, bound to the painting's sha; this function only reads that the caller found one.)
 */
export function proposeStatus(reading, { waived = false } = {}) {
  const v = bandVerdict(reading);
  if (v.exempt) return null;
  if (waived) return 'waived';
  if (v.flags.length) return 'blocked';
  return reading.held ? 'held' : 'ok';
}
