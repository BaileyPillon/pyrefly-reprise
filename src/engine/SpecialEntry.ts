/**
 * The Special dress-up's plan runner and its entry, full and short (FFX-2 only: the three Special dresspheres exist only in FFX-2; nothing here runs while the switch `specialDressUp` is OFF).
 *
 * `runPlan` walks a `BeatPlan` (step A, `SpecialBeatPlans.ts`) on the presenter's clock; `runEntry` is what the entry's steps DO: the HUD's held list and Wait chip, the other two girls fading off,
 * the form registered on the stage with its two stubs, the Special's painting set, the cut. The plan comes from `fullPlan` or `shortPlan` by `entryKind`; the timing is the plan's, so a number here is
 * only ever a conversion. `ctx.sleep` already multiplies by the speed scale (0.32 fast, about 0 at skip): a plan is never scaled twice; the DURATIONS handed to the ports (fades, flashes) are
 * multiplied by `moveScale(ctx)`. This file gets the runtime as a parameter and imports only its TYPES (no value cycle with `BattlePresenterSpecial.ts`).
 *
 * `[ours]` in this file: the camera is held on the neutral wide shot (the `SPECIAL_SHOTS` table is empty until a clip says a name needs a rig); the short plan's reveal happens at its cut; the
 * reveal's flash on the new figure. The pieces of a step (the light column, the silhouette, the petals...) are only FORWARDED to `VfxPort.special?`; their drawing is stage 2's.
 */

import type { BattleEvent } from '../battle/common/types.ts';
import type { SpecialRuntime } from './BattlePresenterSpecial.ts';
import type { EventCtx } from './BattlePresenterEvents.ts';
import { settleForMenu } from './BattlePresenterSettle.ts';
import { stageChange } from './BattlePresenterStaging.ts';
import { HUD_EVENT_BUDGET_MS } from './BattlePresenterUtil.ts';
import { moveScale } from './motion/CurveBeats.ts';
import { FADE_OTHERS_MS, fullPlan, reducedPlan, REDUCE_MOTION_SCALE, shortPlan, type BeatPlan, type Girl, type PlanStep } from './SpecialBeatPlans.ts';
import { specialArtId, specialSeenId } from './SpecialFormTracker.ts';
import type { StageForm } from './SpecialStaging.ts';
import { idsOffStage } from './SummonStaging.ts';

type Change = Extract<BattleEvent, { type: 'spherechange' }>;

/**
 * The camera names of the plans mapped to an EXISTING rig of the scene (`ctx.moments.moveToRig`). Empty by default: every name holds the neutral wide shot, and the first clip says which names the
 * wide shot cannot do without. A name is added here only with a rig the scene already has; a rig is never invented on the fly.
 */
export const SPECIAL_SHOTS: Readonly<Partial<Record<NonNullable<PlanStep['camera']>, string>>> = {};

const clockOf = (ctx: EventCtx): number => ctx.deps.now?.() ?? Date.now();

/** A forwarded call whose promise nobody awaits must not become an unhandled rejection. */
export function detach(p: Promise<unknown> | void | undefined): void {
  if (p && typeof (p as Promise<unknown>).catch === 'function') void (p as Promise<unknown>).catch((err) => console.warn('[presenter] a Special piece failed', err));
}

/**
 * Walk `plan` from the moment the HUD's flourish is over: `elapsed` starts at 600 (`HUD_EVENT_BUDGET_MS`). For each step in time order: sleep until its mark (`ctx.sleep` scales it), run `on`, and add to
 * `elapsed` any time the step itself spent waiting (a portrait longer than its nominal length shortens the next step's sleep, never the cut). Resolves true when the whole plan ran, false on an abort.
 * `unit` converts a measured wait back to plan time for a plan that was itself scaled (reduce motion).
 */
export async function runPlan(ctx: EventCtx, rt: SpecialRuntime, plan: BeatPlan, on: (step: PlanStep) => void | Promise<void>, unit = 1): Promise<boolean> {
  let elapsed = HUD_EVENT_BUDGET_MS;
  for (const step of plan.steps) {
    if (rt.host.isAborted) return false;
    await ctx.sleep(Math.max(0, step.atMs - elapsed));
    if (rt.host.isAborted) return false;
    elapsed = Math.max(elapsed, step.atMs);
    const t0 = clockOf(ctx);
    await on(step);
    const waited = (clockOf(ctx) - t0) / (moveScale(ctx) * unit);
    if (ctx.speed() !== 'skip' && waited > 0) elapsed += waited;
  }
  await ctx.sleep(Math.max(0, plan.totalMs - elapsed));
  return !rt.host.isAborted;
}

/** Forward every piece of a step to the effects layer (absent member: nothing draws), once, with the step's length in the presenter's time. */
export function firePieces(ctx: EventCtx, girl: Girl, step: PlanStep): void {
  const ms = (step.endMs - step.atMs) * moveScale(ctx);
  for (const id of step.pieces ?? []) detach(ctx.stage.vfx.special?.({ id, girl, ms }));
}

/** The step's camera: a named rig of the scene, or the neutral wide shot held as it is. */
function shot(ctx: EventCtx, step: PlanStep): void {
  const rig = step.camera ? SPECIAL_SHOTS[step.camera] : undefined;
  if (rig) void ctx.moments.moveToRig(rig, 700 * moveScale(ctx));
}

/** The step's flash: a white wash of the screen. Never the actor triple `(0xffffff, 420, 1)`, which the twirl slot swallows. */
function flash(ctx: EventCtx, step: PlanStep): void {
  if (step.flash) ctx.stage.vfx.screenFlash('#ffffff', 180 * moveScale(ctx));
}

/**
 * Put the form on the stage: register it, stand the two figure-less stubs on the main's own figure, set the Special's painting. `slot` of a stub is the part's ENGINE slot, `3 + 2 * girlIndex + k`
 * (`k` 0 for the right part, 1 for the left): the stub is anchored, not spotted, so the slot only names it.
 */
async function reveal(ctx: EventCtx, rt: SpecialRuntime, girl: Girl, special: StageForm['special'], girls: readonly string[]): Promise<void> {
  const form = rt.tracker.form(girl);
  if (!form) return;
  const [main, right, left] = form.ids;
  const stageForm: StageForm = { girl, special, main, right, left, parked: form.parked, gate: { blocked: false } };
  rt.form = stageForm;
  ctx.stage.setForm?.(stageForm);
  const index = Math.max(0, girls.indexOf(girl));
  for (const [id, k] of [[right, 0], [left, 1]] as const) {
    await ctx.stage.addCombatant(id, { artId: '', side: 'party', slot: 3 + 2 * index + k }).catch((err) => console.warn('[presenter] a Special part could not be staged', id, err));
    if (rt.host.isAborted) return;
  }
  await ctx.stage.setArt(girl, specialArtId(girl, special));
}

/** The entry. `kind` is `entryKind`'s answer (full the first time a girl wears her Special, short after). */
export async function runEntry(ctx: EventCtx, rt: SpecialRuntime, event: Change, kind: 'full' | 'short'): Promise<void> {
  const big = ctx.bigMove ?? null; // before the first await: an overlapping burst (FFX-2's ATB) would swap it
  ctx.bigMove = null;
  const girl = event.who as Girl;
  const special = event.special!;
  const form = rt.tracker.form(girl);
  if (!form) return;
  const girls = rt.girls ?? [girl, ...form.parked];
  const full = kind === 'full';
  const reduced = ctx.moments.reducedMotion;
  const base = full ? fullPlan(girl) : shortPlan(girl);
  const plan = reduced ? reducedPlan(base) : base;
  const k = moveScale(ctx);
  const { hold } = rt;
  if (!hold.active) hold.rows(girls); // the runtime was made late (no `preSubmit`)
  let ready = false;
  try {
    await runPlan(ctx, rt, plan, async (step) => {
      switch (step.id) {
        case 'portrait':
          if (big) { // no big move (skip speed, an open menu, portrait mode not big): no wait
            ctx.moments.bigMoveCutIn(big, true);
            await ctx.moments.portraitWait();
          }
          stageChange(ctx, event); // the pro staging's readable plate for the HUD's name plate
          break;
        case 'field':
          hold.chip(true, 'wait'); // the rows are already held on the girls (`preSubmit`, or the top of this beat)
          break;
        case 'fade-others':
          void idsOffStage(ctx.stage, form.parked, FADE_OTHERS_MS * k);
          break;
        case 'one-row':
          hold.rows([girl]);
          rt.host.syncFullHud();
          break;
        case 'reveal':
          await reveal(ctx, rt, girl, special, girls);
          if (!reduced) ctx.stage.actor(girl)?.flash(0xffffff, 600 * k, 0.9);
          break;
        case 'cut':
          if (!full) await reveal(ctx, rt, girl, special, girls); // the short plan has no reveal step: the figure takes the place at its cut
          hold.rows([...form.ids]);
          if (full) hold.chip(false, rt.host.atbMode()); // the short plan leaves the chip as it was
          rt.host.syncFullHud();
          await settleForMenu(ctx);
          ready = true;
          if (full && !rt.host.isAborted && ctx.speed() !== 'skip') ctx.deps.specialSeen?.mark(specialSeenId(girl, special));
          break;
        default:
          break;
      }
      shot(ctx, step);
      firePieces(ctx, girl, step);
      flash(ctx, step);
    }, reduced ? REDUCE_MOTION_SCALE : 1);
  } catch (err) {
    console.warn('[presenter] the Special entry failed; the HUD takes the parts', err);
  }
  if (!ready && !rt.host.isAborted) { // a failed beat must not leave the HUD on the girls
    hold.rows([...form.ids]);
    if (full) hold.chip(false, rt.host.atbMode());
    rt.host.syncFullHud();
  }
}
