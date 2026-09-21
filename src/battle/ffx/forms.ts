/**
 * Multi-form bosses.
 *
 * A form change is **not** a new combatant: one monster record serves every
 * form and the battle script overwrites HP and the changed stats
 * [ffx-yunalesca §0, ffx-bfa-yu-yevon §1.6]. Yunalesca is 24 000 / 48 000 /
 * 60 000 out of one 132 000 pool; Braska's Final Aeon goes 60 000 -> a fresh
 * 120 000 with Strength 45 -> 50.
 */

import type { FFXCombatant } from '../common/types.ts';
import { type Ctx, rtOf } from './state.ts';
import { normalise } from './turnQueue.ts';

/**
 * Advance to the next form, if there is one. Returns true when the combatant
 * transformed rather than dying.
 *
 * `overflowCarries` defaults to **false**: each transition re-assigns `maxHp`
 * and `hp` to the stored figure wholesale, so damage past the form's remaining
 * HP is discarded [ffx-yunalesca §14.3].
 */
export function advanceForm(ctx: Ctx, enemy: FFXCombatant): boolean {
  const fields = enemy.enemy;
  if (!fields) return false;
  const nextIndex = fields.formIndex + 1;
  const form = fields.forms[nextIndex];
  if (!form) return false;

  fields.formIndex = nextIndex;
  enemy.name = form.name;
  enemy.spriteKey = form.spriteKey;
  enemy.stats.maxHp = form.hp;
  enemy.hp = form.hp;
  if (form.statOverrides) Object.assign(enemy.stats, form.statOverrides);
  enemy.alive = true;
  enemy.removed = false;
  delete enemy.statuses['ko'];

  // CTB surgery: the boss acts next unconditionally and every active party
  // member is pushed back one tick, so nobody acts between the transformation
  // and its entry action [ffx-yunalesca §1.3 step A].
  rtOf(ctx, enemy.id).ctb = 0;
  for (const id of ctx.state.activeIds) rtOf(ctx, id).ctb += 1;
  normalise(ctx);

  // Both cycle counters reset on a transition.
  const mem = rtOf(ctx, enemy.id).ai;
  mem['priv0004'] = 0;
  mem['priv0008'] = 0;
  mem['priv002C'] = nextIndex;

  const event: Parameters<Ctx['emit']>[0] = {
    type: 'form-change',
    enemyId: enemy.id,
    formIndex: nextIndex,
    name: form.name,
    spriteKey: form.spriteKey,
  };
  ctx.emit(event);
  return true;
}

/**
 * Put an enemy that started **off the field** onto it, mid-battle.
 *
 * The one case: Seymour summons Anima at half his bar, and she joins a battle
 * that is already running [ffx-seymour-anima-macalania §5.2, §5.3]. Nothing in
 * the engine could do that before — `setup.ts#enemyToCombatant` is the only
 * place `state.enemyIds` is ever written, so an enemy either started on the
 * field or never appeared.
 *
 * Almost everything this needs was already here. `predicates.ts#onField` and
 * `#targetable` honour `removed` and `flags.hidden`; `turnQueue.ts#letterTags`
 * is explicitly written for "an enemy that joins mid-battle"; and
 * `engine.ts#checkEnd` tests `isAlive`, which requires `onField`, so an
 * off-field arrival never blocks victory and never grants a false one. All that
 * was missing is the six lines below.
 *
 * The CTB surgery is `advanceForm`'s: the arrival takes the next turn.
 *
 * **Presenter note.** This emits `part-restored`, the only shipped event that
 * means "a combatant that was off the field is on it, with this much HP". Its
 * handler in `BattlePresenterEvents.ts` fades in an actor the stage already
 * holds — see `docs/handoff/chapter-macalania-engine.md` for the one presenter
 * change the arrival still needs.
 */
export function revealEnemy(ctx: Ctx, enemy: FFXCombatant, slot?: number): void {
  enemy.removed = false;
  enemy.flags.hidden = false;
  if (slot !== undefined) enemy.slot = slot;
  enemy.alive = enemy.hp > 0;
  delete enemy.statuses['ko'];

  rtOf(ctx, enemy.id).ctb = 0;
  normalise(ctx);

  const event: Parameters<Ctx['emit']>[0] = { type: 'part-restored', partId: enemy.id, hp: enemy.hp };
  if (enemy.flags.partOf !== undefined) event.ownerId = enemy.flags.partOf;
  ctx.emit(event);
}

/** True when this combatant still has a form left to enter. */
export function hasNextForm(enemy: FFXCombatant): boolean {
  const fields = enemy.enemy;
  if (!fields) return false;
  return fields.forms[fields.formIndex + 1] !== undefined;
}
