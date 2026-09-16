/**
 * Mid-battle story triggers.
 *
 * The engine evaluates every {@link MidBattleTrigger} after each resolved
 * action and emits `script-trigger` when one fires. The presenter pauses
 * playback, runs the referenced script, then resumes; `once: true` disarms the
 * trigger and the engine tracks fired ids in `state().firedTriggerIds`
 * [docs/CONTRACTS.md].
 */

import type { BattleEvent, MidBattleTrigger } from '../common/types.ts';
import { type Ctx, tryActor } from './state.ts';

/** What happened during the action just resolved. */
export interface TriggerSignals {
  abilityUses: Array<{ who: string; ability: string }>;
  statusApplied: Array<{ who: string; status: string }>;
  kos: string[];
  formChanges: Array<{ who: string; form: number }>;
  chargesStarted: string[];
  overdriveFull: string[];
}

/** Read the signals out of the events an action produced. */
export function collectSignals(events: readonly BattleEvent[]): TriggerSignals {
  const signals: TriggerSignals = {
    abilityUses: [],
    statusApplied: [],
    kos: [],
    formChanges: [],
    chargesStarted: [],
    overdriveFull: [],
  };
  for (const e of events) {
    switch (e.type) {
      case 'action-start':
        if (e.abilityId) signals.abilityUses.push({ who: e.actorId, ability: e.abilityId });
        break;
      case 'status-add':
        signals.statusApplied.push({ who: e.targetId, status: e.status });
        if (e.status === 'eject') signals.kos.push(e.targetId);
        break;
      case 'ko':
        signals.kos.push(e.targetId);
        break;
      case 'part-destroyed':
        signals.kos.push(e.partId);
        break;
      case 'form-change':
        signals.formChanges.push({ who: e.enemyId, form: e.formIndex });
        break;
      case 'charge':
        signals.chargesStarted.push(e.enemyId);
        break;
      case 'overdrive-gauge':
        if (e.to >= 100) signals.overdriveFull.push(e.who);
        break;
      default:
        break;
    }
  }
  return signals;
}

function matches(ctx: Ctx, trigger: MidBattleTrigger, signals: TriggerSignals): boolean {
  const when = trigger.when;
  switch (when.type) {
    case 'hp-below': {
      const c = tryActor(ctx, when.who);
      return c !== undefined && c.hp <= Math.floor(c.stats.maxHp * when.fraction);
    }
    case 'form-change':
      return signals.formChanges.some((f) => f.who === when.who && f.form === when.form);
    case 'status-applied':
      return signals.statusApplied.some((s) => s.who === when.who && s.status === when.status);
    case 'turn':
      return ctx.state.turn >= when.n;
    case 'ability-used':
      return signals.abilityUses.some((a) => a.who === when.who && a.ability === when.ability);
    case 'ko':
      return signals.kos.includes(when.who);
    case 'overdrive':
      return signals.overdriveFull.includes(when.who);
    case 'charge-started':
      return when.who === undefined ? signals.chargesStarted.length > 0 : signals.chargesStarted.includes(when.who);
    default:
      return false;
  }
}

/**
 * Fire any trigger whose condition is now true. Emits `script-trigger` for each
 * and records `once` triggers as fired.
 */
export function evaluateTriggers(ctx: Ctx, signals: TriggerSignals): void {
  for (const trigger of ctx.state.triggers) {
    if (ctx.state.firedTriggerIds.includes(trigger.id)) continue;
    if (!matches(ctx, trigger, signals)) continue;
    if (trigger.once) ctx.state.firedTriggerIds.push(trigger.id);
    ctx.emit({ type: 'script-trigger', name: trigger.id, payload: { script: trigger.script } });
  }
}
