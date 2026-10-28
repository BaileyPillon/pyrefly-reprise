// The two settles the presenter asks for around the first decision and before a command menu (moved out of BattlePresenterBeats.ts at the r63 integration to keep that file under 400 lines; both games).
import { MOMENT_TIMING } from './BattleMoments.ts';
import type { EventCtx } from './BattlePresenterEvents.ts';

export { menuStance } from './motion/StanceSwap.ts'; // fluidity pass (MF-05): the command menu's ready stance (moved here so the presenter, already over 400 lines, grows by no import line)

/**
 * The opening's end, before the first decision is asked for (so before any command menu can open): CHAPTER FRAMING's first plan has landed on the figures, or been given up after a
 * bounded wait (`fx/mix/openingGate.ts`; both games). The plan is put on screen only while no menu is open, so a menu that opened first used to hold it back until the first confirm and
 * then re-size a boss on screen (Chapter IV, Bahamut 420 to 629 px). The battle-start card already waited for it (`BattleStartBanner` `until`); this covers the opening that has no card
 * left (hurried, skipped). A plan that landed after the opening's last camera move leaves the resting camera on the old rig, so the camera moves onto the master here, with the opening's
 * own motion (a cut under REDUCE MOTION), before anything is offered. The engine does not tick before its first decision, so FFX's CTB and FFX-2's Active and Wait clocks are not touched.
 * Nothing waits at `'skip'` speed (an automated run).
 */
export async function settleOpening(ctx: EventCtx): Promise<void> {
  if (ctx.speed() === 'skip') return;
  await ctx.stage.planSettled?.();
  const idle = ctx.moments.pick('idle');
  if (idle && ctx.stage.planArrivalOwed?.()) await ctx.moments.moveToRig(idle, MOMENT_TIMING.returnOut);
}

/**
 * Before a command menu opens: if the shot is anywhere but `idle`, bring it
 * back (and let go of any held push) so the player chooses with the whole
 * field in frame.
 *
 * PR-0094: at the seam into chapter 5's link 5, `shuyin-appears` ends on
 * `camera('action')`, and Shuyin's first turn raises the Terror of Zanarkand
 * telegraph (held zoom on the `enemy` rig) and starts its cast; FFX-2's ATB
 * then opens Yuna's menu mid-cast, so the menu sat on a Shuyin close-up with
 * Yuna and Rikku off-frame and Paine cut at the edge. The telegraph's vignette
 * and the HUD's banner stay up; only the framing returns. Presenter plumbing,
 * so **both games** (CHK-020); FFX's CTB rarely opens a menu off `idle`, since
 * every action's close already returns there.
 */
export async function settleForMenu(ctx: EventCtx): Promise<void> {
  const idle = ctx.moments.pick('idle');
  if (!idle || ctx.stage.camera.rigName === idle) return;
  const ms = MOMENT_TIMING.returnOut;
  await Promise.all([ctx.stage.camera.release?.(ctx.moments.ms(ms)), ctx.moments.moveToRig(idle, ms)]);
}
