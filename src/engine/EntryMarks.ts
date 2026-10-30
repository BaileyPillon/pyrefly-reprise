/**
 * Where a battle's entry spends its time (lane "budgets-2", 2026-10-29; both games, measurement only).
 *
 * The fight-start split (`tools/fight-start-split.mjs`) cuts a run into its authored parts and one lump, "entry-load" plus "first-draw", which is the 19.8 s and 42.4 s the phone profile reads. The
 * browser job needs to know what is inside the lump, so `BattleScreenEncounter.enter` leaves a `performance.mark` at each await it makes: `pyrefly:enter:begin`, `:scene` (the diorama is up),
 * `:engine`, `:stage` (every figure is built), `:hud` (the HUD and the presenter exist), `:shaders` (the field has compiled and drawn once) and `:shown` (the swirl clears). Nothing reads them in the game; a failing `mark` is ignored.
 */
export function entryMark(step: string): void {
  try {
    performance.mark(`pyrefly:enter:${step}`);
  } catch {
    /* no User Timing here (a stub environment) */
  }
}
