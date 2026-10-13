// Continuity harness: a jerk hidden under the Save Sphere's wash (CHK-027; docs/handoff/r41-aeonjump.md, FOC40-02).
//
// The Save Sphere card (src/app/screens/SaveSphereCard.ts; FFX-2 Chapter XI only, between the links of the Road) washes the whole frame, HUD included, to a
// pale lilac white and restages the next link UNDER the wash. Anima's group scale goes from 1 to 2.8235 in one frame about 0.6 s later, still under it, so her
// head climbs about 900 px in one frame at 1600x900. The probe copies the WebGL canvas, and the wash is an HTML overlay in front of it, so the harness counted a
// pop that the player sees only through a veil that is 74 percent opaque. That one outlier (960 px; 966 px on the live build; 967.7 px in round 25) is the run's
// headline worst jerk and the first of its strips, though not what decides the chapter (round 25's Chapter XI has 15 more jerks of 40 px or more). The lane that
// traced it (r41-aeonjump) listed this as an option, "neither built" under AGENTS.md rule 10: let the probe mark the frames in which the wash is up as covered and
// count no jerk in them, as the harness already excuses camera cuts and staged costume changes.
//
// The probe (continuity-probe.mjs) reads the wash element's computed `opacity` on every frame it samples (`w` on the frame record) and the element's background
// alpha once (`meta.wash.alpha`). This module is the pure half: how much of the picture the wash hides, whether the step of a jerk was under it, and the tags.
//
//   cover  = opacity x alpha                   how much of the picture the veil hides (0 to 1); at full opacity the Save Sphere's veil hides 0.74
//   a step = the move from frame n-1 to frame n  both frames must be under the veil, so the step's cover is the LESS covered of the two
//   covered when the policy's `continuity.wash.excuse` is true and the step's cover is at least `minCover`
//
// The definition of a jerk is the owner's (D-420 to D-426) and no yes of his to this excuse is recorded, so the policy ships `excuse: false`: every jerk counted as
// before, the wash still shown on the ones it was over. `excuse: true` is the switch for when he says yes (`CONT_CFG='{"wash":{"excuse":true}}'` runs the what-if for one run).
// A jerk with no wash on either frame is untouched, and an alpha the probe could not read (`null`) hides nothing, so the jerk stays counted.
//
// Game case: FFX-2 only in effect (the only wash that exists is the Save Sphere's, and only Chapter XI plays it); the code is shared critic plumbing and idle in FFX.

/** The element whose opacity the probe reads: the Save Sphere card's wash. A policy `selector` of null stops the probe reading anything. */
export const WASH_SELECTOR = '[data-testid="save-sphere"] .ssphere__wash';

/** At or above this cover (of 1) a step is under the veil. The Save Sphere's veil tops out at 0.74, so this means "the wash is essentially all the way up" (95 percent of its opacity). */
export const WASH_MIN_COVER = 0.7;

const clamp01 = (v) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);
const round3 = (v) => Math.round(v * 1000) / 1000;

/** The policy's `continuity.wash` block with its defaults. A policy without the block excuses nothing and reads nothing (the earlier harness). */
export function washPolicy(cfg) {
  const w = (cfg && cfg.wash) || {};
  return {
    excuse: w.excuse === true,
    minCover: Number.isFinite(w.minCover) ? clamp01(w.minCover) : WASH_MIN_COVER,
    selector: typeof w.selector === 'string' && w.selector.trim() ? w.selector : null,
  };
}

/** How much of the picture the wash hides: the element's opacity times its background alpha. An alpha that is not a number (`null`, unread) hides nothing. */
export const washCover = (opacity, alpha) => clamp01(opacity) * clamp01(alpha);

/** Frame number -> the wash element's opacity, from the frame records that carry one (`w`). */
export function washTable(records) {
  const table = new Map();
  for (const r of records) if (typeof r.w === 'number' && Number.isFinite(r.w)) table.set(r.n, r.w);
  return table;
}

/**
 * The wash over the step into frame `n` (frame n-1 to frame n): the LESS covered of the two frames, or null when neither frame has a wash on it.
 * A frame with no wash while the other has one counts as opacity 0 (the card was just added or just taken away), so such a step is never covered.
 * @returns {{ opacity: number, cover: number, frames: [number, number] } | null}
 */
export function washOverStep(n, table, alpha) {
  const before = table.get(n - 1), at = table.get(n);
  if (before === undefined && at === undefined) return null;
  const opacity = Math.min(before ?? 0, at ?? 0);
  return { opacity: round3(opacity), cover: round3(washCover(opacity, alpha)), frames: [n - 1, n] };
}

/**
 * Tags the jerks in place: `wash` (what was over the step) on every jerk that had one, and `covered: true` on a jerk the policy excuses.
 * @param {Array<{ n: number }>} jerks
 * @param {{ records: Array<{ n: number, w?: number }>, alpha: number | null, policy: { excuse: boolean, minCover: number } }} o
 * @returns {number} how many jerks are covered
 */
export function tagWash(jerks, { records, alpha, policy }) {
  const table = washTable(records);
  if (!table.size) return 0;
  let covered = 0;
  for (const j of jerks) {
    const w = washOverStep(j.n, table, alpha);
    if (!w) continue;
    j.wash = w;
    if (policy.excuse && w.cover >= policy.minCover) { j.covered = true; covered++; }
  }
  return covered;
}

/**
 * What the report shows about the wash in a chapter: the spans of frames in which it was up, how opaque it got, and what the policy did with it.
 * `spans` are runs of consecutive frames with a wash on them (one per Save Sphere card).
 */
export function washReport({ records, meta, policy, jerks, frameMs = 1000 / 60 }) {
  const table = washTable(records);
  const frames = [...table.keys()].sort((a, b) => a - b);
  const spans = [];
  for (const n of frames) {
    const last = spans[spans.length - 1];
    if (last && n === last.to + 1) { last.to = n; last.frames++; } else spans.push({ from: n, to: n, frames: 1 });
  }
  for (const s of spans) s.ms = Math.round(s.frames * frameMs);
  const alpha = meta && meta.wash ? meta.wash.alpha : null;
  const covered = jerks.filter((j) => j.covered);
  const seen = jerks.filter((j) => j.wash);
  return {
    selector: meta && meta.wash ? meta.wash.selector : policy.selector,
    alpha,
    excuse: policy.excuse,
    minCover: policy.minCover,
    framesSeen: frames.length,
    maxOpacity: frames.length ? round3(Math.max(...table.values())) : 0,
    spans: spans.slice(0, 40),
    jerksUnderWash: seen.length,
    jerksCovered: covered.length,
    worstCoveredPx: covered.reduce((m, j) => Math.max(m, j.px), 0),
    ...(meta && meta.wash && meta.wash.error ? { readError: meta.wash.error } : {}),
  };
}
