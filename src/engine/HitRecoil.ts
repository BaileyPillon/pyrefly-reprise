/**
 * **How a hit's knock-back moves** (r40-recoil, FC-1 of `D:/Tools/pyrefly-scratch/2026-10-10/visual-feel-pass/plan.md`; Bailey's pick P3-80, 2026-10-10: "an 80 ms eased push").
 * Both games: the knock-back is shared plumbing (`PaintedActor.knockBack`, called by `recoil` and by the life layer's flinch cue), and the sources give no
 * duration or distance for it in either game, so every number here is `[ours]`.
 *
 * **What it replaces, and why.** The old knock-back was one tween from the full distance down to 0 on `Easing.elasticOut`. A tween writes the value at progress 0
 * as soon as it is first ticked, and it is ticked every frame, hit-stop or not (`PaintedActor.update` runs `tweens.update(0)` while the stage's field `dt` is 0). So on
 * the frame the hit landed the whole figure was **thrown the full distance in one frame** (`distance` 0.22, or 0.34 on a crit, in world units: about 33 or 50 px on a 1600
 * px screen at the battle camera's 148 px per unit), held there for the length of the hit-stop (2 to 5 frames), and then the spring released in one or two frames and swung
 * through zero and out the other side (elasticOut overshoots 37 percent). The harness reads that as a jerk of 33 to 70 px, then a second one at the release
 * (`docs/handoff/r40-recoil.md` has the evidence: the stored strips, the same signature recorded in release 38's note in `critic-continuity-pure.test.ts`, and a headless
 * replica through the real actor and the harness's own detector).
 *
 * **What it does.** The offset is one function of elapsed time, in two legs:
 *   1. **the push**: from where the figure is now to the full distance back over {@link RECOIL_PUSH_MS} (80 ms of tween time, the same clock as the old tween, so the pacing
 *      option stretches it with every other move), on `sineOut`. The largest frame step is 0.32 of the distance at 60 fps (16 px on a crit), against the full distance before.
 *      Its value at progress 0 is where the figure already is, so a hit-stop that holds the field leaves the figure still at the moment of contact and the push begins when it
 *      lets go, and a second hit landing mid-spring starts from the current offset instead of snapping.
 *   2. **the spring home**: the rest of the duration, back to 0 on a back-out with one overshoot of {@link RECOIL_OVERSHOOT} of the distance (0.09; the old curve's was 0.37).
 *
 * Total duration is unchanged (the caller's `ms`) and so is the distance. `?recoil=legacy` brings the old curve back for same-build A/B captures (the
 * `?headlock=off` precedent); it is read once.
 *
 * Pure TypeScript: no `three`, no DOM but the address of the page (hard rule 1 does not bind `src/engine/*.ts` outside `BattlePresenter*`, and `PartyStature.ts` reads the address
 * the same way).
 */

import { Easing } from './Tween.ts';

/** The push, ms of tween time. Capped at a third of a short move so a 100 ms recoil still has a spring. */
export const RECOIL_PUSH_MS = 80;

/** The spring's one overshoot past rest, as a fraction of the distance. The curve's constant below gives 0.0898 (`recoil-overshoot` in the test scans it). */
export const RECOIL_OVERSHOOT = 0.1;

/** The back-out constant: peak overshoot is (4 / 27) * s^3 / (s + 1)^2 = 0.0898 at 1.6 (1.70158 is the classic 10 percent and would touch the limit). */
const BACK_S = 1.6;

/** A back-out: 0 to 1, peaking at 1.0898 and settling at exactly 1. */
function backOut(u: number): number {
  const x = u <= 0 ? 0 : u >= 1 ? 1 : u;
  const w = x - 1;
  return 1 + (BACK_S + 1) * w * w * w + BACK_S * w * w;
}

/** The push's length for a knock-back of `ms`: 80 ms, or a third of a very short one. */
export function pushMs(ms: number): number {
  return Math.min(RECOIL_PUSH_MS, Math.max(1, ms) * 0.34);
}

/**
 * The knock-back offset at progress `p` (0 to 1) of a move lasting `ms`, in the sign `PaintedActor.recoilOffset` uses (negative = knocked back, before the actor's `facing`
 * flips it), for a knock-back of `distance` world units that began with the figure already displaced by `from`.
 */
export function hitRecoilOffset(p: number, ms: number, distance: number, from = 0): number {
  const total = Math.max(1, ms);
  const t = (p <= 0 ? 0 : p >= 1 ? 1 : p) * total;
  const push = pushMs(total);
  if (t < push) {
    const u = t / push;
    return from + (-distance - from) * Easing.sineOut(u);
  }
  const u = (t - push) / (total - push);
  const v = -distance * (1 - backOut(u));
  return v === 0 ? 0 : v; // never -0
}

// ------------------------------------------------------------------ the switch

let legacy: boolean | null = null;

/** `?recoil=legacy` (captures and A/B comparisons only): the knock-back plays the old elasticOut tween. Read once. */
export function recoilLegacy(): boolean {
  if (legacy === null) legacy = new URLSearchParams(globalThis.location?.search ?? '').get('recoil') === 'legacy';
  return legacy;
}

/** Tests: force the switch (`null` reads the address again). */
export function setRecoilLegacy(value: boolean | null): void {
  legacy = value;
}
