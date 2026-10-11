// Continuity harness: a staged change is stagecraft, not a pose change (CHK-027).
//
// The FFX-2 spherechange plays a figure's `twirl-*` KEYS one after another as a stepped sequence by design (Bailey's picks of
// 2026-10-02, D-322, and his pick of 2026-10-10 to keep the twirl stepped, P4): the outfit she leaves (`twirl-start`, `twirl-going`),
// her ribbons (`twirl-mid`), the outfit she puts on (`twirl-forming`, `twirl-end`), each key a CUT to the next, never a crossfade
// (`src/engine/fx/mix/twirl.ts`: `applyPose` on the showing plane, the other plane pinned at nothing). The harness used to read every
// one of those cuts as a pose swap that snaps, so a build with a twirl in it showed "idle to idle" snaps (15 of the 96 in round 23,
// 14 of them in Chapter XIII) that were the sequence working as designed.
//
// r40 instrument edit (b) (FI-1, P5; Bailey, 2026-10-10, "I'll go with all your recommendations"): a swap that is a step of a figure's
// twirl is ONE staged costume change. Concretely:
//   - the swap is a `costume` swap (kept out of the 3 percent, 30 percent, 2 px and 6 px judgements, like a change of dressphere);
//   - it is not a snap (`snap` false; the cut it would have been counted as is kept as `snapStaged`, so the reclassification is visible);
//   - the steps of one sequence share a `staged.seq` (and are numbered `step` of `of`), and the summary counts changes, not steps
//     (`motion.staged.changes`);
//   - it never competes for a place among the worst swaps (`swapBadness` 0): a stepped sequence is not the defect a reviewer should open;
//   - the jerks that fall at one of its steps are tagged `staged` and counted apart (`motion.staged.jerksAtStaged`), NOT excused: a jerk
//     is a number the reader judges, and whether the twirl's own key-to-key jumps may be 300 px is FD-1 step 1's question.
//
// A step is any swap with a twirl key on EITHER side: between two keys, into the first key (the cut from the outfit she is standing in),
// out of the last (the cut to the new outfit). `staged.edge` says which. Only the spherechange paints `twirl-*` files and only it
// shows them, so a twirl key on either side is the twirl.
//
// Game case: FFX-2 only in effect (FFX has no spherechange, research/ffx-vs-ffx2-presentation.md section 6); the classification is shared critic
// plumbing and cannot fire on an FFX recording, which has no `twirl-*` painting.

/** The key a painting is: `twirl-start`, `twirl-going`, `twirl-mid`, `twirl-forming`, `twirl-end` (src/engine/fx/mix/twirlPlan.ts TWIRL_PARTS). */
export const TWIRL_KEY = /^twirl-[a-z0-9-]+$/i;

/** Two steps of one figure are one change when the second starts from the key the first ended on and follows within this many frames (2 s at 60 fps). */
export const STAGED_GAP_FRAMES = 120;

export const isTwirlKey = (name) => TWIRL_KEY.test(String(name ?? ''));

/** The twirl key a painting is, from its anchors' pose name (read off the file name) or its url, else the plane's own pose name; null for any other painting. */
export function twirlKeyOf(anchor, name) {
  if (isTwirlKey(anchor?.pose)) return anchor.pose;
  const m = /\/(twirl-[a-z0-9-]+?)(?:@\d+x)?\.(?:png|webp)$/i.exec(String(anchor?.url ?? ''));
  if (m) return m[1];
  return isTwirlKey(name) ? name : null;
}

/**
 * Is this swap a step of the spherechange's twirl?
 * @param {object|null} aFrom  anchors of the painting that goes out
 * @param {object|null} aTo    anchors of the painting that comes in
 * @param {{staged?: {twirl?: boolean}}} [cfg]  policy `continuity` block; `staged.twirl: false` switches the classification off (an old-reading re-run)
 * @param {{from?: string, to?: string}} [names]  the planes' own pose names, used when a painting says nothing about its file
 * @returns {{kind:'twirl', edge:'between-keys'|'enters'|'leaves', from:string|null, to:string|null}|null}
 */
export function stagedStepOf(aFrom, aTo, cfg, names = {}) {
  if (cfg?.staged?.twirl === false) return null;
  const from = twirlKeyOf(aFrom, names.from), to = twirlKeyOf(aTo, names.to);
  if (!from && !to) return null;
  return { kind: 'twirl', edge: from && to ? 'between-keys' : to ? 'enters' : 'leaves', from, to };
}

/**
 * Give the steps of one change one sequence number. `swaps` are the run's swaps in frame order, each `{ fi, from, to, n, staged }` (`staged` as
 * `stagedStepOf` returns it, or null); every staged swap gets `staged.seq` (unique in the run), `staged.step` (1 based) and `staged.of` (how many
 * steps the change has). A step belongs to the figure's open change when it starts from the key that change ended on, within `gapFrames`.
 * Mutates the swaps' `staged`; returns the changes as `{ seq, fi, steps }`.
 */
export function groupStaged(swaps, gapFrames = STAGED_GAP_FRAMES) {
  const open = new Map(); // figure index -> the change in progress
  const changes = [];
  for (const s of swaps) {
    if (!s.staged) continue;
    const cur = open.get(s.fi);
    const joins = cur && cur.to === s.from && s.n - cur.n <= gapFrames;
    const change = joins ? cur : { seq: changes.length, fi: s.fi, steps: [], to: s.to, n: s.n };
    if (!joins) changes.push(change);
    change.steps.push(s);
    change.to = s.to;
    change.n = s.n;
    open.set(s.fi, change);
    s.staged = { ...s.staged, seq: change.seq, step: change.steps.length };
  }
  for (const c of changes) for (const s of c.steps) s.staged.of = c.steps.length;
  return changes.map(({ seq, fi, steps }) => ({ seq, fi, steps }));
}
