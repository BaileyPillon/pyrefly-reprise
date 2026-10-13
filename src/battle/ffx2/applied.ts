/**
 * What the game's result applier does after a result has been applied to a character (re-parity X2-D; **FFX-2 only**).
 *
 * `pp_result_apply` (exe 0x006428e0, note FFX2-G04 sections 3.3 and 3.6) runs, for every applied result and in this order: the SOS
 * check (the automatic-status layer follows the HP state), the reaction request into the target's script, and the counter check.
 * The engine's strike calls this once per result: each strike that lands, one for a command that misses or has no effect, a Scan,
 * a drain's transfer to the drainer. A Poison or Regen payout is a result the engine builds itself and reaches the SOS check only
 * (`status-clock.ts`); whether a payout can set off a counter is not in the notes.
 *
 * The counter is the target's own Attack aimed at the source, queued as a system action: the engine plays it once the action that set
 * it off has finished (`engineHooks.ts#runPartyCounters`). Nothing here draws a random number.
 */

import type { AbilityDef } from '../common/types.ts';
import type { Ffx2Unit } from './internal.ts';
import type { ResolveContext } from './resolve-hp.ts';
import type { ResolvedCommand } from './adapt/command.ts';
import { CLASS_ATB, CLASS_HP, CLASS_MP, type DamageResult } from './kernel/pipeline-types.ts';
import { has, statusWord1 } from './adapt/words.ts';
import { JOB_OF_DRESSPHERE } from './adapt/auto-rows.ts';
import { checkAutoLayer } from './auto-layer.ts';
import { COUNTER_AFTER_MISS } from './constants.ts';
import { ACTION_KIND_NORMAL, COUNTER_WORD0, counterCheck } from './kernel/counter-check.ts';
import { jobGrowth } from './kernel/dressphere-growth.ts';

/** The kind byte of a system action (`Chr+0x15c1`), which a counter is. */
const ACTION_KIND_SYSTEM = 2;

/** One applied result, as the strike knows it. */
export interface AppliedResult {
  target: Ffx2Unit;
  source: Ffx2Unit;
  ability: AbilityDef;
  /** Kernel slots of the two (0 to 30), the numbers the game's checks compare. */
  targetSlot: number;
  sourceSlot: number;
  /** The command row's target flags (`Cmd+0x10`) and damage flags (`Cmd+0x1c`). */
  flagsTarget: number;
  flagsDamage: number;
  /** An HP, MP or ATB amount above 0 landed in a class the result names (the applier's flag). */
  landed: boolean;
  /** The result is a miss (the hit determination said Miss). */
  missed: boolean;
  /** The action is itself a counter or a script's system action. */
  system: boolean;
}

/** The target's Attack command (`Chr+0x656`): her dressphere's. 0 for a unit with no dressphere in the table. */
function attackCommandOf(unit: Ffx2Unit): number {
  const job = JOB_OF_DRESSPHERE[unit.dresspheres?.current ?? ''];
  return job === undefined ? 0 : (jobGrowth(job)?.attackCommand ?? 0);
}

/** Does the counter check say this result sets off a counter, and which one? Queues it on the engine's list when it does. */
function counterOf(ctx: ResolveContext, r: AppliedResult): void {
  const hooks = ctx.counters;
  const layer = r.target.autoLayer;
  if (hooks === undefined || layer === undefined) return;
  if ((layer.words[0] & (COUNTER_WORD0.COUNTERATTACK | COUNTER_WORD0.EVADE_AND_COUNTER | COUNTER_WORD0.MAGIC_COUNTER)) === 0) return;
  if (!r.target.alive || r.target.removed) return; // the knock-out routine drops her queue
  if (r.missed && !COUNTER_AFTER_MISS) return;
  const queued = counterCheck(
    {
      id: r.targetSlot,
      word0: layer.words[0],
      attackCommand: attackCommandOf(r.target),
      status1: statusWord1(r.target),
      rootStatus1: statusWord1(r.target), // a girl is her own root; the Special pods' redirection is not modelled
      rootStop: has(r.target, 'stop') ? 1 : 0,
      hitKind: r.system ? ACTION_KIND_SYSTEM : ACTION_KIND_NORMAL,
      pendingSystem: hooks.pending(r.target),
    },
    r.sourceSlot,
    { flagsTarget: r.flagsTarget, flagsDamage: r.flagsDamage },
    r.landed,
  );
  if (queued === null) return;
  const physical = (r.flagsDamage & 3) === 1;
  hooks.queue(r.target, r.source, physical ? ((layer.words[0] & COUNTER_WORD0.COUNTERATTACK) !== 0 ? 'counterattack' : 'evade-and-counter') : 'magic-counter');
}

/** A result has been applied to `r.target`: the SOS check, the target's script, then the counter check. */
export function afterApplied(ctx: ResolveContext, r: AppliedResult): void {
  checkAutoLayer(ctx, r.target);
  ctx.onResult?.(r.target, r.source, r.ability);
  counterOf(ctx, r);
}

/**
 * The applier's "damage landed" flag for the numbers a strike settled: an HP, MP or ATB amount above 0 in a class the result names
 * (a heal is a negative HP number and never lands; an HP class that was nullified for immunity does not either).
 */
export function landedOf(settled: Pick<DamageResult, 'flags' | 'hp' | 'mp' | 'atb'>, hpImmune: boolean): boolean {
  return (
    ((settled.flags & CLASS_HP) !== 0 && settled.hp > 0 && !hpImmune) ||
    ((settled.flags & CLASS_MP) !== 0 && settled.mp > 0) ||
    ((settled.flags & CLASS_ATB) !== 0 && settled.atb > 0)
  );
}

/** The strike's report of one applied result, with the command row's flags read off the resolved command. */
export function reportApplied(
  ctx: ResolveContext,
  ids: ReadonlyMap<Ffx2Unit, number>,
  who: { target: Ffx2Unit; source: Ffx2Unit; ability: AbilityDef },
  command: ResolvedCommand,
  how: { landed: boolean; missed: boolean; system: boolean },
): void {
  afterApplied(ctx, {
    ...who,
    targetSlot: ids.get(who.target) ?? 0,
    sourceSlot: ids.get(who.source) ?? 0,
    flagsTarget: command.record.flagsTarget,
    flagsDamage: command.pipeline.flagsDamage,
    ...how,
  });
}

/** A drain's transfer is a result of its own, delivered to the drainer (the source is the drainer): the SOS check and its script, never a counter. */
export function afterAppliedToSelf(ctx: ResolveContext, unit: Ffx2Unit, ability: AbilityDef): void {
  checkAutoLayer(ctx, unit);
  ctx.onResult?.(unit, unit, ability);
}
