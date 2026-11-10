/**
 * The Special dress-up's two ways out (FFX-2 only: the three Special dresspheres exist only in FFX-2; nothing here runs while the switch `specialDressUp` is OFF): the girl takes the form off by choice
 * (`exit`, 4500 ms, never shortened by the Config) and the main body falls for good while a part stands (`fall`, 7500 ms). Both walk their fixed plan through `runPlan` (`SpecialEntry.ts`) and receive the
 * runtime as a parameter; this file imports only the TYPES of `BattlePresenterSpecial.ts`.
 *
 * The fall built here is the REACHABLE case only (the engine's pick 8: a part still stands). With all three bodies down the engine emits no `spherechange` out and the burst ends in `defeat`, so the
 * seen case of AC-7 has no event to start it: `fallPlan(true)` stays tested data, and the all-parts-down log releases the hold at `defeat` with no beat (`releaseSpecial`).
 *
 * `[ours]` in this file: "the others return and the rows go back to three girls" at the end of a fall (not seen), the exit's whiten as a flash without the turn ring's flare (no port member for it; stage 2),
 * the squash's restore. Under reduce motion the grey squash is not played. No `three`, no DOM, ports only.
 */

import type { BattleEvent } from '../battle/common/types.ts';
import type { SpecialRuntime } from './BattlePresenterSpecial.ts';
import type { EventCtx } from './BattlePresenterEvents.ts';
import { downWithoutKoPainting } from './KoFallback.ts';
import { moveScale } from './motion/CurveBeats.ts';
import { detach, runPlan } from './SpecialEntry.ts';
import { exitPlan, fallPlan, FADE_OTHERS_MS } from './SpecialBeatPlans.ts';
import { PYREFLY_GREEN } from './SpecialReactions.ts';
import { FALL_GRADE } from './SpecialStaging.ts';
import { idsBack } from './SummonStaging.ts';

type Change = Extract<BattleEvent, { type: 'spherechange' }>;

/** Take the two stubs off the stage and the form out of the stage's registry; the figure is the girl's again. */
function dropForm(ctx: EventCtx, rt: SpecialRuntime): void {
  const form = rt.form;
  if (!form) return;
  ctx.stage.removeCombatant(form.right);
  ctx.stage.removeCombatant(form.left);
  rt.form = null;
  ctx.stage.setForm?.(null);
}

/** The exit: chip to Wait, the numbers, whiten, dissolve in the pyrefly green, the old dress stands where the figure stood, the others return, the girls' rows, the chip back. */
export async function runExit(ctx: EventCtx, rt: SpecialRuntime, event: Change): Promise<void> {
  const girl = event.who;
  const form = rt.form;
  const k = moveScale(ctx);
  const mode = (): 'wait' | 'active' => rt.host.atbMode();
  try {
    await runPlan(ctx, rt, exitPlan(), async (step) => {
      switch (step.id) {
        case 'hold':
          rt.hold.chip(true, 'wait');
          break;
        case 'numbers':
          rt.host.syncFullHud(); // the engine already put her back in the old dress, so her row takes its pools while the parts are still listed
          break;
        case 'whiten':
          ctx.stage.actor(girl)?.flash(0xffffff, (step.endMs - step.atMs) * k, 0.8);
          break;
        case 'dissolve':
          detach(ctx.stage.actor(girl)?.dissolveTo(1, (step.endMs - step.atMs) * k, PYREFLY_GREEN));
          break;
        case 'girl-stands': {
          await ctx.stage.setArt(girl, `${girl}-${event.to}`); // her old dress, at the shared height again (`fitFormHeight`)
          const a = ctx.stage.actor(girl);
          a?.setDissolve(0);
          a?.setAlpha(1);
          dropForm(ctx, rt);
          break;
        }
        case 'others-back':
          if (form) void idsBack(ctx.stage, form.parked, FADE_OTHERS_MS * k);
          break;
        case 'girls':
          rt.hold.release(mode(), () => rt.host.syncFullHud()); // the rows return to the three girls
          break;
        case 'control':
          rt.hold.chip(false, mode());
          break;
        default:
          break;
      }
    });
  } catch (err) {
    console.warn('[presenter] the Special exit failed; the party takes the field', err);
  }
  if (rt.host.isAborted) return;
  dropForm(ctx, rt); // a failed or cut-short beat leaves no stub behind
  rt.hold.release(mode(), () => rt.host.syncFullHud());
}

/** The fall (the reachable half): the lead-in, the tag flips to Wait, grey with a squash, dissolve, the old-dress girl lies where the figure stood, the others return, the rows go back. */
export async function runFall(ctx: EventCtx, rt: SpecialRuntime, event: Change): Promise<void> {
  const girl = event.who;
  const form = rt.form;
  const k = moveScale(ctx);
  const plan = fallPlan(false);
  const squash = ctx.speed() !== 'skip' && !ctx.moments.reducedMotion;
  const mode = (): 'wait' | 'active' => rt.host.atbMode();
  let squashed = false;
  try {
    const ran = await runPlan(ctx, rt, plan, async (step) => {
      const a = ctx.stage.actor(girl);
      switch (step.id) {
        case 'lead-in': // the standing figure takes the existing hit beat (the `damage` event printed its numeral already)
          a?.shake(0.1, 340);
          void a?.recoil(360 * k, 0.22);
          break;
        case 'tag-wait':
          rt.hold.chip(true, 'wait');
          break;
        case 'numbers':
          rt.host.syncFullHud();
          break;
        case 'grey-squash':
          a?.flash(FALL_GRADE.flashColour, (step.endMs - step.atMs) * k, FALL_GRADE.flashPeak);
          if (squash && a?.ramp) {
            squashed = true;
            detach(a.ramp('scale', FALL_GRADE.scale, (step.endMs - step.atMs) * k));
          }
          break;
        case 'dissolve':
          detach(a?.dissolveTo(1, (step.endMs - step.atMs) * k, PYREFLY_GREEN));
          break;
        case 'girl-lies': {
          if (squashed) detach(a?.ramp?.('scale', 1 / FALL_GRADE.scale, 1)); // the squash was a share of the size the ramp began with: give it back
          await ctx.stage.setArt(girl, `${girl}-${event.to}`);
          const lying = ctx.stage.actor(girl);
          lying?.setDissolve(0);
          lying?.setAlpha(1);
          lying?.setPose('ko', { immediate: true });
          downWithoutKoPainting(lying); // the swap would otherwise stand her up (G6)
          dropForm(ctx, rt);
          if (form) void idsBack(ctx.stage, form.parked, FADE_OTHERS_MS * k);
          break;
        }
        default:
          break;
      }
    });
    if (!ran) return;
  } catch (err) {
    console.warn('[presenter] the Special fall failed; the party takes the field', err);
  }
  if (rt.host.isAborted) return;
  dropForm(ctx, rt);
  rt.hold.release(mode(), () => rt.host.syncFullHud()); // the rows go back to the three girls
  rt.hold.chip(false, mode());
}
