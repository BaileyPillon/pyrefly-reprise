// Continuity harness: a FLICKER is a named class of pose change, not a number to be found by reading swaps one by one (CHK-027).
//
// Post-conference motion plan, step 2 (2026-10-26): in Chapter IV (FFX-2) a girl about to run in showed `ready`, then `idle` for about a tenth of a second, then `ready` again before the lunge,
// 22 times in 6.3 minutes. The two swaps of each were counted like any other, so the pair hid among 414 swaps: it carried 295 of the chapter's 931 see-through frames (32 percent) and was found only by
// a one-off script (`motion-plan/triples.mjs`). The cause was the presenter's turn start dropping a figure to `idle` that the action was about to put back on `ready`
// (`BattlePresenterBeats.turnStart`, `KeyPoses.readyCarriesIntoWindUp`). This module is how it cannot come back unseen.
//
// A flicker is one figure changing painting A to B and, within `windowMs`, B back to A (default 300 ms: the pairs of the plan are 98 to 101 ms apart, a person cannot answer two menus that fast, and the nearest
// real separate turns in Chapter I were 3,300 ms apart), for the pairs the class names: `ready>idle>ready` (the default; the policy's `continuity.flicker.pairs` may add more). Not every out-and-back is one: the
// second hit of a multi-hit blow is `hurt>idle>hurt` 80 ms after the first (15 of them in Chapter I), a rig's key pair or a twirl's steps go there and back by design, and those are not a defect to count.
// Both swaps are tagged (`flicker`: its number, the role `out` or `back`, the gap, the pair as a word) and the summary says how many there were, how many see-through frames they carry, how many a minute, and of
// which pairs. It is REPORTED, not gated: no verdict reads it (a gate needs its own policy word and RUBRIC line, and Bailey's yes); the number next to the others is what keeps the next regression visible.
//
// Every swap the figure was SHOWING counts (not `notShowing`), counted by the harness or not (a swap under a camera cut is still seen); the see-through frames are the counted swaps' own, so the total is comparable
// to `summary.motion` / the ghost totals. Both games: shared critic plumbing (it fires on any recording, and an FFX recording has no such pair since its turn start comes before the menu).

export const FLICKER_WINDOW_MS = 300;

/** The out-and-back pairs the class names, each written `from>to>from`. */
export const FLICKER_PAIRS = Object.freeze(['ready>idle>ready']);

/** The window in ms: the policy's `continuity.flicker.windowMs` when it is a positive number, else {@link FLICKER_WINDOW_MS}. */
export function flickerWindowMs(cfg) {
  const v = cfg && cfg.flicker && typeof cfg.flicker === 'object' ? cfg.flicker.windowMs : undefined;
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : FLICKER_WINDOW_MS;
}

/** The pairs: the policy's `continuity.flicker.pairs` when it is a non-empty list of words, else {@link FLICKER_PAIRS}. */
export function flickerPairs(cfg) {
  const v = cfg && cfg.flicker && typeof cfg.flicker === 'object' ? cfg.flicker.pairs : undefined;
  return Array.isArray(v) && v.length && v.every((p) => typeof p === 'string') ? [...v] : [...FLICKER_PAIRS];
}

/**
 * Find the flickers among the analysed swaps and tag both swaps of each (in place: `flicker` on the swap).
 * A swap belongs to at most one pair (the first), so a chain A B A B is two pairs and a chain A B A is one pair and a trailing swap.
 * @param {Array<{id:number, figure:string, fromPose:string, toPose:string, tMs:number, notShowing?:boolean, counted?:boolean, ghost?:{frames:number}}>} swaps
 * @param {number} [windowMs]
 * @param {readonly string[]} [pairs] the out-and-back pairs that count, each `from>to>from`
 * @returns {Array<{n:number, figure:string, pair:string, gapMs:number, ids:[number,number], ghostFrames:number, counted:boolean}>}
 */
export function tagFlickers(swaps, windowMs = FLICKER_WINDOW_MS, pairs = FLICKER_PAIRS) {
  const byFigure = new Map();
  for (const s of swaps) {
    if (s.notShowing) continue;
    if (!byFigure.has(s.figure)) byFigure.set(s.figure, []);
    byFigure.get(s.figure).push(s);
  }
  const found = [];
  for (const [figure, list] of byFigure) {
    list.sort((a, b) => a.tMs - b.tMs);
    for (let i = 0; i + 1 < list.length; i++) {
      const a = list[i], b = list[i + 1];
      if (a.flicker || b.flicker) continue;
      if (a.fromPose !== b.toPose || a.toPose !== b.fromPose) continue;
      const pair = `${a.fromPose}>${a.toPose}>${a.fromPose}`;
      if (!pairs.includes(pair)) continue;
      const gapMs = Math.round((b.tMs - a.tMs) * 10) / 10;
      if (!(gapMs >= 0 && gapMs <= windowMs)) continue;
      const n = found.length + 1;
      a.flicker = { n, role: 'out', gapMs, pair };
      b.flicker = { n, role: 'back', gapMs, pair };
      found.push({ n, figure, pair, gapMs, ids: [a.id, b.id], ghostFrames: (a.counted ? a.ghost?.frames ?? 0 : 0) + (b.counted ? b.ghost?.frames ?? 0 : 0), counted: Boolean(a.counted && b.counted) });
    }
  }
  return found.sort((x, y) => x.ids[0] - y.ids[0]).map((f, i) => ({ ...f, n: i + 1 }));
}

/**
 * The summary block: how many flickers, the see-through frames they carry (and the share of all the chapter's), a minute, by pair and by figure.
 * @param {ReturnType<typeof tagFlickers>} flickers
 * @param {{battleSeconds:number, totalGhostFrames:number, windowMs:number, pairs?:readonly string[]}} o
 */
export function flickerSummary(flickers, { battleSeconds, totalGhostFrames, windowMs, pairs = FLICKER_PAIRS }) {
  const minutes = battleSeconds / 60;
  const ghostFrames = flickers.reduce((s, f) => s + f.ghostFrames, 0);
  const tally = (key) => flickers.reduce((m, f) => ((m[f[key]] = (m[f[key]] ?? 0) + 1), m), {});
  const r = (v, d = 100) => Math.round(v * d) / d;
  return {
    windowMs,
    pairs: [...pairs],
    count: flickers.length,
    countedPairs: flickers.filter((f) => f.counted).length,
    perMinute: minutes > 0 ? r(flickers.length / minutes) : 0,
    ghostFrames,
    ghostShare: totalGhostFrames > 0 ? r(ghostFrames / totalGhostFrames) : 0,
    ghostFramesPerMinute: minutes > 0 ? r(ghostFrames / minutes, 10) : 0,
    byPair: tally('pair'),
    byFigure: tally('figure'),
    medianGapMs: flickers.length ? flickers.map((f) => f.gapMs).sort((a, b) => a - b)[Math.floor(flickers.length / 2)] : null,
  };
}
