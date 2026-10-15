/**
 * **What a Lancet teaches** (Kimahri's Ronso Rage; **FFX only** [AGENTS.md rule 14]).
 *
 * In the game a Lancet that lands on a monster teaches Kimahri the Ronso Rage the monster's record names (`ronso_rage_id`, monster record bytes 134-135) when he does not know it
 * yet, and **learning one fills his Overdrive gauge** ("If Kimahri learns a new Overdrive using Lancet, his Overdrive meter automatically fills", FF Wiki *Overdrive (Final Fantasy
 * X)*, `[single source]`, quoted by `research/ffx-seymour-flux.md` §7.9.2 and Chapter I's preset). A monster's script may write that byte during the battle: Biran's and Yenke's
 * records carry 0 and their scripts decide what each Lancet teaches (`research/ffx-biran-yenke.md` §2.1, §4.5).
 *
 * This engine keeps no Ronso Rage byte on a record. A monster that teaches registers a **teacher** under its `aiScriptId`: a function that answers, at the moment the Lancet lands,
 * which Rage the byte names now (or null). Lancet's own data carries `extra.learnsRonsoRage` (`data/ffx/abilities/special-utility.ts`), and the per-hit extras dispatcher
 * (`./scripted.ts#runScriptedExtra`) calls {@link learnRonsoRage}. **Inert for every other fight:** only the Ronso duel's scripts register a teacher, so a Lancet anywhere else
 * drains as before and emits nothing new (the FFX engine goldens do not move).
 *
 * The Rage joins the live Overdrive list (`FFXCombatant.overdrive.unlockedOverdriveIds`), which the command menu and the Rage picker read afresh at every decision; it lasts for
 * the battle (a hidden chapter writes nothing to the save; a chain's later link would carry only the gauge).
 */

import type { FFXCombatant } from '../common/types.ts';
import type { Ctx } from './state.ts';
import { scriptIdOf } from './ai/hooks.ts';
import { setGauge } from './overdrive.ts';

/** Which Rage this monster teaches now, given who is learning; null when it teaches nothing. */
export type RageTeacher = (ctx: Ctx, self: FFXCombatant, learner: FFXCombatant) => string | null;

const TEACHERS = new Map<string, RageTeacher>();

/** Register a monster script's teacher (its module does, at load, beside its turn script). */
export function registerRageTeacher(scriptId: string, teacher: RageTeacher): void {
  TEACHERS.set(scriptId, teacher);
}

/** Every script id with a teacher, in registration order (the tests read it). */
export function registeredRageTeacherIds(): string[] {
  return [...TEACHERS.keys()];
}

/** The display name of a Rage, from the content registry, or its id. */
function rageName(ctx: Ctx, id: string): string {
  return ctx.content.ability(id)?.name ?? id;
}

/**
 * A Lancet by `user` has landed on `target`: teach the Rage the target's teacher names, if `user` does not know it yet. The Rage joins the live list, the gauge fills (the rule
 * above; nothing happens to it when the Rage is already known) and the battle says so (`message`, system kind, as "Stole ..." does).
 */
export function learnRonsoRage(ctx: Ctx, user: FFXCombatant, target: FFXCombatant): void {
  if (target.side !== 'enemy' || user.side === 'enemy') return;
  const od = user.overdrive;
  if (!od) return;
  const scriptId = scriptIdOf(target);
  const teacher = scriptId === undefined ? undefined : TEACHERS.get(scriptId);
  if (!teacher) return;
  const rage = teacher(ctx, target, user);
  if (rage === null || od.unlockedOverdriveIds.includes(rage)) return;
  if (ctx.content.ability(rage) === undefined) return;
  od.unlockedOverdriveIds.push(rage);
  ctx.emit({ type: 'message', text: `${user.name} learned ${rageName(ctx, rage)}!`, kind: 'system' });
  setGauge(ctx, user, 100, 'ronso-rage-learned');
}
