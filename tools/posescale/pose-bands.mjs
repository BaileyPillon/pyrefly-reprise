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
 *   wide (laid down, not a KO)           no stance, no height: the engine lays it down; listed
 *   staged (FFX-2 twirl-*)               exempt, as today; FF7 stills exempt too
 *
 * The decision to rule the ruler per class (W3: head, height or their mean) is Bailey's; none of it is decided here. The readings come from
 * `pose-model.mjs`; nothing here reads a file.
 */

/** The model's own error: a hold's 0.90 reads 0.901, so a band edge gets half a percent of slack. */
export const SLACK = 0.005;

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
 *   `flags` fail the gate unless the pose is waived: `unregistered`, `stature-low|high`, `head-small|big`, `feet-x|y`, `feet-sunk`;
 *   `report` never fails: `ko-short|long`, `ghost-fail|watch`, `mass`; `judged` names the axes that had a reading.
 */
export function bandVerdict(reading) {
  const flags = [];
  const report = [];
  const judged = [];
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
  if (cls === 'standing' || cls === 'low') {
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
