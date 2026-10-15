/**
 * The engine's hit seen the way the counter kernel reads it (re-parity RC9 lane FFX-G slice G-c; **FFX only**).
 *
 * `kernel/counter.ts` works on the game's own words: the command record's target word and damage words, the target's auto-ability word (`Chr+0x6bc`), the
 * attacker's reaction byte (`Chr+0xdf1`). This module builds those from what the engine keeps: the ability and its record (`adapt/command.ts#resolveCommand`,
 * the target type `adapt/target-world.ts#chainCommand`), the equipment auto-abilities, and whether the attacker is running a reaction (`FFXRuntime.inReaction`, or a
 * counter ability of ours). It is the one place that says which combatants can hold a counter: those with the gear for it. The game gives no monster a bit in
 * `Chr+0x6bc` (the monster branch of the character initialiser zero-fills it; only a script can write it, and none of the project's formations' scripts is known to).
 */

import type { AbilityDef, FFXCombatant } from '../../common/types.ts';
import { hasAuto } from '../equipment.ts';
import {
  AUTO_COUNTERATTACK,
  AUTO_EVADE_AND_COUNTER,
  AUTO_MAGIC_COUNTER,
  type CounterKindInput,
  armsCounter,
  counterKind,
  isHarmful,
} from '../kernel/counter.ts';
import type { HitOutcome } from '../kernel/hittypes.ts';
import type { Ctx } from '../state.ts';
import { hasFlag } from '../state.ts';
import { actorNumber } from '../ai/script-random.ts';
import { chainCommand } from './target-world.ts';
import { resolveCommand } from './command.ts';

/** The counter bits of a combatant's `Chr+0x6bc`: 0x08 Counterattack, 0x10 Evade and Counter, 0x20 Magic Counter (a monster has none; an aeon's fixed gear has none). */
export function counterWord(c: FFXCombatant): number {
  let word = 0;
  if (hasAuto(c, 'counterattack')) word |= AUTO_COUNTERATTACK;
  if (hasAuto(c, 'evade-and-counter')) word |= AUTO_EVADE_AND_COUNTER;
  if (hasAuto(c, 'magic-counter')) word |= AUTO_MAGIC_COUNTER;
  return word;
}

/**
 * Is the attacker itself running a reaction? The game's `Chr+0xdf1` is the kind byte of the action a character executes: 1 for every queued reaction (a counter, an
 * Auto-item, a boss script's queued command), 0 for a turn. The engine runs all of those inside `afterAction` with `FFXRuntime.inReaction` up; a counter ability of
 * ours (`is-counter`, `ResolveOptions.isCounter`) is a reaction wherever it is called from.
 */
export function attackerInReaction(ctx: Pick<Ctx, 'rt'>, def: AbilityDef, isCounterOption: boolean): boolean {
  return isCounterOption || hasFlag(def, 'is-counter') || ctx.rt.inReaction === true;
}

/** The counter kind (0, 1 or 2) a hit of `def` by `user` meets on `target`. */
export function kindFor(ctx: Ctx, user: FFXCombatant, def: AbilityDef, target: FFXCombatant, inReaction: boolean): number {
  return counterKind(kindInput(ctx, user, def, target, inReaction));
}

function kindInput(ctx: Ctx, user: FFXCombatant, def: AbilityDef, target: FFXCombatant, inReaction: boolean): CounterKindInput {
  return {
    b1a: chainCommand(user, def, 1, false).b1a,
    b20: resolveCommand(def, user).record.flagsDamage & 0xff,
    auto: counterWord(target),
    attackerKind: inReaction ? 1 : 0,
    attackerId: actorNumber(ctx, user),
    targetId: actorNumber(ctx, target),
    switchOn: 1, // 0 only in the eleven Belgemine duel scenes, none of which is a chapter of the project (FFX-G04 section 5.5)
  };
}

/** Is the command harmful (`kernel/counter.ts#isHarmful`), from its record: the game's, or the one derived from the ability's flags. */
export function harmfulFor(user: FFXCombatant, def: AbilityDef): boolean {
  const record = resolveCommand(def, user).record;
  return isHarmful({
    b20: record.flagsDamage & 0xff,
    damageClass: record.damageClass,
    chances: record.chances ?? [],
    durations: record.durations ?? [],
    extra: record.extra ?? 0,
  });
}

/**
 * Does this hit arm the target's counter? Every outcome but "no effect" does (a hit, a miss, a forced miss and a Nul-nullified hit), when the kind is not 0 and the
 * command is harmful. Returns the cause the engine reports for the answer (Counterattack and Evade and Counter answer a physical command, Magic Counter a magical
 * one), or `undefined` when the hit arms nothing.
 */
export function armedCause(ctx: Ctx, user: FFXCombatant, def: AbilityDef, target: FFXCombatant, outcome: HitOutcome, inReaction: boolean): 'counterattack' | 'magic-counter' | undefined {
  if (counterWord(target) === 0) return undefined; // nobody wears a counter: the common case costs three lookups
  const input = kindInput(ctx, user, def, target, inReaction);
  if (!armsCounter(counterKind(input), harmfulFor(user, def), outcome === 'noEffect')) return undefined;
  return (input.b20 & 3) === 2 ? 'magic-counter' : 'counterattack';
}
