/**
 * Where a battle's entry spends its time (lane "budgets-2", 2026-10-29; both games, measurement only).
 *
 * The fight-start split (`tools/fight-start-split.mjs`) cuts a run into its authored parts and one lump, "entry-load" plus "first-draw", which is the 19.8 s and 42.4 s the phone profile reads. The
 * browser job needs to know what is inside the lump, so `BattleScreenEncounter.enter` leaves a `performance.mark` at each await it makes: `pyrefly:enter:begin`, `:scene` (the diorama is up),
 * `:engine`, `:stage` (every figure is built), `:hud` (the HUD and the presenter exist), `:shaders` (the field has compiled and drawn once) and `:shown` (the swirl clears). Nothing reads them in the game; a failing `mark` is ignored.
 *
 * Release 73 (lane "r73-bytes" review, major 2): a mark may carry the debug probe's reading as its `detail` (`setEntryMarkProbe`, installed by `debug/artApi.ts`), so a browser job reads what had landed
 * (idle lighting maps, streamed rig looks) AT `shown`, not a second later.
 */
let probe: (() => unknown) | null = null;

/** Install (or, with null, remove) the function whose result every later mark carries as its `detail`; it must return something structured-cloneable and cheap. */
export function setEntryMarkProbe(fn: (() => unknown) | null): void {
  probe = fn;
}

export function entryMark(step: string): void {
  try {
    let detail: unknown;
    try {
      detail = probe?.();
    } catch {
      detail = undefined; // a probe that throws leaves a plain mark
    }
    if (detail === undefined) performance.mark(`pyrefly:enter:${step}`);
    else performance.mark(`pyrefly:enter:${step}`, { detail });
  } catch {
    /* no User Timing here (a stub environment) */
  }
}
