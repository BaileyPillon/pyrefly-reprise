// Continuity harness: the chapter's numbers and the two checks' verdicts (CHK-026 size continuity, CHK-027 continuity of motion).
//
// Split out of continuity-pure.mjs, which re-exports everything here (so every importer, the tests and the .d.mts stay as they were),
// to keep each file under the house limit of 400 lines. Pure like the rest: plain numbers and arrays in, plain numbers and arrays out.
//
// Game case: both (shared critic plumbing).

const round = (v, d) => { const k = 10 ** d; return Math.round(v * k) / k; };

/**
 * The chapter's numbers and the two checks' results.
 * @param {Array} swaps  analysed swaps (each `{ ...analyzeSwap, figure, from, to, n, t, atSwapJerk?, counted }`)
 * @param {Array} jerks  detected jerks
 * @param {number} battleSeconds seconds a battle was the screen being played (not paused)
 * @param {object} cfg   the policy's `continuity` block
 */
export function summarize({ swaps, jerks, battleSeconds, cfg }) {
  const counted = swaps.filter((s) => s.counted);
  const minutes = battleSeconds / 60;
  // CHK-026 judges a change of POSE: a swap between two dresspheres or two forms (`costume`) and a swap between two pose names that draw one painting
  // (`sameArt`) are counted and shown, and kept out of the size numbers (see analyzeSwap).
  const judged = counted.filter((s) => !s.costume && !s.sameArt);
  const costume = counted.filter((s) => s.costume);
  const heads = judged.filter((s) => s.head && s.head.ratio !== null);
  const regHeads = heads.filter((s) => s.head.source === 'registration');
  const worstHead = heads.reduce((m, s) => Math.max(m, Math.abs(s.head.ratio - 1)), 0);
  const worstHeadReg = regHeads.reduce((m, s) => Math.max(m, Math.abs(s.head.ratio - 1)), 0);
  const feetSwaps = judged.filter((s) => s.feet && s.feet.standing);
  const snaps = counted.filter((s) => s.snap);
  const hard = counted.filter((s) => s.hardCut);
  const ghostSwaps = counted.filter((s) => s.ghost.frames > 0);
  const failHead = judged.filter((s) => s.failHead);
  const failFeet = judged.filter((s) => s.failFeet);
  const ghostFail = counted.filter((s) => s.ghost.severity >= cfg.motion.ghostSeverityFail);
  const perMin = (n) => (minutes > 0 ? round(n / minutes, 2) : null);
  const bySnapPose = {};
  for (const s of snaps) bySnapPose[s.toPose] = (bySnapPose[s.toPose] ?? 0) + 1;
  const jerkMid = jerks.filter((j) => !j.atSwap);
  const summary = {
    battleSeconds: round(battleSeconds, 1),
    swaps: swaps.length, counted: counted.length, excludedByCut: swaps.filter((s) => s.camCut).length, excludedNotShowing: swaps.filter((s) => s.notShowing).length,
    swapsPerMinute: perMin(counted.length),
    size: {
      judged: judged.length, costumeSwaps: costume.length, sameArtSwaps: counted.length - judged.length - costume.length,
      costumeWorstHeadPct: round(costume.reduce((m, s) => (s.head && s.head.ratio !== null ? Math.max(m, Math.abs(s.head.ratio - 1)) : m), 0) * 100, 1),
      costumeWorstFeetPx: round(costume.reduce((m, s) => (s.feet && s.feet.standing ? Math.max(m, s.feet.px) : m), 0), 1),
      headMeasured: heads.length, headRegistration: regHeads.length, headSilhouette: heads.length - regHeads.length, headUnmeasured: judged.length - heads.length,
      maxHeadJumpPct: round(worstHead * 100, 1), maxHeadJumpPctRegistration: round(worstHeadReg * 100, 1),
      headOverTolerance: failHead.length,
      feetMeasured: feetSwaps.length, maxFeetShiftPx: round(feetSwaps.reduce((m, s) => Math.max(m, s.feet.px), 0), 1), feetOverTolerance: failFeet.length,
    },
    motion: {
      snaps: snaps.length, snapsPerMinute: perMin(snaps.length), hardCuts: hard.length, hardCutsPerMinute: perMin(hard.length), snapsByToPose: bySnapPose,
      lowestIou: round(counted.reduce((m, s) => (s.outline ? Math.min(m, s.outline.iou) : m), 1), 3),
      maxCentroidShiftPx: round(counted.reduce((m, s) => (s.outline ? Math.max(m, s.outline.centroidShiftPx) : m), 0), 1),
      ghostSwaps: ghostSwaps.length, ghostFrames: counted.reduce((n, s) => n + s.ghost.frames, 0), worstGhostSeverity: round(counted.reduce((m, s) => Math.max(m, s.ghost.severity), 0), 3), ghostOverFail: ghostFail.length,
      jerks: jerks.length, jerksMidMove: jerkMid.length, worstJerkPx: round(jerks.reduce((m, j) => Math.max(m, j.px), 0), 1), jerksOverFail: jerks.filter((j) => j.px >= cfg.motion.jerkFailPx).length,
    },
  };
  return { ...summary, checks: verdicts(summary, cfg) };
}

/**
 * CHK-026 and CHK-027 from a summary. UNVERIFIED (never PASS) when the run could not measure: too little battle,
 * no swap measured, or a frame rate too low to tell two frames apart.
 */
export function verdicts(s, cfg, run = {}) {
  const why = (arr) => arr.filter(Boolean);
  const unverified = why([
    s.battleSeconds < cfg.minBattleSeconds && `only ${s.battleSeconds} s of battle were played (needs ${cfg.minBattleSeconds})`,
    s.counted < cfg.minSwaps && `only ${s.counted} pose swaps were counted (needs ${cfg.minSwaps})`,
    run.fps != null && run.fps < cfg.minFps && `the page ran at ${run.fps} fps (needs ${cfg.minFps}): two frames of one swap cannot be told apart`,
    run.error && `the probe failed: ${run.error}`,
  ]);
  const size = why([
    s.size.headOverTolerance && `${s.size.headOverTolerance} swap(s) change a head by more than the tolerance (worst ${s.size.maxHeadJumpPct} percent; ${s.size.maxHeadJumpPctRegistration} percent where the head is registered)`,
    s.size.feetOverTolerance && `${s.size.feetOverTolerance} swap(s) of a standing figure move its feet more than the tolerance (worst ${s.size.maxFeetShiftPx} px at 1600 wide)`,
  ]);
  const motion = why([
    s.motion.snapsPerMinute != null && s.motion.snapsPerMinute > cfg.motion.snapsPerMinuteMax && `${s.motion.snapsPerMinute} snaps per minute is over ${cfg.motion.snapsPerMinuteMax}`,
    s.motion.jerksOverFail && `${s.motion.jerksOverFail} jerk(s) of ${cfg.motion.jerkFailPx} px or more in one frame (worst ${s.motion.worstJerkPx} px)`,
    s.motion.ghostOverFail && `${s.motion.ghostOverFail} swap(s) show a double image of severity ${cfg.motion.ghostSeverityFail} or more (worst ${s.motion.worstGhostSeverity})`,
  ]);
  const result = (reasons) => (unverified.length ? 'UNVERIFIED' : reasons.length ? 'FAIL' : 'PASS');
  // what a PASS rests on: how many swaps had a registered head (judged at 3 percent) and how many were read by mass (30 percent)
  const basis = `${s.size.headRegistration} of ${s.size.headMeasured} measured swaps had a registered head (tolerance ${cfg.size.headTolerancePct} percent); ${s.size.headSilhouette} were read by the figure's mass (tolerance ${cfg.size.headTolerancePctCoarse} percent, whole-figure jumps only); ${s.size.headUnmeasured} had no reading`;
  return {
    'CHK-026': { result: result(size), reasons: unverified.length ? unverified : size, note: basis },
    'CHK-027': { result: result(motion), reasons: unverified.length ? unverified : motion },
  };
}

/**
 * The worst `n` swaps, most broken first. A swap's badness is its largest exceedance of the thresholds, so a
 * 40 percent head jump and a 119 px slide each outrank a mild ghost; a snap or a double image adds weight.
 */
export function swapBadness(s, cfg) {
  const sized = !s.costume && !s.sameArt; // a costume change and a swap of one painting to itself are not judged on size or feet
  const head = sized && s.head && s.head.ratio !== null ? Math.abs(s.head.ratio - 1) * 100 / (s.head.source === 'registration' ? cfg.size.headTolerancePct : cfg.size.headTolerancePctCoarse) : 0;
  const feet = sized && s.feet && s.feet.standing ? s.feet.px / (s.feet.source === 'registration' ? cfg.size.feetTolerancePx : cfg.size.feetTolerancePxCoarse) : 0;
  const outline = s.outline ? (1 - s.outline.iou) / 0.25 : 0;
  const ghost = s.ghost.severity / Math.max(0.01, cfg.motion.ghostSeverityFail);
  return Math.max(head, feet, outline, ghost) + (s.snap ? 0.5 : 0);
}

/**
 * Up to `n` items, the first of each distinct `key` before any repeat of one (a build that has the same defect at every
 * Auron attack shows the reviewer the Auron strip once, then the next pair, not ten copies); repeats fill what is left.
 */
export function distinctFirst(list, key, n) {
  const seen = new Set(), first = [], rest = [];
  for (const x of list) { const k = key(x); if (seen.has(k)) rest.push(x); else { seen.add(k); first.push(x); } }
  return [...first, ...rest].slice(0, n);
}

/** The worst `n` counted swaps, worst first, one per figure and pose pair before any repeat. */
export function worstSwaps(swaps, n, cfg) {
  const ranked = swaps.filter((s) => s.counted).map((s) => ({ s, b: swapBadness(s, cfg) })).sort((x, y) => y.b - x.b).map((x) => x.s);
  return distinctFirst(ranked, (s) => `${s.figure}|${s.fromPose}|${s.toPose}`, n);
}
