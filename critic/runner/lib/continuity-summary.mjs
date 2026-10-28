// Continuity harness: the chapter's numbers and the two checks' verdicts (CHK-026 size continuity, CHK-027 continuity of motion).
//
// Split out of continuity-pure.mjs, which re-exports everything here (so every importer, the tests and the .d.mts stay as they were),
// to keep each file under the house limit of 400 lines. Pure like the rest: plain numbers and arrays in, plain numbers and arrays out.
//
// Game case: both (shared critic plumbing).

import { HELD_MIN_FRAMES } from './continuity-held.mjs';
import { ghostMsBlock, ghostRateText } from './continuity-ghostms.mjs';

const round = (v, d) => { const k = 10 ** d; return Math.round(v * k) / k; };

/**
 * The frame-time number (W4): how the frame clock ran, from the time between consecutive drawn frames of a recording (ms). It is shown beside the jerks, never gated: the game clamps its
 * animation step at 50 ms and every move advances by all of it in ONE drawn frame, so a hitch multiplies a lunge, a dissolve or a recoil (angle 2 of the 2026-10-16 survey: 63 percent of
 * FFX jerks fell on a frame over 34 ms), and the harness's own canvas copy and strip encoding are in it. `longMs` is the line for a long frame (34 ms: two frames at 60 Hz).
 * @param {number[]} dts frame-to-frame times in ms
 * @returns {null | {frames:number, p50Ms:number, p90Ms:number, p99Ms:number, maxMs:number, longFrames:number, longFramePct:number, longMs:number}}
 */
export function frameTimeOf(dts, longMs = 34) {
  if (!dts.length) return null;
  const s = [...dts].sort((a, b) => a - b);
  const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  const longFrames = s.filter((v) => v > longMs).length;
  // T-01 (lane L5, PACE-08): the probe's own per-frame work and its strip encoding are in these times (it read Chapter IV as 409 frames over 34 ms where the same fight with only the in-page recorder has 4), so this is the
  // harness's load, NOT the game's pacing: `pacingNumber: false` says so in the file; the game's pacing is read by tools/pace.mjs (critic/runner/lib/pace-init.page.js, pace-pure.mjs).
  return { frames: s.length, p50Ms: round(q(0.5), 1), p90Ms: round(q(0.9), 1), p99Ms: round(q(0.99), 1), maxMs: round(s[s.length - 1], 1), longFrames, longFramePct: round((longFrames / s.length) * 100, 1), longMs, source: 'continuity-probe', pacingNumber: false };
}

/**
 * The chapter's numbers and the two checks' results.
 * @param {Array} swaps  analysed swaps (each `{ ...analyzeSwap, figure, from, to, n, t, atSwapJerk?, counted }`)
 * @param {Array} jerks  detected jerks, the ones the player can see (r43: a jerk under the Save Sphere's wash is in `coveredJerks`, not here)
 * @param {Array} [coveredJerks] jerks excused because their step happened under the wash (continuity-wash.mjs): counted and shown, never judged
 * @param {number} battleSeconds seconds a battle was the screen being played (not paused)
 * @param {object} cfg   the policy's `continuity` block
 */
export function summarize({ swaps, jerks, coveredJerks = [], smearedJerks = [], smear = null, battleSeconds, cfg, frameTime = null }) {
  const counted = swaps.filter((s) => s.counted);
  const minutes = battleSeconds / 60;
  // CHK-026 judges a change of POSE: a swap between two dresspheres or two forms (`costume`) and a swap between two pose names that draw one painting
  // (`sameArt`) are counted and shown, and kept out of the size numbers (see analyzeSwap).
  const judged = counted.filter((s) => !s.costume && !s.sameArt);
  const costume = counted.filter((s) => s.costume);
  const heads = judged.filter((s) => s.head && s.head.ratio !== null);
  const regHeads = heads.filter((s) => s.head.source === 'registration');
  // R57-002: a RIGGED figure's head is read from its own head mesh (continuity-rig.mjs), judged at the registered tolerance; a rig whose key hides the head is read by mass, as a painting with no registered head is
  const rigHeads = heads.filter((s) => s.head.source === 'rig' && s.head.metric === 'head');
  const worstHead = heads.reduce((m, s) => Math.max(m, Math.abs(s.head.ratio - 1)), 0);
  const worstHeadReg = regHeads.reduce((m, s) => Math.max(m, Math.abs(s.head.ratio - 1)), 0);
  const worstHeadRig = rigHeads.reduce((m, s) => Math.max(m, Math.abs(s.head.ratio - 1)), 0);
  const feetSwaps = judged.filter((s) => s.feet && s.feet.standing);
  const snaps = counted.filter((s) => s.snap);
  const hard = counted.filter((s) => s.hardCut);
  const ghostSwaps = counted.filter((s) => s.ghost.frames > 0);
  const failHead = judged.filter((s) => s.failHead);
  const failFeet = judged.filter((s) => s.failFeet);
  const feetDesigned = judged.filter((s) => s.feetDesigned || s.feetSil?.designed); // MF-18: a planned cut's designed sideways shift (continuity-smear.mjs, excuseGlideFeet): excused, kept, counted apart
  // T-02 (lane L5): a DESIGNED blend the planner declared (continuity-why.mjs; the policy's classes.designedBlend.excuse, off by default) of at most its maxSeverity is reported apart and is not a double image to fail
  const ghostFail = counted.filter((s) => s.ghost.severity >= cfg.motion.ghostSeverityFail && !s.designedExcused);
  const perMin = (n) => (minutes > 0 ? round(n / minutes, 2) : null);
  const bySnapPose = {};
  for (const s of snaps) bySnapPose[s.toPose] = (bySnapPose[s.toPose] ?? 0) + 1;
  const jerkMid = jerks.filter((j) => !j.atSwap || j.commonMode); // R63-M1: a step at a swap that is the figure TRAVELLING (head and feet together) is a dash, reported (continuity-analyze.mjs, `jerks.commonMode`)
  // W4 (CHK-027 split): a jerk AT a pose swap is the swap's own (a dissolve moving the weighted point, a KO cut, the swap's first lunge frame) and is gateable; a MID-MOVE dash is the
  // move's (a lunge, a recoil, a hop) and is reported. Each is also read by the frame it fell on: a long frame (the game's own clamp multiplying every move) is not the design.
  const swapJerks = jerks.filter((j) => j.atSwap && !j.commonMode);
  const teleports = jerkMid.filter((j) => j.kind === 'teleport'), dashes = jerkMid.filter((j) => j.kind !== 'teleport');
  const longFrame = (j) => j.longFrame === true;
  const failPx = cfg.motion.jerkFailPx;
  // W4 (CHK-026): the readings from the pixels. A height or feet or hold failure is `fail*` (unwaived); the same flagged and waived is shown, never failed.
  const heights = judged.filter((s) => s.height);
  const statures = heights.filter((s) => s.height.stature !== null).map((s) => s.height.stature);
  const koLengths = heights.filter((s) => s.height.length !== null).map((s) => s.height.length);
  const heightFlagged = heights.filter((s) => s.height.flags.length);
  const feetSil = judged.filter((s) => s.feetSil && s.feetSil.standing);
  const feetSilOver = feetSil.filter((s) => s.feetSil.gatePx > s.feetSil.tolerancePx && !s.feetSil.designed);
  // a recorded hold's head, and (R59, decision 146) the head of a rig's front-view key, which swaps the head part: both are "the head the player really sees", judged in a band, and counted apart
  const holds = judged.filter((s) => s.headReal && !s.headReal.variant);
  const holdOutside = holds.filter((s) => s.headReal.outsideBand);
  const variantHeads = judged.filter((s) => s.headReal && s.headReal.variant);
  // r40 instrument edit (b): a step of the spherechange's twirl is a staged costume change, counted per CHANGE (its steps share `staged.seq`), not per step. The cuts it
  // excused from the snap count (`stagedSnapsExcused`) and the jerks that fall at one of its steps (`jerksAtStaged`) are shown; the jerks stay in `jerks` and in the verdict.
  const stagedSwaps = counted.filter((s) => s.staged);
  // r40 instrument edit (c): a frozen blend, read from the fades (continuity-held.mjs)
  const held = counted.filter((s) => s.held && s.held.frames >= HELD_MIN_FRAMES);
  const summary = {
    battleSeconds: round(battleSeconds, 1),
    swaps: swaps.length, counted: counted.length, excludedByCut: swaps.filter((s) => s.camCut).length, excludedNotShowing: swaps.filter((s) => s.notShowing).length,
    swapsPerMinute: perMin(counted.length),
    size: {
      judged: judged.length, costumeSwaps: costume.length, sameArtSwaps: counted.length - judged.length - costume.length,
      costumeWorstHeadPct: round(costume.reduce((m, s) => (s.head && s.head.ratio !== null ? Math.max(m, Math.abs(s.head.ratio - 1)) : m), 0) * 100, 1),
      costumeWorstFeetPx: round(costume.reduce((m, s) => (s.feet && s.feet.standing ? Math.max(m, s.feet.px) : m), 0), 1),
      headMeasured: heads.length, headRegistration: regHeads.length, headRig: rigHeads.length, headSilhouette: heads.length - regHeads.length - rigHeads.length, headUnmeasured: judged.length - heads.length,
      maxHeadJumpPct: round(worstHead * 100, 1), maxHeadJumpPctRegistration: round(worstHeadReg * 100, 1), maxHeadJumpPctRig: round(worstHeadRig * 100, 1), rigSwaps: judged.filter((s) => s.rig).length,
      headOverTolerance: failHead.length,
      feetMeasured: feetSwaps.length, maxFeetShiftPx: round(feetSwaps.reduce((m, s) => (s.feetDesigned ? m : Math.max(m, s.feet.px)), 0), 1), feetOverTolerance: failFeet.length,
      feetDesigned: feetDesigned.length, feetDesignedWorstPx: round(feetDesigned.reduce((m, s) => Math.max(m, s.feetDesigned?.px ?? s.feetSil?.px ?? 0), 0), 1),
      // W4: the HEIGHT reading (a pose drawn against the idle in the same frame, from the alpha masks and the planes' quads; stature, or length for a KO, which is report-only)
      heightMeasured: heights.length, heightOverBand: judged.filter((s) => s.failHeight).length, heightWaived: heightFlagged.filter((s) => !s.failHeight).length,
      minStature: statures.length ? round(Math.min(...statures), 3) : null, maxStature: statures.length ? round(Math.max(...statures), 3) : null,
      koLengthMeasured: koLengths.length, minKoLength: koLengths.length ? round(Math.min(...koLengths), 3) : null, koLengthReported: heights.filter((s) => s.height.report.length).length,
      // W4: the FEET reading from the silhouette's own stance (the registered stance passes by construction; the pixels do not lie)
      feetSilMeasured: feetSil.length, feetSilOver: judged.filter((s) => s.failFeetSil).length, feetSilWaived: feetSilOver.filter((s) => !s.failFeetSil).length,
      maxFeetSilPx: round(feetSil.reduce((m, s) => (s.feetSil.designed ? m : Math.max(m, s.feetSil.gatePx)), 0), 1),
      // W4: the head the player really sees across a recorded hold (the head reading is a CONTROL: a hold's registered box is a virtual one)
      holdSwaps: holds.length, worstRealHeadPct: round(holds.reduce((m, s) => Math.max(m, Math.abs(s.headReal.ratio - 1)), 0) * 100, 1), realHeadOutsideBand: holds.filter((s) => s.failRealHead).length,
      realHeadWaived: holdOutside.filter((s) => !s.failRealHead).length,
      // R59: a rig's change of key that swaps the head part (Lulu's front view): the head the registration gives the key, against its class band; the mesh ratio of the head part is not read for it
      variantHeadSwaps: variantHeads.length, worstVariantHeadPct: round(variantHeads.reduce((m, s) => Math.max(m, Math.abs(s.headReal.ratio - 1)), 0) * 100, 1), variantHeadOutsideBand: variantHeads.filter((s) => s.failRealHead).length,
      // painting of a character subject with no fresh record (reported; the gate refuses it at install)
      unregisteredSwaps: judged.filter((s) => s.unregistered).length,
    },
    motion: {
      snaps: snaps.length, snapsPerMinute: perMin(snaps.length), hardCuts: hard.length, hardCutsPerMinute: perMin(hard.length), snapsByToPose: bySnapPose,
      lowestIou: round(counted.reduce((m, s) => (s.outline ? Math.min(m, s.outline.iou) : m), 1), 3),
      maxCentroidShiftPx: round(counted.reduce((m, s) => (s.outline ? Math.max(m, s.outline.centroidShiftPx) : m), 0), 1),
      ghostSwaps: ghostSwaps.length, ghostFrames: counted.reduce((n, s) => n + s.ghost.frames, 0), worstGhostSeverity: round(counted.reduce((m, s) => Math.max(m, s.ghost.severity), 0), 3), ghostOverFail: ghostFail.length,
      // fluidity pass, T-01 (lane L5): the see-through time in MILLISECONDS is the primary number, the frame counts are its 60 Hz convenience. A 120 ms blend is 7 frames at 60 Hz and 17 at 144 Hz, so a frame count reads
      // 2.4 times higher on a 144 Hz capture for the same double image; the ms are each swap's own (`ghost.ms`, the time between the drawn frames that showed it) and do not depend on the display (continuity-ghostms.mjs).
      ...ghostMsBlock(counted, minutes),
      ghostDesignedExcused: counted.filter((s) => s.designedExcused).length,
      jerks: jerks.length, jerksMidMove: jerkMid.length, worstJerkPx: round(jerks.reduce((m, j) => Math.max(m, j.px), 0), 1), jerksOverFail: jerks.filter((j) => j.px >= failPx).length,
      swapJerks: swapJerks.length, swapJerksWorstPx: round(swapJerks.reduce((m, j) => Math.max(m, j.px), 0), 1), swapJerksOverFail: swapJerks.filter((j) => j.px >= failPx).length,
      teleports: teleports.length, teleportsWorstPx: round(teleports.reduce((m, j) => Math.max(m, j.px), 0), 1),
      dashes: dashes.length, dashesWorstPx: round(dashes.reduce((m, j) => Math.max(m, j.px), 0), 1), dashesOverFail: dashes.filter((j) => j.px >= failPx).length,
      // by the frame the step fell on (the game's frame clock clamps at 50 ms and every move advances by it in ONE drawn frame): the count the design owns is the steady one
      jerksLongFrame: jerks.filter(longFrame).length, swapJerksLongFrame: swapJerks.filter(longFrame).length, swapJerksSteadyOverFail: swapJerks.filter((j) => !longFrame(j) && j.px >= failPx).length,
      heldSwaps: held.length, longestHeldFrames: counted.reduce((m, s) => Math.max(m, s.held ? s.held.frames : 0), 0),
      stagedChanges: new Set(stagedSwaps.map((s) => `${s.figure}|${s.staged.seq}`)).size, stagedSteps: stagedSwaps.length,
      stagedSnapsExcused: stagedSwaps.filter((s) => s.snapStaged).length, jerksAtStaged: jerks.filter((j) => j.staged).length,
      jerksCovered: coveredJerks.length, worstCoveredJerkPx: round(coveredJerks.reduce((m, j) => Math.max(m, j.px), 0), 1),
      // motion pass (lane "core", step 2): planned smears (continuity-smear.mjs). The cuts the engine logged, the swaps that matched one, the snaps and the swap jerks they excused; a chapter summarised before has none.
      smearsPlanned: smear ? smear.planned : 0, smearSwaps: smear ? smear.matched : 0, smearSnapsExcused: smear ? smear.snapsExcused : 0,
      jerksSmeared: smearedJerks.length, worstSmearedJerkPx: round(smearedJerks.reduce((m, j) => Math.max(m, j.px), 0), 1),
    },
  };
  // W4: the frame-time number, apart from the jerks: how the frame clock itself ran (percentiles of the time between drawn frames of the recording). It is the harness's own
  // load as much as the game's (the canvas copy and the strip encoding are in it), so it is shown, never gated; a run with the animation clock bounded measures the design.
  summary.frameTime = frameTime;
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
    s.size.heightOverBand && `${s.size.heightOverBand} swap(s) draw a pose outside its height band against the idle, read from the pixels (stature ${s.size.minStature} to ${s.size.maxStature}; the bands are tools/posescale/pose-bands.mjs's)`,
    s.size.feetSilOver && `${s.size.feetSilOver} swap(s) of a standing figure move the silhouette's own stance more than the tolerance (worst ${s.size.maxFeetSilPx} px at 1600 wide), whatever stance the registration claims`,
    s.size.realHeadOutsideBand && `${s.size.realHeadOutsideBand} swap(s) show a recorded hold's real head outside the hold band (worst ${s.size.worstRealHeadPct} percent from the idle's)`,
    s.size.variantHeadOutsideBand && `${s.size.variantHeadOutsideBand} rig swap(s) bring in another head (a front view) whose real head is outside its pose class's band (worst ${s.size.worstVariantHeadPct} percent from the idle's)`,
  ]);
  // W4 (CHK-027 split): the jerks AT a swap are gateable, the mid-move dashes are reported. A policy without a `jerks` block (an older one) gates every jerk, as before.
  const dashesFail = cfg.jerks ? cfg.jerks.dashesFail === true : true;
  const swapOver = s.motion.swapJerksOverFail ?? s.motion.jerksOverFail ?? 0;
  const dashOver = s.motion.dashesOverFail ?? 0;
  const teleOver = s.motion.teleports ?? 0;
  const hasSplit = s.motion.swapJerksOverFail !== undefined;
  const motion = why([
    s.motion.snapsPerMinute != null && s.motion.snapsPerMinute > cfg.motion.snapsPerMinuteMax && `${s.motion.snapsPerMinute} snaps per minute is over ${cfg.motion.snapsPerMinuteMax}`,
    swapOver && (hasSplit ? `${swapOver} jerk(s) of ${cfg.motion.jerkFailPx} px or more in one frame AT A POSE SWAP (worst ${s.motion.swapJerksWorstPx} px)` : `${swapOver} jerk(s) of ${cfg.motion.jerkFailPx} px or more in one frame (worst ${s.motion.worstJerkPx} px)`),
    hasSplit && teleOver && `${teleOver} MID-MOVE teleport(s) of ${cfg.jerks?.teleportPx ?? '?'} px or more in one frame (worst ${s.motion.teleportsWorstPx} px: no lunge covers its whole reach in one frame)`,
    hasSplit && dashesFail && dashOver && `${dashOver} jerk(s) of ${cfg.motion.jerkFailPx} px or more in one frame MID-MOVE (dashes, worst ${s.motion.dashesWorstPx} px; jerks.dashesFail is on)`,
    s.motion.ghostOverFail && `${s.motion.ghostOverFail} swap(s) show a double image of severity ${cfg.motion.ghostSeverityFail} or more (worst ${s.motion.worstGhostSeverity})`,
  ]);
  const motionNotes = why([
    hasSplit && !dashesFail && dashOver && `${dashOver} mid-move dash(es) of ${cfg.motion.jerkFailPx} px or more are REPORTED, not gated (worst ${s.motion.dashesWorstPx} px; a recoil, a lunge or a hop is the move's own, not a pose swap's; jerks.dashesFail in the policy gates them)`,
    hasSplit && (s.motion.swapJerksLongFrame || s.motion.jerksLongFrame) && `${s.motion.jerksLongFrame} of ${s.motion.jerks} jerk(s) fell on a frame of more than ${cfg.motion.longFrameMs ?? 34} ms (${s.motion.swapJerksLongFrame} of the ${s.motion.swapJerks} at a swap; ${s.motion.swapJerksSteadyOverFail} of the swap jerks over the line on a steady frame): the frame clock multiplies every move, so read summary.frameTime beside them`,
    s.motion.ghostDesignedExcused && `${s.motion.ghostDesignedExcused} designed blend(s) the planner declared (the swap log's designed list, at most the policy's classes.designedBlend.maxSeverity) are not counted as double images over the line; they stay in summary.classes.designedBlend and in the swaps' designed tag`,
    s.motion.smearSwaps && `${s.motion.smearSwaps} of ${s.motion.smearsPlanned} cut(s) the engine planned as a smear (a big change on a moving figure, logged) were excused: ${s.motion.smearSnapsExcused} snap(s) not counted, ${s.motion.jerksSmeared} swap jerk(s) (worst ${s.motion.worstSmearedJerkPx} px) not counted (continuity.smear in the policy; they stay in the report); every other fast swap is judged as before`,
    s.motion.jerksCovered && `${s.motion.jerksCovered} jerk(s) (worst ${s.motion.worstCoveredJerkPx} px) happened under the Save Sphere's wash and are not counted (continuity.wash in the policy; they are listed in the report)`,
  ]);
  const result = (reasons) => (unverified.length ? 'UNVERIFIED' : reasons.length ? 'FAIL' : 'PASS');
  // what a PASS rests on: how many swaps had a registered head (judged at 3 percent) and how many were read by mass (30 percent)
  const basis = `${s.size.headRegistration} of ${s.size.headMeasured} measured swaps had a registered head (tolerance ${cfg.size.headTolerancePct} percent); ${s.size.headRig ? `${s.size.headRig} were read from a rig's own head mesh (tolerance ${cfg.size.headTolerancePct} percent; ${s.size.rigSwaps} swap(s) were changes of a rig's key); ` : ''}${s.size.headSilhouette} were read by the figure's mass (tolerance ${cfg.size.headTolerancePctCoarse} percent, whole-figure jumps only); ${s.size.headUnmeasured} had no reading`;
  // W4: what the rest of the PASS rests on. The head reading is a CONTROL (the table that drew the pose agrees with itself); the independent evidence is the pixels' height and feet.
  const readings = s.size.heightMeasured !== undefined
    ? `; the head reading is a CONTROL (it passes any registered pose by construction); independent readings from the pixels: height ${s.size.heightMeasured} swap(s) (stature ${s.size.minStature ?? 'none'} to ${s.size.maxStature ?? 'none'}, ${s.size.heightWaived} out of band but waived), the silhouette's own feet ${s.size.feetSilMeasured} swap(s) (worst ${s.size.maxFeetSilPx} px, ${s.size.feetSilWaived} waived), ${s.size.holdSwaps} swap(s) across a recorded hold (real head worst ${s.size.worstRealHeadPct} percent from the idle's), ${s.size.unregisteredSwaps} on a painting with no fresh registration record`
    : '';
  return {
    'CHK-026': { result: result(size), reasons: unverified.length ? unverified : size, note: basis + readings },
    'CHK-027': { result: result(motion), reasons: unverified.length ? unverified : motion, ...(motionNotes.length ? { note: motionNotes.join('; ') } : {}) },
  };
}

/**
 * The line a report carries for the continuity harness (PR-0450: "a next-round report line per instrument"): how many chapters, how much battle, the frame rates it ran at, how many
 * chapters the dedicated harness ran (only those are scored: a probe attached to a capture route read a loaded host, round 25), both verdicts with their reasons, and the jerks that
 * happened under the Save Sphere's wash and were not counted.
 * @param {{ battleSeconds: number, chapters?: Array<{ fps?: number | null, dedicated?: boolean | null }>, checks: Record<string, { result: string, reasons?: string[] }>, motion?: { jerksCovered?: number, worstCoveredJerkPx?: number } }} s the run's aggregate
 */
export function continuityReportLine(s) {
  const rows = s.chapters ?? [];
  const fps = rows.map((r) => r.fps).filter((v) => Number.isFinite(v));
  const fpsText = fps.length ? `${Math.min(...fps)} to ${Math.max(...fps)} fps` : 'frame rate not read';
  const dedicated = rows.filter((r) => r.dedicated === true).length;
  const verdict = (c) => (c ? `${c.result}${c.reasons && c.reasons.length ? ` (${c.reasons.join('; ')})` : ''}` : 'not read');
  const covered = s.motion && s.motion.jerksCovered ? `; ${s.motion.jerksCovered} jerk(s) (worst ${s.motion.worstCoveredJerkPx} px) under the Save Sphere's wash are not counted` : '';
  const unscored = dedicated < rows.length ? `; ${rows.length - dedicated} chapter(s) were not run by the dedicated harness (no marker: an older file or a failed run), so their numbers are not scored` : '';
  const ghostText = ghostRateText(s.motion); // T-01 (lane L5): the see-through time in milliseconds, the display-independent unit, beside the frame count
  return `continuity harness (CHK-026/CHK-027): ${rows.length} chapter(s), ${s.battleSeconds} s of battle, ${fpsText}, ${dedicated} of ${rows.length} run by the dedicated harness; CHK-026 ${verdict(s.checks['CHK-026'])}; CHK-027 ${verdict(s.checks['CHK-027'])}${ghostText ? `; ${ghostText}` : ''}${covered}${unscored}`;
}

/**
 * The worst `n` swaps, most broken first. A swap's badness is its largest exceedance of the thresholds, so a
 * 40 percent head jump and a 119 px slide each outrank a mild ghost; a snap or a double image adds weight.
 */
export function swapBadness(s, cfg) {
  if (s.staged) return 0; // a step of the twirl is stagecraft (continuity-staged.mjs): never among the worst swaps a reviewer should open, only filler when nothing else is left
  const sized = !s.costume && !s.sameArt; // a costume change and a swap of one painting to itself are not judged on size or feet
  const head = sized && s.head && s.head.ratio !== null ? Math.abs(s.head.ratio - 1) * 100 / (s.head.source === 'registration' || s.head.label === 'rig' ? cfg.size.headTolerancePct : cfg.size.headTolerancePctCoarse) : 0;
  const feet = sized && s.feet && s.feet.standing ? s.feet.px / (s.feet.tolerancePx ?? (s.feet.source === 'registration' ? cfg.size.feetTolerancePx : cfg.size.feetTolerancePxCoarse)) : 0; // a rig's feet carry the tolerance they were judged at (R57-002)
  const outline = s.outline ? (1 - s.outline.iou) / 0.25 : 0;
  const ghost = s.ghost.severity / Math.max(0.01, cfg.motion.ghostSeverityFail);
  // W4: the readings from the pixels, so Lulu drawn at two thirds of her idle's height outranks a mild ghost although her registered head agrees to the pixel. How far outside the band
  // the reading is, in tenths of the idle's height (a stature of 0.667 against a floor of 0.90 is 2.3), the silhouette's feet over their tolerance, a hold's head over its band.
  // Waived poses are shown by their strips only when nothing worse is left (they score 0 here).
  let height = 0, feetSil = 0, realHead = 0;
  if (sized && s.height && !s.height.waived && s.height.band && s.height.ratio !== null) {
    const v = s.height.vs === 'idle' ? s.height.stature : s.height.ratio;
    if (v !== null) height = Math.max(s.height.band[0] - v, v - s.height.band[1], 0) / 0.1;
  }
  if (sized && s.feetSil?.standing && !s.feetSil.waived) feetSil = s.feetSil.gatePx / Math.max(1, s.feetSil.tolerancePx);
  if (sized && s.headReal && !s.headReal.waived) realHead = Math.max(s.headReal.band[0] - s.headReal.ratio, s.headReal.ratio - s.headReal.band[1], 0) / 0.15;
  return Math.max(head, feet, outline, ghost, height, feetSil, realHead) + (s.snap ? 0.5 : 0);
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
